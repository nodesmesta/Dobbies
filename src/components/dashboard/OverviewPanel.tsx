"use client";

import { AuditReport } from "@/lib/audit/types";

interface OverviewPanelProps {
  auditHistory: AuditReport[];
  onScanRepo: () => void;
  onViewReport: (id: string) => void;
  onViewAllHistory: () => void;
}

function scoreColor(score: number) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 70) return "Good";
  if (score >= 40) return "Fair";
  return "At Risk";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getPipelineStats(auditHistory: AuditReport[]) {
  const totalAgents = auditHistory.length;
  const totalVulns = auditHistory.reduce((sum, r) => sum + (r.vulnerability_count ?? 0), 0);
  const compromisedTurns = auditHistory.reduce((sum, r) => sum + (r.compromised_count ?? 0), 0);
  const totalReportsWithData = auditHistory.filter(
    (r) => (r.vulnerability_count ?? 0) > 0 || (r.compromised_count ?? 0) > 0
  ).length;
  const compromisedRate = totalReportsWithData > 0
    ? Math.round((compromisedTurns / totalReportsWithData) * 100) : 0;
  return { totalAgents, staticFindings: totalVulns, compromisedRate, totalGuardrails: 0 };
}

function getSeverityBreakdown(auditHistory: AuditReport[]) {
  const items: { label: string; code: string; count: number; color: string }[] = [
    { label: "Critical",  code: "CRIT", count: 0, color: "#ef4444" },
    { label: "High",      code: "HIGH", count: 0, color: "#f97316" },
    { label: "Medium",    code: "MED",  count: 0, color: "#eab308" },
    { label: "Low",       code: "LOW",  count: 0, color: "#6b7280" },
  ];
  auditHistory.forEach((r) => {
    items[0].count += r.critical_count ?? 0;
    items[1].count += r.high_count ?? 0;
    items[2].count += r.medium_count ?? 0;
    items[3].count += r.low_count ?? 0;
  });
  const maxCount = Math.max(...items.map((i) => i.count), 1);
  return items.filter((i) => i.count > 0).map((i) => ({ ...i, pct: Math.round((i.count / maxCount) * 100) }));
}

function getRedTeamStats(auditHistory: AuditReport[]) {
  const compromisedTurns = auditHistory.reduce((sum, r) => sum + (r.compromised_count ?? 0), 0);
  const totalReports = auditHistory.length;
  const reportsWithCompromises = auditHistory.filter((r) => (r.compromised_count ?? 0) > 0).length;
  const rate = totalReports > 0 ? Math.round((reportsWithCompromises / totalReports) * 100) : 0;
  return { compromisedTurns, reportsWithCompromises, rate };
}

