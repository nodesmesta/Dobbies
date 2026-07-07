"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LoginCard from "@/components/login/LoginCard";

function LoginErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <div className="login-error-banner">
      {error === "auth_callback_failed"
        ? "Authentication failed. Please try again."
        : error === "session_expired"
          ? "Your session has expired. Please sign in again."
          : "An error occurred. Please try again."}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      {/* Ambient background */}
      <div className="login-bg-glow" />
      <div className="login-bg-grid" />

      {/* Back to landing */}
      <Link href="/" className="login-back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to home
      </Link>

      <main className="login-main">
        <Suspense fallback={null}>
          <LoginErrorBanner />
        </Suspense>
        <LoginCard />
      </main>
    </div>
  );
}
