import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Background from "@/components/Background";
import Logo from "@/components/Logo";
import Nav from "@/components/Nav";
import AuthButton from "@/components/AuthButton";
import FeedexRoute from "@/components/FeedexRoute";
import { PORTFOLIO_URL, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

// The same three faces as rianfernando.com.
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "700"], display: "swap" });

const FEEDEX_KEY = process.env.NEXT_PUBLIC_FEEDEX_KEY;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME}, ${SITE_TAGLINE}`,
  description:
    "Score any public GitHub profile out of 100: repository and README quality, commit habits and collaboration. Then get the fixes, a README badge and five projects worth building next. Free.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Background />
        <header
          className="sticky top-0 z-20 border-b print-hide"
          style={{ borderColor: "var(--border)", background: "var(--page)" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="/" className="shrink-0" aria-label="RepoLens home">
              <Logo />
            </a>
            <div className="order-3 w-full md:order-none md:w-auto md:flex-1 md:flex md:justify-center min-w-0">
              <Nav />
            </div>
            <div className="ml-auto md:ml-0 shrink-0">
              <AuthButton />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
        <Analytics />
        <SpeedInsights />

        <footer className="border-t print-hide" style={{ borderColor: "var(--border)" }}>
          <div
            className="mx-auto max-w-6xl px-4 py-6 flex flex-wrap items-center justify-between gap-3 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <span>
              Built by{" "}
              <a href={PORTFOLIO_URL} className="hover:underline underline-offset-4" style={{ color: "var(--text-secondary)" }}>
                Rian Fernando
              </a>
              {" · "}
              <a
                href="https://github.com/Rian-Fernando/RepoLens"
                className="hover:underline underline-offset-4"
                style={{ color: "var(--text-secondary)" }}
              >
                Source on GitHub
              </a>
            </span>
            <span>
              <a href="/methodology" className="hover:underline underline-offset-4" style={{ color: "var(--text-secondary)" }}>
                How scoring works
              </a>
              {" · "}
              <a href="/privacy" className="hover:underline underline-offset-4" style={{ color: "var(--text-secondary)" }}>
                Privacy
              </a>
            </span>
          </div>
        </footer>

        {/* Feedback widget — renders only when a Feedex project key is configured */}
        {FEEDEX_KEY ? (
          <>
            <Script
              src="https://feedex.rianfernando.com/widget.js"
              data-feedex-key={FEEDEX_KEY}
              strategy="lazyOnload"
            />
            <FeedexRoute />
          </>
        ) : null}
      </body>
    </html>
  );
}