export default function OverviewPanel({
  auditHistory,
  onScanRepo,
  onViewReport,
  onViewAllHistory,
}: OverviewPanelProps) {
  const totalAudits   = auditHistory.length;
  const totalCritical = auditHistory.reduce((sum, r) => sum + (r.critical_count ?? 0), 0);
  const totalHigh     = auditHistory.reduce((sum, r) => sum + (r.high_count ?? 0), 0);
  const totalMedium   = auditHistory.reduce((sum, r) => sum + (r.medium_count ?? 0), 0);
  const totalLow      = auditHistory.reduce((sum, r) => sum + (r.low_count ?? 0), 0);
  const totalVulns    = totalCritical + totalHigh + totalMedium + totalLow;
  const avgScore      = totalAudits > 0
    ? Math.round(auditHistory.reduce((sum, r) => sum + r.overallScore, 0) / totalAudits) : 0;

  const recentAudits    = auditHistory.slice(0, 5);
  const pipelineStats   = getPipelineStats(auditHistory);
  const severityBreakdown = getSeverityBreakdown(auditHistory);
  const redTeamStats    = getRedTeamStats(auditHistory);
  const agentsAtRisk    = auditHistory.filter(
    (r) => (r.critical_count ?? 0) > 0 || (r.high_count ?? 0) > 0
  );
  const criticalAgents = auditHistory.filter((r) => (r.critical_count ?? 0) > 0);

  return (
    <div className="ov-root">

      {/* ── Critical Alert Banner ── */}
      {totalCritical > 0 && (
        <div className="ov-alert">
          <div className="ov-alert-left">
            <div className="ov-alert-icon-wrap">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 14H2L8 2z" stroke="#ef4444" strokeWidth="1.4" fill="rgba(239,68,68,0.15)" strokeLinejoin="round"/>
                <path d="M8 7v2.5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="8" cy="11.2" r="0.7" fill="#ef4444"/>
              </svg>
            </div>
            <div>
              <span className="ov-alert-title">
                {totalCritical} critical {totalCritical === 1 ? "vulnerability" : "vulnerabilities"} require immediate attention
              </span>
              <span className="ov-alert-desc">
                {criticalAgents.length} {criticalAgents.length === 1 ? "agent" : "agents"} at critical risk — do not deploy to production
              </span>
            </div>
          </div>
          <button
            className="ov-alert-btn"
            onClick={() => criticalAgents[0] && onViewReport(criticalAgents[0].id)}
          >
            Review Now
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── 4 Key Cards ── */}
      <div className="ov-kpi-row">
        {/* Critical Vulns */}
        <div className="ov-kpi-card">
          <div className="ov-kpi-top">
            <span className="ov-kpi-label">Critical Vulns</span>
            <div className="ov-kpi-icon ov-kpi-icon--red">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div className="ov-kpi-value" style={{ color: totalCritical > 0 ? "#ef4444" : undefined }}>
            {totalCritical}
          </div>
          <div className="ov-kpi-footer">
            {totalCritical > 0 ? "needs immediate fix" : "none detected"}
          </div>
        </div>

        {/* High Vulns */}
        <div className="ov-kpi-card">
          <div className="ov-kpi-top">
            <span className="ov-kpi-label">High Vulns</span>
            <div className="ov-kpi-icon ov-kpi-icon--orange">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 14H2L8 2z" stroke="currentColor" strokeWidth="1.4"
                  fill="rgba(249,115,22,0.15)" strokeLinejoin="round"/>
                <path d="M8 7v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="8" cy="11.5" r="0.7" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div className="ov-kpi-value" style={{ color: totalHigh > 0 ? "#f97316" : undefined }}>
            {totalHigh}
          </div>
          <div className="ov-kpi-footer">
            {totalHigh > 0 ? "review before deploy" : "none detected"}
          </div>
        </div>

        {/* Agents at Risk */}
        <div className="ov-kpi-card">
          <div className="ov-kpi-top">
            <span className="ov-kpi-label">Agents at Risk</span>
            <div className="ov-kpi-icon ov-kpi-icon--orange">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.8" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div className="ov-kpi-value" style={{color:agentsAtRisk.length>0?"#f97316":"#34d399"}}>
            {agentsAtRisk.length}
          </div>
          <div className="ov-kpi-footer">agents with critical or high vulns</div>
        </div>

        {/* Avg Safety Score */}
        <div className="ov-kpi-card">
          <div className="ov-kpi-top">
            <span className="ov-kpi-label">Avg Safety Score</span>
            <div className="ov-kpi-icon ov-kpi-icon--green">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div
            className="ov-kpi-value"
            style={{ color: totalAudits > 0 ? scoreColor(avgScore) : undefined }}
          >
            {totalAudits > 0 ? `${avgScore}` : "—"}
            {totalAudits > 0 && <span className="ov-kpi-unit">/100</span>}
          </div>
          <div className="ov-kpi-footer">
            {totalAudits > 0 ? scoreLabel(avgScore) : "no data yet"}
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {totalAudits === 0 && (
        <div className="ov-empty">
          <div className="ov-empty-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <path d="M32 6L8 14v22c0 13.5 10.4 26.2 24 29.5C45.6 62.2 56 49.5 56 36V14L32 6z"
                stroke="url(#emGrad)" strokeWidth="2" fill="rgba(52,211,153,0.06)"/>
              <path d="M22 32l8 8 12-14" stroke="#34d399" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="emGrad" x1="32" y1="6" x2="32" y2="62" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#34d399"/>
                  <stop offset="1" stopColor="#a78bfa"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="ov-empty-title">No audits yet</h2>
          <p className="ov-empty-desc">
            Paste a GitHub repository URL — Dobbies auto-detects all agent definitions and runs the full 4-stage security pipeline in one click.
          </p>
          <button className="btn-primary" onClick={onScanRepo}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Scan a Repository
          </button>
        </div>
      )}

      {/* ── Content (only when data exists) ── */}
      {totalAudits > 0 && (
        <>
          {/* Severity Breakdown + Red Team two-column */}
          <div className="ov-two-col">

            {/* Severity Breakdown (replaces OWASP) */}
            {severityBreakdown.length > 0 && (
              <div className="ov-card">
                <div className="ov-card-header">
                  <div>
                    <h2 className="ov-card-title">Vulnerability Severity</h2>
                    <p className="ov-card-sub">Distribution across all audited agents</p>
                  </div>
                </div>
                <div className="ov-owasp-list">
                  {severityBreakdown.map((item, i) => (
                    <div key={item.label} className="ov-owasp-item">
                      <div className="ov-owasp-meta">
                        <span className="ov-owasp-code">{item.code}</span>
                        <span className="ov-owasp-name">{item.label}</span>
                        <span className="ov-owasp-count">{item.count}</span>
                      </div>
                      <div className="ov-bar-track">
                        <div className="ov-bar-fill" style={{ width: `${item.pct}%`, background: item.color }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Red Team Summary */}
            <div className="ov-card">
              <div className="ov-card-header">
                <div>
                  <h2 className="ov-card-title">Red Team Summary</h2>
                  <p className="ov-card-sub">Compromised simulation turns across all audits</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", padding: "0.75rem 0" }}>
                <div className="ov-kpi-card" style={{ flex: 1, padding: "1rem" }}>
                  <span className="ov-kpi-label">Compromised Turns</span>
                  <div className="ov-kpi-value" style={{ color: redTeamStats.compromisedTurns > 0 ? "#ef4444" : "#34d399", fontSize: "1.5rem" }}>
                    {redTeamStats.compromisedTurns}
                  </div>
                </div>
                <div className="ov-kpi-card" style={{ flex: 1, padding: "1rem" }}>
                  <span className="ov-kpi-label">Breached Agents</span>
                  <div className="ov-kpi-value" style={{ color: redTeamStats.reportsWithCompromises > 0 ? "#f97316" : "#34d399", fontSize: "1.5rem" }}>
                    {redTeamStats.reportsWithCompromises}
                  </div>
                </div>
                <div className="ov-kpi-card" style={{ flex: 1, padding: "1rem" }}>
                  <span className="ov-kpi-label">Breach Rate</span>
                  <div className="ov-kpi-value" style={{ color: redTeamStats.rate > 50 ? "#ef4444" : redTeamStats.rate > 25 ? "#f97316" : "#eab308", fontSize: "1.5rem" }}>
                    {redTeamStats.rate}%
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Audits */}
          <div className="ov-section">
            <div className="ov-section-header">
              <div>
                <h2 className="ov-section-title">Recent Audits</h2>
                <p className="ov-section-sub">Last {recentAudits.length} completed audits</p>
              </div>
              <button className="ov-view-all-btn" onClick={onViewAllHistory}>
                View all
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="ov-audit-list">
              {recentAudits.map((report) => {
                const critCount = report.critical_count ?? 0;
                const highCount = report.high_count ?? 0;
                const color = scoreColor(report.overallScore);
                return (
                  <button
                    key={report.id}
                    className="ov-audit-row"
                    onClick={() => onViewReport(report.id)}
                  >
                    {/* Score ring */}
                    <div className="ov-audit-score-ring" style={{ borderColor: color, color }}>
                      <span className="ov-audit-score-num">{report.overallScore}</span>
                      <span className="ov-audit-score-pct">%</span>
                    </div>

                    {/* Info */}
                    <div className="ov-audit-info">
                      <div className="ov-audit-name">{report.agentName}</div>
                      <div className="ov-audit-meta">
                        {report.repoUrl && (
                          <span className="ov-audit-repo">
                            {report.repoUrl.replace("https://github.com/", "")}
                          </span>
                        )}
                        <span className="ov-audit-dot" />
                        <span className="ov-audit-time">{timeAgo(report.createdAt)}</span>
                      </div>
                    </div>

                    {/* Severity badges */}
                    <div className="ov-audit-badges">
                      {critCount > 0 && (
                        <span className="ov-severity-badge ov-severity-badge--critical">
                          {critCount}C
                        </span>
                      )}
                      {highCount > 0 && (
                        <span className="ov-severity-badge ov-severity-badge--high">
                          {highCount}H
                        </span>
                      )}
                      <span
                        className="ov-score-badge"
                        style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}
                      >
                        {scoreLabel(report.overallScore)}
                      </span>
                    </div>

                    {/* Arrow */}
                    <svg className="ov-audit-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

        </>
      )}
    </div>
  );
}
