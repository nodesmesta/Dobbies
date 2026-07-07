/**
 * README.md Agent Scan Scope parser.
 *
 * Reads the "## Agent Scan Scope" section from a repository's README.md
 * and extracts file paths that should be included in the security audit.
 *
 * Format (in README.md):
 *
 *   ## Agent Scan Scope
 *
 *   Files below contain AI agent definitions:
 *
 *   - src/system.txt
 *   - src/tools/indexing.ts
 *   - prompts/coding.md
 *   - .cursorrules
 *
 * The section ends at the next major heading (##) or end of file.
 * Sub-headings (###) are allowed inside the section.
 */

const SCOPE_HEADER = /^##\s+Agent Scan Scope\s*$/im;

/**
 * Parses README.md content and returns file paths declared under
 * the "## Agent Scan Scope" section.
 *
 * @param readme — Full content of README.md
 * @returns Array of file paths (absolute relative to repo root)
 */
export function parseScanScope(readme: string): string[] {
  const lines = readme.split("\n");

  // Find the section header
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (SCOPE_HEADER.test(lines[i])) {
      startIdx = i + 1;
      break;
    }
  }

  if (startIdx === -1) return [];

  const paths: string[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];

    // Stop at next ## heading (allow ### sub-headings inside scope)
    if (/^##\s/.test(line)) break;

    // Skip empty lines
    if (line.trim() === "") continue;

    // Match markdown list item: "- path/to/file" or "* path/to/file"
    const match = line.match(/^[\s]*[-*]\s+(.+)$/);
    if (match) {
      const filePath = match[1].trim();
      // Ignore if it looks like explanatory text (spaces, long text)
      // Valid paths: no spaces in filename, starts with valid chars
      if (isValidFilePath(filePath)) {
        paths.push(filePath);
      }
    }
  }

  return paths;
}

/**
 * Basic validation: file path should not contain spaces,
 * not be empty, and not start with special chars that indicate
 * explanatory text rather than a file path.
 */
function isValidFilePath(path: string): boolean {
  if (!path || path.length === 0) return false;
  if (/\s/.test(path)) return false;       // no spaces in path
  if (/^[A-Z]/.test(path) && path.length > 50) return false; // likely English sentence
  if (/^[a-z]:\\/i.test(path)) return false; // Windows absolute path
  return true;
}
