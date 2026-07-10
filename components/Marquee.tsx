/** ✦-separated ticker — the same visual rhythm as the portfolio's tagline marquee. */
const ITEMS = [
  "languages",
  "commit habits",
  "repo quality",
  "readme quality",
  "missing pieces",
  "role fit",
  "fix kit",
  "5 projects to build",
  "score badge",
  "ci checks",
];

export default function Marquee() {
  const run = ITEMS.map((t) => `${t} ✦ `).join("");
  return (
    <div className="marquee py-2.5 select-none" aria-hidden>
      <div className="marquee-track font-mono-accent text-xs uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
        <span>{run}</span>
        <span>{run}</span>
      </div>
    </div>
  );
}
