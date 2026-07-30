import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Search + AI answer engines are both welcome. The major AI crawlers are
 * named explicitly so there is no ambiguity about consent to read and cite
 * this site; only private/API routes are disallowed.
 */

const AI_CRAWLERS = [
  "GPTBot", // OpenAI training/indexing
  "OAI-SearchBot", // ChatGPT search index
  "ChatGPT-User", // ChatGPT live browsing
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended", // Gemini / AI Overviews grounding
  "Applebot-Extended",
  "CCBot", // Common Crawl — feeds many models
  "Amazonbot",
  "Bytespider",
  "cohere-ai",
];

const DISALLOW = ["/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
