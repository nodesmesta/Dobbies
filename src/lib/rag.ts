/**
 * RAG retrieval engine — delegated to LLM-based static analyzer.
 *
 * Previously used simple keyword substring matching (String.includes),
 * now delegates to a two-phase analyzer:
 *   1. Structural tool analysis (regex-based, no LLM)
 *   2. LLM-based semantic prompt analysis
 *
 * Keeps the same public interface for backward compatibility.
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
 * Uses LLM-based semantic analysis (not keyword matching) for accurate,
 * context-aware vulnerability detection.
 *
 * @param systemPrompt - The agent's system prompt text
 * @param toolsDescription - Stringified tool descriptions (space-separated name:desc)
 * @param tools - Optional parsed tool array for structural analysis
 */
export async function analyzeWithRAG(
  systemPrompt: string,
  toolsDescription: string,
  tools: { name: string; description: string }[] = [],
): Promise<RAGResult> {
  const result = await runStaticAnalysis(systemPrompt, toolsDescription, tools);

  // Map findings to the RAGMatch interface (backward compat)
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

  // Convert to Vulnerability objects for the route
  const vulnerabilities: Vulnerability[] = result.matches.map((f, i) => ({
    id: `vuln-${Date.now()}-${i}`,
    title: f.title,
    severity: f.severity,
    category_id: f.category_id,
    description: `${f.description}\n\nRoot cause: ${f.root_cause}\nImpact: ${f.impact}`,
    remediation: f.remediation,
    file_path: f.file_path ?? null,
    line_number: f.line_number ?? null,
    code_snippet: f.code_snippet ?? null,
    root_cause: f.root_cause,
    attack_path: null,
    impact: f.impact,
    cvss_score: f.cvss_score,
    status: "open" as VulnStatus,
  }));

  return { matches, score: result.score, vulnerabilities };
}
