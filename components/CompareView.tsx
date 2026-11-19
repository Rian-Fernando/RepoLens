"use client";

import { useState } from "react";
import type { Analysis } from "@/lib/types";
import ScoreRing from "./ScoreRing";
import { formatCompact } from "./StatTile";
import SignInPrompt from "./SignInPrompt";

async function analyzeUser(username: string): Promise<Analysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { error?: string; needsSignIn?: boolean };
    throw Object.assign(new Error(d.error ?? "Analysis failed"), { needsSignIn: Boolean(d.needsSignIn) });
  }
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
        alt={`${a.profile.login}'s GitHub avatar`}
        width={56}
        height={56}
        decoding="async"
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
  const [needsSignIn, setNeedsSignIn] = useState(false);

  async function fight(e: React.FormEvent) {
    e.preventDefault();
    if (!nameA.trim() || !nameB.trim() || loading) return;
    setLoading(true);
    setError(null);
    setNeedsSignIn(false);
    setA(null);
    setB(null);
    try {
      const [ra, rb] = await Promise.all([analyzeUser(nameA.trim()), analyzeUser(nameB.trim())]);
      setA(ra);
      setB(rb);
    } catch (err) {
      if (err && typeof err === "object" && "needsSignIn" in err && err.needsSignIn) setNeedsSignIn(true);
      else setError(err instanceof Error ? err.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  const wins = a && b ? ROWS.filter((r) => r.value(a) > r.value(b)).length : 0;
  const losses = a && b ? ROWS.filter((r) => r.value(b) > r.value(a)).length : 0;

  return (
    <div className="space-y-8">
      <form onSubmit={fight} className="flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
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
      {needsSignIn ? (
        <SignInPrompt
          returnTo={`/compare?a=${encodeURIComponent(nameA.trim())}&b=${encodeURIComponent(nameB.trim())}`}
          message="At least one of these profiles hasn't been analyzed yet. Live analysis needs a GitHub sign-in; it only reads public data and runs on your own GitHub rate limit."
        />
      ) : null}
      {error ? (
        <p className="text-sm" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          <span className="spinner" aria-hidden />
          Analyzing both profiles…
        </p>
      ) : null}

      {a && b && (
        <div className="card p-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 mb-6">
            <Corner a={a} />
            <div className="self-center text-center px-2">
              <div className="text-2xl font-semibold tnum">
                {wins}–{losses}
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
