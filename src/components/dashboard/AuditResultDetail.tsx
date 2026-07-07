"use client";

import { useState, useEffect } from "react";
import { AuditReport, Vulnerability } from "@/lib/audit/types";
import { ScoreRing, SeverityBadge } from "@/components/dashboard/AuditComponents";

type ActiveTab = "vulnerabilities" | "simulation" | "guardrails";

interface AuditResultDetailProps {
  reportId: string;
  report: AuditReport;
  selectedVulnId: string | null;
  onSelectVuln: (vuln: Vulnerability | null) => void;
}

export default function AuditResultDetail({
  reportId,
  report,
  selectedVulnId,
  onSelectVuln,
}: AuditResultDetailProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("vulnerabilities");
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [simulationTurns, setSimulationTurns] = useState<any[]>([]);
  const [guardrails, setGuardrails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`/api/audit/report?id=${reportId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setVulnerabilities(data.vulnerabilities ?? []);
          setSimulationTurns(data.simulationTurns ?? []);
          setGuardrails(data.guardrails ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reportId]);

  // Reset selected vuln when vulnerabilities list changes
  useEffect(() => {
    if (selectedVulnId && vulnerabilities.length > 0) {
      const found = vulnerabilities.find((v) => v.id === selectedVulnId);
      if (found) onSelectVuln(found);
    }
  }, [vulnerabilities]);

  if (loading) {
    return (
      <div className="ard-loading">
        <div className="ard-loading-spinner" />
        <p>Loading report...</p>
      </div>
    );
  }

  const tabs: { key: ActiveTab; label: string; count: number }[] = [
    { key: "vulnerabilities", label: "Vulnerabilities", count: vulnerabilities.length },
    { key: "simulation", label: "Simulation", count: simulationTurns.length },
    { key: "guardrails", label: "Guardrails", count: guardrails.length },
  ];

  return (
    <div className="ard-wrapper animate-fade-in-up">
      {/* ── Report Header ── */}
      <div className="ard-header">
        <div className="ard-header-left">
          <h2 className="ard-agent-name">{report.agentName}</h2>
          {report.repoUrl && (
            <span className="ard-repo">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              {report.repoUrl.replace("https://github.com/", "")}
            </span>
          )}
        </div>
        <ScoreRing score={report.overallScore} size={80} strokeWidth={8} label="Safety" />
      </div>

      {/* ── Score Row ── */}
      <div className="ard-score-row">
        <div className="ard-score-item">
          <span className="ard-score-label">Static</span>
          <span className={`ard-score-value ${report.staticScore < 40 ? "ard-score-value--danger" : report.staticScore < 70 ? "ard-score-value--warning" : "ard-score-value--safe"}`}>
            {report.staticScore}
          </span>
        </div>
        <div className="ard-score-item">
          <span className="ard-score-label">Dynamic</span>
          <span className={`ard-score-value ${report.dynamicScore < 40 ? "ard-score-value--danger" : report.dynamicScore < 70 ? "ard-score-value--warning" : "ard-score-value--safe"}`}>
            {report.dynamicScore}
          </span>
        </div>
        <div className="ard-score-item">
          <span className="ard-score-label">Compromised</span>
          <span className="ard-score-value ard-score-value--danger">{report.compromised_count ?? 0}</span>
        </div>
        <div className="ard-score-item">
          <span className="ard-score-label">Vulnerabilities</span>
          <span className="ard-score-value">{report.vulnerability_count ?? 0}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ard-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className="ard-tab"
            data-active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="ard-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ══════ TAB: Vulnerabilities ══════ */}
      {activeTab === "vulnerabilities" && (
        <div className="ard-panel animate-fade-in-up">
          {vulnerabilities.length === 0 ? (
            <div className="ard-empty">
              <p>
                No vulnerabilities detected.
              </p>
            </div>
          ) : (
            <div className="ard-vuln-list">
              {vulnerabilities.map((vuln, i) => {
                const isSelected = selectedVulnId === vuln.id;
                return (
                  <div
                    key={vuln.id}
                    className="ard-vuln-item"
                    data-selected={isSelected}
                    onClick={() => onSelectVuln(vuln)}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className="ard-vuln-item-top">
                      <div className="ard-vuln-item-left">
                        <SeverityBadge severity={vuln.severity} />
                        <span className="ard-vuln-category">{vuln.category_name || vuln.category_id}</span>
                      </div>
                      <span className={`ard-vuln-status-badge ard-vuln-status-badge--${vuln.status}`}>
                        {vuln.status}
                      </span>
                    </div>
                    <h3 className="ard-vuln-title">{vuln.title}</h3>
                    <p className="ard-vuln-desc">{vuln.description}</p>
                    <div className="ard-vuln-item-footer">
                      {vuln.cvss_score != null && (
                        <span className="ard-vuln-cvss">CVSS {vuln.cvss_score}</span>
                      )}
                      <button
                        className="ard-vuln-detail-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVuln(vuln);
                        }}
                      >
                        View Details
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M3 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: Simulation ══════ */}
      {activeTab === "simulation" && (
        <div className="ard-panel animate-fade-in-up">
          <p className="ard-sim-intro">
            Full transcript of the automated red-team adversarial session. Compromised turns are flagged.
          </p>
          {simulationTurns.length === 0 ? (
            <div className="ard-empty">
              <p>No simulation data available</p>
            </div>
          ) : (
            <div className="ard-sim-log">
              {simulationTurns.map((turn, i) => {
                const prevCategory = i > 0 ? simulationTurns[i - 1].session_category : null;
                const isNewSession = turn.session_category && turn.session_category !== prevCategory;
                return (
                  <div key={turn.id}>
                    {isNewSession && (
                      <div className="ar-session-header">
                        <span className="ar-session-badge">
                          Session: {turn.session_category?.toUpperCase() ?? "??"}
                        </span>
                      </div>
                    )}
                    <div
                      className={`ar-chat-bubble ar-chat-bubble--${turn.sender} animate-fade-in-up`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                  <div className="ar-chat-sender">
                    {turn.sender === "attacker" ? "🎯 Attacker" : "🤖 Agent"}
                    {turn.sender === "attacker" && turn.target_vuln_title && (
                      <span className="ar-chat-target" title={`Target: ${turn.target_vuln_title}`}>
                        → {turn.target_vuln_title.slice(0, 35)}{turn.target_vuln_title.length > 35 ? "…" : ""}
                      </span>
                    )}
                    <span style={{ color: "var(--color-text-muted)", fontWeight: 400, marginLeft: "auto" }}>
                      Turn {turn.turn_number}
                    </span>
                    {turn.compromised && (
                      <span className="ar-chat-compromised">⚠ COMPROMISED</span>
                    )}
                  </div>
                  <p className="ar-chat-text">{turn.text}</p>
                </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: Guardrails ══════ */}
      {activeTab === "guardrails" && (
        <div className="ard-panel animate-fade-in-up">
          {guardrails.length === 0 ? (
            <div className="ard-empty">
              <p>No guardrail configurations generated for this audit.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {guardrails.map((g: any) => (
                <div key={g.id} className="ard-guardrail-card">
                  <div className="ard-guardrail-header">
                    <span className="ard-guardrail-label">{g.category_id}</span>
                  </div>
                  <pre className="ard-guardrail-code">{g.instructions}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
