"use client";

import { useEffect, useState } from "react";

/** Personal score goal, stored in the browser. Shows distance-to-goal under the ring. */
export default function GoalChip({ login, score }: { login: string; score: number }) {
  const key = `repolens-goal-${login.toLowerCase()}`;
  const [goal, setGoal] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const saved = Number(localStorage.getItem(key));
    setGoal(saved >= 1 && saved <= 100 ? saved : null);
  }, [key]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(draft);
    if (n >= 1 && n <= 100) {
      localStorage.setItem(key, String(n));
      setGoal(n);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={save} className="mt-1.5 flex items-center justify-center gap-1">
        <input
          type="number"
          min={1}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Score goal"
          className="input-dark w-16 px-2 py-1 text-xs text-center"
          autoFocus
        />
        <button type="submit" className="btn-ghost px-2 py-1 text-[11px] cursor-pointer">
          set
        </button>
      </form>
    );
  }

  if (goal === null) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(String(Math.min(100, score + 10)));
          setEditing(true);
        }}
        className="font-mono-accent text-[11px] mt-1.5 cursor-pointer hover:underline print-hide"
        style={{ color: "var(--text-muted)" }}
      >
        + set a goal
      </button>
    );
  }

  const reached = score >= goal;
  return (
    <button
      type="button"
      onClick={() => {
        setDraft(String(goal));
        setEditing(true);
      }}
      title="Click to change your goal"
      className="font-mono-accent text-[11px] mt-1.5 cursor-pointer"
      style={{ color: reached ? "var(--status-good)" : "var(--text-muted)" }}
    >
      {reached ? `✓ goal ${goal} reached — raise it?` : `goal ${goal} · ${goal - score} to go`}
    </button>
  );
}
