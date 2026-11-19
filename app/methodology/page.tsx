import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `How scoring works · ${SITE_NAME}`,
  description:
    "The exact weights behind every RepoLens score: repo quality, activity, coverage, collaboration and commit messages, plus how tiers, percentiles and the leaderboard are worked out.",
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
  return <h2 className="text-3xl mt-12 mb-3">{children}</h2>;
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
      <h1 className="text-5xl sm:text-6xl">How scoring works</h1>

      <div>
        <P>
          Every score is worked out the same way, from public GitHub data only, with no manual adjustments. The
          things it looks for are the ones recruiters and hiring managers keep mentioning: documented projects,
          live demos, real collaboration and steady activity. All the weights are below, so you can check any
          score yourself.
        </P>

        <H2>The overall score, out of 100</H2>
        <Table
          head={["Part", "Points", "What it measures"]}
          rows={[
            ["Repo quality", "45", "The average quality of your top repos (by stars, then recency). The breakdown is below."],
            ["Recent activity", "15", "Commits in the last 90 days across those repos (full marks at about 60)"],
            ["Language breadth", "10", "Languages you actually use (full marks at 4 or more)"],
            ["Coverage", "15", "How many of 10 areas you cover: tests, CI, demos, docs, a backend, containers, data or AI work, a profile README, collaboration and licensing"],
            ["Collaboration", "10", "Merged pull requests in other people's repos (weighted most) and code reviews you've given"],
            ["Commit messages", "5", "Messages that describe the change score well; lots of \u201cfix\u201d and \u201cwip\u201d costs points"],
          ]}
        />
        <P>
          RepoLens looks closely at your top 12 repositories, leaving out forks. It reads the real language
          byte counts, each repo&apos;s full README, up to 100 of your commits per repo, and your activity in
          other people&apos;s repos through GitHub search.
        </P>

        <H2>Quality of each repo, out of 100</H2>
        <Table
          head={["Signal", "Points"]}
          rows={[
            ["README quality (structure, code examples, screenshots, setup steps, length)", "25"],
            ["Recent push (full marks within 3 months, partial within 12)", "15"],
            ["Description (20 characters or more)", "10"],
            ["Topics (2 or more)", "10"],
            ["License", "10"],
            ["Live demo or homepage link", "10"],
            ["Stars (1+, 5+ or 20+)", "10"],
            ["Has a README at all", "10"],
          ]}
        />

        <H2>Tiers, and why Excellent is rare</H2>
        <P>
          Scores fall into three tiers: <strong style={{ color: "var(--tier-high)" }}>Excellent (80 to 100)</strong>,{" "}
          <strong style={{ color: "var(--tier-mid)" }}>Developing (50 to 79)</strong> and{" "}
          <strong style={{ color: "var(--tier-low)" }}>Needs work (0 to 49)</strong>. The scale is hard on purpose.
          The typical profile analyzed here scores around 50, and only about one in ten clears 80, because getting
          there takes strong READMEs, live demos, recent activity and real collaboration all at once. That&apos;s
          roughly the bar a careful hiring manager applies, so a short list of Excellent profiles on the
          leaderboard is the scale doing its job.
        </P>

        <H2>Percentiles and the leaderboard</H2>
        <P>
          Your percentile compares you with every profile ever analyzed here, counting each person once by their
          latest score, so &ldquo;better than 84% of 221 profiles&rdquo; means exactly that. The leaderboard ranks
          the same latest scores. A profile&apos;s score updates whenever it&apos;s analyzed again.
        </P>

        <H2>What RepoLens can&apos;t see</H2>
        <P>
          It can&apos;t see private repositories. It doesn&apos;t judge the quality of the code itself, only the
          signals around it. It doesn&apos;t know which repos you&apos;ve pinned, and on very large accounts it
          samples rather than reading everything. A high score means your public profile explains your work well,
          which is worth a lot, but it&apos;s no substitute for the work being good.
        </P>

        <H2>Data &amp; privacy</H2>
        <P>
          Everything analyzed is public GitHub data, read through GitHub&apos;s official API on behalf of the
          signed-in visitor who asked for it. RepoLens keeps what percentiles and history need (username,
          score, primary language and date) plus the latest copy of each analysis, so a report opens instantly
          the next time. That copy is replaced whenever the profile is analyzed again. Nothing records who
          viewed what, and sign-ins stay in your own browser. The{" "}
          <a href="/privacy" className="link">
            privacy page
          </a>{" "}
          has the details, including how to have a profile removed.
        </P>

        <div className="card p-5 mt-8 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display text-2xl">See where you land</span>
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
