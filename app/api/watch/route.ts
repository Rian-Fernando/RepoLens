import { NextRequest, NextResponse } from "next/server";
import { addWatch, getLatestScore } from "@/lib/db";

/**
 * Watch mode: weekly re-score + email on change (Resend free tier).
 * GET reports whether the feature is configured; POST subscribes.
 */

function watchConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.DATABASE_URL);
}

export async function GET() {
  return NextResponse.json({ configured: watchConfigured() });
}

export async function POST(req: NextRequest) {
  if (!watchConfigured()) {
    return NextResponse.json({ error: "Watch mode isn't configured on this deployment." }, { status: 503 });
  }
  let login: string, email: string;
  try {
    const body = await req.json();
    login = String(body.login ?? "").trim();
    email = String(body.email ?? "").trim();
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(login)) throw new Error("bad login");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) throw new Error("bad email");
  } catch {
    return NextResponse.json({ error: "Send a valid { login, email }." }, { status: 400 });
  }

  const current = await getLatestScore(login);
  const ok = await addWatch(login, email, current);
  if (!ok) return NextResponse.json({ error: "Couldn't save the subscription — try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
