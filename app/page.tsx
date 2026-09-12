import type { Metadata } from "next";
import Analyzer from "@/components/Analyzer";
import HomeContent from "@/components/HomeContent";
import PausedNotice from "@/components/PausedNotice";
import { FAQS } from "@/lib/faq";
import { PORTFOLIO_URL, SITE_NAME, SITE_URL } from "@/lib/site";

const DESCRIPTION =
  "RepoLens scores any public GitHub profile out of 100 on how it reads to recruiters — repository quality, README quality, commit habits, and collaboration — then generates the fixes and the five projects to build next. Free, no sign-up.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — score your GitHub profile out of 100, free`,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: `${SITE_NAME} — GitHub portfolio analyzer`, description: DESCRIPTION },
};

const APP_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  alternateName: "RepoLens GitHub portfolio analyzer",
  description: DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "GitHub profile scoring out of 100",
    "Repository and README quality analysis",
    "Commit habit visualization",
    "Role-targeted improvement roadmap",
    "AI-drafted README, license and CI fixes as pull requests",
    "Job description to portfolio matching",
    "Profile comparison and leaderboard",
  ],
  author: {
    "@type": "Person",
    name: "Rian Fernando",
    url: PORTFOLIO_URL,
  },
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function Home() {
  return (
    <div id="top" className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(APP_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <PausedNotice />
      <Analyzer />
      <HomeContent />
    </div>
  );
}
