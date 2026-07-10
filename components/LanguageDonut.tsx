"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { LanguageSlice } from "@/lib/types";
import { formatCompact } from "./StatTile";

// Categorical slots in fixed order — "Other" always takes the de-emphasis gray.
const SLOTS = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
];

function sliceColor(slice: LanguageSlice, index: number): string {
  return slice.name === "Other" ? "var(--series-other)" : SLOTS[index % SLOTS.length];
}

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: LanguageSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="card px-3 py-2 text-sm shadow-sm">
      <div className="font-semibold">{s.percent}%</div>
      <div style={{ color: "var(--text-secondary)" }}>
        {s.name} · {formatCompact(s.bytes)} bytes
      </div>
    </div>
  );
}

export default function LanguageDonut({ languages }: { languages: LanguageSlice[] }) {
  if (languages.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No language data found in the analyzed repositories.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={languages}
              dataKey="percent"
              nameKey="name"
              innerRadius={58}
              outerRadius={90}
              stroke="var(--surface-1)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {languages.map((slice, i) => (
                <Cell key={slice.name} fill={sliceColor(slice, i)} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend doubles as the table view: name, share, bytes — text in text tokens. */}
      <table className="w-full text-sm">
        <tbody>
          {languages.map((slice, i) => (
            <tr key={slice.name} className="border-b last:border-0" style={{ borderColor: "var(--grid-hairline)" }}>
              <td className="py-1.5 pr-2">
                <span
                  aria-hidden
                  className="inline-block h-2.5 w-2.5 rounded-[3px] mr-2 align-middle"
                  style={{ background: sliceColor(slice, i) }}
                />
                {slice.name}
              </td>
              <td className="py-1.5 pr-2 text-right font-medium tnum">{slice.percent}%</td>
              <td className="py-1.5 text-right tnum" style={{ color: "var(--text-muted)" }}>
                {formatCompact(slice.bytes)} B
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
