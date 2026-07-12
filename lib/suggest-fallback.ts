import type { Analysis, ProjectIdea, Suggestions } from "./types";
import { ROLE_EXPECTATIONS, type RoleId } from "./roles";

/**
 * Rule-based suggestion engine. Runs when Gemini is unavailable (no key,
 * quota reached, network) so the app always produces a full report for $0.
 * Every output is derived from the actual analysis — no invented facts.
 */

interface Template {
  id: string;
  gap: string; // gap id this project targets
  name: string;
  tagline: string;
  description: string;
  skills: string[];
  difficulty: ProjectIdea["difficulty"];
  stack: (lang: string) => string[];
}

const TEMPLATES: Template[] = [
  {
    id: "deploy",
    gap: "demo",
    name: "Ship-It: deploy your best repo",
    tagline: "Turn your strongest project into a clickable link.",
    description:
      "Take your highest-scoring repo, deploy it (Vercel/Netlify/Fly.io free tiers), add the live URL to the repo's About field, and record a 30-second GIF demo for the README.",
    skills: ["Deployment", "DNS", "CI-friendly builds"],
    difficulty: "beginner",
    stack: (l) => [l, "Vercel or Fly.io", "GitHub Actions"],
  },
  {
    id: "api",
    gap: "backend",
    name: "A real REST API with auth",
    tagline: "Prove you can build the server side, not just call it.",
    description:
      "Design a small but real API — auth (JWT or sessions), a database, input validation, rate limiting, and OpenAPI docs. Seed it with data from a public dataset so the demo is interesting.",
    skills: ["API design", "Auth", "Databases", "Validation"],
    difficulty: "intermediate",
    stack: (l) => (l === "Python" ? ["FastAPI", "PostgreSQL", "Docker"] : ["Node.js", "PostgreSQL", "Docker"]),
  },
  {
    id: "tests",
    gap: "tests",
    name: "Test-harden an existing repo",
    tagline: "The cheapest way to look senior: a green test badge.",
    description:
      "Pick your most-used repo, add a test suite (unit + one integration test), wire it into GitHub Actions, and put the passing badge at the top of the README. Document what the tests protect.",
    skills: ["Unit testing", "Integration testing", "CI"],
    difficulty: "beginner",
    stack: (l) => (l === "Python" ? ["pytest", "GitHub Actions"] : ["Vitest or Jest", "GitHub Actions"]),
  },
  {
    id: "ci",
    gap: "ci",
    name: "Pipeline everything",
    tagline: "One workflow file per repo: lint, test, build, deploy.",
    description:
      "Add a GitHub Actions workflow to your top three repos — lint + test on pull request, deploy on merge. Then write a short post in one README explaining the pipeline. Recruiters notice repeatability.",
    skills: ["CI/CD", "GitHub Actions", "Release discipline"],
    difficulty: "beginner",
    stack: () => ["GitHub Actions", "YAML"],
  },
  {
    id: "docker",
    gap: "docker",
    name: "Containerize your stack",
    tagline: "One `docker compose up` to run your whole project.",
    description:
      "Dockerize an existing app (multi-stage build, small final image) with a compose file for app + database. Add container build to CI and document the image size before/after optimization.",
    skills: ["Docker", "Compose", "Image optimization"],
    difficulty: "intermediate",
    stack: () => ["Docker", "Docker Compose", "GitHub Actions"],
  },
  {
    id: "data",
    gap: "data",
    name: "Applied-AI feature, end to end",
    tagline: "Not a model demo — a product feature that uses one.",
    description:
      "Build a small tool that applies an LLM or classic ML to a real dataset (e.g. summarize/classify data from a public API), with honest evaluation notes and a deployed demo behind a free-tier API.",
    skills: ["LLM/ML integration", "Evaluation", "Prompt or feature engineering"],
    difficulty: "intermediate",
    stack: (l) => [l, "Gemini free tier or scikit-learn", "A public dataset"],
  },
  {
    id: "readme-site",
    gap: "readme",
    name: "Documentation sprint",
    tagline: "Same code, twice the perceived quality.",
    description:
      "Rewrite the READMEs of your top five repos to a fixed template: one-line pitch, screenshot/GIF, quick-start, architecture sketch, and 'what I'd do next'. Measure the before/after RepoLens score.",
    skills: ["Technical writing", "Information design"],
    difficulty: "beginner",
    stack: () => ["Markdown", "A screenshot tool"],
  },
  {
    id: "profile-readme",
    gap: "profile-readme",
    name: "Profile README glow-up",
    tagline: "The most-viewed page on your GitHub is currently blank.",
    description:
      "Create the username/username repo with a README: who you are, what you build, your 3 best projects with links, and your RepoLens badge. Treat it like a landing page, not a bio.",
    skills: ["Personal branding", "Markdown"],
    difficulty: "beginner",
    stack: () => ["Markdown", "shields.io badges"],
  },
  {
    id: "collab",
    gap: "collab",
    name: "First upstream contribution",
    tagline: "One merged PR in a real project outranks ten solo repos.",
    description:
      "Pick a tool you actually use, find a good-first-issue or fix a docs gap you've personally hit, and get one PR merged. Then do it again. Collaboration is the strongest signal recruiters can't fake-check.",
    skills: ["OSS collaboration", "Code review", "Communication"],
    difficulty: "intermediate",
    stack: (l) => [l, "GitHub flow"],
  },
  {
    id: "oss",
    gap: "license",
    name: "Open-source hygiene pass",
    tagline: "Make your repos contributable in an afternoon.",
    description:
      "Add LICENSE, CONTRIBUTING.md, issue templates, and topics to every public repo. Then make one small PR to an upstream project you actually use — external contributions carry outsized weight.",
    skills: ["OSS conventions", "Collaboration"],
    difficulty: "beginner",
    stack: () => ["GitHub", "Markdown"],
  },
];

