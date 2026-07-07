/**
 * OpenAI-compatible LLM client for server-side use.
 *
 * Uses OPENAI_API_KEY from env. Supports custom baseURL
 * for providers like AI/ML API, Fireworks, etc.
 */

const BASE_URL = "https://api.fireworks.ai/inference/v1";

const API_KEY = () => process.env.OPENAI_API_KEY ?? "";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object";
}

/**
 * Sends a chat completion request to an OpenAI-compatible API.
 * Returns the assistant's response text, or null if no API key is configured.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string | null> {
  const apiKey = API_KEY();
  if (!apiKey) return null;

  const {
    model = "accounts/fireworks/models/minimax-m3",
    temperature = 0.7,
    maxTokens = 1024,
    responseFormat,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  const res = await fetch(`${BASE_URL}/chat/completions`, {
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

  clearTimeout(timeoutId);

  if (!res.ok) {
    const text = await res.text().catch(() => "unknown");
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : null;
}
