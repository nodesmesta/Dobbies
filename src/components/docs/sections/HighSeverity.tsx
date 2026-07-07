import styles from "../docs.module.css";
import SeveritySection from "./SeveritySection";

export default function HighSeverity() {
  return (
    <section id="high" className={styles.docSection}>
      <SeveritySection
        severityLabel="High"
        title="Data &amp; Architecture Leakage"
        intro="Vulnerabilities that result in structural data leakage, exposure of proprietary base system prompts, confidential training documentation, configuration blueprints, or internal database metadata."
        vulnerabilities={[
          {
            label: "Base Prompt Leakage",
            desc: "Extraction of proprietary agent directives and boundary instructions through indirect payload formatting.",
          },
          {
            label: "Confidential RAG Retrieval",
            desc: "Tricking the agent&apos;s vector retriever to fetch files or document chunks outside the user&apos;s role boundaries.",
          },
          {
            label: "Architecture Blueprint Exposure",
            desc: "Leakage of internal API hooks, environment file locations, or code repositories.",
          },
        ]}
        impactTitle="DATA IMPACT"
        impactDesc="Intellectual property (IP) theft and complete disclosure of system design. Revealing prompt configurations makes it significantly easier for attackers to design precise, complex exploit strategies."
        remediation="Apply LLM-based output filters (e.g., Llama Guard custom categories) specifically checking for prompt instruction phrases or file structure references. Enable strict role-based access control (RBAC) on the vector database retrieval paths."
        badgeClass={styles.badgeHigh}
        impactBoxClass={styles.impactBoxHigh}
        impactTitleClass={styles.impactTitleHigh}
        detailCardClass={styles.detailCardHigh}
      />
    </section>
  );
}
