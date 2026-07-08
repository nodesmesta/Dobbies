/**
 * Lightweight GitHub-Flavored Markdown renderer.
 *
 * Parses a subset of GFM:
 *   - Code blocks (``` ```)
 *   - Inline code (`)
 *   - Bold (**)
 *   - Headings (#, ##, ###)
 *   - Unordered lists (-, *)
 *   - Paragraphs
 *
 * Extracted from AssistantPanel.tsx so both the security-assistant chat
 * and the red-team simulation transcript can share the same rendering.
 *
 * Usage:
 *   import { renderMarkdown } from "@/lib/markdown";
 *   // in a component's JSX:
 *   <div>{renderMarkdown(text)}</div>
 */

import React from "react";

// ── Inline formatting ──────────────────────────────────────────

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

// ── Block-level rendering ──────────────────────────────────────

export function renderMarkdown(text: string): React.ReactNode {
  // Handle empty / whitespace-only gracefully
  if (!text || text.trim().length === 0) {
    return <span style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>—</span>;
  }

  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // ── Fenced code block ──
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

    // ── Non-code-block text: split into lines ──
    const lines = part.split("\n");
    return (
      <div key={index} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (trimmed === "") return <div key={lineIdx} style={{ height: "0.5rem" }} />;

          // Headings
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

          // Unordered list
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

          // Regular paragraph
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
