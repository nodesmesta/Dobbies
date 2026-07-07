/**
 * POST /api/repo/scan/stream
 *
 * Streaming version - returns logs as SSE, final data at the end.
 *
 * Request:  { repoUrl: string }
 * Response: SSE stream with log events, final "done" event contains files
 *
 * Event format:
 *   event: log
 *   data: {"message":"Fetching README.md..."}
 *
 *   event: done
 *   data: {"files":[...],"repoUrl":"..."}
 *
 * Ownership: Same strict mode as /api/repo/scan — login user must be the
 *            owner OR have admin/maintainer/collaborator push access on the
 *            target repo. Check happens BEFORE the stream opens; failure is
 *            returned as a JSON error response (status 403) rather than as
 *            an SSE event, because SSE requires the response to already be
 *            streaming-friendly by the time ownership is verified.
 */
import { NextRequest } from "next/server";
import { scanFiles } from "@/lib/github/detect-agents";
import type { RepoFileEntry } from "@/lib/github/detect-agents";
import { parseScanScope } from "@/lib/github/readme-scope";
import { createClient } from "@/utils/supabase/server";
import { verifyRepoAccess } from "@/lib/github/ownership";

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

// ─── SSE Helpers ──────────────────────────────────────────────────

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  const encoder = new TextEncoder();
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(message));
}

// ─── Route handler ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { repoUrl } = await request.json();

  if (!repoUrl || typeof repoUrl !== "string") {
    return Response.json({ error: "repoUrl is required" }, { status: 400 });
  }

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return Response.json(
      { error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" },
      { status: 400 }
    );
  }

  const { owner, repo } = parsed;

  // ── Auth + Ownership ────────────────────────────────────
  let token: string | undefined;
  let loginUsername: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.provider_token) {
      token = session.provider_token;
    }
    loginUsername =
      (session?.user?.user_metadata as any)?.user_name ??
      (session?.user?.user_metadata as any)?.preferred_username ??
      (session?.user?.user_metadata as any)?.user_login ??
      null;
  } catch {
    // Fall back to unauthenticated
  }

  // ── Ownership enforcement (sync, before stream opens) ──
  if (!token || !loginUsername) {
    return Response.json(
      {
        error:
          "Ownership verification requires GitHub OAuth sign-in. " +
          "Re-link your GitHub account in Settings, then retry. " +
          "(token=" + (token ? "present" : "missing") +
          ", githubLogin=" + (loginUsername ?? "missing") + ")",
      },
      { status: 403 }
    );
  }

  const ownership = await verifyRepoAccess(token, owner, repo, loginUsername);
  if (!ownership.allowed) {
    return Response.json(
      {
        error:
          `Access denied: ${ownership.reason} ` +
          `You must be the owner, admin, maintainer, or push collaborator of ` +
          `${owner}/${repo} to scan it via this app.`,
        accessLevel: ownership.accessLevel,
        repoOwnerLogin: ownership.repoOwnerLogin,
      },
      { status: 403 }
    );
  }

  // ── Create streaming response ──
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Fetch README.md
        sendEvent(controller, "log", { message: "Fetching README.md from repository..." });
        let readmeContent: string;
        try {
          readmeContent = await fetchFileContent(owner, repo, "README.md", token);
        } catch {
          sendEvent(controller, "log", { message: "✗ README.md not found" });
          sendEvent(controller, "error", {
            error: "README.md not found in repository root.",
          });
          controller.close();
          return;
        }
        sendEvent(controller, "log", { message: "✓ README.md found" });

        // Step 2: Parse scan scope
        sendEvent(controller, "log", { message: "Parsing '## Agent Scan Scope' section..." });
        const scopePaths = parseScanScope(readmeContent);

        if (scopePaths.length === 0) {
          sendEvent(controller, "log", { message: "✗ No files declared in scope" });
          sendEvent(controller, "error", {
            error: "No files declared in '## Agent Scan Scope'.",
          });
          controller.close();
          return;
        }
        sendEvent(controller, "log", {
          message: `✓ Found ${scopePaths.length} file(s) declared in scope`,
        });

        // Step 3: Fetch files one by one
        sendEvent(controller, "log", { message: "Fetching declared files..." });
        const entries: RepoFileEntry[] = [];
        const fetchErrors: string[] = [];

        for (const filePath of scopePaths) {
          try {
            const content = await fetchFileContent(owner, repo, filePath, token);
            entries.push({ path: filePath, content });
            sendEvent(controller, "log", { message: `✓ ${filePath}` });
          } catch {
            fetchErrors.push(filePath);
            sendEvent(controller, "log", {
              message: `⚠ ${filePath} (not found or inaccessible)`,
            });
          }
        }

        if (entries.length === 0) {
          sendEvent(controller, "error", {
            error: "None of the declared files could be fetched.",
          });
          controller.close();
          return;
        }

        sendEvent(controller, "log", {
          message: `Fetched ${entries.length}/${scopePaths.length} file(s)`,
        });

        if (fetchErrors.length > 0) {
          sendEvent(controller, "log", {
            message: `${fetchErrors.length} file(s) could not be fetched`,
          });
        }

        // Step 4: Process and return
        const files = scanFiles(entries);
        sendEvent(controller, "log", {
          message: `Returning ${files.length} file(s) for audit`,
        });

        // Send final data
        sendEvent(controller, "done", {
          files,
          repoUrl,
          owner,
          repo,
        });

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        sendEvent(controller, "error", { error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
