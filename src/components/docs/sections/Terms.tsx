import styles from "../docs.module.css";

export default function Terms() {
  return (
    <section id="terms" className={styles.docSection}>
      <div className={styles.introSection}>
        <h1 className={styles.mainTitle}>Terms of Service</h1>
        <p className={styles.mainSubtext}>
          Last updated: July 2026
        </p>
      </div>

      <div className={styles.sectionCard} style={{ marginTop: "2rem" }}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Dobbies (&ldquo;the Service&rdquo;), you agree to
          be bound by these Terms of Service.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>2. Description of Service</h2>
        <p>
          Dobbies provides automated AI agent security auditing, including static
          analysis, red-team simulation, and vulnerability reporting.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>3. User Responsibilities</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account
          and for all activities that occur under your account.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>4. Limitation of Liability</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any
          kind. We are not liable for damages arising from use of the Service.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>5. Contact</h2>
        <p>
          For questions about these terms, please contact the project maintainers.
        </p>
      </div>
    </section>
  );
}
