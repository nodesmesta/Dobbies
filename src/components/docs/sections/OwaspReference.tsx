import securityRules from "@/lib/security-rules.json";
import styles from "../docs.module.css";
import { sevBadge } from "./docs-utils";

export default function OwaspReference() {
  return (
    <section id="owasp" className={styles.docSection}>
      <div className={styles.docSectionHeader}>
        <h2 className={styles.sectionHeadline}>
          OWASP LLM Top 10 Reference
        </h2>
        <p className={styles.sectionIntro}>
          Dobbies references the OWASP LLM Applications Top 10
          risk categories as its security rule base. Each rule has
          a severity level, keyword pattern, and specific remediation.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className={styles.owaspTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Description</th>
              <th>Keywords</th>
            </tr>
          </thead>
          <tbody>
            {(securityRules as any[]).map((rule: any) => (
              <tr key={rule.id}>
                <td>
                  <code className={styles.owaspCode}>{rule.id}</code>
                </td>
                <td style={{ fontWeight: 600, color: "#f3f4f6" }}>
                  {rule.category}
                </td>
                <td>
                  <span
                    className={`${styles.severityBadge} ${sevBadge(rule.severity)}`}
                  >
                    <span className={styles.badgeDot} />
                    {rule.severity}
                  </span>
                </td>
                <td>{rule.description}</td>
                <td>
                  {(rule.keywords as string[]).map((kw: string) => (
                    <span key={kw} className={styles.owaspKeyword}>
                      {kw}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
