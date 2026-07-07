/**
 * GET /api/repo/list
 *
 * List all previously scanned repos for the current user.
 * Includes audit status per file by cross-referencing audit_reports.
 *
 * Response: { repos: ScannedRepoWithStatus[] }
 */
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface ScannedFile {
  path: string;
  language: string;
}

interface ScannedRepo {
  id: string;
  repo_url: string;
  owner: string;
  repo: string;
  files: ScannedFile[];
  scanned_at: string;
}

interface ScannedFileWithStatus extends ScannedFile {
  audited: boolean;
  auditId?: string;
  auditScore?: number;
}

interface ScannedRepoWithStatus extends ScannedRepo {
  files: ScannedFileWithStatus[];
  auditedCount: number;
  totalCount: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ repos: [] });
    }

    // Fetch scanned repos
    const { data: repos, error: repoError } = await supabase
      .from("scanned_repos")
      .select("*")
      .eq("user_id", session.user.id)
      .order("scanned_at", { ascending: false });

    if (repoError || !repos || repos.length === 0) {
      return NextResponse.json({ repos: [] });
    }

    // Fetch all audit reports for this user to cross-reference
    const { data: audits } = await supabase
      .from("audit_reports")
      .select("id, repo_url, file_path, overall_score")
      .eq("user_id", session.user.id);

    // Build a lookup: repo_url + file_path → audit info
    const auditLookup = new Map<string, { id: string; score: number }>();
    if (audits) {
      for (const audit of audits) {
        if (audit.repo_url && audit.file_path) {
          const key = `${audit.repo_url}:::${audit.file_path}`;
          auditLookup.set(key, {
            id: audit.id,
            score: audit.overall_score,
          });
        }
      }
    }

    // Enrich repos with audit status per file
    const reposWithStatus: ScannedRepoWithStatus[] = repos.map((repo: any) => {
      const files: ScannedFileWithStatus[] = (repo.files || []).map((f: ScannedFile) => {
        const key = `${repo.repo_url}:::${f.path}`;
        const audit = auditLookup.get(key);
        return {
          ...f,
          audited: !!audit,
          auditId: audit?.id,
          auditScore: audit?.score,
        };
      });

      const auditedCount = files.filter((f) => f.audited).length;

      return {
        id: repo.id,
        repo_url: repo.repo_url,
        owner: repo.owner,
        repo: repo.repo,
        files,
        scanned_at: repo.scanned_at,
        auditedCount,
        totalCount: files.length,
      };
    });

    return NextResponse.json({ repos: reposWithStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
