"use client";

import { useEffect, useState } from "react";
import type { RepoAnalysis } from "@/lib/types";
import CopyButton from "./CopyButton";

/**
 * The closing-the-loop piece: don't just diagnose a weak repo — generate the
 * fix, ready to commit. AI drafts the README (Gemini free tier, with a
 * template fallback); license + CI workflow are proven static templates.
 * Signed in with GitHub (and analyzing your own profile)? One click opens
 * the fix as a real pull request.
 */

const MIT_LICENSE = (owner: string) => `MIT License

Copyright (c) ${new Date().getFullYear()} ${owner}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

const CI_WORKFLOW = (language: string | null) => {
  if (language === "Python") {
    return `# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r requirements.txt
      - run: pytest
`;
  }
  return `# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present
`;
};

type Tab = "readme" | "license" | "ci";
const TAB_META: Record<Tab, { file: string; prTitle: string }> = {
  readme: { file: "README.md", prTitle: "Add a proper README (via RepoLens)" },
  license: { file: "LICENSE", prTitle: "Add MIT license (via RepoLens)" },
  ci: { file: ".github/workflows/ci.yml", prTitle: "Add CI workflow (via RepoLens)" },
};

export default function FixKit({ repo, login }: { repo: RepoAnalysis; login: string }) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState<{ configured: boolean; login: string | null } | null>(null);
  const [prState, setPrState] = useState<{ busy?: boolean; url?: string; error?: string }>({});

  useEffect(() => {
    if (!tab || auth !== null) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setAuth)
      .catch(() => setAuth({ configured: false, login: null }));
  }, [tab, auth]);

  async function draftReadme() {
    setTab("readme");
    setPrState({});
    if (readme || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/fix-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoName: repo.name,
          description: repo.description,
          language: repo.language,
          topics: repo.topics,
          homepage: repo.homepage,
          findings: repo.readmeFindings,
          login,
        }),
      });
      const data = await res.json();
      setReadme(data.readme ?? "Generation failed — try again.");
      setEngine(data.engine ?? null);
    } catch {
      setReadme("Generation failed — try again.");
    } finally {
      setLoading(false);
    }
  }

  const content =
    tab === "license" ? MIT_LICENSE(login) : tab === "ci" ? CI_WORKFLOW(repo.language) : readme;

  async function openPr() {
    if (!tab || !content || prState.busy) return;
    setPrState({ busy: true });
    try {
      const res = await fetch("/api/fix-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: repo.name,
          path: TAB_META[tab].file,
          content,
          title: TAB_META[tab].prTitle,
        }),
      });
      const data = await res.json();
      if (res.ok) setPrState({ url: data.url });
      else setPrState({ error: data.error ?? "PR creation failed." });
    } catch {
      setPrState({ error: "PR creation failed — network error." });
    }
  }

  const isOwnProfile = auth?.login && auth.login.toLowerCase() === login.toLowerCase();

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Fix kit:
        </span>
        <button type="button" onClick={draftReadme} className="btn-accent px-3 py-1.5 text-xs cursor-pointer">
          ✦ Draft README{repo.readmeScore === null ? "" : " rewrite"}
        </button>
        {!repo.hasLicense ? (
          <button type="button" onClick={() => { setTab("license"); setPrState({}); }} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
            MIT license
          </button>
        ) : null}
        <button type="button" onClick={() => { setTab("ci"); setPrState({}); }} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
          CI workflow
        </button>
        {tab ? (
          <button type="button" onClick={() => setTab(null)} className="text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
            close
          </button>
        ) : null}
      </div>

      {tab ? (
        <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs border-b"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <span className="font-mono-accent">{TAB_META[tab].file}</span>
            <div className="flex items-center gap-2">
              {tab === "readme" && engine ? (
                <span>{engine === "gemini" ? "drafted by Gemini" : "template (add GEMINI_API_KEY for AI drafts)"}</span>
              ) : null}
              {content ? <CopyButton text={content} /> : null}
              {content && auth?.configured ? (
                isOwnProfile ? (
                  prState.url ? (
                    <a href={prState.url} target="_blank" rel="noreferrer" className="btn-accent px-3 py-1.5 text-xs">
                      ✓ View PR →
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={openPr}
                      disabled={prState.busy}
                      className="btn-accent px-3 py-1.5 text-xs cursor-pointer disabled:opacity-60"
                    >
                      {prState.busy ? "Opening PR…" : "⤴ Open as PR"}
                    </button>
                  )
                ) : auth.login ? (
                  <span title={`Signed in as ${auth.login} — PRs only open on your own repos`}>
                    PRs: own profile only
                  </span>
                ) : (
                  <a
                    href={`/api/auth/github?returnTo=${encodeURIComponent(`/u/${login}`)}`}
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    Sign in to open as PR
                  </a>
                )
              ) : null}
            </div>
          </div>
          {prState.error ? (
            <div className="px-3 py-2 text-xs border-b" style={{ borderColor: "var(--border)", color: "var(--status-critical)" }}>
              {prState.error}
            </div>
          ) : null}
          <pre
            className="p-3 text-xs overflow-x-auto max-h-72 whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)", background: "rgba(13,13,13,0.5)" }}
          >
            {loading ? "Drafting…" : content}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
