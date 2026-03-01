# NEXT BRIEF — Chris lookdev handoff (v11)

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

## What changed in v11
1. **Arch mirrored to right side** — gobo position (-6,16,3) → (+6,16,3),
   target (-0.5,0,-1) → (+0.5,0,-1). Arch tip now lands in top-right corner
   of the viewport instead of upper-left. Client direction: "tip visible in
   the TOP-RIGHT corner."
2. **Longer projection** — base stamp 7×7 → 7×10, bloom stamp 9×9 → 9×13.
   Stamps stretched in the tip-to-base axis so the base of the window light
   exits the lower-left edge of the viewport. Gobo cone 0.35 → 0.40 to widen
   the floor throw. Stamp centers shifted from Z=-1.0 to Z=-0.5 (toward
   camera) so the base extends further off-screen.
3. **15% narrower window** — arch texture width `archW` from `sz*0.28` to
   `sz*0.238`. Shape is taller/narrower, more lancet-like.
4. **Stamp rotations mirrored** — rotation.y from +0.22π to -0.22π on both
   bloom and base stamps. Matches the gobo mirror so additive overlays align.

## What needs attention next
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
- **Mobile check**: no new shader cost; only geometry and position changes.

## Client notes to carry forward
- Tawfeeq wants arch tip in TOP-RIGHT corner — preserve the mirrored layout
- No arch legs/bottom visible — keep baseY clip at 62%
- Base of window light must NOT be in frame — keep projection long enough
- Window shape should be narrower than v10 — preserve 0.238 archW
- Arch projection should feel like real architectural light, not a flat stamp
- index.html is off limits
