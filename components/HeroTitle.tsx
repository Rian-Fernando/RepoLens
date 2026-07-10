"use client";

import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

/** Headline with anime.js word-cascade: blur+rise per word, then the accent underline draws in. */
export default function HeroTitle({ lines }: { lines: string[][] }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.querySelectorAll<HTMLElement>(".hero-word").forEach((w) => (w.style.opacity = "1"));
      const u = el.querySelector<HTMLElement>(".hero-underline");
      if (u) u.style.transform = "scaleX(1)";
      return;
    }
    animate(el.querySelectorAll(".hero-word"), {
      opacity: [0, 1],
      translateY: [26, 0],
      filter: ["blur(8px)", "blur(0px)"],
      delay: stagger(90, { start: 100 }),
      duration: 750,
      ease: "outCubic",
    });
    animate(el.querySelectorAll(".hero-underline"), {
      scaleX: [0, 1],
      delay: 900,
      duration: 700,
      ease: "outExpo",
    });
  }, []);

  return (
    <h1 ref={ref} className="font-display text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.08]">
      {lines.map((words, li) => (
        <span key={li} className="block">
          {words.map((word, wi) => {
            const last = li === lines.length - 1 && wi === words.length - 1;
            return (
              <span key={wi} className="hero-word inline-block opacity-0 will-change-transform mr-[0.28em] last:mr-0">
                {last ? (
                  <span className="relative inline-block text-glow">
                    {word}
                    <span
                      aria-hidden
                      className="hero-underline absolute -bottom-1.5 left-0 h-[3px] w-full rounded-full origin-left scale-x-0"
                      style={{ background: "linear-gradient(90deg, var(--series-1), var(--series-2))" }}
                    />
                  </span>
                ) : (
                  word
                )}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
