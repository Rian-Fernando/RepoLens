"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    Feedex?: { setMetadata?: (data: Record<string, unknown>) => void };
  }
}

/**
 * Tags every Feedex report with the route it came from. RepoLens has a lot of
 * distinct surfaces (report, compare, match, leaderboard, cohorts, guide,
 * methodology), so "which page was this about?" is the difference between an
 * actionable report and a guess.
 *
 * Renders nothing, and no-ops when the widget isn't loaded.
 */
export default function FeedexRoute() {
  const pathname = usePathname();

  useEffect(() => {
    // the widget boots lazily — retry briefly until it exposes its API
    let attempts = 0;
    const send = () => {
      if (window.Feedex?.setMetadata) {
        window.Feedex.setMetadata({ route: pathname });
        return true;
      }
      return false;
    };
    if (send()) return;
    const id = setInterval(() => {
      if (send() || ++attempts > 20) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [pathname]);

  return null;
}
