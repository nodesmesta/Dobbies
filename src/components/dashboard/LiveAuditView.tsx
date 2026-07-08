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
 *   LEFT  (860px fixed)  →  <AuditRunner>        agent card + status +
 *                                              OWASP category list
 *   RIGHT (1fr, sticky)  →  <LiveSimCard>        dedicated transcript card,
 *                                              rendered as the rune of
 *                                              the audit-detail page's
 *                                              VulnDetailCard slot.
 *
 * Both components share state via a single `useLiveAudit()` instance here.
 * Lifting the hook above both children is what keeps the LEFT category
 * list and the RIGHT transcript scroll-synchronized without race
 * conditions or duplicate SSE handlers.
 *
 * The dashboard page (`/dashboard`) `panelView === "run-audit"` mounts
 * this component instead of `<AuditRunner/>` directly.
 */
export function LiveAuditView({
  agent,
  onAuditComplete,
  onBack,
}: {
  agent: DetectedAgent;
  onAuditComplete: (report: AuditReport) => void;
  onBack?: () => void;
}) {
  const live = useLiveAudit({ agent, onComplete: onAuditComplete });

  return (
    <div className="ard-page-container">
      {/* LEFT column — fixed width mirrors the AuditResultDetail page's
          `.ard-wrapper` slot. The runner fills this column with the
          agent card, status log, and OWASP category list (mirrors
          `.ard-vuln-list`). */}
      <div
        style={{
          flex: "0 0 860px",
          maxWidth: "100%",
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

      {/* RIGHT column — `.ard-vuln-detail-panel` slot. Sticky so the
          transcript stays visible while the dashboard page scrolls.
          The LiveSimCard renders exactly one `.sim-live-card` directly
          — same dedicated card as VulnDetailCard owns on the detail
          page. */}
      <div
        className="ard-vuln-detail-panel"
        style={{ flex: 1, minWidth: "320px", marginTop: "1.5rem" }}
      >
        {live.categoryMeta.size === 0 ? (
          <div className="sim-empty-shell">
            <p>Live transcript card dedicated.</p>
            <p>Jalankan audit untuk mulai.</p>
          </div>
        ) : (
          <LiveSimCard
            sessions={live.sessions}
            categoryMeta={live.categoryMeta}
            selectedCategory={live.selectedCategory}
          />
        )}
      </div>
    </div>
  );
}
