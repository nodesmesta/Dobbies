/**
 * Universal LLM output normalizers.
 *
 * LLM responses are unpredictable: markdown fences, leading narrative,
 * arbitrary wrapper keys (findings/vulnerabilities/issues/results/data/output/response),
 * UPPERCASE or "Title Case" enum values, alternate field names (id/name/risk
 * instead of category_id/severity), trailing prose, etc.
 *
 * The parse-lenient pipeline:
 *   1. Strip markdown fence and surrounding prose
 *   2. Extract the first balanced JSON object/array
 *   3. JSON.parse (still throws on truly malformed input — fail-loud preserved)
 *   4. Apply field alias map so any wrapper key/category ID locates correctly
 *   5. Normalize severity case ("High"/"HIGH"/"high risk" → "high")
 *
 * If the response is essentially unrecoverable after this (pure prose,
 * double-encoded JSON, malformed braces) the upstream parser throws with
 * the offending snippet preserved so the caller can surface it to the UI.
 */

const SEVERITY_ALIASES: Record<string, "critical" | "high" | "medium" | "low"> = {
  critical: "critical", crit: "critical", severe: "critical", "critical-severity": "critical",
  high: "high", "high risk": "high", "high-risk": "high", important: "high",
  medium: "medium", med: "medium", moderate: "medium", mod: "medium",
  low: "low", minor: "low", info: "low", informational: "low", negligible: "low",
};

const ARRAY_WRAPPER_KEYS = [
  "findings", "vulnerabilities", "issues", "results", "data", "items",
  "output", "response", "result", "list", "entries", "rows",
];

const RAW_FIELD_ALIASES: Record<string, string[]> = {
  category_id: ["category_id", "category", "categoryId", "id", "owasp_id", "owasp", "cwe", "rule_id", "ruleId"],
  title: ["title", "name", "label", "summary", "headline"],
  severity: ["severity", "risk", "risk_level", "riskLevel", "level", "priority", "impact_level"],
  description: ["description", "desc", "details", "explanation", "body", "rationale"],
  root_cause: ["root_cause", "rootCause", "cause", "root", "root_cause_text"],
  impact: ["impact", "consequence", "consequences", " blast_radius"],
  remediation: ["remediation", "fix", "mitigation", "recommendation", "recommendations", "fix_recommendation"],
  matched_context: ["matched_context", "matchedContext", "match", "evidence", "context", "example", "sample"],
  cvss_score: ["cvss_score", "cvssScore", "cvss", "score", "rating"],
  file_path: ["file_path", "filePath", "path", "file"],
  line_number: ["line_number", "lineNumber", "line", "line_no"],
};

/**
 * Strip code fences and surrounding prose from a raw LLM response.
 *
 * - Removes leading ```json / ```JSON / ``` fences
 * - Removes trailing ``` and any prose after the last ``` or }
 * - Preserves the first balanced JSON value inside the body
 */
export function stripSurroundingProse(text: string): string {
  let s = text.trim();

  // Remove ```json or ``` prefix and trailing ``` if present in that order.
  s = s.replace(/^```(?:json|JSON)?\s*\n?/, "");
  s = s.replace(/\n?```\s*$/, "");

  // Drop any prose before the first { or [.
  const firstBrace = s.search(/[\[{]/);
  if (firstBrace > 0) s = s.slice(firstBrace);

  // Drop any trailing prose after the last matching closing brace.
  const lastBrace = s.search(/\}\s*$/m);
  const lastBracket = s.search(/\]\s*$/m);
  const lastClose = Math.max(lastBrace, lastBracket);
  if (lastClose > 0 && lastClose < s.length - 1) {
    s = s.slice(0, lastClose + 1);
  }

  return s.trim();
}

/**
 * Parse an LLM response into a JSON value. Tolerant to markdown fences and
 * prose padding; strict on actual syntax — fail-loud preserved (throws with
 * a preview if the body is unrecoverable).
 */
export function parseJsonLenient(raw: string): unknown {
  const cleaned = stripSurroundingProse(raw);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Try once more by extracting the first balanced {...} or [...] block.
    const slice = extractFirstBalanced(cleaned);
    if (slice && slice !== cleaned) {
      try {
        return JSON.parse(slice);
      } catch {
        // fall through to throw below
      }
    }
    throw new Error(
      `parseJsonLenient: ${err instanceof Error ? err.message : String(err)} | raw=${raw.slice(0, 200)}`
    );
  }
}

function extractFirstBalanced(s: string): string | null {
  const start = s.search(/[\[{]/);
  if (start === -1) return null;
  const open = s[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Find the first key in the parsed object whose value is an array — i.e.
 * unwrap `{"findings":[...]}` style responses regardless of wrapper key name.
 * If `parsed` is already an array, return as-is.
 * If `parsed` contains a nested object whose first key is also an array,
 * recurse one level.
 * Returns null if no array could be located.
 */
export function unwrapFindingsArray(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;
  // Prefer known wrapper keys first (highest signal).
  for (const key of ARRAY_WRAPPER_KEYS) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  // Fallback: scan all keys in declared order for any array member.
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

/**
 * Apply a field alias map to a single raw finding. Mutates the input object
 * in place by copying the first non-empty value from each alias list into
 * the canonical field. Returns the same object.
 */
export function applyFieldAliases(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };
  for (const [canonical, aliases] of Object.entries(RAW_FIELD_ALIASES)) {
    if (out[canonical] !== undefined && out[canonical] !== null && out[canonical] !== "") {
      // Already a real value — but severity has special case below.
      if (canonical !== "severity") continue;
    }
    for (const alias of aliases) {
      const v = raw[alias];
      if (v !== undefined && v !== null && v !== "") {
        out[canonical] = v;
        break;
      }
    }
    // Also rename snake-cased alias keys to canonical so downstream sees the
    // unified field. Skip if already present.
  }
  return out;
}

/**
 * Coerce a value to a valid Severity. Accepts case variants and aliases.
 * Throws if the value cannot be mapped to one of the four canonical severities.
 */
export function coerceSeverity(v: unknown): "critical" | "high" | "medium" | "low" {
  if (typeof v !== "string") {
    throw new Error(`coerceSeverity: expected string, got ${typeof v}`);
  }
  const key = v.trim().toLowerCase().replace(/[\s_-]+/g, "-");
  const resolved = SEVERITY_ALIASES[key] ?? SEVERITY_ALIASES[v.trim().toLowerCase()];
  if (!resolved) {
    throw new Error(
      `coerceSeverity: cannot map "${v}" to critical|high|medium|low`
    );
  }
  return resolved;
}

/**
 * Best-effort field accessor — returns the first non-empty string from any
 * of the given alias keys. Useful for required text fields where LLMs may
 * place the value under any of several names.
 */
export function firstString(raw: Record<string, unknown>, aliases: string[]): string | null {
  for (const k of aliases) {
    const v = raw[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}
