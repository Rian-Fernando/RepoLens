/**
 * RepoLens mark — a lens ring framing a 3-node commit graph
 * (from the brand handoff: "a lens on your repo").
 * Brand gradient: blue #79b8ff → violet #a78bfa at 135°.
 */
export function LogoMark({ size = 28, id = "lg" }: { size?: number; id?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#79b8ff" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <circle cx="42" cy="42" r="26" fill="none" stroke={`url(#${id})`} strokeWidth="5" />
      <line x1="61" y1="61" x2="80" y2="80" stroke={`url(#${id})`} strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="48" r="3.2" fill="#f0f4fa" />
      <circle cx="44" cy="34" r="3.2" fill="#f0f4fa" />
      <circle cx="52" cy="50" r="3.2" fill="#f0f4fa" />
      <line x1="32" y1="48" x2="44" y2="34" stroke="#f0f4fa" strokeWidth="2" />
      <line x1="44" y1="34" x2="52" y2="50" stroke="#f0f4fa" strokeWidth="2" />
    </svg>
  );
}

/** Horizontal lockup: mark + mono wordmark. */
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} id="lg-header" />
      <span className="font-mono-accent font-bold tracking-tight text-lg" style={{ color: "#f0f4fa" }}>
        repolens
      </span>
    </span>
  );
}
