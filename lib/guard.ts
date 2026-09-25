import { createHash } from "node:crypto";
import { hitRateBucket } from "./db";

/**
 * Request-level guards shared by every route that spends a third-party quota.
 * Nothing here stores a raw IP address: visitors are keyed by a salted hash
 * that rotates daily, which is enough to rate-limit and useless for tracking.
 */

export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}

function visitorKey(req: Request): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`repolens|${day}|${clientIp(req)}`).digest("hex").slice(0, 32);
}

/**
 * Returns true when this visitor is over `limit` events in the window.
 * Fails open only when there is no database (local development).
 */
export async function overLimit(req: Request, bucket: string, limit: number, windowMinutes: number): Promise<boolean> {
  const count = await hitRateBucket(bucket, visitorKey(req), windowMinutes);
  return count !== null && count > limit;
}

/**
 * Gemini API Additional Terms: "You may use only Paid Services when making API
 * Clients available to users in the European Economic Area, Switzerland, or
 * the United Kingdom." RepoLens runs on the free tier, so visitors from those
 * places always get the built-in rules engine instead of Gemini.
 */
const PAID_ONLY_COUNTRIES = new Set([
  // EU member states
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // rest of the EEA, plus Switzerland and the UK
  "IS", "LI", "NO", "CH", "GB",
]);

export function geminiAllowedFor(req: Request): boolean {
  const country = req.headers.get("x-vercel-ip-country")?.toUpperCase();
  // On Vercel the header is always set; if it is ever missing there, fail closed.
  if (!country) return !process.env.VERCEL;
  return !PAID_ONLY_COUNTRIES.has(country);
}
