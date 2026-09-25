import { NextRequest, NextResponse } from "next/server";
import { collect, GitHubError, GITHUB_API_ENABLED, GITHUB_PAUSED_MESSAGE, githubBreakerOpenUntil } from "@/lib/github";
import { analyze } from "@/lib/analyze";
import { countFreshAnalyses, getBench, getCachedAnalysis, recordScore, setCachedAnalysis } from "@/lib/db";
import { overLimit } from "@/lib/guard";
import type { Analysis } from "@/lib/types";

export const maxDuration = 60;

/** Serve cached analyses this fresh without hitting GitHub at all. */
const CACHE_FRESH_MINUTES = 360; // 6h
/** On rate-limit, any cache younger than this beats an error page. */
const CACHE_STALE_MINUTES = 60 * 24 * 14; // 14 days
/** While GitHub access is paused, age stops mattering — cache is all there is. */
const CACHE_PAUSED_MINUTES = 60 * 24 * 365 * 10;
/** Fresh crawls one visitor may start per hour (whichever token pays for them). */
const CRAWLS_PER_VISITOR_PER_HOUR = 3;
/**
 * Fresh crawls per hour that may spend the shared quota. At ~42 requests each,
 * the default of 20 uses about 17% of a 5,000/hour token — far from the limit.
 */
const SHARED_CRAWLS_PER_HOUR = Math.max(1, Number(process.env.GITHUB_HOURLY_ANALYSES) || 20);

const BUSY_MESSAGE =
  "RepoLens is holding back on GitHub requests right now to stay well inside GitHub's rate limits. Try again later — or paste your own GitHub token under the form for a fresh analysis on your own quota.";

/** A stale report beats an error page when a crawl isn't allowed right now. */
async function staleOr(username: string, error: string, status: number) {
  const stale = await getCachedAnalysis(username, CACHE_STALE_MINUTES);
  if (stale) {
    const result = stale.data as Analysis;
    result.fromCache = true;
    result.cacheAgeMinutes = stale.ageMinutes;
    result.bench = await getBench(result.profile.login, result.overallScore);
    return NextResponse.json(result);
  }
  return NextResponse.json({ error }, { status });
}

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
  // A visitor-supplied token spends the visitor's own quota; otherwise collect()
  // uses the shared quota (server token or anonymous) under the shared breaker.
  const visitorToken = body.token?.trim() || undefined;

  // Cache-first for tokenless visitors: repeat lookups cost zero GitHub calls.
  // A visitor who brings their own token always gets a fresh crawl.
  // While paused, a visitor-supplied token must NOT trigger a live crawl either:
  // no request reaches GitHub from this deployment, from anyone, for any reason.
  if (!visitorToken || !GITHUB_API_ENABLED) {
    const cached = await getCachedAnalysis(
      username,
      GITHUB_API_ENABLED ? CACHE_FRESH_MINUTES : CACHE_PAUSED_MINUTES,
    );
    if (cached) {
      const result = cached.data as Analysis;
      result.fromCache = true;
      result.cacheAgeMinutes = cached.ageMinutes;
      result.bench = await getBench(result.profile.login, result.overallScore);
      return NextResponse.json(result);
    }
  }

  if (!GITHUB_API_ENABLED) {
    return NextResponse.json(
      { error: `${GITHUB_PAUSED_MESSAGE} No cached report exists for "${username}".` },
      { status: 503 },
    );
  }

  // ---- guards: everything below this line is a live GitHub crawl ----
  if (await overLimit(req, "crawl", CRAWLS_PER_VISITOR_PER_HOUR, 60)) {
    return staleOr(
      username,
      `You've started ${CRAWLS_PER_VISITOR_PER_HOUR} fresh analyses in the last hour — that's the limit that keeps RepoLens inside GitHub's rules. Previously analyzed profiles still open instantly.`,
      429,
    );
  }
  if (!visitorToken) {
    if (await githubBreakerOpenUntil()) return staleOr(username, BUSY_MESSAGE, 429);
    const recent = await countFreshAnalyses(60);
    if (recent !== null && recent >= SHARED_CRAWLS_PER_HOUR) return staleOr(username, BUSY_MESSAGE, 429);
  }

  try {
    const collected = await collect(username, visitorToken);
    if (collected.allRepos.length === 0) {
      return NextResponse.json(
        { error: `${username} has no public repositories to analyze.` },
        { status: 422 },
      );
    }
    const result = analyze(collected);
    // score DB + cache are optional — all no-op without DATABASE_URL
    await recordScore(result.profile.login, result.overallScore, result.languages[0]?.name ?? null);
    await setCachedAnalysis(result.profile.login, result);
    result.bench = await getBench(result.profile.login, result.overallScore);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof GitHubError) {
      // Rate limited (the breaker is now open) → a stale report beats an error page.
      if (e.status === 429) return staleOr(username, e.message, 429);
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("analyze failed", e);
    return NextResponse.json(
      { error: "Something went wrong while talking to GitHub. Try again." },
      { status: 500 },
    );
  }
}
