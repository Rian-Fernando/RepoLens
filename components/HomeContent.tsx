import { FAQS } from "@/lib/faq";
import { PORTFOLIO_URL } from "@/lib/site";
import Link from "next/link";

/**
 * The text half of the home page: where the idea came from, how it works, what
 * the score is made of, who it's for, what it costs, and common questions.
 * Server-rendered, so search engines and answer engines read it without JS.
 */

const STEPS = [
  {
    title: "Enter a username.",
    body: "Any public profile works, yours or someone else's. RepoLens looks closely at the twelve repositories most likely to represent it.",
  },
  {
    title: "Get a score out of 100.",
    body: "It's broken into six parts, with a grade for every repository and README, a commit heatmap, and how well the profile fits the role you pick.",
  },
  {
    title: "See what to fix first.",
    body: "Every gap becomes a checklist item with the points it's worth, like fixing the READMEs on six repos for 13.5 points, so you know which hour of work pays off most.",
  },
  {
    title: "Take the fixes with you.",
    body: "RepoLens drafts the README, license or CI workflow a repository is missing, ready to copy into it.",
  },
];

const WEIGHTS = [
  { label: "Repository quality", points: 45, note: "READMEs, descriptions, topics, licenses, live demos, recent work and stars" },
  { label: "Recent activity", points: 15, note: "Commits in the last 90 days" },
  { label: "Coverage", points: 15, note: "Tests, CI, demos, docs, a backend, containers, data or AI work, licensing" },
  { label: "Language breadth", points: 10, note: "Languages you actually use" },
  { label: "Collaboration", points: 10, note: "Merged pull requests and reviews in other people's projects" },
  { label: "Commit messages", points: 5, note: "Messages that say what changed, not just “fix” or “wip”" },
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-4xl sm:text-5xl">
      {children}
    </h2>
  );
}

export default function HomeContent() {
  return (
    <div className="print-hide max-w-3xl mx-auto pb-8">
      <section aria-labelledby="idea" className="mt-28">
        <H2 id="idea">Where the idea came from</H2>
        <div className="mt-6 space-y-4 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <p>
            For a student, your GitHub profile is your resume before anyone opens your resume. Recruiters click
            through, skim a few repos, and form a verdict in a minute, but nobody tells you how that minute
            actually reads.
          </p>
          <p>
            I wanted a tool that would look at my profile the way a reviewer would, give it a fair score, and then,
            instead of stopping at the diagnosis, hand me the exact fixes that would move that number. RepoLens is a
            lens on your repos, which is where the name and the logo come from.
          </p>
        </div>
        <p className="mt-5 text-sm" style={{ color: "var(--text-muted)" }}>
          Rian Fernando ·{" "}
          <a href={`${PORTFOLIO_URL}/projects/repolens`} className="link">
            more about the project
          </a>
        </p>
      </section>

      <section aria-labelledby="how" className="mt-24">
        <H2 id="how">How it works</H2>
        <ol className="mt-8 space-y-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-5">
              <span className="font-mono-accent text-sm pt-0.5 w-4 shrink-0" style={{ color: "var(--text-muted)" }}>
                {i + 1}
              </span>
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--text-primary)" }}>{step.title}</span> {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="score" className="mt-24">
        <H2 id="score">What the score is made of</H2>
        <p className="mt-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The score is the sum of six parts, and these are the exact weights the code uses. 80 and above is rated
          Excellent, 50 to 79 Developing, and below 50 Needs work. It&apos;s a hard scale on purpose: the typical
          profile lands around 50.
        </p>
        <dl className="mt-8 divide-y border-y" style={{ borderColor: "var(--grid-hairline)" }}>
          {WEIGHTS.map((w) => (
            <div key={w.label} className="py-4 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 items-baseline">
              <dt>
                <span>{w.label}</span>
                <span className="block text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {w.note}
                </span>
              </dt>
              <dd className="font-mono-accent text-lg tnum">{w.points}</dd>
              <div className="col-span-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--grid-hairline)" }} aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${(w.points / 45) * 100}%`, background: "var(--brand-blue)" }} />
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm" style={{ color: "var(--text-muted)" }}>
          Per-repository scoring, the tier thresholds and the limits of what RepoLens can see are on the{" "}
          <Link href="/methodology" className="link">
            methodology page
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="who" className="mt-24">
        <H2 id="who">Who it&apos;s for</H2>
        <div className="mt-6 space-y-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <p>
            Mostly students and early-career developers who have repositories from coursework and side projects, and
            no real idea whether they come across as impressive or abandoned.
          </p>
          <p>
            If you&apos;re applying for jobs, <Link href="/match" className="link">job match</Link> checks a posting against
            what your repositories actually show. Bootcamps, clubs and hackathon judges can score a whole group at once
            under <Link href="/org" className="link">cohorts</Link>.
          </p>
        </div>
      </section>

      <section aria-labelledby="cost" className="mt-24">
        <H2 id="cost">What it costs</H2>
        <p className="mt-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Nothing, and it&apos;s built to stay that way. Hosting, the GitHub API, the AI review and the database all run
          on free tiers. When the AI&apos;s free quota runs out, a built-in rules engine writes the same report instead
          of an error. The source is{" "}
          <a href="https://github.com/Rian-Fernando/RepoLens" className="link">
            public on GitHub
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="faq-heading" className="mt-24">
        <H2 id="faq-heading">Questions</H2>
        <dl className="mt-6 divide-y border-y" style={{ borderColor: "var(--grid-hairline)" }}>
          {FAQS.map((faq) => (
            <div key={faq.q} className="py-5">
              <dt className="font-medium">{faq.q}</dt>
              <dd className="mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {faq.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
