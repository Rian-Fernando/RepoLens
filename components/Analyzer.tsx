"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ring2 } from "ldrs/react";
import "ldrs/react/Ring2.css";
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
import HeroTitle from "@/components/HeroTitle";
import Marquee from "@/components/Marquee";
import AnalyzingLog from "@/components/AnalyzingLog";
import RoleRadar from "@/components/RoleRadar";
import Sparkline from "@/components/Sparkline";
import ScoreHistory from "@/components/ScoreHistory";
import { buildMarkdownReport } from "@/lib/markdown";

type Phase = "idle" | "analyzing" | "done";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

function SectionLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2.5 mb-4">
      <span className="font-mono-accent text-[11px]" style={{ color: "var(--series-1)" }}>
        {n}
      </span>
      <h3 className="font-display font-semibold">{title}</h3>
    </div>
  );
}

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
  const [token, setToken] = useState("");
  const [role, setRole] = useState<RoleId>("fullstack");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  const autoranRef = useRef(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const fetchSuggestions = useCallback(async (a: Analysis, r: RoleId) => {
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestions(null);
    try {
      setSuggestions(await postJson<Suggestions>("/api/suggest", { analysis: a, role: r }));
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : "Suggestions failed.");
    } finally {
      setSuggestLoading(false);
    }
  }, []);

  const run = useCallback(
    async (name: string, tok: string, r: RoleId) => {
      if (!name.trim()) return;
      setPhase("analyzing");
      setError(null);
      setSuggestions(null);
      setSuggestError(null);
      try {
        const a = await postJson<Analysis>("/api/analyze", {
          username: name.trim(),
          token: tok.trim() || undefined,
        });
        setAnalysis(a);
        setPhase("done");
        void fetchSuggestions(a, r);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed.");
        setPhase(analysis ? "done" : "idle");
      }
    },
    [analysis, fetchSuggestions],
  );

  useEffect(() => {
    if (autorun && initialUsername && !autoranRef.current) {
      autoranRef.current = true;
      void run(initialUsername, "", role);
    }
  }, [autorun, initialUsername, role, run]);

  const shareUrl = analysis ? `${origin}/u/${analysis.profile.login}` : "";
  const badgeMd = analysis
    ? `[![RepoLens score](${origin}/api/badge/${analysis.profile.login})](${shareUrl})`
    : "";
  const percentile = analysis ? estimatePercentile(analysis.overallScore) : 0;
  const tier = getTier(analysis?.overallScore ?? 0);

  return (
    <div className="space-y-8">
      {/* input */}
      <section className={`print-hide ${analysis ? "" : hero ? "pt-14 sm:pt-20 max-w-2xl mx-auto text-center" : ""}`}>
        {!analysis && hero && (
          <div>
            <p
              className="reveal inline-block font-mono-accent text-[11px] uppercase tracking-[0.18em] rounded-full border px-3 py-1 mb-6"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              free forever ✦ github api + gemini free tier
            </p>
            <HeroTitle lines={[["What", "does", "your"], ["GitHub", "say", "about", "you?"]]} />
            <p
              className="reveal mt-5 text-base leading-relaxed max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)", animationDelay: "500ms" }}
            >
              RepoLens scores any public profile, finds what&apos;s missing for your target role, then hands
              you the fixes — and the 5 projects to build next.
            </p>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(username, token, role);
          }}
          className={`mt-7 ${analysis || !hero ? "" : "max-w-xl mx-auto"} reveal`}
          style={{ animationDelay: hero && !analysis ? "700ms" : "0ms" }}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="github username, e.g. torvalds"
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
                if (analysis) void fetchSuggestions(analysis, r);
              }}
              aria-label="Target role"
              className="input-dark px-3 py-2.5 text-sm cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  Target: {r.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={phase === "analyzing" || !username.trim()}
              className="btn-accent px-5 py-2.5 disabled:opacity-50 cursor-pointer disabled:cursor-default font-display"
            >
              {phase === "analyzing" ? "Analyzing…" : "Analyze →"}
            </button>
          </div>
          <details className="mt-2 text-left">
            <summary className="text-sm cursor-pointer" style={{ color: "var(--text-muted)" }}>
              Optional: GitHub token (raises the rate limit from 60 to 5,000 requests/hour)
            </summary>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              placeholder="ghp_… (used for this request only, never stored)"
              aria-label="GitHub personal access token"
              className="input-dark mt-2 w-full px-4 py-2 text-sm"
            />
          </details>
          {error ? (
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--status-critical)" }}>
              {error}
            </p>
          ) : null}
        </form>
        {phase === "analyzing" && !analysis && (
          <div className="mt-10">
            <AnalyzingLog username={username.trim()} />
          </div>
        )}
      </section>

      {!analysis && hero && phase !== "analyzing" ? (
        <div className="reveal -mx-4" style={{ animationDelay: "900ms" }}>
          <Marquee />
        </div>
      ) : null}

      {analysis && (
        <div className="space-y-6" style={{ opacity: phase === "analyzing" ? 0.5 : 1, transition: "opacity 300ms" }}>
          {/* print-only report header */}
          <div className="print-only">
            <p className="text-sm">
              RepoLens portfolio report — @{analysis.profile.login} — full interactive version: {shareUrl}
            </p>
          </div>

          {/* profile + hero score */}
          <section className="card p-6 flex flex-col sm:flex-row sm:items-center gap-6 reveal">
            <div className="flex items-center gap-5 flex-1 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={analysis.profile.avatarUrl}
                alt={`${analysis.profile.login} avatar`}
                className="h-16 w-16 rounded-full border"
                style={{ borderColor: "var(--border-bright)" }}
              />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold truncate">
                  {analysis.profile.name ?? analysis.profile.login}{" "}
                  <a
                    href={analysis.profile.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-normal hover:underline"
                    style={{ color: "var(--series-1)" }}
                  >
                    @{analysis.profile.login}
                  </a>
                </h2>
                {analysis.profile.bio ? (
                  <p className="text-sm mt-0.5 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {analysis.profile.bio}
                  </p>
                ) : null}
                <p className="font-mono-accent text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                  since {analysis.profile.createdAt.slice(0, 4)} ✦ {formatCompact(analysis.profile.followers)} followers ✦
                  top {analysis.totals.analyzed} repos analyzed
                  {analysis.fromCache ? (
                    <span title="Add your own GitHub token above for a fresh crawl">
                      {" "}✦ cached {analysis.cacheAgeMinutes != null && analysis.cacheAgeMinutes < 90
                        ? `${analysis.cacheAgeMinutes}m`
                        : `${Math.round((analysis.cacheAgeMinutes ?? 0) / 60)}h`} ago
                    </span>
                  ) : null}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 print-hide">
                  <CopyButton text={shareUrl} label="⧉ Copy report link" />
                  <CopyButton text={badgeMd} label="Copy README badge" />
                  <a href={`/compare?a=${analysis.profile.login}`} className="btn-ghost px-3 py-1.5 text-xs">
                    ⚔ Compare vs…
                  </a>
                  <button type="button" onClick={() => window.print()} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
                    ⎙ Export PDF
                  </button>
                  <CopyButton text={buildMarkdownReport(analysis, suggestions)} label="Copy as Markdown" />
                </div>
              </div>
            </div>
            <div className="text-center shrink-0">
              <ScoreRing score={analysis.overallScore} />
              <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Portfolio score
              </div>
              <div className="mt-1.5">
                <span
                  className="font-mono-accent text-[10px] font-bold tracking-[0.14em] rounded-full px-2.5 py-1 border"
                  style={{ color: tier.css, borderColor: tier.css }}
                >
                  {tier.label}
                </span>
              </div>
              <div className="font-mono-accent text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
                {analysis.bench?.percentile != null
                  ? `better than ${analysis.bench.percentile}% of ${analysis.bench.sample} analyzed`
                  : `${percentile >= 50 ? `top ~${100 - percentile}%` : `better than ~${percentile}%`} · estimated`}
              </div>
              {analysis.bench && analysis.bench.history.length >= 2 ? (
                <div className="mt-2 flex flex-col items-center gap-0.5">
                  <Sparkline points={analysis.bench.history.map((h) => h.score)} />
                  <span className="font-mono-accent text-[10px]" style={{ color: "var(--text-muted)" }}>
                    score history
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          {/* KPI row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 reveal" style={{ animationDelay: "80ms" }}>
            <StatTile
              label="Public repos"
              value={formatCompact(analysis.totals.publicRepos)}
              note={`${analysis.totals.forks} forks excluded from scoring`}
            />
            <StatTile label="Total stars" value={formatCompact(analysis.totals.stars)} />
            <StatTile
              label="Commits, last 90 days"
              value={formatCompact(analysis.commits.last90Days)}
              note={`of ${formatCompact(analysis.commits.totalSampled)} sampled`}
            />
            <StatTile
              label="READMEs at 50+"
              value={`${analysis.repos.filter((r) => (r.readmeScore ?? 0) >= 50).length}/${analysis.repos.length}`}
              note="of analyzed repos"
            />
          </section>

          {analysis.bench && analysis.bench.history.length >= 3 ? (
            <section className="card card-hover p-5 reveal" style={{ animationDelay: "110ms" }}>
              <SectionLabel n="↗" title="Score history" />
              <ScoreHistory bench={analysis.bench} />
            </section>
          ) : null}

          {/* charts */}
          <section className="grid lg:grid-cols-2 gap-4 items-start reveal" style={{ animationDelay: "140ms" }}>
            <div className="card card-hover p-5">
              <SectionLabel n="01" title="Languages" />
              <LanguageDonut languages={analysis.languages} />
            </div>
            <div className="card card-hover p-5">
              <SectionLabel n="02" title="Commit habits" />
              <CommitHabits habits={analysis.commits} />
            </div>
          </section>

          <section className="grid lg:grid-cols-5 gap-4 reveal" style={{ animationDelay: "200ms" }}>
            <div className="card card-hover p-5 lg:col-span-3">
              <SectionLabel n="03" title="Repository quality" />
              <p className="text-xs -mt-2 mb-3" style={{ color: "var(--text-muted)" }}>
                Click a repo for the breakdown — and a fix kit that drafts the missing pieces.
              </p>
              <RepoQuality repos={analysis.repos} login={analysis.profile.login} />
            </div>
            <div className="card card-hover p-5 lg:col-span-2">
              <SectionLabel n="04" title="Role fit & coverage" />
              <RoleRadar analysis={analysis} role={role} />
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--grid-hairline)" }}>
                <GapsPanel gaps={analysis.gaps} />
              </div>
            </div>
          </section>

          {/* roadmap */}
          <section className="card card-hover p-5 reveal" style={{ animationDelay: "240ms" }}>
            <SectionLabel n="05" title="Improvement roadmap" />
            <Roadmap analysis={analysis} />
          </section>

          {/* AI suggestions */}
          <section className="card p-5 reveal" style={{ animationDelay: "280ms" }}>
            <SectionLabel n="06" title={`The review — tuned for ${ROLES.find((r) => r.id === role)?.label}`} />
            {suggestLoading && (
              <div className="flex items-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
                <Ring2 size="20" stroke="3" speed="0.9" color="#3987e5" />
                Reading the analysis and drafting your 5 projects…
              </div>
            )}
            {suggestError && (
              <div className="text-sm">
                <p style={{ color: "var(--status-critical)" }}>{suggestError}</p>
                <button
                  type="button"
                  onClick={() => fetchSuggestions(analysis, role)}
                  className="mt-2 underline cursor-pointer"
                  style={{ color: "var(--series-1)" }}
                >
                  Retry
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
