"use client";

import dynamic from "next/dynamic";

// three.js is heavy — load it client-side only, after hydration
const Starfield = dynamic(() => import("./Starfield"), { ssr: false });

/** Fixed abstract backdrop: WebGL starfield + gradient orbs + faint grid. Pure decoration. */
export default function Background() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden print-hide">
      <Starfield />
      <div className="absolute inset-0 bg-grid" />
      <div className="orb orb-blue animate-drift h-[480px] w-[480px] -top-40 -left-24" />
      <div className="orb orb-aqua animate-drift-slow h-[420px] w-[420px] top-1/3 -right-40" />
      <div className="orb orb-violet animate-drift h-[360px] w-[360px] bottom-[-160px] left-1/3" />
    </div>
  );
}
