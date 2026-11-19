import type { Metadata } from "next";
import OrgView from "@/components/OrgView";
import PausedNotice from "@/components/PausedNotice";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Rank a cohort of GitHub profiles · ${SITE_NAME}`,
  description:
    "Paste a list of GitHub usernames and get the whole group scored, ranked and exportable as CSV. For bootcamps, clubs and hackathon judging.",
  alternates: { canonical: "/org" },
};

export default function OrgPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-5xl sm:text-6xl">Rank a cohort</h1>
        <p className="mt-4 text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Paste a list of GitHub usernames and get the whole group scored and ranked, with a CSV you can take into a
          spreadsheet. Useful for bootcamps, clubs and hackathon judging.
        </p>
      </div>
      <PausedNotice />
      <OrgView />
    </div>
  );
}
