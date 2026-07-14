import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `How scoring works — ${SITE_NAME}`,
  description:
    "The exact weights behind every RepoLens score: repo quality, activity, coverage, collaboration, and commit craft — and how tiers, percentiles, and the leaderboard are computed.",
  alternates: { canonical: "/methodology" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How RepoLens scoring works",
  description: "The exact weights behind every RepoLens portfolio score.",
  url: `${SITE_URL}/methodology`,
  author: { "@type": "Person", name: "Rian Fernando", url: "https://rianfernando.com" },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold mt-10 mb-3">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="leading-relaxed mb-4 text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  );
}
function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="card overflow-x-auto my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--grid-hairline)" }}>
            {head.map((h) => (
              <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-2 ${j > 0 ? "tnum font-mono-accent text-xs" : ""}`} style={{ color: j === 0 ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <p className="font-mono-accent text-xs uppercase tracking-[0.18em] mb-3 reveal" style={{ color: "var(--brand-blue)" }}>
        full transparency ✦ every weight published
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-glow reveal">How scoring works</h1>

      <div className="reveal" style={{ animationDelay: "120ms" }}>
        <P>
          Every RepoLens score is computed the same way, from public GitHub data only, with no manual
          adjustments. The criteria mirror what recruiters and hiring managers consistently say they look
          for — documented projects, live demos, real collaboration, consistent activity — and every weight
          is published below so you can verify any score yourself.
        </P>

        <H2>The overall score (0–100)</H2>
        <Table
          head={["Component", "Weight", "What it measures"]}
          rows={[
            ["Repo quality", "45", "Average quality of your top repos (by stars, then recency) — breakdown below"],
            ["Recent activity", "15", "Commits in the last 90 days across those repos (full marks at ~60)"],
            ["Language breadth", "10", "Distinct languages in real use (full marks at 4+)"],
            ["Portfolio coverage", "15", "How many of the 10 coverage areas you hit — tests, CI, demos, docs, backend, containers, data/AI, profile README, collaboration, licensing"],
            ["Collaboration", "10", "Merged pull requests in other people's repos (weighted highest) and code reviews given"],
            ["Commit craft", "5", "Commit-message quality: descriptive messages score, “fix”/“wip” spam costs"],
          ]}
        />
        <P>
          RepoLens deep-dives your top 12 non-fork repositories. It reads real language bytes, the full
          README of each repo, up to 100 of your commits per repo, and your activity outside your own
          repos via GitHub search.
        </P>

        <H2>Per-repo quality (0–100 each)</H2>
        <Table
          head={["Signal", "Points"]}
          rows={[
            ["README quality (structure, code examples, screenshots, install steps, length)", "25"],
            ["Recent push (≤3 months full, ≤12 months partial)", "15"],
            ["Description (≥20 characters)", "10"],
            ["Topics (2+)", "10"],
            ["License", "10"],
            ["Live demo / homepage link", "10"],
            ["Community (stars: 1+/5+/20+)", "10"],
            ["README present at all", "10"],
          ]}
        />

        <H2>Tiers — and why “EXCELLENT” is rare</H2>
        <P>
          Scores map to three tiers: <strong style={{ color: "var(--tier-high)" }}>EXCELLENT (80–100)</strong>,{" "}
          <strong style={{ color: "var(--tier-mid)" }}>DEVELOPING (50–79)</strong>, and{" "}
          <strong style={{ color: "var(--tier-low)" }}>NEEDS WORK (0–49)</strong>. The scale is deliberately
          hard: the median profile we&apos;ve analyzed scores around 50, and only roughly one in ten clears 80.
          Reaching EXCELLENT requires strong READMEs <em>and</em> live demos <em>and</em> recent activity{" "}
          <em>and</em> real collaboration — the same bar a picky hiring manager applies. If the leaderboard
          shows only a handful of EXCELLENT profiles, that&apos;s the scale working, not a bug.
        </P>

        <H2>Percentiles &amp; the leaderboard</H2>
        <P>
          Your percentile is computed against every profile ever analyzed here (each person counted once, by
          their latest score) — “better than 84% of 221 analyzed” means exactly that. The leaderboard ranks
          the latest score per profile; anyone can join it just by being analyzed. Scores refresh when a
          profile is re-analyzed (analyses are cached for six hours), so the board tracks reality, not a
          snapshot.
        </P>

        <H2>What we don&apos;t measure (yet)</H2>
        <P>
          Honesty matters more than flattery: RepoLens can&apos;t see private repositories, doesn&apos;t read
          your actual code quality (it measures the signals <em>around</em> the code), doesn&apos;t know which
          repos you&apos;ve pinned, and samples rather than exhaustively crawls very large accounts. A high
          score means your public portfolio <em>communicates</em> well — pair it with genuinely good work.
        </P>

        <H2>Data &amp; privacy</H2>
        <P>
          Everything analyzed is public GitHub data, fetched via GitHub&apos;s official API. We store the
          minimum needed for percentiles and history: username, score, primary language, and timestamp, plus
          a short-lived cached copy of the analysis (hours to days) so repeat lookups are instant. No emails,
          no tracking of who viewed what. Tokens you paste are used for one request and never stored;
          sign-in tokens for Fix PRs live only in your own browser cookie.
        </P>

        <div className="card p-5 mt-8 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-semibold">See where you land</span>
          <div className="flex gap-2">
            <a href="/guide" className="btn-ghost px-4 py-2.5 text-sm">
              Read the guide
            </a>
            <a href="/" className="btn-accent px-4 py-2.5 text-sm">
              Analyze your profile →
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
