import type {
  Analysis,
  CommitHabits,
  GapItem,
  LanguageSlice,
  RepoAnalysis,
  RepoScoreDetail,
} from "./types";
import type { Collected, CollectedRepo } from "./github";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// ---------- languages ----------

function aggregateLanguages(deepDive: CollectedRepo[]): LanguageSlice[] {
  const totals = new Map<string, number>();
  for (const { languages } of deepDive) {
    for (const [lang, bytes] of Object.entries(languages)) {
      totals.set(lang, (totals.get(lang) ?? 0) + bytes);
    }
  }
  const grand = [...totals.values()].reduce((a, b) => a + b, 0);
  if (grand === 0) return [];

  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  // Donut cap: at most 6 named slices; the tail folds into "Other".
  const named = sorted.slice(0, 6);
  const otherBytes = sorted.slice(6).reduce((a, [, b]) => a + b, 0);

  const slices: LanguageSlice[] = named.map(([name, bytes]) => ({
    name,
    bytes,
    percent: Math.round((bytes / grand) * 1000) / 10,
  }));
  if (otherBytes > 0) {
    slices.push({
      name: "Other",
      bytes: otherBytes,
      percent: Math.round((otherBytes / grand) * 1000) / 10,
    });
  }
  return slices;
}

// ---------- commit habits ----------

function commitHabits(deepDive: CollectedRepo[]): CommitHabits {
  const byDay = new Array<number>(7).fill(0);
  const byDayHour: number[][] = Array.from({ length: 7 }, () => new Array<number>(24).fill(0));
  let total = 0;
  let last90 = 0;
  let latest: string | null = null;
  const cutoff = Date.now() - NINETY_DAYS_MS;

  for (const { commitDates } of deepDive) {
    for (const iso of commitDates) {
      const t = Date.parse(iso);
      if (Number.isNaN(t)) continue;
      const d = new Date(t);
      const day = d.getUTCDay();
      const hour = d.getUTCHours();
      byDay[day]++;
      byDayHour[day][hour]++;
      total++;
      if (t >= cutoff) last90++;
      if (!latest || t > Date.parse(latest)) latest = iso;
    }
  }

  let busiestDay: string | null = null;
  if (total > 0) {
    const maxDay = byDay.indexOf(Math.max(...byDay));
    busiestDay = DAY_NAMES[maxDay];
  }
  let busiestHourUtc: number | null = null;
  if (total > 0) {
    const byHour = new Array<number>(24).fill(0);
    for (const row of byDayHour) row.forEach((v, h) => (byHour[h] += v));
    busiestHourUtc = byHour.indexOf(Math.max(...byHour));
  }

  return { totalSampled: total, byDay, byDayHour, last90Days: last90, lastCommitAt: latest, busiestDay, busiestHourUtc };
}

// ---------- README scoring ----------

