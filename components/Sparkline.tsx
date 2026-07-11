/** 12-point score sparkline (dataviz stat-tile spec: de-emphasis line, current period accent). */
export default function Sparkline({
  points,
  width = 120,
  height = 28,
}: {
  points: number[];
  width?: number;
  height?: number;
}) {
  if (points.length < 2) return null;
  const recent = points.slice(-12);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const span = Math.max(1, max - min);
  const step = width / (recent.length - 1);
  const y = (v: number) => height - 3 - ((v - min) / span) * (height - 6);
  const path = recent.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const lastX = (recent.length - 1) * step;

  return (
    <svg width={width} height={height} aria-label={`Score trend: ${recent.join(", ")}`}>
      <path d={path} fill="none" stroke="var(--series-other)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={y(recent[recent.length - 1])} r="4" fill="var(--series-1)" stroke="var(--surface-1)" strokeWidth="2" />
    </svg>
  );
}
