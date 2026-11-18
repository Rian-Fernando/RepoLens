import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG image routes read their fonts from disk. Next's file tracer follows
  // those reads in regular route handlers but not in metadata image routes, so
  // the dynamic per-user card shipped without its fonts (ENOENT on Vercel).
  outputFileTracingIncludes: {
    "/u/*/opengraph-image": ["./assets/fonts/**/*"],
    "/opengraph-image": ["./assets/fonts/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    const base = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    ];
    return [
      // Everything may not be framed by other sites (clickjacking)…
      {
        source: "/:path((?!api/embed/).*)",
        headers: [...base, { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }, { key: "X-Frame-Options", value: "DENY" }],
      },
      // …except the score widget, which exists to be embedded.
      { source: "/api/embed/:path*", headers: base },
    ];
  },
  async redirects() {
    // Production only: send *.vercel.app hosts to the canonical domain so
    // search engines never index the duplicate. Preview builds (VERCEL_ENV
    // = "preview") skip this, keeping preview deployments browsable.
    if (process.env.VERCEL_ENV !== "production") return [];
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*\\.vercel\\.app)" }],
        destination: "https://repolens.rianfernando.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
