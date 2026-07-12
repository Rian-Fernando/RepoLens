"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types";
import { getTier } from "@/lib/tiers";

/**
 * Cohort analyzer: a GitHub org's public members, or a pasted list of
 * usernames — ranked table + CSV export. Capped to protect the API budget.
 */

const CAP = 25;

interface RowResult {
  login: string;
  score: number | null;
  language: string | null;
  readmes: string;
  error?: string;
}

export default function OrgView() {
  const [org, setOrg] = useState("");
  const [list, setList] = useState("");
  const [rows, setRows] = useState<RowResult[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resolveUsernames(): Promise<string[]> {
    const pasted = list
      .split(/[\s,]+/)
      .map((u) => u.trim().replace(/^@/, ""))
      .filter((u) => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(u));
    if (pasted.length > 0) return [...new Set(pasted)].slice(0, CAP);

    if (!org.trim()) return [];
    const res = await fetch(`https://api.github.com/orgs/${encodeURIComponent(org.trim())}/members?per_page=${CAP}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? `Organization "${org.trim()}" not found (note: only public members are listed).`
          : "Couldn't list the organization's members — try pasting usernames instead.",
      );
    }
    const members = (await res.json()) as Array<{ login: string }>;
    return members.map((m) => m.login).slice(0, CAP);
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (progress) return;
    setError(null);
    setRows([]);
    try {
      const usernames = await resolveUsernames();
      if (usernames.length === 0) {
        setError("Enter an organization name or paste at least one username.");
        return;
      }
      setProgress({ done: 0, total: usernames.length });
      const results: RowResult[] = [];
      for (const [i, login] of usernames.entries()) {
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: login }),
          });
          const data = await res.json();
          if (res.ok) {
            const a = data as Analysis;
            results.push({
              login: a.profile.login,
              score: a.overallScore,
              language: a.languages[0]?.name ?? null,
              readmes: `${a.repos.filter((r) => (r.readmeScore ?? 0) >= 50).length}/${a.repos.length}`,
            });
          } else {
            results.push({ login, score: null, language: null, readmes: "-", error: String(data.error ?? res.status).slice(0, 60) });
          }
        } catch {
          results.push({ login, score: null, language: null, readmes: "-", error: "network error" });
        }
        setRows([...results].sort((x, y) => (y.score ?? -1) - (x.score ?? -1)));
        setProgress({ done: i + 1, total: usernames.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cohort analysis failed.");
    } finally {
      setProgress(null);
    }
  }

  function downloadCsv() {
    const header = "rank,login,score,tier,primary_language,readmes_50plus,report\n";
    const body = rows
      .filter((r) => r.score !== null)
      .map(
        (r, i) =>
          `${i + 1},${r.login},${r.score},${getTier(r.score!).label},${r.language ?? ""},${r.readmes},https://repolens.rianfernando.com/u/${r.login}`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `repolens-cohort-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={run} className="card p-5 space-y-3 reveal">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              GitHub organization
            </label>
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="e.g. vercel"
              aria-label="GitHub organization"
              autoCapitalize="none"
              spellCheck={false}
              className="input-dark w-full px-4 py-2.5"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              …or paste usernames (overrides org)
            </label>
            <input
              value={list}
              onChange={(e) => setList(e.target.value)}
              placeholder="alice bob carol …"
              aria-label="Usernames list"
              autoCapitalize="none"
              spellCheck={false}
              className="input-dark w-full px-4 py-2.5"
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono-accent text-[11px]" style={{ color: "var(--text-muted)" }}>
            up to {CAP} people per run ✦ cached profiles are instant
          </span>
          <button type="submit" disabled={Boolean(progress)} className="btn-accent px-5 py-2.5 disabled:opacity-50 cursor-pointer font-display">
            {progress ? `Analyzing ${progress.done}/${progress.total}…` : "Rank the cohort →"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-center font-medium" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      ) : null}

      {rows.length > 0 && (
        <div className="card overflow-hidden reveal">
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--grid-hairline)" }}>
            <span className="font-display font-semibold text-sm">
              {rows.filter((r) => r.score !== null).length} scored
            </span>
            <button type="button" onClick={downloadCsv} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
              ⤓ Download CSV
            </button>
          </div>
          <ol className="divide-y">
            {rows.map((r, i) => {
              const tier = r.score !== null ? getTier(r.score) : null;
              return (
                <li key={r.login} className="flex items-center gap-4 px-5 py-2.5 text-sm">
                  <span className="font-mono-accent w-6 text-right" style={{ color: i < 3 && r.score !== null ? "var(--brand-blue)" : "var(--text-muted)" }}>
                    {r.score !== null ? i + 1 : "–"}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://github.com/${r.login}.png?size=48`} alt="" className="h-7 w-7 rounded-full border" style={{ borderColor: "var(--border)" }} />
                  <a href={`/u/${r.login}`} className="font-medium flex-1 truncate hover:underline">
                    @{r.login}
                  </a>
                  {r.error ? (
                    <span className="text-xs" style={{ color: "var(--status-critical)" }}>
                      {r.error}
                    </span>
                  ) : (
                    <>
                      <span className="font-mono-accent text-[11px] hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                        {r.language ?? "—"}
                      </span>
                      <span className="font-mono-accent text-[11px] hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                        readmes {r.readmes}
                      </span>
                      {tier ? (
                        <span className="font-mono-accent text-[10px] font-bold rounded-full px-2 py-0.5 border" style={{ color: tier.css, borderColor: tier.css }}>
                          {tier.label}
                        </span>
                      ) : null}
                      <span className="font-mono-accent font-bold tnum w-10 text-right">{r.score}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
