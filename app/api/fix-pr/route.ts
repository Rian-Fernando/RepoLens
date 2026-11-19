import { NextRequest, NextResponse } from "next/server";
import { FIX_PRS_ENABLED, loginForToken, sessionToken } from "@/lib/oauth";
import { GITHUB_API_ENABLED, GITHUB_PAUSED_MESSAGE } from "@/lib/github";

export const maxDuration = 60;

/**
 * The closing-the-loop endpoint: turn a Fix Kit draft into a real pull
 * request on the signed-in visitor's own repo.
 * Guardrails: OAuth session required; the repo must belong to the signed-in
 * user; only whitelisted file paths; new branch, never the default one.
 */

const ALLOWED_PATHS = new Set(["README.md", "LICENSE", ".github/workflows/ci.yml"]);

interface FixPrRequest {
  repo: string; // repo name only — owner is always the signed-in user
  path: string;
  content: string;
  title: string;
}

async function gh(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "repolens",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} on ${path}: ${JSON.stringify(data).slice(0, 160)}`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  if (!GITHUB_API_ENABLED) {
    return NextResponse.json({ error: GITHUB_PAUSED_MESSAGE }, { status: 503 });
  }
  if (!FIX_PRS_ENABLED) {
    return NextResponse.json(
      { error: "Opening pull requests isn't available yet. Copy the draft and commit it yourself." },
      { status: 503 },
    );
  }
  const token = await sessionToken();
  // The owner check must come from GitHub itself, not from a cookie.
  const login = token ? await loginForToken(token) : null;
  if (!token || !login) {
    return NextResponse.json({ error: "Sign in with GitHub first." }, { status: 401 });
  }

  let body: FixPrRequest;
  try {
    body = (await req.json()) as FixPrRequest;
    if (!body.repo || !body.path || !body.content || !body.title) throw new Error("bad shape");
  } catch {
    return NextResponse.json({ error: "Send { repo, path, content, title }." }, { status: 400 });
  }
  if (!/^[A-Za-z0-9._-]+$/.test(body.repo)) {
    return NextResponse.json({ error: "Invalid repo name." }, { status: 400 });
  }
  if (!ALLOWED_PATHS.has(body.path)) {
    return NextResponse.json({ error: "That file path isn't supported." }, { status: 400 });
  }

  const owner = login; // PRs only ever open on the signed-in user's own repos

  try {
    const repo = await gh(token, `/repos/${owner}/${body.repo}`);
    const base: string = repo.default_branch;

    const ref = await gh(token, `/repos/${owner}/${body.repo}/git/ref/heads/${encodeURIComponent(base)}`);
    const baseSha: string = ref.object.sha;

    const branch = `repolens/${body.path.split("/").pop()?.replace(/\./g, "-").toLowerCase()}-${Date.now().toString(36)}`;
    await gh(token, `/repos/${owner}/${body.repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
    });

    // does the file already exist on the base branch? (needed for update-vs-create)
    let existingSha: string | undefined;
    try {
      const existing = await gh(
        token,
        `/repos/${owner}/${body.repo}/contents/${body.path}?ref=${encodeURIComponent(base)}`,
      );
      if (existing?.sha) existingSha = existing.sha;
    } catch {
      /* new file */
    }

    await gh(token, `/repos/${owner}/${body.repo}/contents/${body.path}`, {
      method: "PUT",
      body: JSON.stringify({
        message: body.title,
        content: Buffer.from(body.content, "utf8").toString("base64"),
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });

    const pr = await gh(token, `/repos/${owner}/${body.repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({
        title: body.title,
        head: branch,
        base,
        body: `Drafted with [RepoLens](https://repolens.rianfernando.com/u/${owner}). Review it and tweak it before merging.\n\n> Generated from the repo's public metadata; anything marked \`TODO\` needs your eyes.`,
      }),
    });

    return NextResponse.json({ url: pr.html_url, number: pr.number });
  } catch (e) {
    console.error("fix-pr failed", e);
    const message = e instanceof Error ? e.message : "PR creation failed.";
    const status = /GitHub 404/.test(message) ? 404 : /GitHub 403/.test(message) ? 403 : 500;
    return NextResponse.json(
      {
        error:
          status === 404
            ? "Repo not found under your account. Pull requests can only be opened on your own repos."
            : "Couldn't open the pull request. Check the repo isn't archived and try again.",
      },
      { status },
    );
  }
}
