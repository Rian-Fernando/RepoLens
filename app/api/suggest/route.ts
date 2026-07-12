import { NextRequest, NextResponse } from "next/server";
import type { Analysis, Suggestions } from "@/lib/types";
import { generateJson, GeminiError } from "@/lib/gemini";
import { fallbackSuggestions } from "@/lib/suggest-fallback";
import { ROLE_EXPECTATIONS, ROLES, type RoleId } from "@/lib/roles";

export const maxDuration = 60;

const SUGGESTIONS_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING", description: "One-sentence read on the portfolio, addressed to the developer" },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    resumeBullets: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Ready-to-paste resume bullets grounded only in repos that exist in the data",
    },
    resumeTips: { type: "ARRAY", items: { type: "STRING" } },
    projects: {
      type: "ARRAY",
      description: "Exactly 5 project ideas",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          tagline: { type: "STRING" },
          description: { type: "STRING" },
          whyYou: { type: "STRING", description: "Why this project, given this portfolio's specific gaps and strengths" },
          skillsDemonstrated: { type: "ARRAY", items: { type: "STRING" } },
          difficulty: { type: "STRING", enum: ["beginner", "intermediate", "advanced"] },
          suggestedStack: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["name", "tagline", "description", "whyYou", "skillsDemonstrated", "difficulty", "suggestedStack"],
      },
    },
  },
  required: ["headline", "strengths", "resumeBullets", "resumeTips", "projects"],
};

const ROAST_SYSTEM = `You are a stand-up comedian who used to be a staff engineer, doing a lovingly brutal roast of a developer's GitHub portfolio.
Rules:
- Every joke must be grounded in the actual data (real repo names, real numbers, real gaps) — never invent facts. The comedy is in the truth.
- Punch at the work, not the person. No slurs, nothing about identity — think best-friend banter, not cruelty.
- Structure stays useful: the headline is the opening zinger; strengths are backhanded compliments that are still true; resumeBullets stay GENUINELY USABLE (serious, no jokes — they're for a real resume); resumeTips can be snarky but actionable; the 5 projects are real recommendations with roast-flavored "whyYou" lines.
- Keep every list item under 35 words.
Address the developer directly ("you").`;

const SYSTEM = `You are a senior engineering-career coach reviewing a developer's GitHub portfolio.
You receive a structured analysis (languages, commit habits, per-repo quality scores, README findings, detected gaps) and a target role.
Rules:
- Suggest exactly 5 concrete portfolio projects to build next. Each must target a real gap or extend a real strength from the data — never generic filler. Scope each to 1-4 weeks of evening work. Weight suggestions toward the target role.
- Resume bullets must be grounded ONLY in repos that exist in the data (use their real names). Never invent metrics.
- Keep every list item under 30 words. Be encouraging but honest.
Address the developer directly ("you").`;

function buildPrompt(a: Analysis, role: RoleId): string {
  const langs = a.languages.map((l) => `${l.name} ${l.percent}%`).join(", ");
  const repoLines = a.repos
    .map(
      (r) =>
        `- ${r.name}: score ${r.qualityScore}/100, ${r.stars}★, lang=${r.language ?? "n/a"}, desc="${r.description ?? "none"}", ` +
        `demo=${r.homepage ? "yes" : "no"}, readme=${r.readmeScore === null ? "missing" : `${r.readmeScore}/100 (missing: ${r.readmeFindings.join("; ") || "nothing"})`}`,
    )
    .join("\n");
  const gapLines = a.gaps
    .map((g) => `- ${g.title}: ${g.severity === "good" ? "covered" : `GAP — ${g.detail}`}`)
    .join("\n");

  return `Target role: ${role}. Recruiters for this role look for: ${ROLE_EXPECTATIONS[role]}.

GitHub user: ${a.profile.login}${a.profile.name ? ` (${a.profile.name})` : ""}
Bio: ${a.profile.bio ?? "none"} · since ${a.profile.createdAt.slice(0, 10)} · ${a.totals.publicRepos} public repos · ${a.totals.stars} total stars · overall score ${a.overallScore}/100.
Languages by bytes: ${langs || "none detected"}
Commits: ${a.commits.last90Days} in last 90 days (${a.commits.totalSampled} sampled); busiest day ${a.commits.busiestDay ?? "n/a"}; commit-message craft ${a.commits.messageScore ?? "n/a"}/100.
Collaboration: ${a.collab?.mergedPrsElsewhere ?? "?"} merged PRs in others' repos, ${a.collab?.reviewsElsewhere ?? "?"} reviews given. Profile README: ${a.hasProfileReadme ? "yes" : "MISSING"}.

Top repositories:
${repoLines}

Coverage check:
${gapLines}

Produce the suggestions now. Exactly 5 projects.`;
}

export async function POST(req: NextRequest) {
  let analysis: Analysis;
  let role: RoleId = "fullstack";
  let style: "coach" | "roast" = "coach";
  try {
    const body = await req.json();
    analysis = body.analysis as Analysis;
    if (ROLES.some((r) => r.id === body.role)) role = body.role;
    if (body.style === "roast") style = "roast";
    if (!analysis?.profile?.login || !Array.isArray(analysis.repos)) throw new Error("bad shape");
  } catch {
    return NextResponse.json({ error: "Send { analysis, role } as the request body." }, { status: 400 });
  }

  try {
    const result = await generateJson<Omit<Suggestions, "engine">>({
      system: style === "roast" ? ROAST_SYSTEM : SYSTEM,
      prompt: buildPrompt(analysis, role),
      schema: SUGGESTIONS_SCHEMA,
    });
    const suggestions: Suggestions = { ...result, projects: result.projects.slice(0, 5), engine: "gemini" };
    return NextResponse.json(suggestions);
  } catch (e) {
    // Any AI failure degrades to the rule-based engine — the app stays free and never breaks.
    if (e instanceof GeminiError) {
      console.warn(`gemini unavailable (${e.reason}): ${e.message} — using rule-based engine`);
    } else {
      console.error("suggest failed unexpectedly, using rule-based engine", e);
    }
    return NextResponse.json(fallbackSuggestions(analysis, role));
  }
}
