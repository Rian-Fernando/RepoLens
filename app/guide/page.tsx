import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `How to make your GitHub recruiter-ready — ${SITE_NAME}`,
  description:
    "What recruiters actually look at in a GitHub profile, the seven things that score points, and the fixes that take under an hour.",
  alternates: { canonical: "/guide" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to make your GitHub profile recruiter-ready",
  description:
    "What recruiters actually look at in a GitHub profile, the seven things that score points, and the fixes that take under an hour.",
  url: `${SITE_URL}/guide`,
  author: { "@type": "Person", name: "Rian Fernando", url: "https://rianfernando.com" },
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-2xl font-semibold mt-10 mb-3">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  );
}

export default function GuidePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <p className="font-mono-accent text-xs uppercase tracking-[0.18em] mb-3 reveal" style={{ color: "var(--brand-blue)" }}>
        the guide ✦ ~6 min read
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-glow reveal">
        How to make your GitHub recruiter-ready
      </h1>

      <div className="reveal" style={{ animationDelay: "120ms" }}>
        <P>
          Here&apos;s the uncomfortable truth about GitHub profiles: recruiters spend about thirty seconds on
          yours, and they are not reading your code. They&apos;re pattern-matching for signals — does this
          person finish things, explain things, and ship things? Green squares don&apos;t answer that. The
          seven signals below do, and most of them cost minutes, not weekends.
        </P>

        <H2>1. Your top three repos are your resume</H2>
        <P>
          Nobody scrolls past the pinned row. Pin your three strongest projects, give each a one-sentence
          description in the About field, and add 3–5 topics. A brilliant project with an empty description
          reads exactly like an abandoned one. This is the highest return-per-minute fix on this page.
        </P>

        <H2>2. READMEs are read; code is skimmed</H2>
        <P>
          A recruiter — and honestly, most engineers — will judge a repo entirely by its README. The formula
          that works: a one-line pitch, a screenshot or GIF, a copy-pasteable quick-start, and one code
          example. Under 120 lines. If writing them bores you, the analyzer&apos;s Fix Kit drafts one per repo
          that you can edit and commit — or open directly as a pull request.
        </P>

        <H2>3. A deployed link beats a thousand commits</H2>
        <P>
          &quot;Click here to try it&quot; is the single most persuasive thing a portfolio can say. Free tiers
          (Vercel, Netlify, Fly.io) mean there is no excuse for a web project without a live URL in its About
          field. Recruiters click links before they read anything.
        </P>

        <H2>4. Tests and CI are seniority signals</H2>
        <P>
          Even a small test suite with a passing GitHub Actions badge says &quot;I write software that other
          people can depend on.&quot; One workflow file — lint, test, build — on your top repos separates you
          from the enormous pile of profiles that have never run CI in their life.
        </P>

        <H2>5. Recency matters more than volume</H2>
        <P>
          A profile whose last commit was eight months ago whispers &quot;moved on.&quot; You don&apos;t need
          daily streaks — a few meaningful commits a month keeps every repo&apos;s pulse visible. Doc
          improvements and dependency bumps count.
        </P>

        <H2>6. Cover the bases your target role expects</H2>
        <P>
          A frontend candidate with no deployed UI, or a backend candidate with no API repo, creates doubt
          that a great résumé can&apos;t fix. Check your coverage against your target role — the analyzer&apos;s
          role-fit radar shows exactly where your profile is thinner than the role expects.
        </P>

        <H2>7. Licenses and hygiene: the five-minute polish</H2>
        <P>
          A LICENSE file, a .gitignore that hides the junk, no committed secrets or node_modules — these are
          the table manners of open source. Missing them won&apos;t sink you, but their presence quietly says
          &quot;this person has worked on real teams.&quot;
        </P>

        <H2>Where to start</H2>
        <P>
          Don&apos;t guess — measure. Run your profile through the analyzer: it scores all seven signals,
          ranks the fixes by exact point value, and drafts the boring parts for you. Most profiles gain 15–25
          points in a single focused evening.
        </P>

        <div className="card p-5 mt-8 flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-semibold">See your score in ~20 seconds</span>
          <a href="/" className="btn-accent px-5 py-2.5 text-sm">
            Analyze your profile →
          </a>
        </div>
      </div>
    </article>
  );
}
