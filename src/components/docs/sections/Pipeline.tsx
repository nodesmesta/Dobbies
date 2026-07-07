import styles from "../docs.module.css";

export default function Pipeline() {
  return (
    <section id="pipeline" className={styles.docSection}>
      <div className={styles.docSectionHeader}>
        <h2 className={styles.sectionHeadline}>How the Audit Works</h2>
        <p className={styles.sectionIntro}>
          Every audit runs through four sequential stages. Each stage&apos;s
          output feeds into the next.
        </p>
      </div>

      <div className={styles.pipelineGrid}>
        <div className={styles.pipelineCard}>
          <div className={styles.pipelineStep}>Stage</div>
          <h3 className={styles.pipelineTitle}>
            Config &amp; Rules Ingestion
          </h3>
          <p className={styles.pipelineDesc}>
            Agent configuration (system prompt, tool definitions, guardrails)
            is parsed and matched against 10+ OWASP rules using RAG-based
            retrieval. Each rule scans for keywords, patterns, and anomalies
            in the configuration.
          </p>
        </div>

        <div className={styles.pipelineCard}>
          <div className={styles.pipelineStep}>Stage</div>
          <h3 className={styles.pipelineTitle}>Static Analysis</h3>
          <p className={styles.pipelineDesc}>
            Deep inspection of the configuration without executing the
            agent. Detects prompt injection, tool over-privilege, sensitive
            data exposure, and guardrail gaps.
          </p>
        </div>

        <div className={styles.pipelineCard}>
          <div className={styles.pipelineStep}>Stage</div>
          <h3 className={styles.pipelineTitle}>
            Dynamic Red-Teaming
          </h3>
          <p className={styles.pipelineDesc}>
            Multi-turn chat simulation: 15&ndash;25 automated attack
            scenarios are sent to the agent to test resilience against
            jailbreak, role-play exploitation, and excessive agency.
          </p>
        </div>

        <div className={styles.pipelineCard}>
          <div className={styles.pipelineStep}>Stage</div>
          <h3 className={styles.pipelineTitle}>
            Scoring &amp; Remediation
          </h3>
          <p className={styles.pipelineDesc}>
            Static score (0&ndash;100) + dynamic score (0&ndash;100) are
            combined into an overall score. Each finding includes a
            specific remediation and severity label.
          </p>
        </div>
      </div>
    </section>
  );
}
