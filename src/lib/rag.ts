/**
 * RAG retrieval engine — delegated to LLM-based static analyzer.
 *
 * Fail-loud contract: propagates errors from `runStaticAnalysis`.
 */
import type { Vulnerability, Severity, VulnStatus } from "@/lib/audit/types";
import { runStaticAnalysis } from "@/lib/static-analyzer";

export interface RAGMatch {
  ruleId: string;
  category_id: string;
  category: string;
  title: string;
  severity: Severity;
  matchedKeywords: string[];
  description: string;
  remediation: string;
}

export interface RAGResult {
  matches: RAGMatch[];
  score: number;
  vulnerabilities: Vulnerability[];
}

/**
 * Analyzes agent system prompt and tool definitions against OWASP LLM Top 10.
 *
 * Uses LLM-based semantic analysis for accurate, context-aware detection.
 *
 * @param systemPrompt     — Required. The agent's system prompt text.
 * @param toolsDescription — Required. Stringified tool descriptions.
 * @param tools            — Required. Parsed tool array for structural analysis.
 * @param model            — Required. Model identifier for the static-analyzer LLM.
 */
export async function analyzeWithRAG(
  systemPrompt: string,
  toolsDescription: string,
  tools: { name: string; description: string }[],
  model: string,
): Promise<RAGResult> {
  const result = await runStaticAnalysis(systemPrompt, toolsDescription, tools, model);

  const matches: RAGMatch[] = result.matches.map((f, i) => ({
    ruleId: `rule-${String(i + 1).padStart(3, "0")}`,
    category_id: f.category_id,
    category: f.category_id,
    title: f.title,
    severity: f.severity,
    matchedKeywords: [f.matched_context],
    description: `${f.description}\n\nRoot cause: ${f.root_cause}\nImpact: ${f.impact}`,
    remediation: f.remediation,
  }));

  const vulnerabilities: Vulnerability[] = result.matches.map((f, i) => ({
    id: `vuln-${Date.now()}-${i}`,
    title: f.title,
    severity: f.severity,
    category_id: f.category_id,
    description: `${f.description}\n\nRoot cause: ${f.root_cause}\nImpact: ${f.impact}`,
    remediation: f.remediation,
    file_path: f.file_path,
    line_number: f.line_number,
    code_snippet: f.code_snippet,
    root_cause: f.root_cause,
    attack_path: null,
    impact: f.impact,
    cvss_score: f.cvss_score,
    status: "open" as VulnStatus,
  }));

  return { matches, score: result.score, vulnerabilities };
}
