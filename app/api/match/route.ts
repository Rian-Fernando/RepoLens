import { NextRequest, NextResponse } from "next/server";
import type { Analysis } from "@/lib/types";
import { generateJson, GeminiError } from "@/lib/gemini";

export const maxDuration = 60;

/**
 * Job-post matcher: map a pasted job description against the evidence in an
 * analyzed portfolio. Gemini does the real mapping; a keyword engine covers
 * the no-key / quota case so the page always answers.
 */

export interface MatchResult {
  readiness: number; // 0-100
  verdict: string;
  requirements: Array<{
    requirement: string;
    status: "evidenced" | "partial" | "missing";
    evidence: string; // repo names / signals, or "" when missing
    action: string; // what to do about it
  }>;
  engine: "gemini" | "rules";
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    readiness: { type: "INTEGER", description: "0-100 readiness for this specific job" },
    verdict: { type: "STRING", description: "Two-sentence honest verdict, addressed to the candidate" },
    requirements: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          requirement: { type: "STRING", description: "One requirement extracted from the job post" },
          status: { type: "STRING", enum: ["evidenced", "partial", "missing"] },
          evidence: { type: "STRING", description: "Which repos/signals prove it; empty string if missing" },
          action: { type: "STRING", description: "Concrete step to strengthen or close this requirement" },
        },
        required: ["requirement", "status", "evidence", "action"],
      },
    },
  },
  required: ["readiness", "verdict", "requirements"],
};

const SYSTEM = `You map job-post requirements to concrete evidence in a developer's GitHub portfolio.
Rules:
- Extract 6-12 real requirements from the job post (skills, technologies, practices — skip fluff like "team player").
- For each, judge status strictly from the portfolio data: "evidenced" needs a specific repo or signal; "partial" means adjacent evidence; "missing" means none.
- Evidence must cite actual repo names or measured signals from the data. Never invent.
- Actions must be concrete and small ("add integration tests to X", not "learn testing").
- Readiness weighs must-have requirements over nice-to-haves. Be honest — a 40 that's true beats a 75 that isn't.`;

const KNOWN_TECH = [
  "javascript", "typescript", "python", "java", "go", "rust", "c#", "c++", "ruby", "php", "swift", "kotlin",
  "react", "next.js", "nextjs", "vue", "angular", "svelte", "node", "node.js", "express", "django", "flask",
  "fastapi", "spring", "rails", "graphql", "rest", "postgresql", "postgres", "mysql", "mongodb", "redis",
  "docker", "kubernetes", "terraform", "aws", "gcp", "azure", "ci/cd", "github actions", "git", "linux",
  "testing", "jest", "pytest", "playwright", "machine learning", "pytorch", "tensorflow", "pandas", "sql",
  "html", "css", "tailwind", "sass", "webpack", "vite", "microservices", "kafka", "elasticsearch",
];

function fallbackMatch(a: Analysis, jd: string): MatchResult {
  const jdLower = jd.toLowerCase();
  const haystack = [
    ...a.languages.map((l) => l.name),
    ...a.repos.flatMap((r) => [r.name, r.description ?? "", r.language ?? "", ...r.topics]),
  ]
    .join(" ")
    .toLowerCase();

  const found = KNOWN_TECH.filter((t) => jdLower.includes(t));
  const requirements = found.slice(0, 12).map((tech) => {
    const evidenced = haystack.includes(tech.replace(".js", "").replace("js", tech.length <= 3 ? tech : ""));
    const hit = haystack.includes(tech) || evidenced;
    const repos = a.repos
      .filter((r) => `${r.name} ${r.description ?? ""} ${r.language ?? ""} ${r.topics.join(" ")}`.toLowerCase().includes(tech))
      .slice(0, 2)
      .map((r) => r.name);
    return {
      requirement: tech,
      status: (hit ? (repos.length > 0 ? "evidenced" : "partial") : "missing") as "evidenced" | "partial" | "missing",
      evidence: repos.join(", "),
      action: hit
        ? `Make ${repos[0] ?? "a relevant repo"} more prominent — pin it and name ${tech} in its description.`
        : `Add a small project (or extend an existing one) that uses ${tech}, with a README section naming it.`,
    };
  });
  const evidencedCount = requirements.filter((r) => r.status !== "missing").length;
  const readiness = requirements.length ? Math.round((evidencedCount / requirements.length) * 100) : 0;
  return {
    readiness,
    verdict:
      requirements.length === 0
        ? "Couldn't extract recognizable tech requirements from this posting — try pasting the full description."
        : `Keyword match: your portfolio shows evidence for ${evidencedCount} of ${requirements.length} recognizable requirements. Add a free GEMINI_API_KEY for a deeper AI reading.`,
    requirements,
    engine: "rules",
  };
}

export async function POST(req: NextRequest) {
  let analysis: Analysis;
  let jd: string;
  try {
    const body = await req.json();
    analysis = body.analysis as Analysis;
    jd = String(body.jd ?? "").slice(0, 12_000);
    if (!analysis?.profile?.login || !Array.isArray(analysis.repos) || jd.trim().length < 80) {
      throw new Error("bad shape");
    }
  } catch {
    return NextResponse.json(
      { error: "Send { analysis, jd } — the job description needs at least a paragraph." },
      { status: 400 },
    );
  }

  const portfolio = `Candidate: ${analysis.profile.login} — overall ${analysis.overallScore}/100.
Languages: ${analysis.languages.map((l) => `${l.name} ${l.percent}%`).join(", ") || "n/a"}
Collaboration: ${analysis.collab?.mergedPrsElsewhere ?? "?"} merged PRs elsewhere, ${analysis.collab?.reviewsElsewhere ?? "?"} reviews.
Activity: ${analysis.commits.last90Days} commits/90d; message craft ${analysis.commits.messageScore ?? "n/a"}/100.
Repos:
${analysis.repos.map((r) => `- ${r.name} (${r.language ?? "n/a"}): "${r.description ?? "no description"}" topics=[${r.topics.join(",")}] demo=${r.homepage ? "yes" : "no"} readme=${r.readmeScore ?? "none"}/100`).join("\n")}
Coverage: ${analysis.gaps.map((g) => `${g.title}=${g.severity === "good" ? "ok" : "gap"}`).join(", ")}`;

  try {
    const result = await generateJson<Omit<MatchResult, "engine">>({
      system: SYSTEM,
      prompt: `JOB POST:\n${jd}\n\nPORTFOLIO DATA:\n${portfolio}\n\nMap the requirements now.`,
      schema: SCHEMA,
    });
    return NextResponse.json({ ...result, engine: "gemini" } satisfies MatchResult);
  } catch (e) {
    if (e instanceof GeminiError) {
      console.warn(`gemini unavailable for match (${e.reason}) — keyword fallback`);
    } else {
      console.error("match failed, keyword fallback", e);
    }
    return NextResponse.json(fallbackMatch(analysis, jd));
  }
}
