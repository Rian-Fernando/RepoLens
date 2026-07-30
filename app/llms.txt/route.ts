import { SITE_URL } from "@/lib/site";

/**
 * /llms.txt — the llms.txt convention: a factual, quotable summary for AI
 * answer engines (ChatGPT, Perplexity, Claude, Google AI Overviews) that
 * reads the site without executing its JavaScript.
 */

export const dynamic = "force-static";

const CONTENT = `# RepoLens

> RepoLens is a free web app that analyzes any public GitHub profile and scores it out of 100 on how well it presents its owner to recruiters and hiring managers. It measures repository quality, README quality, commit habits, language breadth, open-source collaboration, and portfolio coverage, then generates role-targeted fixes — including AI-drafted READMEs that can be opened as real pull requests — and five specific projects the developer should build next. Built by Rian Fernando. No sign-up, no payment, no API keys required.

## What it does

RepoLens answers one question: what does your GitHub say about you to someone deciding whether to hire you? Enter any public GitHub username and it returns a 0–100 portfolio score with a full breakdown in about twenty seconds. It is aimed at students, junior developers, and job-seeking engineers who have public repositories but no clear sense of how those repositories read to an outsider.

The score is computed from six weighted components: repository quality (45 points), recent activity (15), portfolio coverage (15), language breadth (10), open-source collaboration (10), and commit-message craft (5). Every weight is published at [the methodology page](${SITE_URL}/methodology).

## Key features

- [Portfolio analysis](${SITE_URL}/) — score any public GitHub profile 0–100, with per-repository quality breakdowns, README scoring, a commit day/hour heatmap, and language distribution.
- [Role targeting](${SITE_URL}/) — retune the analysis and recommendations for frontend, backend, full-stack, data/ML, or DevOps roles.
- Fix Kit — generates the missing pieces for weak repositories (README drafts, MIT license, CI workflow) and can open them as real pull requests on the signed-in user's own repositories via GitHub OAuth.
- Improvement roadmap — each detected gap becomes a checklist item labeled with the exact number of score points it would earn.
- [Job match](${SITE_URL}/match) — paste a job description and get a readiness score with every requirement mapped to concrete evidence in the user's repositories, plus what is missing.
- [Head-to-head compare](${SITE_URL}/compare) — compare two GitHub profiles across seven categories.
- [Leaderboard](${SITE_URL}/leaderboard) — ranked scores of every profile analyzed, grouped into tiers and filterable by primary language.
- [Cohort ranking](${SITE_URL}/org) — score an entire GitHub organization or a pasted list of usernames, with CSV export, for hackathons, bootcamps, and classrooms.
- [CI score check](${SITE_URL}/action) — a GitHub Actions workflow that re-scores a profile weekly and fails the build if the score drops below a threshold.
- Score badge — an embeddable SVG badge showing a live score, for profile READMEs.
- Shareable reports — every analysis lives at a public URL and unfurls as a branded score card on social platforms.

## How scoring works

Tiers: EXCELLENT (80–100), DEVELOPING (50–79), NEEDS WORK (0–49). The median analyzed profile scores around 50, and roughly one profile in ten clears 80. Percentiles are computed against every profile ever analyzed on the site, counting each person once by their most recent score.

Repository quality is scored per repository out of 100: README quality (25 points), recent pushes (15), description (10), topics (10), license (10), live demo link (10), community stars (10), and README presence (10).

RepoLens reads only public GitHub data through the official GitHub API. It cannot see private repositories and does not evaluate source-code quality directly — it measures the signals around the code that determine whether someone else can understand and trust it. Full detail: [methodology](${SITE_URL}/methodology).

## Tech stack

Next.js 15 (App Router) and TypeScript, deployed on Vercel. Data comes from the GitHub REST API. AI features use the Google Gemini API free tier, with a deterministic rule-based engine as a fallback so the app works with no API key at all. Benchmarks and score history are stored in Neon Postgres. Charts use Recharts; the interface uses three.js and anime.js for motion. The entire stack runs on free tiers — RepoLens costs nothing to operate.

## Is it free?

Yes, completely. There is no paid tier, no sign-up, and no credit card. Signing in with GitHub is optional and only unlocks opening fixes as pull requests.

## Links

- [Live app](${SITE_URL})
- [Source code on GitHub](https://github.com/Rian-Fernando/RepoLens)
- [How scoring works](${SITE_URL}/methodology)
- [Guide: making your GitHub recruiter-ready](${SITE_URL}/guide)
- Built by Rian Fernando — https://rianfernando.com
`;

export function GET() {
  return new Response(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
