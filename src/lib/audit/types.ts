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

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
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
