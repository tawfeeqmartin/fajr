# NEXT BRIEF — Chris lookdev handoff (v57)

## What the scene looks like now
- Oblique arch gobo from far LEFT (-6, 16, 3) — light source off-screen bottom-left
- Arch tip visible in TOP-RIGHT corner of viewport, base exits lower-left
- HYBRID approach: stamps carry primary shape + gobo at intensity 6 for real light
- Gobo has arch texture on .map — casts subtle real light/shadow through scene
- Floor stamps aligned at ~36° (-PI*0.2) diagonal, position (-3.5, y, 0)
- Stamps 10% wider than v55: base 12.1×28, bloom 15.4×34, outline 12.1×28
- Window shape narrower than v10 (archW 0.202)
- No arch legs/bottom visible (baseY clipped at 62%, legs hidden)
- Cube top face tamed by shader scrim (55% attenuation)
- Three spectral clock hands (H/M/S) on floor, prayer window sectors active
- Three-layer arch floor stamp (bloom + base + outline), additive blending
- Dark scene (0x0d0d12), AgX tonemapping @ 0.95 exposure, deep dramatic mood
- Outline softened: 14px stroke + 6px canvas blur at 0.30 opacity — diffused light edge
- Fill opacity 0.30, bloom 0.08, outline 0.30
- Warm foreground fog at 0.09 opacity prevents dead lower frame
- Ambient crushed: hemisphere 0.18, ambient 0.07, ghostFill 0.5 — deep darkness outside arch

## What changed in v57
1. **Outline softened** — stroke widened 6→14px + canvas blur(6px) applied.
   Opacity dropped 0.55→0.30. No longer reads as painted line — soft
   diffused-light boundary like real projected light through a stone opening.
2. **Exposure dropped** — 1.25→0.95. Outside the arch is now deep dark.
   Arch interior reads bright by contrast. Dramatic chiaroscuro.
3. **Ambient crushed** — HemisphereLight 0.4→0.18, AmbientLight 0.16→0.07,
   ghostFill 1.2→0.5. Floor outside the arch sinks into near-black.
   Only the arch zone and cube carry visible light.
4. **Hybrid gobo enabled** — SpotLight intensity 0→6 with arch texture on
   .map. Real light passes through the arch shape, casting subtle caustics
   on the cube and actual light/shadow interaction on the floor. Stamps
   remain the primary visual shape, gobo adds physical light behavior.
5. **Base stamp boosted** — fill opacity 0.25→0.30. Compensates for lower
   exposure so arch interior stays bright and warm.
6. **Bloom corona boosted** — 0.06→0.08. Atmospheric halo holds up at the
   lower exposure, sells the arch as projected light not flat overlay.

## What needs attention next
- **Gobo artifact check**: at intensity 6 the gobo is subtle, but verify no
  trapezoid artifact appears above the cube (the old v27 problem). If visible,
  drop to 4. If invisible and you want more interaction, try 8.
- **Outline softness**: 14px + blur(6px) at 0.30 might be too soft on retina
  displays. If the arch edge disappears, try blur(4px) or opacity 0.35.
  If still too crisp, try blur(8px).
- **Exposure balance**: 0.95 is aggressive. Cube glass refraction might look
  dark — if so, bump to 1.0. Watch the cube top face at this exposure
  (scrim is at 55%, should be fine).
- **Floor darkness**: ambient at 0.07 + hemisphere at 0.18 is very dark.
  If the scene feels like a void, nudge ambient to 0.10. If the darkness
  reads as sacred, keep it.
- **Bloom halo**: at 0.08 the corona is noticeable. If too strong on bright
  monitors, pull to 0.06. If the arch needs more glow presence, try 0.10.
- **Gobo + stamp alignment**: gobo light and stamp positions should overlap.
  If they diverge (gobo aim at (0,0,-2) vs stamps at (-3.5,y,0)), the hybrid
  might read as two separate light sources. Check at 430×932 viewport.

## Client notes to carry forward
- Tawfeeq wants arch to feel like it projects from off-screen BOTTOM-LEFT
- Arch tip lands in TOP-RIGHT corner — full pointed shape readable there
- No arch legs/bottom visible — keep baseY clip at 62%
- Base of window light must NOT be in frame — keep projection long enough
- Window shape should be narrower than v10 — preserve 0.202 archW
- Arch projection should feel like real architectural light, not a flat stamp
- Client: 'blur the lines to soften edges' — done in v57 (blur+widen+reduce opacity)
- Client: 'lower exposure outside arch for drama' — done in v57 (exposure+ambient crush)
- Client: 'hybrid stamps + low gobo for real light' — done in v57 (gobo intensity 6)
- index.html is off limits
