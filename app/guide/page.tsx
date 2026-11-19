import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `How to make your GitHub recruiter-ready · ${SITE_NAME}`,
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
  return <h2 className="text-3xl mt-12 mb-3">{children}</h2>;
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
      <h1 className="text-5xl sm:text-6xl">
        How to make your GitHub recruiter-ready
      </h1>

      <div>
        <P>
          When a recruiter or an engineer looks at your GitHub, they usually give it a minute or two. They
          aren&apos;t reading your code in that time. They&apos;re looking for signs that you finish things,
          explain them, and put them where people can use them. These are the seven things RepoLens checks for,
          and most of them take an evening or less to fix.
        </P>

        <H2>1. Your top three repos are your resume</H2>
        <P>
          Most people only look at the pinned row. Pin your three strongest projects, give each one a
          one-sentence description in the About field, and add a few topics. A good project with an empty
          description looks the same as an abandoned one, so this is the quickest fix on the list.
        </P>

        <H2>2. READMEs get read, code gets skimmed</H2>
        <P>
          Most people decide what a repo is from its README. One that works has a one-line description, a
          screenshot or GIF, setup steps you can copy, and a short example, and it fits on a couple of screens.
          If writing them isn&apos;t your favorite thing, RepoLens drafts one for each repo that you can edit and
          commit.
        </P>

        <H2>3. A live link does more than a lot of commits</H2>
        <P>
          A link people can click is the most convincing thing a portfolio can have. Vercel, Netlify and Fly.io
          all have free tiers, so any web project can have a live URL in its About field. People click links
          before they read anything else.
        </P>

        <H2>4. Tests and CI show you work like a team does</H2>
        <P>
          Even a small test suite with a passing GitHub Actions badge tells people your code can be relied on.
          One workflow file that lints, tests and builds your top repos takes a few minutes to add.
        </P>

        <H2>5. Recent work counts more than lots of work</H2>
        <P>
          If your last commit was eight months ago, people assume you&apos;ve moved on. You don&apos;t need a daily
          streak. A few real commits a month keeps a repo looking alive, and documentation fixes and dependency
          updates count.
        </P>

        <H2>6. Cover what your target role expects</H2>
        <P>
          A frontend candidate with no deployed UI, or a backend candidate with no API, raises a question a strong
          resume can&apos;t answer. The role fit chart in your report shows where your profile is thinner than the
          role you pick.
        </P>

        <H2>7. A license and a tidy repo</H2>
        <P>
          A LICENSE file, a .gitignore that keeps clutter out, and no committed secrets or node_modules folders.
          Missing them won&apos;t sink you, but having them shows you know how shared code is looked after.
        </P>

        <H2>Where to start</H2>
        <P>
          Measure first. RepoLens scores all seven, ranks the fixes by how many points each one is worth, and
          drafts the tedious parts, so you can start with whatever pays off most.
        </P>

        <div className="card p-6 mt-10 flex flex-wrap items-center justify-between gap-4">
          <span className="font-display text-2xl">See where your profile stands</span>
          <a href="/" className="btn-accent px-5 py-2.5 text-sm">
            Analyze your profile
          </a>
        </div>
      </div>
    </article>
  );
}
