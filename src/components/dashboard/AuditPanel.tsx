"use client";

import { DetectedAgent } from "@/lib/audit/types";
import {
  UseLiveAuditReturn,
  StatusMessage,
  LivePhase,
  CategoryMeta,
} from "@/hooks/useLiveAudit";

// ─── Audit Runner — LEFT COLUMN on the dashboard ─────────────────────────────
/**
 * Renders the left half of the live-audit page layout — the same place the
 * audit-detail page puts `.ard-vuln-list` (left list of items). Mirrors
 * `.ard-vuln-item` card styling for the OWASP category buttons.
 *
 * This is the controller surface:
 *   - agent card + Run button
 *   - status log (streaming dots / done items)
 *   - left column category list (sidebar of OWASP items)
 *
 * The transcript card lives on the RIGHT COLUMN in a sibling component
 * `<LiveSimCard/>`. State for that card is owned by `useLiveAudit()` and
 * passed in via props here. Both components stay in sync because they
 * receive the same hook result from their parent (`<LiveAuditView/>`).
 */
export function AuditRunner({
  agent,
  onBack,
  phase,
  isRunning,
  statusMessages,
  staticResult,
  categoryMeta,
  selectedCategory,
  statusEndRef,
  onSelectCategory,
  onRunAudit,
  viewReport,
}: {
  agent: DetectedAgent;
  onBack?: () => void;
  phase: LivePhase;
  isRunning: boolean;
  statusMessages: StatusMessage[];
  staticResult: UseLiveAuditReturn["staticResult"];
  categoryMeta: Map<string, CategoryMeta>;
  selectedCategory: string | null;
  statusEndRef: React.RefObject<HTMLDivElement | null>;
  onSelectCategory: (cat: string | null) => void;
  onRunAudit: () => Promise<void>;
  /** Completion CTA handler — wired to the hook's
   * requestViewReport(), which fires onComplete() to navigate the
   * caller. Only called when the user clicks the "View full audit
   * report" button — never auto-fires when the SSE stream finishes. */
  viewReport: () => void;
}) {
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

        {/* Run button — disabled while running, gone after start */}
        {phase === "idle" && (
          <button
            id="btn-run-audit"
            className="ar-run-btn"
            onClick={onRunAudit}
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

      {/* ── Live Progress Panel (status log + category list) ── */}
      {(isRunning || phase !== "idle") && (
        <div className="ar-progress-panel animate-fade-in-up">
          {/* Status log header */}
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

          {/* Status log */}
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

          {/* Category header (master list label) */}
          {categoryMeta.size > 0 && (
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
          )}

          {/* ── Category list ── mirrors `.ard-vuln-item` */}
          {categoryMeta.size > 0 && (
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
                    onClick={() => onSelectCategory(cat)}
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
          )}
        </div>
      )}

      {/* ── Completion CTA ────────────────────────────────────
          Visible only when phase === "done". On click, fires
          viewReport() which routes to the history-detail panel via
          the parent's onAuditComplete callback. We deliberately don't
          auto-redirect when SSE final_result arrives — the user
          keeps the live transcript visible on the right column
          (to scroll through previous turns if needed) until they
          actively decide to view the structured report. */}
      {phase === "done" && (
        <div className="ar-complete-cta animate-fade-in-up">
          <div className="ar-complete-cta-head">
            <span className="ar-complete-cta-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <div>
              <strong>Audit complete</strong>
              <span className="ar-complete-cta-sub">
                Multi-turn red-team simulation finished. Review the live
                transcript on the right, or jump to the structured report
                whenever you're ready.
              </span>
            </div>
          </div>
          <div className="ar-complete-cta-buttons">
            <button
              id="btn-view-report"
              type="button"
              className="ar-view-report-btn"
              onClick={viewReport}
            >
              View full audit report
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {onBack && (
              <button
                type="button"
                className="ar-run-another-btn"
                onClick={onBack}
              >
                Audit another repo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
