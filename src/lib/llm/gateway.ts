/**
 * LLM Gateway — single entry point for all LLM calls.
 *
 * Owns:
 *   - boundary validation (reject before HTTP)
 *   - transport (delegated to ./client.transportLlmRequest)
 *   - retry policy (per role from ./policy)
 *   - fallback chain — NOT YET (set up so future PR can add it without touching callers)
 *   - error envelope (every failure wrapped as LlmError)
 *
 * What this does NOT do:
 *   - JSON shape validation, severity normalization, field aliasing
 *     → still in each role module (parse-lenient.ts + per-role coerce fns)
 *   - SSE event emission, score aggregation
 *     → still in route handler
 *
 * Retry behavior (matches original chatCompletionWithRetry):
 *   - finish_reason=length + empty content → recoverable
 *     → maxRetries attempts, 1.5× token budget per attempt (cap 4000),
 *       +0.1 temp drift on first retry only
 *   - any other transport failure (4xx/5xx/timeout/network) → propagate
 *     → currently no fallback chain; gateway-level fallback is a future
 *       extension that should NOT change this retry/escalation policy
 *
 * Caller pattern (canonical):
 *   // in agent.ts / attacker.ts / evaluator.ts / static-analyzer.ts / chat/route.ts
 *   const text = await callLlm({ role: "agent", messages, modelOverride: model });
 *
 * All callers do the SAME thing: pass role + messages + optional override.
 * No caller knows about LlmTransportRequest, retries, or error classification.
 */

import { transportLlmRequest } from "./client";
import {
  LlmError,
  type LlmErrorKind,
  type LlmRole,
  type ChatMessage,
} from "./errors";

// Re-export ChatMessage so callers can do:
//   import { callLlm, type ChatMessage } from "@/lib/llm/gateway";
// without a separate ./errors import.
export type { ChatMessage };
import { resolveRoleConfig, type LlmRoleConfig } from "./policy";

export interface LlmCallOptions {
  role: LlmRole;
  messages: ChatMessage[];
  modelOverride?: string;
  temperatureOverride?: number;
  maxTokensOverride?: number;
  responseFormatOverride?: "json_object";
}

const HARD_MAX_TOKENS_CAP = 4000;

export async function callLlm(opts: LlmCallOptions): Promise<string> {
  // 1. Boundary validation — reject BEFORE touching env or HTTP.
  if (!opts || typeof opts !== "object") {
    throw new LlmError("boundary_invalid", "agent", "validation", "callLlm: opts is required", opts);
  }
  if (!opts.role) {
    throw new LlmError("boundary_invalid", "agent", "validation", "callLlm: opts.role is required");
  }
  if (!Array.isArray(opts.messages) || opts.messages.length === 0) {
    throw new LlmError("boundary_invalid", opts.role, "validation", "callLlm: opts.messages must be a non-empty array");
  }
  for (let i = 0; i < opts.messages.length; i++) {
    const m = opts.messages[i];
    if (!m || (m.role !== "system" && m.role !== "user" && m.role !== "assistant")) {
      throw new LlmError("boundary_invalid", opts.role, "validation", `callLlm: message[${i}] has invalid role: ${String(m?.role)}`);
    }
    if (typeof m.content !== "string") {
      throw new LlmError("boundary_invalid", opts.role, "validation", `callLlm: message[${i}].content must be a string`);
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new LlmError("boundary_invalid", opts.role, "validation", "OPENAI_API_KEY is not configured");
  }

  // 2. Resolve role config + apply overrides.
  let config: LlmRoleConfig;
  try {
    config = resolveRoleConfig(opts.role, opts.modelOverride);
  } catch (err) {
    throw new LlmError("boundary_invalid", opts.role, "validation", err instanceof Error ? err.message : String(err), err);
  }

  const transportOpts = {
    baseUrl: config.baseUrl,
    apiKey: process.env.OPENAI_API_KEY!,
    model: config.primaryModel,
    messages: opts.messages,
    temperature: opts.temperatureOverride ?? config.temperature,
    maxTokens: opts.maxTokensOverride ?? config.maxTokens,
    responseFormat: opts.responseFormatOverride ?? config.responseFormat,
    timeoutMs: config.timeoutMs,
  };

  // 3. Retry loop on recoverable failure (finish_reason=length + empty).
  let attempt = 0;
  let currentMaxTokens = transportOpts.maxTokens;
  let currentTemperature = transportOpts.temperature;

  while (true) {
    const response = await transportLlmRequest({
      ...transportOpts,
      maxTokens: currentMaxTokens,
      temperature: currentTemperature,
    });

    // OK + content → success path.
    if (response.ok && response.content !== null) {
      if (attempt > 0) {
        console.info(
          `[LlmGateway:${opts.role}] attempt ${attempt + 1} succeeded ` +
          `(max_tokens=${currentMaxTokens}, temp=${currentTemperature})`,
        );
      }
      return response.content;
    }

    // OK + no content → recoverable only on finish_reason=length with retries left.
    if (response.ok) {
      const recoverable = response.finishReason === "length" && attempt < config.maxRetries;
      if (!recoverable) {
        const kind: LlmErrorKind = response.finishReason === "length" ? "budget_exhausted" : "empty_content";
        throw new LlmError(
          kind,
          opts.role,
          "retry",
          `LLM returned no content (finish_reason=${response.finishReason ?? "unknown"}) after ${attempt + 1} attempt(s)`,
          undefined,
          attempt,
        );
      }
      const previousMax = currentMaxTokens;
      const previousTemp = currentTemperature;
      const nextMax = Math.min(Math.round(previousMax * 1.5), HARD_MAX_TOKENS_CAP);
      const nextTemp = attempt === 0 ? Math.min(previousTemp + 0.1, 1.5) : previousTemp;
      console.warn(
        `[LlmGateway:${opts.role}] attempt ${attempt + 1}/${config.maxRetries + 1} failed: empty content ` +
        `(finish_reason=length). Retrying — max_tokens: ${previousMax} → ${nextMax}, ` +
        `temperature: ${previousTemp} → ${nextTemp}.`,
      );
      currentMaxTokens = nextMax;
      currentTemperature = nextTemp;
      attempt++;
      continue;
    }

    // Non-OK → transport-level failure. Classify and throw.
    const kind = classifyTransportResponse(response);
    throw new LlmError(
      kind,
      opts.role,
      "transport",
      response.errorMessage ?? `transport failure (status=${response.status})`,
      undefined,
      attempt,
    );
  }
}

/**
 * Classify a non-OK transport response into an LlmErrorKind.
 * HTTP 4xx → http_4xx (deterministic, won't recover from retry)
 * HTTP 5xx → http_5xx (transient, candidate for future fallback chain)
 * status=0 with abort/timeout text → timeout
 * status=0 with other text → network
 */
function classifyTransportResponse(response: { ok: boolean; status: number; errorMessage: string | null }): LlmErrorKind {
  if (response.status >= 400 && response.status < 500) return "http_4xx";
  if (response.status >= 500) return "http_5xx";
  if (response.status === 0) {
    const msg = (response.errorMessage ?? "").toLowerCase();
    if (msg.includes("abort") || msg.includes("timeout")) return "timeout";
    return "network";
  }
  return "network";
}
