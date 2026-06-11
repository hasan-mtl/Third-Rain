# Scene loop log
started: 2026-06-11T19:26:31+0800
cadence: every 10 minutes, one verified refinement per run

1. light story — sky bloom behind the wordmark (the brand lights the night); central glitter lane + lane spec answer it
2. lip gleam — streamlines anchored to the lip (accelerating into the edge, fine second layer), tighter gleam line, flickering rim sparkles
3. overflow rivulets — two-octave finger spacing w/ real gaps, gravity stretch + accelerating shear, droplet breakup low down, sparkles clustered on rivulets. ALSO fixed v24 regression: glitter-lane spec referenced `path` before its declaration → GL program dead in v24/v25 (verify false-positive: console was read before a forced frame). Protocol updated.
4. ocean specular — distance-graded glitter: near = discrete stepped glints (tight pow-150 lobe), horizon = fine dense shimmer (140-cell hash, broader pow-80 lobe); fresnel lifts 25% toward the horizon for a more mirrored far field
5. atmosphere — second mist layer at its own scale/drift (sky parallax depth), near-wisp tint near the horizon, horizon glow now breathes (0.86–1.0 swell, ~14s, per-x phase so the pulse rolls along the line)
— loop stopped by Hasan ("pretty close"). Directed change: THICK water edge.
6. thick wave edge — lip is now a real rolling swell (4 traveling sines, ~±16px) and the water bends over it as a thick curling tongue (14–24px: bright rim, translucent aqua belly w/ subsurface glow, dark root, wrap streaks, sparkles); foam flecks race the last stretch to the edge; rivulets now pour from under the curl; JS lip mirror updated identically
— Hasan spec: scroll-driven cinematic with infinity-edge ending.
7. THE CINEMATIC (v31) — #flow pinned 260vh via GSAP ScrollTrigger scrub + Lenis glide; one bProg drives 4 phases: dolly+sway (0–.3) → services rise & drift past as perspective-projected buoys w/ bob+reflection, slipping over the edge ahead of you (.3–.55) → lip reveals from below frame, foam brightens, water accelerates (.55–.75) → the glide down: horizon+lip exit top, laminar face fills frame, 600-droplet stream, mist bloom, paper veil crossfades into services section (.75–1). New uniforms uCamZ/uCamX/uDesc/uLipF; de-snaked lip (longer swells, broken rim, dark glass curl); pixel ratio capped 1.5; mobile + reduced-motion + no-CDN all degrade gracefully (no pin, no descent). __rainProg(p) debug hook for verification.
