# Scene loop log
started: 2026-06-11T19:26:31+0800
cadence: every 10 minutes, one verified refinement per run

1. light story — sky bloom behind the wordmark (the brand lights the night); central glitter lane + lane spec answer it
2. lip gleam — streamlines anchored to the lip (accelerating into the edge, fine second layer), tighter gleam line, flickering rim sparkles
3. overflow rivulets — two-octave finger spacing w/ real gaps, gravity stretch + accelerating shear, droplet breakup low down, sparkles clustered on rivulets. ALSO fixed v24 regression: glitter-lane spec referenced `path` before its declaration → GL program dead in v24/v25 (verify false-positive: console was read before a forced frame). Protocol updated.
4. ocean specular — distance-graded glitter: near = discrete stepped glints (tight pow-150 lobe), horizon = fine dense shimmer (140-cell hash, broader pow-80 lobe); fresnel lifts 25% toward the horizon for a more mirrored far field
5. atmosphere — second mist layer at its own scale/drift (sky parallax depth), near-wisp tint near the horizon, horizon glow now breathes (0.86–1.0 swell, ~14s, per-x phase so the pulse rolls along the line)
