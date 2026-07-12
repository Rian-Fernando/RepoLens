"use client";

import { useEffect, useState } from "react";

/** "Watch this profile" — weekly email on score change. Hidden unless the deployment has Resend configured. */
export default function WatchButton({ login }: { login: string }) {
  const [configured, setConfigured] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  useEffect(() => {
    fetch("/api/watch")
      .then((r) => r.json())
      .then((d) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false));
  }, []);

  if (!configured) return null;

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="font-mono-accent text-[11px] px-3 py-1.5" style={{ color: "var(--status-good)" }}>
        ✓ watching — weekly email on change
      </span>
    );
  }

  return open ? (
    <form onSubmit={subscribe} className="inline-flex items-center gap-1.5">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email for score alerts"
        className="input-dark px-2.5 py-1.5 text-xs w-44"
      />
      <button type="submit" disabled={state === "busy"} className="btn-accent px-3 py-1.5 text-xs cursor-pointer disabled:opacity-60">
        {state === "busy" ? "…" : "Watch"}
      </button>
      {state === "error" ? (
        <span className="text-[11px]" style={{ color: "var(--status-critical)" }}>
          failed — retry
        </span>
      ) : null}
    </form>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="btn-ghost px-3 py-1.5 text-xs cursor-pointer">
      ⚯ Watch score
    </button>
  );
}
