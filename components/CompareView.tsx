"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types";
import ScoreRing from "./ScoreRing";
import { formatCompact } from "./StatTile";

async function analyzeUser(username: string): Promise<Analysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Analysis failed");
  return data as Analysis;
}

interface Row {
  label: string;
  value: (a: Analysis) => number;
  format: (n: number) => string;
}

const ROWS: Row[] = [
  { label: "Portfolio score", value: (a) => a.overallScore, format: (n) => `${n}/100` },
  { label: "Total stars", value: (a) => a.totals.stars, format: formatCompact },
  { label: "Public repos", value: (a) => a.totals.publicRepos, format: formatCompact },
  { label: "Commits, last 90 days", value: (a) => a.commits.last90Days, format: formatCompact },
  {
    label: "Avg repo quality",
    value: (a) => (a.repos.length ? Math.round(a.repos.reduce((s, r) => s + r.qualityScore, 0) / a.repos.length) : 0),
    format: (n) => `${n}/100`,
  },
  {
    label: "READMEs at 50+",
    value: (a) => a.repos.filter((r) => (r.readmeScore ?? 0) >= 50).length,
    format: (n) => `${n}`,
  },
  { label: "Coverage areas hit", value: (a) => a.gaps.filter((g) => g.severity === "good").length, format: (n) => `${n}` },
];

function Corner({ a }: { a: Analysis }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={a.profile.avatarUrl}
        alt={`${a.profile.login} avatar`}
        className="h-14 w-14 rounded-full border"
        style={{ borderColor: "var(--border-bright)" }}
      />
      <a href={`/u/${a.profile.login}`} className="font-semibold hover:underline">
        @{a.profile.login}
      </a>
      <ScoreRing score={a.overallScore} size={104} />
    </div>
  );
}

export default function CompareView({ initialA = "", initialB = "" }: { initialA?: string; initialB?: string }) {
  const [nameA, setNameA] = useState(initialA);
  const [nameB, setNameB] = useState(initialB);
  const [a, setA] = useState<Analysis | null>(null);
  const [b, setB] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fight(e: React.FormEvent) {
    e.preventDefault();
    if (!nameA.trim() || !nameB.trim() || loading) return;
    setLoading(true);
    setError(null);
    setA(null);
    setB(null);
    try {
      const [ra, rb] = await Promise.all([analyzeUser(nameA.trim()), analyzeUser(nameB.trim())]);
      setA(ra);
      setB(rb);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  const wins = a && b ? ROWS.filter((r) => r.value(a) > r.value(b)).length : 0;
  const losses = a && b ? ROWS.filter((r) => r.value(b) > r.value(a)).length : 0;

  return (
    <div className="space-y-8">
      <form onSubmit={fight} className="flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto reveal">
        <input
          value={nameA}
          onChange={(e) => setNameA(e.target.value)}
          placeholder="first username"
          aria-label="First GitHub username"
          className="input-dark flex-1 w-full px-4 py-2.5"
          autoCapitalize="none"
          spellCheck={false}
        />
        <span className="font-semibold text-sm" style={{ color: "var(--text-muted)" }}>
          vs
        </span>
        <input
          value={nameB}
          onChange={(e) => setNameB(e.target.value)}
          placeholder="second username"
          aria-label="Second GitHub username"
          className="input-dark flex-1 w-full px-4 py-2.5"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !nameA.trim() || !nameB.trim()}
          className="btn-accent px-5 py-2.5 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Analyzing…" : "Compare"}
        </button>
      </form>
      {error ? (
        <p className="text-sm text-center font-medium" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-center animate-pulse" style={{ color: "var(--text-muted)" }}>
          Running both analyses against GitHub…
        </p>
      ) : null}

      {a && b && (
        <div className="card p-6 reveal">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 mb-6">
            <Corner a={a} />
            <div className="self-center text-center px-2">
              <div className="text-2xl font-semibold tnum">
                {wins} — {losses}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                categories won
              </div>
            </div>
            <Corner a={b} />
          </div>

          <ul className="divide-y" style={{ borderColor: "var(--grid-hairline)" }}>
            {ROWS.map((row) => {
              const va = row.value(a);
              const vb = row.value(b);
              return (
                <li key={row.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2.5 text-sm">
                  <span
                    className="text-right tnum font-semibold"
                    style={{ color: va >= vb ? (va > vb ? "var(--series-1)" : "var(--text-primary)") : "var(--text-muted)" }}
                  >
                    {va > vb ? "● " : ""}
                    {row.format(va)}
                  </span>
                  <span className="text-center text-xs w-40" style={{ color: "var(--text-secondary)" }}>
                    {row.label}
                  </span>
                  <span
                    className="tnum font-semibold"
                    style={{ color: vb >= va ? (vb > va ? "var(--series-1)" : "var(--text-primary)") : "var(--text-muted)" }}
                  >
                    {row.format(vb)}
                    {vb > va ? " ●" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs mt-4 text-center" style={{ color: "var(--text-muted)" }}>
            Open the full report: <a className="hover:underline" style={{ color: "var(--series-1)" }} href={`/u/${a.profile.login}`}>@{a.profile.login}</a>
            {" · "}
            <a className="hover:underline" style={{ color: "var(--series-1)" }} href={`/u/${b.profile.login}`}>@{b.profile.login}</a>
          </p>
        </div>
      )}
    </div>
  );
}
