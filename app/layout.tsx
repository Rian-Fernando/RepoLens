import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Background from "@/components/Background";
import Logo from "@/components/Logo";
import { PORTFOLIO_LABEL, PORTFOLIO_URL, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

const display = Manrope({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description:
    "Score any GitHub profile — languages, commit habits, repo and README quality — get role-targeted fixes, a README badge, CI checks, and the 5 projects to build next. Free forever.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Background />
        <header
          className="sticky top-0 z-20 border-b backdrop-blur-md print-hide"
          style={{ borderColor: "var(--border)", background: "rgba(13,17,23,0.72)" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
            <a href="/" className="shrink-0 transition-opacity hover:opacity-80">
              <Logo />
            </a>
            <nav className="flex items-center gap-5 text-sm">
              <a href="/" className="hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
                Analyze
              </a>
              <a href="/compare" className="hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
                Compare
              </a>
              <a href="/leaderboard" className="hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
                Leaderboard
              </a>
              <a href="/action" className="hover:text-white transition-colors" style={{ color: "var(--text-secondary)" }}>
                CI Action
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t print-hide" style={{ borderColor: "var(--border)" }}>
          <div
            className="mx-auto max-w-6xl px-4 py-5 flex flex-wrap items-center justify-between gap-2 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="font-mono-accent text-xs">
              crafted by{" "}
              <a href={PORTFOLIO_URL} className="hover:underline underline-offset-4" style={{ color: "var(--text-secondary)" }}>
                Rian Fernando ✦ {PORTFOLIO_LABEL}
              </a>
            </span>
            <span className="font-mono-accent text-xs">github api ✦ next.js ✦ three.js ✦ gemini free tier</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
