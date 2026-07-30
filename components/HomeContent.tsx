import { FAQS } from "@/lib/faq";
import { PORTFOLIO_URL } from "@/lib/site";

/**
 * The server-rendered story of the page: why RepoLens exists, how it works,
 * what it measures, who it's for, and the FAQ. Plain, factual prose — this is
 * the text search crawlers index and answer engines quote, so it renders
 * without JavaScript and states things in complete sentences.
 */

const STEPS = [
  {
    n: "01",
    title: "Enter a username",
    body: "Any public GitHub profile — yours or someone else's. No sign-up, no token, no permissions. RepoLens deep-dives the twelve most representative repositories.",
  },
  {
    n: "02",
    title: "Get an honest number",
    body: "A 0–100 score in about twenty seconds, broken down across six weighted components, with per-repository quality, README grades, a commit heatmap and a role-fit radar.",
  },
  {
    n: "03",
    title: "See exactly what's missing",
    body: "Every gap becomes a roadmap item labeled with the points it would earn — \"fix the READMEs on 6 repos: +13.5\" — so you always know which hour of work pays the most.",
  },
  {
    n: "04",
    title: "Take the fixes with you",
    body: "The Fix Kit drafts the missing README, license and CI workflow. Sign in with GitHub and it opens them as real pull requests on your own repositories.",
  },
];

const WEIGHTS = [
  { label: "Repository quality", points: 45, note: "READMEs, descriptions, topics, licenses, live demos, recency, stars" },
  { label: "Recent activity", points: 15, note: "Commits in the last 90 days" },
  { label: "Portfolio coverage", points: 15, note: "Tests, CI, demos, docs, backend, containers, data/AI, licensing" },
  { label: "Language breadth", points: 10, note: "Distinct languages in real use" },
  { label: "Collaboration", points: 10, note: "Merged pull requests and reviews in other people's projects" },
  { label: "Commit craft", points: 5, note: "Descriptive commit messages instead of \"fix\" and \"wip\"" },
];

