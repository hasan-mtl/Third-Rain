# Rain — Refresh Your Business

A cinematic single-page marketing site for **Rain**, a studio that modernizes
businesses for the AI era (AI automation, websites, branding, apps, CRM
workflows, connected digital systems).

Implemented from a Claude Design handoff. It's a self-contained static site —
no build step, no dependencies to install.

## Run it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `Rain.html` directly in a browser (`open Rain.html` on macOS).

## Project layout

```
Rain.html        — the page (canonical source)
index.html       — entry point for static hosts; redirects to Rain.html
rain.css         — design tokens + all section styles
rain.js          — interactions (rain canvas, scroll reveals, river scene, orbit, etc.)
favicon.svg      — site icon
assets/          — images + video used by the site
design-source/   — original design-process artifacts (concepts, screenshots, uploads)
HANDOFF.md       — the original Claude Design handoff notes
```

## Notes

- **Hero video** is a Vimeo background embed (the design's choice). A local
  `assets/rain-video-first.mp4` is included if you ever want to self-host it.
- **Process section** plays a self-hosted background video
  (`assets/canal-water-flow.mp4`) of water flowing through a meadow, with
  `river-story.png` as the poster fallback. It autoplays muted and is paused
  (held on the poster frame) for visitors who prefer reduced motion.
- **Fonts** (Cormorant Garamond, Schibsted Grotesk) load from Google Fonts, so
  the page needs network access to render typography exactly as designed.
- **Accessibility**: honors `prefers-reduced-motion` — animations and the rain
  canvas are disabled for users who request reduced motion.
- Several images in `assets/` (clouds, gates, hero-rainforest, etc.) belong to
  earlier design scenes and are not referenced by the current page; they're kept
  for reference and can be pruned to slim the folder.

## Deploy

Drop the folder on any static host (Vercel, Netlify, GitHub Pages, S3). No
configuration needed — `index.html` is the entry point.
