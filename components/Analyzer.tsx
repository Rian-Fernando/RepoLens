"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Analysis, Suggestions } from "@/lib/types";
import { ROLES, type RoleId } from "@/lib/roles";
import { estimatePercentile } from "@/lib/percentile";
import { getTier } from "@/lib/tiers";
import StatTile, { formatCompact } from "@/components/StatTile";
import LanguageDonut from "@/components/LanguageDonut";
import CommitHabits from "@/components/CommitHabits";
import RepoQuality from "@/components/RepoQuality";
import GapsPanel from "@/components/GapsPanel";
import SuggestionsPanel from "@/components/SuggestionsPanel";
import Roadmap from "@/components/Roadmap";
import ScoreRing from "@/components/ScoreRing";
import CopyButton from "@/components/CopyButton";
import RoleRadar from "@/components/RoleRadar";
import Sparkline from "@/components/Sparkline";
import ScoreHistory from "@/components/ScoreHistory";
import WatchButton from "@/components/WatchButton";
import GoalChip from "@/components/GoalChip";
import SignInPrompt from "@/components/SignInPrompt";
import { buildMarkdownReport } from "@/lib/markdown";

type Phase = "idle" | "analyzing" | "done";

interface AuthState {
  live: boolean;
  configured: boolean;
  login: string | null;
}

class AnalyzeError extends Error {
  constructor(
    message: string,
    public needsSignIn = false,
  ) {
    super(message);
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = data as { error?: string; needsSignIn?: boolean };
    throw new AnalyzeError(d.error ?? `Request failed (${res.status})`, Boolean(d.needsSignIn));
  }
  return data as T;
}

/** "3 hours ago", "4 months ago" */
function ago(minutes: number): string {
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const h = Math.round(minutes / 60);
  if (h < 36) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(minutes / 1440);
  if (d < 45) return `${d} days ago`;
  const mo = Math.round(d / 30);
  if (mo < 18) return `${mo} months ago`;
  return `${Math.round(d / 365)} years ago`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl mb-4">{children}</h2>;
}

const EXAMPLES = ["torvalds", "sindresorhus", "karpathy"];

