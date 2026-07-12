import { NextResponse } from "next/server";
import { oauthConfigured, sessionLogin } from "@/lib/oauth";

/** Who is signed in (for the Fix-PR UI). 200 always; login null when signed out. */
export async function GET() {
  if (!oauthConfigured()) return NextResponse.json({ configured: false, login: null });
  const login = await sessionLogin();
  return NextResponse.json({ configured: true, login });
}
