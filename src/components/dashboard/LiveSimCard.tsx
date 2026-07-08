"use client";

import { Fragment, useRef, useEffect } from "react";
import { SimulationTurn } from "@/lib/audit/types";
import type { CategoryMeta } from "@/hooks/useLiveAudit";

// ─── LiveSimCard — RIGHT COLUMN on the dashboard ─────────────────────────────
/**
 * The dedicated transcript card for a live red-team simulation. Lives on
 * the RIGHT column of `<LiveAuditView/>` — the `.ard-vuln-detail-panel`
 * slot in the same `ard-page-container` flexbox that hosts the audit
 * detail page's split. Mirrors the visual rhythm of `<VulnDetailCard/>`:
 * surface-3 + radius-lg + padding 1.5rem + column gap 1.25rem.
 *
 * Content adapts VulnDetailCard's 9-section idiom to a live conversation:
 * per turn, ATTACKER PROMPT + AGENT RESPONSE in monospace, plus a
 * per-category EVAL footer at the bottom when the category finishes.
 *
 * We render `.sim-live-card` directly inside the parent
 * `.ard-vuln-detail-panel`. The parent already supplies
 * `position:sticky` + `overflow-y:auto`, so the dashboard page handles
 * long turns naturally without nesting our own scroll wrapper. Only
 * auto-scroll-when-near-bottom logic remains here, attached to the
 * .sim-live-card itself.
 */
export function LiveSimCard({
  sessions,
  categoryMeta,
  selectedCategory,
}: {
  sessions: Map<string, SimulationTurn[]>;
  categoryMeta: Map<string, CategoryMeta>;
  selectedCategory: string | null;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll only when user is near bottom; pauses if user scrolls up
  // to inspect older turns.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [sessions, selectedCategory]);

  let body: React.ReactNode;
  if (selectedCategory === null) {
    body = (
      <div className="sim-empty-hint">
        <p>Pilih kategori di kiri untuk lihat transkrip red-team.</p>
      </div>
    );
  } else {
    const turns = sessions.get(selectedCategory) ?? [];
    const meta  = categoryMeta.get(selectedCategory);
    if (turns.length === 0) {
      body = (
        <div className="sim-empty-hint">
          <p>{meta?.label ?? selectedCategory} belum ada turn.</p>
        </div>
      );
    } else {
      // Group turns into pairs (attacker → agent) — one conversational
      // round per section, like VulnDetailCard's 9-section document but
      // trimmed to the live flow (attacker prompt + agent response +
      // per-category eval footer).
      const pairs: Array<{
        turnNumber: number;
        vulnTitle: string | null;
        attackerText: string | null;
        agentText: string | null;
        compromised: boolean;
      }> = [];
      for (let i = 0; i < turns.length; i += 2) {
        const atk = turns[i];
        const ag  = turns[i + 1];
        pairs.push({
          turnNumber: Math.floor(i / 2) + 1,
          vulnTitle: atk?.target_vuln_title ?? null,
          attackerText: atk?.text ?? null,
          agentText: ag?.text ?? null,
          compromised: Boolean(ag?.compromised),
        });
      }
      body = (
        <>
          <div className="sim-transcript-header">
            <span className="sim-transcript-cat">{selectedCategory}</span>
            <span className="sim-transcript-label">{meta?.label ?? ""}</span>
          </div>
          {pairs.map((pair, idx) => (
            // Each turn is a logical sequence inside the .sim-live-card
            // (no nested wrapper block). Divider + 2 sections — VulnDetailCard's
            // 9-section document, adapted to live turns.
            <Fragment key={idx}>
              {pair.vulnTitle && (
                <div className="sim-turn-divider">
                  <span className="sim-turn-num">Turn {pair.turnNumber}</span>
                  <span className="sim-turn-target-title">{pair.vulnTitle}</span>
                </div>
              )}
              {pair.attackerText && (
                <section className="sim-section">
                  <div className="sim-section-label sim-section-label--attacker">🎯 Attacker Prompt</div>
                  <div className="sim-section-body">{pair.attackerText}</div>
                </section>
              )}
              {pair.agentText && (
                <section
                  className={`sim-section sim-section--agent${
                    pair.compromised ? " sim-section--compromised" : ""
                  }`}
                >
                  <div className="sim-section-label sim-section-label--agent">
                    🤖 Agent Response
                    {pair.compromised && (
                      <span className="sim-section-warning">⚠ Compromised</span>
                    )}
                  </div>
                  <div className="sim-section-body">{pair.agentText}</div>
                </section>
              )}
            </Fragment>
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
        </>
      );
    }
  }

  return (
    <div className="sim-live-card" ref={scrollRef}>{body}</div>
  );
}
