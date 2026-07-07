"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../../components/docs/docs.module.css";
import DocsSidebar from "@/components/docs/DocsSidebar";

import Overview from "@/components/docs/sections/Overview";
import Pipeline from "@/components/docs/sections/Pipeline";
import ScoreGuide from "@/components/docs/sections/ScoreGuide";
import OwaspReference from "@/components/docs/sections/OwaspReference";
import ConfigGuide from "@/components/docs/sections/ConfigGuide";
import GuardrailOutputs from "@/components/docs/sections/GuardrailOutputs";
import ScopeBounds from "@/components/docs/sections/ScopeBounds";
import CriticalSeverity from "@/components/docs/sections/CriticalSeverity";
import HighSeverity from "@/components/docs/sections/HighSeverity";
import MediumSeverity from "@/components/docs/sections/MediumSeverity";
import LowSeverity from "@/components/docs/sections/LowSeverity";
import Limitations from "@/components/docs/sections/Limitations";
import Privacy from "@/components/docs/sections/Privacy";
import Terms from "@/components/docs/sections/Terms";
import SectionNavButtons from "@/components/docs/sections/SectionNavButtons";

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  overview: Overview,
  pipeline: Pipeline,
  scores: ScoreGuide,
  owasp: OwaspReference,
  "config-guide": ConfigGuide,
  guardrails: GuardrailOutputs,
  "scope-bounds": ScopeBounds,
  critical: CriticalSeverity,
  high: HighSeverity,
  medium: MediumSeverity,
  low: LowSeverity,
  limitations: Limitations,
  privacy: Privacy,
  terms: Terms,
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && SECTION_COMPONENTS[hash]) {
        setActiveSection(hash);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSectionChange = (id: string) => {
    setActiveSection(id);
    window.history.pushState(null, "", `#${id}`);
    
    // Scroll content container to top
    const content = document.querySelector(`.${styles.docsContent}`);
    if (content) {
      content.scrollTop = 0;
    }
  };

  const SectionComponent = SECTION_COMPONENTS[activeSection];

  return (
    <div className={styles.docsPage}>
      {/* ─── Header ─── */}
      <header className={styles.docsHeader}>
        <Link href="/" className={styles.logoArea}>
          <Image src="/dobbies.png" alt="Dobbies Logo" width={24} height={24} />
          <span>Dobbies Docs</span>
        </Link>
        <Link href="/" className={styles.backHomeBtn}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </Link>
      </header>

      {/* ─── Body ─── */}
      <div className={styles.docsBody}>
        <DocsSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        {/* ─────── CONTENT ─────── */}
        <main className={styles.docsContent}>
          <div className={styles.docsContainer}>
            {SectionComponent ? <SectionComponent /> : null}
            <SectionNavButtons
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
