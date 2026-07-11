"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { Analysis } from "@/lib/types";
import { ROLE_RADAR, roleLabel, type RoleId } from "@/lib/roles";

/**
 * Role-fit radar: your measured coverage (blue fill) vs what the target role
 * expects (violet outline). Axes are the eight coverage areas; "you" values
 * are derived from the analysis, not vibes.
 */

const AXIS_LABEL: Record<string, string> = {
  tests: "Tests",
  ci: "CI/CD",
  demo: "Demos",
  readme: "Docs",
  backend: "Backend",
  docker: "Containers",
  data: "Data/AI",
  license: "OSS",
};

function youValue(a: Analysis, gapId: string): number {
  if (a.repos.length === 0) return 0;
  switch (gapId) {
    case "readme": {
      const scores = a.repos.map((r) => r.readmeScore ?? 0);
      return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    }
    case "demo":
      return Math.round((a.repos.filter((r) => Boolean(r.homepage)).length / a.repos.length) * 100);
    case "license":
      return Math.round((a.repos.filter((r) => r.hasLicense).length / a.repos.length) * 100);
    default: {
      // keyword-detected areas are near-binary: covered / hinted / absent
      const gap = a.gaps.find((g) => g.id === gapId);
      if (!gap) return 0;
      return gap.severity === "good" ? 85 : gap.severity === "warning" ? 30 : 10;
    }
  }
}

function RadarTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-sm shadow-sm">
      <div className="font-semibold mb-0.5">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-0.5 w-3" style={{ background: p.color }} />
          <span className="font-semibold tnum">{p.value}</span>
          <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function RoleRadar({ analysis, role }: { analysis: Analysis; role: RoleId }) {
  const target = ROLE_RADAR[role];
  const data = Object.keys(AXIS_LABEL).map((id) => ({
    area: AXIS_LABEL[id],
    you: youValue(analysis, id),
    target: target[id] ?? 50,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="var(--grid-hairline)" />
          <PolarAngleAxis dataKey="area" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
          <Radar
            name="You"
            dataKey="you"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="var(--series-1)"
            fillOpacity={0.12}
            isAnimationActive={false}
          />
          <Radar
            name={`${roleLabel(role)} target`}
            dataKey="target"
            stroke="var(--series-5)"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="none"
            isAnimationActive={false}
          />
          <Tooltip content={<RadarTip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
            iconType="plainline"
            iconSize={14}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
