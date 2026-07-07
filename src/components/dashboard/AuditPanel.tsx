"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AuditReport, Vulnerability, SimulationTurn, GuardrailConfig, DetectedAgent } from "@/lib/audit/types";
import { ScoreRing, SeverityBadge } from "@/components/dashboard/AuditComponents";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatusMessage {
  id: string;
  text: string;
  done: boolean;
}

type ActiveTab = "overview" | "vulnerabilities" | "simulation" | "guardrails";

// ─── Audit Runner Component ────────────────────────────────────────────────────
export function AuditRunner({
  agent,
  onAuditComplete,
  onBack,
}: {
  agent: DetectedAgent;
  onAuditComplete: (report: AuditReport) => void;
  onBack?: () => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [staticResult, setStaticResult] = useState<{
    score: number;
    message: string;
    vulnerabilities: Vulnerability[];
  } | null>(null);
  const [phase, setPhase] = useState<"idle" | "static" | "dynamic" | "done">("idle");

  // ── Live simulation: bucketed per OWASP category (parallel pipeline
  // delivers events interleaved across categories; we bucket then render
  // a master-detail split-pane: left = categories list, right = transcript).
  const [sessions, setSessions] = useState<Map<string, SimulationTurn[]>>(() => new Map());
  const [categoryMeta, setCategoryMeta] = useState<Map<string, {
    label: string;
    status: "running" | "done";
    score?: number;
    compromised?: number;
    vulns: number;
  }>>(() => new Map());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const statusEndRef = useRef<HTMLDivElement>(null);
  const panelScrollRef = useRef<HTMLDivElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const addStatus = useCallback((text: string, done = false) => {
    setStatusMessages((prev) => {
      const updated = prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, done: true } : m
      );
      return [
        ...updated,
        { id: `status-${Date.now()}-${Math.random()}`, text, done },
      ];
    });
    setTimeout(() => {
      statusEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const handleRunAudit = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatusMessages([]);
    setSessions(new Map());
    setCategoryMeta(new Map());
    setSelectedCategory(null);
    setStaticResult(null);
    setPhase("static");

    // Abort previous request if any
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/audit/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: agent.name,
          systemPrompt: agent.systemPrompt || "",
          tools: agent.tools ?? [],
          repoUrl: agent.repoUrl,
          filePath: agent.filePath,
          content: agent.content || "",
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Read SSE error body so user sees real reason.
        let errMsg = `HTTP ${response.status}`;
        try {
          const txt = await response.text();
          const match = txt.match(/data:\s*(\{.*\})/);
          if (match) {
            const parsed = JSON.parse(match[1]);
            if (parsed?.message) errMsg = parsed.message;
          }
        } catch {}
        addStatus(`Error: ${errMsg}`);
        setIsRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        addStatus("Error: No response stream");
        setIsRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";
      let currentData = "";
      let localStaticScore: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7);
          } else if (line.startsWith("data: ")) {
            currentData = line.slice(6);
          } else if (line === "" && currentEvent && currentData) {
            // Empty line = event boundary — process
            try {
              const data = JSON.parse(currentData);

              if (currentEvent === "status") {
                const msg = (data as { message: string }).message;
                const isRedTeam =
                  msg.toLowerCase().includes("red-team") ||
                  msg.toLowerCase().includes("attacker");
                if (isRedTeam) setPhase("dynamic");
                addStatus(msg);
              } else if (currentEvent === "static_result") {
                const d = data as { score: number; message: string; vulnerabilities?: Vulnerability[] };
                localStaticScore = d.score;
                const vulns = d.vulnerabilities ?? [];
                setStaticResult({ score: d.score, message: d.message, vulnerabilities: vulns });
                // Seed categoryMeta with vuln counts grouped by category_id so
                // the left list has skeletons for every OWASP category that
                // static analysis flagged before the simulation turns arrive.
                setCategoryMeta((prev) => {
                  const next = new Map(prev);
                  for (const v of vulns) {
                    const cat = v.category_id;
                    const curr = next.get(cat);
                    if (curr) {
                      next.set(cat, {
                        ...curr,
                        label: v.category_name ?? curr.label,
                        vulns: (curr.vulns ?? 0) + 1,
                      });
                    } else {
                      next.set(cat, {
                        label: v.category_name ?? cat,
                        status: "running",
                        vulns: 1,
                      });
                    }
                  }
                  return next;
                });
                addStatus(`✓ ${d.message}`, true);
              } else if (currentEvent === "error") {
                const d = data as { message: string };
                setPhase("done");
                setIsRunning(false);
                addStatus(`Error: ${d.message}`);
              } else if (currentEvent === "chat_turn") {
                const d = data as {
                  sender: "attacker" | "agent";
                  text: string;
                  compromised?: boolean;
                  targetVulnId?: string;
                  targetVulnTitle?: string;
                  sessionCategory?: string;
                };
                const cat = d.sessionCategory ?? "_unknown";
                setSessions((prev) => {
                  const next = new Map(prev);
                  const arr = next.get(cat) ?? [];
                  next.set(cat, [
                    ...arr,
                    {
                      id: `turn-${Date.now()}-${Math.random()}`,
                      sender: d.sender,
                      text: d.text,
                      created_at: new Date().toISOString(),
                      compromised: d.compromised ?? false,
                      target_vuln_id: d.targetVulnId ?? null,
                      target_vuln_title: d.targetVulnTitle ?? null,
                      session_category: cat,
                      turn_number: arr.length + 1,
                    },
                  ]);
                  return next;
                });
                // First chat_turn for a category just landed — set selectedCategory
                // to it so the right pane has content right away. We only assign
                // when curr is null (first event for the whole audit).
                setSelectedCategory((curr) => (curr === null ? cat : curr));
                // Auto-scroll right pane if user is near bottom; pauses if user
                // scrolled up to read older turns.
                setTimeout(() => {
                  const el = panelScrollRef.current;
                  if (el) {
                    const nearBottom =
                      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                    if (nearBottom) {
                      el.scrollTop = el.scrollHeight;
                    }
                  }
                }, 50);
              } else if (currentEvent === "partial_score") {
                const d = data as { category: string; label: string; score: number; compromised: number };
                setCategoryMeta((prev) => {
                  const next = new Map(prev);
                  const curr = next.get(d.category) ?? {
                    label: d.label,
                    status: "running" as const,
                    vulns: 0,
                  };
                  next.set(d.category, {
                    ...curr,
                    label: d.label,
                    status: "done",
                    score: d.score,
                    compromised: d.compromised,
                  });
                  return next;
                });
              } else if (currentEvent === "final_result") {
                const d = data as {
                  reportId?: string;
                  agentName?: string;
                  staticScore?: number;
                  dynamicScore: number;
                  overallScore: number;
                  vulnerabilities: Vulnerability[];
                  simulationLogs: SimulationTurn[];
                  guardrails: GuardrailConfig[];
                };
                setPhase("done");
                setIsRunning(false);
                addStatus("✓ Audit complete — report saved.", true);

                const finalReport: AuditReport = {
                  id: d.reportId || `audit-${Date.now()}`,
                  agentName: agent.name,
                  repoUrl: agent.repoUrl,
                  filePath: agent.filePath,
                  systemPrompt: agent.systemPrompt,
                  toolsJson: JSON.stringify(agent.tools, null, 2),
                  staticScore: localStaticScore ?? d.staticScore ?? 0,
                  dynamicScore: d.dynamicScore,
                  overallScore: d.overallScore,
                  status: "completed",
                  createdAt: new Date().toISOString(),
                  vulnerability_count: d.vulnerabilities?.length ?? 0,
                  compromised_count: d.simulationLogs?.filter((t) => t.compromised).length ?? 0,
                };
                onAuditComplete(finalReport);
              }
            } catch {
              // Malformed SSE data — skip
            }
            currentEvent = "";
            currentData = "";
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        addStatus(`Error: ${err.message}`);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      // If stream ended without final_result, stop loading
      setIsRunning(false);
    }
  }, [agent, addStatus, onAuditComplete]);

  return (
    <div className="audit-runner">
      {/* ── Agent Summary Card ── */}
      <div className="ar-agent-card">
        {/* Back button */}
        {onBack && !isRunning && phase === "idle" && (
          <button className="ar-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to agents
          </button>
        )}

        <div className="ar-agent-meta">
          <div className="ar-agent-meta-left">
            <div className="ar-agent-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <h2 className="ar-agent-name">{agent.name}</h2>
              <code className="ar-agent-path">{agent.filePath}</code>
            </div>
          </div>
          <div className="ar-agent-tools-row">
            {agent.tools.map((t) => (
              <span key={t.name} className="rs-tool-chip">{t.name}</span>
            ))}
          </div>
        </div>

        {/* Run button — only shown before audit starts */}
        {phase === "idle" && (
          <button
            id="btn-run-audit"
            className="ar-run-btn"
            onClick={handleRunAudit}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1L2 3.2v5.5C2 11.8 4.5 14 7.5 14.5c3-.5 5.5-2.7 5.5-5.8V3.2L7.5 1z"
                stroke="currentColor" strokeWidth="1.4" fill="rgba(255,255,255,0.1)"/>
              <path d="M5 7.5l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Run Security Audit
          </button>
        )}
      </div>
      {/* ── Live Progress Panel ── */}
      {(isRunning || phase !== "idle") && (
        <div className="ar-progress-panel animate-fade-in-up">
          {/* Status log */}
          <div className="ar-progress-header">
            <div className="ar-progress-label">
              {isRunning && (
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <span className="streaming-dot" />
                  <span className="streaming-dot" />
                  <span className="streaming-dot" />
                </span>
              )}
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
                {phase === "static" && "Static Analysis"}
                {phase === "dynamic" && "Red Team Simulation"}
                {phase === "done" && "Audit Complete"}
                {phase === "idle" && "Audit Pipeline"}
              </span>
            </div>
            {staticResult && (
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Static score: <strong style={{ color: staticResult.score < 40 ? "#f87171" : "#fbbf24" }}>{staticResult.score}</strong>/100
              </span>
            )}
          </div>

          <div className="ar-status-log">
            {statusMessages.map((msg) => (
              <div key={msg.id} className="ar-status-item animate-fade-in-up">
                <span className={`ar-status-dot ${msg.done ? "ar-status-dot--done" : "ar-status-dot--running"}`} />
                <span style={{ fontSize: "0.8125rem", color: msg.done ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
                  {msg.text}
                </span>
              </div>
            ))}
            <div ref={statusEndRef} />
          </div>

          {/* Chat simulation — master/detail split. left list = OWASP
              categories running in parallel; right pane = transcript for
              selectedCategory. Replaces the old single-thread chat log. */}
          {categoryMeta.size > 0 && (
            <div className="ar-chat-section">
              <p className="ar-chat-label">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke="#f87171" strokeWidth="1" fill="rgba(248,113,113,0.1)" />
                  <path d="M4 6l1.5 1.5L8 4" stroke="#f87171" strokeWidth="1" strokeLinecap="round" />
                </svg>
                Live Red-Team Simulation
                <span className="sim-summary">
                  · {categoryMeta.size} categor{categoryMeta.size === 1 ? "y" : "ies"} ·{" "}
                  {Array.from(categoryMeta.values()).filter((m) => m.status === "done").length} done
                </span>
              </p>
              <div className="sim-split-layout">
                {/* Left: list of categories */}
                <div className="sim-category-list" role="listbox" aria-label="OWASP categories">
                  {Array.from(categoryMeta.entries()).map(([cat, meta]) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`sim-category-list-item${isSelected ? " sim-category-list-item--selected" : ""}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        <div className="sim-cat-row1">
                          <span className="sim-cat-id">{cat}</span>
                          <span className={`sim-cat-status sim-cat-status--${meta.status}`}>
                            {meta.status === "done" ? "✓" : "◐"}
                          </span>
                        </div>
                        <div className="sim-cat-row2">{meta.label}</div>
                        <div className="sim-cat-row3">
                          <span className="sim-cat-vulns">
                            {meta.vulns} vuln{meta.vulns !== 1 ? "s" : ""}
                          </span>
                          {meta.status === "done" && meta.score !== undefined && (
                            <span className="sim-cat-score">
                              Score: <strong>{meta.score}</strong>
                              {meta.compromised != null && meta.compromised > 0 && (
                                <span className="sim-cat-compromised">⚠ {meta.compromised}</span>
                              )}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right: transcript for the selected category */}
                <div className="sim-transcript-panel" ref={panelScrollRef}>
                  {selectedCategory === null ? (
                    <div className="sim-empty-hint">
                      <p>Pilih kategori di kiri untuk lihat transkrip.</p>
                    </div>
                  ) : (() => {
                    const turns = sessions.get(selectedCategory) ?? [];
                    const meta = categoryMeta.get(selectedCategory);
                    if (turns.length === 0) {
                      return (
                        <div className="sim-empty-hint">
                          <p>{meta?.label ?? selectedCategory} belum ada turn.</p>
                        </div>
                      );
                    }
                    // Group turns into pairs (attacker → agent) so we can
                    // show one "turn card" per conversational round.
                    const pairs: Array<{
                      turnNumber: number;
                      vulnTitle: string | null;
                      attackerText: string | null;
                      agentText: string | null;
                      compromised: boolean;
                    }> = [];
                    for (let i = 0; i < turns.length; i += 2) {
                      const atk = turns[i];
                      const ag = turns[i + 1];
                      pairs.push({
                        turnNumber: Math.floor(i / 2) + 1,
                        vulnTitle: atk?.target_vuln_title ?? null,
                        attackerText: atk?.text ?? null,
                        agentText: ag?.text ?? null,
                        compromised: Boolean(ag?.compromised),
                      });
                    }
                    return (
                      <div className="sim-transcript">
                        <div className="sim-transcript-header">
                          <span className="sim-transcript-cat">{selectedCategory}</span>
                          <span className="sim-transcript-label">{meta?.label ?? ""}</span>
                        </div>
                        {pairs.map((pair, idx) => (
                          <div key={idx} className="sim-turn-pair">
                            {pair.vulnTitle && (
                              <div className="sim-turn-target">
                                <span className="sim-turn-num">Turn {pair.turnNumber}</span>
                                <span className="sim-turn-target-title">{pair.vulnTitle}</span>
                              </div>
                            )}
                            {pair.attackerText && (
                              <div className="sim-bubble sim-bubble--attacker">
                                <div className="sim-bubble-sender">🎯 Attacker</div>
                                <p className="sim-bubble-text">{pair.attackerText}</p>
                              </div>
                            )}
                            {pair.agentText && (
                              <div
                                className={`sim-bubble sim-bubble--agent${
                                  pair.compromised ? " sim-bubble--compromised" : ""
                                }`}
                              >
                                <div className="sim-bubble-sender">
                                  🤖 Agent
                                  {pair.compromised && (
                                    <span className="sim-bubble-warning">⚠ COMPROMISED</span>
                                  )}
                                </div>
                                <p className="sim-bubble-text">{pair.agentText}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {meta?.status === "done" && meta.score !== undefined && (
                          <div className="sim-eval-footer">
                            <span className="sim-eval-label">Per-category dynamic score:</span>
                            <strong className="sim-eval-score">{meta.score}/100</strong>
                            {meta.compromised != null && meta.compromised > 0 ? (
                              <span className="sim-eval-compromised">
                                ⚠ {meta.compromised} turn(s) compromised
                              </span>
                            ) : (
                              <span className="sim-eval-clean">no compromise</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// renderVulnDetail → moved to VulnDetailCard.tsx
// AuditResultDetail → moved to AuditResultDetail.tsx
