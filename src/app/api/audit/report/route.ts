/**
 * GET /api/audit/report?id=xxx
 *
 * Returns a single audit report with all related data:
 *   - report metadata
 *   - vulnerabilities list
 *   - simulation turns
 *   - guardrail configurations
 *
 * Fail-loud contract: every read validates non-null & non-empty for
 * critical fields; any DB error or null surprise surfaces as 500.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function requireString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Report field "${field}" must be a non-empty string; got ${typeof v}: ${String(v).slice(0, 80)}`);
  }
  return v;
}

function requireNumber(v: unknown, field: string): number {
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new Error(`Report field "${field}" must be a finite number; got ${typeof v}: ${String(v)}`);
  }
  return v;
}

function requireArray<T>(v: unknown, field: string): T[] {
  if (!Array.isArray(v)) {
    throw new Error(`Report field "${field}" must be an array; got ${typeof v}`);
  }
  return v as T[];
}

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

    if (reportErr) throw new Error(`Failed to load report: ${reportErr.message}`);
    if (!report) throw new Error("Report not found");

    // ── 2. Fetch vulnerabilities with category name ─────────────
    const { data: vulnerabilities, error: vulnsErr } = await supabase
      .from("vulnerabilities")
      .select(`
        *,
        vulnerability_categories!inner(name, owasp_url)
      `)
      .eq("report_id", id)
      .order("created_at", { ascending: true });

    if (vulnsErr) throw new Error(`Failed to load vulnerabilities: ${vulnsErr.message}`);
    const vulnRows = requireArray<any>(vulnerabilities, "vulnerabilities");

    // ── 3. Fetch simulation turns ───────────────────────────────
    const { data: simulationTurns, error: turnsErr } = await supabase
      .from("simulation_turns")
      .select("*")
      .eq("report_id", id)
      .order("turn_number", { ascending: true });

    if (turnsErr) throw new Error(`Failed to load simulation turns: ${turnsErr.message}`);
    const turnRows = requireArray<any>(simulationTurns, "simulationTurns");

    // ── 4. Fetch guardrails ─────────────────────────────────────
    const { data: guardrails, error: guardErr } = await supabase
      .from("guardrails")
      .select("*")
      .eq("report_id", id);

    if (guardErr) throw new Error(`Failed to load guardrails: ${guardErr.message}`);
    const guardRows = requireArray<any>(guardrails, "guardrails");

    // ── Transform ───────────────────────────────────────────────
    const transformedVulns = vulnRows.map((v) => {
      if (!v.vulnerability_categories) {
        throw new Error(`Vulnerability ${v.id} missing joined category record`);
      }
      return {
        id: v.id,
        title: requireString(v.title, "title"),
        severity: requireString(v.severity, "severity"),
        category_id: requireString(v.category_id, "category_id"),
        category_name: requireString(v.vulnerability_categories.name, "category_name"),
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
      };
    });

    const transformedTurns = turnRows.map((t) => ({
      id: t.id,
      sender: requireString(t.sender, "sender"),
      text: requireString(t.text, "text"),
      turn_number: requireNumber(t.turn_number, "turn_number"),
      compromised: requireBoolean(t.compromised, "compromised"),
      target_vuln_id: t.target_vuln_id,
      target_vuln_title: t.target_vuln_title,
      created_at: t.created_at,
    }));

    const transformedGuardrails = guardRows.map((g) => ({
      id: g.id,
      guardrail_type: requireString(g.guardrail_type, "guardrail_type"),
      label: requireString(g.label, "label"),
      content: requireString(g.content, "content"),
    }));

    return NextResponse.json({
      id: report.id,
      agentName: requireString(report.agent_name, "agent_name"),
      agentId: report.agent_id,
      repoUrl: report.repo_url,
      filePath: report.file_path,
      systemPrompt: requireString(report.system_prompt, "system_prompt"),
      toolsJson: requireString(report.tools_json, "tools_json"),
      staticScore: requireNumber(report.static_score, "static_score"),
      dynamicScore: report.dynamic_score,
      overallScore: requireNumber(report.overall_score, "overall_score"),
      status: requireString(report.status, "status"),
      createdAt: report.created_at,
      vulnerability_count: requireNumber(report.vulnerability_count, "vulnerability_count"),
      critical_count: requireNumber(report.critical_count, "critical_count"),
      high_count: requireNumber(report.high_count, "high_count"),
      medium_count: requireNumber(report.medium_count, "medium_count"),
      low_count: requireNumber(report.low_count, "low_count"),
      compromised_count: requireNumber(report.compromised_count, "compromised_count"),
      vulnerabilities: transformedVulns,
      simulationTurns: transformedTurns,
      guardrails: transformedGuardrails,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

function requireBoolean(v: unknown, field: string): boolean {
  if (typeof v !== "boolean") {
    throw new Error(`Report field "${field}" must be boolean; got ${typeof v}: ${String(v)}`);
  }
  return v;
}
