/**
 * Shared LLM types and error envelope.
 *
 * Single source of truth for:
 *   - ChatMessage: shape passed to every LLM call
 *   - LlmRole: identifier for which role module made the call
 *   - LlmErrorKind: classification of every LLM failure
 *   - LlmError: structured error with kind/role/stage/cause/retried
 *
 * Every LLM-related failure in the pipeline (now funneled through callLlm)
 * reaches the caller as an LlmError with these structured fields. Replaces
 * the 15+ scattered throw sites that previously used bare Error — caller
 * no longer parses error.message strings to know what failed.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export type LlmRole =
  | "agent"
  | "attacker"
  | "evaluator"
  | "static-analyzer"
  | "dobbies-chat";

export type LlmErrorKind =
  | "boundary_invalid"      // before HTTP call (config/input)
  | "http_4xx"              // API rejected (deterministic)
  | "http_5xx"              // provider down (transient, candidate for fallback)
  | "network"               // fetch failed at transport layer
  | "timeout"               // AbortSignal fired (model too slow)
  | "empty_content"         // response had no usable content (final attempt)
  | "budget_exhausted"      // finish_reason=length, no content (final attempt)
  | "all_retries_exhausted"; // recovery retries did not produce output

export type LlmErrorStage = "validation" | "transport" | "retry";

/**
 * Unified LLM error. Every failure from callLlm is an LlmError.
 *
 * field mapping:
 *   - kind    — failure taxonomy (see LlmErrorKind)
 *   - role    — which role module triggered the call
 *   - stage   — at which pipeline step the error occurred
 *   - cause   — original error if wrapping a lower-layer throw
 *   - retried — how many retry attempts ran before this terminal failure
 *
 * Caller pattern:
 *   try {
 *     const text = await callLlm({ role: "agent", messages });
 *   } catch (e) {
 *     if (e instanceof LlmError && e.kind === "http_5xx") {
 *       // provider is down — show banner, no point retrying from caller
 *     }
 *     throw e;
 *   }
 */
export class LlmError extends Error {
  readonly kind: LlmErrorKind;
  readonly role: LlmRole;
  readonly stage: LlmErrorStage;
  readonly cause?: unknown;
  readonly retried: number;

  constructor(
    kind: LlmErrorKind,
    role: LlmRole,
    stage: LlmErrorStage,
    message: string,
    cause?: unknown,
    retried: number = 0,
  ) {
    super(message);
    this.name = "LlmError";
    this.kind = kind;
    this.role = role;
    this.stage = stage;
    this.cause = cause;
    this.retried = retried;
  }
}
