# Changelog

All notable changes to RepoLens. Dates are release dates; the live app updates on every
push to `main`.

## 2026-09-25 — Compliance pass

GitHub API — brought in line with GitHub's REST API best practices and rate-limit rules:
- Requests are made one at a time instead of ~36 concurrently per analysis
- A rate-limited response opens a breaker shared by every server instance until GitHub's
  `retry-after` / `x-ratelimit-reset`; nothing is retried automatically, and the last 20% of
  the hourly quota is never spent
- Only a person clicking Analyze can start a crawl: badges, OG cards and the score API now
  read cached results instead of crawling when bots, image proxies or CI fetch them
- Per-visitor cap of 3 fresh analyses an hour and a site-wide cap of 20 an hour on the shared
  quota; over either, the cached report is served
- The server token is always tracked under the shared breaker; a visitor's own token is not

Gemini — brought in line with the Gemini API Additional Terms and Prohibited Use Policy:
- Visitors in the EEA, UK and Switzerland are served by the rules engine, never the free tier
- Prompts no longer include names, bios or usernames
- 30 AI requests per visitor per hour, then the rules engine answers
- Roast mode asks the visitor to confirm the profile is their own

Security and privacy:
- Fixed an open redirect in the GitHub sign-in callback (`//host` return paths)
- Security headers: nosniff, referrer policy, permissions policy, frame-ancestors (embed
  widget excepted)
- CI workflow runs with read-only permissions (clears the code-scanning alert)
- New `/privacy` page with a removal route; `scripts/forget.mjs` deletes a username
  everywhere on request
- Per-person report pages are `noindex`
- `NOTICE.md` corrected: the analysis cache is not "short-lived"

## 2026-09-11 — GitHub API access paused

- Global kill switch in `lib/github.ts`, defaulting to **off**: no request
  reaches api.github.com unless `GITHUB_API_ENABLED=true` is set explicitly
- Profile analysis runs cache-only — previously analyzed reports still open,
  new ones return a clear "paused" message instead of crawling
- A visitor-supplied token no longer forces a live crawl either
- Score API, badges, OG cards, Fix PRs and GitHub sign-in all refuse cleanly
- The weekly watch cron is removed from `vercel.json`
- Organization member lookup (the one call the browser made directly to
  GitHub) is retired; pasted username lists still work

## 2026-08-02 — Feedback widget

- [Feedex](https://feedex.rianfernando.com) widget on every page, loaded with
  `next/script` at `lazyOnload` so it stays off the critical path
- Each report is tagged with the route it came from, so feedback about the job
  matcher is distinguishable from feedback about a shared report
- Env-gated on `NEXT_PUBLIC_FEEDEX_KEY`: unset, nothing renders

## 2026-07-30 — GEO readiness and a real home page

- `/llms.txt` following the llms.txt convention, so answer engines can read a factual,
  quotable summary without executing JavaScript
- `robots.txt` names the 14 major AI crawlers explicitly (GPTBot, OAI-SearchBot, ClaudeBot,
  PerplexityBot, Google-Extended, CCBot and others), allowing `/` and disallowing `/api/`
- `FAQPage` JSON-LD alongside an enriched `WebApplication` block; the same six answers also
  render as visible HTML from one shared source
- Home page now explains itself: why it exists, a four-step how-it-works, the six score
  weights as visual meters, who it's for, and the zero-dollar architecture
- Shared reports (`/u/<username>`) gained a real `<h1>` — they previously had none
- Descriptive page titles, image dimensions and lazy decoding (CLS), and a brand-colored
  `:focus-visible` ring

## 2026-07-14 — Transparency

- [Methodology page](https://repolens.rianfernando.com/methodology) publishing every scoring
  weight, tier threshold, percentile calculation, and the limits of what RepoLens can see
- Leaderboard grouped into tier bands with counts, so a small EXCELLENT group reads as
  calibration rather than a bug
- Sentry wired through instrumentation hooks, inert unless a DSN is configured

## 2026-07-12 — Scoring v2, job matching, cohorts

- **Scoring v2**: collaboration signals (merged pull requests, issues and reviews in other
  people's repositories), commit-message craft, and profile-README detection. Overall score
  rebalanced across six components with roadmap point-gains recomputed to match
- **Job matcher** — paste a job description, get a readiness score with each requirement
  mapped to real repository evidence
- **Roast mode** — the same analysis with less mercy; resume bullets stay serious
- **Watch mode** — weekly re-score with an email when a score moves
- **Cohort ranking** with CSV export; **embeddable score widget**; **goal setting**
- Language-filtered leaderboards
- **One-click Fix PRs** — the Fix Kit opens its drafts as real pull requests via GitHub OAuth
- Analysis caching, stale-serving under rate limits, compare OG cards, score history,
  Markdown export, and a `/guide` article

## 2026-07-11 — Search-engine readiness

- Sitemap, robots, canonical URLs and `metadataBase` on the production domain
- Site-wide 1200×630 PNG Open Graph card; `*.vercel.app` redirects to the canonical domain
- `WebApplication` JSON-LD

## 2026-07-10 — First public release

- Profile scoring 0–100 with per-repository quality, README grading, commit habits,
  language breakdown and coverage gap detection
- Role targeting, improvement roadmap with computed point gains, and the Fix Kit
- AI review and five project recommendations (Gemini free tier, rules-engine fallback)
- Score badge, shareable reports with dynamic OG score cards, head-to-head compare,
  leaderboard and real percentiles backed by Neon Postgres
- Brand system, three.js starfield interface, and the public `/api/score` endpoint with a
  CI workflow that fails when portfolio quality drops
