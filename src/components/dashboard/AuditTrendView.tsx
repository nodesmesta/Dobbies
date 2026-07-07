"use client";

import { AuditReport } from "@/lib/audit/types";

interface AuditTrendViewProps {
  auditHistory: AuditReport[];
  onViewReport: (id: string) => void;
  onBack: () => void;
}

function scoreColor(score: number) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

/* ── SVG Trend Line ────────────────────────────────────────── */

function TrendChart({ reports }: { reports: AuditReport[] }) {
  if (reports.length < 2) return null;

  const W = 720;
  const H = 220;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;

  const sorted = [...reports].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const minScore = Math.max(0, Math.min(...sorted.map((r) => r.overallScore)) - 10);
  const maxScore = Math.min(100, Math.max(...sorted.map((r) => r.overallScore)) + 10);
  const range = maxScore - minScore || 1;

  const points = sorted.map((r, i) => ({
    x: pad.left + (i / Math.max(sorted.length - 1, 1)) * iw,
    y: pad.top + ih - ((r.overallScore - minScore) / range) * ih,
    r,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Y-axis ticks
  const yTicks = 5;
  const yLabels: number[] = [];
  for (let i = 0; i <= yTicks; i++) {
    yLabels.push(Math.round(minScore + (range / yTicks) * i));
  }

  // X-axis labels (date)
  const xLabels = sorted.map((r) => {
    const d = new Date(r.createdAt);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto" }}>
      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = pad.top + ih - ((v - minScore) / range) * ih;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#2a2a3e" strokeWidth="0.5" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#888" fontSize="11">
              {v}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {xLabels.map((label, i) => {
        const x = pad.left + (i / Math.max(sorted.length - 1, 1)) * iw;
        return (
          <text key={i} x={x} y={H - 8} textAnchor="middle" fill="#888" fontSize="10">
            {label}
          </text>
        );
      })}

      {/* Area fill */}
      {points.length > 1 && (
        <path
          d={`${linePath} L${points[points.length - 1].x},${pad.top + ih} L${points[0].x},${pad.top + ih} Z`}
          fill="url(#trendGrad)"
          opacity="0.15"
        />
      )}

      {/* Line */}
      <path d={linePath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={scoreColor(p.r.overallScore)} stroke="#13131f" strokeWidth="2" />
          <title>{`${p.r.agentName}: ${p.r.overallScore}/100`}</title>
        </g>
      ))}

      {/* Y-axis title */}
      <text
        x={12}
        y={pad.top + ih / 2}
        textAnchor="middle"
        fill="#888"
        fontSize="11"
        transform={`rotate(-90, 12, ${pad.top + ih / 2})`}
      >
        Score
      </text>

      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Comparison Table ───────────────────────────────────────── */

function ComparisonTable({
  reports,
  onViewReport,
}: {
  reports: AuditReport[];
  onViewReport: (id: string) => void;
}) {
  const sorted = [...reports].sort(
    (a, b) => b.overallScore - a.overallScore
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="ct-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th style={{ width: 70 }}>Score</th>
            <th style={{ width: 60 }}>Critical</th>
            <th style={{ width: 50 }}>High</th>
            <th style={{ width: 55 }}>Medium</th>
            <th style={{ width: 45 }}>Low</th>
            <th style={{ width: 80 }}>Compromised</th>
            <th style={{ width: 90 }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const color = scoreColor(r.overallScore);
            const total = (r.critical_count ?? 0) + (r.high_count ?? 0) + (r.medium_count ?? 0) + (r.low_count ?? 0);
            return (
              <tr
                key={r.id}
                className="ct-row"
                onClick={() => onViewReport(r.id)}
              >
                <td className="ct-cell-name">{r.agentName}</td>
                <td>
                  <span
                    className="ct-score-badge"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                  >
                    {r.overallScore}
                  </span>
                </td>
                <td className="ct-cell-num" style={{ color: (r.critical_count ?? 0) > 0 ? "#ef4444" : undefined }}>
                  {r.critical_count ?? 0}
                </td>
                <td className="ct-cell-num" style={{ color: (r.high_count ?? 0) > 0 ? "#f97316" : undefined }}>
                  {r.high_count ?? 0}
                </td>
                <td className="ct-cell-num" style={{ color: (r.medium_count ?? 0) > 0 ? "#eab308" : undefined }}>
                  {r.medium_count ?? 0}
                </td>
                <td className="ct-cell-num">{r.low_count ?? 0}</td>
                <td className="ct-cell-num" style={{ color: (r.compromised_count ?? 0) > 0 ? "#ef4444" : undefined }}>
                  {r.compromised_count ?? 0}
                </td>
                <td className="ct-cell-date">
                  {new Date(r.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */

export default function AuditTrendView({
  auditHistory,
  onViewReport,
  onBack,
}: AuditTrendViewProps) {
  if (auditHistory.length === 0) {
    return (
      <div className="ov-empty">
        <div className="ov-empty-icon">
          <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
            <circle cx="32" cy="32" r="26" stroke="#6b7280" strokeWidth="2" fill="rgba(107,114,128,0.06)" />
            <path d="M22 32l8 8 12-14" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="ov-empty-title">No audit data yet</h2>
        <p className="ov-empty-desc">Run your first security audit to start tracking trends.</p>
        <button className="btn-primary" onClick={onBack}>
          Back to Overview
        </button>
      </div>
    );
  }

  return (
    <div className="ov-root">
      {/* Header */}
      <div className="ov-section-header" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h2 className="ov-section-title">Audit Trends & Comparison</h2>
          <p className="ov-section-sub">
            {auditHistory.length} audit{auditHistory.length !== 1 ? "s" : ""} completed — scores, vulnerability trends, and side-by-side comparison
          </p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="ov-kpi-row" style={{ marginBottom: "1.5rem" }}>
        <div className="ov-kpi-card">
          <span className="ov-kpi-label">Total Audits</span>
          <div className="ov-kpi-value">{auditHistory.length}</div>
        </div>
        <div className="ov-kpi-card">
          <span className="ov-kpi-label">Avg Score</span>
          <div className="ov-kpi-value">
            {Math.round(auditHistory.reduce((s, r) => s + r.overallScore, 0) / auditHistory.length)}
          </div>
        </div>
        <div className="ov-kpi-card">
          <span className="ov-kpi-label">Best Score</span>
          <div className="ov-kpi-value" style={{ color: "#22c55e" }}>
            {Math.max(...auditHistory.map((r) => r.overallScore))}
          </div>
        </div>
        <div className="ov-kpi-card">
          <span className="ov-kpi-label">Total Vulns</span>
          <div className="ov-kpi-value">
            {auditHistory.reduce((s, r) => s + (r.vulnerability_count ?? 0), 0)}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="ov-card" style={{ marginBottom: "1.5rem" }}>
        <div className="ov-card-header">
          <h2 className="ov-card-title">Score Trend</h2>
          <p className="ov-card-sub">Safety score over time — higher is better</p>
        </div>
        <div style={{ padding: "0.5rem 0" }}>
          {auditHistory.length < 2 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "#888" }}>
              Need at least 2 audits to show a trend line. Run more audits to see score progression.
            </div>
          ) : (
            <TrendChart reports={auditHistory} />
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="ov-card">
        <div className="ov-card-header">
          <h2 className="ov-card-title">Comparison</h2>
          <p className="ov-card-sub">All audits side-by-side — click a row to view details</p>
        </div>
        {auditHistory.length > 0 && <ComparisonTable reports={auditHistory} onViewReport={onViewReport} />}
      </div>
    </div>
  );
}
