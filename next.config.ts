import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
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
