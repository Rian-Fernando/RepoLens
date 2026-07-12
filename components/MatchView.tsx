"use client";

import { useState } from "react";
import { Ring2 } from "ldrs/react";
import "ldrs/react/Ring2.css";
import type { Analysis } from "@/lib/types";
import type { MatchResult } from "@/app/api/match/route";
import ScoreRing from "./ScoreRing";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

const STATUS_UI = {
  evidenced: { icon: "✓", color: "var(--status-good)", label: "Evidenced" },
  partial: { icon: "~", color: "var(--status-warning)", label: "Partial" },
  missing: { icon: "✗", color: "var(--status-serious)", label: "Missing" },
} as const;

export default function MatchView() {
  const [username, setUsername] = useState("");
  const [jd, setJd] = useState("");
  const [phase, setPhase] = useState<"idle" | "analyzing" | "matching">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [who, setWho] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "idle" || !username.trim() || jd.trim().length < 80) return;
    setError(null);
    setResult(null);
    try {
      setPhase("analyzing");
      const analysis = await postJson<Analysis>("/api/analyze", { username: username.trim() });
      setPhase("matching");
      const match = await postJson<MatchResult>("/api/match", { analysis, jd });
      setWho(analysis.profile.login);
      setResult(match);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Match failed.");
    } finally {
      setPhase("idle");
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={run} className="space-y-2 reveal">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your github username"
          aria-label="GitHub username"
          autoCapitalize="none"
          spellCheck={false}
          className="input-dark w-full px-4 py-2.5"
        />
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="paste the full job description here (at least a paragraph)…"
          aria-label="Job description"
          rows={8}
          className="input-dark w-full px-4 py-3 text-sm resize-y"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {jd.trim().length < 80 ? `${Math.max(0, 80 - jd.trim().length)} more characters needed` : "ready"}
          </span>
          <button
            type="submit"
            disabled={phase !== "idle" || !username.trim() || jd.trim().length < 80}
            className="btn-accent px-5 py-2.5 disabled:opacity-50 cursor-pointer font-display"
          >
            {phase === "analyzing" ? "Analyzing profile…" : phase === "matching" ? "Mapping requirements…" : "Check my readiness →"}
          </button>
        </div>
      </form>

      {phase !== "idle" && (
        <div className="flex items-center justify-center gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <Ring2 size="20" stroke="3" speed="0.9" color="#79b8ff" />
          {phase === "analyzing" ? "Reading the GitHub profile…" : "Comparing the posting against your evidence…"}
        </div>
      )}
      {error && (
        <p className="text-sm text-center font-medium" style={{ color: "var(--status-critical)" }}>
          {error}
        </p>
      )}

      {result && (
        <div className="space-y-6 reveal">
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center shrink-0">
              <ScoreRing score={result.readiness} size={116} />
              <div className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                readiness for this role
              </div>
            </div>
            <div className="flex-1">
              <p className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {result.verdict}
              </p>
              <p className="font-mono-accent text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
                @{who} ✦ {result.requirements.filter((r) => r.status === "evidenced").length} evidenced ·{" "}
                {result.requirements.filter((r) => r.status === "partial").length} partial ·{" "}
                {result.requirements.filter((r) => r.status === "missing").length} missing ✦{" "}
                {result.engine === "gemini" ? "AI reading" : "keyword reading"}
              </p>
            </div>
          </div>

          <ul className="card divide-y overflow-hidden">
            {result.requirements.map((r, i) => {
              const ui = STATUS_UI[r.status] ?? STATUS_UI.missing;
              return (
                <li key={i} className="px-5 py-3.5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: ui.color, color: "#0d1117" }}
                    >
                      {ui.icon}
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium">{r.requirement}</span>
                        <span className="font-mono-accent text-[10px] uppercase tracking-wider" style={{ color: ui.color }}>
                          {ui.label}
                        </span>
                      </div>
                      {r.evidence ? (
                        <div className="mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          Evidence: {r.evidence}
                        </div>
                      ) : null}
                      <div className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        → {r.action}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            Close the gaps faster: open{" "}
            <a href={`/u/${who}`} className="hover:underline" style={{ color: "var(--brand-blue)" }}>
              your full report
            </a>{" "}
            for the roadmap and fix kit.
          </p>
        </div>
      )}
    </div>
  );
}
