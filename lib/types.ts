export interface ProfileSummary {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  publicRepos: number;
  createdAt: string;
  htmlUrl: string;
}

export interface LanguageSlice {
  name: string;
  bytes: number;
  percent: number; // 0-100, one decimal
}

export interface CommitHabits {
  totalSampled: number;
  byDay: number[]; // length 7, Sun..Sat (UTC)
  byDayHour: number[][]; // 7 x 24 (UTC)
  last90Days: number;
  lastCommitAt: string | null;
  busiestDay: string | null;
  busiestHourUtc: number | null;
}

export interface RepoScoreDetail {
  label: string;
  earned: number;
  max: number;
}

export interface RepoAnalysis {
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  stars: number;
  pushedAt: string;
  language: string | null;
  topics: string[];
  homepage: string | null;
  hasLicense: boolean;
  qualityScore: number; // 0-100
  qualityBreakdown: RepoScoreDetail[];
  readmeScore: number | null; // 0-100; null = no README found
  readmeFindings: string[]; // what the README is missing
}

export type GapSeverity = "good" | "warning" | "serious";

export interface GapItem {
  id: string;
  title: string;
  detail: string;
  severity: GapSeverity;
}

export interface Bench {
  percentile: number | null;
  sample: number;
  history: Array<{ date: string; score: number }>;
}

export interface Analysis {
  /** Real benchmarking data when the score DB is configured; null otherwise. */
  bench?: Bench | null;
  profile: ProfileSummary;
  totals: {
    publicRepos: number;
    forks: number;
    stars: number;
    analyzed: number;
  };
  languages: LanguageSlice[];
  commits: CommitHabits;
  repos: RepoAnalysis[];
  gaps: GapItem[];
  overallScore: number; // 0-100
  scoreParts: RepoScoreDetail[];
}

export interface ProjectIdea {
  name: string;
  tagline: string;
  description: string;
  whyYou: string;
  skillsDemonstrated: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  suggestedStack: string[];
}

export interface Suggestions {
  headline: string;
  strengths: string[];
  resumeBullets: string[];
  resumeTips: string[];
  projects: ProjectIdea[];
  /** "gemini" = real AI; "rules" = built-in heuristic engine (no key / quota hit) */
  engine: "gemini" | "rules";
}

export interface RoadmapItem {
  id: string;
  title: string;
  detail: string;
  gain: number; // expected overall-score gain, one decimal
  repos: string[]; // affected repo names, empty = profile-wide
}

