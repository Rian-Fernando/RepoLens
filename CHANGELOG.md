# Changelog

All notable changes to RepoLens. Dates are release dates; the live app updates on every
push to `main`.

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
