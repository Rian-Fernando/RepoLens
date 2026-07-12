import { NextRequest, NextResponse } from "next/server";
import { collect } from "@/lib/github";
import { analyze } from "@/lib/analyze";
import { getWatches, recordScore, setCachedAnalysis, updateWatchScore } from "@/lib/db";
import { getTier } from "@/lib/tiers";
import { SITE_URL } from "@/lib/site";

export const maxDuration = 300;

/**
 * Weekly watch job (vercel.json cron). Re-scores every watched profile and
 * emails subscribers whose score moved. Protected by Vercel's cron auth
 * (Authorization: Bearer CRON_SECRET).
 */

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "RepoLens <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ skipped: "RESEND_API_KEY not set" });
  }

  const watches = await getWatches(40); // stays inside one GitHub token-hour
  const results: string[] = [];
  const scored = new Map<string, number>();

  for (const watch of watches) {
    try {
      let score = scored.get(watch.login);
      if (score === undefined) {
        const collected = await collect(watch.login, process.env.GITHUB_TOKEN?.trim() || undefined);
        const analysis = analyze(collected);
        score = analysis.overallScore;
        scored.set(watch.login, score);
        await recordScore(watch.login, score, analysis.languages[0]?.name ?? null);
        await setCachedAnalysis(watch.login, analysis);
      }

      if (watch.lastScore !== null && score !== watch.lastScore) {
        const up = score > watch.lastScore;
        const tier = getTier(score);
        await sendEmail(
          watch.email,
          `@${watch.login}: ${watch.lastScore} → ${score} ${up ? "↑" : "↓"} on RepoLens`,
          `<div style="font-family:system-ui,sans-serif;max-width:480px">
            <h2 style="margin:0 0 8px">@${watch.login} moved ${up ? "up" : "down"}</h2>
            <p style="font-size:32px;font-weight:700;margin:8px 0">${watch.lastScore} → <span style="color:${tier.hex}">${score}</span>/100 <small>(${tier.label})</small></p>
            <p><a href="${SITE_URL}/u/${watch.login}">See what changed →</a></p>
            <p style="color:#888;font-size:12px">You watch this profile on RepoLens. Reply STOP to any email to unsubscribe.</p>
          </div>`,
        );
        results.push(`${watch.login}: ${watch.lastScore}→${score} emailed ${watch.email}`);
      }
      await updateWatchScore(watch.id, score);
    } catch (e) {
      results.push(`${watch.login}: failed (${e instanceof Error ? e.message.slice(0, 60) : "?"})`);
    }
  }

  return NextResponse.json({ checked: watches.length, changes: results });
}
