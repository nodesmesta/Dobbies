"use client";

import type { GitHubConnectionInfo } from "@/types/github";

// Re-export for backward compat with any existing consumers.
export type { GitHubConnectionInfo };

interface SettingsPanelProps {
  githubConnection: GitHubConnectionInfo;
  /** Async connect action — managed by useGitHubConnection hook in the parent. */
  onConnect: () => Promise<void>;
  /** Async disconnect action — managed by useGitHubConnection hook in the parent. */
  onDisconnect: () => Promise<void>;
  connecting?: boolean;
  disconnecting?: boolean;
}

export default function SettingsPanel({
  githubConnection,
  onConnect,
  onDisconnect,
  connecting = false,
  disconnecting = false,
}: SettingsPanelProps) {

  const { connected, username, avatarUrl, connectedAt } = githubConnection;

  return (
    <div className="db-settings-panel animate-fade-in-up">

      {/* ── GitHub Connection Section ── */}
      <div className="db-settings-section">
        <div className="db-settings-section-title">GitHub Connection</div>

        {/* Provider row */}
        <div className="db-account-provider-row">
          {/* GitHub icon */}
          <div className="db-account-provider-icon db-account-provider-icon--github">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </div>

          {/* Info */}
          <div className="db-account-provider-info">
            <span className="db-account-provider-name">GitHub</span>
            {connected && username ? (
              <span className="db-account-provider-sub">@{username}</span>
            ) : (
              <span className="db-account-provider-sub">
                Connect to scan your own repositories
              </span>
            )}
          </div>

          {/* Status badge */}
          {connected ? (
            <span className="db-account-provider-status db-account-provider-status--connected">
              <span className="db-account-provider-dot" />
              Connected
            </span>
          ) : (
            <span
              className="db-account-provider-status"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span
                className="db-account-provider-dot"
                style={{ background: "var(--color-text-muted)" }}
              />
              Not connected
            </span>
          )}
        </div>

        {/* Connected state: show detail + disconnect */}
        {connected && username && (
          <div className="db-settings-row">
            <div className="db-settings-row-info">
              <span className="db-settings-row-label">Connected Account</span>
              <span className="db-settings-row-hint">
                Repositories from{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  @{username}
                </strong>{" "}
                are accessible for scanning.
                {connectedAt && (
                  <> Connected on {new Date(connectedAt).toLocaleDateString()}.</>
                )}
              </span>
            </div>

            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                width={36}
                height={36}
                style={{
                  borderRadius: "50%",
                  border: "1px solid rgba(52,211,153,0.3)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div className="db-account-avatar" style={{ width: 36, height: 36 }}>
                <span
                  className="db-account-avatar-letter"
                  style={{ fontSize: "1rem" }}
                >
                  {username[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Scope info row */}
        <div className="db-settings-row">
          <div className="db-settings-row-info">
            <span className="db-settings-row-label">Required Permissions</span>
            <span className="db-settings-row-hint">
              Dobbies requests <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 4 }}>repo</code> and{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", background: "rgba(255,255,255,0.07)", padding: "1px 5px", borderRadius: 4 }}>read:user</code>{" "}
              scopes — only to read your repositories. No write access is requested.
            </span>
          </div>
        </div>

        {/* Connect / Disconnect action */}
        <div className="db-settings-row">
          <div className="db-settings-row-info">
            <span className="db-settings-row-label">
              {connected ? "Disconnect GitHub" : "Connect GitHub"}
            </span>
            <span className="db-settings-row-hint">
              {connected
                ? "Disconnecting will prevent new repo scans until you reconnect."
                : "Connect your GitHub account to start scanning your repositories."}
            </span>
          </div>

          {connected ? (
            <button
              className="db-settings-btn-danger db-settings-btn-danger--outline"
              onClick={onDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: "1.5px solid rgba(248,113,113,0.4)",
                      borderTopColor: "#f87171",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Disconnecting...
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path
                      d="M2 2l9 9M11 2L2 11"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  Disconnect
                </>
              )}
            </button>
          ) : (
            <button
              className="btn-primary"
              style={{ fontSize: "0.8125rem", padding: "0.4rem 0.875rem" }}
              onClick={onConnect}
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: "1.5px solid rgba(52,211,153,0.3)",
                      borderTopColor: "#34d399",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  Connect GitHub
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Info callout jika belum connect ── */}
      {!connected && (
        <div
          style={{
            background: "rgba(251,191,36,0.06)",
            border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            display: "flex",
            gap: "0.875rem",
            alignItems: "flex-start",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <path
              d="M8 1.5L1 14h14L8 1.5z"
              stroke="#fbbf24"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M8 6v3.5M8 11h.01"
              stroke="#fbbf24"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fbbf24",
              }}
            >
              GitHub connection required to scan repos
            </span>
            <span
              style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}
            >
              Connect your GitHub account above to enable repository scanning.
              This ensures only your own repositories are accessible — Dobbies
              cannot access repos you don&apos;t own.
            </span>
          </div>
        </div>
      )}

      {/* ── Connected callout ── */}
      {connected && (
        <div
          style={{
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.18)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.25rem",
            display: "flex",
            gap: "0.875rem",
            alignItems: "flex-start",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <circle cx="8" cy="8" r="6.5" stroke="#34d399" strokeWidth="1.3" />
            <path
              d="M5 8l2.5 2.5L11 5.5"
              stroke="#34d399"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#34d399",
              }}
            >
              GitHub connected — ready to scan
            </span>
            <span
              style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}
            >
              You can now scan repositories from{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                @{username}
              </strong>
              . Go to{" "}
              <strong style={{ color: "var(--color-text-primary)" }}>
                Scan Repo
              </strong>{" "}
              to get started.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
