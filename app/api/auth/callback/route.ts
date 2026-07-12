import { NextRequest, NextResponse } from "next/server";
import { STATE_COOKIE, TOKEN_COOKIE } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/?auth=failed", req.nextUrl.origin));
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  const accessToken: string | undefined = tokenData.access_token;

  const returnTo = decodeURIComponent(state.split(":")[1] ?? "/");
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/";
  const res = NextResponse.redirect(new URL(accessToken ? safeReturn : "/?auth=failed", req.nextUrl.origin));
  res.cookies.delete(STATE_COOKIE);
  if (accessToken) {
    res.cookies.set(TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    });
  }
  return res;
}
