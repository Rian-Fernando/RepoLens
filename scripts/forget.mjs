#!/usr/bin/env node
/**
 * Honor a removal request: delete everything RepoLens holds about a GitHub
 * username (scores/history, cached analysis, watch subscriptions).
 *
 *   node scripts/forget.mjs <username> [--yes]
 *
 * Reads DATABASE_URL from .env.local. Without --yes it only shows what would
 * be deleted.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });
const { neon } = require("@neondatabase/serverless");

const login = (process.argv[2] ?? "").trim().toLowerCase();
const confirm = process.argv.includes("--yes");
if (!/^[a-z0-9](?:[a-z0-9-]{0,38})$/.test(login)) {
  console.error("usage: node scripts/forget.mjs <github-username> [--yes]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (.env.local).");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const [counts] = await sql`
  SELECT (SELECT count(*)::int FROM scores WHERE login = ${login}) AS scores,
         (SELECT count(*)::int FROM analyses WHERE login = ${login}) AS analyses,
         (SELECT count(*)::int FROM watches WHERE login = ${login}) AS watches`;
console.log(`${login}: ${counts.scores} score rows, ${counts.analyses} cached analysis, ${counts.watches} watch subscriptions`);

if (!confirm) {
  console.log("Dry run. Re-run with --yes to delete.");
  process.exit(0);
}
await sql`DELETE FROM scores WHERE login = ${login}`;
await sql`DELETE FROM analyses WHERE login = ${login}`;
await sql`DELETE FROM watches WHERE login = ${login}`;
console.log(`Deleted. ${login} is gone from the leaderboard, percentiles, history and cache.`);
