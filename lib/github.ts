/**
 * GitHub REST client + data collection for one user.
 *
 * Request budget per analysis (matters unauthenticated: 60 req/hour):
 *   1 (user) + 1 (repo list) + 3 per deep-dive repo (languages, readme, commits).
 * With DEEP_DIVE_LIMIT = 12 that is at most 38 requests.
 */

const API = "https://api.github.com";
export const DEEP_DIVE_LIMIT = 12;

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

async function gh<T>(path: string, token?: string, raw = false): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: headers(token, raw),
    // GitHub data for a profile changes slowly; avoid hammering the rate limit
    next: { revalidate: 300 },
  });
  if (res.status === 404) throw new GitHubError("Not found", 404);
  if (res.status === 401) throw new GitHubError("GitHub rejected the token you provided.", 401);
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      throw new GitHubError(
        "GitHub rate limit reached (60 requests/hour unauthenticated). Add a personal access token and try again.",
        429,
      );
    }
    throw new GitHubError("GitHub refused the request (403).", 403);
  }
  if (!res.ok) throw new GitHubError(`GitHub error ${res.status}`, res.status);
  return (raw ? res.text() : res.json()) as Promise<T>;
}

/** Fetch everything the analyzer needs. Per-repo failures degrade to partial data. */
export async function collect(username: string, token?: string): Promise<Collected> {
  const user = await gh<GhUser>(`/users/${encodeURIComponent(username)}`, token).catch((e) => {
    if (e instanceof GitHubError && e.status === 404)
      throw new GitHubError(`GitHub user "${username}" was not found.`, 404);
    throw e;
  });

  const repos = await gh<GhRepo[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`,
    token,
  );

  const own = repos.filter((r) => !r.fork && !r.archived && r.size > 0);
  // Deep-dive the repos most likely to represent the portfolio: stars, then recency.
  const ranked = [...own].sort(
    (a, b) =>
      b.stargazers_count - a.stargazers_count ||
      Date.parse(b.pushed_at) - Date.parse(a.pushed_at),
  );
  const targets = ranked.slice(0, DEEP_DIVE_LIMIT);

  const deepDive = await Promise.all(
    targets.map(async (repo): Promise<CollectedRepo> => {
      const base = `/repos/${repo.owner.login}/${encodeURIComponent(repo.name)}`;
      const [languages, readme, commits] = await Promise.all([
        gh<Record<string, number>>(`${base}/languages`, token).catch(() => ({})),
        gh<string>(`${base}/readme`, token, true).catch((e) => {
          if (e instanceof GitHubError && e.status === 429) throw e;
          return null;
        }),
        gh<GhCommit[]>(
          `${base}/commits?per_page=100&author=${encodeURIComponent(username)}`,
          token,
        ).catch((e) => {
          if (e instanceof GitHubError && e.status === 429) throw e;
          return [] as GhCommit[];
        }),
      ]);
      return {
        repo,
        languages,
        readme,
        commitSamples: commits
          .filter((c) => c.commit.author?.date)
          .map((c) => ({ date: c.commit.author!.date, message: c.commit.message ?? "" })),
      };
    }),
  );

  // profile README (username/username) — the most-viewed file on any profile
  const hasProfileReadme = await gh<string>(
    `/repos/${encodeURIComponent(username)}/${encodeURIComponent(username)}/readme`,
    token,
    true,
  )
    .then((text) => text.trim().length > 100)
    .catch(() => false);

  // collaboration beyond own repos — the strongest hiring signal on GitHub.
  // Search API totals only (per_page=1); each null means "couldn't measure".
  const searchCount = async (q: string): Promise<number | null> => {
    try {
      const res = await fetch(`${API}/search/issues?q=${encodeURIComponent(q)}&per_page=1`, {
        headers: headers(token),
        next: { revalidate: 3600 },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.total_count === "number" ? data.total_count : null;
    } catch {
      return null;
    }
  };
  const [mergedPrsElsewhere, issuesElsewhere, reviewsElsewhere] = await Promise.all([
    searchCount(`author:${username} type:pr is:merged -user:${username}`),
    searchCount(`author:${username} type:issue -user:${username}`),
    searchCount(`reviewed-by:${username} type:pr -author:${username}`),
  ]);

  return {
    user,
    allRepos: repos,
    deepDive,
    hasProfileReadme,
    collab: { mergedPrsElsewhere, issuesElsewhere, reviewsElsewhere },
  };
}
