"use client";

import { useState } from "react";
import type { RepoAnalysis } from "@/lib/types";
import CopyButton from "./CopyButton";

/**
 * The closing-the-loop piece: don't just diagnose a weak repo — generate the
 * fix, ready to commit. AI drafts the README (Gemini free tier, with a
 * template fallback); license + CI workflow are proven static templates.
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

export default function FixKit({ repo, login }: { repo: RepoAnalysis; login: string }) {
  const [tab, setTab] = useState<"readme" | "license" | "ci" | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function draftReadme() {
    setTab("readme");
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
  const filename = tab === "license" ? "LICENSE" : tab === "ci" ? ".github/workflows/ci.yml" : "README.md";

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
          <button type="button" onClick={() => setTab("license")} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
            MIT license
          </button>
        ) : null}
        <button type="button" onClick={() => setTab("ci")} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
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
            className="flex items-center justify-between px-3 py-2 text-xs border-b"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <span className="font-mono">{filename}</span>
            <div className="flex items-center gap-2">
              {tab === "readme" && engine ? (
                <span>{engine === "gemini" ? "drafted by Gemini" : "template (add GEMINI_API_KEY for AI drafts)"}</span>
              ) : null}
              {content ? <CopyButton text={content} /> : null}
            </div>
          </div>
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
