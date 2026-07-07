/**
 * LLM HTTP transport — the only module that touches the wire.
 *
 * Pure transport. Does NOT classify errors, does NOT retry, does NOT
 * decide what counts as valid output. Returns a structured response so
 * the gateway (./gateway.ts) owns all higher-level policy.
 *
 * Fail-loud contract: NEVER throws. Returns structured ok boolean with
 * errorMessage populated. The gateway turns non-ok responses into LlmError.
 *
 * Boundary validation (apiKey / model) returns ok=false rather than
 * throwing so the gateway can wrap the failure in LlmError uniformly
 * instead of seeing an Error with no context.
 */

import type { ChatMessage } from "./errors";

export interface LlmTransportRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  responseFormat?: "json_object";
  timeoutMs: number;
}

export interface LlmTransportResponse {
  ok: boolean;
  status: number;
  content: string | null;
  finishReason: string | null;
  errorMessage: string | null;
}

export async function transportLlmRequest(req: LlmTransportRequest): Promise<LlmTransportResponse> {
  if (!req.apiKey) {
    return { ok: false, status: 0, content: null, finishReason: null, errorMessage: "apiKey is empty" };
  }
  if (!req.model) {
    return { ok: false, status: 0, content: null, finishReason: null, errorMessage: "model is empty" };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), req.timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${req.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        temperature: req.temperature,
        max_tokens: req.maxTokens,
        ...(req.responseFormat && { response_format: { type: req.responseFormat } }),
      }),
      signal: controller.signal,
    });
  } catch (err) {
    return {
      ok: false,
      status: 0,
      content: null,
      finishReason: null,
      errorMessage: err instanceof Error
        ? (err.name === "AbortError" ? "Request aborted (timeout)" : `Network error: ${err.message}`)
        : `Network error: ${String(err)}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown");
    return {
      ok: false,
      status: res.status,
      content: null,
      finishReason: null,
      errorMessage: `LLM API error ${res.status}: ${text.slice(0, 500)}`,
    };
  }

  let json: any;
  try {
    json = await res.json();
  } catch (err) {
    return {
      ok: false,
      status: res.status,
      content: null,
      finishReason: null,
      errorMessage: `Invalid JSON response: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const choice = json?.choices?.[0];
  const content = choice?.message?.content;

  return {
    ok: true,
    status: res.status,
    content: typeof content === "string" && content.trim().length > 0 ? content.trim() : null,
    finishReason: choice?.finish_reason ?? null,
    errorMessage: null,
  };
}
