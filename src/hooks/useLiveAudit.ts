"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  AuditReport,
  Vulnerability,
  SimulationTurn,
  GuardrailConfig,
  DetectedAgent,
  OWASP_CATEGORY_IDS,
  OWASP_CATEGORY_LABELS,
  OwaspCategoryId,
} from "@/lib/audit/types";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface StatusMessage {
  id: string;
  text: string;
  done: boolean;
}

export type LivePhase = "idle" | "static" | "dynamic" | "done";

export interface CategoryMeta {
  label: string;
  status: "running" | "done";
  score?: number;
  compromised?: number;
  vulns: number;
}

export interface UseLiveAuditArgs {
  agent: DetectedAgent;
  /** Called once when the SSE stream delivers `final_result`. */
  onComplete?: (report: AuditReport) => void;
}

export interface UseLiveAuditReturn {
  // Lifecycle
  phase: LivePhase;
  isRunning: boolean;
  // Status log (left column)
  statusMessages: StatusMessage[];
  statusEndRef: React.RefObject<HTMLDivElement | null>;
  // Static result (left column header)
  staticResult: { score: number; message: string; vulnerabilities: Vulnerability[] } | null;
  // Live transcript state (driven by parallel-by-category pipeline)
  sessions: Map<string, SimulationTurn[]>;
  categoryMeta: Map<string, CategoryMeta>;
  selectedCategory: string | null;
  // Actions
  handleRunAudit: () => Promise<void>;
  setSelectedCategory: (cat: string | null) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Owns the SSE stream lifecycle + categorized transcript state for a live
 * audit run. Returns everything both `AuditRunner` (left column on the
 * dashboard) and `LiveSimCard` (right column — dedicated to the transcript)
 * need to render. Built to be the single source of truth so the two
 * components stay in sync without prop-drilling through page.tsx.
 *
 * Backed by `/api/audit/stream` which emits:
 *   - status           → { message }
 *   - static_result    → { score, message, vulnerabilities[] }
 *   - chat_turn        → { sender, text, compromised?, targetVulnId?,
 *                          targetVulnTitle?, sessionCategory }
 *   - partial_score    → { category, label, score, compromised }
 *   - final_result     → { reportId, dynamicScore, overallScore, ... }
 *   - error            → { message }
 */
export function useLiveAudit({ agent, onComplete }: UseLiveAuditArgs): UseLiveAuditReturn {
  const [isRunning, setIsRunning]         = useState(false);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [staticResult, setStaticResult]   = useState<UseLiveAuditReturn["staticResult"]>(null);
  const [phase, setPhase]                 = useState<LivePhase>("idle");

  // Live transcript — bucketed per OWASP category because the parallel
  // pipeline delivers events interleaved across categories. We bucket
  // then render a master-detail: left list shows one card per category
  // with status, right card shows the transcript for the selected one.
  const [sessions, setSessions]           = useState<Map<string, SimulationTurn[]>>(() => new Map());
  const [categoryMeta, setCategoryMeta]   = useState<Map<string, CategoryMeta>>(() => new Map());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const abortRef      = useRef<AbortController | null>(null);
  const statusEndRef  = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef<typeof onComplete>(onComplete);

  // Allow latest onComplete without re-creating handleRunAudit on every
  // parent re-render; otherwise our useCallback deps would need it and
  // the listener would race against a stale closure.
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
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
    setTimeout(() => { statusEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 50);
  }, []);

  const handleRunAudit = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatusMessages([]);
    setSessions(new Map());

    // Pre-seed the OWASP category list with all 10 buckets in running
    // state so the user immediately sees the live simulation checklist
    // when an audit starts, regardless of whether the static analyzer
    // produces findings. This matches the docs/landing-page contract
    // that "multi-turn red-team simulation runs for every audit" — the
    // list is visible from the first SSE byte, not gated on
    // static_result. Static findings then increment vuln counts per
    // category; chat_turn events add per-turn data; partial_score flips
    // each bucket to "done" as its session finishes.
    const initialCategories = new Map<string, CategoryMeta>();
    for (const cat of OWASP_CATEGORY_IDS) {
      initialCategories.set(cat, {
        label: OWASP_CATEGORY_LABELS[cat],
        status: "running",
        vulns: 0,
      });
    }
    setCategoryMeta(initialCategories);

    setSelectedCategory(null);
    setStaticResult(null);
    setPhase("static");

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

      const decoder    = new TextDecoder();
      let buffer       = "";
      let currentEvent = "";
      let currentData  = "";
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
                // First chat_turn for the audit just landed — set selectedCategory
                // so the right card has content right away. Only assign when null.
                setSelectedCategory((curr) => (curr === null ? cat : curr));
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
                if (onCompleteRef.current) onCompleteRef.current(finalReport);
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
      if (abortRef.current === controller) abortRef.current = null;
      // If stream ended without final_result, stop loading
      setIsRunning(false);
    }
  }, [agent, addStatus, isRunning]);

  return {
    phase,
    isRunning,
    statusMessages,
    statusEndRef,
    staticResult,
    sessions,
    categoryMeta,
    selectedCategory,
    handleRunAudit,
    setSelectedCategory,
  };
}
