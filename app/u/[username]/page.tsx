import type { Metadata } from "next";
import Analyzer from "@/components/Analyzer";
import PausedNotice from "@/components/PausedNotice";
import { SITE_NAME } from "@/lib/site";

/** Shareable report: /u/<username> auto-runs the analysis for that user. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const description = `RepoLens portfolio report for GitHub user ${username}: a 0-100 score covering repository quality, README quality, commit habits, language breadth and open-source collaboration, plus the specific fixes and five projects that would improve it.`;
  return {
    title: `${username}'s GitHub portfolio score — ${SITE_NAME}`,
    description,
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `/u/${username}` },
    openGraph: { title: `${username}'s GitHub portfolio score`, description },
  };
}

export default async function UserReport({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="reveal mb-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          <span className="text-glow">@{username}</span>&apos;s GitHub portfolio score
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          A shared RepoLens report. The analysis below runs live against public GitHub data — repository
          quality, README quality, commit habits, collaboration — and scores the profile out of 100.
        </p>
      </header>
      <PausedNotice />
      <Analyzer initialUsername={username} autorun hero={false} />
    </div>
  );
}
