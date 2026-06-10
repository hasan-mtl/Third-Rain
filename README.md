# Rain — Refresh Your Business for the AI Era

The marketing site for **Rain** (rain.ceo) — an AI implementation studio that
designs, builds, and runs websites, branding, software, mobile apps, and AI
automation for businesses.

Design direction: **"Ink & Current"** — the same design DNA as the Rain Agent
platform (agent-hub), so the studio and its product read as one premium brand:

- Deep navy **ink** dark sections with radial teal/blue glows, film grain, and
  circuit grids; warm **paper** light sections in between.
- **Geist** (UI) + **Instrument Serif** (italic gradient accents inside
  headlines, serif numerals) + **Geist Mono** (eyebrows, micro-labels).
- Product-style proof artifacts instead of stock footage: a live "client
  refresh" console in the hero, an animated agent circuit + run log in the
  Platform section, gradient hairline frames, floating proof chips.

Self-contained static site — no build step, no dependencies.

## Run it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project layout

```
index.html       — the page (canonical entry point)
rain.css         — design tokens + all section styles ("Ink & Current" system)
rain.js          — interactions (drawer + focus trap, reveals, count-ups,
                   era rail, live run log, ticker, contact form)
favicon.svg      — site icon (white raindrop on a blue→teal gradient tile)
assets/          — LEGACY media from the previous "Liquid Midnight" design;
                   no longer referenced by the site
design-source/   — original Claude Design artifacts (concepts, screenshots)
Rain.html        — LEGACY: an older green/forest design. Not used.
```

## Sections

Hero (dark, refresh console artifact) → capability ticker → Services (6 cards)
→ The Shift (five-era rail) → The Gap (Mark Cuban quote + today/with-Rain
comparison) → Process (5 steps) → Platform (Rain Agent circuit + live run log
+ stats) → Contact (white form card on ink) → footer.

## Accessibility & performance

- `prefers-reduced-motion` is a first-class static state: reveals, ticker,
  streaks, pulses, run log, and count-ups all resolve to their final state.
- WCAG AA contrast on both light and dark surfaces, full keyboard support
  (skip link, focus-visible, drawer focus trap), semantic landmarks, labelled
  form with live validation messaging.
- No videos, no photography — the page is a few hundred KB of HTML/CSS/JS
  plus three Google Font families. Works with JavaScript disabled.

## Deploy

Drop the folder on any static host (Vercel, Netlify, GitHub Pages, S3). No
configuration needed — `index.html` is the entry point.

> **Note:** the local `.vercel/` link in this folder points at the
> `second-rain` Vercel project, and `origin` points at the Second-Rain GitHub
> repo. Re-link to a Third Rain project/repo before deploying or pushing, or
> you will overwrite Second Rain.
