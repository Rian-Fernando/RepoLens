"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";

/** Stat tile per the dataviz contract: label · value (auto-compact) · optional note. */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

/** Count-up when the value is a plain number; renders as-is otherwise (e.g. "3/6"). */
function AnimatedValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const numeric = /^[\d,]+$/.test(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !numeric) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = parseInt(value.replace(/,/g, ""), 10);
    const counter = { v: 0 };
    const anim = animate(counter, {
      v: target,
      duration: 1000,
      ease: "outCubic",
      onUpdate: () => {
        el.textContent = Math.round(counter.v).toLocaleString();
      },
    });
    return () => {
      anim.cancel();
    };
  }, [value, numeric]);

  return <span ref={ref}>{value}</span>;
}

export default function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="card card-hover px-4 py-3">
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div className="text-2xl font-semibold mt-0.5 font-display">
        <AnimatedValue value={value} />
      </div>
      {note ? (
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}
