"use client";

import { useEffect, useState } from "react";
import type { RepoAnalysis } from "@/lib/types";
import FixKit from "./FixKit";

/** Meter row per repo: fill carries the score; the track is a lighter step of the same ramp. */
function Meter({ value, animate }: { value: number; animate: boolean }) {
  return (
    <div
      className="h-2 w-full rounded-full overflow-hidden"
      style={{ background: "var(--meter-track)" }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: animate ? `${value}%` : "0%",
          background: "var(--series-1)",
          transition: "width 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}

export default function RepoQuality({ repos, login }: { repos: RepoAnalysis[]; login: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <ul className="divide-y" style={{ borderColor: "var(--grid-hairline)" }}>
      {repos.map((repo) => {
        const isOpen = open === repo.fullName;
        return (
          <li key={repo.fullName} className="py-3">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : repo.fullName)}
              className="w-full text-left cursor-pointer group"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium truncate flex-1 group-hover:underline decoration-1 underline-offset-4">
                  {repo.name}
                </span>
                {repo.language ? (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {repo.language}
                  </span>
                ) : null}
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {repo.stars}★
                </span>
                <span className="text-sm font-semibold w-14 text-right tnum">
                  {repo.qualityScore}/100
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="flex-1">
                  <Meter value={repo.qualityScore} animate={animate} />
                </div>
                <span className="text-xs w-28 text-right" style={{ color: "var(--text-muted)" }}>
                  README {repo.readmeScore === null ? "missing" : `${repo.readmeScore}/100`}
                </span>
              </div>
            </button>

            {isOpen ? (
              <div className="reveal">
                <div className="mt-3 grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      Score breakdown
                    </div>
                    <ul className="space-y-0.5">
                      {repo.qualityBreakdown.map((p) => (
                        <li key={p.label} className="flex justify-between">
                          <span style={{ color: "var(--text-secondary)" }}>{p.label}</span>
                          <span className="tnum" style={{ color: p.earned === p.max ? "var(--status-good)" : "var(--text-primary)" }}>
                            {p.earned}/{p.max}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                      README gaps
                    </div>
                    {repo.readmeFindings.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)" }}>Nothing missing — nice.</p>
                    ) : (
                      <ul className="list-disc pl-4 space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                        {repo.readmeFindings.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    )}
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 hover:underline"
                      style={{ color: "var(--series-1)" }}
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
                <FixKit repo={repo} login={login} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
