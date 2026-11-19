"use client";

import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Analyze" },
  { href: "/match", label: "Job match" },
  { href: "/compare", label: "Compare" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/org", label: "Cohorts" },
  { href: "/action", label: "CI" },
  { href: "/guide", label: "Guide" },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/u/") : pathname.startsWith(href);

  return (
    <nav aria-label="Main" className="flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
      {ITEMS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="nav-link shrink-0"
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
