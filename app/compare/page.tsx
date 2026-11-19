import type { Metadata } from "next";
import CompareView from "@/components/CompareView";
import { SITE_NAME } from "@/lib/site";

const VALID = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}): Promise<Metadata> {
  const { a = "", b = "" } = await searchParams;
  const battle = VALID.test(a) && VALID.test(b);
  return {
    title: battle
      ? `@${a} vs @${b} — GitHub portfolio comparison`
      : `Compare two GitHub profiles head-to-head — ${SITE_NAME}`,
    description:
      "Compare two GitHub profiles side by side: portfolio score, stars, repository count, recent commits, average repository quality and README coverage. Free, no sign-up.",
    alternates: { canonical: "/compare" },
    ...(battle
      ? {
          openGraph: { images: [`/api/og/compare?a=${a}&b=${b}`] },
          twitter: { card: "summary_large_image", images: [`/api/og/compare?a=${a}&b=${b}`] },
        }
      : {}),
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a = "", b = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-5xl sm:text-6xl">Compare two profiles</h1>
        <p className="mt-4 text-lg leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          Put two GitHub profiles side by side across seven categories, from the overall score to how many READMEs
          actually do their job.
        </p>
      </div>
      <CompareView initialA={a} initialB={b} />
    </div>
  );
}
