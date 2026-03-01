# LOOKDEV NOTES — Seven Heavens Studio
## Glass Cube Clock — Sacred Lighting R&D
### Chris, Lookdev Artist — started Feb 28, 2026

---

## REFERENCES & RESEARCH

### Sacred Architecture
- **Nasir al-Mulk Mosque (Shiraz, Iran)** — the rose mosque. Stained glass casts coloured light pools across Persian carpets. Light IS the decoration, not what reveals decoration. The floor IS the canvas.
- **Hagia Sophia** — double-shell dome; light enters through ring windows and falls as diffuse columns. Sense of "light descending from heaven."
- **Mihrab geometry** — the pointed arch (ogee/horseshoe) is the primary sacred aperture shape in Islamic architecture. The arch is a doorway, not a decoration.
- **Tadao Ando's Church of Light (Osaka, 1989)** — bare concrete cross cut into wall, dawn light floods interior. Darkness is structural. The darkness does as much work as the light. Key principle: "light only means something against darkness."
- **Chartres Cathedral clerestory** — the coloured light at floor level is MORE sacred than at eye level. The light travels.

### Cinematography References
- **Roger Deakins — warm/cold split** — standard Deakins technique: one warm key, one cold counter from opposite side. Creates depth and atmosphere without extra fixtures. The colour tension between warm and cold reads as "cinematic."
- **Emmanuel Lubezki — shafts of light as subjects** — in *The Tree of Life* and *The Revenant*, light shafts ARE the shot. The beam has volume and air-mass. It isn't just a source, it's a presence.
- **Deep-focus texture with shallow z-focus** — letting the floor be interesting without competing with the cube. Bokeh is not available in real-time 3D, so texture + focal layering substitutes.

### Glass Photography
- **Swarovski crystal studio lighting** — always a bright source directly behind the glass to drive transmission. Without backlighting, glass goes opaque/dark. The FBO technique mimics this: the background the FBO captures IS the transmitted light.
- **Dichroic glass** — shifts colour with viewing angle. Best read at Fresnel grazing angles. Key insight: the EDGES of glass are where dichroic shows. Not the face-on view.
- **Prism photography** — rainbow bands only separate at sufficient distance from prism. In-shader: per-channel IOR offset (R: 1.14, G: 1.18, B: 1.23) provides the dispersion.

### Three.js Gobo / Projected Texture Technique
- `SpotLight.map` accepts a `THREE.Texture` — Three.js r155+ supports this natively.
- The texture is procedurally generated on a `<canvas>` element at 512×512.
- `tex.rotation` rotates the projected pattern. `tex.center.set(0.5, 0.5)` is required for rotation to pivot correctly.
- The **cone angle** (`SpotLight.angle`) determines the projected circle on the floor. The texture maps to the full cone interior. Critically: if the arch fills 92% of the texture, only 8% margin exists outside the arch — the arch edge is indistinguishable from the cone boundary.
- **Rule for readable gobos:** the shape should fill ≤ 60% of the texture canvas. This gives ~20% dark margin on each side that projects as readable negative space (the "wall" flanking the arch opening).
- `penumbra` softens the cone edge, not the gobo texture edge. Keep penumbra low (0.05–0.10) for crisp arch silhouette.

### Islamic Geometric Light
- Prayer times are solar events (Fajr, Dhuhr, Asr, Maghrib, Isha). The clock is fundamentally a light-measuring instrument.
- The arch (mihrab arch) as projected shape connects the floor light to sacred spatial memory.
- The *Quibla* direction (toward Mecca) is the conceptual axis. Light from above-left, landing in front — the light is "turning toward something."
- Islamic geometric patterns are based on radial symmetry. The arch gobo obeys this — bilateral symmetry in the texture.

---

## THE QUIBLA OF LIGHT CONCEPT

**One sentence:** One dominant sacred shaft, the rest in shadow. Darkness is not absence — it is atmosphere.

**Inspirations synthesised:**
1. Tadao Ando: darkness as co-designer
2. Nasir al-Mulk: floor IS the canvas
3. Deakins: warm/cold split for cinematic depth
4. Lubezki: light shafts with air-mass (god ray volume)
5. Swarovski: bright backlight drives glass transmission

**Three compositional zones:**
1. **The Shaft** — dominant gobo key, warm amber, from upper-left, arch-shaped projection on floor
2. **The Cube** — backlit glass, dichroic dispersion, internal glow; the prayer beams (clock hands) radiate from its base
3. **The Dark Floor** — receives everything: arch, beams, fog pools. The floor is where sacred time is read.

**Contrast philosophy:**
- Do NOT light the cube uniformly. The glass should have a dark side and a light side.
- The arch on the floor should be brighter than the cube face. The floor is primary.
- Ambient kept very low (0.16–0.28) so shadow means something.

---

## LIGHTING RIG HIERARCHY

### Fixture List (current state after v3)

