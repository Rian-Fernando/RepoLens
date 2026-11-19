import { NextRequest, NextResponse } from "next/server";
import {
  collect,
  GitHubError,
  GITHUB_API_ENABLED,
  GITHUB_PAUSED_MESSAGE,
  githubBreakerOpenUntil,
  SIGN_IN_MESSAGE,
} from "@/lib/github";
import { analyze } from "@/lib/analyze";
import { countFreshAnalyses, getBench, getCachedAnalysis, recordScore, setCachedAnalysis } from "@/lib/db";
import { overLimit, overLimitFor } from "@/lib/guard";
import { LOGIN_COOKIE, sessionLogin, sessionToken, TOKEN_COOKIE } from "@/lib/oauth";
import type { Analysis } from "@/lib/types";

export const maxDuration = 60;

/**
 * An existing report is always served, whatever its age; it shows when it was
 * made. GitHub is only contacted for a profile that has never been analyzed,
 * or when a signed-in visitor explicitly asks to re-analyze. Opening a report
 * never starts a crawl on its own.
 */
const CACHE_ANY_AGE = 60 * 24 * 365 * 10;

/** Fresh analyses a signed-in visitor may start per hour, on their own GitHub quota. */
const CRAWLS_PER_USER_PER_HOUR = 10;
/** Fresh analyses per visitor per hour when a server token pays instead. */
const CRAWLS_PER_VISITOR_PER_HOUR = 3;
/** Fresh analyses per hour on a server token (~42 requests each; 20 ≈ 17% of 5,000). */
const SHARED_CRAWLS_PER_HOUR = Math.max(1, Number(process.env.GITHUB_HOURLY_ANALYSES) || 20);

const BUSY_MESSAGE =
  "RepoLens is holding back on GitHub requests right now to stay inside GitHub's rate limits. Try again a little later.";

async function cachedReport(username: string, maxAgeMinutes: number) {
  const cached = await getCachedAnalysis(username, maxAgeMinutes);
  if (!cached) return null;
  const result = cached.data as Analysis;
  result.fromCache = true;
  result.cacheAgeMinutes = cached.ageMinutes;
  result.bench = await getBench(result.profile.login, result.overallScore);
  return NextResponse.json(result);
}

/** When a re-analysis isn't allowed right now, the existing report beats an error. */
async function staleOr(username: string, error: string, status: number) {
  return (await cachedReport(username, CACHE_ANY_AGE)) ?? NextResponse.json({ error }, { status });
}

export async function POST(req: NextRequest) {
  let body: { username?: string; refresh?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const username = body.username?.trim();
  if (!username || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) {
    return NextResponse.json({ error: "Enter a valid GitHub username." }, { status: 400 });
  }

  // Who would pay for a crawl: the signed-in visitor's own token, else a server
  // token if one is configured. With neither, nothing here contacts GitHub.
  const userToken = await sessionToken();
  const serverToken = process.env.GITHUB_TOKEN?.trim() || null;
  const canCrawl = GITHUB_API_ENABLED && Boolean(userToken || serverToken);
  const forceFresh = body.refresh === true && Boolean(userToken);

  // 1. Cache first: an existing report costs GitHub nothing.
  if (!forceFresh) {
    const hit = await cachedReport(username, CACHE_ANY_AGE);
    if (hit) return hit;
  }

  // 2. No way to crawl right now.
  if (!GITHUB_API_ENABLED) {
    return NextResponse.json(
      { error: `${GITHUB_PAUSED_MESSAGE} No cached report exists for "${username}".` },
      { status: 503 },
    );
  }
  if (!canCrawl) {
    return NextResponse.json({ error: SIGN_IN_MESSAGE, needsSignIn: true }, { status: 401 });
  }

  // 3. Guards. Everything below this line is a live GitHub crawl.
  if (userToken) {
    const login = (await sessionLogin()) ?? "unknown";
    if (await overLimitFor(`user:${login}`, "crawl-user", CRAWLS_PER_USER_PER_HOUR, 60)) {
      return staleOr(
        username,
        `You've started ${CRAWLS_PER_USER_PER_HOUR} fresh analyses in the last hour, which is the limit that keeps RepoLens well inside GitHub's rules. Profiles that were already analyzed still open.`,
        429,
      );
    }
  } else {
    if (await overLimit(req, "crawl", CRAWLS_PER_VISITOR_PER_HOUR, 60)) {
      return staleOr(
        username,
        `You've started ${CRAWLS_PER_VISITOR_PER_HOUR} fresh analyses in the last hour. Profiles that were already analyzed still open.`,
        429,
      );
    }
    if (await githubBreakerOpenUntil()) return staleOr(username, BUSY_MESSAGE, 429);
    const recent = await countFreshAnalyses(60);
    if (recent !== null && recent >= SHARED_CRAWLS_PER_HOUR) return staleOr(username, BUSY_MESSAGE, 429);
  }

  try {
    const collected = await collect(username, userToken ?? undefined);
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
      // The visitor's own token was rejected: it expired or was revoked. Sign them out.
      if (e.status === 401 && userToken) {
        const res = NextResponse.json(
          { error: "Your GitHub sign-in has expired. Sign in again to keep analyzing.", needsSignIn: true },
          { status: 401 },
        );
        res.cookies.delete(TOKEN_COOKIE);
        res.cookies.delete(LOGIN_COOKIE);
        return res;
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