const AUDIENCES = [
  {
    title: "Students & new grads",
    body: "You have repositories from coursework and side projects, but no idea whether they read as impressive or abandoned. RepoLens tells you, and shows the shortest path to better.",
  },
  {
    title: "Developers job-hunting",
    body: "Paste a job description into the job matcher and see which of its requirements your repositories actually evidence — and which ones you'd be bluffing.",
  },
  {
    title: "Bootcamps & clubs",
    body: "Score an entire GitHub organization or a pasted list of usernames in one run, ranked, with CSV export — useful for cohort reviews and hackathon judging.",
  },
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export default function HomeContent() {
  return (
    <div className="print-hide">
      {/* ---------- why it exists ---------- */}
      <section aria-labelledby="why-heading" className="mx-auto max-w-2xl mt-24">
        <p className="font-mono-accent text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          why this exists
        </p>
        <H2 id="why-heading">Your GitHub is read before your resume is</H2>
        <p className="mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A recruiter or engineer deciding whether to interview you will open your GitHub profile, spend
          about thirty seconds there, and form an opinion. They will not tell you what that opinion was.
          They will not tell you that your best project looked abandoned because its README was three
          lines long, or that they never found the deployed demo because the link was only in your head.
        </p>
        <figure className="my-6 pl-5 border-l-2" style={{ borderColor: "var(--brand-blue)" }}>
          <blockquote className="text-lg leading-relaxed" style={{ color: "var(--text-primary)" }}>
            &ldquo;For a student, your GitHub profile is your resume before anyone opens your resume. I
            wanted a tool that would look at my profile the way a reviewer would, put an honest number on
            it, and then, instead of stopping at the diagnosis, hand me the exact fixes.&rdquo;
          </blockquote>
          <figcaption className="font-mono-accent text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            — Rian Fernando, who built RepoLens ·{" "}
            <a href={`${PORTFOLIO_URL}/projects/repolens`} className="hover:underline" style={{ color: "var(--brand-blue)" }}>
              the full story
            </a>
          </figcaption>
        </figure>
        <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          That last part is the whole point. Plenty of tools will show you statistics about your GitHub.
          RepoLens is built to close the loop: it scores the profile, explains every point it deducted,
          ranks the fixes by how much each one is worth, and then writes the boring ones for you.
        </p>
      </section>

      {/* ---------- how it works ---------- */}
      <section aria-labelledby="how-heading" className="mx-auto max-w-4xl mt-20">
        <p className="font-mono-accent text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          how it works
        </p>
        <H2 id="how-heading">Diagnosis, then the fix</H2>
        <ol className="grid sm:grid-cols-2 gap-4 mt-6">
          {STEPS.map((step) => (
            <li key={step.n} className="card card-hover p-5">
              <span className="font-mono-accent text-[11px]" style={{ color: "var(--brand-blue)" }}>
                {step.n}
              </span>
              <h3 className="font-display font-semibold mt-1.5 mb-1.5">{step.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- what it measures ---------- */}
      <section aria-labelledby="measure-heading" className="mx-auto max-w-2xl mt-20">
        <p className="font-mono-accent text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          what it measures
        </p>
        <H2 id="measure-heading">Six components, all published</H2>
        <p className="mt-4 mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          No black box. The 0–100 score is the sum of six weighted parts, and every weight below is the
          one the code actually uses. Scores of 80+ are rated EXCELLENT, 50–79 DEVELOPING, below 50 NEEDS
          WORK — a deliberately demanding scale where the median analyzed profile lands around 50.
        </p>
        <dl className="card p-5 space-y-4">
          {WEIGHTS.map((w) => (
            <div key={w.label}>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="font-medium text-sm">{w.label}</dt>
                <dd className="font-mono-accent text-sm font-bold tnum" style={{ color: "var(--brand-blue)" }}>
                  {w.points}
                </dd>
              </div>
              <div
                className="h-1.5 rounded-full mt-1.5 overflow-hidden"
                style={{ background: "var(--meter-track)" }}
                role="presentation"
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(w.points / 45) * 100}%`, background: "var(--brand-gradient)" }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {w.note}
              </p>
            </div>
          ))}
        </dl>
        <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          Per-repository scoring, tier thresholds, percentile maths and the limits of what RepoLens can
          see are all written out on{" "}
          <a href="/methodology" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
            the methodology page
          </a>
          .
        </p>
      </section>

      {/* ---------- who it's for ---------- */}
      <section aria-labelledby="who-heading" className="mx-auto max-w-4xl mt-20">
        <p className="font-mono-accent text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          who it&apos;s for
        </p>
        <H2 id="who-heading">Built for people who are being judged by their repos</H2>
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="card card-hover p-5">
              <h3 className="font-display font-semibold mb-1.5">{a.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {a.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- free forever ---------- */}
      <section aria-labelledby="free-heading" className="mx-auto max-w-2xl mt-20">
        <p className="font-mono-accent text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          the cost
        </p>
        <H2 id="free-heading">Free, and built to stay that way</H2>
        <p className="mt-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          RepoLens has a zero-dollar path at every layer: hosting, the GitHub API, the AI, and the
          database all run on free tiers. When the AI quota runs out, a built-in rules engine produces the
          same report instead of an error, so the app never breaks and never bills anyone. There is no
          paid plan to upgrade to and nothing to cancel.
        </p>
        <p className="mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          It is built with Next.js, TypeScript, Recharts and three.js, reads public data through the
          official GitHub API, uses the Google Gemini free tier for the written analysis, and stores
          benchmark scores in Neon Postgres. The source is{" "}
          <a
            href="https://github.com/Rian-Fernando/RepoLens"
            className="hover:underline"
            style={{ color: "var(--brand-blue)" }}
          >
            public on GitHub
          </a>
          .
        </p>
      </section>

      {/* ---------- FAQ ---------- */}
      <section aria-labelledby="faq-heading" className="mx-auto max-w-2xl mt-20">
        <p className="font-mono-accent text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          questions
        </p>
        <H2 id="faq-heading">Common questions</H2>
        <dl className="space-y-4 mt-6">
          {FAQS.map((faq) => (
            <div key={faq.q} className="card p-5">
              <dt className="font-display font-semibold mb-1.5">{faq.q}</dt>
              <dd className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- closing CTA ---------- */}
      <section aria-labelledby="cta-heading" className="mx-auto max-w-2xl mt-16 mb-8">
        <div className="card p-6 text-center">
          <h2 id="cta-heading" className="font-display text-xl font-semibold">
            Find out what yours says
          </h2>
          <p className="text-sm mt-2 mb-5" style={{ color: "var(--text-secondary)" }}>
            One username, about twenty seconds, no account. You can always ignore the advice.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <a href="#top" className="btn-accent px-5 py-2.5 text-sm">
              Score my profile →
            </a>
            <a href="/guide" className="btn-ghost px-5 py-2.5 text-sm">
              Read the guide
            </a>
            <a href="/leaderboard" className="btn-ghost px-5 py-2.5 text-sm">
              See the leaderboard
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
