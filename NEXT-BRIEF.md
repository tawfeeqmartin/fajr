# NEXT BRIEF — Chris lookdev handoff (v56)

## What the scene looks like now
- Oblique arch gobo from far LEFT (-6, 16, 3) — light source off-screen bottom-left
- Arch tip visible in TOP-RIGHT corner of viewport, base exits lower-left
- Gobo intensity 0 (killed) — stamps are sole arch shape carriers
- Floor stamps aligned at ~36° (-PI*0.2) diagonal, position (-3.5, y, 0)
- Stamps 10% wider than v55: base 12.1×28, bloom 15.4×34, outline 12.1×28
- Window shape narrower than v10 (archW 0.202)
- No arch legs/bottom visible (baseY clipped at 62%, legs hidden)
- Cube top face tamed by shader scrim (55% attenuation)
- Three spectral clock hands (H/M/S) on floor, prayer window sectors active
- Three-layer arch floor stamp (bloom + base + outline), additive blending
- Dark scene (0x0d0d12), AgX tonemapping @ 1.25 exposure, sacred pool aesthetic
- Arch silhouette reads as crisp pointed lancet — 1024px texture, 5px edge stroke
- Outline opacity 0.55, fill 0.25, bloom 0.06
- Warm foreground fog at 0.09 opacity prevents dead lower frame

## What changed in v56
1. **Arch pulled left** — stamp X position -3→-3.5 (all three layers).
   Tip pulled further into frame per client direction.
2. **Arch 10% wider** — base 11→12.1, bloom 14→15.4, outline 11→12.1.
   Wider lancet reads with more presence on the 430×932 viewport.
3. **Bloom opacity boosted** — 0.04→0.06. Was barely visible, now provides
   a real atmospheric corona that sells the arch as projected light rather
   than a graphic overlay.
4. **Fill texture edge stroke thickened** — 4px→5px at 1024. Survives
   bilinear filtering on mobile without going soft. Outline texture
   remains at 6px (already correct).
5. **toneMappingExposure lifted** — 1.2→1.25. Opens midtones so the arch
   warmth and prayer beams read with more presence while preserving the
   dark sacred mood. Subtle but the whole scene breathes better.
6. **Warm foreground fog boosted** — opacity 0.07→0.09. Lower frame area
   had dead black — now carries enough amber warmth to feel alive.

## What needs attention next
- **Tip in frame**: verify arch tip is fully inside the viewport at 430×932.
  If still clipped, nudge X further left or adjust rotation.z magnitude.
- **Width proportion**: 10% wider arch may push base/legs into lower-left
  corner. Verify no legs peek in. If visible, increase stamp h or shift
  position.z.
- **Bloom halo**: at 0.06 the corona is subtle. If it feels too strong on
  bright monitors, pull back to 0.05. If still too faint, try 0.07.
- **Exposure headroom**: 1.25 is safe for AgX but monitor the cube top face
  and specular orbit — if they flare, dial back to 1.22.
- **Fill luminance balance**: #e8e0d8 fill vs #ffffff stroke at 5px.
  If muddy, raise fill toward #f0ece4. If stroke doesn't pop, try 6px.
- **Specular orbit**: `uSpecIntensity` at 2.8 with orbiting spec light can
  still flash the top face. Top-face scrim at 55% handles most cases but
  watch for flare at the exposure bump.

## Client notes to carry forward
- Tawfeeq wants arch to feel like it projects from off-screen BOTTOM-LEFT
- Arch tip lands in TOP-RIGHT corner — full pointed shape readable there
- No arch legs/bottom visible — keep baseY clip at 62%
- Base of window light must NOT be in frame — keep projection long enough
- Window shape should be narrower than v10 — preserve 0.202 archW
- Arch projection should feel like real architectural light, not a flat stamp
- index.html is off limits
