/**
 * LLM-based static analyzer for AI agent security audit.
 *
 * Two analysis layers:
 *   1. Structural tool analysis — detect dangerous tool names/descriptions
 *   2. LLM prompt analysis — contextual review of system prompt semantics
 *
 * Fail-loud contract:
 *   - Missing systemPrompt or tools throws
 *   - LLM failure throws
 *   - LLM returning malformed JSON throws
 *   - Unknown severity in LLM output throws
 *   - Empty `findings` array is a valid clean result, not a fallback
 */
import { chatCompletion } from "@/lib/llm/client";
import type { Severity } from "@/lib/audit/types";
import securityRules from "@/lib/security-rules.json";
import {
  parseJsonLenient,
  unwrapFindingsArray,
  applyFieldAliases,
  coerceSeverity,
} from "@/lib/llm/parse-lenient";

// ── Types ────────────────────────────────────────────────────

interface StaticFinding {
  category_id: string;
  title: string;
  severity: Severity;
  description: string;
  root_cause: string;
  impact: string;
  remediation: string;
  matched_context: string;
  cvss_score: number;
  file_path: string | null;
  line_number: number | null;
  code_snippet: string | null;
}

export interface StaticResult {
  matches: StaticFinding[];
  score: number;
}

interface RawFinding {
  category_id: unknown;
  title: unknown;
  severity: unknown;
  description: unknown;
  root_cause: unknown;
  impact: unknown;
  remediation: unknown;
  matched_context: unknown;
  cvss_score: unknown;
  file_path: unknown;
  line_number: unknown;
  code_snippet: unknown;
}

// ── Severity validation ─────────────────────────────────────

const VALID_SEVERITIES = new Set<Severity>(["critical", "high", "medium", "low"]);

function requireSeverity(v: unknown, index: number): Severity {
  if (typeof v !== "string" || !VALID_SEVERITIES.has(v as Severity)) {
    throw new Error(
      `Static-analysis finding #${index} has invalid severity: ${String(v)} (must be critical|high|medium|low)`,
    );
  }
  return v as Severity;
}

// ── Structural analysis (no LLM) ─────────────────────────────

const DANGEROUS_TOOL_PATTERNS: { pattern: RegExp; severity: Severity; category: string; label: string; description: string; remediation: string }[] = [
  {
    pattern: /\b(exec(?:ute)?_?(?:shell|command|sql|query)?|shell|terminal|system|popen|subprocess)\b/i,
    severity: "critical",
    category: "LLM06",
    label: "Excessive Agency — Shell/Command Execution",
    description: "Tool allows executing arbitrary shell commands or system operations. An attacker could trick the agent into running malicious commands on the host system.",
    remediation: "Remove direct shell execution tools. Use a sandboxed API with a predefined allowlist of safe operations.",
  },
  {
    pattern: /\b(delete|drop|truncate|remove|unlink|rm\b|wipe|purge)\b/i,
    severity: "critical",
    category: "LLM06",
    label: "Excessive Agency — Destructive Operations",
    description: "Tool can delete or destroy data. An attacker could trick the agent into deleting files, database records, or other critical resources.",
    remediation: "Require human-in-the-loop confirmation for all destructive operations. Implement soft-delete where possible.",
  },
  {
    pattern: /\b(admin|sudo|root|superuser|super_admin)\b/i,
    severity: "high",
    category: "LLM06",
    label: "Excessive Agency — Privileged Operations",
    description: "Tool operates with elevated privileges (admin/root). An attacker could leverage this for privilege escalation.",
    remediation: "Apply principle of least privilege. Never give agents root/admin access. Use role-based access control.",
  },
  {
    pattern: /\b(sql|mutation|insert|update|alter|grant|revoke)\b/i,
    severity: "high",
    category: "LLM06",
    label: "Excessive Agency — Database Modification",
    description: "Tool can modify database state directly. An attacker could trick the agent into executing malicious SQL.",
    remediation: "Use parameterized queries with strict input validation. Never expose raw SQL execution as a tool.",
  },
  {
    pattern: /\b(password|secret|credential|api.?key|token)\b/i,
    severity: "high",
    category: "LLM02",
    label: "Sensitive Data in Tool Descriptions",
    description: "Tool description or name references sensitive credential types, suggesting the tool may handle secrets.",
    remediation: "Remove sensitive data from tool metadata. Use external secret managers instead.",
  },
  {
    pattern: /\b(code.?review|deploy|release|publish|write.?file|fs\.|file.?system)\b/i,
    severity: "medium",
    category: "LLM06",
    label: "Excessive Agency — File System Access",
    description: "Tool can read/write files on the file system. An attacker could trick the agent into reading sensitive files or writing malicious content.",
    remediation: "Restrict file system access to a sandboxed directory. Validate all file paths against an allowlist.",
  },
  {
    pattern: /\b(email|message|slack|discord|telegram|send)\b.*(to|user|all|everyone)\b/i,
    severity: "medium",
    category: "LLM06",
    label: "Excessive Agency — Communication Tools",
    description: "Tool can send messages to users or channels. An attacker could trick the agent into sending phishing messages or spam.",
    remediation: "Require user confirmation before sending messages. Rate-limit outgoing communications.",
  },
  {
    pattern: /\b(http.?fetch|request|get|post|api|webhook|callback|url)\b/i,
    severity: "low",
    category: "LLM01",
    label: "External Network Access",
    description: "Tool can make network requests. An attacker could use this for SSRF, data exfiltration, or triggering external webhooks.",
    remediation: "Restrict outbound URLs to an allowlist. Implement request signing and validation.",
  },
];