| Fixture | Type | Color | Intensity | Role |
|---------|------|-------|-----------|------|
| `gobo` | SpotLight | `0xfff4d6` warm white | 30 | Sacred shaft — arch gobo key |
| `back` | SpotLight | `0x4040a0` cool blue | 10 | Backlight: FBO transmission source |
| `cubeBack` | SpotLight | `0xffeedd` warm | 7 | Glass transmission (Swarovski) |
| `coldCounter` | SpotLight | `0x0a1855` deep blue | 6 | Deakins warm/cold split |
| `violetRim` | SpotLight | `0x8055f0` violet | 6 | Edge catch, cube separation from bg |
| `ghostFill` | PointLight | `0x0c0520` near-black | 1.2 | Floor separation from pure black |
| `prayerAmbient` | HemisphereLight | `0x1a0830`/`0x0a1520` | 0.4 | Coloured shadow fill |
| `rim` | SpotLight | `0x8060c0` violet | 5 | Back-edge silhouette catch |
| `cubeSun` | PointLight | `0xe8f2ff` ice | 105 | FBO content behind glass (dispersion source) |
| `tawafSpot` | SpotLight | white | 12 | Top-edge catch during rotation |
| AmbientLight | — | white | 0.16 | Absolute floor |

### Gobo Arch Texture (procedural, 512×512 canvas)
```
archW  = sz * 0.28  [v4] (was 0.46 at v3 — 92% fill clips arch edge)
baseY  = sz * 0.99  (legs reach canvas bottom = near-camera floor)
springY = sz * 0.42 (arch spring point)
peakY  = sz * 0.04  (arch tip — far-floor projection)
Shape: bezierCurveTo from spring to peak with inner control points
Color: white arch on black field
tex.rotation = 0 (tip faces away from camera, legs open toward viewer)
```

### Gobo SpotLight Parameters
```
position  (-2.0, 16, 5.0)   — upper-left, behind camera plane
target    (0.5, 0, 1.5)     — foreground floor
angle     0.30 [v3] / 0.32 [v4]
penumbra  0.05               — crisp arch edge
intensity 30
decay     1.5
```

### Floor Layers (additive/transparent planes)
- `fogLayerMesh` — indigo breath (y=0.018), opacity 0.27, centered
- `warmFogMesh` — amber foreground pool (y=0.017), additive, opacity 0.17, offset (1.2, 0, 3.8)
- `godRayMesh` — shaft volume column, positioned along beam midpoint (-0.6, 7.2, 3.1), additive

---

## VERSION HISTORY

### Pre-Quibla (legacy split rig — RETIRED)
- Single gobo key at intensity 72 → burned out arch edges, no shadow contrast
- Split rig attempt: key (55, no gobo) + arch accent (12) + ghost fill (4)
- Arch accent at intensity 6, aimed in front of cube
- Result: arch readable on floor but cube top face managed; overall scene too bright

### v1: Quibla of Light (64b7712)
**Philosophy introduced:** One dominant sacred shaft. Darkness is co-designer. Floor is the canvas.
- Gobo shaft: position (-2.0, 12, 5.0), intensity 45, angle 0.45, penumbra 0.3
- Gobo map: arch texture, `tex.rotation = Math.PI * 0.75` (tip rotated upper-right)
- Backlight (0x4040a0, 10) for FBO transmission
- Cold counter (0x0a1855, 6) for Deakins split
- Violet rim (0x8055f0, 6) for edge catch
- Prayer ambient: hemisphere (0x1a0830/0x0a1520, 0.28)
- AmbientLight: 0.16 — shadow has to mean something
- Result: Sacred shaft concept established. Scene too bright overall; arch blowing out top of cube face.

### v2: Fix Blowout (b5c10dd)
- Shaft intensity reduced: 45 → 20
- Position raised: y 12 → 16, z 5 → 5.0 (more overhead angle)
- Angle narrowed: 0.45 → 0.22 (tighter cone, less cube spill)
- `tex.rotation` adjusted for wider floor projection
- Result: Blowout fixed. But arch barely visible — too dim. Angle too tight; arch shape lost.

### v3: Arch Reads (b398f6b)
- Shaft intensity: 20 → 30
- Angle: 0.22 → 0.30 (wider, arch fills floor)
- Arch texture fill: 92% (archW = sz * 0.46) — "arch edge IS the cone boundary"
- `tex.rotation = 0` (natural orientation, tip away from camera)
- Ambient raised slightly to 0.28
- Violet rim tightened (angle 0.18) — cleaner rim, no floor spill
- Internal glow (uInternalGlow = 0.14) added to shader — warmth at Fresnel edges
- godRay plane added (volume along beam path)
- warmFogMesh (amber) added — sacred warmth counterbalances cold indigo
- Result: Scene much better. Dark, soul, cube not blown. But arch reads as diagonal light boundary, not pointed arch shape. 92% fill clips arch silhouette — cone boundary IS the arch edge.

