"use client";

import { useEffect, useRef, useState } from "react";

/** Animated hero score: count-up number inside a ring that fills to score/100. */
export default function ScoreRing({ score, size = 148 }: { score: number; size?: number }) {
  const [display, setDisplay] = useState(0);
  const [mounted, setMounted] = useState(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(score);
      return;
    }
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [score]);

  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const offset = mounted ? c * (1 - score / 100) : c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--meter-track)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-semibold leading-none">{display}</div>
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          / 100
        </div>
      </div>
    </div>
  );
}
