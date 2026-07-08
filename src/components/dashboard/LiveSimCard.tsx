"use client";

import { Fragment, useRef, useEffect } from "react";
import { SimulationTurn } from "@/lib/audit/types";
import type { CategoryMeta } from "@/hooks/useLiveAudit";
import { renderMarkdown } from "@/lib/markdown";
/**
 * The dedicated transcript card for a live red-team simulation. Lives on
 * the RIGHT column of `<LiveAuditView/>` — the `.ard-vuln-detail-panel`
 * slot in the same `ard-page-container` flexbox that hosts the audit
 * detail page's split. Mirrors the visual rhythm of `<VulnDetailCard/>`:
 * surface-3 + radius-lg + padding 1.5rem + column gap 1.25rem.
 *
 * Content renders as a chat-bubble timeline (the live audit idiom before
 * the vertical-section rewrite): each turn emits an ATTACKER bubble
 * (left-aligned, red theme) followed by an AGENT bubble (right-aligned,
 * green theme) with a compromised-pill when the agent yielded to the
 * attack. Between turns, an inline divider shows the target vuln title
 * and turn number so users can scan the conversation chronologically.
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
      // round per pair of bubbles. Pairs share a turn number + target
      // vuln title on a divider above them, like the chat timeline
      // before the vertical-section rewrite.
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
            // (no nested wrapper block). Divider + 2 chat rows — the
            // classic chat timeline: attacker bubble left, agent bubble
            // right. Turn number + target vuln title sit on the divider
            // so the conversation is scannable chronologically.
            <Fragment key={idx}>
              {pair.vulnTitle && (
                <div className="sim-turn-divider">
                  <span className="sim-turn-num">Turn {pair.turnNumber}</span>
                  <span className="sim-turn-target-title">{pair.vulnTitle}</span>
                </div>
              )}
              {pair.attackerText && (
                <div className="ar-chat-row ar-chat-row--attacker">
                  <div className="ar-chat-bubble ar-chat-bubble--attacker">
                    <span className="ar-chat-sender">Attacker</span>
                    <div className="ar-chat-text">{renderMarkdown(pair.attackerText)}</div>
                  </div>
                </div>
              )}
              {pair.agentText && (
                <div className="ar-chat-row ar-chat-row--agent">
                  <div className="ar-chat-bubble ar-chat-bubble--agent">
                    <span className="ar-chat-sender">Agent</span>
                    {pair.compromised && (
                      <span className="ar-chat-compromised">⚠ Compromised</span>
                    )}
                    <div className="ar-chat-text">{renderMarkdown(pair.agentText)}</div>
                  </div>
                </div>
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
