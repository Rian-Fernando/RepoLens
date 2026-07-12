import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { oauthConfigured, STATE_COOKIE } from "@/lib/oauth";
import { SITE_URL } from "@/lib/site";

/** Kick off GitHub OAuth. ?returnTo=/u/foo brings the visitor back afterwards. */
export async function GET(req: NextRequest) {
  if (!oauthConfigured()) {
    return NextResponse.json({ error: "GitHub sign-in is not configured on this deployment." }, { status: 503 });
  }
  const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";
  const state = `${randomBytes(16).toString("hex")}:${encodeURIComponent(returnTo)}`;

  const origin = process.env.NODE_ENV === "development" ? req.nextUrl.origin : SITE_URL;
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_OAUTH_CLIENT_ID!);
  authorize.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  authorize.searchParams.set("scope", "public_repo");
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