export default function Analyzer({
  initialUsername = "",
  autorun = false,
  hero = true,
}: {
  initialUsername?: string;
  autorun?: boolean;
  hero?: boolean;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [role, setRole] = useState<RoleId>("fullstack");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const [style, setStyle] = useState<"coach" | "roast">("coach");
  const [auth, setAuth] = useState<AuthState | null>(null);
  const autoranRef = useRef(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setAuth)
      .catch(() => setAuth(null));
  }, []);

  const fetchSuggestions = useCallback(async (a: Analysis, r: RoleId, mode: "coach" | "roast" = "coach") => {
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestions(null);
    try {
      setSuggestions(await postJson<Suggestions>("/api/suggest", { analysis: a, role: r, style: mode }));
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : "The review couldn't be written.");
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const run = useCallback(
    async (name: string, r: RoleId, refresh = false) => {
      const login = name.trim().replace(/^@/, "");
      if (!login) return;
      setPhase("analyzing");
      setError(null);
      setNeedsSignIn(null);
      setSuggestions(null);
      setSuggestError(null);
      try {
        const a = await postJson<Analysis>("/api/analyze", { username: login, refresh });
        setAnalysis(a);
        setPhase("done");
        void fetchSuggestions(a, r);
      } catch (err) {
        if (err instanceof AnalyzeError && err.needsSignIn) setNeedsSignIn(login);
        else setError(err instanceof Error ? err.message : "Analysis failed.");
        setPhase(analysis ? "done" : "idle");
      }
    },
    [analysis, fetchSuggestions],
  );

  useEffect(() => {
    if (autorun && initialUsername && !autoranRef.current) {
      autoranRef.current = true;
      void run(initialUsername, role);
    }
  }, [autorun, initialUsername, role, run]);

  const shareUrl = analysis ? `${origin}/u/${analysis.profile.login}` : "";
  const badgeMd = analysis
    ? `[![RepoLens score](${origin}/api/badge/${analysis.profile.login})](${shareUrl})`
    : "";
  const percentile = analysis ? estimatePercentile(analysis.overallScore) : 0;
  const tier = getTier(analysis?.overallScore ?? 0);
  const signedIn = Boolean(auth?.login);

  return (
    <div className="space-y-8">
      {/* input */}
      <section className={`print-hide ${analysis || !hero ? "" : "pt-12 sm:pt-20 max-w-3xl"}`}>
        {!analysis && hero && (
          <div>
            <h1 className="text-5xl sm:text-7xl leading-[1.02]">What does your GitHub say about you?</h1>
            <p className="mt-6 text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
              RepoLens reads a public GitHub profile the way a recruiter would, scores it out of 100, and shows you
              exactly what&apos;s costing you points. Then it drafts the fixes.
            </p>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(username, role);
          }}
          className={`${analysis || !hero ? "" : "mt-9 max-w-2xl"}`}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="GitHub username"
              aria-label="GitHub username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="input-dark flex-1 px-4 py-2.5 text-base"
            />
            <select
              value={role}
              onChange={(e) => {
                const r = e.target.value as RoleId;
                setRole(r);
                if (analysis) void fetchSuggestions(analysis, r, style);
              }}
              aria-label="Target role"
              className="input-dark px-3 py-2.5 text-sm cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={phase === "analyzing" || !username.trim()}
              className="btn-accent px-6 py-2.5 text-sm disabled:opacity-50 cursor-pointer disabled:cursor-default"
            >
              {phase === "analyzing" ? "Analyzing…" : "Analyze"}
            </button>
          </div>

          {!analysis && hero ? (
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Or open one that&apos;s already been analyzed:{" "}
              {EXAMPLES.map((ex, i) => (
                <span key={ex}>
                  <a href={`/u/${ex}`} className="link">
                    {ex}
                  </a>
                  {i < EXAMPLES.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          ) : null}

          {auth?.live && auth.configured && !signedIn && !needsSignIn ? (
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Analyzing a new profile needs a{" "}
              <a href={`/signin?returnTo=${encodeURIComponent(analysis ? `/u/${analysis.profile.login}` : "/")}`} className="link">
                GitHub sign-in
              </a>
              . Profiles that were already analyzed open without one.
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          ) : null}
        </form>

        {needsSignIn ? (
          <div className="mt-6 max-w-3xl">
            <SignInPrompt returnTo={`/u/${needsSignIn}`} />
          </div>
        ) : null}

        {phase === "analyzing" && !analysis && (
          <p className="mt-8 flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="spinner" aria-hidden />
            Reading {username.trim() || "the profile"}&apos;s public repositories. A fresh analysis takes about 20
            seconds.
          </p>
        )}
      </section>

      {analysis && (
        <div className="space-y-5" style={{ opacity: phase === "analyzing" ? 0.5 : 1, transition: "opacity 300ms" }}>
          {/* print-only report header */}
          <div className="print-only">
            <p className="text-sm">
              RepoLens portfolio report for @{analysis.profile.login}. Interactive version: {shareUrl}
            </p>
          </div>

          {/* profile + score */}
          <section className="card p-6 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex items-start gap-5 flex-1 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={analysis.profile.avatarUrl}
                alt={`${analysis.profile.login}'s GitHub avatar`}
                width={64}
                height={64}
                decoding="async"
                className="h-16 w-16 rounded-full border shrink-0"
                style={{ borderColor: "var(--border-bright)" }}
              />
              <div className="min-w-0">
                <h2 className="text-3xl truncate">{analysis.profile.name ?? analysis.profile.login}</h2>
                <a
                  href={analysis.profile.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm hover:underline underline-offset-4"
                  style={{ color: "var(--brand-blue)" }}
                >
                  github.com/{analysis.profile.login}
                </a>
                {analysis.profile.bio ? (
                  <p className="text-sm mt-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {analysis.profile.bio}
                  </p>
                ) : null}
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  On GitHub since {analysis.profile.createdAt.slice(0, 4)} · {formatCompact(analysis.profile.followers)}{" "}
                  followers · top {analysis.totals.analyzed} repos analyzed
                  {analysis.fromCache && analysis.cacheAgeMinutes != null ? ` · analyzed ${ago(analysis.cacheAgeMinutes)}` : ""}
                  {analysis.fromCache && signedIn ? (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => void run(analysis.profile.login, role, true)}
                        className="cursor-pointer underline underline-offset-2 print-hide"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        re-analyze
                      </button>
                    </>
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-2 mt-4 print-hide">
                  <CopyButton text={shareUrl} label="Copy report link" />
                  <CopyButton text={badgeMd} label="Copy README badge" />
                  <a href={`/compare?a=${analysis.profile.login}`} className="btn-ghost px-3 py-1.5 text-xs">
                    Compare
                  </a>
                  <button type="button" onClick={() => window.print()} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
                    Save as PDF
                  </button>
                  <CopyButton text={buildMarkdownReport(analysis, suggestions)} label="Copy as Markdown" />
                  <CopyButton
                    text={`<iframe src="${origin}/api/embed/${analysis.profile.login}" width="360" height="120" style="border:0" title="RepoLens score"></iframe>`}
                    label="Copy embed code"
                  />
                  <WatchButton login={analysis.profile.login} />
                </div>
              </div>
            </div>
            <div className="text-center shrink-0 sm:pl-6">
              <ScoreRing score={analysis.overallScore} />
              <div className="mt-2">
                <span className="chip" style={{ color: tier.css, borderColor: tier.css }}>
                  {tier.name}
                </span>
              </div>
              <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {analysis.bench?.percentile != null
                  ? `Better than ${analysis.bench.percentile}% of ${analysis.bench.sample} profiles`
                  : `${percentile >= 50 ? `Top ~${100 - percentile}%` : `Better than ~${percentile}%`} (estimated)`}
              </div>
              <div>
                <GoalChip login={analysis.profile.login} score={analysis.overallScore} />
              </div>
              <a href="/methodology" className="text-xs mt-1 inline-block hover:underline underline-offset-2 print-hide" style={{ color: "var(--text-muted)" }}>
                How is this scored?
              </a>
              {analysis.bench && analysis.bench.history.length >= 2 ? (
                <div className="mt-2 flex flex-col items-center gap-0.5">
                  <Sparkline points={analysis.bench.history.map((h) => h.score)} />
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    score history
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          {/* key numbers */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Public repos"
              value={formatCompact(analysis.totals.publicRepos)}
              note={`${analysis.totals.forks} forks left out of scoring`}
            />
            <StatTile label="Total stars" value={formatCompact(analysis.totals.stars)} />
            <StatTile
              label="Commits, last 90 days"
              value={formatCompact(analysis.commits.last90Days)}
              note={`of ${formatCompact(analysis.commits.totalSampled)} sampled`}
            />
            <StatTile
              label="READMEs scoring 50+"
              value={`${analysis.repos.filter((r) => (r.readmeScore ?? 0) >= 50).length}/${analysis.repos.length}`}
              note="of the repos analyzed"
            />
          </section>

          {analysis.bench && analysis.bench.history.length >= 3 ? (
            <section className="card p-6">
              <SectionTitle>Score history</SectionTitle>
              <ScoreHistory bench={analysis.bench} />
            </section>
          ) : null}

          <section className="grid lg:grid-cols-2 gap-5 items-start">
            <div className="card p-6">
              <SectionTitle>Languages</SectionTitle>
              <LanguageDonut languages={analysis.languages} />
            </div>
            <div className="card p-6">
              <SectionTitle>Commit habits</SectionTitle>
              <CommitHabits habits={analysis.commits} />
            </div>
          </section>

          <section className="grid lg:grid-cols-5 gap-5">
            <div className="card p-6 lg:col-span-3">
              <SectionTitle>Repository quality</SectionTitle>
              <p className="text-sm -mt-2 mb-4" style={{ color: "var(--text-muted)" }}>
                Open a repo to see where its points went, and to draft whatever it&apos;s missing.
              </p>
              <RepoQuality repos={analysis.repos} login={analysis.profile.login} />
            </div>
            <div className="card p-6 lg:col-span-2">
              <SectionTitle>Fit for the role</SectionTitle>
              <RoleRadar analysis={analysis} role={role} />
              <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--grid-hairline)" }}>
                <GapsPanel gaps={analysis.gaps} />
              </div>
            </div>
          </section>

          <section className="card p-6">
            <SectionTitle>What to fix first</SectionTitle>
            <Roadmap analysis={analysis} />
          </section>

          <section className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <h2 className="text-2xl">The review, for a {ROLES.find((r) => r.id === role)?.label.toLowerCase()} role</h2>
              <div className="flex gap-1.5 print-hide">
                {(["coach", "roast"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (style === mode) return;
                      // Roasting someone else is "insulting of others" under Google's
                      // generative-AI prohibited-use policy, so it's own-profile only.
                      if (
                        mode === "roast" &&
                        !window.confirm(
                          `Roast mode is only for your own profile.\n\nIs @${analysis.profile.login} your GitHub account?`,
                        )
                      ) {
                        return;
                      }
                      setStyle(mode);
                      void fetchSuggestions(analysis, role, mode);
                    }}
                    className="text-xs rounded-full border px-3 py-1 cursor-pointer transition-colors"
                    style={{
                      borderColor: style === mode ? "var(--text-primary)" : "var(--border-bright)",
                      color: style === mode ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    {mode === "coach" ? "Straight" : "Roast"}
                  </button>
                ))}
              </div>
            </div>
            {style === "roast" && suggestions?.engine === "gemini" ? (
              <p className="text-xs -mt-2 mb-4" style={{ color: "var(--text-muted)" }}>
                Same data, less mercy. The resume bullets stay serious.
              </p>
            ) : null}
            {suggestLoading && (
              <p className="flex items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="spinner" aria-hidden />
                Writing the review and picking five projects to build next…
              </p>
            )}
            {suggestError && (
              <div className="text-sm">
                <p style={{ color: "var(--status-critical)" }}>{suggestError}</p>
                <button
                  type="button"
                  onClick={() => fetchSuggestions(analysis, role, style)}
                  className="mt-2 underline underline-offset-2 cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Try again
                </button>
              </div>
            )}
            {suggestions && <SuggestionsPanel suggestions={suggestions} />}
          </section>
        </div>
      )}
    </div>
  );
}
