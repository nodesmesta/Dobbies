/**
 * OpenAI-compatible LLM client for server-side use.
 *
 * Uses OPENAI_API_KEY from env. Supports custom baseURL
 * for providers like AI/ML API, Fireworks, etc.
 *
 * Fail-loud contract:
 *   - Missing API key         → throw
 *   - Missing model argument  → throw
 *   - Non-2xx HTTP response   → throw with status + body
 *   - Empty/null content      → throw with finish_reason
 *   - Network/parse errors    → propagate
 */

const BASE_URL = "https://api.fireworks.ai/inference/v1";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object";
}

/**
 * Context-aware retry for `chatCompletion`.
 *
 * WHY THIS EXISTS — both audits with identical code (same `maxTokens`)
 * produced different results: `audit-1783432790792` succeeded in 6 turns,
 * `audit-1783434178723` aborted at turn 5 with `finish_reason=length`.
 * Reasoning-style models (Fireworks minimax-m3, o-series) consume the
 * completion budget for internal chain-of-thought BEFORE emitting visible
 * tokens. The reasoning-burn is non-deterministic per call, so a fixed
 * `maxTokens` is a stochastic soft-cap rather than a hard guarantee.
 *
 * RETRY POLICY — only kicks in when we have evidence that the failure is
 * recoverable, and only changes one knob at a time so each retry is
 * diagnosable:
 *
 *   1. Identify failure mode by error text:
 *        - finish_reason=length with empty content  → "budget exhausted";
 *          recoverable by giving more tokens, messages stay identical,
 *          temperature drifts +0.1 to encourage a different reasoning
 *          path on the next attempt.
 *        - finish_reason=length with non-empty content → caller-side
 *          detection; do NOT retry — the model produced output, downstream
 *          parser will decide if it's usable. Don't risk churning output.
 *        - any other error (rate limit, network, 5xx, JSON parse) →
 *          propagated unchanged. Retrying these with bigger budget would
 *          hide the real cause.
 *
 *   2. Budget increment: `maxTokens * 1.5`, hard-capped at 4000. Reasoning
 *      models rarely need more than that for visible output of ~1k
 *      tokens; the cap prevents runaway cost if a caller mis-configured
 *      base budget too low.
 *
 *   3. Temperature drift (only on the first retry): +0.1 above base, then
 *      reset to base on attempt 3. This nudges the model off whichever
 *      reasoning path it was on, WITHOUT making output near-random
 *      (drift is bounded and bounded-direction).
 *
 *   4. Max retries = 2 (3 total attempts). Each attempt logs the WHY
 *      and WHAT changed, so the audit-stream log line for a terminal
 *      failure tells you exactly which axis we tried.
 *
 *   5. messages array is NEVER mutated. Re-running with the same prompt
 *      context is the only way to attribute outcome variation to budget
 *      / temperature, not prompt drift.
 *
 * WHAT THIS DOESN'T DO:
 *   - does NOT retry JSON-shape failures in evaluator/static-analyzer.
 *     Those modules use `chatCompletion` directly (not this wrapper)
 *     because a truncated JSON payload is structurally invalid, and
 *     re-asking the model for the same JSON will not monotonically
 *     improve quality — better to fail loud so we can investigate the
 *     underlying cause (usually: prompt is too verbose).
 *   - does NOT retry 4xx HTTP errors. Those are deterministic and will
 *     fail again.
 *
 * @param label - short tag used in log lines so an operator can tell
 *                which caller (attacker / agent / ...) is retrying.
 * @param maxRetries - default 2; can be raised for callers that want
 *                     more attempts at the cost of latency.
 */
export async function chatCompletionWithRetry(
  messages: ChatMessage[],
  options: ChatCompletionOptions,
  label: string,
  maxRetries: number = 2,
): Promise<string> {
  const baseTemperature = options.temperature ?? 0.7;
  const baseMaxTokens = options.maxTokens ?? 1024;
  const HARD_MAX_TOKENS_CAP = 4000;
  const ATTEMPT_CAP = maxRetries + 1; // first try + N retries

  let attempt = 0;
  let current: ChatCompletionOptions = {
    ...options,
    maxTokens: Math.min(baseMaxTokens, HARD_MAX_TOKENS_CAP),
    temperature: baseTemperature,
  };

  while (true) {
    attempt++;
    try {
      const out = await chatCompletion(messages, current);
      if (attempt > 1) {
        console.info(
          `[retry:${label}] attempt ${attempt}/${ATTEMPT_CAP} succeeded ` +
            `(max_tokens=${current.maxTokens}, temp=${current.temperature})`,
        );
      }
      return out;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isBudgetExhausted =
        msg.includes("finish_reason=length") &&
        msg.includes("empty content");

      if (!isBudgetExhausted || attempt >= ATTEMPT_CAP) {
        // Either non-recoverable failure, or we ran out of retries.
        // Wrap the original error so the audit-stream log shows the
        // retries-attempted counter without losing the original cause.
        if (attempt > 1) {
          throw new Error(
            `[retry:${label}] exhausted ${attempt - 1} retries, re-throwing original error: ${msg}`,
          );
        }
        throw err;
      }

      // Compute next-attempt knobs. Each retry is one axis-change to
      // make attribution easier when reading the logs.
      const previousMax = current.maxTokens ?? baseMaxTokens;
      const previousTemp = current.temperature ?? baseTemperature;
      const nextMax = Math.min(
        Math.round(previousMax * 1.5),
        HARD_MAX_TOKENS_CAP,
      );
      const nextTemp = attempt === 1
        ? Math.min(previousTemp + 0.1, 1.5)
        : previousTemp; // don't keep drifting; revert to base assumption

      console.warn(
        `[retry:${label}] attempt ${attempt}/${ATTEMPT_CAP} failed: ${msg}. ` +
          `Retrying — max_tokens: ${previousMax} → ${nextMax}, ` +
          `temperature: ${previousTemp} → ${nextTemp}. ` +
          `messages unchanged (same prompt context, attribute outcome to budget/temp only).`,
      );

      current = {
        ...current,
        maxTokens: nextMax,
        temperature: nextTemp,
      };
    }
  }
}

/**
 * Sends a chat completion request to an OpenAI-compatible API.
 * Returns the assistant's response text. Throws on any failure.
 *
 * Use this directly when the caller needs the raw failure signal
 * (no retry wrapper) — typically because the output feeds into a
 * strict-structure decoder (JSON schema, regex match) where mission
 * success is binary. For visible-content callers (attacker, agent),
 * use `chatCompletionWithRetry` instead.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const { model, temperature = 0.7, maxTokens = 1024, responseFormat } = options;
  if (!model) throw new Error("chatCompletion requires `model` option");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat && { response_format: { type: responseFormat } }),
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown");
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const choice = json?.choices?.[0];
  const content = choice?.message?.content;

  if (content === null || typeof content === "undefined") {
    throw new Error(
      `LLM returned empty content (model=${model}, finish_reason=${choice?.finish_reason ?? "unknown"})`,
    );
  }
  if (typeof content !== "string") {
    throw new Error(`LLM returned non-string content: ${typeof content}`);
  }
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    throw new Error(
      `LLM returned whitespace-only content (model=${model}, finish_reason=${choice?.finish_reason ?? "unknown"})`,
    );
  }
  return trimmed;
}
