import { SITE_URL } from "@/lib/site";

/**
 * /llms.txt — the llms.txt convention: a factual, quotable summary for AI
 * answer engines (ChatGPT, Perplexity, Claude, Google AI Overviews) that
 * reads the site without executing its JavaScript.
 */

export const dynamic = "force-static";

const CONTENT = `# RepoLens

> RepoLens is a free web app that scores a public GitHub profile out of 100 on how it comes across to recruiters and hiring managers. It looks at repository quality, README quality, commit habits, language breadth, open-source collaboration and coverage of things like tests, CI and live demos. Then it lists the fixes in order of how many points each is worth, drafts the missing READMEs, licenses and CI workflows, and suggests five projects to build next. It was built by Rian Fernando. Opening a report needs no account; analyzing a new profile needs a free GitHub sign-in.

## What it does

RepoLens answers one question: what does your GitHub say about you to someone deciding whether to hire you? Enter a public GitHub username and it returns a score out of 100 with a full breakdown. A fresh analysis takes about twenty seconds. It's aimed at students, junior developers and job-seeking engineers who have public repositories but no clear sense of how those repositories read to someone else.

The score adds up six parts: repository quality (45 points), recent activity (15), coverage (15), language breadth (10), open-source collaboration (10) and commit messages (5). Every weight is published on [the methodology page](${SITE_URL}/methodology).

## Key features

- [Portfolio analysis](${SITE_URL}/): a score out of 100 with per-repository quality, README grades, a commit heatmap and the languages used.
- [Role targeting](${SITE_URL}/): tune the review for frontend, backend, full-stack, data and ML, or DevOps roles.
- Fix kit: drafts what a weak repository is missing (a README, an MIT license, a CI workflow), ready to copy into it.
- Improvement roadmap: each gap becomes a checklist item labeled with the points it would earn.
- [Job match](${SITE_URL}/match): paste a job description and see which requirements your repositories actually show, which are thin, and what's missing.
- [Compare](${SITE_URL}/compare): two GitHub profiles side by side across seven categories.
- [Leaderboard](${SITE_URL}/leaderboard): every profile analyzed, ranked and grouped into tiers, filterable by primary language.
- [Cohort ranking](${SITE_URL}/org): paste a list of usernames to score and rank a whole group, with CSV export, for bootcamps, clubs and hackathons.
- [CI score check](${SITE_URL}/action): a GitHub Actions workflow that fails when your score drops below a threshold you set.
- Score badge: an SVG badge with your latest score, for a profile README.
- Shareable reports: every analysis has a public link that shows a score card when shared.

## How scoring works

Tiers: Excellent (80 to 100), Developing (50 to 79) and Needs work (0 to 49). The typical analyzed profile scores around 50, and about one in ten clears 80. Percentiles compare a profile with every profile ever analyzed on the site, counting each person once by their latest score.

Each repository is scored out of 100: README quality (25 points), recent pushes (15), description (10), topics (10), license (10), live demo link (10), stars (10) and having a README at all (10).

RepoLens reads only public GitHub data, through GitHub's official API, on behalf of the signed-in person who asked for the analysis. It can't see private repositories and doesn't judge the code itself. It measures the signals around the code that decide whether someone else can understand it and trust it. Full detail: [methodology](${SITE_URL}/methodology).

## Tech stack

Next.js and TypeScript, deployed on Vercel. Profile data comes from the GitHub REST API through a GitHub App that requests no permissions. The written review uses the Google Gemini API free tier, with a built-in rules engine as a fallback, so the app still works when there's no AI quota left. Scores and history are stored in Neon Postgres, and charts use Recharts. The whole stack runs on free tiers.

## Is it free?

Yes. There's no paid plan and no credit card. Opening a report needs nothing at all. Analyzing a new profile needs a free GitHub sign-in, which only reads public data and runs on your own GitHub rate limit.

## Links

- [Live app](${SITE_URL})
- [Source code on GitHub](https://github.com/Rian-Fernando/RepoLens)
- [How scoring works](${SITE_URL}/methodology)
- [Guide: making your GitHub recruiter-ready](${SITE_URL}/guide)
- [Sign in with GitHub](${SITE_URL}/signin)
- Built by Rian Fernando: https://rianfernando.com
`;

export function GET() {
  return new Response(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
