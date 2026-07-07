/**
 * POST /api/repo/save
 * 
 * Save a scanned repo and its files to the database.
 * Upserts by (user_id, repo_url) — replaces files if repo was scanned before.
 * 
 * Request:  { repoUrl, owner, repo, files: [{path, content, language}] }
 * Response: { success: true, id }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function generateId(): string {
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl, owner, repo, files } = await request.json();

    if (!repoUrl || !owner || !repo || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "repoUrl, owner, repo, and files[] are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const id = generateId();
    const { error } = await supabase
      .from("scanned_repos")
      .upsert(
        {
          id,
          user_id: session.user.id,
          repo_url: repoUrl,
          owner,
          repo,
          files: files.map((f: any) => ({
            path: f.path,
            language: f.language || "unknown",
          })),
          scanned_at: new Date().toISOString(),
        },
        { onConflict: "user_id,repo_url" }
      );

    if (error) {
      console.error("Save scan error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
