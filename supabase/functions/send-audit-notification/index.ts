/**
 * send-audit-notification
 *
 * Supabase Edge Function yang dipanggil dari database trigger setelah
 * audit_report selesai di-insert. Fungsi ini:
 *   1. Menerima data report dari trigger
 *   2. Lookup email user dari auth.users
 *   3. Kirim notifikasi via Resend API
 *
 * Trigger → net.http_post() → Edge Function → Resend API → ✉️ User
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

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

Deno.serve(async (req: Request) => {
  const start = Date.now();

  try {
    const body: NotificationPayload = await req.json();
    const {
      report_id,
      user_id,
      agent_name,
      overall_score,
      vulnerability_count,
      critical_count,
      high_count,
      medium_count,
      low_count,
      compromised_count,
    } = body;

    console.log(
      `[send-audit-notification] received: report=${report_id} user=${user_id} agent="${agent_name}" score=${overall_score}`,
    );

    // ── 1. Lookup user email via Admin API ───────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(
      user_id,
    );
    if (userErr || !userData?.user?.email) {
      throw new Error(
        `User lookup failed: ${userErr?.message ?? "no email found for user " + user_id}`,
      );
    }

    const email = userData.user.email;
    console.log(`[send-audit-notification] resolved email: ${email}`);

    // ── 2. Kirim email via Resend ────────────────────────────
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured in Supabase secrets");
    }

    // Di mode development / testing, Resend cuma bisa kirim ke
    // email terverifikasi. Ganti `from` begitu punya domain sendiri.
    const subject = `✅ Dobbies Audit Selesai: ${agent_name} — Skor ${overall_score}/100`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Dobbies <support@nodesemesta.com>",
        to: email,
        subject,
        html: buildAuditEmailHtml({
          agent_name,
          overall_score,
          vulnerability_count,
          critical_count,
          high_count,
          medium_count,
          low_count,
          compromised_count,
        }),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend API error (${res.status}): ${errText}`);
    }

    const elapsed = Date.now() - start;
    console.log(
      `[send-audit-notification] done in ${elapsed}ms — email sent to ${email}`,
    );

    return new Response(JSON.stringify({ success: true, elapsed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const elapsed = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[send-audit-notification] FAILED after ${elapsed}ms: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ─── Email template ─────────────────────────────────────────

function buildAuditEmailHtml(opts: {
  agent_name: string;
  overall_score: number;
  vulnerability_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  compromised_count: number;
}): string {
  const {
    agent_name,
    overall_score,
    vulnerability_count,
    critical_count,
    high_count,
    medium_count,
    low_count,
    compromised_count,
  } = opts;

  const grade = overall_score >= 80 ? "A" : overall_score >= 60 ? "B" : overall_score >= 40 ? "C" : "D";
  const gradeColor = overall_score >= 80 ? "#22c55e" : overall_score >= 60 ? "#eab308" : "#ef4444";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f8fafc; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 24px; }
    .score-ring { width: 96px; height: 96px; border-radius: 50%; border: 6px solid ${gradeColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .score-value { font-size: 36px; font-weight: 700; color: ${gradeColor}; }
    .agent-name { font-size: 18px; font-weight: 600; color: #1e293b; text-align: center; margin-bottom: 4px; }
    .grade-badge { display: inline-block; background: ${gradeColor}; color: white; font-weight: 700; font-size: 14px; padding: 2px 10px; border-radius: 6px; margin-top: 8px; }
    .stats { display: flex; gap: 8px; flex-wrap: wrap; margin: 24px 0; }
    .stat { flex: 1; min-width: 80px; background: #f1f5f9; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }
    .severity-critical { color: #7c3aed; }
    .severity-high { color: #ef4444; }
    .severity-medium { color: #eab308; }
    .severity-low { color: #64748b; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .footer { text-align: center; color: #94a3b8; font-size: 13px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">🛡 Dobbies</div>

      <div class="score-ring">
        <div class="score-value">${overall_score}</div>
      </div>
      <div class="agent-name" style="text-align:center">
        ${agent_name}
        <div class="grade-badge">Grade ${grade}</div>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${vulnerability_count}</div>
          <div class="stat-label">Total Vuln</div>
        </div>
        <div class="stat">
          <div class="stat-value severity-critical">${critical_count}</div>
          <div class="stat-label">Critical</div>
        </div>
        <div class="stat">
          <div class="stat-value severity-high">${high_count}</div>
          <div class="stat-label">High</div>
        </div>
        <div class="stat">
          <div class="stat-value severity-medium">${medium_count}</div>
          <div class="stat-label">Medium</div>
        </div>
        <div class="stat">
          <div class="stat-value severity-low">${low_count}</div>
          <div class="stat-label">Low</div>
        </div>
      </div>

      <div class="divider"></div>

      <p style="color: #475569; font-size: 14px; line-height: 1.6;">
        Audit agent <strong>${agent_name}</strong> sudah selesai.
        ${vulnerability_count > 0
          ? `Ditemukan <strong>${vulnerability_count} kerentanan</strong> dengan ${critical_count} critical, ${high_count} high, ${medium_count} medium, ${low_count} low.`
          : "Tidak ditemukan kerentanan berarti."}
        ${compromised_count > 0
          ? `<br><br>⚠️ <strong>${compromised_count} turn simulation</strong> berhasil mengeksploitasi agent — proof of concept terkonfirmasi.`
          : ""}
      </p>

      <div class="footer">
        <p>Dobbies — AI Agent Security Auditor</p>
        <p style="margin-top:4px">Email ini dikirim otomatis setelah audit selesai.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
