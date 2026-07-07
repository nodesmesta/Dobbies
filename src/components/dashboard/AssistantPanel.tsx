"use client";

import React, { useEffect, useRef, useState } from "react";

function parseInline(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} style={{ fontWeight: 700, color: "#fff" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} style={{
          background: "rgba(255,255,255,0.06)",
          padding: "0.1rem 0.3rem",
          borderRadius: "3px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--color-accent-green)"
        }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const code = match ? match[2] : part.slice(3, -3);

      return (
        <pre key={index} style={{
          background: "rgba(0, 0, 0, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "0.5rem 0.75rem",
          borderRadius: "4px",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "rgba(255, 255, 255, 0.85)",
          overflowX: "auto",
          margin: "0.5rem 0",
          whiteSpace: "pre"
        }}>
          <code>{code.trim()}</code>
        </pre>
      );
    }

    const lines = part.split("\n");
    return (
      <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (trimmed === "") return <div key={lineIdx} style={{ height: "0.5rem" }} />;

          if (trimmed.startsWith("### ")) {
            return (
              <h4 key={lineIdx} style={{ fontSize: "0.875rem", fontWeight: 700, margin: "0.5rem 0 0.25rem", color: "#fff" }}>
                {parseInline(trimmed.slice(4))}
              </h4>
            );
          }
          if (trimmed.startsWith("## ")) {
            return (
              <h3 key={lineIdx} style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0.75rem 0 0.35rem", color: "#fff" }}>
                {parseInline(trimmed.slice(3))}
              </h3>
            );
          }
          if (trimmed.startsWith("# ")) {
            return (
              <h2 key={lineIdx} style={{ fontSize: "1.05rem", fontWeight: 850, margin: "1rem 0 0.5rem", color: "#fff" }}>
                {parseInline(trimmed.slice(2))}
              </h2>
            );
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={lineIdx} style={{ display: "flex", gap: "0.375rem", paddingLeft: "0.5rem", margin: "0.15rem 0" }}>
                <span style={{ color: "var(--color-accent-green)", fontWeight: "bold" }}>•</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  {parseInline(trimmed.slice(2))}
                </span>
              </div>
            );
          }

          return (
            <p key={lineIdx} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.55 }}>
              {parseInline(line)}
            </p>
          );
        })}
      </div>
    );
  });
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm the Dobbies security assistant. Ask me anything about your audit results, vulnerabilities, or how to secure your AI agents.",
  ts: new Date().toISOString(),
};

interface AssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function AssistantPanel({ open, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      ts: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.reply || "I'm sorry, I couldn't generate a response.",
          ts: new Date().toISOString(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: `⚠ Error: ${data.error || "Failed to get response from assistant"}`,
          ts: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: "⚠ Unable to reach assistant. Please check your connection and try again.",
        ts: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([WELCOME]);
    setInput("");
  }

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="assistant-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className="assistant-panel"
        data-open={open}
        aria-label="Security assistant"
        role="complementary"
      >
        {/* ── Header ── */}
        <div className="assistant-header">
          <div className="assistant-header-left">
            <div className="assistant-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="assistant-header-title">Security Assistant</p>
              <p className="assistant-header-sub">Powered by Dobbies AI</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            {messages.length > 1 && (
              <button
                className="assistant-header-btn"
                onClick={handleClear}
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <button
              className="assistant-header-btn"
              onClick={onClose}
              title="Close assistant"
              aria-label="Close assistant"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10 4L4 10M4 4l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Message list ── */}
        <div className="assistant-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`assistant-bubble assistant-bubble--${msg.role}`}
            >
              {msg.role === "assistant" && (
                <div className="assistant-bubble-icon">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
              )}
              <div className="assistant-bubble-text" style={{ width: "100%" }}>
                {renderMarkdown(msg.text)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="assistant-bubble assistant-bubble--assistant">
              <div className="assistant-bubble-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="assistant-typing">
                <span className="streaming-dot" />
                <span className="streaming-dot" />
                <span className="streaming-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input area ── */}
        <div className="assistant-input-area">
          <div className="assistant-input-wrap">
            <textarea
              ref={inputRef}
              className="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about vulnerabilities, fixes, guardrails..."
              rows={1}
              disabled={loading}
              aria-label="Message input"
            />
            <button
              className="assistant-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M12 7L2 2l2.5 5L2 12l10-5z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <p className="assistant-input-hint">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </aside>
    </>
  );
}
