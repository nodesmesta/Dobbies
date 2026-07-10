import styles from "../docs.module.css";

export default function AgentScanScope() {
  return (
    <section id="scan-scope" className={styles.docSection}>
      <div className={styles.docSectionHeader}>
        <h2 className={styles.sectionHeadline}>Agent Scan Scope</h2>
        <p className={styles.sectionIntro}>
          Dobbies discovers what to scan by reading your repository&apos;s
          README.md. The <code className={styles.owaspKeyword}>## Agent Scan Scope</code>{" "}
          section is the single source of truth &mdash; only files listed there are
          analyzed.
        </p>
      </div>

      <div className={styles.scoreFormulaBox}>
        <h3 className={styles.pipelineTitle}>How It Works</h3>
        <ol className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletDot} />
            <span>
              <strong>Declare</strong> &mdash; Add a{" "}
              <code className={styles.owaspKeyword}>## Agent Scan Scope</code>{" "}
              section to your project&apos;s README.md listing the files that
              define your AI agent.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletDot} />
            <span>
              <strong>Submit</strong> &mdash; Point Dobbies to your GitHub
              repository URL.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletDot} />
            <span>
              <strong>Parse</strong> &mdash; Dobbies fetches README.md and
              extracts the file list from the scan scope section.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletDot} />
            <span>
              <strong>Analyze</strong> &mdash; Every declared file is downloaded
              and fed into the static analysis + red-teaming pipeline.
            </span>
          </li>
        </ol>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 className={styles.pipelineTitle}>Syntax</h3>
        <div className={styles.codeBlock}>{`## Agent Scan Scope

- src/agent-config.ts
- prompts/system.md
- .cursorrules
- config/**/*.json`}</div>

        <div className={styles.owaspTable}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Rule</th>
                <th style={{ textAlign: "left", padding: "0.75rem 1rem", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "monospace", fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>Format</td>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", color: "#d1d5db", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  One file per line using markdown list syntax (<code className={styles.owaspKeyword}>-</code> or <code className={styles.owaspKeyword}>*</code>)
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "monospace", fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>Globs</td>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", color: "#d1d5db", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  Supported &mdash; <code className={styles.owaspKeyword}>**/*.ts</code>, <code className={styles.owaspKeyword}>config/**</code>, <code className={styles.owaspKeyword}>prompts/*.md</code>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "monospace", fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>Directories</td>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", color: "#d1d5db", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  Declaring a directory scans all files inside it recursively
                </td>
              </tr>
              <tr>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", fontFamily: "monospace", fontSize: "0.75rem", color: "#34d399", fontWeight: 600 }}>Boundaries</td>
                <td style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.03)", color: "#d1d5db", fontSize: "0.85rem", lineHeight: 1.5 }}>
                  Section ends at the next <code className={styles.owaspKeyword}>##</code> heading; sub-headings (<code className={styles.owaspKeyword}>###</code>) inside the section are preserved as content
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 className={styles.pipelineTitle}>Examples by Framework</h3>
        <div className={styles.configGrid}>
          <div className={styles.configCard}>
            <div className={styles.configCardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              LangChain / LangGraph
            </div>
            <div className={styles.codeBlock} style={{ margin: 0, fontSize: "0.72rem", padding: "0.75rem" }}>{`## Agent Scan Scope

- src/agents/
- src/tools/
- src/prompts/
- src/graph-config.ts
- .cursorrules`}</div>
          </div>

          <div className={styles.configCard}>
            <div className={styles.configCardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              OpenAI Assistants / GPTs
            </div>
            <div className={styles.codeBlock} style={{ margin: 0, fontSize: "0.72rem", padding: "0.75rem" }}>{`## Agent Scan Scope

- instructions.md
- knowledge-files/
- actions/openapi.yaml`}</div>
          </div>

          <div className={styles.configCard}>
            <div className={styles.configCardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Custom Agent
            </div>
            <div className={styles.codeBlock} style={{ margin: 0, fontSize: "0.72rem", padding: "0.75rem" }}>{`## Agent Scan Scope

- agent-config.ts
- prompts/system.md
- guardrails.yaml
- .cursorrules`}</div>
          </div>

          <div className={styles.configCard}>
            <div className={styles.configCardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Multi-Agent System
            </div>
            <div className={styles.codeBlock} style={{ margin: 0, fontSize: "0.72rem", padding: "0.75rem" }}>{`## Agent Scan Scope

- agents/planner/
- agents/coder/
- orchestration.yaml
- shared-policies/`}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 className={styles.pipelineTitle}>Best Practices</h3>
        <div className={styles.sectionGrid}>
          <div className={`${styles.detailCard} ${styles.detailCardHigh}`}>
            <div className={styles.cardTitle} style={{ color: "#10b981", borderBottomColor: "rgba(16, 185, 129, 0.2)" }}>
              ✅ Do Include
            </div>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} style={{ background: "#10b981" }} />
                Agent configuration files and system prompts
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} style={{ background: "#10b981" }} />
                Prompt templates and system messages
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} style={{ background: "#10b981" }} />
                Guardrail definitions and tool configurations
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} style={{ background: "#10b981" }} />
                Agent instruction files (<code className={styles.owaspKeyword}>.cursorrules</code>, <code className={styles.owaspKeyword}>CLAUDE.md</code>)
              </li>
            </ul>
          </div>

          <div className={`${styles.detailCard} ${styles.detailCardCritical}`}>
            <div className={styles.cardTitle} style={{ color: "#6b7280" }}>
              ❌ Don&apos;t Include
            </div>
            <ul className={styles.bulletList}>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} />
                UI components, page layouts, or styling files
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} />
                Database schemas or migration files
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} />
                Build configuration (<code className={styles.owaspKeyword}>package.json</code>, <code className={styles.owaspKeyword}>tsconfig.json</code>)
              </li>
              <li className={styles.bulletItem}>
                <span className={styles.bulletDot} />
                Absolute paths &mdash; always relative to repo root
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
