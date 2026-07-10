/**
 * Minimal Gemini API client (free tier) — plain REST, no SDK.
 * Docs: https://ai.google.dev/gemini-api/docs — get a free key at https://aistudio.google.com/apikey
 *
 * generateJson() asks for structured output via responseSchema, so responses
 * parse deterministically. Throws GeminiError on any failure; callers decide
 * whether to fall back to the rule-based engine.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// First model that works wins; env override goes first.
const MODEL_CANDIDATES = [
  process.env.GEMINI_MODEL,
  "gemini-flash-latest",
  "gemini-2.5-flash",
].filter((m): m is string => Boolean(m));

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

  let lastError: GeminiError = new GeminiError("No Gemini model candidates", "api");

  for (const model of MODEL_CANDIDATES) {
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
        },
      }),
    });

    if (res.status === 404) {
      // model name not available on this key — try the next candidate
      lastError = new GeminiError(`Model ${model} not found`, "api");
      continue;
    }
    if (res.status === 429) throw new GeminiError("Gemini free-tier quota reached", "quota");
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const body = await res.text();
      throw new GeminiError(`Gemini rejected the request (${res.status}): ${body.slice(0, 200)}`, "bad-key");
    }
    if (!res.ok) {
      lastError = new GeminiError(`Gemini error ${res.status}`, "api");
      continue;
    }

    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new GeminiError("Gemini returned no content", "parse");
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new GeminiError("Gemini returned invalid JSON", "parse");
    }
  }
  throw lastError;
}
