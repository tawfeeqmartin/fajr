# CHRIS-READY — World-Space UV Wobble (v180 feedback)

**Date:** 2026-03-04
**Branch:** main (commits `dae9a15` → `d858c03`)
**File:** glass-cube-clock.js

## What Changed

Added `glassWobble()` — a world-space noise function that applies subtle UV displacement
to FBO refraction sample coordinates. This adds organic internal bending/variation to the
glass prism without touching the `diagF * 0.08` normal distortion path.

### Technical Approach
- **Two-octave sin-based noise** using `vWorldPos` (world position = continuous across all face boundaries, zero seam risk)
- **Per-channel UV variation**: red bends 15% more, blue 15% less → micro chromatic wobble
- **Time-animated** via `uTime` — glass feels alive, not static
- **Amplitude**: `0.007` — noticeable bending, not overwhelming

### What Was NOT Changed
- `diagF * 0.08` cap — **preserved exactly as-is** from seam fix commit `7a7240e`
- No changes to the normal distortion path
- No changes to IOR values, fresnel, dichroic, or any other shader parameters

## Why This Approach
The original `diagF` path uses `vLocalPos` which has per-triangle discontinuities →
seam artifacts on left/right faces. The UV wobble operates in a completely different
space:
1. Uses `vWorldPos` (interpolated from `modelMatrix * position`, continuous)
2. Applied AFTER refraction ray calculation, directly to FBO texture lookup UV
3. Face-agnostic — no face detection, no local position, no triangle boundaries

## Renders
All 7 prayer states rendered on GPU Chrome (RTX A6000):
- fajr, sunrise, dhuhr, asr, maghrib, isha, tahajjud
- Screenshots in `/home/openclaw-agent/.openclaw/workspace/renders/wobble-*.png`
- Console: ZERO errors, ZERO warnings
- Renderer: `ANGLE (D3D12 (NVIDIA RTX A6000), OpenGL ES 3.1)`

## Seam Check
✅ No fold seam artifacts detected on left/right faces across all 7 states.
The wobble path is mathematically incapable of producing seams (world-space, continuous).

## Tuning
Amplitude is a single float on line ~645: `return vec2(wx, wy) * 0.007;`
- `0.003` = barely perceptible
- `0.005` = subtle
- `0.007` = noticeable (current)
- `0.010` = strong — test first

Chef: review renders, adjust amplitude to taste. Do NOT push until approved.
