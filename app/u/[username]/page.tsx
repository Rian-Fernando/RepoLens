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
    title: `${username}'s GitHub portfolio score · ${SITE_NAME}`,
    description,
    twitter: { card: "summary_large_image" },
    alternates: { canonical: `/u/${username}` },
    // Per-person evaluations stay shareable by link but out of search indexes.
    robots: { index: false, follow: true },
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
      <header className="mb-8">
        <h1 className="text-4xl sm:text-5xl">{username}&apos;s GitHub portfolio</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          A RepoLens report: this profile&apos;s public repositories, READMEs, commit habits and collaboration,
          scored out of 100, with what would raise the score.
        </p>
      </header>
      <PausedNotice />
      <Analyzer initialUsername={username} autorun hero={false} />
    </div>
  );
}