function analyzeTools(tools: { name: string; description: string }[]): StaticFinding[] {
  const findings: StaticFinding[] = [];

  for (const tool of tools) {
    if (!tool.name) throw new Error("Tool entry missing `name`");
    if (typeof tool.description !== "string") {
      throw new Error(`Tool "${tool.name}" has non-string description`);
    }

    const combined = `${tool.name} ${tool.description}`;

    for (const pattern of DANGEROUS_TOOL_PATTERNS) {
      const match = combined.match(pattern.pattern);
      if (match) {
        // Avoid duplicate findings for same tool+pattern
        const alreadyExists = findings.some(
          (f) => f.category_id === pattern.category && f.matched_context.includes(tool.name)
        );
        if (alreadyExists) continue;

        findings.push({
          category_id: pattern.category,
          title: pattern.label,
          severity: pattern.severity,
          description: `Tool \`${tool.name}\`: ${pattern.description}\n\nMatched pattern: \`${match[0]}\` in "${tool.description}"`,
          root_cause: `Tool "${tool.name}" has a ${pattern.severity}-risk operation in its definition`,
          impact: pattern.description,
          remediation: pattern.remediation,
          matched_context: `${tool.name}: ${tool.description}`,
          cvss_score: pattern.severity === "critical" ? 9.0 : pattern.severity === "high" ? 7.0 : pattern.severity === "medium" ? 5.0 : 3.0,
          file_path: null,
          line_number: null,
          code_snippet: null,
        });
      }
    }
  }

  return findings;
}

// ── LLM-based prompt analysis ────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are a senior AI security auditor specialized in OWASP LLM Top 10 classification.

Your task: analyze the system prompt and tool definitions of an LLM agent for security vulnerabilities.

## Rules to check
${(securityRules as any[]).map((r) => `- ${r.title} (${r.severity}): ${r.description}`).join("\n")}

## Output format
Return a JSON OBJECT with a top-level "findings" array. If no vulnerabilities found, return {"findings": []}.

Schema:
{
  "findings": [
    {
      "category_id": "LLM01" through "LLM10",
      "title": "string — short descriptive title",
      "severity": "critical" | "high" | "medium" | "low",
      "description": "string — detailed explanation of the vulnerability",
      "root_cause": "string — why this is vulnerable",
      "impact": "string — what an attacker could achieve",
      "remediation": "string — actionable fix recommendation",
      "matched_context": "string — exact problematic text from the prompt or tool",
      "cvss_score": number 0-10,
      "file_path": null,
      "line_number": null,
      "code_snippet": null
    }
  ]
}

## Guidelines
- Focus on actual security issues, not speculative ones
- Consider the CONTEXT of the prompt — a tool named "execute_query" is dangerous only if it actually runs unvalidated user input
- Ignore false signals like "pydantic" containing "dan" — use semantic understanding
- For prompt injection: look for patterns where user input is trusted without sanitization
- For excessive agency: check if tools have broad permissions without guardrails
- For sensitive data: check if actual secrets appear in the prompt
- Be specific about what text in the prompt is problematic
`;

function buildAnalysisPrompt(systemPrompt: string, toolsDescription: string): string {
  return `<system_prompt>
${systemPrompt}
</system_prompt>

<tool_definitions>
${toolsDescription}
</tool_definitions>

Analyze the above system prompt and tool definitions for OWASP LLM Top 10 security vulnerabilities. Return your findings as a JSON array.`;
}

function coerceFindingsArray(parsed: unknown): RawFinding[] {
  // Tolerates bare array, wrapped object ({findings|vulnerabilities|issues|results|data|...}:[...]}),
  // and prose-padded JSON. Unwrapping logic is centralized in parse-lenient.
  const found = unwrapFindingsArray(parsed);
  if (!found) {
    throw new Error("Static-analyzer LLM JSON is not an object/array");
  }
  return found as RawFinding[];
}

function requireString(v: unknown, field: string, index: number): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Static-analysis finding #${index} missing required string field: ${field}`);
  }
  return v;
}

function requireNumber(v: unknown, field: string, index: number): number {
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new Error(`Static-analysis finding #${index} missing required number field: ${field}`);
  }
  return v;
}

