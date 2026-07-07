import styles from "../docs.module.css";

export default function Limitations() {
  return (
    <section id="limitations" className={styles.docSection}>
      <div className={styles.docSectionHeader}>
        <h2 className={styles.sectionHeadline}>Known Limitations</h2>
        <p className={styles.sectionIntro}>
          Dobbies is under active development. The following limitations
          apply to the current version.
        </p>
      </div>

      <div className={styles.limitationList}>
        <div className={styles.limitationItem}>
          <span className={styles.limitationDot} style={{ background: "#f97316" }} />
          <div className={styles.limitationContent}>
            <div className={styles.limitationTitle}>
              Limited Sandbox Execution
            </div>
            <p className={styles.limitationDesc}>
              Dynamic red-teaming currently simulates attacks at the
              chat level (text-based), not through direct sandbox
              execution. Agent tool execution has not been tested in
              an isolated environment.
            </p>
          </div>
        </div>

        <div className={styles.limitationItem}>
          <span className={styles.limitationDot} style={{ background: "#f97316" }} />
          <div className={styles.limitationContent}>
            <div className={styles.limitationTitle}>
              Limited RAG Knowledge Base
            </div>
            <p className={styles.limitationDesc}>
              The security rule base covers 10 OWASP LLM Top 10
              categories using keyword matching. Coverage is being
              expanded incrementally to include specific CWE entries
              and more complex attack patterns.
            </p>
          </div>
        </div>

        <div className={styles.limitationItem}>
          <span className={styles.limitationDot} style={{ background: "#fbbf24" }} />
          <div className={styles.limitationContent}>
            <div className={styles.limitationTitle}>
              Multi-Agent Architecture
            </div>
            <p className={styles.limitationDesc}>
              Audits currently focus on single agents. Scenarios
              involving agent-to-agent communication or inter-agent
              injection are not yet fully supported.
            </p>
          </div>
        </div>

        <div className={styles.limitationItem}>
          <span className={styles.limitationDot} style={{ background: "#fbbf24" }} />
          <div className={styles.limitationContent}>
            <div className={styles.limitationTitle}>
              Non-LLM Attack Vectors
            </div>
            <p className={styles.limitationDesc}>
              Traditional attacks that don&apos;t go through the LLM
              (direct SQL injection, SSRF, network-level attacks) are
              outside the current audit scope.
            </p>
          </div>
        </div>

        <div className={styles.limitationItem}>
          <span className={styles.limitationDot} style={{ background: "#6b7280" }} />
          <div className={styles.limitationContent}>
            <div className={styles.limitationTitle}>
              Real-time Monitoring
            </div>
            <p className={styles.limitationDesc}>
              Audits are point-in-time snapshots. Dobbies does not
              yet support continuous monitoring or real-time anomaly
              detection on running agents.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
