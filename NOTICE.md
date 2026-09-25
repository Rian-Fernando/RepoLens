# Notices & attribution

RepoLens is an independent project by Rian Fernando. It is **not affiliated with, endorsed
by, or sponsored by GitHub, Google, or any other party named here.**

## Data sources

| Source | Used for | Terms |
|---|---|---|
| [GitHub REST API](https://docs.github.com/rest) | Public profile, repository, README, commit and search data | [GitHub Terms of Service](https://docs.github.com/site-policy/github-terms/github-terms-of-service) |
| [Google Gemini API](https://ai.google.dev) | The written review, project ideas and README drafts (optional) | [Gemini API terms](https://ai.google.dev/gemini-api/terms) |

RepoLens reads **only public data**, through official APIs. It never requests access to
private repositories. Optional GitHub sign-in uses the `public_repo` scope solely to open pull
requests on repositories the signed-in user owns.

### How RepoLens uses the GitHub API

Following GitHub's [REST API best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)
and [rate-limit rules](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api):

- A GitHub request is only ever made because a person clicked **Analyze**. Badges, OG cards,
  the score API and the embed widget read cached results and never contact GitHub.
- Requests are made **one at a time**, never concurrently.
- A rate-limited response pauses all GitHub requests until the time GitHub specifies; nothing
  is retried automatically. The last 20% of the hourly quota is never spent.
- Each visitor may start 3 fresh analyses per hour, and the whole site at most 20 per hour on
  the shared quota (about 17% of it). There is no scheduled crawling and no bulk collection.
- All GitHub access can be switched off with one setting (`GITHUB_API_ENABLED`), and is off
  unless explicitly enabled.

### How RepoLens uses Gemini

Following the [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms): visitors
in the European Economic Area, Switzerland and the United Kingdom are served by the built-in
rules engine, never the free tier; prompts contain project data only — no names, bios or
usernames; each visitor is capped at 30 AI requests per hour; AI output is labeled; and Roast
mode is limited to the visitor's own profile, in line with Google's
[Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy).

## What is stored

Analyses store the minimum needed for benchmarking and history: **username, score, primary
language, and timestamp**, plus a cached copy of the latest analysis so repeat lookups don't
re-crawl GitHub. The cached copy is replaced on every re-analysis and kept until then, or until
removal is requested. Rate limiting stores a salted, daily-rotating hash of the visitor's
network address — never the raw IP — deleted after 24 hours. Email addresses are stored only
for people who explicitly subscribe to score-change alerts (currently switched off). Personal
access tokens pasted into the UI are used for that single request and never persisted; OAuth
tokens live only in the visitor's own browser cookie.

**Removal:** anyone can have their GitHub username removed from RepoLens — leaderboard,
percentiles, history and cache — via the Feedback button on the site or an issue on this
repository. The operator runs `node scripts/forget.mjs <username> --yes`. See the
[privacy page](https://repolens.rianfernando.com/privacy).

## Scores are a heuristic

A RepoLens score measures how well a public profile **communicates** — documentation, demos,
recency, collaboration signals — not the quality of the code itself, and not the ability of
the person who wrote it. It cannot see private work, employment history, or context. Treat it
as a checklist, never as a verdict.

## Open-source dependencies

Built with [Next.js](https://nextjs.org), [React](https://react.dev),
[TypeScript](https://www.typescriptlang.org), [Tailwind CSS](https://tailwindcss.com),
[Recharts](https://recharts.org), [three.js](https://threejs.org),
[anime.js](https://animejs.com), [ldrs](https://uiball.com/ldrs/) and the
[Neon serverless driver](https://neon.tech). Typefaces are
[Manrope](https://fonts.google.com/specimen/Manrope) and
[JetBrains Mono](https://www.jetbrains.com/lp/mono/), both under the SIL Open Font License.
Each dependency remains under its own license; see `package.json` and the respective projects.

## Trademarks

GitHub is a trademark of GitHub, Inc. Google and Gemini are trademarks of Google LLC. All
other marks belong to their respective owners and are used descriptively.
