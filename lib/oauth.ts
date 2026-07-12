import { cookies } from "next/headers";

/**
 * Minimal GitHub OAuth session for the Fix-PR feature.
 * Config (both required for the feature to appear):
 *   GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET — an OAuth App with
 *   callback https://repolens.rianfernando.com/api/auth/callback
 * Scope: public_repo (open PRs on the visitor's own public repos).
 * The access token lives in an httpOnly, Secure, SameSite=Lax cookie for 8h —
 * it is never exposed to client JS and never stored server-side.
 */

export const TOKEN_COOKIE = "rl_gh_token";
export const STATE_COOKIE = "rl_oauth_state";

export function oauthConfigured(): boolean {
  return Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET);
}

export async function sessionToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(TOKEN_COOKIE)?.value ?? null;
}

/** Validate the cookie token against GitHub; returns the login or null. */
export async function sessionLogin(): Promise<string | null> {
  const token = await sessionToken();
  if (!token) return null;
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "repolens",
    },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const user = await res.json();
  return typeof user.login === "string" ? user.login : null;
}
