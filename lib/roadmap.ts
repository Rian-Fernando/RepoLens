import type { Analysis, RoadmapItem } from "./types";

/**
 * Turns the analysis into a checklist of fixes, each with the overall-score
 * gain it would produce — computed from the real scoring weights, not vibes.
 *
 * Overall score = avg repo quality × 0.45 + activity(15) + breadth(10) +
 * coverage(15) + collaboration(10) + commit craft(5). Recovering X quality
 * points on one repo lifts the overall score by X / n × 0.45.
 */

const ACTIONS: Array<{
  id: string;
  label: string; // breakdown label in RepoAnalysis.qualityBreakdown
  title: (n: number) => string;
  detail: string;
}> = [
  {
    id: "readme",
    label: "README quality",
    title: (n) => `Fix the README${n > 1 ? `s on ${n} repos` : " on 1 repo"}`,
    detail: "Use the Fix Kit to draft one — pitch, quick-start, screenshot, usage example.",
  },
  {
    id: "demo",
    label: "Live demo / homepage",
    title: (n) => `Deploy ${n > 1 ? `${n} repos` : "1 repo"} and link the demo`,
    detail: "Free tiers (Vercel, Netlify, Fly.io) count. Put the URL in the repo's About field.",
  },
  {
    id: "recency",
    label: "Recent activity",
    title: (n) => `Push fresh commits to ${n} stale repo${n > 1 ? "s" : ""}`,
    detail: "Even docs or dependency bumps count — recency is scored per repo.",
  },
  {
    id: "license",
    label: "License",
    title: (n) => `Add a license to ${n} repo${n > 1 ? "s" : ""}`,
    detail: "GitHub → Add file → Choose a license template. Two minutes each.",
  },
  {
    id: "description",
    label: "Description",
    title: (n) => `Write descriptions for ${n} repo${n > 1 ? "s" : ""}`,
    detail: "One sharp sentence in the About field — it shows up in search and on your profile.",
  },
  {
    id: "topics",
    label: "Topics",
    title: (n) => `Tag ${n} repo${n > 1 ? "s" : ""} with topics`,
    detail: "3-5 topics each (language, domain, framework) — free discoverability.",
  },
];

export function buildRoadmap(a: Analysis): RoadmapItem[] {
  const n = a.repos.length;
  if (n === 0) return [];
  const items: RoadmapItem[] = [];

  for (const action of ACTIONS) {
    let missing = 0;
    const repos: string[] = [];
    for (const repo of a.repos) {
      const parts = repo.qualityBreakdown.filter(
        (p) => p.label === action.label || (action.id === "readme" && p.label === "README present"),
      );
      const lost = parts.reduce((sum, p) => sum + (p.max - p.earned), 0);
      if (lost > 0) {
        missing += lost;
        if (!repos.includes(repo.name)) repos.push(repo.name);
      }
    }
    if (missing > 0) {
      const gain = Math.round((missing / n) * 0.45 * 10) / 10;
      if (gain >= 0.5) {
        items.push({ id: action.id, title: action.title(repos.length), detail: action.detail, gain, repos });
      }
    }
  }

  // Coverage gaps that aren't already implied by a repo-level action above
  const repoActionGapIds = new Set(["license", "readme", "demo"]);
  const gapShare = Math.round((15 / Math.max(1, a.gaps.length)) * 10) / 10;
  for (const gap of a.gaps) {
    if (gap.severity === "good" || repoActionGapIds.has(gap.id)) continue;
    items.push({
      id: `gap-${gap.id}`,
      title: `Close the ${gap.title.toLowerCase()} gap`,
      detail: gap.detail,
      gain: gapShare,
      repos: [],
    });
  }

  return items.sort((x, y) => y.gain - x.gain);
}
