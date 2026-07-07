"use client";

import { useState, useEffect } from "react";
import { AuditReport, Severity } from "@/lib/audit/types";

// ─── Score Ring ──────────────────────────────────────────────────────────────
export function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  label,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const dashOffset = circ * (1 - pct / 100);

  const color =
    pct >= 75 ? "#34d399" : pct >= 50 ? "#fbbf24" : pct >= 25 ? "#f97316" : "#f87171";

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1), stroke 0.5s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>
          {pct}
        </span>
        {label && (
          <span
            style={{
              fontSize: size * 0.09,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              lineHeight: 1,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Severity Badge ──────────────────────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    critical: "badge-critical",
    high: "badge-high",
    medium: "badge-medium",
    low: "badge-low",
  };
  return (
    <span
      className={map[severity]}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.2rem 0.6rem",
        borderRadius: 999,
        fontSize: "0.7rem",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: "currentColor",
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {severity}
    </span>
  );
}

// ─── Score Badge (for history list) ─────────────────────────────────────────
export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : score >= 25 ? "#f97316" : "#f87171";
  const bg =
    score >= 75
      ? "rgba(52,211,153,0.1)"
      : score >= 50
      ? "rgba(251,191,36,0.1)"
      : score >= 25
      ? "rgba(249,115,22,0.1)"
      : "rgba(248,113,113,0.1)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.2rem 0.6rem",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 700,
        color,
        background: bg,
        border: `1px solid ${color}40`,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {score}/100
    </span>
  );
}

// ─── Relative timestamp ──────────────────────────────────────────────────────
export function RelativeTime({ dateStr }: { dateStr: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    let l = "";
    if (diffMin < 1) l = "just now";
    else if (diffMin < 60) l = `${diffMin}m ago`;
    else if (diffHr < 24) l = `${diffHr}h ago`;
    else l = `${diffDay}d ago`;

    const handle = setTimeout(() => {
      setLabel(l);
    }, 0);
    return () => clearTimeout(handle);
  }, [dateStr]);

  return (
    <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }} title={dateStr}>
      {label || "pending..."}
    </span>
  );
}

// ─── Audit History Card ──────────────────────────────────────────────────────
export function AuditHistoryCard({
  report,
  selected,
  onClick,
}: {
  report: AuditReport;
  selected: boolean;
  onClick: () => void;
}) {
  const vulnCritical = report.critical_count ?? 0;
  const vulnHigh = report.high_count ?? 0;

  return (
    <button
      id={`audit-card-${report.id}`}
      className="audit-history-card"
      data-selected={selected}
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: selected
          ? "rgba(52,211,153,0.08)"
          : "var(--color-surface-3)",
        border: `1px solid ${selected ? "rgba(52,211,153,0.3)" : "var(--color-border-subtle)"}`,
        borderRadius: "var(--radius-md)",
        padding: "0.875rem 1rem",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {report.agentName}
        </span>
        <ScoreBadge score={report.overallScore} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        {vulnCritical > 0 && (
          <span className="badge-critical" style={{ padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 }}>
            {vulnCritical} critical
          </span>
        )}
        {vulnHigh > 0 && (
          <span className="badge-high" style={{ padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 }}>
            {vulnHigh} high
          </span>
        )}
        <RelativeTime dateStr={report.createdAt} />
      </div>
    </button>
  );
}