const ROLE_CAPSTONE: Record<RoleId, Omit<ProjectIdea, "whyYou">> = {
  fullstack: {
    name: "A SaaS-shaped capstone",
    tagline: "One product with auth, billing-shaped flows, and a dashboard.",
    description:
      "Build a small multi-user tool (e.g. a habit tracker or link-in-bio manager): signup/login, a database, a dashboard with charts, and a deployed demo with a seeded guest account.",
    skillsDemonstrated: ["Full-stack architecture", "Auth", "Data modeling", "Deployment"],
    difficulty: "advanced",
    suggestedStack: ["Next.js", "PostgreSQL", "Auth.js", "Vercel"],
  },
  frontend: {
    name: "A component system + showcase",
    tagline: "Design-system thinking beats one more todo app.",
    description:
      "Build 10–15 accessible, themed components with docs and visual tests, then a real page composed from them. Publish the package and use it in one of your existing repos.",
    skillsDemonstrated: ["Accessibility", "Design systems", "Testing", "Packaging"],
    difficulty: "advanced",
    suggestedStack: ["React", "TypeScript", "Storybook", "Playwright"],
  },
  backend: {
    name: "A service under load",
    tagline: "Show you think about what happens at 1,000 req/s.",
    description:
      "Build an API with caching, a queue for slow work, and a load-test report in the README (before/after graphs). Document the bottleneck you found and how you fixed it.",
    skillsDemonstrated: ["Caching", "Queues", "Load testing", "Profiling"],
    difficulty: "advanced",
    suggestedStack: ["Node.js or Go", "Redis", "PostgreSQL", "k6"],
  },
  "data-ml": {
    name: "A dataset-to-dashboard pipeline",
    tagline: "Reproducible beats impressive in data work.",
    description:
      "Ingest a messy public dataset on a schedule, clean and model it, and serve results in a small dashboard. Make the whole pipeline re-runnable with one command and document data quirks honestly.",
    skillsDemonstrated: ["Data engineering", "Modeling", "Reproducibility", "Visualization"],
    difficulty: "advanced",
    suggestedStack: ["Python", "pandas", "scikit-learn", "Streamlit"],
  },
  devops: {
    name: "Infrastructure as a portfolio piece",
    tagline: "Terraform + monitoring for your own projects.",
    description:
      "Define your deployed projects' infrastructure in Terraform, add uptime/error monitoring with a public status page, and write the runbook you'd hand a teammate.",
    skillsDemonstrated: ["IaC", "Monitoring", "Documentation", "Cost awareness"],
    difficulty: "advanced",
    suggestedStack: ["Terraform", "Grafana Cloud free tier", "GitHub Actions"],
  },
};

