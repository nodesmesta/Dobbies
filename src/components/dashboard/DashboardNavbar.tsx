"use client";

import Link from "next/link";
import Image from "next/image";

interface DashboardNavbarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  assistantOpen: boolean;
  onToggleAssistant: () => void;
}

export default function DashboardNavbar({
  sidebarOpen,
  onToggleSidebar,
  assistantOpen,
  onToggleAssistant,
}: DashboardNavbarProps) {
  return (
    <header className="db-navbar">
      <div className="db-navbar-left">
        <button
          id="btn-sidebar-toggle"
          className="db-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="db-nav-logo">
          <div className="db-nav-logo-mark">
            <Image src="/dobbies.png" alt="Dobbies Logo" width={28} height={28} style={{ objectFit: "contain" }} />
          </div>
          <span className="db-nav-logo-name">Dobbies</span>
        </Link>
      </div>

      <div className="db-navbar-right">
        <div className="db-nav-status db-nav-status--desktop">
          <span className="streaming-dot" style={{ background: "#34d399" }} />
          <span className="db-nav-status-text">All Systems Operational</span>
        </div>
        {/* Assistant chat button */}
        <button
          id="btn-assistant"
          className="db-assistant-btn"
          data-active={assistantOpen}
          onClick={onToggleAssistant}
          aria-label="Open security assistant"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span className="db-assistant-btn-text">Assistant</span>
        </button>
      </div>
    </header>
  );
}
