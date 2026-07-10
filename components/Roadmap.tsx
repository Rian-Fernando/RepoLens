"use client";

import { useEffect, useMemo, useState } from "react";
import type { Analysis } from "@/lib/types";
import { buildRoadmap } from "@/lib/roadmap";

/**
 * Gap checklist with computed score gains. Checked state persists in
 * localStorage per username, so re-visits show progress.
 */
export default function Roadmap({ analysis }: { analysis: Analysis }) {
  const items = useMemo(() => buildRoadmap(analysis), [analysis]);
  const storageKey = `repolens-roadmap-${analysis.profile.login.toLowerCase()}`;
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[];
      setDone(new Set(saved));
    } catch {
      /* fresh start */
    }
  }, [storageKey]);

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Nothing left to fix in the analyzed repos — this portfolio is in great shape.
      </p>
    );
  }

  const totalGain = items.reduce((a, i) => a + i.gain, 0);
  const claimedGain = items.filter((i) => done.has(i.id)).reduce((a, i) => a + i.gain, 0);
  const potential = Math.min(100, Math.round((analysis.overallScore + totalGain) * 10) / 10);

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
        Complete everything below and the score climbs from{" "}
        <strong className="tnum" style={{ color: "var(--text-primary)" }}>
          {analysis.overallScore}
        </strong>{" "}
        to roughly{" "}
        <strong className="tnum" style={{ color: "var(--series-1)" }}>
          {Math.round(potential)}
        </strong>
        . Check items off as you fix them (saved in your browser), then re-analyze to verify.
      </p>

      <ul className="space-y-2">
        {items.map((item) => {
          const checked = done.has(item.id);
          return (
            <li key={item.id}>
              <label
                className="flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors"
                style={{
                  borderColor: checked ? "var(--series-2)" : "var(--border)",
                  opacity: checked ? 0.65 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(item.id)}
                  className="mt-1 h-4 w-4 accent-[#199e70] cursor-pointer"
                />
                <span className="flex-1 text-sm">
                  <span className={`font-medium ${checked ? "line-through" : ""}`}>{item.title}</span>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.detail}
                    {item.repos.length > 0 ? ` (${item.repos.slice(0, 3).join(", ")}${item.repos.length > 3 ? "…" : ""})` : ""}
                  </span>
                </span>
                <span
                  className="text-xs font-semibold whitespace-nowrap tnum rounded-full px-2 py-0.5"
                  style={{ background: "var(--meter-track)", color: "var(--heat-6)" }}
                >
                  +{item.gain}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {claimedGain > 0 ? (
        <p className="text-xs mt-3" style={{ color: "var(--status-good)" }}>
          ✓ {Math.round(claimedGain * 10) / 10} points claimed — run the analysis again to make it official.
        </p>
      ) : null}
    </div>
  );
}
