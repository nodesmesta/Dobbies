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
 * Sends a chat completion request to an OpenAI-compatible API.
 * Returns the assistant's response text. Throws on any failure.
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
