/**
 * GET /api/audit/report?id=xxx
 *
 * Returns a single audit report with all related data:
 *   - report metadata
 *   - vulnerabilities list
 *   - simulation turns
 *   - guardrail configurations
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id query param" }, { status: 400 });
    }

    // ── 1. Fetch report (verify ownership) ──────────────────────
    const { data: report, error: reportErr } = await supabase
      .from("audit_reports")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (reportErr || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // ── 2. Fetch vulnerabilities with category name ─────────────
    const { data: vulnerabilities } = await supabase
      .from("vulnerabilities")
      .select(`
        *,
        vulnerability_categories!inner(name, owasp_url)
      `)
      .eq("report_id", id)
      .order("created_at", { ascending: true });

    // ── 3. Fetch simulation turns ───────────────────────────────
    const { data: simulationTurns } = await supabase
      .from("simulation_turns")
      .select("*")
      .eq("report_id", id)
      .order("turn_number", { ascending: true });

    // ── 4. Fetch guardrails ─────────────────────────────────────
    const { data: guardrails } = await supabase
      .from("guardrails")
      .select("*")
      .eq("report_id", id);

    // ── Transform ───────────────────────────────────────────────
    const transformedVulns = (vulnerabilities ?? []).map((v: any) => ({
      id: v.id,
      title: v.title,
      severity: v.severity,
      category_id: v.category_id,
      category_name: v.vulnerability_categories?.name ?? v.category_id,
      description: v.description,
      remediation: v.remediation,
      file_path: v.file_path,
      line_number: v.line_number,
      code_snippet: v.code_snippet,
      root_cause: v.root_cause,
      attack_path: v.attack_path,
      impact: v.impact,
      cvss_score: v.cvss_score,
      status: v.status,
      created_at: v.created_at,
    }));

    const transformedTurns = (simulationTurns ?? []).map((t: any) => ({
      id: t.id,
      sender: t.sender,
      text: t.text,
      turn_number: t.turn_number,
      compromised: t.compromised,
      target_vuln_id: t.target_vuln_id,
      target_vuln_title: t.target_vuln_title,
      created_at: t.created_at,
    }));

    const transformedGuardrails = (guardrails ?? []).map((g: any) => ({
      id: g.id,
      category_id: g.category_id,
      instructions: g.instructions,
    }));

    return NextResponse.json({
      id: report.id,
      agentName: report.agent_name,
      agentId: report.agent_id,
      repoUrl: report.repo_url,
      filePath: report.file_path,
      systemPrompt: report.system_prompt || "",
      toolsJson: report.tools_json || "[]",
      staticScore: report.static_score ?? 0,
      dynamicScore: report.dynamic_score ?? 0,
      overallScore: report.overall_score ?? 0,
      status: report.status ?? "completed",
      createdAt: report.created_at,
      vulnerability_count: report.vulnerability_count ?? 0,
      critical_count: report.critical_count ?? 0,
      high_count: report.high_count ?? 0,
      medium_count: report.medium_count ?? 0,
      low_count: report.low_count ?? 0,
      compromised_count: report.compromised_count ?? 0,
      vulnerabilities: transformedVulns,
      simulationTurns: transformedTurns,
      guardrails: transformedGuardrails,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
