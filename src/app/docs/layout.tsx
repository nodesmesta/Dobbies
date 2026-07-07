import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation — Dobbies AI Agent Security Auditor",
  description:
    "Complete Dobbies documentation: audit pipeline, security scores, OWASP LLM Top 10 reference, agent configuration guide, and scope coverage matrix.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
