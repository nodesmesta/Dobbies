import Link from "next/link";
import styles from "./Scope.module.css";

export default function Scope() {
  return (
    <section id="scope" className={styles.section}>
      {/* Section header — centered */}
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <p className={styles.sectionLabel}>Scope &amp; Impact</p>
        <h2 className={styles.sectionHeadline}>Scope Coverage Matrix</h2>
        <p
          className={styles.sectionSubtext}
          style={{ maxWidth: "100%", textAlign: "center" }}
        >
          We categorize vulnerabilities by their business and protocol impact.
          Understanding our in-scope boundaries helps you know exactly what
          Dobbies defends against.
        </p>
      </div>

      {/* Two-column layout: In-Scope vs Out-of-Scope */}
      <div className={styles.scopeTypographicContainer}>
        <div className={styles.scopeColumn}>
          <h3 className={styles.scopeColumnTitle}>
            <span className={styles.scopeHighlightIn}>Focus Area</span>
            In-Scope Coverage
          </h3>
          <p className={styles.scopeColumnText}>
            Our auditing framework is exclusively calibrated for the unique
            attack surfaces of autonomous agents. We actively simulate prompt
            injections, evaluate the integrity of system instructions, test for
            unauthorized function calling loops, and detect the leakage of
            proprietary context from vector databases. If an exploit requires
            interacting with the agent&apos;s logic or orchestration layer, it
            is strictly within our testing purview.
          </p>
        </div>

        <div className={styles.scopeColumnDivider} />

        <div className={styles.scopeColumn}>
          <h3 className={styles.scopeColumnTitle}>
            <span className={styles.scopeHighlightOut}>Boundaries</span>
            Out-of-Scope Impact
          </h3>
          <p className={styles.scopeColumnText}>
            We do not replicate traditional network scanners. Intrusions
            targeting underlying server infrastructure, Kubernetes cluster
            misconfigurations, standard frontend web vulnerabilities, or base
            model parameter extraction are explicitly excluded. Our focus
            remains resolutely on the agentic behavior — leaving traditional
            cloud boundaries to your existing security protocols.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className={styles.scopeAction}>
        <Link
          href="/docs#scope-bounds"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.scopeDocsBtn}
        >
          Read Docs
        </Link>
      </div>
    </section>
  );
}
