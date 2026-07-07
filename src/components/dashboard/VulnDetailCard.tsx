"use client";

import { useState } from "react";
import { Vulnerability } from "@/lib/audit/types";
import { SeverityBadge } from "@/components/dashboard/AuditComponents";

interface VulnDetailCardProps {
  vuln: Vulnerability;
  onClose: () => void;
}

export default function VulnDetailCard({ vuln, onClose }: VulnDetailCardProps) {
  const [currentStatus, setCurrentStatus] = useState(vuln.status);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(status: string) {
    setUpdating(true);
    try {
      const res = await fetch("/api/audit/vulnerabilities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vuln.id, status }),
      });
      if (res.ok) {
        setCurrentStatus(status as any);
        vuln.status = status as any;
      }
    } catch {
      // silent
    } finally {
      setUpdating(false);
    }
  }

  const statusOptions = [
    { value: "open", label: "Open", color: "#f87171" },
    { value: "confirmed", label: "Confirmed", color: "#f97316" },
    { value: "fixed", label: "Fixed", color: "#34d399" },
    { value: "wontfix", label: "Won't Fix", color: "#9ca3af" },
  ];

  function sevColor(sev: string) {
    switch (sev) {
      case "critical": return "#ef4444";
      case "high": return "#f97316";
      case "medium": return "#eab308";
      case "low": return "#22c55e";
      default: return "#6b7280";
    }
  }

  const fileLink = vuln.file_path ? `#` : undefined;

  return (
    <div
      className="vuln-detail-card"
      style={{
        background: "var(--color-surface-3)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
          Vulnerability Detail
        </h2>
        <button
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            padding: "0.2rem",
          }}
          onClick={onClose}
          title="Close details"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* ── Title + Badges ── */}
      <div style={{ borderBottom: "1px solid var(--color-border-subtle)", paddingBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 850, color: "#fff", margin: "0 0 0.5rem", lineHeight: 1.25 }}>
          {vuln.title}
        </h1>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <SeverityBadge severity={vuln.severity} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
            {vuln.category_name || vuln.category_id}
          </span>
        </div>
      </div>

      {/* ── Description ── */}
      <div>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.375rem" }}>
          Summary
        </h3>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>
          {vuln.description}
        </p>
      </div>

      {/* ── CVSS ── */}
      {vuln.cvss_score != null && (
        <div>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.375rem" }}>
            CVSS Score
          </h3>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, color: sevColor(vuln.severity) }}>
            {vuln.cvss_score}
            <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--color-text-muted)" }}>/10</span>
          </span>
        </div>
      )}

      {/* ── Root Cause ── */}
      {vuln.root_cause && (
        <div>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.375rem" }}>
            Root Cause
          </h3>
          {vuln.file_path && (
            <div style={{ marginBottom: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-accent-blue)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {vuln.file_path}{vuln.line_number ? `:${vuln.line_number}` : ""}
              </span>
            </div>
          )}
          {vuln.code_snippet && (
            <pre
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-secondary)",
                overflowX: "auto",
                margin: "0 0 0.5rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              <code>{vuln.code_snippet}</code>
            </pre>
          )}
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
            {vuln.root_cause}
          </p>
        </div>
      )}

      {/* ── Attack Path ── */}
      {vuln.attack_path && (
        <div>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.375rem" }}>
            Attack Path
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>
            {vuln.attack_path}
          </p>
        </div>
      )}

      {/* ── Impact ── */}
      {vuln.impact && (
        <div>
          <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.375rem" }}>
            Impact
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-primary)", margin: 0, lineHeight: 1.6 }}>
            {vuln.impact}
          </p>
        </div>
      )}

      {/* ── Remediation ── */}
      <div>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>
          Remediation
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "0 0 0.25rem" }}>
              Remediation
            </p>
            <pre
              style={{
                background: "rgba(16, 185, 129, 0.04)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "rgba(52,211,153,0.9)",
                overflowX: "auto",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              <code>{vuln.remediation}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* ── Status Management ── */}
      <div>
        <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem" }}>
          Status
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              disabled={updating || currentStatus === opt.value}
              style={{
                padding: "0.4rem 0.875rem",
                borderRadius: 999,
                fontSize: "0.75rem",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: currentStatus === opt.value ? "default" : "pointer",
                border: `1px solid ${currentStatus === opt.value ? opt.color : "var(--color-border-subtle)"}`,
                color: currentStatus === opt.value ? opt.color : "var(--color-text-muted)",
                background: currentStatus === opt.value ? `${opt.color}14` : "transparent",
                transition: "all 0.15s ease",
              }}
              onClick={() => updateStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
