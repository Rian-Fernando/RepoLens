import { neon } from "@neondatabase/serverless";

/**
 * Score database (Neon Postgres free tier) — powers real percentiles, the
 * leaderboard, and per-user score history.
 *
 * Entirely optional: every function no-ops or returns null when DATABASE_URL
 * is unset, and the UI falls back to the estimated percentile curve. Only
 * public data is stored: login, score, timestamp.
 */

type Sql = ReturnType<typeof neon>;

let sqlClient: Sql | null | undefined;
let schemaReady: Promise<void> | null = null;

function getSql(): Sql | null {
  if (sqlClient !== undefined) return sqlClient;
  const url = process.env.DATABASE_URL?.trim();
  sqlClient = url ? neon(url) : null;
  return sqlClient;
}

async function ensureSchema(sql: Sql): Promise<void> {
  schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS scores (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        login TEXT NOT NULL,
        score INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS scores_login_time ON scores (login, created_at DESC)`;
  })();
  return schemaReady;
}

/** Record one analysis result. Throttled to one row per login per hour. */
export async function recordScore(login: string, score: number): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await ensureSchema(sql);
    await sql`
      INSERT INTO scores (login, score)
      SELECT ${login.toLowerCase()}, ${score}
      WHERE NOT EXISTS (
        SELECT 1 FROM scores
        WHERE login = ${login.toLowerCase()} AND created_at > now() - interval '1 hour'
      )`;
  } catch (e) {
    console.warn("recordScore failed (non-fatal):", e instanceof Error ? e.message : e);
  }
}

export interface Bench {
  /** Real percentile (0-100) across analyzed profiles; null until the sample is meaningful. */
  percentile: number | null;
  sample: number;
  history: Array<{ date: string; score: number }>;
}

const MIN_SAMPLE = 30;

/** Real percentile + this user's score history. Null when no DB is configured. */
export async function getBench(login: string, score: number): Promise<Bench | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensureSchema(sql);
    const [stats] = (await sql`
      WITH latest AS (
        SELECT DISTINCT ON (login) login, score
        FROM scores ORDER BY login, created_at DESC
      )
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE score < ${score})::int AS below
      FROM latest`) as Array<{ total: number; below: number }>;
    const history = (await sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS date, score
      FROM scores WHERE login = ${login.toLowerCase()}
      ORDER BY created_at ASC LIMIT 60`) as Array<{ date: string; score: number }>;
    return {
      percentile:
        stats.total >= MIN_SAMPLE ? Math.min(99, Math.max(1, Math.round((stats.below / stats.total) * 100))) : null,
      sample: stats.total,
      history,
    };
  } catch (e) {
    console.warn("getBench failed (non-fatal):", e instanceof Error ? e.message : e);
    return null;
  }
}

export interface LeaderboardRow {
  login: string;
  score: number;
  analyzedAt: string;
}

/** Top profiles by latest score. Null when no DB is configured. */
export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[] | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    await ensureSchema(sql);
    const rows = (await sql`
      SELECT DISTINCT ON (login) login, score, to_char(created_at, 'YYYY-MM-DD') AS analyzed_at
      FROM scores ORDER BY login, created_at DESC`) as Array<{
      login: string;
      score: number;
      analyzed_at: string;
    }>;
    return rows
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({ login: r.login, score: r.score, analyzedAt: r.analyzed_at }));
  } catch (e) {
    console.warn("getLeaderboard failed (non-fatal):", e instanceof Error ? e.message : e);
    return null;
  }
}
