/**
 * GET /api/audit/history
 *
 * Returns audit history for the current user from Supabase.
 * Supports pagination, filtering by severity/category, and sorting.
 *
 * Query params:
 *   - page      (number, default 1)
 *   - limit     (number, default 10, max 50)
 *   - sort      (string, default "created_at")
 *   - order     ("asc" | "desc", default "desc")
 *   - search    (string, optional — search agent_name or repo_url)
 *   - minScore  (number, optional — filter overall_score >= minScore)
 *   - maxScore  (number, optional — filter overall_score <= maxScore)
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

    // ── Parse query params ──────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
    const sort = searchParams.get("sort") ?? "created_at";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const search = searchParams.get("search") ?? "";
    const minScore = searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!, 10) : null;
    const maxScore = searchParams.get("maxScore") ? parseInt(searchParams.get("maxScore")!, 10) : null;

    // Validate sort column (whitelist)
    const validSorts = ["created_at", "overall_score", "static_score", "dynamic_score", "agent_name"];
    const sortColumn = validSorts.includes(sort) ? sort : "created_at";

    // ── Build query ──────────────────────────────────────────────
    let query = supabase
      .from("audit_reports")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id);

    // Search filter
    if (search) {
      query = query.or(`agent_name.ilike.%${search}%,repo_url.ilike.%${search}%`);
    }

    // Score filters
    if (minScore !== null) {
      query = query.gte("overall_score", minScore);
    }
    if (maxScore !== null) {
      query = query.lte("overall_score", maxScore);
    }

    // Sorting and pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order(sortColumn, { ascending: order === "asc" })
      .range(from, to);

    if (error) {
      console.error("Supabase query error:", error.message);
      return NextResponse.json({ reports: [], total: 0, page, limit });
    }

    // Transform snake_case → camelCase
    const reports = (data ?? []).map((row: any) => ({
      id: row.id,
      agentName: row.agent_name,
      agent_id: row.agent_id,
      repoUrl: row.repo_url,
      filePath: row.file_path,
      systemPrompt: row.system_prompt || "",
      toolsJson: row.tools_json || "[]",
      staticScore: row.static_score ?? 0,
      dynamicScore: row.dynamic_score ?? 0,
      overallScore: row.overall_score ?? 0,
      status: row.status ?? "completed",
      createdAt: row.created_at,
      vulnerability_count: row.vulnerability_count ?? 0,
      critical_count: row.critical_count ?? 0,
      high_count: row.high_count ?? 0,
      medium_count: row.medium_count ?? 0,
      low_count: row.low_count ?? 0,
      compromised_count: row.compromised_count ?? 0,
    }));

    return NextResponse.json({
      reports,
      total: count ?? 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 1,
    });
  } catch (error) {
    console.error("Audit history error:", error);
    return NextResponse.json({ reports: [], total: 0, page: 1, limit: 10 });
  }
}