export function fallbackSuggestions(a: Analysis, role: RoleId): Suggestions {
  const topLang = a.languages[0]?.name ?? "your main language";
  const best = a.repos[0];
  const openGaps = a.gaps.filter((g) => g.severity !== "good");
  const covered = a.gaps.filter((g) => g.severity === "good");

  // 4 gap-driven projects (most severe first) + 1 role capstone
  const ranked = [...openGaps].sort((x, y) => (x.severity === "serious" ? -1 : 1) - (y.severity === "serious" ? -1 : 1));
  const picked: ProjectIdea[] = [];
  for (const gap of ranked) {
    const t = TEMPLATES.find((tpl) => tpl.gap === gap.id);
    if (t && picked.length < 4) {
      picked.push({
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        whyYou: `Targets your "${gap.title}" gap: ${gap.detail}`,
        skillsDemonstrated: t.skills,
        difficulty: t.difficulty,
        suggestedStack: t.stack(topLang),
      });
    }
  }
  // pad from unused templates if fewer than 4 gaps are open
  for (const t of TEMPLATES) {
    if (picked.length >= 4) break;
    if (!picked.some((p) => p.name === t.name)) {
      picked.push({
        name: t.name,
        tagline: t.tagline,
        description: t.description,
        whyYou: `A high-leverage upgrade for a ${topLang}-centric portfolio.`,
        skillsDemonstrated: t.skills,
        difficulty: t.difficulty,
        suggestedStack: t.stack(topLang),
      });
    }
  }
  const capstone = ROLE_CAPSTONE[role];
  picked.push({
    ...capstone,
    whyYou: `The flagship piece for a ${role.replace("-", "/")} portfolio — recruiters for this role look for ${ROLE_EXPECTATIONS[role].split(":")[0]}.`,
  });

  const resumeBullets = a.repos.slice(0, 3).map((r) => {
    const bits = [
      `Built ${r.name}${r.description ? ` — ${r.description.replace(/\.$/, "")}` : ""}`,
      r.language ? `in ${r.language}` : null,
      r.stars > 0 ? `(${r.stars}★ on GitHub)` : null,
      r.homepage ? "with a live deployment" : null,
    ].filter(Boolean);
    return bits.join(" ") + ".";
  });

  return {
    engine: "rules",
    headline:
      a.overallScore >= 70
        ? `Strong foundation, ${a.profile.login} — your ${a.overallScore}/100 puts you ahead of most portfolios; the gaps below are polish, not rebuilds.`
        : a.overallScore >= 40
          ? `Solid raw material, ${a.profile.login} — at ${a.overallScore}/100 your biggest wins are presentation and coverage, not more code.`
          : `Plenty of headroom, ${a.profile.login} — at ${a.overallScore}/100 a focused week of fixes below would transform how this profile reads.`,
    strengths: [
      best ? `${best.name} is your strongest repo (${best.qualityScore}/100) — lead with it everywhere.` : "You have public work to build on.",
      a.commits.last90Days > 0
        ? `${a.commits.last90Days} commits in the last 90 days shows an active profile.`
        : `${a.commits.totalSampled} commits sampled across your top repos.`,
      ...covered.slice(0, 2).map((g) => `${g.title}: ${g.detail}`),
    ],
    resumeBullets,
    resumeTips: [
      "Put links to your 2–3 best repos directly on your resume — recruiters click before they read.",
      ...openGaps.slice(0, 3).map((g) => `${g.title}: ${g.detail}`),
      "Pin your best repositories on your GitHub profile and give each a one-line description + topics.",
    ],
    projects: picked.slice(0, 5),
  };
}