function coerceFinding(raw: unknown, index: number): StaticFinding {
  if (typeof raw !== "object" || raw === null) {
    throw new Error(`Static-analysis finding #${index} is not an object`);
  }
  // Apply field alias map: LLMs emit {id,name,risk,...} or {category,severity_lowcase,...}
  // The map copies the first non-empty value from each alias list into the canonical key.
  const r = applyFieldAliases(raw as Record<string, unknown>);
  // The OWASP category ids in v...[truncated]orn duplicate detection.
  const normalizedCategoryId = requireString(r.category_id, "category_id", index).trim().toLowerCase();
  return {
    category_id: normalizedCategoryId,
    title: requireString(r.title, "title", index),
    severity: coerceSeverity(r.severity),
    description: requireString(r.description, "description", index),
    root_cause: requireString(r.root_cause, "root_cause", index),
    impact: requireString(r.impact, "impact", index),
    remediation: requireString(r.remediation, "remediation", index),
    matched_context: requireString(r.matched_context, "matched_context", index),
    cvss_score: requireNumber(r.cvss_score, "cvss_score", index),
    file_path: r.file_path === null || typeof r.file_path === "string" ? (r.file_path as string | null) : null,
    line_number: typeof r.line_number === "number" ? r.line_number : null,
    code_snippet: typeof r.code_snippet === "string" ? r.code_snippet : null,
  };
}

async function analyzePromptWithLLM(
  systemPrompt: string,
  toolsDescription: string,
  model: string,
): Promise<StaticFinding[]> {
  if (!model) throw new Error("analyzePromptWithLLM requires `model` argument");
  if (!systemPrompt) throw new Error("analyzePromptWithLLM requires non-empty `systemPrompt`");
  if (!toolsDescription) throw new Error("analyzePromptWithLLM requires non-empty `toolsDescription`");

  const userPrompt = buildAnalysisPrompt(systemPrompt, toolsDescription);

  const response = await chatCompletion(
    [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    { model, temperature: 0.1, maxTokens: 4096, responseFormat: "json_object" }
  );

  let parsed: unknown;
  try {
    parsed = parseJsonLenient(response);
  } catch (err) {
    throw new Error(
      `Static-analyzer LLM returned unrecoverable JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const rawFindings = coerceFindingsArray(parsed);
  return rawFindings.map((f, i) => coerceFinding(f, i));
}

// ── Scoring ──────────────────────────────────────────────────

const SEVERITY_DEDUCTIONS: Record<Severity, number> = {
  critical: 25,
  high: 15,
  medium: 10,
  low: 5,
};

function calculateScore(findings: StaticFinding[]): number {
  if (findings.length === 0) return 100;

  let deductions = 0;
  for (const f of findings) {
    // No fallback: severity is already validated by `coerceFinding` via `requireSeverity`.
    deductions += SEVERITY_DEDUCTIONS[f.severity];
  }

  return Math.max(0, Math.min(100, 100 - deductions));
}

// ── Main entry point ─────────────────────────────────────────

/**
 * Runs full static analysis on an agent's system prompt and tools.
 *
 * Two-phase analysis:
 *   1. Structural: regex-based tool definition scanning (fast, no LLM)
 *   2. Semantic: LLM-powered contextual prompt analysis
 *
 * @param systemPrompt     — Required. The agent's system prompt text.
 * @param toolsDescription — Required. Stringified tool descriptions.
 * @param tools            — Required. Parsed tool array for structural analysis.
 * @param model            — Required. Model identifier for the static-analyzer LLM.
 * @returns                  Combined findings and a 0-100 security score.
 */
export async function runStaticAnalysis(
  systemPrompt: string,
  toolsDescription: string,
  tools: { name: string; description: string }[],
  model: string,
): Promise<StaticResult> {
  if (!model) throw new Error("runStaticAnalysis requires `model` argument");
  if (!systemPrompt) throw new Error("runStaticAnalysis requires non-empty `systemPrompt`");
  if (!toolsDescription) throw new Error("runStaticAnalysis requires non-empty `toolsDescription`");
  if (!Array.isArray(tools)) throw new Error("runStaticAnalysis requires `tools` array");

  // Phase 1: Structural tool analysis
  const structuralFindings = analyzeTools(tools);

  // Phase 2: LLM-based semantic analysis
  const llmFindings = await analyzePromptWithLLM(systemPrompt, toolsDescription, model);

  // Combine: structural findings first, then LLM findings
  const allFindings = [...structuralFindings, ...llmFindings];

  // Remove duplicates by category_id + matched_context
  const seen = new Set<string>();
  const uniqueFindings: StaticFinding[] = [];
  for (const f of allFindings) {
    const key = `${f.category_id}:${f.matched_context.slice(0, 80)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueFindings.push(f);
    }
  }

  const score = calculateScore(uniqueFindings);

  return { matches: uniqueFindings, score };
}
