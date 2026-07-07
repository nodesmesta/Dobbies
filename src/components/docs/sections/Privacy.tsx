import styles from "../docs.module.css";

export default function Privacy() {
  return (
    <section id="privacy" className={styles.docSection}>
      <div className={styles.introSection}>
        <h1 className={styles.mainTitle}>Privacy Policy</h1>
        <p className={styles.mainSubtext}>
          Last updated: July 2026
        </p>
      </div>

      <div className={styles.sectionCard} style={{ marginTop: "2rem" }}>
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide when signing in via OAuth providers
          (GitHub, Google) including your name, email address, and avatar URL.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>2. How We Use Information</h2>
        <p>
          We use your information to provide the Service, process audit reports, and
          improve our platform. We do not sell your personal data.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>3. Data Storage</h2>
        <p>
          Audit reports and user data are stored in secure Supabase infrastructure.
          You may request deletion of your data at any time.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>4. Third-Party Services</h2>
        <p>
          We use Supabase for authentication and database, GitHub API for
          repository scanning, and OpenAI for LLM-powered analysis.
        </p>
      </div>

      <div className={styles.sectionCard}>
        <h2>5. Contact</h2>
        <p>
          For privacy-related inquiries, please contact the project maintainers.
        </p>
      </div>
    </section>
  );
}
