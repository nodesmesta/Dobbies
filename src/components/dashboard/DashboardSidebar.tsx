"use client";

import { AuditReport } from "@/lib/audit/types";
import { AuditHistoryCard } from "@/components/dashboard/AuditComponents";
import NavProfileMenu from "@/components/dashboard/NavProfileMenu";

type NavItem = "overview" | "trend" | "scan-repo" | "history" | "settings";

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  onClose: () => void;
  activeNav: NavItem;
  onNavClick: (nav: NavItem) => void;
  auditHistory: AuditReport[];
  selectedReportId: string | null;
  onSelectReport: (id: string) => void;
  githubConnection: { connected: boolean };
  onGoToSettings: () => void;
}

export default function DashboardSidebar({
  sidebarOpen,
  onClose,
  activeNav,
  onNavClick,
  auditHistory,
  selectedReportId,
  onSelectReport,
  githubConnection,
  onGoToSettings,
}: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="db-sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className="db-sidebar" data-open={sidebarOpen}>
        <div className="db-sidebar-inner">
          <div className="db-nav-group">
            <div className="db-sidebar-section-label">Navigation</div>
            <nav className="db-nav-items" aria-label="Dashboard navigation">
              <button
                id="nav-overview"
                className="db-nav-item"
                data-active={activeNav === "overview"}
                onClick={() => onNavClick("overview")}
              >
                <svg className="db-nav-item-icon" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                  <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <span>Overview</span>
              </button>

              <button
                id="nav-trend"
                className="db-nav-item"
                data-active={activeNav === "trend"}
                onClick={() => onNavClick("trend")}
              >
                <svg className="db-nav-item-icon" viewBox="0 0 16 16" fill="none">
                  <path d="M1 14l4-4 3 3 7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11 6h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Trends</span>
              </button>

              <button
                id="nav-scan-repo"
                className="db-nav-item"
                data-active={activeNav === "scan-repo"}
                onClick={() => onNavClick("scan-repo")}
              >
                <svg className="db-nav-item-icon" viewBox="0 0 16 16" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.22.48-2.68-1.07-2.68-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.82 1.23.82.71 1.22 1.87.87 2.33.66.07-.51.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.42 7.42 0 018 3.87c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z" fill="currentColor"/>
                </svg>
                <span>Scan Repo</span>
                <span className="db-nav-item-badge db-nav-item-badge--green">New</span>
              </button>

              <button
                id="nav-history"
                className="db-nav-item"
                data-active={activeNav === "history"}
                onClick={() => onNavClick("history")}
              >
                <svg className="db-nav-item-icon" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Audit History</span>
                {auditHistory.length > 0 && (
                  <span className="db-nav-item-badge">{auditHistory.length}</span>
                )}
              </button>

              <button
                id="nav-settings"
                className="db-nav-item"
                data-active={activeNav === "settings"}
                onClick={() => onNavClick("settings")}
              >
                <svg className="db-nav-item-icon" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.2 3.2l.85.85M11.95 11.95l.85.85M3.2 12.8l.85-.85M11.95 4.05l.85-.85"
                    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
                  />
                </svg>
                <span>Settings</span>
                {!githubConnection.connected && (
                  <span
                    className="db-nav-item-badge"
                    style={{
                      background: "rgba(251,191,36,0.15)",
                      color: "#fbbf24",
                      border: "1px solid rgba(251,191,36,0.25)",
                    }}
                  >
                    !
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="db-sidebar-divider" />

          <div className="db-sidebar-section-label">Recent Audits</div>
          <div className="db-audit-list">
            {auditHistory.length === 0 && (
              <p className="db-empty-list">No audits yet. Scan a repo to get started.</p>
            )}
            {auditHistory.map((report) => (
              <AuditHistoryCard
                key={report.id}
                report={report}
                selected={selectedReportId === report.id}
                onClick={() => onSelectReport(report.id)}
              />
            ))}
          </div>

          {/* Stats row */}
          <div className="db-sidebar-footer">
            <div className="db-sidebar-stat">
              <span className="db-sidebar-stat-val">{auditHistory.length}</span>
              <span className="db-sidebar-stat-label">Total Audits</span>
            </div>
            <div className="db-sidebar-stat">
              <span className="db-sidebar-stat-val">
                {auditHistory.reduce(
                  (sum, r) => sum + (r.critical_count ?? 0),
                  0
                )}
              </span>
              <span className="db-sidebar-stat-label">Critical Vulns</span>
            </div>
          </div>

          {/* Profile footer */}
          <div className="db-sidebar-profile-footer">
            <NavProfileMenu
              githubConnection={githubConnection}
              onGoToSettings={onGoToSettings}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
