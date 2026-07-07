/**
 * Agent detection from repository files.
 *
 * Files are declared via "## Agent Scan Scope" in README.md — that is
 * the source of truth. This module returns ALL declared files.
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface RepoFileEntry {
  path: string;
  content: string;
}

export interface ScannedFile {
  path: string;
  content: string;
  language?: string;
}

// ─── Language detection ────────────────────────────────────────────

function detectLanguage(filePath: string): string | undefined {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
  };
  return map[ext ?? ""];
}

// ─── Main entry ────────────────────────────────────────────────────

/**
 * Returns ALL declared files from README scope.
 * No parser, no filtering — README is the source of truth.
 *
 * @param files - All files declared in README Agent Scan Scope
 * @returns All files with basic metadata
 */
export function scanFiles(files: RepoFileEntry[]): ScannedFile[] {
  return files.map((file) => ({
    path: file.path,
    content: file.content,
    language: detectLanguage(file.path),
  }));
}
