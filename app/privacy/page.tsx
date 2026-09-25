import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Privacy — ${SITE_NAME}`,
  description:
    "What RepoLens reads, what it stores, which services it uses, and how to have a GitHub profile removed from RepoLens.",
  alternates: { canonical: "/privacy" },
};

function H2({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-display text-xl font-semibold mt-9 mb-2 scroll-mt-20">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="leading-relaxed mb-3 text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  );
}

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12">
      <p className="font-mono-accent text-xs uppercase tracking-[0.18em] mb-3 reveal" style={{ color: "var(--brand-blue)" }}>
        plain words ✦ no dark patterns
      </p>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-glow reveal">Privacy</h1>

      <div className="reveal" style={{ animationDelay: "120ms" }}>
        <H2>What RepoLens reads</H2>
        <P>
          Only public GitHub data, through GitHub&apos;s official API, and only when someone asks for an
          analysis. RepoLens never requests access to private repositories. Requests are made one at a time,
          capped per visitor and per hour, and paused automatically whenever GitHub signals a rate limit.
        </P>

        <H2>What RepoLens stores</H2>
        <P>
          For each analyzed GitHub username: the score, the primary language and the date — these power the
          leaderboard, percentiles and score history. It also keeps a cached copy of the latest analysis so
          repeat views don&apos;t query GitHub again; that copy is replaced whenever the profile is
          re-analyzed and kept until then, or until removal is requested.
        </P>
        <P>
          To enforce per-visitor limits, RepoLens stores a salted hash of the visitor&apos;s network address
          that changes every day. Raw IP addresses are never stored, and the hashes are deleted after 24 hours.
          An email address is stored only if someone subscribes to score alerts — a feature that is currently
          switched off.
        </P>

        <H2>AI features and Google Gemini</H2>
        <P>
          The written review, README drafts and job matching may be generated with Google&apos;s Gemini API
          free tier. Google may use content sent to its free tier to improve its products, including human
          review. RepoLens therefore sends only project data — repository names, descriptions, languages,
          topics and scores — plus any job description you paste. It never sends names, bios or usernames.
          Visitors in the European Economic Area, the United Kingdom and Switzerland are always served by the
          built-in rules engine instead, and nothing they do is sent to Gemini.
        </P>

        <H2>Tokens and sign-in</H2>
        <P>
          A GitHub token pasted into the form is used for that one analysis and never stored. Optional GitHub
          sign-in, used only to open pull requests on your own repositories, keeps its token in an httpOnly
          cookie in your browser for eight hours; RepoLens does not store it on its servers.
        </P>

        <H2>Other services</H2>
        <P>
          RepoLens is hosted on Vercel and uses Vercel Web Analytics and Speed Insights for aggregate,
          cookieless traffic and performance numbers. Scores are stored in a Neon Postgres database. The
          Feedback button is powered by Feedex, which receives what you type into it together with your
          browser, viewport and the page you were on.
        </P>

        <H2>Search engines</H2>
        <P>
          Individual report pages (<code className="font-mono-accent">/u/username</code>) are marked
          &ldquo;noindex&rdquo;, so a person&apos;s score can be shared by link but isn&apos;t published into
          search results.
        </P>

        <H2 id="removing-a-profile">Removing a profile</H2>
        <P>
          If your GitHub profile appears on RepoLens and you&apos;d like it removed — from the leaderboard,
          percentiles, score history and the cache — ask through the Feedback button on any page, or open an
          issue on{" "}
          <a
            href="https://github.com/Rian-Fernando/RepoLens/issues"
            className="hover:underline"
            style={{ color: "var(--brand-blue)" }}
          >
            the RepoLens repository
          </a>
          . Include your GitHub username. Everything RepoLens holds about that username is then deleted.
        </P>

        <p className="font-mono-accent text-[11px] mt-10" style={{ color: "var(--text-muted)" }}>
          Last updated 2026-09-25 ·{" "}
          <a href="/methodology" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
            how scoring works
          </a>
        </p>
      </div>
    </article>
  );
}
