"use client";

import { useState, useEffect } from "react";
import { AuditReport, DetectedAgent, Vulnerability } from "@/lib/audit/types";
import { LiveAuditView } from "@/components/dashboard/LiveAuditView";
import AuditResultDetail from "@/components/dashboard/AuditResultDetail";
import RepoScanner from "@/components/dashboard/RepoScanner";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import AssistantPanel from "@/components/dashboard/AssistantPanel";
import OverviewPanel from "@/components/dashboard/OverviewPanel";
import AuditHistoryList from "@/components/dashboard/AuditHistoryList";
import AuditTrendView from "@/components/dashboard/AuditTrendView";
import PageBreadcrumb from "@/components/dashboard/PageBreadcrumb";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import VulnDetailCard from "@/components/dashboard/VulnDetailCard";
import { useGitHubConnection } from "@/hooks/useGitHubConnection";

type PanelView = "overview" | "trend" | "history-list" | "history-detail" | "scan-repo" | "run-audit" | "settings";
type NavItem = "overview" | "trend" | "scan-repo" | "history" | "settings";

export default function DashboardPage() {
  const [auditHistory, setAuditHistory]     = useState<AuditReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [panelView, setPanelView]           = useState<PanelView>("overview");
  const [activeNav, setActiveNav]           = useState<NavItem>("overview");
  const [selectedAgent, setSelectedAgent]   = useState<DetectedAgent | null>(null);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [assistantOpen, setAssistantOpen]   = useState(false);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const { githubConnection, connecting, disconnecting, connect, disconnect } = useGitHubConnection();

  useEffect(() => {
    setSelectedVuln(null);
  }, [selectedReportId]);

  useEffect(() => {
    const init = () => setSidebarOpen(window.innerWidth > 680);
    init();
    window.addEventListener("resize", init);
    return () => window.removeEventListener("resize", init);
  }, []);

  // Fetch audit history from API — now returns { reports, total, page, ... }
  useEffect(() => {
    fetch("/api/audit/history?limit=50")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reports)) {
          setAuditHistory(data.reports);
        }
      })
      .catch(() => {
        // API unavailable — stay with empty state
      });
  }, []);

  const selectedReport = auditHistory.find((r) => r.id === selectedReportId) ?? null;

  function closeMobileSidebar() {
    if (window.innerWidth <= 680) setSidebarOpen(false);
  }

  function handleScanRepo() {
    setPanelView("scan-repo");
    setSelectedAgent(null);
    setSelectedReportId(null);
    setActiveNav("scan-repo");
    closeMobileSidebar();
  }

  function handleAgentSelected(agent: DetectedAgent) {
    setSelectedAgent(agent);
    setPanelView("run-audit");
  }

  function handleAuditComplete(report: AuditReport) {
    setAuditHistory((prev) => [report, ...prev]);
    setSelectedReportId(report.id);
    setPanelView("history-detail");
    setActiveNav("history");
    setSelectedAgent(null);
  }

  function handleSelectReport(id: string) {
    setSelectedReportId(id);
    setPanelView("history-detail");
    setActiveNav("history");
    closeMobileSidebar();
  }

  function handleNavClick(nav: NavItem) {
    setActiveNav(nav);
    if (nav === "scan-repo") {
      handleScanRepo();
    } else if (nav === "overview") {
      setPanelView("overview");
    } else if (nav === "trend") {
      setPanelView("trend");
    } else if (nav === "history") {
      setPanelView("history-list");
    } else if (nav === "settings") {
      setPanelView("settings");
      closeMobileSidebar();
    }
    closeMobileSidebar();
  }

  function getBreadcrumbs() {
    const dashboard = { label: "Dashboard" };
    switch (panelView) {
      case "overview":
        return [dashboard, { label: "Overview" }];
      case "trend":
        return [dashboard, { label: "Trends" }];
      case "history-list":
        return [dashboard, { label: "Audit History" }];
      case "history-detail":
        return [
          dashboard,
          { label: "Audit History", onClick: () => handleNavClick("history") },
          { label: selectedReport?.agentName ?? "Report" },
        ];
      case "scan-repo":
        return [dashboard, { label: "Scan Repository" }];
      case "run-audit":
        return [
          dashboard,
          { label: "Scan Repository", onClick: handleScanRepo },
          { label: selectedAgent?.name ?? "Run Audit" },
        ];
      case "settings":
        return [dashboard, { label: "Settings" }];
      default:
        return [dashboard];
    }
  }

  return (
    <div className="db-root">
      <DashboardNavbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        assistantOpen={assistantOpen}
        onToggleAssistant={() => setAssistantOpen((v) => !v)}
      />

      <div className="db-body">
        <DashboardSidebar
          sidebarOpen={sidebarOpen}
          onClose={closeMobileSidebar}
          activeNav={activeNav}
          onNavClick={handleNavClick}
          auditHistory={auditHistory}
          selectedReportId={selectedReportId}
          onSelectReport={handleSelectReport}
          githubConnection={githubConnection}
          onGoToSettings={() => handleNavClick("settings")}
        />

        <main className="db-main">
          <PageBreadcrumb crumbs={getBreadcrumbs()} />

          {panelView === "overview" && (
            <OverviewPanel
              auditHistory={auditHistory}
              onScanRepo={handleScanRepo}
              onViewReport={handleSelectReport}
              onViewAllHistory={() => handleNavClick("history")}
            />
          )}

          {panelView === "trend" && (
            <AuditTrendView
              auditHistory={auditHistory}
              onViewReport={handleSelectReport}
              onBack={() => handleNavClick("overview")}
            />
          )}

          {panelView === "history-list" && (
            <AuditHistoryList
              onViewReport={handleSelectReport}
              onScanRepo={handleScanRepo}
            />
          )}

          {panelView === "history-detail" && selectedReport && (
            <div className="ard-page-container">
              <div style={{ flex: "0 0 860px", maxWidth: "100%", width: "100%", minWidth: "0" }}>
                <AuditResultDetail 
                  reportId={selectedReport.id}
                  report={selectedReport}
                  selectedVulnId={selectedVuln?.id ?? null}
                  onSelectVuln={(vuln) => setSelectedVuln(vuln)}
                />
              </div>
              <div className="ard-vuln-detail-panel" style={{ flex: 1, minWidth: "320px", marginTop: "1.5rem" }}>
                {selectedVuln ? (
                  <VulnDetailCard vuln={selectedVuln} onClose={() => setSelectedVuln(null)} />
                ) : (
                  <div style={{ height: "100%" }} />
                )}
              </div>
            </div>
          )}

          {panelView === "scan-repo" && (
            <RepoScanner
              onAuditAgent={handleAgentSelected}
              githubConnected={githubConnection.connected}
              onGoToSettings={() => handleNavClick("settings")}
            />
          )}

          {panelView === "run-audit" && selectedAgent && (
            <LiveAuditView
              agent={selectedAgent}
              onAuditComplete={handleAuditComplete}
              onBack={() => setPanelView("scan-repo")}
            />
          )}

          {panelView === "settings" && (
            <SettingsPanel
              githubConnection={githubConnection}
              onConnect={connect}
              onDisconnect={disconnect}
              connecting={connecting}
              disconnecting={disconnecting}
            />
          )}
        </main>
      </div>

      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}
