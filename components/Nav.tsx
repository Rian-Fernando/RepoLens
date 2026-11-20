"use client";

import Link, { useLinkStatus } from "next/link";
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

/** Dims a menu item while its page is still loading. Prefetched pages open instantly and never show it. */
function NavLabel({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={pending ? "nav-pending" : undefined}>{children}</span>;
}

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/u/") : pathname.startsWith(href);

  return (
    <nav aria-label="Main" className="flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none]">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="nav-link shrink-0"
          aria-current={isActive(item.href) ? "page" : undefined}
        >
          <NavLabel>{item.label}</NavLabel>
        </Link>
      ))}
    </nav>
  );
}
