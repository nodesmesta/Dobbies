"use client";

import { useState, useEffect, useCallback } from "react";
import { AuditReport } from "@/lib/audit/types";

interface AuditHistoryListProps {
  onViewReport: (id: string) => void;
  onScanRepo: () => void;
}

function severityColor(severity: string) {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high":     return "#f97316";
    case "medium":   return "#eab308";
    case "low":      return "#22c55e";
    default:         return "#6b7280";
  }
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

function formatDate(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function AuditHistoryList({
  onViewReport,
  onScanRepo,
}: AuditHistoryListProps) {
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit/history");
      const data = await res.json();

      if (data && Array.isArray(data.reports)) {
        setReports(data.reports);
      } else {
        setReports([]);
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="history-list-panel">
      {/* ── Loading State ── */}
      {loading && (
        <div className="history-list-loading">
          <div className="history-list-loading-spinner" />
          <p>Loading audit history...</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && reports.length === 0 && (
        <div className="history-list-empty">
          <div className="history-list-empty-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <path
                d="M32 6L8 14v22c0 13.5 10.4 26.2 24 29.5C45.6 62.2 56 49.5 56 36V14L32 6z"
                stroke="url(#hlGrad)"
                strokeWidth="2"
                fill="rgba(52,211,153,0.06)"
              />
              <circle cx="32" cy="32" r="4" fill="#34d399" />
              <circle cx="22" cy="28" r="3" fill="#34d399" opacity="0.5" />
              <circle cx="42" cy="28" r="3" fill="#34d399" opacity="0.5" />
              <defs>
                <linearGradient id="hlGrad" x1="32" y1="6" x2="32" y2="62" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#34d399" />
                  <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2 className="history-list-empty-title">No audit history yet</h2>
          <p className="history-list-empty-desc">
            Once you run your first security audit, all past reports will appear here for easy access and comparison.
          </p>
          <button className="btn-primary" onClick={onScanRepo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Start Your First Audit
          </button>
        </div>
      )}

      {/* ── Audit Cards ── */}
      {!loading && reports.length > 0 && (
        <div className="history-list-grid">
          {reports.map((report) => {
            const critCount = report.critical_count ?? 0;
            const highCount = report.high_count ?? 0;
            const medCount = report.medium_count ?? 0;
            const lowCount = report.low_count ?? 0;
            const totalVulns = report.vulnerability_count ?? 0;

            return (
              <div key={report.id} className="history-card">
                {/* Score Badge */}
                <div
                  className="history-card-score-badge"
                  style={{
                    background: `${scoreColor(report.overallScore)}18`,
                    borderColor: `${scoreColor(report.overallScore)}40`,
                    color: scoreColor(report.overallScore),
                  }}
                >
                  <div className="history-card-score-num">{report.overallScore}%</div>
                  <div className="history-card-score-label">{scoreLabel(report.overallScore)}</div>
                </div>

                {/* Header */}
                <div className="history-card-header">
                  <h3 className="history-card-name">{report.agentName}</h3>
                  {report.status === "completed" && (
                    <span className="history-card-status history-card-status--completed">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Completed
                    </span>
                  )}
                </div>

                {/* Repo Info */}
                {report.repoUrl && (
                  <div className="history-card-repo">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M7 0C3.13 0 0 3.13 0 7c0 3.09 2 5.71 4.79 6.63.35.06.48-.15.48-.33v-1.16c-1.94.42-2.35-.94-2.35-.94-.32-.81-.78-1.03-.78-1.03-.64-.44.05-.43.05-.43.7.05 1.07.72 1.07.72.63 1.08 1.64.77 2.04.59.06-.45.25-.77.45-.94-1.56-.18-3.19-.78-3.19-3.47 0-.77.27-1.4.72-1.89-.07-.18-.31-.9.07-1.87 0 0 .59-.19 1.93.72A6.5 6.5 0 017 3.39c.6 0 1.2.08 1.76.24 1.34-.91 1.93-.72 1.93-.72.38.97.14 1.69.07 1.87.45.49.72 1.12.72 1.89 0 2.7-1.64 3.29-3.2 3.46.25.22.48.65.48 1.31v1.94c0 .19.13.4.48.33C12 12.71 14 10.09 14 7c0-3.87-3.13-7-7-7z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="history-card-repo-text">
                      {report.repoUrl.replace("https://github.com/", "")}
                    </span>
                  </div>
                )}

                {/* Vuln Counts */}
                <div className="history-card-vulns">
                  <div className="history-card-vuln-row">
                    <span className="history-card-vuln-label">Vulnerabilities:</span>
                    <span className="history-card-vuln-total">
                      {totalVulns} found
                    </span>
                  </div>
                  <div className="history-card-vuln-breakdown">
                    {critCount > 0 && (
                      <span className="history-card-vuln-item history-card-vuln-item--critical">
                        {critCount} Critical
                      </span>
                    )}
                    {highCount > 0 && (
                      <span className="history-card-vuln-item history-card-vuln-item--high">
                        {highCount} High
                      </span>
                    )}
                    {medCount > 0 && (
                      <span className="history-card-vuln-item history-card-vuln-item--medium">
                        {medCount} Medium
                      </span>
                    )}
                    {lowCount > 0 && (
                      <span className="history-card-vuln-item history-card-vuln-item--low">
                        {lowCount} Low
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="history-card-footer">
                  <div className="history-card-date">{formatDate(report.createdAt)}</div>
                  <button className="history-card-view-btn" onClick={() => onViewReport(report.id)}>
                    View Report
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M4.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
