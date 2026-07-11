import type { Metadata } from "next";
import CopyButton from "@/components/CopyButton";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `CI Action — ${SITE_NAME}`,
  description: "Guard your GitHub portfolio quality in CI: fail the build when your RepoLens score drops.",
  alternates: { canonical: "/action" },
};

const APP_URL = "https://repolens.rianfernando.com";

const WORKFLOW = `# .github/workflows/repolens.yml
name: RepoLens portfolio check
on:
  schedule:
    - cron: "0 9 * * 1"   # every Monday 09:00 UTC
  workflow_dispatch: {}     # run it manually from the Actions tab

jobs:
  score:
    runs-on: ubuntu-latest
    steps:
      - name: Check portfolio score
        env:
          MIN_SCORE: 50   # fail below this
        run: |
          RESULT=$(curl -sf "${APP_URL}/api/score/\${{ github.repository_owner }}")
          SCORE=$(echo "$RESULT" | jq .score)
          PCT=$(echo "$RESULT" | jq .percentileEstimate)
          echo "RepoLens score: $SCORE/100 (~top \$((100-PCT))% estimated)"
          echo "$RESULT" | jq -r '.openGaps[] | "gap: \\(.)"'
          if [ "$SCORE" -lt "$MIN_SCORE" ]; then
            echo "::error::Portfolio score $SCORE fell below threshold $MIN_SCORE — see ${APP_URL}/u/\${{ github.repository_owner }}"
            exit 1
          fi
`;

const BADGE = `[![RepoLens score](${APP_URL}/api/badge/YOUR_USERNAME)](${APP_URL}/u/YOUR_USERNAME)`;

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span
        className="font-mono-accent text-sm shrink-0 h-8 w-8 rounded-lg border inline-flex items-center justify-center"
        style={{ borderColor: "var(--border)", color: "var(--series-1)" }}
      >
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display font-semibold">{title}</h3>
        <div className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ActionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-10">
      <div className="reveal">
        <p className="font-mono-accent text-xs uppercase tracking-[0.18em] mb-3" style={{ color: "var(--series-1)" }}>
          phase 2 ✦ continuous portfolio quality
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-glow">
          Your portfolio, under CI
        </h1>
        <p className="mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Code gets tests; portfolios rot silently. This workflow re-scores your GitHub profile every week
          and fails loudly when quality drops — a stale demo link, a deleted README, six months without a
          commit. It runs on the public score API, so there is nothing to install and nothing to pay.
        </p>
      </div>

      <div className="space-y-8 reveal" style={{ animationDelay: "120ms" }}>
        <Step n="01" title="Add the workflow to your profile repo">
          <p>
            Create this file in any repo you own (your <code className="font-mono-accent">username/username</code>{" "}
            profile repo is the natural home):
          </p>
          <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div
              className="flex items-center justify-between px-3 py-2 text-xs border-b font-mono-accent"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <span>.github/workflows/repolens.yml</span>
              <CopyButton text={WORKFLOW} />
            </div>
            <pre
              className="p-3 text-xs overflow-x-auto"
              style={{ color: "var(--text-secondary)", background: "rgba(13,13,13,0.5)" }}
            >
              {WORKFLOW}
            </pre>
          </div>
        </Step>

        <Step n="02" title="Pick your threshold">
          <p>
            <code className="font-mono-accent">MIN_SCORE: 50</code> is a sensible floor — it means solid READMEs
            on your top repos and at least a few coverage areas hit. Raise it as your score climbs; the roadmap
            on your report shows exactly which fix buys which points.
          </p>
        </Step>

        <Step n="03" title="Put the badge where recruiters look">
          <p>Add the live score badge to your profile README — it links back to your full report:</p>
          <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div
              className="flex items-center justify-between px-3 py-2 text-xs border-b font-mono-accent"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <span>README.md</span>
              <CopyButton text={BADGE} />
            </div>
            <pre
              className="p-3 text-xs overflow-x-auto whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)", background: "rgba(13,13,13,0.5)" }}
            >
              {BADGE}
            </pre>
          </div>
        </Step>
      </div>

      <div className="card p-5 text-sm reveal" style={{ animationDelay: "220ms" }}>
        <h2 className="font-display font-semibold mb-2">The API behind it</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          <code className="font-mono-accent">GET /api/score/&lt;username&gt;</code> returns{" "}
          <code className="font-mono-accent">{`{ score, percentileEstimate, parts, openGaps }`}</code>, cached at
          the edge for six hours. Percentiles are currently estimated from a calibrated curve — real percentiles
          against the population of analyzed profiles land when the score database ships.
        </p>
      </div>
    </div>
  );
}
