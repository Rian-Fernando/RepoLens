import type { Metadata } from "next";
import CompareView from "@/components/CompareView";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Compare — ${SITE_NAME}`,
  description: "Head-to-head GitHub portfolio comparison: scores, stars, activity, and quality.",
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a = "", b = "" } = await searchParams;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="text-center mb-8 reveal">
        <h1 className="text-3xl font-semibold tracking-tight text-glow">Head to head</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          Two profiles enter. Seven categories. Best portfolio wins.
        </p>
      </div>
      <CompareView initialA={a} initialB={b} />
    </div>
  );
}
