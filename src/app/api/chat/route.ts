import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, ChatMessage } from "@/lib/llm/client";
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "LLM service is not configured. Set OPENAI_API_KEY environment variable." },
        { status: 503 }
      );
    }

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

    const llmMessages = [systemPrompt, ...formattedMessages];

    const response = await chatCompletion(llmMessages, {
      model: "openai/gpt-4o",
      temperature: 0.7,
      maxTokens: 1024,
    });

    if (!response) {
      return NextResponse.json(
        { error: "LLM returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply: response });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
