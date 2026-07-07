"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { GitHubConnectionInfo } from "@/types/github";
import { createClient } from "@/utils/supabase/client";

interface NavProfileMenuProps {
  githubConnection: GitHubConnectionInfo;
  onGoToSettings: () => void;
}

export default function NavProfileMenu({
  githubConnection,
  onGoToSettings,
}: NavProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const { connected, username } = githubConnection;
  const displayName = username ?? "User";
  const initial = displayName[0].toUpperCase();

  return (
    <div className="nav-profile-root" ref={rootRef}>
      {/* ── Sidebar row trigger ── */}
      <button
        className="nav-profile-sidebar-trigger"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Avatar */}
        <div className="nav-profile-avatar-sm">
          <span>{initial}</span>
          {connected && <span className="nav-profile-connected-dot" aria-hidden="true" />}
        </div>

        {/* Name + status */}
        <div className="nav-profile-sidebar-info">
          <span className="nav-profile-sidebar-name">
            {connected && username ? `@${username}` : "Guest User"}
          </span>
          <span className="nav-profile-sidebar-sub">
            {connected ? "GitHub connected" : "Connect GitHub"}
          </span>
        </div>

        {/* Chevron */}
        <svg
          className="nav-profile-chevron"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Dropdown (opens upward) ── */}
      {open && (
        <div className="nav-profile-dropdown nav-profile-dropdown--up" role="menu" aria-label="Profile menu">
          {/* Identity block */}
          <div className="nav-profile-identity">
            <div className="nav-profile-identity-avatar">
              <span>{initial}</span>
            </div>
            <div className="nav-profile-identity-info">
              <span className="nav-profile-identity-name">
                {connected && username ? `@${username}` : "Guest User"}
              </span>
              <span className="nav-profile-identity-sub">
                {connected ? "GitHub connected" : "Not connected"}
              </span>
            </div>
            {connected && (
              <span className="nav-profile-connected-badge">
                <svg width="7" height="7" viewBox="0 0 7 7" fill="none" aria-hidden="true">
                  <circle cx="3.5" cy="3.5" r="3.5" fill="#34d399" />
                </svg>
                Live
              </span>
            )}
          </div>

          <div className="nav-profile-divider" />

          {/* Menu items */}
          <nav className="nav-profile-menu-list" aria-label="Profile actions">
            {/* GitHub */}
            <button
              className="nav-profile-menu-item"
              role="menuitem"
              onClick={() => { setOpen(false); onGoToSettings(); }}
            >
              <svg className="nav-profile-menu-icon" viewBox="0 0 16 16" fill="none">
                <path
                  fillRule="evenodd" clipRule="evenodd"
                  d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.22.48-2.68-1.07-2.68-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.82 1.23.82.71 1.22 1.87.87 2.33.66.07-.51.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.42 7.42 0 018 3.87c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z"
                  fill="currentColor"
                />
              </svg>
              <span>GitHub Account</span>
              <span
                className="nav-profile-menu-badge"
                style={connected
                  ? { background: "rgba(52,211,153,0.12)", color: "#34d399", borderColor: "rgba(52,211,153,0.25)" }
                  : { background: "rgba(251,191,36,0.1)", color: "#fbbf24", borderColor: "rgba(251,191,36,0.25)" }
                }
              >
                {connected ? "Connected" : "Not connected"}
              </span>
            </button>

            {/* Docs */}
            <a
              className="nav-profile-menu-item"
              role="menuitem"
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <svg className="nav-profile-menu-icon" viewBox="0 0 16 16" fill="none">
                <path d="M3 2h8l2 2v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" />
                <path d="M5 6h6M5 9h6M5 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span>Documentation</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: "auto", opacity: 0.4 }}>
                <path d="M2 8L8 2M4.5 2H8v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            {/* What's New */}
            <a
              className="nav-profile-menu-item"
              role="menuitem"
              href="/"
              onClick={() => setOpen(false)}
            >
              <svg className="nav-profile-menu-icon" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>What&apos;s New</span>
            </a>
          </nav>

          <div className="nav-profile-divider" />

          {/* Footer action — Sign Out */}
          <div className="nav-profile-footer">
            <button
              className="nav-profile-menu-item nav-profile-menu-item--danger"
              role="menuitem"
              disabled={signingOut}
              onClick={handleSignOut}
            >
              <svg className="nav-profile-menu-icon" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
                  stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{signingOut ? "Signing out…" : "Sign Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
