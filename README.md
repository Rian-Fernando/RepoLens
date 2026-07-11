# RepoLens — GitHub portfolio analyzer

Live at **repolens.rianfernando.com** · part of [rianfernando.com](https://rianfernando.com) · **$0 to run, free forever**

RepoLens doesn't just read a GitHub profile — it closes the loop from *diagnosis to fix*:

- **Score** any public profile 0–100: languages (real byte counts), commit habits (day×hour heatmap), per-repo quality, README quality — tuned to a **target role** (frontend / backend / data-ML / DevOps / full-stack)
- **Fix Kit** — for every weak repo, generate the actual missing pieces: an AI-drafted `README.md`, an MIT `LICENSE`, a CI workflow — ready to copy and commit
- **Improvement roadmap** — every gap becomes a checklist item with its computed score gain ("fix 4 READMEs: +9.2"), saved locally so you can re-analyze and watch the score climb
- **README badge** — `![RepoLens](https://repolens…/api/badge/you)` — a live score badge for your profile README
- **Shareable reports** — every analysis lives at `/u/username`; send it to a recruiter
- **Head-to-head** — `/compare` pits two profiles across seven categories
- **"Based on your GitHub, here are 5 projects you should build"** — AI-generated (Gemini free tier), grounded in the detected gaps, with resume bullets that only reference repos that actually exist

## The free-forever architecture

Every layer has a $0 path:

| Layer | How it's free |
|---|---|
| Hosting | Vercel hobby tier (Next.js zero-config) |
| Data | GitHub REST API — 60 req/hour unauthenticated (~1 analysis), optional user-supplied token for 5,000/hour |
| AI | Gemini API free tier (~1,500 req/day, no credit card) via `GEMINI_API_KEY` |
| AI fallback | A built-in rules engine produces the full report when no key is set or the quota is hit — the app never breaks and never bills |
| Benchmarks | Neon Postgres free tier (optional `DATABASE_URL`) for percentiles, leaderboard, history |

## Run it locally

```bash
npm install
npm run dev          # works immediately — rules engine mode
```

For AI-written suggestions and README drafts (still free):

```bash
cp .env.local.example .env.local
# add GEMINI_API_KEY from https://aistudio.google.com/apikey (free, no card)
```

## Architecture

```
app/page.tsx                     landing + dashboard (components/Analyzer.tsx)
app/u/[username]/page.tsx        shareable report (auto-runs analysis)
app/compare/page.tsx             head-to-head comparison
app/api/analyze/route.ts         GitHub fetch + scoring (~38 requests/analysis)
app/api/suggest/route.ts         Gemini structured output → rules-engine fallback
app/api/fix-readme/route.ts      AI README drafts → template fallback
app/api/badge/[username]/route…  SVG score badge (edge-cached 24h)
lib/analyze.ts                   scoring: repo/README quality, habits, gaps
lib/roadmap.ts                   gap → checklist with computed score gains
lib/suggest-fallback.ts          the $0 rules engine
lib/gemini.ts                    minimal Gemini REST client (no SDK)
```

Tokens and keys are only ever used server-side; the browser never talks to GitHub or Gemini directly.

## Deploying under rianfernando.com

1. Deploy to Vercel (hobby tier), set `GEMINI_API_KEY` (and optionally `GITHUB_TOKEN` for the badge endpoint) in project env vars.
2. DNS for `rianfernando.com`: add CNAME `repolens` → `cname.vercel-dns.com`.
3. Add `repolens.rianfernando.com` as the project's custom domain.
4. On rianfernando.com, add a project card linking to `https://repolens.rianfernando.com` (the app already links back from its header and footer).
