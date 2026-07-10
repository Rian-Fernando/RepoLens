"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CommitHabits as Habits } from "@/lib/types";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HEAT = [
  "var(--heat-0)",
  "var(--heat-1)",
  "var(--heat-2)",
  "var(--heat-3)",
  "var(--heat-4)",
  "var(--heat-5)",
  "var(--heat-6)",
];

function heatColor(count: number, max: number): string {
  if (count === 0 || max === 0) return HEAT[0];
  const step = 1 + Math.min(5, Math.floor((count / max) * 6));
  return HEAT[step];
}

function BarTip({
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
      <div className="font-semibold">{payload[0].value.toLocaleString()} commits</div>
      <div style={{ color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
}

export default function CommitHabits({ habits }: { habits: Habits }) {
  const [hovered, setHovered] = useState<{ day: number; hour: number; count: number } | null>(null);

  if (habits.totalSampled === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No commits by this user were found in the analyzed repositories.
      </p>
    );
  }

  const dayData = habits.byDay.map((count, i) => ({ day: DAY_SHORT[i], count }));
  const heatMax = Math.max(...habits.byDayHour.flat());

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Commits by day of week
        </h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--grid-hairline)" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<BarTip />} cursor={{ fill: "var(--grid-hairline)", opacity: 0.5 }} />
              <Bar
                dataKey="count"
                fill="var(--series-1)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          When you commit (UTC) — day × hour
        </h4>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: "2.25rem repeat(24, 1fr)" }}>
              {habits.byDayHour.map((row, day) => (
                <div key={day} className="contents">
                  <div className="text-[10px] pr-1 flex items-center justify-end" style={{ color: "var(--text-muted)" }}>
                    {DAY_SHORT[day]}
                  </div>
                  {row.map((count, hour) => (
                    <div
                      key={hour}
                      role="img"
                      aria-label={`${DAY_SHORT[day]} ${hour}:00 UTC — ${count} commits`}
                      className="aspect-square rounded-[2px] min-w-[10px]"
                      style={{ background: heatColor(count, heatMax) }}
                      onMouseEnter={() => setHovered({ day, hour, count })}
                      onMouseLeave={() => setHovered(null)}
                    />
                  ))}
                </div>
              ))}
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[9px] text-center" style={{ color: "var(--text-muted)" }}>
                  {h % 6 === 0 ? h : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs mt-2 h-4" style={{ color: "var(--text-secondary)" }}>
          {hovered
            ? `${DAY_SHORT[hovered.day]} ${hovered.hour}:00 UTC — ${hovered.count} commit${hovered.count === 1 ? "" : "s"}`
            : habits.busiestDay
              ? `Peak: ${habits.busiestDay}${habits.busiestHourUtc !== null ? ` around ${habits.busiestHourUtc}:00 UTC` : ""} · ${habits.last90Days} commits in the last 90 days`
              : ""}
        </p>
      </div>
    </div>
  );
}
