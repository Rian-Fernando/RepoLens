import { NextRequest, NextResponse } from "next/server";
import { collect, GitHubError } from "@/lib/github";
import { analyze } from "@/lib/analyze";
import { getBench, getCachedAnalysis, recordScore, setCachedAnalysis } from "@/lib/db";
import type { Analysis } from "@/lib/types";

export const maxDuration = 60;

/** Serve cached analyses this fresh without hitting GitHub at all. */
const CACHE_FRESH_MINUTES = 360; // 6h
/** On rate-limit, any cache younger than this beats an error page. */
const CACHE_STALE_MINUTES = 60 * 24 * 14; // 14 days

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
  // visitor-supplied token wins (their 5,000/hr quota); otherwise the server's
  // GITHUB_TOKEN keeps production off the shared unauthenticated 60/hr pool
  const visitorToken = body.token?.trim() || undefined;
  const token = visitorToken || process.env.GITHUB_TOKEN?.trim() || undefined;

  // Cache-first for tokenless visitors: repeat lookups cost zero GitHub calls.
  // A visitor who brings their own token always gets a fresh crawl.
  if (!visitorToken) {
    const cached = await getCachedAnalysis(username, CACHE_FRESH_MINUTES);
    if (cached) {
      const result = cached.data as Analysis;
      result.fromCache = true;
      result.cacheAgeMinutes = cached.ageMinutes;
      result.bench = await getBench(result.profile.login, result.overallScore);
      return NextResponse.json(result);
    }
  }

  try {
    const collected = await collect(username, token);
    if (collected.allRepos.length === 0) {
      return NextResponse.json(
        { error: `${username} has no public repositories to analyze.` },
        { status: 422 },
      );
    }
    const result = analyze(collected);
    // score DB + cache are optional — all no-op without DATABASE_URL
    await recordScore(result.profile.login, result.overallScore);
    await setCachedAnalysis(result.profile.login, result);
    result.bench = await getBench(result.profile.login, result.overallScore);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof GitHubError) {
      // Quota exhausted → a stale report beats an error page.
      if (e.status === 429) {
        const stale = await getCachedAnalysis(username, CACHE_STALE_MINUTES);
        if (stale) {
          const result = stale.data as Analysis;
          result.fromCache = true;
          result.cacheAgeMinutes = stale.ageMinutes;
          result.bench = await getBench(result.profile.login, result.overallScore);
          return NextResponse.json(result);
        }
        return NextResponse.json(
          {
            error:
              "RepoLens is busier than its GitHub API budget right now. Try again in a few minutes — or expand the token field and paste your own (free) GitHub token for an instant fresh analysis.",
          },
          { status: 429 },
        );
      }
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("analyze failed", e);
    return NextResponse.json(
      { error: "Something went wrong while talking to GitHub. Try again." },
      { status: 500 },
    );
  }
}
