export const SITE_NAME = "RepoLens";
export const SITE_TAGLINE = "GitHub portfolio analyzer";

/** Canonical production origin — used for sitemap, robots, canonicals, and OG URLs. */
export const SITE_URL = "https://repolens.rianfernando.com";

/** The parent portfolio this app links back to (and lives under, as repolens.rianfernando.com). */
export const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://rianfernando.com";
export const PORTFOLIO_LABEL = "rianfernando.com";
