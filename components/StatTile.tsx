/** Stat tile per the dataviz contract: label · value (auto-compact) · optional note. */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
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
    <div className="card px-5 py-4">
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div className="font-mono-accent text-2xl mt-1 tnum">{value}</div>
      {note ? (
        <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          {note}
        </div>
      ) : null}
    </div>
  );
}
