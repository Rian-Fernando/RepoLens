# RepoLens — Brand & Design Handoff

Techy/futuristic dark theme for a GitHub-profile scoring app. Score range: 0–100.

## Files in this package
- `RepoLens Design System.dc.html` — visual spec: logo lockups, color palette, type scale, score-card component, hero mockup. Open in a browser to view/reference; not meant to ship as-is.
- `assets/logo-mark.svg` — icon only (lens + commit-graph), transparent background.
- `assets/logo-horizontal.svg` — icon + "repolens" wordmark lockup.
- `assets/favicon.svg` — icon on dark rounded-square container, tuned (thicker strokes) for small sizes. Export to favicon.ico / 32×32 & 16×16 PNG.
- `assets/app-icon.svg` — same mark/container system at 512×512 for app-icon / social-card use. Export to whatever PNG sizes your platform (PWA manifest, App Store, etc.) requires.
- `design-tokens.css` — CSS custom properties for colors, type, radii, spacing, shadows. Drop into the app's global stylesheet.

## Logo concept
Mark = a lens ring (partial circle + handle) framing a tiny 3-node commit graph — literalizes "a lens on your repo." Same glyph is used everywhere; only container and stroke weight scale for legibility (thin ring at large sizes, thick ring + bigger nodes at favicon size).

## Color system
Dark techy palette. Two brand accents (blue `oklch(72% .17 217)`, violet `oklch(72% .17 280)`) share chroma/lightness so the brand gradient (135deg, blue→violet) stays harmonious. Score bands reuse the same chroma/lightness formula at three hues: green (high, 80–100), amber (mid, 50–79), red (low, 0–49) — see `design-tokens.css` for exact values.

## Typography
- **Manrope** (400–800) — all UI copy, headings, body.
- **JetBrains Mono** (400–700) — score numbers, usernames-as-code, metadata, badges. Reinforces the "analyzing code" feel without going full terminal-pastiche.

Scale: display 64 / h1 40 / h2 28 / h3 20 / body 16 / small 13 / score-figure 56, all defined as tokens.

## Score card component
Shows: avatar, username, repo/star counts, big mono score figure (0–100), colored tier pill (EXCELLENT / DEVELOPING / NEEDS WORK — swap copy as needed), thin gradient/tier progress bar. Score figure + progress bar color switch by tier using the score-semantic tokens.

## Implementation notes for the coding agent
1. Import `design-tokens.css` globally; reference tokens (`var(--rl-*)`) instead of hardcoding hex values.
2. Favicon: export `assets/favicon.svg` to `favicon.ico` (16/32/48px) plus a 32×32 PNG fallback for older browsers.
3. App icon: export `assets/app-icon.svg` to whatever raster sizes the target platform needs (e.g. 192/512 for PWA manifest, 1024 for App Store). Keep the dark rounded-square background — don't crop to just the glyph.
4. Tier thresholds are a product decision, not fixed by this spec — the three score bands (high/mid/low) are wired to design tokens so thresholds can move without a re-theme.
5. All components in the spec use inline styles for portability; adapt to your app's actual CSS/component system, keeping the token values.
