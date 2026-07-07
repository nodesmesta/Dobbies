import styles from "../docs.module.css";

export default function Overview() {
  return (
    <section id="overview" className={styles.docSection}>
      <div className={styles.introSection}>
        <h1 className={styles.mainTitle}>Dobbies Documentation</h1>
        <p className={styles.mainSubtext}>
          Dobbies is an <strong>Automated AI Agent Security Auditor</strong>{" "}
          platform that combines{" "}
          <strong>RAG-powered static analysis</strong> with{" "}
          <strong>multi-turn red-teaming simulation</strong> to
          comprehensively evaluate AI agent security — from prompt
          injection to excessive agency.
        </p>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <p className={styles.sectionIntro}>
          Each audit simulates dozens of attack scenarios across all 10
          OWASP LLM Top 10 risk categories, producing a comprehensive
          report that includes a static score (configuration analysis), a
          dynamic score (attack simulation), and granular remediation
          recommendations. This documentation explains the audit pipeline,
          score interpretation, security rule references, and how to
          configure your agent for auditing.
        </p>
      </div>
    </section>
  );
}
