"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <section
      className={styles.hero}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={
        {
          "--mouse-x": `${mousePos.x}px`,
          "--mouse-y": `${mousePos.y}px`,
        } as React.CSSProperties
      }
    >
      <div className={styles.bgGrid} />
      <div className={styles.bgGlow} />
      <div
        className={styles.heroBgGlowTracker}
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Automated AI Security Auditor
        </div>

        <h1 className={styles.heroHeadline}>
          Audit Your AI Agent{" "}
          <span className={styles.heroHeadlineAccent}>
            Before It Attacks You
          </span>
        </h1>

        <p className={styles.heroSubheadline}>
          RAG-powered static analysis combined with real-time multi-turn AI vs AI
          red-teaming simulation to surface vulnerabilities, logic bugs, and missing
          guardrails in your agent configuration — before reaching production.
        </p>

        <div className={styles.heroActions}>
          <Link
            href="/dashboard"
            className={`${styles.btnLarge} ${styles.btnLargePrimary}`}
          >
            Start Auditing
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.btnLarge} ${styles.btnLargeOutline}`}
          >
            View on GitHub
          </a>
        </div>
      </div>

      <a
        href="#capabilities"
        className={styles.heroScrollIndicator}
        aria-label="Scroll down"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
}
