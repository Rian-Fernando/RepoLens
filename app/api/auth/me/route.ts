import { NextResponse } from "next/server";
import { GITHUB_API_ENABLED } from "@/lib/github";
import { FIX_PRS_ENABLED, sessionLogin, signInConfigured } from "@/lib/oauth";

/**
 * Sign-in state for the UI. Reads cookies only; it never calls GitHub.
 *   live:       new profiles can be analyzed on this deployment at all
 *   configured: "Sign in with GitHub" is available
 *   login:      the signed-in visitor, or null
 *   prs:        one-click fix pull requests are available
 */
export async function GET() {
  const configured = signInConfigured();
  const login = configured ? await sessionLogin() : null;
  return NextResponse.json({ live: GITHUB_API_ENABLED, configured, login, prs: configured && FIX_PRS_ENABLED });
}
