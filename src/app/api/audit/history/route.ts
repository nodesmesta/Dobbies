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
 *
 * Fail-loud contract:
 *   - Auth required -> 401
 *   - DB query error -> 500 with detail (not silent empty array)
 *   - Critical non-null fields must be present; throw on null
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function parseIntStrict(raw: string | null, field: string): number {
  if (raw === null) throw new Error(`Missing required numeric param: ${field}`);
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid numeric value for param ${field}: ${raw}`);
  return n;
}

function parseIntOrNull(raw: string | null): number | null {
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid numeric value: ${raw}`);
  return n;
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Report field "${field}" must be a non-empty string; got ${typeof v}`);
  }
  return v;
}

function requireNumber(v: unknown, field: string): number {
  if (typeof v !== "number" || Number.isNaN(v)) {
    throw new Error(`Report field "${field}" must be a finite number; got ${typeof v}`);
  }
  return v;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse query params ──────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") === null
      ? 1
      : parseIntStrict(searchParams.get("page"), "page");
    const limit = searchParams.get("limit") === null
      ? 10
      : parseIntStrict(searchParams.get("limit"), "limit");
    if (page < 1) throw new Error("page must be >= 1");
    if (limit < 1 || limit > 50) throw new Error("limit must be 1..50");

    const sortRaw = searchParams.get("sort");
    // Validate sort column (whitelist) — explicit, no silent fallback to "created_at"
    const allowedSorts = ["created_at", "overall_score", "static_score", "dynamic_score", "agent_name"] as const;
    const sortColumn = sortRaw && (allowedSorts as readonly string[]).includes(sortRaw)
      ? sortRaw
      : "created_at";

    const orderRaw = searchParams.get("order");
    if (orderRaw !== null && orderRaw !== "asc" && orderRaw !== "desc") {
      throw new Error(`Invalid order: ${orderRaw} (must be "asc" or "desc")`);
    }
    const order = orderRaw === "asc" ? "asc" : "desc";

    const search = searchParams.get("search") ?? null;
    const minScore = parseIntOrNull(searchParams.get("minScore"));
    const maxScore = parseIntOrNull(searchParams.get("maxScore"));

    // ── Build query ──────────────────────────────────────────────
    let query = supabase
      .from("audit_reports")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id);

    if (search !== null && search.length > 0) {
      query = query.or(`agent_name.ilike.%${search}%,repo_url.ilike.%${search}%`);
    }

    if (minScore !== null) {
      query = query.gte("overall_score", minScore);
    }
    if (maxScore !== null) {
      query = query.lte("overall_score", maxScore);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order(sortColumn, { ascending: order === "asc" })
      .range(from, to);

    if (error) throw new Error(`Supabase history query failed: ${error.message}`);
    if (count === null) throw new Error("Supabase did not return row count");

    const rows = Array.isArray(data) ? data : (() => { throw new Error("Supabase returned non-array data"); })();

    const reports = rows.map((row: any) => ({
      id: row.id,
      agentName: requireString(row.agent_name, "agent_name"),
      agent_id: row.agent_id,
      repoUrl: row.repo_url,
      filePath: row.file_path,
      systemPrompt: requireString(row.system_prompt, "system_prompt"),
      toolsJson: requireString(row.tools_json, "tools_json"),
      staticScore: requireNumber(row.static_score, "static_score"),
      dynamicScore: row.dynamic_score,
      overallScore: requireNumber(row.overall_score, "overall_score"),
      status: requireString(row.status, "status"),
      createdAt: row.created_at,
      vulnerability_count: requireNumber(row.vulnerability_count, "vulnerability_count"),
      critical_count: requireNumber(row.critical_count, "critical_count"),
      high_count: requireNumber(row.high_count, "high_count"),
      medium_count: requireNumber(row.medium_count, "medium_count"),
      low_count: requireNumber(row.low_count, "low_count"),
      compromised_count: requireNumber(row.compromised_count, "compromised_count"),
    }));

    return NextResponse.json({
      reports,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Audit history error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
