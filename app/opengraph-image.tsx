import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_URL } from "@/lib/site";

/**
 * Site-wide Open Graph card (1200×630 PNG) — used by every route that doesn't
 * define its own (per-user reports have a dynamic score card). Brand: dark
 * #0d1117, blue→violet gradient, lens logo, mono accents.
 */

export const alt = "RepoLens — GitHub portfolio analyzer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FEATURES = ["score /100", "role fit", "fix kit", "5 projects to build"];

export default async function OgImage() {
  const [manrope, jetbrains] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Manrope-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/JetBrainsMono-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d1117",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 12% 0%, rgba(121,184,255,0.20), transparent), radial-gradient(ellipse 55% 45% at 92% 100%, rgba(167,139,250,0.18), transparent)",
          padding: 72,
          fontFamily: "Manrope",
          color: "#f0f4fa",
        }}
      >
        {/* logo lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="0 0 100 100">
            <circle cx="42" cy="42" r="26" fill="none" stroke="#79b8ff" strokeWidth="5" />
            <line x1="61" y1="61" x2="80" y2="80" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" />
            <circle cx="32" cy="48" r="3.2" fill="#f0f4fa" />
            <circle cx="44" cy="34" r="3.2" fill="#f0f4fa" />
            <circle cx="52" cy="50" r="3.2" fill="#f0f4fa" />
            <line x1="32" y1="48" x2="44" y2="34" stroke="#f0f4fa" strokeWidth="2" />
            <line x1="44" y1="34" x2="52" y2="50" stroke="#f0f4fa" strokeWidth="2" />
          </svg>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 40 }}>repolens</div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>
            What does your GitHub
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div
              style={{
                fontSize: 76,
                fontWeight: 700,
                lineHeight: 1.1,
                backgroundImage: "linear-gradient(135deg, #79b8ff, #a78bfa)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              say about you?
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#8b949e", marginTop: 6 }}>
            Score any profile. Find the gaps. Get the fixes. Free forever.
          </div>
        </div>

        {/* feature chips + url */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {FEATURES.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontSize: 18,
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  color: "#b8c0cc",
                }}
              >
                {f}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 20, color: "#79b8ff" }}>
            {SITE_URL.replace("https://", "")}
          </div>
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
