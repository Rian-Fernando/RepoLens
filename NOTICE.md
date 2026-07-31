# Notices & attribution

RepoLens is an independent project by Rian Fernando. It is **not affiliated with, endorsed
by, or sponsored by GitHub, Google, or any other party named here.**

## Data sources

| Source | Used for | Terms |
|---|---|---|
| [GitHub REST API](https://docs.github.com/rest) | Public profile, repository, README, commit and search data | [GitHub Terms of Service](https://docs.github.com/site-policy/github-terms/github-terms-of-service) |
| [Google Gemini API](https://ai.google.dev) | The written review, project ideas and README drafts (optional) | [Gemini API terms](https://ai.google.dev/gemini-api/terms) |

RepoLens reads **only public data**, through official APIs, at documented rate limits. It
never requests access to private repositories. Optional GitHub sign-in uses the `public_repo`
scope solely to open pull requests on repositories the signed-in user owns.

## What is stored

Analyses store the minimum needed for benchmarking and history: **username, score, primary
language, and timestamp**, plus a short-lived cached copy of the analysis so repeat lookups
don't re-crawl GitHub. Email addresses are stored only for people who explicitly subscribe to
score-change alerts. Personal access tokens pasted into the UI are used for that single
request and never persisted; OAuth tokens live only in the visitor's own browser cookie.

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
