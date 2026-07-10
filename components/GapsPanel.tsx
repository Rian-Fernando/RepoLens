import type { GapItem } from "@/lib/types";

/** Status colors are reserved and always paired with an icon + label — never color alone. */
const STATUS: Record<GapItem["severity"], { color: string; icon: string; label: string }> = {
  good: { color: "var(--status-good)", icon: "✓", label: "Covered" },
  warning: { color: "var(--status-warning)", icon: "!", label: "Gap" },
  serious: { color: "var(--status-serious)", icon: "!!", label: "Priority gap" },
};

export default function GapsPanel({ gaps }: { gaps: GapItem[] }) {
  return (
    <ul className="space-y-2.5">
      {gaps.map((gap) => {
        const s = STATUS[gap.severity];
        return (
          <li key={gap.id} className="flex gap-3 items-start">
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ background: s.color, color: gap.severity === "warning" ? "#0b0b0b" : "#fff" }}
            >
              {s.icon}
            </span>
            <div className="text-sm">
              <span className="font-medium">{gap.title}</span>{" "}
              <span
                className="text-xs uppercase tracking-wide font-semibold"
                style={{ color: s.color }}
              >
                {s.label}
              </span>
              <div style={{ color: "var(--text-secondary)" }}>{gap.detail}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
