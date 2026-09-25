/**
 * GitHub REST client + data collection for one user.
 *
 * Request budget per analysis: 1 (user) + 1 (repo list) + 3 per deep-dive repo
 * (languages, readme, commits) + 1 (profile README) + 3 (search) — at most 42.
 *
 * Compliance rules this client enforces, from GitHub's REST API docs
 * (docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api):
 *   - requests are made serially, never concurrently
 *   - a rate-limited response opens a circuit breaker shared by every server
 *     instance until retry-after / x-ratelimit-reset; nothing is retried
 *     automatically ("continuing to make requests while you are rate limited
 *     may result in the banning of your integration")
 *   - the last 20% of the hourly quota is never spent
 * Per-visitor limits and the hourly analysis budget live in /api/analyze.
 */

import { getGuardUntil, setGuardUntil } from "./db";

const API = "https://api.github.com";
export const DEEP_DIVE_LIMIT = 12;

/**
 * GLOBAL KILL SWITCH — GitHub API access is OFF unless explicitly enabled.
 *
 * Every outbound call to GitHub in this app funnels through this module, so
 * flipping this off stops all of it: profile analysis, badges, the score API,
 * OG cards and the weekly cron. It defaults to disabled deliberately, so a
 * deploy alone halts traffic without needing an environment change.
 *
 * To turn GitHub access back on, set GITHUB_API_ENABLED=true.
 */
export const GITHUB_API_ENABLED = process.env.GITHUB_API_ENABLED === "true";

export const GITHUB_PAUSED_MESSAGE =
  "Live GitHub analysis is paused on this deployment. Reports already in the cache still open normally.";

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface GhRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  pushed_at: string;
  language: string | null;
  topics?: string[];
  homepage: string | null;
  license: { key: string } | null;
  archived: boolean;
  size: number;
  owner: { login: string };
}

interface GhCommit {
  commit: { author: { date: string } | null; message: string };
}

export interface GhUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  public_repos: number;
  created_at: string;
  html_url: string;
}

export interface CollectedRepo {
  repo: GhRepo;
  languages: Record<string, number>;
  readme: string | null;
  commitSamples: Array<{ date: string; message: string }>;
}

export interface Collab {
  mergedPrsElsewhere: number | null;
  issuesElsewhere: number | null;
  reviewsElsewhere: number | null;
}

export interface Collected {
  user: GhUser;
  allRepos: GhRepo[];
  deepDive: CollectedRepo[];
  hasProfileReadme: boolean;
  collab: Collab;
}

