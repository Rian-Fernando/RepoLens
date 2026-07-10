/**
 * Estimated percentile for an overall score.
 *
 * Until a real database of analyzed profiles accumulates (phase-2 roadmap:
 * record anonymized scores in Postgres and compute true percentiles), this
 * uses a logistic curve calibrated against the scoring weights: a typical
 * casual profile lands in the 20s-30s (few READMEs, no demos, no CI), a
 * deliberate portfolio in the 50s-60s, and 70+ requires broad coverage.
 * Always label the output as estimated.
 */
export function estimatePercentile(score: number): number {
  const p = 1 / (1 + Math.exp(-(score - 38) / 13));
  return Math.min(99, Math.max(1, Math.round(p * 100)));
}
