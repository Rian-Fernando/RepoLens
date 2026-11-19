import type { Metadata } from "next";
import { getLeaderboard, getLeaderboardLanguages } from "@/lib/db";
import { getTier } from "@/lib/tiers";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Top-scoring GitHub portfolios · ${SITE_NAME}`,
  description:
    "Every GitHub profile analyzed by RepoLens, ranked by portfolio score and grouped into tiers. Filter by primary language to see the top Python, JavaScript, TypeScript or Rust portfolios.",
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
      <div className="mb-10">
        <h1 className="text-5xl sm:text-6xl">Leaderboard</h1>
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Every profile RepoLens has analyzed, highest score first. The typical profile scores around 50, so the top
          group is small on purpose.
        </p>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <a href="/methodology" className="link">
            How scoring works
          </a>
          {" · "}
          <a href="/privacy#removing-a-profile" className="link">
            Remove a profile
          </a>
        </p>
      </div>

      {languages.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-8">
          <a
            href="/leaderboard"
            className="chip transition-colors hover:text-white"
            style={!lang ? { color: "var(--text-primary)", borderColor: "var(--text-primary)" } : undefined}
          >
            all
          </a>
          {languages.map((l) => (
            <a
              key={l}
              href={`/leaderboard?lang=${encodeURIComponent(l)}`}
              className="chip transition-colors hover:text-white"
              style={lang === l ? { color: "var(--text-primary)", borderColor: "var(--text-primary)" } : undefined}
            >
              {l.toLowerCase()}
            </a>
          ))}
        </div>
      ) : null}

      {rows === null ? (
        <div className="card p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          The score database isn&apos;t connected in this environment yet. Set{" "}
          <code className="font-mono-accent">DATABASE_URL</code> (free Neon Postgres) to switch the leaderboard,
          real percentiles, and score history on.
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          Nothing here yet. Be the first:{" "}
          <a href="/" className="link">
            analyze your profile
          </a>
          .
        </div>
      ) : (
        <div className="space-y-10">
          {[
            { min: 80, label: "Excellent", css: "var(--tier-high)", blurb: "80 and up: strong docs, demos, recent work and real collaboration. About one profile in ten." },
            { min: 50, label: "Developing", css: "var(--tier-mid)", blurb: "50 to 79: solid foundations with clear next steps. Where most active developers land." },
            { min: 0, label: "Needs work", css: "var(--tier-low)", blurb: "Under 50: usually quick wins, like READMEs, demo links and licenses." },
          ].map((band, bandIdx, bands) => {
            const max = bandIdx === 0 ? 101 : bands[bandIdx - 1].min;
            const bandRows = rows.filter((r) => r.score >= band.min && r.score < max);
            if (bandRows.length === 0) return null;
            const offset = rows.findIndex((r) => r.score < max && r.score >= band.min);
            return (
              <section key={band.label}>
                <div className="mb-3">
                  <h2 className="text-3xl flex items-baseline gap-3">
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: band.css }} aria-hidden />
                    {band.label}
                    <span className="font-mono-accent text-sm" style={{ color: "var(--text-muted)" }}>
                      {bandRows.length}
                    </span>
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    {band.blurb}
                  </p>
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
                            width={32}
                            height={32}
                            loading="lazy"
                            decoding="async"
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
