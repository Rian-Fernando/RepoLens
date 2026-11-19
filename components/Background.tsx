"use client";

import dynamic from "next/dynamic";

// three.js is heavy, so it loads client-side only, after hydration
const Starfield = dynamic(() => import("./Starfield"), { ssr: false });

/** The slow-moving star field behind every page. Decoration only. */
export default function Background() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden print-hide">
      <Starfield />
    </div>
  );
}
