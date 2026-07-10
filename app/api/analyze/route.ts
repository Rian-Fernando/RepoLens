import { NextRequest, NextResponse } from "next/server";
import { collect, GitHubError } from "@/lib/github";
import { analyze } from "@/lib/analyze";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { username?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const username = body.username?.trim();
  if (!username || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) {
    return NextResponse.json({ error: "Enter a valid GitHub username." }, { status: 400 });
  }
  const token = body.token?.trim() || undefined;

  try {
    const collected = await collect(username, token);
    if (collected.allRepos.length === 0) {
      return NextResponse.json(
        { error: `${username} has no public repositories to analyze.` },
        { status: 422 },
      );
    }
    return NextResponse.json(analyze(collected));
  } catch (e) {
    if (e instanceof GitHubError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("analyze failed", e);
    return NextResponse.json(
      { error: "Something went wrong while talking to GitHub. Try again." },
      { status: 500 },
    );
  }
}
