import styles from "../docs.module.css";

export default function ScopeBounds() {
  return (
    <section id="scope-bounds" className={styles.docSection}>
      <div className={styles.docSectionHeader}>
        <h2 className={styles.sectionHeadline}>
          In-Scope vs Out-of-Scope Coverage
        </h2>
        <p className={styles.sectionIntro}>
          Understanding the boundaries of Dobbies&apos; audit ensures you
          know exactly which system layers are actively simulated and
          tested.
        </p>
      </div>

      <div className={styles.sectionGrid}>
        <div className={`${styles.detailCard} ${styles.detailCardHigh}`}>
          <div
            className={styles.cardTitle}
            style={{
              color: "#10b981",
              borderBottomColor: "rgba(16, 185, 129, 0.2)",
            }}
          >
            IN-SCOPE (Covered)
          </div>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <span className={styles.bulletDot} style={{ background: "#10b981" }} />
              <strong>Agent Interaction Layer:</strong> Prompt injections,
              system instruction overrides, and conversational role
              breakages.
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.bulletDot} style={{ background: "#10b981" }} />
              <strong>Tool/Function Calling:</strong> Unauthorized tool
              usage, infinite loop exploitation, parameter tampering.
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.bulletDot} style={{ background: "#10b981" }} />
              <strong>Data Context Layer:</strong> Leakage of proprietary
              RAG knowledge base data or hardcoded configuration keys
              within prompts.
            </li>
          </ul>
        </div>

        <div className={`${styles.detailCard} ${styles.detailCardCritical}`}>
          <div className={styles.cardTitle} style={{ color: "#6b7280" }}>
            OUT-OF-SCOPE (Not Covered)
          </div>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <span className={styles.bulletDot} />
              <strong>Underlying Infrastructure:</strong> Server-level
              misconfigurations, Kubernetes exploits, or cloud provider
              (AWS/GCP) breaches.
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.bulletDot} />
              <strong>Traditional Web Vulns:</strong> Standard SQL
              injection (unless executed via agent tool), XSS, or CSRF on
              the frontend client.
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.bulletDot} />
              <strong>Model Weight Extraction:</strong> Base model
              parameter/weight stealing or fine-tuning data poisoning
              prior to deployment.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
