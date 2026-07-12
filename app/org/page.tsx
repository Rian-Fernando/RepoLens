import type { Metadata } from "next";
import OrgView from "@/components/OrgView";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Cohorts — ${SITE_NAME}`,
  description:
    "Rank a GitHub organization or any list of usernames by portfolio score — for hackathons, bootcamps, and classrooms. CSV export included.",
  alternates: { canonical: "/org" },
};

export default function OrgPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center mb-8 reveal">
        <p className="font-mono-accent text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--brand-blue)" }}>
          hackathons ✦ bootcamps ✦ classrooms
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-glow">Rank a cohort</h1>
        <p className="mt-2 text-sm max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Point RepoLens at a GitHub organization — or paste any list of usernames — and get the whole
          group scored, ranked, and exportable as CSV.
        </p>
      </div>
      <OrgView />
    </div>
  );
}
