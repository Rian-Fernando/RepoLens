"use client";

import { useEffect, useState } from "react";
import { Helix } from "ldrs/react";
import "ldrs/react/Helix.css";

/** Terminal-style progress readout shown while the GitHub crawl runs. */
const STAGES = [
  "resolving profile",
  "listing repositories",
  "ranking by signal",
  "pulling language bytes",
  "reading READMEs",
  "sampling commit history",
  "scoring repo quality",
  "checking coverage gaps",
];

export default function AnalyzingLog({ username }: { username: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STAGES.length - 1)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card max-w-md mx-auto p-5 text-left reveal">
      <div className="flex items-center gap-3 mb-4">
        <Helix size="28" speed="2.5" color="#3987e5" />
        <div>
          <div className="font-display font-semibold text-sm">Analyzing @{username}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            live against the GitHub API
          </div>
        </div>
      </div>
      <div className="font-mono-accent text-xs space-y-1.5">
        {STAGES.slice(0, step + 1).map((stage, i) => (
          <div key={stage} className="termline flex items-center gap-2">
            <span style={{ color: i === step ? "var(--series-1)" : "var(--status-good)" }}>
              {i === step ? "▸" : "✓"}
            </span>
            <span style={{ color: i === step ? "var(--text-primary)" : "var(--text-muted)" }}>
              {stage}
              {i === step ? "…" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
