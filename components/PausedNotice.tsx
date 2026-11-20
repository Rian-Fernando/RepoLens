import { GITHUB_API_ENABLED } from "@/lib/github";
import Link from "next/link";

/**
 * Shown on pages that would normally start a live analysis, while GitHub
 * access is switched off for the whole deployment. Renders nothing otherwise.
 */
export default function PausedNotice() {
  if (GITHUB_API_ENABLED) return null;
  return (
    <div role="status" className="rounded-2xl border px-5 py-4 mb-6 text-sm print-hide" style={{ borderColor: "var(--border-bright)", background: "var(--card)" }}>
      <p className="font-medium">Live analysis is paused</p>
      <p className="mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        RepoLens isn&apos;t contacting GitHub at the moment, so new profiles can&apos;t be scored. Reports that
        already exist still open, and the <Link href="/leaderboard" className="link">leaderboard</Link>,{" "}
        <Link href="/methodology" className="link">methodology</Link> and <Link href="/guide" className="link">guide</Link> work
        as usual.
      </p>
    </div>
  );
}
