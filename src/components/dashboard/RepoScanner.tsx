"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ScannedFile {
  path: string;
  content: string;
  language?: string;
}

interface ScannedFileWithStatus {
  path: string;
  language: string;
  audited: boolean;
  auditId?: string;
  auditScore?: number;
}

interface ScannedRepoWithStatus {
  id: string;
  repo_url: string;
  owner: string;
  repo: string;
  files: ScannedFileWithStatus[];
  scanned_at: string;
  auditedCount: number;
  totalCount: number;
}

interface RepoScannerProps {
  onAuditAgent: (agent: any) => void;
  githubConnected: boolean;
  onGoToSettings: () => void;
}

const LANG_COLORS: Record<string, string> = {
  typescript: "#3178c6",
  javascript: "#f0db4f",
  python:     "#3572A5",
  json:       "#6b7280",
};

const LANG_LABELS: Record<string, string> = {
  typescript: "TS",
  javascript: "JS",
  python:     "PY",
  json:       "JSON",
};

export default function RepoScanner({ onAuditAgent, githubConnected, onGoToSettings }: RepoScannerProps) {
  const [repoUrl, setRepoUrl]     = useState("");
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [files, setFiles]         = useState<ScannedFile[]>([]);
  const [errorMsg, setErrorMsg]   = useState("");
  const [scanLog, setScanLog]     = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Repo history state
  const [repos, setRepos]                     = useState<ScannedRepoWithStatus[]>([]);
  const [selectedRepo, setSelectedRepo]       = useState<ScannedRepoWithStatus | null>(null);
  const [loadingHistory, setLoadingHistory]   = useState(true);
  const [currentRepoUrl, setCurrentRepoUrl]   = useState("");

  // Load repo history on mount
  const loadRepoHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/repo/list");
      const data = await res.json();
      if (data.repos) setRepos(data.repos);
    } catch {
      // Ignore — stay with empty state
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadRepoHistory();
  }, [loadRepoHistory]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [scanLog]);

  function isValidGithubUrl(url: string) {
    return /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/.test(url.trim());
  }

  async function handleScan() {
    const url = repoUrl.trim();
    if (!url) return;
    if (!isValidGithubUrl(url)) {
      setErrorMsg("Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)");
      setScanState("error");
      return;
    }

    setScanState("scanning");
    setFiles([]);
    setErrorMsg("");
    setScanLog([]);

    try {
      const res = await fetch("/api/repo/scan/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Scan failed");
        setScanState("error");
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventType: string | undefined;

      if (!reader) {
        setErrorMsg("Failed to read response stream");
        setScanState("error");
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const data = JSON.parse(jsonStr);

              if (eventType === "log") {
                if (data.message) setScanLog((prev) => [...prev, data.message]);
              } else if (eventType === "done") {
                const scannedFiles: ScannedFile[] = data.files ?? [];
                const scannedRepoUrl = data.repoUrl || url;
                setFiles(scannedFiles);
                setCurrentRepoUrl(scannedRepoUrl);
                setScanState(scannedFiles.length > 0 ? "done" : "error");
                if (scannedFiles.length === 0) {
                  setErrorMsg("No files found in '## Agent Scan Scope' section of README.md.");
                } else {
                  // Save scanned repo to database
                  saveToHistory(scannedRepoUrl, data.owner || "", data.repo || "", scannedFiles);
                }
              } else if (eventType === "error") {
                setErrorMsg(data.error || "Scan failed");
                setScanState("error");
              }
            } catch {
              // Skip malformed JSON
            }
            eventType = undefined;
          }
        }
      }
    } catch (err) {
      setErrorMsg(`Network error: ${err instanceof Error ? err.message : "Failed to reach server"}`);
      setScanState("error");
    }
  }

  async function saveToHistory(repoUrl: string, owner: string, repo: string, files: ScannedFile[]) {
    try {
      await fetch("/api/repo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl, owner, repo, files }),
      });
      // Refresh history
      loadRepoHistory();
    } catch {
      // Non-critical — scan still works, just not persisted
    }
  }

  function handleReset() {
    setScanState("idle");
    setFiles([]);
    setScanLog([]);
    setErrorMsg("");
    setSelectedRepo(null);
    setCurrentRepoUrl("");
  }

  function handleSelectRepo(repo: ScannedRepoWithStatus) {
    setSelectedRepo(repo);
    setScanState("idle");
    setFiles([]);
    setScanLog([]);
  }

  function handleAuditFileFromRepo(file: ScannedFileWithStatus) {
    // We need to fetch file content since stored files don't include content
    onAuditAgent({
      id: `agent-${btoa(file.path).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
      name: file.path.split("/").pop() ?? "Unknown",
      repoUrl: selectedRepo?.repo_url ?? "",
      filePath: file.path,
      content: "", // Will be fetched by audit pipeline
      language: file.language,
      systemPrompt: "",
      tools: [],
      riskHints: [],
    });
  }

  // ── Render: Selected Repo View ──
  if (selectedRepo) {
    return (
      <div className="rs-root animate-fade-in-up">
        <div className="rs-header">
          <button
            className="rs-rescan-btn"
            onClick={handleReset}
            style={{ marginBottom: "0.75rem" }}
          >
            &larr; Back to repos
          </button>
          <h2 className="rs-title">{selectedRepo.repo}</h2>
          <p className="rs-subtitle">
            {selectedRepo.owner}/{selectedRepo.repo} &middot; Scanned {new Date(selectedRepo.scanned_at).toLocaleDateString()}
            &middot; {selectedRepo.auditedCount}/{selectedRepo.totalCount} files audited
          </p>
        </div>

        <div className="rs-agent-list">
          {selectedRepo.files.map((file) => {
            const lang = file.language ?? "unknown";
            return (
              <div
                key={file.path}
                className="rs-agent-card"
                style={{
                  borderLeft: file.audited
                    ? "3px solid #34d399"
                    : "3px solid rgba(255,255,255,0.1)",
                }}
              >
                <div className="rs-agent-card-header">
                  <div className="rs-agent-name-row">
                    <span
                      className="rs-lang-badge"
                      style={{
                        background: `${LANG_COLORS[lang] ?? "#6b7280"}22`,
                        color: LANG_COLORS[lang] ?? "#6b7280",
                        borderColor: `${LANG_COLORS[lang] ?? "#6b7280"}44`,
                      }}
                    >
                      {LANG_LABELS[lang] ?? lang.toUpperCase()}
                    </span>
                    <span className="rs-agent-name">
                      {file.path.split("/").pop()}
                    </span>
                    {/* Audit status badge */}
                    {file.audited ? (
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "#34d399",
                          background: "rgba(52,211,153,0.1)",
                          border: "1px solid rgba(52,211,153,0.25)",
                          borderRadius: "999px",
                          padding: "0.125rem 0.5rem",
                          marginLeft: "0.5rem",
                        }}
                      >
                        Audited {file.auditScore != null ? `· ${file.auditScore}` : ""}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          color: "#fbbf24",
                          background: "rgba(251,191,36,0.1)",
                          border: "1px solid rgba(251,191,36,0.25)",
                          borderRadius: "999px",
                          padding: "0.125rem 0.5rem",
                          marginLeft: "0.5rem",
                        }}
                      >
                        Not audited
                      </span>
                    )}
                  </div>
                  <code className="rs-agent-filepath">{file.path}</code>
                </div>

                <button
                  className="rs-audit-btn"
                  disabled={file.audited}
                  style={{
                    opacity: file.audited ? 0.5 : 1,
                    cursor: file.audited ? "not-allowed" : "pointer",
                  }}
                  onClick={() => handleAuditFileFromRepo(file)}
                >
                  {file.audited ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Already Audited
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M6.5 1L1.5 2.8v5C1.5 10.8 3.7 12.7 6.5 13c2.8-.3 5-2.2 5-5.2v-5L6.5 1z"
                          stroke="currentColor" strokeWidth="1.3" fill="rgba(255,255,255,0.08)"/>
                        <path d="M4 6.5l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Audit this File
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Render: Main View (input + repo history) ──
  return (
    <div className="rs-root animate-fade-in-up">
      {/* GitHub Not Connected Gate */}
      {!githubConnected && (
        <div
          style={{
            background: "rgba(251,191,36,0.05)",
            border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
            textAlign: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                fill="rgba(251,191,36,0.7)"
              />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "1.0625rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              GitHub account not connected
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                maxWidth: 420,
                lineHeight: 1.6,
              }}
            >
              Connect your GitHub account in Settings first. This ensures
              Dobbies only scans <strong style={{ color: "var(--color-text-primary)" }}>
                repositories you own
              </strong> — not someone else&apos;s.
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ fontSize: "0.875rem", padding: "0.5rem 1.25rem" }}
            onClick={onGoToSettings}
          >
            Go to Settings
          </button>
        </div>
      )}

      {/* Header */}
      <div className="rs-header">
        <h2 className="rs-title">Scan Repository</h2>
        <p className="rs-subtitle">
          Paste a GitHub repo URL to scan, or select a previously scanned repo below.
        </p>
      </div>

      {/* URL Input */}
      <div className="rs-input-row">
        <input
          className="rs-input"
          type="url"
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => { setRepoUrl(e.target.value); setErrorMsg(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleScan(); }}
          disabled={!githubConnected}
        />
        <button
          className="rs-scan-btn"
          onClick={handleScan}
          disabled={!githubConnected || scanState === "scanning"}
        >
          {scanState === "scanning" ? (
            <>
              <span className="rs-spinner" />
              Scanning...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 4.5V7L8.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Scan Repo
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {scanState === "error" && errorMsg && (
        <div className="rs-error animate-fade-in-up">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="#f87171" strokeWidth="1.2" />
            <path d="M7 4v3.5M7 9.5h.01" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Streaming Log */}
      {scanLog.length > 0 && (
        <div className="rs-scan-log" style={{
          background: "rgba(0,0,0,0.3)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          fontFamily: "monospace",
          fontSize: "0.8125rem",
          lineHeight: 1.8,
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {scanLog.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.startsWith("✓")
                  ? "#34d399"
                  : line.startsWith("⚠")
                  ? "#fbbf24"
                  : line.startsWith("✗")
                  ? "#f87171"
                  : "var(--color-text-secondary)",
                animation: "fadeInLine 0.2s ease-out",
                opacity: 1,
              }}
            >
              {line}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* New scan results */}
      {scanState === "done" && files.length > 0 && (
        <div className="rs-results animate-fade-in-up">
          <div className="rs-results-header">
            <span className="rs-results-label">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {files.length} file{files.length !== 1 ? "s" : ""} from README scope in{" "}
              <code className="rs-repo-name">
                {currentRepoUrl.replace("https://github.com/", "")}
              </code>
            </span>
            <button className="rs-rescan-btn" onClick={handleReset}>
              Scan another repo
            </button>
          </div>

          <div className="rs-agent-list">
            {files.map((file, idx) => {
              const lang = file.language ?? file.path.split(".").pop() ?? "unknown";
              return (
                <div key={file.path} className="rs-agent-card">
                  <div className="rs-agent-card-header">
                    <div className="rs-agent-name-row">
                      <span
                        className="rs-lang-badge"
                        style={{
                          background: `${LANG_COLORS[lang] ?? "#6b7280"}22`,
                          color: LANG_COLORS[lang] ?? "#6b7280",
                          borderColor: `${LANG_COLORS[lang] ?? "#6b7280"}44`,
                        }}
                      >
                        {LANG_LABELS[lang] ?? lang.toUpperCase()}
                      </span>
                      <span className="rs-agent-name">
                        {file.path.split("/").pop()}
                      </span>
                    </div>
                    <code className="rs-agent-filepath">{file.path}</code>
                  </div>
                  <button
                    id={`btn-audit-${idx}`}
                    className="rs-audit-btn"
                    onClick={() => onAuditAgent({
                      id: `agent-${btoa(file.path).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
                      name: file.path.split("/").pop() ?? "Unknown",
                      repoUrl: currentRepoUrl,
                      filePath: file.path,
                      content: file.content,
                      language: lang,
                      systemPrompt: "",
                      tools: [],
                      riskHints: [],
                    })}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1L1.5 2.8v5C1.5 10.8 3.7 12.7 6.5 13c2.8-.3 5-2.2 5-5.2v-5L6.5 1z"
                        stroke="currentColor" strokeWidth="1.3" fill="rgba(255,255,255,0.08)"/>
                      <path d="M4 6.5l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Audit this File
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Previously scanned repos */}
      {!loadingHistory && repos.length > 0 && scanState !== "done" && (
        <div className="rs-results animate-fade-in-up" style={{ marginTop: "1.5rem" }}>
          <div className="rs-results-header">
            <span className="rs-results-label">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="#60a5fa" strokeWidth="1.2" />
                <path d="M4 4h4M4 6h3" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Previously scanned repos ({repos.length})
            </span>
          </div>

          <div className="rs-agent-list">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="rs-agent-card"
                style={{ cursor: "pointer" }}
                onClick={() => handleSelectRepo(repo)}
              >
                <div className="rs-agent-card-header">
                  <div className="rs-agent-name-row">
                    <span className="rs-agent-name" style={{ fontSize: "1rem" }}>
                      {repo.repo}
                    </span>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        color: repo.auditedCount === repo.totalCount ? "#34d399" : "#60a5fa",
                        background: repo.auditedCount === repo.totalCount
                          ? "rgba(52,211,153,0.1)"
                          : "rgba(96,165,250,0.1)",
                        border: `1px solid ${repo.auditedCount === repo.totalCount
                          ? "rgba(52,211,153,0.25)"
                          : "rgba(96,165,250,0.25)"}`,
                        borderRadius: "999px",
                        padding: "0.125rem 0.5rem",
                        marginLeft: "0.5rem",
                      }}
                    >
                      {repo.auditedCount}/{repo.totalCount} audited
                    </span>
                  </div>
                  <code className="rs-agent-filepath">
                    {repo.repo_url.replace("https://github.com/", "")} &middot; Scanned {new Date(repo.scanned_at).toLocaleDateString()}
                  </code>
                </div>

                {/* File preview — first 3 files */}
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {repo.files.slice(0, 4).map((f) => (
                    <span
                      key={f.path}
                      style={{
                        fontSize: "0.6875rem",
                        fontFamily: "monospace",
                        padding: "0.125rem 0.375rem",
                        borderRadius: "4px",
                        background: f.audited ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.04)",
                        color: f.audited ? "#34d399" : "var(--color-text-muted)",
                        border: `1px solid ${f.audited ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {f.audited ? "✓ " : ""}{f.path.split("/").pop()}
                    </span>
                  ))}
                  {repo.files.length > 4 && (
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", padding: "0.125rem 0.375rem" }}>
                      +{repo.files.length - 4} more
                    </span>
                  )}
                </div>

                {/* View button hint */}
                <div style={{ marginTop: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#60a5fa",
                      fontWeight: 500,
                    }}
                  >
                    Click to view files &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading history */}
      {loadingHistory && (
        <div style={{
          textAlign: "center",
          padding: "2rem",
          color: "var(--color-text-muted)",
          fontSize: "0.8125rem",
        }}>
          Loading scan history...
        </div>
      )}
    </div>
  );
}
