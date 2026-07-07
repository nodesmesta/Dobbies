import styles from "../docs.module.css";
import SeveritySection from "./SeveritySection";

export default function LowSeverity() {
  return (
    <section id="low" className={styles.docSection}>
      <SeveritySection
        severityLabel="Low"
        title="Formatting &amp; Minor Drift"
        intro="Validation issues, syntax errors, and minor deviations below DoS level that affect UI presentation or slightly drift from alignment instructions."
        vulnerabilities={[
          {
            label: "Malformed Payload Outputs",
            desc: "Failing to deliver valid JSON or XML syntax, disrupting client parsing.",
          },
          {
            label: "Model Hallucinations",
            desc: "Outputting non-existent variables, facts, or incorrect schemas that are non-destructive.",
          },
          {
            label: "Compliance Guidelines Drift",
            desc: "Slight deviation in tone, formatting style, or minor system constraints.",
          },
        ]}
        impactTitle="USER EXPERIENCE IMPACT"
        impactDesc="Minor parsing errors causing downstream frontend client crashes (e.g., failed to read JSON fields) and minor user experience (UX) inconsistencies."
        remediation="Use structured outputs (JSON schema constraints or frameworks like Instructor/Pydantic) to force validation. Wrap client-side parsers in try-catch blocks to prevent frontend crashes, showing clean error fallback cards."
        badgeClass={styles.badgeLow}
        impactBoxClass={styles.impactBoxLow}
        impactTitleClass={styles.impactTitleLow}
        detailCardClass={styles.detailCardLow}
      />
    </section>
  );
}
