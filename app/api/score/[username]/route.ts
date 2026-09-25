import { NextRequest, NextResponse } from "next/server";
import { getCachedAnalysis } from "@/lib/db";
import type { Analysis } from "@/lib/types";
import { estimatePercentile } from "@/lib/percentile";

/**
 * Machine-readable score endpoint — the integration surface for CI.
 *
 *   curl https://repolens…/api/score/<username>
 *   → { login, score, percentileEstimate, parts, openGaps, analyzedAt }
 *
 * The GitHub Action recipe on /action fails a workflow when `score` drops
 * below a chosen threshold. Cached at the edge for 6 hours.
 *
 * Cache-only by design: this is polled by other people's scheduled CI, and
 * automated traffic must never turn into GitHub API crawls. It reports the
 * latest analysis; re-analyzing on the site refreshes it.
 */

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const headers = { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" };

  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) {
    return NextResponse.json({ error: "Invalid GitHub username." }, { status: 400 });
  }

  try {
    const cached = await getCachedAnalysis(username, 60 * 24 * 365 * 10);
    if (!cached) {
      return NextResponse.json(
        { error: `No analysis yet for ${username}. Analyze the profile at /u/${username} first.` },
        { status: 404, headers },
      );
    }
    const a = cached.data as Analysis;
    return NextResponse.json(
      {
        login: a.profile.login,
        score: a.overallScore,
        percentileEstimate: estimatePercentile(a.overallScore),
        parts: a.scoreParts,
        openGaps: a.gaps.filter((g) => g.severity !== "good").map((g) => g.id),
        reposAnalyzed: a.totals.analyzed,
        analyzedAt: new Date(Date.now() - cached.ageMinutes * 60_000).toISOString(),
        report: `/u/${a.profile.login}`,
      },
      { headers },
    );
  } catch {
    return NextResponse.json({ error: "Score lookup failed." }, { status: 500 });
  }
}
