# Rain — Refresh Your Business for the AI Era

A cinematic single-page marketing site for **Rain**, a studio that implements
real AI inside businesses (AI automation, websites, branding, software, mobile
apps, connected systems).

Design direction: **"Liquid Midnight — Still Water"** — a deep ink-black canvas
with a single rationed cyan→indigo "current" as the only accent, glassmorphism,
color-graded water footage, and one recurring light-droplet motif that threads
the whole page. Self-contained static site — no build step, no dependencies.

## Run it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project layout

```
index.html       — the page (canonical entry point)
rain.css         — design tokens + all section styles (Liquid Midnight system)
rain.js          — interactions (rain canvas, scroll reveals, era rail, kinetic
                   thesis, pinned Process scene, orbit, marquee, contact form)
favicon.svg      — site icon (cyan raindrop)
assets/          — graded media (see below)
design-source/   — original Claude Design artifacts (concepts, screenshots)
Rain.html        — LEGACY: the previous green/forest design. Not used by the
                   live site; kept for reference only. index.html is canonical.
```

## Type & color

- **Fonts:** Fraunces (display serif) + Inter Tight (UI), loaded from Google Fonts.
- **Palette:** ink `#05070A` ground, mist `#E8F4FF` text, accent `#38E1FF → #7C8CFF`.
- Permanently dark, high-contrast theme; `theme-color` is `#05070A`.

## Media

Nature footage is color-graded to the midnight palette **at runtime** (CSS
`grayscale` + a `mix-blend-mode: color` cyan/indigo tint + vignette + scrim) —
no offline grading pipeline needed.

- **Hero / Process** background: `canal-water-flow.mp4` (graded).
- **Opportunity** texture: `main-waterfall.mp4` (graded, low opacity).
- **System / Contact** backgrounds: graded stills (`system-basin`, `cta-clearing`).
- Background stills ship as optimized **AVIF / WebP** with a JPEG fallback
  (the multi-MB `.png` originals remain in `assets/` but are no longer served).
- Videos are gated off on mobile / `Save-Data` / reduced-motion, where the graded
  poster still is shown instead.

## Accessibility & performance

- Honors `prefers-reduced-motion` as a first-class static state (intro, rain
  canvas, marquee, pinned Process, kinetic type and counters all resolve to their
  final state).
- WCAG AA contrast, full keyboard support (skip link, focus-visible, mobile-drawer
  focus trap), semantic landmarks, labelled form with live validation messaging.
- One shared throttled rAF dispatcher; DPR-capped rain canvas paused when the tab
  is hidden; responsive 320px → ultrawide.

## Deploy

Drop the folder on any static host (Vercel, Netlify, GitHub Pages, S3). No
configuration needed — `index.html` is the entry point.

> **Note:** the local `.vercel/` link in this folder currently points at the
> `second-rain` Vercel project. Re-link this folder to its own (Third Rain)
> project before deploying, or a `vercel deploy` here will overwrite Second Rain.
