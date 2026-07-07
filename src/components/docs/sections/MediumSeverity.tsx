import styles from "../docs.module.css";
import SeveritySection from "./SeveritySection";

export default function MediumSeverity() {
  return (
    <section id="medium" className={styles.docSection}>
      <SeveritySection
        severityLabel="Medium"
        title="Denial of Service (DoS)"
        intro="Exploits designed to deplete computing resources, consume excess operational budget, trigger infinite loops, or crash active agent session runtimes."
        vulnerabilities={[
          {
            label: "Infinite Recursive Tool Loops",
            desc: "Tricking the agent into a state where it continuously triggers internal tools without terminal conditions.",
          },
          {
            label: "Context Window Flooding",
            desc: "Feeding excessively large, repetitive payloads to lock the agent memory buffer and exceed token rate-limits.",
          },
          {
            label: "Request Concurrency Spamming",
            desc: "Flooding the agent&apos;s chat interface to trigger timeouts and deny service to legitimate requests.",
          },
        ]}
        impactTitle="OPERATIONAL IMPACT"
        impactDesc="Extreme API billing token spikes in short periods, temporary server/agent runtime unavailability for legitimate users, and resource degradation across dependent platform features."
        remediation="Configure hard timeouts and maximum execution step limits (e.g. max 5 tool turns per agent query). Implement strict client-side rate limits and input length caps before forwarding queries to the LLM."
        badgeClass={styles.badgeMedium}
        impactBoxClass={styles.impactBoxMedium}
        impactTitleClass={styles.impactTitleMedium}
        detailCardClass={styles.detailCardMedium}
      />
    </section>
  );
}
