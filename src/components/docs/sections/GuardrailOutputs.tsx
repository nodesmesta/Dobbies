import styles from "../docs.module.css";

export default function GuardrailOutputs() {
  return (
    <section id="guardrails" className={styles.docSection}>
      <div className={styles.docSectionHeader}>
        <h2 className={styles.sectionHeadline}>
          Guardrail Outputs Explained
        </h2>
        <p className={styles.sectionIntro}>
          After an audit, Dobbies recommends specific guardrails
          to close the security gaps found. Below are the supported
          guardrail types.
        </p>
      </div>

      <div className={styles.guardrailGrid}>
        <div className={styles.guardrailCard}>
          <div className={styles.guardrailCardHeader}>
            <div className={`${styles.guardrailIcon} ${styles.guardrailIconGreen}`}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className={styles.guardrailTypeName}>Content Filter</div>
              <div className={styles.guardrailTypeSub}>
                Llama Guard / OpenAI Mod
              </div>
            </div>
          </div>
          <p className={styles.guardrailPurpose}>
            Filters agent output for harmful content, PII, prompt
            injection, and jailbreak attempts.
          </p>
          <div className={styles.guardrailSample}>{`{
  "type": "content_filter",
  "categories": [
    "hate", "violence",
    "sexual", "pii"
  ],
  "action": "block"
}`}</div>
        </div>

        <div className={styles.guardrailCard}>
          <div className={styles.guardrailCardHeader}>
            <div className={`${styles.guardrailIcon} ${styles.guardrailIconPurple}`}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className={styles.guardrailTypeName}>Rate Limiter</div>
              <div className={styles.guardrailTypeSub}>
                Token &amp; Request Caps
              </div>
            </div>
          </div>
          <p className={styles.guardrailPurpose}>
            Prevents DoS, context window flooding, and excessive
            token consumption by malicious users.
          </p>
          <div className={styles.guardrailSample}>{`{
  "type": "rate_limiter",
  "maxRequestsPerMin": 60,
  "maxTokensPerSession": 32000,
  "maxToolTurns": 10
}`}</div>
        </div>

        <div className={styles.guardrailCard}>
          <div className={styles.guardrailCardHeader}>
            <div className={`${styles.guardrailIcon} ${styles.guardrailIconAmber}`}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <div className={styles.guardrailTypeName}>PII Masking</div>
              <div className={styles.guardrailTypeSub}>
                Regex &amp; ML-based Redaction
              </div>
            </div>
          </div>
          <p className={styles.guardrailPurpose}>
            Detects and redacts sensitive data (email, API keys,
            SSN, token) from agent output before delivery.
          </p>
          <div className={styles.guardrailSample}>{`{
  "type": "pii_masker",
  "patterns": [
    "email", "phone",
    "ssn", "api_key"
  ],
  "maskChar": "***"
}`}</div>
        </div>
      </div>
    </section>
  );
}
