import { NextRequest, NextResponse } from "next/server";
import {
  LOGIN_COOKIE,
  loginForToken,
  safeReturnPath,
  SESSION_MAX_SECONDS,
  signInConfigured,
  STATE_COOKIE,
  TOKEN_COOKIE,
} from "@/lib/oauth";

/** GitHub sends the visitor back here with a one-time code to exchange for a token. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL(`/signin?error=${reason}`, origin));
    res.cookies.delete(STATE_COOKIE);
    return res;
  };

  // Never exchange a code unless sign-in is switched on for this deployment.
  if (!signInConfigured()) return fail("unavailable");

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("cancelled"); // e.g. the visitor pressed Cancel on GitHub
  const code = params.get("code");
  const state = params.get("state");
  const expected = req.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expected || state !== expected) return fail("failed");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_APP_CLIENT_ID?.trim(),
      client_secret: process.env.GITHUB_APP_CLIENT_SECRET?.trim(),
      code,
    }),
    cache: "no-store",
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  const accessToken = typeof tokenData.access_token === "string" ? tokenData.access_token : null;
  if (!accessToken) return fail("failed");

  const login = await loginForToken(accessToken);
  if (!login) return fail("failed");

  // Keep the session no longer than GitHub keeps the token (8 hours by default).
  const expiresIn = Number(tokenData.expires_in);
  const maxAge = Math.min(SESSION_MAX_SECONDS, expiresIn > 120 ? expiresIn - 60 : SESSION_MAX_SECONDS);

  let returnTo = "/";
  try {
    returnTo = decodeURIComponent(state.split(":")[1] ?? "/");
  } catch {
    /* malformed encoding → home */
  }
  const res = NextResponse.redirect(new URL(safeReturnPath(returnTo), origin));
  res.cookies.delete(STATE_COOKIE);
  const cookie = { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax" as const, maxAge, path: "/" };
  res.cookies.set(TOKEN_COOKIE, accessToken, cookie);
  res.cookies.set(LOGIN_COOKIE, login, cookie);
  return res;
}
