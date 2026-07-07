"use client";

import styles from "./docs.module.css";

interface SidebarItem {
  href: string;
  label: string;
  sub?: boolean;
}

interface SidebarGroup {
  group: string;
  items: SidebarItem[];
}

const NAV_SECTIONS: SidebarGroup[] = [
  {
    group: "Getting Started",
    items: [
      { href: "overview", label: "Overview" },
      { href: "pipeline", label: "How Audit Works" },
      { href: "scores", label: "Score Guide" },
    ],
  },
  {
    group: "Reference",
    items: [
      { href: "owasp", label: "OWASP LLM Top 10" },
      { href: "config-guide", label: "Agent Config Guide" },
      { href: "guardrails", label: "Guardrail Outputs" },
    ],
  },
  {
    group: "Scope & Severity",
    items: [
      { href: "scope-bounds", label: "In-Scope vs Out-of-Scope", sub: false },
      { href: "critical", label: "Critical", sub: true },
      { href: "high", label: "High", sub: true },
      { href: "medium", label: "Medium", sub: true },
      { href: "low", label: "Low", sub: true },
    ],
  },
  {
    group: "Limits",
    items: [
      { href: "limitations", label: "Limitations" },
    ],
  },
  {
    group: "Legal",
    items: [
      { href: "privacy", label: "Privacy Policy" },
      { href: "terms", label: "Terms of Service" },
    ],
  },
];

export default function DocsSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: string;
  onSectionChange: (id: string) => void;
}) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    onSectionChange(id);
  }

  return (
    <aside className={styles.docsSidebar}>
      <div className={styles.sidebarInner}>
        {NAV_SECTIONS.map((group) => (
          <div key={group.group} className={styles.sidebarGroup}>
            <div className={styles.sidebarGroupTitle}>{group.group}</div>
            <nav className={styles.sidebarNav}>
              {group.items.map((item) => {
                const isActive = activeSection === item.href;
                const className = item.sub ? styles.sidebarSubLink : styles.sidebarLink;
                return (
                  <a
                    key={item.href}
                    href={`#${item.href}`}
                    className={`${className}${isActive ? ` ${styles.sidebarLinkActive}` : ""}`}
                    onClick={(e) => handleClick(e, item.href)}
                    data-active={isActive || undefined}
                  >
                    {item.sub && (
                      <span className={styles.subBullet} aria-hidden="true" />
                    )}
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}
