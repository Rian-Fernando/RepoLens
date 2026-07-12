import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getLatestScore } from "@/lib/db";
import { getTier } from "@/lib/tiers";

/** OG card for shared head-to-head links: /api/og/compare?a=<user>&b=<user> */

export const maxDuration = 30;

const VALID = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

function Corner({ login, score }: { login: string; score: number | null }) {
  const tier = score != null ? getTier(score) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, flex: 1 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://github.com/${login}.png?size=160`}
        width="140"
        height="140"
        style={{ borderRadius: 999, border: "4px solid rgba(255,255,255,0.18)" }}
        alt=""
      />
      <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 30, color: "#79b8ff" }}>@{login}</div>
      {score != null && tier ? (
        <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 64, fontWeight: 700, color: tier.hex }}>
          {score}
        </div>
      ) : (
        <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 28, color: "#8b949e" }}>?</div>
      )}
    </div>
  );
}

export async function GET(req: NextRequest) {
  const a = req.nextUrl.searchParams.get("a") ?? "";
  const b = req.nextUrl.searchParams.get("b") ?? "";
  if (!VALID.test(a) || !VALID.test(b)) {
    return new Response("bad params", { status: 400 });
  }

  const [manrope, jetbrains, scoreA, scoreB] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Manrope-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/JetBrainsMono-Bold.ttf")),
    getLatestScore(a),
    getLatestScore(b),
  ]);

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
            "radial-gradient(ellipse 55% 45% at 8% 50%, rgba(121,184,255,0.18), transparent), radial-gradient(ellipse 55% 45% at 92% 50%, rgba(167,139,250,0.18), transparent)",
          padding: 56,
          fontFamily: "Manrope",
          color: "#f0f4fa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <svg width="40" height="40" viewBox="0 0 100 100">
            <circle cx="42" cy="42" r="26" fill="none" stroke="#79b8ff" strokeWidth="5" />
            <line x1="61" y1="61" x2="80" y2="80" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round" />
            <circle cx="32" cy="48" r="3.2" fill="#f0f4fa" />
            <circle cx="44" cy="34" r="3.2" fill="#f0f4fa" />
            <circle cx="52" cy="50" r="3.2" fill="#f0f4fa" />
          </svg>
          <div style={{ display: "flex", fontFamily: "JetBrains Mono", fontSize: 28 }}>repolens · head to head</div>
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 24 }}>
          <Corner login={a} score={scoreA} />
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              backgroundImage: "linear-gradient(135deg, #79b8ff, #a78bfa)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            VS
          </div>
          <Corner login={b} score={scoreB} />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontFamily: "JetBrains Mono",
            fontSize: 20,
            color: "#8b949e",
          }}
        >
          repolens.rianfernando.com/compare · which portfolio wins?
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Manrope", data: manrope, style: "normal", weight: 700 },
        { name: "JetBrains Mono", data: jetbrains, style: "normal", weight: 700 },
      ],
    },
  );
}
