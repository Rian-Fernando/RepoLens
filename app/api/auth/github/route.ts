import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { safeReturnPath, signInConfigured, STATE_COOKIE } from "@/lib/oauth";
import { SITE_URL } from "@/lib/site";

/** Start "Sign in with GitHub". ?returnTo=/u/foo brings the visitor back afterwards. */
export async function GET(req: NextRequest) {
  if (!signInConfigured()) {
    return NextResponse.redirect(new URL("/signin?error=unavailable", req.nextUrl.origin));
  }
  const returnTo = safeReturnPath(req.nextUrl.searchParams.get("returnTo"));
  const state = `${randomBytes(16).toString("hex")}:${encodeURIComponent(returnTo)}`;

  // A local preview calls back to localhost; every deployment uses the canonical domain.
  const origin = req.nextUrl.hostname === "localhost" ? req.nextUrl.origin : SITE_URL;
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", process.env.GITHUB_APP_CLIENT_ID!.trim());
  authorize.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
