import { GITHUB_API_ENABLED } from "@/lib/github";

/**
 * Shown on any page that would normally trigger a live GitHub crawl, while
 * GitHub access is paused. Renders nothing once GITHUB_API_ENABLED=true.
 */
export default function PausedNotice() {
  if (GITHUB_API_ENABLED) return null;
  return (
    <div
      role="status"
      className="card p-4 mb-6 text-sm print-hide"
      style={{ borderColor: "var(--status-warning)" }}
    >
      <p className="font-display font-semibold mb-1" style={{ color: "var(--status-warning)" }}>
        Live analysis is paused
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        RepoLens isn&apos;t contacting the GitHub API at the moment, so new profiles can&apos;t be
        scored. Reports that were already analyzed still open from the cache, and the{" "}
        <a href="/leaderboard" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
          leaderboard
        </a>
        ,{" "}
        <a href="/methodology" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
          methodology
        </a>{" "}
        and{" "}
        <a href="/guide" className="hover:underline" style={{ color: "var(--brand-blue)" }}>
          guide
        </a>{" "}
        are unaffected.
      </p>
    </div>
  );
}
