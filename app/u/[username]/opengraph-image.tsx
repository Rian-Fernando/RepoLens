import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { collect } from "@/lib/github";
import { analyze } from "@/lib/analyze";
import { getTier } from "@/lib/tiers";
import { estimatePercentile } from "@/lib/percentile";

/**
 * Dynamic Open Graph card for /u/<username> — when a report link is pasted
 * into LinkedIn/Discord/X, it unfurls as a branded score card instead of a
 * bare link. Brand: dark #0d1117, blue→violet gradient, mono score figure.
 */

export const alt = "RepoLens portfolio score card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 21600; // 6h, matches the score API cache

const CHIP = "rgba(255,255,255,0.08)";

export default async function OgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [manrope, jetbrains] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Manrope-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/JetBrainsMono-Bold.ttf")),
  ]);

  let data: {
    login: string;
    name: string | null;
    avatar: string;
    score: number;
    percentile: number;
    langs: string[];
    repos: number;
    stars: number;
  } | null = null;

  try {
    const collected = await collect(username, process.env.GITHUB_TOKEN?.trim() || undefined);
    const a = analyze(collected);
    data = {
      login: a.profile.login,
      name: a.profile.name,
      avatar: a.profile.avatarUrl,
      score: a.overallScore,
      percentile: estimatePercentile(a.overallScore),
      langs: a.languages.filter((l) => l.name !== "Other").slice(0, 4).map((l) => l.name),
      repos: a.totals.publicRepos,
      stars: a.totals.stars,
    };
  } catch {
    // fall through to the generic card
  }

  const tier = data ? getTier(data.score) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0d1117",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 15% 0%, rgba(121,184,255,0.18), transparent), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(167,139,250,0.16), transparent)",
          padding: 64,
          fontFamily: "Manrope",
          color: "#f0f4fa",
        }}
      >
        {/* header: logo lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 100 100">
            <circle cx="42" cy="42" r="26" fill="none" stroke="#79b8ff" strokeWidth="5" />
            <line x1="61" y1="61" x2="80" y2="80" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" />
            <circle cx="32" cy="48" r="3.2" fill="#f0f4fa" />
            <circle cx="44" cy="34" r="3.2" fill="#f0f4fa" />
            <circle cx="52" cy="50" r="3.2" fill="#f0f4fa" />
            <line x1="32" y1="48" x2="44" y2="34" stroke="#f0f4fa" strokeWidth="2" />
            <line x1="44" y1="34" x2="52" y2="50" stroke="#f0f4fa" strokeWidth="2" />
          </svg>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 34 }}>repolens</div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              fontFamily: "JetBrains Mono",
              fontSize: 20,
              color: "#8b949e",
            }}
          >
            github portfolio analyzer
          </div>
        </div>

        {data && tier ? (
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56, marginTop: 24 }}>
            {/* left: identity + langs */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.avatar}
                  width="96"
                  height="96"
                  style={{ borderRadius: 999, border: "3px solid rgba(255,255,255,0.2)" }}
                  alt=""
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{data.name ?? data.login}</div>
                  <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 26, color: "#79b8ff" }}>
                    @{data.login}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {data.langs.map((lang) => (
                  <div
                    key={lang}
                    style={{
                      display: "flex",
                      fontFamily: "JetBrains Mono",
                      fontSize: 20,
                      padding: "8px 18px",
                      borderRadius: 999,
                      background: CHIP,
                    }}
                  >
                    {lang}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 22, color: "#8b949e" }}>
                {data.repos} repos · {data.stars.toLocaleString()} stars · better than ~{data.percentile}% (est.)
              </div>
            </div>

            {/* right: score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  fontFamily: "JetBrains Mono",
                }}
              >
                <div style={{ display: "flex", fontSize: 148, fontWeight: 700, color: tier.hex }}>{data.score}</div>
                <div style={{ display: "flex", fontSize: 40, color: "#8b949e" }}>/100</div>
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontSize: 22,
                  letterSpacing: 4,
                  padding: "10px 26px",
                  borderRadius: 999,
                  border: `2px solid ${tier.hex}`,
                  color: tier.hex,
                }}
              >
                {tier.label}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", fontSize: 54, fontWeight: 700 }}>
              What does @{username}&apos;s GitHub say?
            </div>
          </div>
        )}

        {/* footer */}
        <div
          style={{
            display: "flex",
            fontFamily: "JetBrains Mono",
            fontSize: 20,
            color: "#8b949e",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex" }}>repolens.rianfernando.com/u/{username}</div>
          <div style={{ display: "flex" }}>free · score yours</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Manrope", data: manrope, style: "normal", weight: 700 },
        { name: "JetBrains Mono", data: jetbrains, style: "normal", weight: 700 },
      ],
    },
  );
}
