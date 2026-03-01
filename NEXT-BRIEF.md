# NEXT BRIEF — Chris lookdev handoff (v10)

## What the scene looks like now
- Oblique arch gobo from far left (-6, 16, 3) at 40° floor rotation
- No arch legs/bottom visible (baseY clipped at 62%, legs hidden behind cube)
- Cube top face was blown out white from repositioned gobo — now tamed
- Three spectral clock hands (H/M/S) on floor, prayer window sectors active
- Two-layer arch floor stamp (base + bloom), additive blending, warm amber
- Dark scene (0x0d0d12), AgX tonemapping, sacred pool aesthetic

## What changed in v10
1. **Shader scrim** — digital barn door in dichroic frag. Uses `Nw.y` (world
   normal up component) with `smoothstep(0.4, 0.92)` to darken only the top
   face by 55%. Sides and bottom untouched. No hard edge at transition.
2. **Gobo intensity** 60 → 48 — reduces total energy hitting the FBO scene
   behind the cube's top face. The floor arch is now carried more by the
   additive stamp than by gobo irradiance alone.
3. **Arch floor stamp opacity** 0.20 → 0.26 — compensates the gobo pull so
   the sacred pool reads at the same warmth level on the floor.
4. **tawafSpot intensity** 12 → 8 — this light orbits overhead at second-hand
   speed and was spiking the top face during each pass.

## What needs attention next
- **Top-face scrim tuning**: 55% attenuation is an initial value. If it reads
  too dark or too hot on device, adjust the `0.55` multiplier in the shader.
- **Arch stamp vs gobo balance**: additive stamp now carries more of the floor
  read. If the arch edges look too soft (additive has no penumbra), the gobo
  intensity can come back up with a tighter scrim.
- **Specular orbit**: `uSpecIntensity` at 2.8 with an orbiting spec light can
  still flash the top face as it passes overhead. Consider gating spec by the
  same `Nw.y` scrim if it flares.
- **Mobile check**: shader scrim adds one smoothstep per fragment — negligible,
  but verify no regression on low-end devices.

## Client notes to carry forward
- Tawfeeq likes the oblique direction — preserve the 40° arch rotation
- No arch legs/bottom visible — keep baseY clip at 62%
- Arch projection should feel like real architectural light, not a flat stamp
- index.html is off limits
