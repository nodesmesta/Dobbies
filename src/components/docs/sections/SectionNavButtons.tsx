"use client";

import styles from "../docs.module.css";

const SECTION_ORDER = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "How Audit Works" },
  { id: "scores", label: "Score Guide" },
  { id: "owasp", label: "OWASP LLM Top 10" },
  { id: "config-guide", label: "Agent Config Guide" },
  { id: "guardrails", label: "Guardrail Outputs" },
  { id: "scope-bounds", label: "In-Scope vs Out-of-Scope" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
  { id: "limitations", label: "Limitations" },
  { id: "privacy", label: "Privacy Policy" },
  { id: "terms", label: "Terms of Service" },
];

export default function SectionNavButtons({
  activeSection,
  onSectionChange,
}: {
  activeSection: string;
  onSectionChange: (id: string) => void;
}) {
  const currentIdx = SECTION_ORDER.findIndex((s) => s.id === activeSection);
  const prev = currentIdx > 0 ? SECTION_ORDER[currentIdx - 1] : null;
  const next =
    currentIdx < SECTION_ORDER.length - 1
      ? SECTION_ORDER[currentIdx + 1]
      : null;

  return (
    <div className={styles.sectionNav}>
      {prev ? (
        <button
          className={`${styles.navBtn} ${styles.navBtnPrev}`}
          onClick={() => onSectionChange(prev.id)}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <div className={styles.navBtnText}>
            <span className={styles.navBtnDir}>Previous</span>
            <span className={styles.navBtnLabel}>{prev.label}</span>
          </div>
        </button>
      ) : (
        <div />
      )}

      {next ? (
        <button
          className={`${styles.navBtn} ${styles.navBtnNext}`}
          onClick={() => onSectionChange(next.id)}
        >
          <div className={styles.navBtnText}>
            <span className={styles.navBtnDir}>Next</span>
            <span className={styles.navBtnLabel}>{next.label}</span>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
