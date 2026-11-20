#!/usr/bin/env node
/**
 * Health check for the live site. GitHub Actions runs it every Monday
 * (.github/workflows/weekly-check.yml); run it by hand any time with
 *
 *   node scripts/check-live.mjs [base-url]
 *
 * It uses the site the way a visitor does and exits non-zero if anything is broken,
 * which makes the workflow fail and GitHub email the repo owner.
 *
 * It never calls the GitHub API. The reports it opens are already saved, and the new
 * profile it tries is expected to stop at the sign-in prompt. One plain request to
 * github.com confirms the sign-in app still exists, and two requests use Gemini's
 * free tier.
 */

import { appendFile } from "node:fs/promises";

const BASE = (process.argv[2] || "https://repolens.rianfernando.com").replace(/\/+$/, "");
const PRODUCTION = "https://repolens.rianfernando.com";
const OLD_ALIAS = "https://repo-lens-puce.vercel.app";
const SAVED = "torvalds"; // reports that are already saved, so opening them costs nothing
const SAVED_2 = "karpathy";
const NEVER_ANALYZED = "repolens-health-check"; // has to ask for a sign-in, never crawl
const JOB_POST =
  "We're hiring a systems engineer for low-level infrastructure work. You'll write C and some Rust, " +
  "work inside the Linux kernel, review patches from other contributors, write tests and keep CI green. " +
  "Experience maintaining a large open-source project is a plus.";

const results = [];
const ensure = (condition, message) => {
  if (!condition) throw new Error(message);
};
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function check(name, fn) {
  const started = Date.now();
  let entry;
  try {
    entry = { name, ok: true, detail: (await fn()) ?? "" };
  } catch (e) {
    entry = { name, ok: false, detail: e?.message ?? String(e) };
  }
  entry.ms = Date.now() - started;
  results.push(entry);
  console.log(`${entry.ok ? "ok  " : "FAIL"}  ${name}${entry.detail ? `  (${entry.detail})` : ""}`);
}

