/**
 * POST /api/notify/send
 *
 * Vercel proxy webhook for audit completion notifications.
 * Called by the database trigger via net.http_post.
 *
 * Flow:
 *   1. Receive payload from trigger
 *   2. Generate a JWT signed with SUPABASE_JWT_SECRET (Vercel env only)
 *   3. Forward to Supabase Edge Function with Authorization: Bearer <jwt>
 *   4. Edge Function verify_jwt: true — runtime auto-validates the token
 *
 * SUPABASE_JWT_SECRET lives exclusively in Vercel env and never leaks
 * to PostgreSQL or Supabase secrets.
 */

import { NextRequest, NextResponse } from "next/server";

const EDGE_FN_URL =
  "https://exylpvfkundajdixodwm.supabase.co/functions/v1/send-audit-notification";

interface NotificationPayload {
  report_id: string;
  user_id: string;
  agent_name: string;
  overall_score: number;
  vulnerability_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  compromised_count: number;
}

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) {
      console.error("[notify/send] SUPABASE_JWT_SECRET not configured in Vercel env");
      return NextResponse.json(
        { error: "Server misconfigured — missing SUPABASE_JWT_SECRET" },
        { status: 500 },
      );
    }

    const body: NotificationPayload = await request.json();

    // Validasi required fields
    if (!body.report_id || !body.user_id || !body.agent_name) {
      return NextResponse.json(
        { error: "Missing required fields: report_id, user_id, agent_name" },
        { status: 400 },
      );
    }

    console.log(
      `[notify/send] received: report=${body.report_id} user=${body.user_id} agent="${body.agent_name}"`,
    );

    // ── Generate service_role JWT (1-minute expiry, single-use) ──
    const jwt = await signJwt(
      {
        sub: body.user_id,
        aud: "authenticated",
        role: "service_role",
        exp: Math.floor(Date.now() / 1000) + 60, // 60-second expiry
        iat: Math.floor(Date.now() / 1000),
      },
      secret,
    );

    // ── Forward to Supabase Edge Function ─────────────────────
    const response = await fetch(EDGE_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        `[notify/send] Edge function error ${response.status} after ${Date.now() - start}ms: ${errText}`,
      );
      return NextResponse.json(
        { error: `Edge function returned ${response.status}` },
        { status: response.status },
      );
    }

    const result = await response.json();
    console.log(
      `[notify/send] done in ${Date.now() - start}ms — edge function succeeded`,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[notify/send] FAILED after ${Date.now() - start}ms: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── JWT signing — HMAC-SHA256, zero external dependencies ────────

async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(signingInput)),
  );

  let sigBinary = "";
  for (let i = 0; i < sigBytes.length; i++) {
    sigBinary += String.fromCharCode(sigBytes[i]);
  }
  const sigB64 = base64url(sigBinary);

  return `${signingInput}.${sigB64}`;
}

function base64url(input: string): string {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
