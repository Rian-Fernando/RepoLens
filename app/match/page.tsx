import type { Metadata } from "next";
import MatchView from "@/components/MatchView";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Job match — ${SITE_NAME}`,
  description:
    "Paste a job description, get an honest readiness score: which requirements your GitHub actually evidences, and how to close the gaps.",
  alternates: { canonical: "/match" },
};

export default function MatchPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center mb-8 reveal">
        <p className="font-mono-accent text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          requirements ✦ mapped to receipts
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-glow">Am I ready for this job?</h1>
        <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Paste a job posting. RepoLens maps every requirement to actual evidence in your repos — what
          you can prove, what&apos;s thin, and the fastest way to close each gap.
        </p>
      </div>
      <MatchView />
    </div>
  );
}
