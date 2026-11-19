import { cookies } from "next/headers";
import { GITHUB_API_ENABLED } from "./github";

/**
 * "Sign in with GitHub", through a GitHub App that requests no permissions.
 *
 * GitHub Apps "don't have any permissions by default", but "they do have
 * implicit permissions to read public resources when acting on behalf of a
 * user" (GitHub docs: Choosing permissions for a GitHub App). A signed-in
 * visitor's token can therefore read any public profile, and every analysis
 * they start runs on their own GitHub rate limit rather than a shared one.
 *
 * Config: GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET from the app's
 * settings page, plus GITHUB_API_ENABLED=true. The token lives in an
 * httpOnly cookie for as long as GitHub says it is valid (8 hours) and is
 * never stored on the server.
 */

export const TOKEN_COOKIE = "rl_gh_token";
export const LOGIN_COOKIE = "rl_gh_login";
export const STATE_COOKIE = "rl_oauth_state";

/**
 * One-click fix PRs stay off: a sign-in-only app (no permissions) can read
 * public data but cannot write to repositories. Turning this on also needs
 * Contents + Pull requests write access on the app, installed on the repo.
 */
export const FIX_PRS_ENABLED = process.env.FIX_PRS_ENABLED === "true";

/** Longest a sign-in is kept, even if GitHub issued a longer-lived token. */
export const SESSION_MAX_SECONDS = 8 * 60 * 60;

const LOGIN_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

export function signInConfigured(): boolean {
  return (
    GITHUB_API_ENABLED &&
    Boolean(process.env.GITHUB_APP_CLIENT_ID?.trim() && process.env.GITHUB_APP_CLIENT_SECRET?.trim())
  );
}

/** The signed-in visitor's GitHub token, or null. Ignored unless sign-in is configured. */
export async function sessionToken(): Promise<string | null> {
  if (!signInConfigured()) return null;
  const jar = await cookies();
  return jar.get(TOKEN_COOKIE)?.value || null;
}

/** The signed-in visitor's username, for display and rate limiting only. */
export async function sessionLogin(): Promise<string | null> {
  if (!signInConfigured()) return null;
  const jar = await cookies();
  if (!jar.get(TOKEN_COOKIE)?.value) return null;
  const login = jar.get(LOGIN_COOKIE)?.value ?? "";
  return LOGIN_RE.test(login) ? login : null;
}

/** Ask GitHub who a token belongs to: one request, on that token's own quota. */
export async function loginForToken(token: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "repolens",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const user = await res.json().catch(() => ({}));
  return typeof user.login === "string" && LOGIN_RE.test(user.login) ? user.login : null;
}

/**
 * Only same-site paths may be used as a post-login destination. "//host" and
 * "/\\host" are protocol-relative URLs that browsers resolve to another origin,
 * so a plain startsWith("/") check is an open redirect.
 */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !/^\/(?![\/\\])/.test(value) || /[\u0000-\u001f]/.test(value)) return "/";
  return value;
}
