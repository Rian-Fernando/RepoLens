"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Bench } from "@/lib/types";

/** Score over time — appears once a profile has 3+ recorded analyses. */

function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-sm shadow-sm">
      <div className="font-semibold tnum">{payload[0].value}/100</div>
      <div style={{ color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
}

export default function ScoreHistory({ bench }: { bench: Bench }) {
  const data = bench.history.map((h) => ({ date: h.date.slice(5), score: h.score }));
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -22 }}>
          <CartesianGrid stroke="var(--grid-hairline)" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} ticks={[0, 25, 50, 75, 100]} />
          <Tooltip content={<Tip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--series-1)", stroke: "var(--surface-1)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
