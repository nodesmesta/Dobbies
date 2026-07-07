/**
 * POST /api/repo/scan
 *
 * Scans a GitHub repository for AI agent definitions.
 * README.md "## Agent Scan Scope" is the source of truth —
 * all declared files are fetched and returned.
 *
 * Request:  { repoUrl: string }
 * Response: { files: ScannedFile[], scanLog: string[] }
 *
 * Auth: Requires Supabase session with GitHub provider_token.
 *       Falls back to unauthenticated GitHub API if no token.
 */
import { NextRequest, NextResponse } from "next/server";
import { scanFiles } from "@/lib/github/detect-agents";
import type { RepoFileEntry } from "@/lib/github/detect-agents";
import { parseScanScope } from "@/lib/github/readme-scope";
import { createClient } from "@/utils/supabase/server";

// ─── GitHub API helpers ───────────────────────────────────────────

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.raw+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
  }

  return res.text();
}

// ─── URL parsing ──────────────────────────────────────────────────

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\/|$)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

// ─── Route handler ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();
    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "repoUrl is required" },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // ── Auth: try to get Supabase session with provider_token ──
    let token: string | undefined;
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token) {
        token = session.provider_token;
      }
    } catch {
      // No Supabase configured — fall back to unauthenticated
    }

    const scanLog: string[] = [];

    // ── Step 1: Fetch README.md ──────────────────────────────────
    scanLog.push("Fetching README.md from repository...");
    let readmeContent: string;
    try {
      readmeContent = await fetchFileContent(owner, repo, "README.md", token);
    } catch {
      return NextResponse.json(
        {
          error: "README.md not found in repository root. " +
                  "Repository must have a README.md with an '## Agent Scan Scope' section " +
                  "declaring which files contain agent definitions.",
          scanLog: [...scanLog, "  ✗ README.md not found"],
        },
        { status: 400 }
      );
    }
    scanLog.push("  ✓ README.md found");

    // ── Step 2: Parse scan scope from README.md ─────────────────
    scanLog.push("Parsing '## Agent Scan Scope' section...");
    const scopePaths = parseScanScope(readmeContent);

    if (scopePaths.length === 0) {
      return NextResponse.json(
        {
          error: "No files declared in '## Agent Scan Scope'. " +
                  "Add a section to README.md listing files to audit, e.g.:\n\n" +
                  "## Agent Scan Scope\n\n" +
                  "- src/agent.ts\n- config/agent.json",
          scanLog: [
            ...scanLog,
            "  ✗ No '## Agent Scan Scope' section or no file paths found",
          ],
        },
        { status: 400 }
      );
    }
    scanLog.push(`  ✓ Found ${scopePaths.length} file(s) declared in scope`);

    // ── Step 3: Fetch ALL declared files ────────────────────────
    scanLog.push("Fetching declared files...");
    const entries: RepoFileEntry[] = [];
    const fetchErrors: string[] = [];

    for (const filePath of scopePaths) {
      try {
        const content = await fetchFileContent(owner, repo, filePath, token);
        entries.push({ path: filePath, content });
        scanLog.push(`  ✓ ${filePath}`);
      } catch {
        fetchErrors.push(filePath);
        scanLog.push(`  ⚠ ${filePath} (not found or inaccessible)`);
      }
    }

    if (entries.length === 0) {
      return NextResponse.json(
        {
          error: "None of the declared files could be fetched.",
          scanLog,
        },
        { status: 400 }
      );
    }

    scanLog.push(`Fetched ${entries.length}/${scopePaths.length} file(s)`);
    if (fetchErrors.length > 0) {
      scanLog.push(`${fetchErrors.length} file(s) could not be fetched`);
    }

    // ── Step 4: Return ALL files (README is source of truth) ─────
    const files = scanFiles(entries);
    scanLog.push(`Returning ${files.length} file(s) for audit`);

    return NextResponse.json({
      files,           // ALL files from README scope
      scanLog,
      repoUrl,
      owner,
      repo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
