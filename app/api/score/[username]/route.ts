import { NextRequest, NextResponse } from "next/server";
import { collect, GitHubError } from "@/lib/github";
import { analyze } from "@/lib/analyze";
import { estimatePercentile } from "@/lib/percentile";

/**
 * Machine-readable score endpoint — the integration surface for CI.
 *
 *   curl https://repolens…/api/score/<username>
 *   → { login, score, percentileEstimate, parts, openGaps, analyzedAt }
 *
 * The GitHub Action recipe on /action fails a workflow when `score` drops
 * below a chosen threshold. Cached at the edge for 6 hours.
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
    const collected = await collect(username, process.env.GITHUB_TOKEN?.trim() || undefined);
    const a = analyze(collected);
    return NextResponse.json(
      {
        login: a.profile.login,
        score: a.overallScore,
        percentileEstimate: estimatePercentile(a.overallScore),
        parts: a.scoreParts,
        openGaps: a.gaps.filter((g) => g.severity !== "good").map((g) => g.id),
        reposAnalyzed: a.totals.analyzed,
        analyzedAt: new Date().toISOString(),
        report: `/u/${a.profile.login}`,
      },
      { headers },
    );
  } catch (e) {
    if (e instanceof GitHubError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Analysis failed." }, { status: 500 });
  }
}
