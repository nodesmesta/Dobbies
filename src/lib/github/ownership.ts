/**
 * GitHub repository ownership/access verification.
 *
 * Enforces: a user can only scan repos where they are owner OR have push
 * (admin/maintain/write) access. Read-only viewers (pull-only, public
 * watchers, fork PR submitters) are rejected — the audit pipeline reasons
 * about code that the user is responsible for, not arbitrary public repos.
 *
 * Implementation: single GitHub GET /repos/{owner}/{repo} call with the
 * user's OAuth token. The response includes both `owner.login` and a
 * `permissions` object scoped to the authed user, so one round-trip covers
 * the full check. Result is cached upstream by GitHub (ETag-aware), so this
 * is cheap even for repeated scans.
 *
 * Trade-off: we accept GitHub's permission model instead of inventing our
 * own. admin > maintain > push > pull > none — we allow the first three.
 */

export type AccessLevel = "owner" | "admin" | "maintainer" | "collaborator" | "none";

export interface OwnershipResult {
  allowed: boolean;
  accessLevel: AccessLevel;
  reason: string;
  repoOwnerLogin: string | null;
}

export async function verifyRepoAccess(
  token: string,
  owner: string,
  repo: string,
  loginUsername: string,
): Promise<OwnershipResult> {
  if (!loginUsername) {
    return {
      allowed: false,
      accessLevel: "none",
      reason: "Could not resolve your GitHub login from the auth session. Sign in via GitHub OAuth to verify ownership.",
      repoOwnerLogin: null,
    };
  }
  if (!token) {
    return {
      allowed: false,
      accessLevel: "none",
      reason: "No GitHub OAuth token available; cannot verify ownership without it.",
      repoOwnerLogin: null,
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "act-audit-ownership-check/1.0",
  };

  const repoRes = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers },
  );

  // 404 = repo does not exist OR user has no visibility. We do not
  // distinguish these cases (privacy) — both lead to the same outcome.
  if (repoRes.status === 404) {
    return {
      allowed: false,
      accessLevel: "none",
      reason: `Repository ${owner}/${repo} not found or not visible to the signed-in GitHub account.`,
      repoOwnerLogin: null,
    };
  }
  // 401/403 = token invalid or token cannot read this repo at all.
  if (repoRes.status === 401 || repoRes.status === 403) {
    return {
      allowed: false,
      accessLevel: "none",
      reason: `GitHub refused access to ${owner}/${repo} (HTTP ${repoRes.status}). Check that your OAuth token is valid.`,
      repoOwnerLogin: null,
    };
  }
  if (!repoRes.ok) {
    return {
      allowed: false,
      accessLevel: "none",
      reason: `GitHub API returned HTTP ${repoRes.status} for ${owner}/${repo}: ${repoRes.statusText}`,
      repoOwnerLogin: null,
    };
  }

  const data = await repoRes.json();
  const repoOwnerLogin: string = typeof data?.owner?.login === "string" ? data.owner.login : "";
  const perms = (data?.permissions ?? {}) as Record<string, unknown>;

  // 1. Owner check — case-insensitive (GitHub logins are case-insensitive).
  if (repoOwnerLogin && repoOwnerLogin.toLowerCase() === loginUsername.toLowerCase()) {
    return {
      allowed: true,
      accessLevel: "owner",
      reason: `You are the owner of ${repoOwnerLogin}/${repo}.`,
      repoOwnerLogin,
    };
  }

  // 2. Permission check — admin > maintain > push. Pull-only is intentionally
  //    rejected because we don't audit read-only viewers.
  if (perms.admin === true) {
    return {
      allowed: true,
      accessLevel: "admin",
      reason: `You have admin access to ${repoOwnerLogin}/${repo}.`,
      repoOwnerLogin,
    };
  }
  if (perms.maintain === true) {
    return {
      allowed: true,
      accessLevel: "maintainer",
      reason: `You are a maintainer of ${repoOwnerLogin}/${repo}.`,
      repoOwnerLogin,
    };
  }
  if (perms.push === true) {
    return {
      allowed: true,
      accessLevel: "collaborator",
      reason: `You have push access (collaborator) on ${repoOwnerLogin}/${repo}.`,
      repoOwnerLogin,
    };
  }

  return {
    allowed: false,
    accessLevel: "none",
    reason: `Repository is owned by @${repoOwnerLogin || "(unknown)"}, but your GitHub account (@${loginUsername}) only has ${
      perms.pull === true ? "pull (read-only)" : "no"
    } access. Ownership check requires owner, admin, maintainer, or push (collaborator) role.`,
    repoOwnerLogin,
  };
}