### v3b: Review Notes (reference screenshot)
Per artist description:
- Scene dramatically darker — correct
- Cube top face: blue/glass quality — correct
- Prayer beams pop against dark floor — correct
- Violet rim gives back-left edge definition — correct
- Arch pool: hits from upper-left, extends lower-right
- PROBLEM: arch not readable as pointed arch — looks like diagonal light boundary
- PROBLEM: light pool extends off-screen lower-right
- PROBLEM: pointed tip not visible
- ROOT CAUSE: 92% fill means arch edge ≈ cone boundary; no dark frame projects → no arch silhouette

### v5: Clear the Arch Floor (current — acfc491)
**ROOT CAUSE IDENTIFIED:** floor caustic PointLights at z=0.9–1.5 (red i5.2 / orange i4.8) were flooding the gobo cone footprint with saturated warm light. The dark frame of the arch (the 22% margin each side) was being filled by these lights — no arch silhouette could project against that noise. The floor read as a red/crimson blob, not an arch.

- **Floor caustics — primary fix:** warm group (red/orange/yellow) repositioned to z=–0.3–0.2 directly under cube base, distance capped at 1.0–1.2u. They now create a warm pool under the cube (physically correct: prism casts colour at its base) without reaching the arch projection zone.
- **tawafSpot.distance = 4.5:** white intensity-12 spot was spilling through the cube (no castShadow) onto the arch floor at ~5.7u. Capped at 4.5u.
- **Gobo intensity 30→40:** stronger punch through residual floor contributions.
- **warmFogMesh:** opacity 0.17→0.07, z 3.8→7.0 — moved completely past the arch zone.
- **godRay:** width 0.26→0.55, opacity 0.09→0.14 — more air-mass presence.
- Expected: pointed arch silhouette on floor, warm-white interior, dark frame flanking.

**Key lesson:** Any light touching the dark frame zone (outside the arch, inside the cone) destroys the silhouette. Light purity in the cone footprint is non-negotiable. Audit ALL lights' reach into the gobo cone footprint — not just the gobo itself.

### v4: Arch Silhouette Fix
- **PRIMARY FIX:** archW reduced from `sz * 0.46` to `sz * 0.28` (56% canvas fill)
  - Old: arch nearly fills entire cone → edge reads as hard diagonal cone cutoff
  - New: arch surrounded by ~22% dark margin each side → arch silhouette projects clearly
  - Both arch legs AND pointed tip now contained within cone → full arch shape on floor
- **SECONDARY:** gobo.angle widened slightly 0.30 → 0.32 to show dark frame projection
- Expected: pointed tip reads in mid-floor, legs visible near camera, dark framing flanks arch

---

## KEY DECISIONS LOG

| Decision | Reason |
|----------|--------|
| Gobo texture on SpotLight.map | Only Three.js-native gobo technique; no post-processing overlay needed |
| Arch fill ≤ 60% of texture | <60% = dark frame projects; ≥80% = silhouette lost, reads as blob |
| Low ambient (0.16) | Shadow must mean something — Tadao Ando principle |
| tex.rotation = 0 | Tip away from camera, legs toward camera = natural floor projection of arch |
| cubeSun at intensity 105 | FBO captures scene behind glass; without bright source there, dispersion is invisible |
| FBO / RenderTarget for glass | No real-time raytracing; FBO + per-channel IOR offset produces convincing dispersion |
| Warm gobo + cold counter | Deakins warm/cold split — depth without extra geometry |
| godRay plane additive | Air-mass for shaft; additive so it never darkens the scene, only adds luminosity |
| Penumbra 0.05 on gobo | Crisp arch edge on floor; penumbra would soften the silhouette |

---

## OPEN QUESTIONS / FUTURE ITERATION

1. **Arch tip sharpness** — current bezier produces gently curved ogee. Consider steeper control points for more dramatic pointed arch silhouette (like Mamluk horse-shoe arch).
2. **Floor reflectivity** — floor material is roughness 0.88. A slight specular (metalness 0.05, roughness 0.65) could add wet-stone shimmer without killing the sacred mood.
3. **Gobo colour warmth** — currently `0xfff4d6` (very slight warm). Consider `0xffc870` for more candlelight amber if the arch needs to read warmer against the cold counter.
4. **Gobo intensity pulse** — subtle breath animation on `gobo.intensity` (± 2 around 30) to simulate candle/lantern flicker. Don't do it with `uOpacity` (that's fog); do it directly on the SpotLight.
5. **Prayer beam / arch interaction** — arch should recede when prayer beams activate. Future: `gobo.intensity` lerps down during prayer window.
6. **Arch rotation per prayer** — each prayer could project a different arch rotation, symbolically "turning" toward the prayer direction.
7. **Shadow map resolution** — currently 2048 on desktop, 1024 on mobile. 4096 on desktop would give sharper arch edges but may stress GPU. Test.
8. **Cube rotation** — `prismGroup.rotation.y = Math.PI/4`. At this angle, the cube presents a corner toward camera — edges catch the most light. Best for dichroic at grazing angles.
