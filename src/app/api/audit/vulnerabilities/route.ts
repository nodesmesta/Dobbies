/**
 * GET  /api/audit/vulnerabilities?report_id=xxx&severity=critical&category_id=LLM01&status=open&page=1&limit=20&search=...
 * PATCH /api/audit/vulnerabilities
 *   Body: { id, status }  — update vulnerability status
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET — query vulnerabilities with filters, pagination, and sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("report_id");
    const severity = searchParams.get("severity");
    const categoryId = searchParams.get("category_id");
    const status = searchParams.get("status");
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const sort = searchParams.get("sort") ?? "created_at";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // Must scope to at least the user's reports
    let query = supabase
      .from("vulnerabilities")
      .select(`
        *,
        vulnerability_categories!inner(name, owasp_url)
      `, { count: "exact" })
      .in("report_id", (await supabase
        .from("audit_reports")
        .select("id")
        .eq("user_id", session.user.id)
      ).data?.map(r => r.id) ?? []);

    // Filters
    if (reportId) query = query.eq("report_id", reportId);
    if (severity) query = query.eq("severity", severity);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (status) query = query.eq("status", status);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sort & pagination
    const validSorts = ["created_at", "severity", "title", "status"];
    const sortColumn = validSorts.includes(sort) ? sort : "created_at";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order(sortColumn, { ascending: order === "asc" })
      .range(from, to);

    if (error) {
      console.error("Vulnerabilities query error:", error.message);
      return NextResponse.json({ vulnerabilities: [], total: 0 });
    }

    // Transform
    const vulnerabilities = (data ?? []).map((row: any) => ({
      id: row.id,
      report_id: row.report_id,
      title: row.title,
      severity: row.severity,
      category_id: row.category_id,
      category_name: row.vulnerability_categories?.name ?? row.category_id,
      description: row.description,
      remediation: row.remediation,
      file_path: row.file_path,
      line_number: row.line_number,
      code_snippet: row.code_snippet,
      root_cause: row.root_cause,
      attack_path: row.attack_path,
      impact: row.impact,
      cvss_score: row.cvss_score,
      status: row.status,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      vulnerabilities,
      total: count ?? 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 1,
    });
  } catch (error) {
    console.error("Vulnerabilities API error:", error);
    return NextResponse.json({ vulnerabilities: [], total: 0 });
  }
}

/**
 * PATCH — update vulnerability status (open/confirmed/fixed/wontfix)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status: newStatus } = await request.json();

    if (!id || !newStatus) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const validStatuses = ["open", "confirmed", "fixed", "wontfix"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    // Verify ownership: vuln must belong to a report owned by the user
    const { data: vuln, error: fetchError } = await supabase
      .from("vulnerabilities")
      .select("report_id")
      .eq("id", id)
      .single();

    if (fetchError || !vuln) {
      return NextResponse.json({ error: "Vulnerability not found" }, { status: 404 });
    }

    const { data: report } = await supabase
      .from("audit_reports")
      .select("user_id")
      .eq("id", vuln.report_id)
      .eq("user_id", session.user.id)
      .single();

    if (!report) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("vulnerabilities")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      console.error("Vulnerability update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update vulnerability" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id, status: newStatus });
  } catch (error) {
    console.error("Vulnerabilities PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
