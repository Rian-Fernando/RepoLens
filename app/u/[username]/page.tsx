import type { Metadata } from "next";
import Analyzer from "@/components/Analyzer";
import { SITE_NAME } from "@/lib/site";

/** Shareable report: /u/<username> auto-runs the analysis for that user. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — ${SITE_NAME} report`,
    description: `GitHub portfolio analysis for ${username}: languages, commit habits, repo quality, and the 5 projects to build next.`,
    twitter: { card: "summary_large_image" },
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
      <p className="text-sm mb-2 reveal" style={{ color: "var(--text-muted)" }}>
        Shared report for <strong style={{ color: "var(--text-primary)" }}>@{username}</strong> — analysis runs
        live against GitHub.
      </p>
      <Analyzer initialUsername={username} autorun hero={false} />
    </div>
  );
}
