"use client";

import { DetectedAgent, AuditReport } from "@/lib/audit/types";
import { useLiveAudit } from "@/hooks/useLiveAudit";
import { AuditRunner } from "@/components/dashboard/AuditPanel";
import { LiveSimCard } from "@/components/dashboard/LiveSimCard";

// ─── Live Audit View ─────────────────────────────────────────────────────────
/**
 * Page-level wrapper for the live-audit panel. Same shape as the audit
 * detail page's `ard-page-container`: two columns in a single flexbox,
 * each with a different role.
 *
 *   LEFT  (clamp 420–860px)  →  <AuditRunner>   agent card + status +
 *                                                 OWASP category list
 *   RIGHT (1fr, sticky)      →  <LiveSimCard>   dedicated transcript card,
 *                                                 rendered as the rune of
 *                                                 the audit-detail page's
 *                                                 VulnDetailCard slot.
 *
 * Both components share state via a single `useLiveAudit()` instance here.
 * Lifting the hook above both children is what keeps the LEFT category
 * list and the RIGHT transcript scroll-synchronized without race
 * conditions or duplicate SSE handlers.
 *
 * The dashboard page (`/dashboard`) `panelView === "run-audit"` mounts
 * this component instead of `<AuditRunner/>` directly.
 *
 * The dedicated right column is mounted ONLY when at least one
 * OWASP category landed in `categoryMeta` — i.e. the audit ran at
 * least far enough to publish a `static_result`. Before that the
 * page is single-column (AuditRunner alone), avoiding a stray
 * empty placeholder card that would otherwise dangle beside the
 * idle agent card.
 */
export function LiveAuditView({
  agent,
  onAuditComplete,
  onBack,
  leftBasis = "clamp(420px, 58%, 860px)",
}: {
  agent: DetectedAgent;
  onAuditComplete: (report: AuditReport) => void;
  onBack?: () => void;
  /** Left column flex-basis; tuned so the runner doesn't push the
   *  dedicated right card off-screen on common viewport widths. The
   *  default clamps between 420px (no collapse) and 860px (full audit-
   *  detail width), reserving at least the right column's 320px min. */
  leftBasis?: string;
}) {
  const live = useLiveAudit({ agent, onComplete: onAuditComplete });
  const hasTranscript = live.categoryMeta.size > 0;

  return (
    <div className="ard-page-container">
      {/* LEFT column — flexible basis; can shrink on tight viewports.
          When no transcript has arrived yet, the LEFT column takes
          the full width and the RIGHT column is not in the DOM. */}
      <div
        style={{
          flex: hasTranscript ? `1 1 ${leftBasis}` : "1 1 100%",
          maxWidth: hasTranscript ? leftBasis : "100%",
          width: "100%",
          minWidth: "0",
        }}
      >
        <AuditRunner
          agent={agent}
          onBack={onBack}
          phase={live.phase}
          isRunning={live.isRunning}
          statusMessages={live.statusMessages}
          staticResult={live.staticResult}
          categoryMeta={live.categoryMeta}
          selectedCategory={live.selectedCategory}
          statusEndRef={live.statusEndRef}
          onSelectCategory={live.setSelectedCategory}
          onRunAudit={live.handleRunAudit}
        />
      </div>

      {/* RIGHT column — appears only once at least one OWASP category
          landed. The LiveSimCard renders exactly one `.sim-live-card`
          directly — same dedicated card as VulnDetailCard owns on the
          detail page. No empty-state placeholder, so the column is
          empty before the audit starts instead of holding a stray
          "Run audit to begin" card beside an idle agent. */}
      {hasTranscript && (
        <div
          className="ard-vuln-detail-panel"
          style={{ flex: 1, minWidth: "320px", marginTop: "1.5rem" }}
        >
          <LiveSimCard
            sessions={live.sessions}
            categoryMeta={live.categoryMeta}
            selectedCategory={live.selectedCategory}
          />
        </div>
      )}
    </div>
  );
}
