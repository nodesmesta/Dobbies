import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dobbies",
  description:
    "Scan your AI agent configurations for vulnerabilities, logic bugs, and missing guardrails using RAG-based static analysis and dynamic AI vs AI red-teaming simulation.",
  icons: {
    icon: "/dobbies.png",
    shortcut: "/dobbies.png",
    apple: "/dobbies.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cfToken = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;

  return (
    <html lang="en">
      <body>
        {children}
        {cfToken && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: cfToken })}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
