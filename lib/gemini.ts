/**
 * Minimal Gemini API client (free tier): plain REST, no SDK.
 * Docs: https://ai.google.dev/gemini-api/docs. Get a free key at https://aistudio.google.com/apikey
 *
 * generateJson() asks for structured output via responseSchema, so responses
 * parse deterministically. Throws GeminiError when no model gives a usable
 * answer; callers then fall back to the rule-based engine.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Tried in order; the first usable answer wins. "-latest" aliases track Google's current
// models, so they aren't retired out from under the app the way pinned names are.
// Flash-Lite goes first: on the free tier it answers a report-sized request in about two
// seconds, where Flash took from 15 seconds to well over a minute and has a smaller daily
// quota. GEMINI_MODEL, if set, is tried before both.
const MODEL_CANDIDATES = [process.env.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-flash-latest"].filter(
  (m): m is string => Boolean(m),
);

// The AI routes may run for 60 seconds on Vercel. Each attempt gets its own deadline and
// all attempts share one budget, so a slow model can't run the request past that limit.
const ATTEMPT_TIMEOUT_MS = 20_000;
const TOTAL_BUDGET_MS = 45_000;

// Gemini 3 models take thinkingLevel; 2.x models take thinkingBudget (0 turns thinking off).
// Left at its default, Flash thinks for long enough to time the request out.
function thinkingConfig(model: string) {
  return /gemini-2\./.test(model) ? { thinkingBudget: 0 } : { thinkingLevel: "low" };
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public reason: "no-key" | "quota" | "bad-key" | "api" | "parse",
  ) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Schema = Record<string, any>;

export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  schema: Schema;
  maxOutputTokens?: number;
}): Promise<T> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set", "no-key");

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastError: GeminiError = new GeminiError("No Gemini model candidates", "api");

  for (const model of MODEL_CANDIDATES) {
    const remaining = deadline - Date.now();
    if (remaining < 3_000) break;
    const timeout = Math.min(ATTEMPT_TIMEOUT_MS, remaining);

    try {
      const res = await fetch(`${BASE}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: opts.schema,
            maxOutputTokens: opts.maxOutputTokens ?? 8192,
            thinkingConfig: thinkingConfig(model),
          },
        }),
        signal: AbortSignal.timeout(timeout),
      });

      if (res.status === 401 || res.status === 403) {
        const body = await res.text();
        throw new GeminiError(`Gemini rejected the key (${res.status}): ${body.slice(0, 200)}`, "bad-key");
      }
      if (!res.ok) {
        // 404: model not available on this key. 429: that model's quota is used up, but the
        // next one has its own. 400 and 5xx: try the next model too.
        lastError =
          res.status === 429
            ? new GeminiError("Gemini free-tier quota reached", "quota")
            : new GeminiError(`Gemini error ${res.status} from ${model}`, "api");
        continue;
      }

      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = new GeminiError(`${model} returned no content`, "parse");
        continue;
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        lastError = new GeminiError(`${model} returned invalid JSON`, "parse");
      }
    } catch (e) {
      if (e instanceof GeminiError) throw e;
      // timed out, or the connection failed
      lastError = new GeminiError(`${model} didn't answer in ${Math.round(timeout / 1000)}s`, "api");
    }
  }
  throw lastError;
}
