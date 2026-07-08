/**
 * Per-role LLM configuration + resolver.
 *
 * Owns: defaults for temperature / maxTokens / responseFormat / maxRetries /
 * timeoutMs / model. Provider is hardcoded (Fireworks). Caller passes
 * modelOverride; otherwise env-resolved.
 *
 * Why defaults live here, not in each role module: lets a future operator
 * tune all roles from one file without grep-and-replace across the
 * pipeline. Same reasoning that made the gateway the single LLM owner.
 */

import type { LlmRole } from "./errors";

export interface LlmRoleConfig {
  baseUrl: string;
  primaryModel: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: "json_object";
  maxRetries: number;
  timeoutMs: number;
}

const DEFAULT_BASE_URL = "https://api.fireworks.ai/inference/v1";

/**
 * Per-role defaults. Behavior rationale (kept in sync with original
 * chatCompletionWithRetry caller-config in agent/attacker/evaluator/
 * static-analyzer/chat-route):
 *
 *   agent           — high temp (visible text), 1500 budget (visible +
 *                     reasoning budget for Fireworks reasoning models)
 *   attacker        — highest temp (adversarial diversity), 1500 budget
 *   evaluator       — low temp for stable JSON, response_format=json_object
 *   static-analyzer — very low temp for deterministic JSON, 4096 base
 *                     (verbose system prompt + audit rule catalog)
 *   dobbies-chat    — separate model from audit pipeline (current code
 *                     hardcoded "openai/gpt-4o" via Fireworks proxy)
 */
const ROLE_DEFAULTS: Record<LlmRole, Omit<LlmRoleConfig, "baseUrl" | "primaryModel">> = {
  agent: {
    temperature: 0.7,
    maxTokens: 1500,
    maxRetries: 2,
    timeoutMs: 60_000,
  },
  attacker: {
    temperature: 0.9,
    maxTokens: 1500,
    maxRetries: 2,
    timeoutMs: 60_000,
  },
  evaluator: {
    temperature: 0.3,
    maxTokens: 1500,
    responseFormat: "json_object",
    maxRetries: 2,
    timeoutMs: 60_000,
  },
  "static-analyzer": {
    temperature: 0.1,
    maxTokens: 4096,
    responseFormat: "json_object",
    maxRetries: 2,
    timeoutMs: 60_000,
  },
  "dobbies-chat": {
    temperature: 0.7,
    maxTokens: 1024,
    maxRetries: 2,
    timeoutMs: 60_000,
  },
};

/**
 * Resolve primary model for a role.
 *
 * Order:
 *   1. explicit override (modelOverride arg)
 *   2. role-specific env var (DOBBIES_CHAT_MODEL for dobby chat)
 *   3. shared AUDIT_MODEL env var (4 audit-pipeline roles)
 *   4. hardcoded fallback ("openai/gpt-4o" for dobby chat only)
 *
 * Throws on missing config — gateway wraps in LlmError("boundary_invalid").
 */
function resolvePrimaryModel(role: LlmRole, override?: string): string {
  if (override && override.length > 0) return override;

  if (role === "dobbies-chat") {
    // Uses the same Fireworks deployment as the audit pipeline —
    // accounts/nodesemesta-qatykx4j/deployments/clk368gq — unless the
    // operator explicitly sets DOBBIES_CHAT_MODEL.
    return process.env.DOBBIES_CHAT_MODEL?.trim() || "accounts/nodesemesta-qatykx4j/deployments/clk368gq";
  }

  const fromEnv = process.env.AUDIT_MODEL?.trim();
  if (fromEnv) return fromEnv;

  throw new Error(
    `[LlmGateway] No model configured for role "${role}". ` +
    `Provide modelOverride, set AUDIT_MODEL env var (audit pipeline), or ` +
    `DOBBIES_CHAT_MODEL env var (dobbies chat).`,
  );
}

/**
 * Resolve full role config (model + knobs) for a given role.
 * Knobs are NOT overridable per call — to override them, the caller
 * passes temperatureOverride / maxTokensOverride / responseFormatOverride
 * to callLlm directly.
 */
export function resolveRoleConfig(role: LlmRole, modelOverride?: string): LlmRoleConfig {
  const defaults = ROLE_DEFAULTS[role];
  return {
    baseUrl: DEFAULT_BASE_URL,
    primaryModel: resolvePrimaryModel(role, modelOverride),
    temperature: defaults.temperature,
    maxTokens: defaults.maxTokens,
    responseFormat: defaults.responseFormat,
    maxRetries: defaults.maxRetries,
    timeoutMs: defaults.timeoutMs,
  };
}
