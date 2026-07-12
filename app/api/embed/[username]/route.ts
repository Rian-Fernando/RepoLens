import { NextRequest, NextResponse } from "next/server";
import { getLatestScore } from "@/lib/db";
import { getTier } from "@/lib/tiers";
import { SITE_URL } from "@/lib/site";

/**
 * Embeddable score widget — a self-contained HTML document for iframes:
 *   <iframe src="https://repolens…/api/embed/<user>" width="360" height="120">
 * Reads the latest recorded score (no GitHub calls); edge-cached 6h.
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
  };
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/.test(username)) {
    return new NextResponse("<!doctype html><p>invalid user</p>", { status: 400, headers });
  }

  const score = await getLatestScore(username);
  const tier = score != null ? getTier(score) : null;
  const safe = username.replace(/[^a-zA-Z0-9-]/g, "");

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>RepoLens — @${safe}</title></head>
<body style="margin:0;background:#0d1117;font-family:ui-monospace,'JetBrains Mono',monospace">
<a href="${SITE_URL}/u/${safe}" target="_blank" rel="noopener" style="text-decoration:none;color:#f0f4fa;display:flex;align-items:center;gap:14px;padding:16px 18px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:radial-gradient(ellipse 70% 90% at 10% 0%,rgba(121,184,255,.14),transparent),#0d1117">
  <img src="https://github.com/${safe}.png?size=96" width="48" height="48" style="border-radius:999px;border:2px solid rgba(255,255,255,.18)" alt="">
  <span style="flex:1;min-width:0">
    <span style="display:block;font-size:14px;font-weight:700;color:#79b8ff">@${safe}</span>
    <span style="display:block;font-size:10px;letter-spacing:.12em;color:#8b949e;margin-top:2px">REPOLENS PORTFOLIO SCORE</span>
  </span>
  ${
    score != null && tier
      ? `<span style="text-align:right">
    <span style="display:block;font-size:30px;font-weight:700;color:${tier.hex};line-height:1">${score}<small style="font-size:13px;color:#8b949e">/100</small></span>
    <span style="display:block;font-size:9px;letter-spacing:.14em;color:${tier.hex};margin-top:3px">${tier.label}</span>
  </span>`
      : `<span style="font-size:12px;color:#8b949e">not scored yet →</span>`
  }
</a>
</body></html>`;

  return new NextResponse(html, { headers });
}