function request(path, { method = "GET", body, timeout = 30_000 } = {}) {
  return fetch(path.startsWith("http") ? path : BASE + path, {
    method,
    redirect: "manual",
    headers: { "user-agent": "repolens-weekly-check", ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------- pages

const PAGES = [
  ["/", "What does your GitHub say about you?"],
  ["/match", "Am I ready for this job?"],
  ["/compare", "Compare two profiles"],
  ["/leaderboard", "Leaderboard"],
  ["/org", "Rank a cohort"],
  ["/action", "under CI"],
  ["/guide", "recruiter-ready"],
  ["/methodology", "How scoring works"],
  ["/privacy", "Privacy"],
  ["/signin", "Sign in with GitHub"],
  [`/u/${SAVED}`, "GitHub portfolio"],
];

let home = "";
for (const [path, text] of PAGES) {
  await check(`page ${path}`, async () => {
    const res = await request(path);
    ensure(res.status === 200, `HTTP ${res.status}`);
    const html = await res.text();
    ensure(html.includes(text), `"${text}" is missing from the page`);
    if (path === "/") home = html;
  });
}

await check("live analysis isn't paused", async () => {
  ensure(home, "the home page didn't load");
  ensure(!home.includes("Live analysis is paused"), "the home page shows the paused banner");
});

await check("leaderboard lists profiles", async () => {
  const html = await (await request("/leaderboard")).text();
  const count = (html.match(/href="\/u\//g) || []).length;
  ensure(count >= 50, `only ${count} profiles listed`);
  return `${count} profiles`;
});

await check("the site's scripts and styles load", async () => {
  const files = [...new Set(home.match(/\/_next\/static\/[^"'\s>?]+\.(?:js|css)/g) || [])];
  ensure(files.length > 0, "the home page links no scripts");
  const broken = [];
  for (const file of files) {
    const res = await request(file);
    await res.arrayBuffer().catch(() => {});
    if (res.status !== 200) broken.push(`${file} → ${res.status}`);
  }
  ensure(broken.length === 0, broken.slice(0, 3).join(", "));
  return `${files.length} files`;
});

// ---------------------------------------------------------------- sign-in

await check("sign-in is switched on", async () => {
  const state = await readJson(await request("/api/auth/me"));
  ensure(state.live === true && state.configured === true, `auth/me says ${JSON.stringify(state)}`);
});

await check("sign-in goes to the GitHub App, and GitHub knows the app", async () => {
  const res = await request("/api/auth/github?returnTo=/");
  ensure(res.status === 302 || res.status === 307, `expected a redirect, got HTTP ${res.status}`);
  const to = new URL(res.headers.get("location") ?? "");
  ensure(to.origin === "https://github.com" && to.pathname === "/login/oauth/authorize", `redirects to ${to.href.slice(0, 80)}`);
  ensure(to.searchParams.get("client_id"), "the redirect has no client_id");
  const callback = to.searchParams.get("redirect_uri");
  ensure(callback === `${BASE}/api/auth/callback`, `redirect_uri is ${callback}`);
  // GitHub answers an unknown or suspended app with an error page; a working one sends a
  // signed-out browser to its login page.
  const gh = await fetch(to, { redirect: "manual", signal: AbortSignal.timeout(30_000) });
  const next = gh.headers.get("location") ?? "";
  ensure(gh.status === 302 && next.includes("/login"), `GitHub answered HTTP ${gh.status}`);
});

await check("a forged sign-in callback is turned away", async () => {
  const res = await request("/api/auth/callback?code=fake&state=forged");
  const to = res.headers.get("location") ?? "";
  ensure((res.status === 302 || res.status === 307) && to.includes("/signin?error=failed"), `HTTP ${res.status} → ${to}`);
});

// ---------------------------------------------------------------- analysis

let analysis = null;
await check(`a saved report opens (${SAVED})`, async () => {
  const res = await request("/api/analyze", { method: "POST", body: { username: SAVED } });
  const body = await readJson(res);
  ensure(res.ok, `HTTP ${res.status}: ${body.error ?? ""}`);
  ensure(typeof body.overallScore === "number", "the response has no score");
  analysis = body;
  return `score ${body.overallScore}`;
});

await check("a new profile asks for a sign-in instead of crawling", async () => {
  const res = await request("/api/analyze", { method: "POST", body: { username: NEVER_ANALYZED } });
  const body = await readJson(res);
  ensure(res.status === 401 && body.needsSignIn === true, `HTTP ${res.status}: ${body.error ?? ""}`);
});

await check("score API", async () => {
  const res = await request(`/api/score/${SAVED}`);
  const body = await readJson(res);
  ensure(res.ok && typeof body.score === "number", `HTTP ${res.status}`);
  return `score ${body.score}`;
});

// ---------------------------------------------------------------- AI (Gemini, with the rules engine as backup)

async function answeredByGemini(path, body, looksRight) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await request(path, { method: "POST", body, timeout: 70_000 });
    const answer = await readJson(res);
    ensure(res.ok, `HTTP ${res.status}: ${answer.error ?? ""}`);
    ensure(looksRight(answer), "the answer is missing parts");
    if (answer.engine === "gemini") return attempt === 1 ? "gemini" : "gemini, on the second try";
    if (attempt === 1) await pause(60_000); // a busy minute on the free tier; try once more
  }
  throw new Error("the rules engine answered twice, so Gemini is unavailable (key, quota or model)");
}

await check("the written review comes from Gemini", async () => {
  ensure(analysis, "skipped, because the saved report didn't open");
  return answeredByGemini("/api/suggest", { analysis, role: "fullstack" }, (a) => a.projects?.length === 5);
});

await check("job match comes from Gemini", async () => {
  ensure(analysis, "skipped, because the saved report didn't open");
  return answeredByGemini("/api/match", { analysis, jd: JOB_POST }, (a) => a.requirements?.length >= 3);
});

// ---------------------------------------------------------------- images, badge, crawler files

const IMAGES = [
  ["/opengraph-image", "image/png", 20_000],
  [`/u/${SAVED}/opengraph-image`, "image/png", 20_000],
  [`/api/og/compare?a=${SAVED}&b=${SAVED_2}`, "image/png", 20_000],
  [`/api/badge/${SAVED}`, "image/svg+xml", 200],
];
for (const [path, type, minBytes] of IMAGES) {
  await check(`image ${path}`, async () => {
    const res = await request(path);
    const size = (await res.arrayBuffer()).byteLength;
    ensure(res.status === 200, `HTTP ${res.status}`);
    ensure((res.headers.get("content-type") ?? "").startsWith(type), `content-type ${res.headers.get("content-type")}`);
    ensure(size >= minBytes, `only ${size} bytes`);
    return `${Math.round(size / 1024)} KB`;
  });
}

for (const [path, text] of [
  ["/llms.txt", "RepoLens"],
  ["/robots.txt", "Sitemap"],
  ["/sitemap.xml", "<loc>"],
]) {
  await check(`file ${path}`, async () => {
    const res = await request(path);
    ensure(res.status === 200, `HTTP ${res.status}`);
    ensure((await res.text()).includes(text), `"${text}" is missing`);
  });
}

// ---------------------------------------------------------------- headers and domains

await check("security headers", async () => {
  const h = (await request("/")).headers;
  const missing = [
    ["x-frame-options", (v) => v === "DENY"],
    ["content-security-policy", (v) => v.includes("frame-ancestors 'none'")],
    ["strict-transport-security", (v) => v.includes("max-age=")],
    ["x-content-type-options", (v) => v === "nosniff"],
    ["referrer-policy", (v) => v.length > 0],
  ].filter(([name, ok]) => !ok(h.get(name) ?? ""));
  ensure(missing.length === 0, `missing or changed: ${missing.map(([n]) => n).join(", ")}`);
});

if (BASE === PRODUCTION) {
  await check("the old vercel.app address redirects here", async () => {
    const res = await request(`${OLD_ALIAS}/`);
    const to = res.headers.get("location") ?? "";
    ensure([301, 308].includes(res.status) && to.startsWith(PRODUCTION), `HTTP ${res.status} → ${to}`);
  });
}

// ---------------------------------------------------------------- summary

const failed = results.filter((r) => !r.ok);
const summary = [
  `## RepoLens weekly check: ${failed.length ? `${failed.length} problem${failed.length === 1 ? "" : "s"}` : "all good"}`,
  "",
  `Checked ${BASE} on ${new Date().toUTCString()}.`,
  "",
  "| Result | Check | Details |",
  "| --- | --- | --- |",
  ...results.map((r) => `| ${r.ok ? "ok" : "**FAIL**"} | ${r.name} | ${String(r.detail).replace(/\|/g, "\\|")} |`),
  "",
].join("\n");
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);

console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
