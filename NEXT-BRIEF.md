# NEXT BRIEF — Chris lookdev handoff (v12)

## What the scene looks like now
- Oblique arch gobo from far right (+6, 16, 3) at -40° floor rotation
- Arch tip visible in TOP-RIGHT corner of viewport, base exits lower-left
- Base of window light projection pushed off-screen (longer stamps + wider cone)
- Window shape 15% narrower than v10 (archW 0.28 → 0.238)
- No arch legs/bottom visible (baseY clipped at 62%, legs hidden)
- Cube top face tamed by shader scrim (unchanged from v10)
- Three spectral clock hands (H/M/S) on floor, prayer window sectors active
- Two-layer arch floor stamp (base + bloom), additive blending, warm amber
- Dark scene (0x0d0d12), AgX tonemapping, sacred pool aesthetic
- **Arch silhouette now reads as a crisp pointed lancet** — 1024px texture,
  sharper ogee beziers, bright edge stroke, tighter gobo penumbra

## What changed in v12
1. **Arch texture resolution doubled** — 512→1024. More pixels at the arch
   boundary survive bilinear filtering and gobo projection softening. Edges
   that were 1-2px of anti-aliased gradient are now 2-4px — enough to read
   at distance.
2. **Sharper lancet bezier geometry** — ogee control points tightened. CP1
   `springY*0.5→0.55` keeps walls vertical longer before the curve starts.
   CP2 `archW*0.12→0.06` pulls the near-tip control point to half the offset
   from center, creating a true pointed/lancet convergence instead of a dome.
3. **Edge glow stroke** — arch path now has a 4px #ffffff stroke over an
   #e8e0d8 fill. The bright contour mimics light diffracting at the window
   frame edge. Gives the eye a defined boundary to lock onto — the shape
   reads as "pointed arch" instead of amorphous warm zone. The fill at ~91%
   white creates contrast headroom so the stroke pops.
4. **Gobo penumbra tightened** — 0.05→0.02. Softness now lives in the texture
   content (fill/stroke luminance gradient), not the cone boundary. The
   projected pool has a sharper falloff at the outer edge.
5. **Bloom stamp pulled back** — opacity 0.07→0.04. The atmospheric halo was
   washing over the base stamp's edge definition. At 0.04 it still reads as
   warm corona but no longer softens the arch silhouette.

## What needs attention next
- **Edge stroke thickness tuning**: 4px at 1024 = thin. If the edge still
  reads soft on mobile (430px wide viewport), try 6px. If too crispy/CG,
  drop to 3px or soften strokeStyle to #f0e8e0.
- **Fill luminance balance**: #e8e0d8 fill vs #ffffff stroke. If the arch
  interior looks muddy/grey through AgX tonemapping, raise fill toward #f0ece4.
  If too uniform (stroke doesn't pop), lower toward #ddd8d0.
- **Gobo/stamp registration**: the gobo irradiance pool and the additive stamps
  should overlap convincingly. If the gobo pool drifts from the stamp at the
  new angle, nudge `gobo.target` X/Z to align.
- **Base off-screen check**: verify on 430×932 viewport that no arch base/legs
  peek into the lower-left corner. If visible, increase stamp h or shift
  stamp position.z toward +Z.
- **Top-face scrim**: unchanged from v10 (55% attenuation). May need re-eval
  now that gobo enters from the opposite side — different angle of incidence.
- **Specular orbit**: `uSpecIntensity` at 2.8 with orbiting spec light can
  still flash the top face. Consider gating spec by `Nw.y` scrim if it flares.
- **Mobile check**: texture doubled to 1024 but still single-channel gobo —
  no new shader cost, slight GPU memory increase (1MB→4MB).

## Client notes to carry forward
- Tawfeeq wants arch tip in TOP-RIGHT corner — preserve the mirrored layout
- No arch legs/bottom visible — keep baseY clip at 62%
- Base of window light must NOT be in frame — keep projection long enough
- Window shape should be narrower than v10 — preserve 0.238 archW
- Arch projection should feel like real architectural light, not a flat stamp
- index.html is off limits
