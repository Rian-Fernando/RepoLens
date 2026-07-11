/**
 * Score tiers from the brand handoff: three bands sharing the accents'
 * chroma/lightness formula. Thresholds are a product decision (handoff §4);
 * these match the spec's 80/50 split.
 */
export interface Tier {
  id: "high" | "mid" | "low";
  label: string;
  /** CSS color (oklch) for UI */
  css: string;
  /** hex approximation for SVG badges / OG images */
  hex: string;
}

const TIERS: Tier[] = [
  { id: "high", label: "EXCELLENT", css: "oklch(72% 0.17 145)", hex: "#2eb069" },
  { id: "mid", label: "DEVELOPING", css: "oklch(78% 0.17 95)", hex: "#c9a20e" },
  { id: "low", label: "NEEDS WORK", css: "oklch(68% 0.19 25)", hex: "#e0523f" },
];

export function getTier(score: number): Tier {
  if (score >= 80) return TIERS[0];
  if (score >= 50) return TIERS[1];
  return TIERS[2];
}
