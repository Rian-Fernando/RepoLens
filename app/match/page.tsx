import type { Metadata } from "next";
import MatchView from "@/components/MatchView";
import PausedNotice from "@/components/PausedNotice";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Job match: is your GitHub ready for this role? · ${SITE_NAME}`,
  description:
    "Paste a job description, get an honest readiness score: which requirements your GitHub actually evidences, and how to close the gaps.",
  alternates: { canonical: "/match" },
};

export default function MatchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-5xl sm:text-6xl">Am I ready for this job?</h1>
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Paste a job posting and RepoLens checks each requirement against what your repositories actually show:
          what you can point to, what&apos;s thin, and the quickest way to close each gap.
        </p>
      </div>
      <PausedNotice />
      <MatchView />
    </div>
  );
}
