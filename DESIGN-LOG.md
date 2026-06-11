Design loop — world-class front-end, every 20m until 2026-06-12 07:04 +0800 (cron 29808b7e). Protocol: .claude/design-loop.md

1. micro-interactions — boat hover: word eases +5% larger, halo +0.13, fill to 1.0, seat glow lifts; smooth 9/s lerp (never snaps), rect hit-test now index-based, cursor cleanup on leave
2. typography rhythm — section ledes capped to a true reading measure (48ch -> 557px ≈ 64 avg chars, was ~85), centered; section h2 gets text-wrap: balance (no widows on two-line headings). Verified computed: 557px x3 ledes, balance applied, overflowX 0.
