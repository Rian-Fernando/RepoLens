import { NextResponse } from "next/server";
import { LOGIN_COOKIE, TOKEN_COOKIE } from "@/lib/oauth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(TOKEN_COOKIE);
  res.cookies.delete(LOGIN_COOKIE);
  return res;
}
