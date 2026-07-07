/**
 * GET  /api/audit/vulnerabilities?report_id=xxx&severity=critical&category_id=LLM01&status=open&page=1&limit=20&search=...
 * PATCH /api/audit/vulnerabilities
 *   Body: { id, status }  — update vulnerability status
 *
 * Fail-loud contract:
 *   - All inputs validated explicitly, no silent coercion
 *   - DB errors surface as 500 with detail (not empty array)
 *   - Required fields must be present; throw if missing
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const VALID_SEVERITIES = ["critical", "high", "medium", "low"] as const;
const VALID_STATUSES = ["open", "confirmed", "fixed", "wontfix"] as const;
const VALID_SORTS = ["created_at", "severity", "title", "status"] as const;

function parseIntStrict(raw: string | null, field: string): number {
  if (raw === null) throw new Error(`Missing required numeric param: ${field}`);
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) throw new Error(`Invalid numeric value for ${field}: ${raw}`);
  return n;
}

function requireString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Field "${field}" must be a non-empty string`);
  }
  return v;
}

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
    const search = searchParams.get("search");

    const page = searchParams.get("page") === null
      ? 1
      : parseIntStrict(searchParams.get("page"), "page");
    const limit = searchParams.get("limit") === null
      ? 20
      : parseIntStrict(searchParams.get("limit"), "limit");
    if (page < 1) throw new Error("page must be >= 1");
    if (limit < 1 || limit > 50) throw new Error("limit must be 1..50");

    const sortRaw = searchParams.get("sort");
    const sortColumn = sortRaw && (VALID_SORTS as readonly string[]).includes(sortRaw)
      ? sortRaw
      : "created_at";

    const orderRaw = searchParams.get("order");
    if (orderRaw !== null && orderRaw !== "asc" && orderRaw !== "desc") {
      throw new Error(`Invalid order: ${orderRaw}`);
    }
    const order = orderRaw === "asc" ? "asc" : "desc";

    if (severity !== null && !(VALID_SEVERITIES as readonly string[]).includes(severity)) {
      throw new Error(`Invalid severity: ${severity}`);
    }
    if (status !== null && !(VALID_STATUSES as readonly string[]).includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Scope to user's owned reports
    const { data: userReports, error: reportsErr } = await supabase
      .from("audit_reports")
      .select("id")
      .eq("user_id", session.user.id);
    if (reportsErr) throw new Error(`Failed to load owned reports: ${reportsErr.message}`);
    if (!Array.isArray(userReports)) throw new Error("Owned reports query did not return array");
    if (userReports.length === 0) {
      return NextResponse.json({ vulnerabilities: [], total: 0, page, limit, totalPages: 1 });
    }
    const ownedIds = userReports.map((r: any) => r.id);

    let query = supabase
      .from("vulnerabilities")
      .select(`
        *,
        vulnerability_categories!inner(name, owasp_url)
      `, { count: "exact" })
      .in("report_id", ownedIds);

    if (reportId !== null) query = query.eq("report_id", reportId);
    if (severity !== null) query = query.eq("severity", severity);
    if (categoryId !== null) query = query.eq("category_id", categoryId);
    if (status !== null) query = query.eq("status", status);
    if (search !== null && search.length > 0) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order(sortColumn, { ascending: order === "asc" })
      .range(from, to);

    if (error) throw new Error(`Vulnerabilities query failed: ${error.message}`);
    if (count === null) throw new Error("Count not returned");
    if (!Array.isArray(data)) throw new Error("Vulnerabilities query did not return array");

    const vulnerabilities = data.map((row: any) => {
      if (!row.vulnerability_categories) {
        throw new Error(`Vulnerability ${row.id} missing joined category record`);
      }
      return {
        id: row.id,
        report_id: requireString(row.report_id, "report_id"),
        title: requireString(row.title, "title"),
        severity: requireString(row.severity, "severity"),
        category_id: requireString(row.category_id, "category_id"),
        category_name: requireString(row.vulnerability_categories.name, "category_name"),
        description: row.description,
        remediation: row.remediation,
        file_path: row.file_path,
        line_number: row.line_number,
        code_snippet: row.code_snippet,
        root_cause: row.root_cause,
        attack_path: row.attack_path,
        impact: row.impact,
        cvss_score: row.cvss_score,
        status: requireString(row.status, "status"),
        created_at: row.created_at,
      };
    });

    return NextResponse.json({
      vulnerabilities,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Vulnerabilities API error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
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

    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
    }

    const id = body?.id;
    const newStatus = body?.status;

    if (typeof id !== "string" || id.length === 0) {
      return NextResponse.json({ error: "id is required (non-empty string)" }, { status: 400 });
    }
    if (typeof newStatus !== "string" || !(VALID_STATUSES as readonly string[]).includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    const { data: vuln, error: fetchError } = await supabase
      .from("vulnerabilities")
      .select("report_id")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(`Vulnerability lookup failed: ${fetchError.message}`);
    if (!vuln) {
      return NextResponse.json({ error: "Vulnerability not found" }, { status: 404 });
    }

    const { data: report, error: reportErr } = await supabase
      .from("audit_reports")
      .select("user_id")
      .eq("id", vuln.report_id)
      .eq("user_id", session.user.id)
      .single();

    if (reportErr) throw new Error(`Report lookup failed: ${reportErr.message}`);
    if (!report) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("vulnerabilities")
      .update({ status: newStatus })
      .eq("id", id);

    if (updateError) {
      throw new Error(`Failed to update vulnerability: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, id, status: newStatus });
  } catch (error) {
    console.error("Vulnerabilities PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