function scoreReadme(readme: string): { score: number; findings: string[] } {
  const text = readme.toLowerCase();
  const findings: string[] = [];
  let score = 0;

  if (readme.length >= 300) score += 15;
  else findings.push("very short (under 300 characters)");
  if (readme.length >= 1500) score += 10;

  if (/^#{1,3}\s/m.test(readme) && (readme.match(/^#{1,6}\s/gm) ?? []).length >= 2) score += 15;
  else findings.push("no section headings");

  if (readme.includes("```")) score += 15;
  else findings.push("no code examples");

  if (/!\[[^\]]*\]\(/.test(readme) || /<img\s/i.test(readme)) score += 15;
  else findings.push("no screenshots or badges");

  if (/(install|installation|getting started|setup|usage|quick start|how to run)/.test(text)) score += 20;
  else findings.push("no install/usage instructions");

  if (/(license|contributing|features|roadmap)/.test(text)) score += 10;
  else findings.push("no license/features/contributing section");

  return { score: Math.min(100, score), findings };
}

// ---------- repo quality scoring ----------

function scoreRepo(item: CollectedRepo): RepoAnalysis {
  const { repo, readme } = item;
  const parts: RepoScoreDetail[] = [];
  const add = (label: string, earned: number, max: number) =>
    parts.push({ label, earned: Math.round(earned), max });

  add("Description", repo.description && repo.description.trim().length >= 20 ? 10 : repo.description ? 5 : 0, 10);
  add("Topics", (repo.topics?.length ?? 0) >= 2 ? 10 : (repo.topics?.length ?? 0) === 1 ? 5 : 0, 10);
  add("License", repo.license ? 10 : 0, 10);
  add("Live demo / homepage", repo.homepage ? 10 : 0, 10);

  const monthsSincePush = (Date.now() - Date.parse(repo.pushed_at)) / (30 * 24 * 60 * 60 * 1000);
  add("Recent activity", monthsSincePush <= 3 ? 15 : monthsSincePush <= 12 ? 8 : 0, 15);

  const stars = repo.stargazers_count;
  add("Community (stars)", stars >= 20 ? 10 : stars >= 5 ? 7 : stars >= 1 ? 4 : 0, 10);

  let readmeScore: number | null = null;
  let readmeFindings: string[] = [];
  if (readme) {
    const scored = scoreReadme(readme);
    readmeScore = scored.score;
    readmeFindings = scored.findings;
    add("README present", 10, 10);
    add("README quality", (scored.score / 100) * 25, 25);
  } else {
    readmeFindings = ["no README at all"];
    add("README present", 0, 10);
    add("README quality", 0, 25);
  }

  const qualityScore = Math.round(parts.reduce((a, p) => a + p.earned, 0));

  return {
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    stars,
    pushedAt: repo.pushed_at,
    language: repo.language,
    topics: repo.topics ?? [],
    homepage: repo.homepage,
    hasLicense: Boolean(repo.license),
    qualityScore,
    qualityBreakdown: parts,
    readmeScore,
    readmeFindings,
  };
}

// ---------- gap detection ----------

function detectGaps(collected: Collected, repos: RepoAnalysis[]): GapItem[] {
  const gaps: GapItem[] = [];
  const haystack = collected.deepDive
    .map(
      (d) =>
        `${d.repo.name} ${d.repo.description ?? ""} ${(d.repo.topics ?? []).join(" ")} ${d.readme ?? ""}`,
    )
    .join("\n")
    .toLowerCase();
  const langs = new Set(
    collected.deepDive.flatMap((d) => Object.keys(d.languages).map((l) => l.toLowerCase())),
  );

  const push = (id: string, ok: boolean, title: string, okDetail: string, missDetail: string, severity: GapItem["severity"] = "warning") =>
    gaps.push({ id, title, detail: ok ? okDetail : missDetail, severity: ok ? "good" : severity });

  push(
    "tests",
    /(jest|vitest|pytest|unittest|mocha|junit|rspec|testing|test suite|unit test|integration test|coverage)/.test(haystack),
    "Testing",
    "At least one project mentions automated tests.",
    "No project mentions automated tests — a tested project is a strong hiring signal.",
    "serious",
  );
  push(
    "ci",
    /(github actions|workflow|ci\/cd|continuous integration|travis|circleci|\.github\/workflows)/.test(haystack),
    "CI/CD",
    "Continuous integration shows up in your projects.",
    "No CI/CD detected — a simple GitHub Actions workflow shows engineering maturity.",
  );
  push(
    "demo",
    repos.some((r) => Boolean(r.homepage)),
    "Deployed demos",
    "At least one repo links to a live demo.",
    "No repo links to a live deployment — recruiters click links before they read code.",
    "serious",
  );
  push(
    "readme",
    repos.length > 0 && repos.filter((r) => (r.readmeScore ?? 0) >= 50).length >= Math.ceil(repos.length / 2),
    "Documentation",
    "Most analyzed repos have solid READMEs.",
    "Half or more of your top repos have weak or missing READMEs.",
  );
  push(
    "backend",
    /(api|rest|graphql|server|backend|express|fastapi|django|flask|spring)/.test(haystack) ||
      ["go", "java", "ruby", "php", "c#"].some((l) => langs.has(l)),
    "Backend / API work",
    "Backend or API work is visible.",
    "No clear backend/API project — pair one with your frontend work.",
  );
  push(
    "docker",
    /(docker|container|kubernetes|dockerfile|compose)/.test(haystack),
    "Containers / DevOps",
    "Container or DevOps experience is visible.",
    "No Docker/containerization visible — even one Dockerfile broadens your profile.",
  );
  push(
    "data",
    /(machine learning|data analysis|pandas|numpy|tensorflow|pytorch|scikit|llm|dataset|model)/.test(haystack) ||
      langs.has("jupyter notebook"),
    "Data / AI",
    "Data or AI work is visible.",
    "No data/AI project detected — a small applied-AI project rounds out a modern portfolio.",
  );
  push(
    "license",
    repos.some((r) => r.hasLicense),
    "Open-source hygiene",
    "At least one repo carries a license.",
    "None of your top repos has a license — adding one is a five-minute win.",
  );

  return gaps;
}

// ---------- overall score ----------

function overall(repos: RepoAnalysis[], commits: CommitHabits, languages: LanguageSlice[], gaps: GapItem[]): { score: number; parts: RepoScoreDetail[] } {
  const parts: RepoScoreDetail[] = [];
  const avgQuality =
    repos.length > 0 ? repos.reduce((a, r) => a + r.qualityScore, 0) / repos.length : 0;
  parts.push({ label: "Repo quality (avg)", earned: Math.round((avgQuality / 100) * 50), max: 50 });

  const activity = Math.min(1, commits.last90Days / 60);
  parts.push({ label: "Recent activity", earned: Math.round(activity * 20), max: 20 });

  const breadth = Math.min(1, languages.filter((l) => l.name !== "Other").length / 4);
  parts.push({ label: "Language breadth", earned: Math.round(breadth * 10), max: 10 });

  const covered = gaps.filter((g) => g.severity === "good").length;
  parts.push({ label: "Portfolio coverage", earned: Math.round((covered / Math.max(1, gaps.length)) * 20), max: 20 });

  return { score: parts.reduce((a, p) => a + p.earned, 0), parts };
}

// ---------- entry point ----------

export function analyze(collected: Collected): Analysis {
  const repos = collected.deepDive.map(scoreRepo).sort((a, b) => b.qualityScore - a.qualityScore);
  const languages = aggregateLanguages(collected.deepDive);
  const commits = commitHabits(collected.deepDive);
  const gaps = detectGaps(collected, repos);
  const { score, parts } = overall(repos, commits, languages, gaps);

  return {
    profile: {
      login: collected.user.login,
      name: collected.user.name,
      avatarUrl: collected.user.avatar_url,
      bio: collected.user.bio,
      followers: collected.user.followers,
      publicRepos: collected.user.public_repos,
      createdAt: collected.user.created_at,
      htmlUrl: collected.user.html_url,
    },
    totals: {
      publicRepos: collected.allRepos.length,
      forks: collected.allRepos.filter((r) => r.fork).length,
      stars: collected.allRepos.reduce((a, r) => a + r.stargazers_count, 0),
      analyzed: collected.deepDive.length,
    },
    languages,
    commits,
    repos,
    gaps,
    overallScore: score,
    scoreParts: parts,
  };
}
