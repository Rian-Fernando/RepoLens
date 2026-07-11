import type { Metadata } from "next";
import Analyzer from "@/components/Analyzer";
import { PORTFOLIO_URL, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description:
    "Score any GitHub profile — languages, commit habits, repo and README quality — get role-targeted fixes, a README badge, CI checks, and the 5 projects to build next. Free forever.",
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  author: {
    "@type": "Person",
    name: "Rian Fernando",
    url: PORTFOLIO_URL,
  },
};

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <Analyzer />
    </div>
  );
}
