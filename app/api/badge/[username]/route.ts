import { NextRequest, NextResponse } from "next/server";
import { collect } from "@/lib/github";
import { analyze } from "@/lib/analyze";

/**
 * Embeddable SVG score badge, shields.io style:
 *   ![RepoLens](https://repolens.rianfernando.com/api/badge/<username>)
 * Cached for a day at the edge so embedding it in READMEs doesn't burn
 * the GitHub API budget.
 */

export const maxDuration = 60;

function bandColor(score: number): string {
  if (score >= 70) return "#199e70"; // aqua-green: strong
  if (score >= 40) return "#3987e5"; // brand blue: solid
  return "#d95926"; // orange: needs work
}

function badgeSvg(label: string, value: string, color: string): string {
  const labelW = 7 + label.length * 6.5 + 7;
  const valueW = 7 + value.length * 6.5 + 7;
  const w = labelW + valueW;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#1a1a19"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelW / 2}" y="14">${label}</text>
    <text x="${labelW + valueW / 2}" y="14" font-weight="bold">${value}</text>
  </g>
</svg>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const headers = {
    "Content-Type": "image/svg+xml",
    "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  };

  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) {
    return new NextResponse(badgeSvg("RepoLens", "invalid user", "#898781"), { status: 400, headers });
  }

  try {
    const collected = await collect(username, process.env.GITHUB_TOKEN?.trim() || undefined);
    const a = analyze(collected);
    return new NextResponse(
      badgeSvg("RepoLens", `${a.overallScore}/100`, bandColor(a.overallScore)),
      { headers },
    );
  } catch {
    return new NextResponse(badgeSvg("RepoLens", "unrated", "#898781"), { headers });
  }
}
