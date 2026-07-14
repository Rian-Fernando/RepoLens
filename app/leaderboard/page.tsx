import type { Metadata } from "next";
import { getLeaderboard, getLeaderboardLanguages } from "@/lib/db";
import { getTier } from "@/lib/tiers";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Leaderboard — ${SITE_NAME}`,
  description: "Top-scoring GitHub portfolios analyzed by RepoLens.",
  alternates: { canonical: "/leaderboard" },
};

export const revalidate = 300;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const [rows, languages] = await Promise.all([getLeaderboard(100, lang), getLeaderboardLanguages()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center mb-8 reveal">
        <p className="font-mono-accent text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          every analysis counts ✦ public data only
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-glow">Leaderboard</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          The highest-scoring portfolios analyzed so far. Analyze yours to claim a spot.
        </p>
        <p className="font-mono-accent text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>
          median score is ~50 by design ✦{" "}
          <a href="/methodology" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
            how scoring works →
          </a>
        </p>
      </div>

      {languages.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-2 mb-6 reveal">
          <a
            href="/leaderboard"
            className={`font-mono-accent text-xs rounded-full border px-3 py-1.5 transition-colors ${!lang ? "" : "hover:text-white"}`}
            style={{
              borderColor: !lang ? "var(--brand-blue)" : "var(--border)",
              color: !lang ? "var(--brand-blue)" : "var(--text-muted)",
            }}
          >
            all
          </a>
          {languages.map((l) => (
            <a
              key={l}
              href={`/leaderboard?lang=${encodeURIComponent(l)}`}
              className="font-mono-accent text-xs rounded-full border px-3 py-1.5 transition-colors hover:text-white"
              style={{
                borderColor: lang === l ? "var(--brand-blue)" : "var(--border)",
                color: lang === l ? "var(--brand-blue)" : "var(--text-muted)",
              }}
            >
              {l.toLowerCase()}
            </a>
          ))}
        </div>
      ) : null}

      {rows === null ? (
        <div className="card p-6 text-center text-sm reveal" style={{ color: "var(--text-secondary)" }}>
          The score database isn&apos;t connected in this environment yet — set{" "}
          <code className="font-mono-accent">DATABASE_URL</code> (free Neon Postgres) to switch the leaderboard,
          real percentiles, and score history on.
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-center text-sm reveal" style={{ color: "var(--text-secondary)" }}>
          No scores recorded yet — be the first:{" "}
          <a href="/" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
            analyze your profile
          </a>
          .
        </div>
      ) : (
        <div className="space-y-6 reveal">
          {[
            { min: 80, label: "EXCELLENT", css: "var(--tier-high)", blurb: "80+ · strong docs, demos, activity and collaboration — roughly one in ten profiles" },
            { min: 50, label: "DEVELOPING", css: "var(--tier-mid)", blurb: "50–79 · solid foundations, clear next steps — where most active developers land" },
            { min: 0, label: "NEEDS WORK", css: "var(--tier-low)", blurb: "0–49 · big wins available fast (READMEs, demos, licenses)" },
          ].map((band, bandIdx, bands) => {
            const max = bandIdx === 0 ? 101 : bands[bandIdx - 1].min;
            const bandRows = rows.filter((r) => r.score >= band.min && r.score < max);
            if (bandRows.length === 0) return null;
            const offset = rows.findIndex((r) => r.score < max && r.score >= band.min);
            return (
              <section key={band.label}>
                <div className="flex items-baseline justify-between mb-2 px-1">
                  <h2 className="font-mono-accent text-xs font-bold tracking-[0.14em]" style={{ color: band.css }}>
                    {band.label}
                    <span className="ml-2 font-normal" style={{ color: "var(--text-muted)" }}>
                      {bandRows.length} {bandRows.length === 1 ? "profile" : "profiles"}
                    </span>
                  </h2>
                  <span className="font-mono-accent text-[10px] hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                    {band.blurb}
                  </span>
                </div>
                <ol className="card divide-y overflow-hidden">
                  {bandRows.map((row, i) => {
                    const tier = getTier(row.score);
                    const rank = offset + i + 1;
                    return (
                      <li key={row.login}>
                        <a
                          href={`/u/${row.login}`}
                          className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.04]"
                        >
                          <span className="font-mono-accent text-sm w-8 text-right" style={{ color: rank <= 3 ? "var(--brand-blue)" : "var(--text-muted)" }}>
                            {rank}
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://github.com/${row.login}.png?size=64`}
                            alt=""
                            className="h-8 w-8 rounded-full border"
                            style={{ borderColor: "var(--border)" }}
                          />
                          <span className="font-medium flex-1 truncate">@{row.login}</span>
                          <span className="font-mono-accent text-[10px] hidden sm:inline" style={{ color: "var(--text-muted)" }}>
                            {row.analyzedAt}
                          </span>
                          <span className="font-mono-accent font-bold tnum w-14 text-right" style={{ color: tier.css }}>
                            {row.score}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
