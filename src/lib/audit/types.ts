/**
 * Shared types for the audit pipeline.
 *
 * Aligned with normalized relational schema:
 *   - vulnerabilities → separate table with FK to audit_reports
 *   - simulation_turns → separate table
 *   - guardrails → separate table
 */

export type Severity = "critical" | "high" | "medium" | "low";
export type AuditStatus = "completed" | "running" | "failed";
export type VulnStatus = "open" | "confirmed" | "fixed" | "wontfix";

/**
 * Canonical OWASP LLM Top 10 categories. Single source of truth — used
 * by both the backend (per-category session orchestration in
 * /api/audit/stream/route.ts) and the frontend (UI pre-seed of the
 * category list before any data lands). Order is the official OWASP
 * ranking; labels are displayed verbatim on the dashboard.
 *
 * When the static analyzer returns zero vulnerabilities, the backend
 * uses this list to select a default-probe subset (LLM01 + LLM06 +
 * LLM08) so the dynamic red-team phase still runs — see
 * DEFAULT_DYNAMIC_PROBE_CATEGORIES below.
 */
export const OWASP_CATEGORY_IDS = [
  "LLM01", "LLM02", "LLM03", "LLM04", "LLM05",
  "LLM06", "LLM07", "LLM08", "LLM09", "LLM10",
] as const;
export type OwaspCategoryId = typeof OWASP_CATEGORY_IDS[number];

export const OWASP_CATEGORY_LABELS: Record<OwaspCategoryId, string> = {
  LLM01: "Prompt Injection",
  LLM02: "Insecure Output Handling",
  LLM03: "Training Data Poisoning",
  LLM04: "Model DoS",
  LLM05: "Supply Chain",
  LLM06: "Sensitive Info Disclosure",
  LLM07: "Insecure Plugin Design",
  LLM08: "Excessive Agency",
  LLM09: "Overreliance",
  LLM10: "Model Theft",
};

/**
 * Subset of OWASP categories that the dynamic red-team pipeline always
 * probes when static analysis returns zero findings. Chosen because they
 * cover the three most commonly exploited agent attack surfaces:
 *   - LLM01: direct prompt injection (jailbreak / role-play)
 *   - LLM06: sensitive info disclosure (system prompt exfil, secrets)
 *   - LLM08: excessive agency (tool abuse / unauthorized actions)
 *
 * When static is clean, these categories still get a 3-turn red-team
 * session so we honor the docs/landing-page promise: every audit runs a
 * multi-turn simulation regardless of static findings.
 */
export const DEFAULT_DYNAMIC_PROBE_CATEGORIES: readonly OwaspCategoryId[] = [
  "LLM01", "LLM06", "LLM08",
] as const;

/**
 * Display rank for severity. Lower number renders earlier.
 * Critical (0) → low (3) — the natural "most-severe-first" ordering
 * used by both the vulnerabilities list sort and any future
 * filter/grouping logic that needs severity precedence.
 */
export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  /** Original severity from static analysis (LLM rating).
   *  Use this for "static: <sev>" UI chips when a downgrade happened
   *  because the simulation could not demonstrate an exploit. */
  severity_original?: Severity;
  /** Combined severity after the post-simulation verdict. Prefer this in
   *  the UI for the headline severity colour; `severity` falls back to
   *  the raw static rating when the verdict row is missing (audit run
   *  before this column was added). */
  severity_effective?: Severity;
  /** True iff at least one simulation turn targeted this vuln and the
   *  agent was compromised on that turn. False iff targeted but the
   *  agent refused. Undefined/null iff the vuln was not targeted at all
   *  (fewer vulns than `numTurns`). */
  exploitation_demonstrated?: boolean | null;
  /** OWASP code: LLM01–LLM10 */
  category_id: string;
  /** Human-readable category name (from join with vulnerability_categories) */
  category_name?: string;
  description: string;
  remediation: string;
  file_path?: string | null;
  line_number?: number | null;
  code_snippet?: string | null;
  root_cause?: string | null;
  attack_path?: string | null;
  impact?: string | null;
  cvss_score?: number | null;
  status: VulnStatus;
  created_at?: string;
}

export interface SimulationTurn {
  id: string;
  report_id?: string;
  turn_number: number;
  sender: "attacker" | "agent";
  text: string;
  target_vuln_id?: string | null;
  target_vuln_title?: string | null;
  compromised: boolean;
  /** OWASP category this turn belongs to (for per-category session grouping) */
  session_category?: string | null;
  created_at?: string;
}

export interface GuardrailConfig {
  id?: string;
  report_id?: string;
  guardrail_type: string;
  label: string;
  content: string;
  created_at?: string;
}

export interface AuditReport {
  id: string;
  agentName: string;
  agent_id?: string | null;
  repoUrl?: string | null;
  filePath?: string | null;
  systemPrompt: string;
  toolsJson: string;
  staticScore: number;
  dynamicScore: number;
  overallScore: number;
  status: AuditStatus;
  createdAt: string;
  /** Denormalized count columns from audit_reports */
  vulnerability_count?: number;
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  compromised_count?: number;
}

/**
 * SSE event emitted by the audit pipeline stream.
 */
export interface StreamEvent {
  type: "status" | "static_result" | "chat_turn" | "final_result";
  delay: number;
  data: unknown;
}

export interface DetectedAgentTool {
  name: string;
  description: string;
}

export interface DetectedAgent {
  id: string;
  name: string;
  repoUrl: string;
  filePath: string;
  content?: string;
  systemPrompt: string;
  tools: DetectedAgentTool[];
  language: string;
  riskHints: string[];
}
