import styles from "../docs.module.css";
import SeveritySection from "./SeveritySection";

export default function CriticalSeverity() {
  return (
    <section id="critical" className={styles.docSection}>
      <SeveritySection
        severityLabel="Critical"
        title="Protocol &amp; Key Compromise"
        intro="Direct security threats that immediately compromise user credentials, master API keys, cryptographic secrets, or protocol state security. If breached, these represent immediate unauthorized operations or financial losses."
        vulnerabilities={[
          {
            label: "Cryptographic Key Extraction",
            desc: "Unauthorized retrieval of private wallet keys, database master secrets, or core signatures from memory.",
          },
          {
            label: "Session Hijacking via Manipulation",
            desc: "Tricking the agent into disclosing active user session tokens or OAuth keys.",
          },
          {
            label: "Unauthorized State Injection",
            desc: "Forcing the agent to invoke admin-level state tools, modifying core configurations or parameters.",
          },
        ]}
        impactTitle="CORE PROTOCOL IMPACT"
        impactDesc="Direct financial protocol losses, full user wallet/account drain, and complete loss of system integrity and protocol trust. Penetrators can act directly as administrative handlers."
        remediation="Strictly isolate sensitive keys behind external hardware security modules (HSM) or secure key managers. Never allow the LLM to access raw keys in its prompt context or direct tools. Implement multi-signature safeguards on any administrative state transactions."
        badgeClass={styles.badgeCritical}
        impactBoxClass={styles.impactBoxCritical}
        impactTitleClass={styles.impactTitleCritical}
        detailCardClass={styles.detailCardCritical}
      />
    </section>
  );
}