function headers(token?: string, raw = false): HeadersInit {
  const h: Record<string, string> = {
    Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "repolens",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** Breaker key for the shared quota (the server token, or anonymous requests). */
const SHARED_BREAKER = "github-shared";
/** Fraction of the hourly quota that is never spent. */
const QUOTA_RESERVE = 0.2;

interface CallContext {
  token?: string;
  /** true when spending the shared quota (server token or anonymous), false for a visitor's own token */
  shared: boolean;
}

/** Thrown internally so a limited Search call doesn't trip the core breaker. */
class SearchLimited extends Error {}

function rateLimitedUntil(res: Response): Date | null {
  const retryAfter = Number(res.headers.get("retry-after"));
  if (retryAfter > 0) return new Date(Date.now() + retryAfter * 1000);
  if (res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    if (reset > 0) return new Date(reset * 1000);
  }
  return null;
}

async function request(path: string, ctx: CallContext, raw = false): Promise<Response> {
  if (!GITHUB_API_ENABLED) throw new GitHubError(GITHUB_PAUSED_MESSAGE, 503);
  const res = await fetch(`${API}${path}`, {
    headers: headers(ctx.token, raw),
    // GitHub data for a profile changes slowly; identical requests within 5 minutes reuse the response
    next: { revalidate: 300 },
  });
  const isSearch = res.headers.get("x-ratelimit-resource") === "search";

  if (res.status === 403 || res.status === 429) {
    const until = rateLimitedUntil(res);
    const secondary = !until && /rate limit/i.test(await res.clone().text().catch(() => ""));
    if (until || secondary || res.status === 429) {
      if (isSearch) throw new SearchLimited();
      // No header to go on (secondary limit): stand down for a conservative 10 minutes.
      const resumeAt = until ?? new Date(Date.now() + 10 * 60_000);
      if (ctx.shared) await setGuardUntil(SHARED_BREAKER, resumeAt, `HTTP ${res.status} on ${path.split("?")[0]}`);
      throw new GitHubError(
        ctx.shared
          ? "RepoLens has paused GitHub requests to stay inside GitHub's rate limits. Please try again later."
          : "Your GitHub token has hit its rate limit. Try again after it resets.",
        429,
      );
    }
  }

  // Stop well before the quota runs out, rather than at zero.
  if (ctx.shared && res.ok && !isSearch) {
    const remaining = Number(res.headers.get("x-ratelimit-remaining"));
    const limit = Number(res.headers.get("x-ratelimit-limit"));
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    if (limit > 0 && remaining < limit * QUOTA_RESERVE && reset > 0) {
      await setGuardUntil(SHARED_BREAKER, new Date(reset * 1000), `quota reserve reached (${remaining}/${limit})`);
    }
  }
  return res;
}

async function gh<T>(path: string, ctx: CallContext, raw = false): Promise<T> {
  const res = await request(path, ctx, raw);
  if (res.status === 404) throw new GitHubError("Not found", 404);
  if (res.status === 401) throw new GitHubError("GitHub rejected the token you provided.", 401);
  if (res.status === 403) throw new GitHubError("GitHub refused the request (403).", 403);
  if (!res.ok) throw new GitHubError(`GitHub error ${res.status}`, res.status);
  return (raw ? res.text() : res.json()) as Promise<T>;
}

/** True while the shared breaker is open — callers should serve cache instead of crawling. */
export async function githubBreakerOpenUntil(): Promise<Date | null> {
  return getGuardUntil(SHARED_BREAKER);
}

/**
 * Fetch everything the analyzer needs, one request at a time.
 * Per-repo failures degrade to partial data; a rate limit aborts the whole crawl.
 * `visitorToken` means the visitor supplied their own token (their own quota).
 */
export async function collect(username: string, visitorToken?: string): Promise<Collected> {
  if (!GITHUB_API_ENABLED) throw new GitHubError(GITHUB_PAUSED_MESSAGE, 503);
  const ctx: CallContext = visitorToken
    ? { token: visitorToken, shared: false }
    : { token: process.env.GITHUB_TOKEN?.trim() || undefined, shared: true };

  if (ctx.shared && (await githubBreakerOpenUntil())) {
    throw new GitHubError("RepoLens has paused GitHub requests to stay inside GitHub's rate limits. Please try again later.", 429);
  }

  const user = await gh<GhUser>(`/users/${encodeURIComponent(username)}`, ctx).catch((e) => {
    if (e instanceof GitHubError && e.status === 404)
      throw new GitHubError(`GitHub user "${username}" was not found.`, 404);
    throw e;
  });

  const repos = await gh<GhRepo[]>(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, ctx);

  const own = repos.filter((r) => !r.fork && !r.archived && r.size > 0);
  // Deep-dive the repos most likely to represent the portfolio: stars, then recency.
  const ranked = [...own].sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      Date.parse(b.pushed_at) - Date.parse(a.pushed_at),
  );
  const targets = ranked.slice(0, DEEP_DIVE_LIMIT);

  // Serial on purpose: GitHub asks integrations to avoid concurrent requests.
  const rethrowLimits = (e: unknown) => {
    if (e instanceof GitHubError && (e.status === 429 || e.status === 503)) throw e;
  };
  const deepDive: CollectedRepo[] = [];
  for (const repo of targets) {
    const base = `/repos/${repo.owner.login}/${encodeURIComponent(repo.name)}`;
    const languages = await gh<Record<string, number>>(`${base}/languages`, ctx).catch((e) => {
      rethrowLimits(e);
      return {} as Record<string, number>;
    });
    const readme = await gh<string>(`${base}/readme`, ctx, true).catch((e) => {
      rethrowLimits(e);
      return null;
    });
    const commits = await gh<GhCommit[]>(
      `${base}/commits?per_page=100&author=${encodeURIComponent(username)}`,
      ctx,
    ).catch((e) => {
      rethrowLimits(e);
      return [] as GhCommit[];
    });
    deepDive.push({
      repo,
      languages,
      readme,
      commitSamples: commits
        .filter((c) => c.commit.author?.date)
        .map((c) => ({ date: c.commit.author!.date, message: c.commit.message ?? "" })),
    });
  }

  // profile README (username/username) — the most-viewed file on any profile
  const hasProfileReadme = await gh<string>(
    `/repos/${encodeURIComponent(username)}/${encodeURIComponent(username)}/readme`,
    ctx,
    true,
  )
    .then((text) => text.trim().length > 100)
    .catch((e) => {
      rethrowLimits(e);
      return false;
    });

  // Collaboration beyond own repos, via Search (its own, lower limit). Totals only;
  // null means "couldn't measure" and never blocks the report.
  const searchCount = async (q: string): Promise<number | null> => {
    try {
      const res = await request(`/search/issues?q=${encodeURIComponent(q)}&per_page=1`, ctx);
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.total_count === "number" ? data.total_count : null;
    } catch (e) {
      if (e instanceof SearchLimited) return null;
      rethrowLimits(e);
      return null;
    }
  };
  const mergedPrsElsewhere = await searchCount(`author:${username} type:pr is:merged -user:${username}`);
  const issuesElsewhere = await searchCount(`author:${username} type:issue -user:${username}`);
  const reviewsElsewhere = await searchCount(`reviewed-by:${username} type:pr -author:${username}`);

  return {
    user,
    allRepos: repos,
    deepDive,
    hasProfileReadme,
    collab: { mergedPrsElsewhere, issuesElsewhere, reviewsElsewhere },
  };
}
