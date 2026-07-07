import styles from "../docs.module.css";

export default function ConfigGuide() {
  return (
    <section id="config-guide" className={styles.docSection}>
      <div className={styles.docSectionHeader}>
        <h2 className={styles.sectionHeadline}>
          Agent Configuration Guide
        </h2>
        <p className={styles.sectionIntro}>
          To run an audit, Dobbies needs your agent configuration
          in JSON format. Below are the supported parameters and
          usage examples.
        </p>
      </div>

      <div className={styles.configGrid}>
        <div className={styles.configCard}>
          <div className={styles.configCardTitle}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            System Prompt
          </div>
          <p className={styles.configCardDesc}>
            The main instruction prompt for your agent. Dobbies
            analyzes this prompt for prompt injection and system
            prompt leakage vulnerabilities.
          </p>
        </div>
        <div className={styles.configCard}>
          <div className={styles.configCardTitle}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a78bfa"
              strokeWidth="2"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Tool Definitions
          </div>
          <p className={styles.configCardDesc}>
            List of functions/tools the agent can call. Dobbies
            checks for tool over-privilege, parameter tampering, and
            dangerous access patterns.
          </p>
        </div>
        <div className={styles.configCard}>
          <div className={styles.configCardTitle}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Guardrail Configuration
          </div>
          <p className={styles.configCardDesc}>
            Active guardrail settings (content filter, PII masking,
            rate limits). Dobbies validates gaps between configured
            guardrails and actual requirements.
          </p>
        </div>
        <div className={styles.configCard}>
          <div className={styles.configCardTitle}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Model Metadata
          </div>
          <p className={styles.configCardDesc}>
            LLM model information (provider, version, context
            window). Helps Dobbies tailor relevant attack scenarios
            for your agent.
          </p>
        </div>
      </div>

      <p
        className={styles.sectionIntro}
        style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}
      >
        Example agent configuration format for auditing:
      </p>
      <div className={styles.codeBlock}>{`{
  "agent": {
    "name": "CustomerSupportBot",
    "systemPrompt": "You are a helpful support agent...",
    "provider": "openai",
    "model": "gpt-4o",
    "contextWindow": 128000
  },
  "tools": [
    {
      "name": "readTicket",
      "description": "Read a support ticket by ID",
      "parameters": { "ticketId": "string" }
    }
  ],
  "guardrails": {
    "piiMasking": true,
    "contentFilter": "moderate",
    "maxToolTurns": 10,
    "rateLimit": "100/min"
  }
}`}</div>
    </section>
  );
}
