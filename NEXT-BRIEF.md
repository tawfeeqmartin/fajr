# NEXT BRIEF — Chris lookdev handoff (v13)

## What the scene looks like now
- Oblique arch gobo from far LEFT (-6, 16, 3) — light source off-screen bottom-left
- Arch tip visible in TOP-RIGHT corner of viewport, base exits lower-left
- Gobo beam sweeps from lower-left to upper-right (~54° from -Z on floor)
- Floor stamps aligned at ~50° (-PI*0.28) to match gobo beam direction
- Base of window light projection pushed off-screen (longer stamps + wider cone)
- Window shape 15% narrower than v10 (archW 0.28 → 0.238)
- No arch legs/bottom visible (baseY clipped at 62%, legs hidden)
- Cube top face tamed by shader scrim (unchanged from v10)
- Three spectral clock hands (H/M/S) on floor, prayer window sectors active
- Two-layer arch floor stamp (base + bloom), additive blending, warm amber
- Dark scene (0x0d0d12), AgX tonemapping, sacred pool aesthetic
- Arch silhouette reads as a crisp pointed lancet — 1024px texture,
  sharper ogee beziers, bright edge stroke, tighter gobo penumbra

## What changed in v13
1. **Gobo flipped to LEFT side** — position (6,16,3)→(-6,16,3), target
   (0.5,0,-1)→(-0.5,0,-1). v11/v12 had the gobo on the RIGHT (+X), but
   SpotLight.map projection maps texture "up" toward the OPPOSITE X from
   the light position. Light on +X → tip projects toward -X (upper-left).
   Light on -X → tip projects toward +X (upper-right). Now correct.
2. **Stamp rotation steepened** — Y rotation -PI\*0.22→-PI\*0.28 (~40°→50°
   from -Z). Aligns stamp arch axis with the gobo beam floor direction
   (beam from (-6,0,3) toward (-0.5,0,-1) ≈ 54° from -Z). Was 14° off,
   now ~4° — stamp and gobo arch edges register cleanly.
3. **Stamp position shifted** — (0.5,y,-0.5)→(-0.5,y,-1.0). Centers stamps
   under the gobo target so irradiance pool and additive overlay coincide.
   Arch tip extends further toward upper-right; base pushed further toward
   lower-left off-screen.

## What needs attention next
- **Tip placement fine-tune**: arch tip should land clearly inside the top-right
  corner of the 430×932 viewport. If tip is clipped or too far from corner,
  nudge stamp position.z toward 0 (pulls tip closer to center) or adjust
  stamp rotation.y (smaller magnitude → tip more vertical, closer to top edge).
- **Gobo/stamp registration**: with the gobo now on the left, verify the
  irradiance pool overlaps the additive stamps. If misaligned, nudge
  `gobo.target` X/Z or stamp positions to match.
- **Base off-screen check**: verify on 430×932 viewport that no arch base/legs
  peek into the lower-left corner. If visible, increase stamp h or shift
  stamp position.z toward +Z.
- **Top-face scrim**: unchanged from v10 (55% attenuation). Gobo now enters
  from the LEFT — incidence angle on cube top face changes. May need re-eval.
- **Edge stroke thickness tuning**: 4px at 1024 = thin. If the edge still
  reads soft on mobile, try 6px. If too crispy/CG, drop to 3px.
- **Fill luminance balance**: #e8e0d8 fill vs #ffffff stroke. Raise fill
  toward #f0ece4 if muddy, lower toward #ddd8d0 if stroke doesn't pop.
- **Specular orbit**: `uSpecIntensity` at 2.8 with orbiting spec light can
  still flash the top face. Consider gating spec by `Nw.y` scrim if it flares.

## Client notes to carry forward
- Tawfeeq wants arch to feel like it projects from off-screen BOTTOM-LEFT
- Arch tip lands in TOP-RIGHT corner — full pointed shape readable there
- No arch legs/bottom visible — keep baseY clip at 62%
- Base of window light must NOT be in frame — keep projection long enough
- Window shape should be narrower than v10 — preserve 0.238 archW
- Arch projection should feel like real architectural light, not a flat stamp
- index.html is off limits
