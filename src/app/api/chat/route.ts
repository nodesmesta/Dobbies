import { NextRequest, NextResponse } from "next/server";
import { callLlm } from "@/lib/llm/gateway";
import type { ChatMessage } from "@/lib/llm/errors";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Boundary check + env fallback are gateway's job. We just check the
    // precondition that the dobbies-chat role has a model configured
    // (gateway's LlmError("boundary_invalid", "dobbies-chat", ...) handles
    // OPENAI_API_KEY / DOBBIES_CHAT_MODEL / default fallback to "openai/gpt-4o").
    const systemPrompt: ChatMessage = {
      role: "system",
      content: `You are the Dobbies security assistant, a helpful and knowledgeable AI security specialist built to guide developers in auditing and securing their AI agents.
Your job is to answer questions about security audits, LLM vulnerabilities (based on OWASP LLM Top 10), static prompt/tool analysis, red-teaming simulations, and guardrail configuration (Llama Guard, NeMo Guardrails, regex output filters).
Provide clear, actionable, and secure coding practices. Keep your responses concise, helpful, and formatted in Markdown.`
    };

    const formattedMessages = messages.map((m: any) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content || m.text || "",
    }));

    const llmMessages: ChatMessage[] = [systemPrompt, ...formattedMessages];

    const response = await callLlm({ role: "dobbies-chat", messages: llmMessages });

    if (!response) {
      return NextResponse.json(
        { error: "LLM returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply: response });
  } catch (error) {
    // gateway.callLlm throws LlmError — surface its message verbatim so the
    // caller sees the actual failure cause (http_5xx, boundary_invalid, etc.).
    // Anything non-LlmError is "Internal Server Error" by default.
    const message = error instanceof Error ? error.message : "Internal Server Error";
    // Boundary errors (config / input) → 503/400; transport errors → 502;
    // generic 500 for everything else. Caller-side role is "dobbies-chat",
    // so any classification can be sender-derived.
    const status = error instanceof Error && /OPENAI_API_KEY|No model configured|dobbies chat/i.test(error.message)
      ? 503
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
