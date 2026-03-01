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

### v6: Fix Light Leak + Force Arch Visible (current — client feedback v41)

**CLIENT FEEDBACK (Tawfeeq, Feb 28 2026, agiftoftime.app):**
- "I see a big light leak line artifact left of the cube"
- "I still don't see the top of the arch and shape of arch on my phone"

**ROOT CAUSE — Light Leak:**
`godRayMesh` — a 0.55 × 13m vertical `PlaneGeometry` at (-0.6, 7.2, 3.1), rotation.y = PI×0.10 — was reading as a hard bright diagonal streak on mobile. Camera at (0.2, 9.7, 15) sees the plane nearly edge-on; its 13m height + warm white additive shader at opacity 0.14 produced a very visible glowing line to the upper-left of the cube. The "air-mass" volumetric concept doesn't translate to a billboard plane at this angle.
- **Fix:** `godRayMesh.visible = false`. The shaft volume is now carried by the boosted gobo and arch floor stamp.

**ROOT CAUSE — Arch Invisible:**
PBR irradiance math: gobo (intensity 40, decay 1.5) at distance 16.6m delivers only `40 / 16.6^1.5 ≈ 0.59` — multiplied by cos(18°) × floor albedo 0x18182a (≈0.071) = **~0.04 diffuse contribution**. This is entirely buried under the additive spectral clock hand rays (AdditiveBlending, opacity 0.88–0.92). After AgX tonemapping, the arch pool was invisible.
- **Fix A:** Gobo intensity 40→80, decay 1.5→1.0 → irradiance at floor now `80/16.6 × 0.953 ≈ 4.6`, floor contribution ≈ 0.33 — clearly above noise.
- **Fix B:** Arch floor stamp — `MeshBasicMaterial` plane (9×9m) with arch texture, AdditiveBlending, opacity 0.45, warm gold (0xffe080). Bypasses PBR shading entirely: arch interior (white in texture) adds warm gold directly; black exterior contributes 0 (no pollution of dark frame). UV orientation verified: canvas flipY + rotation.x=-PI/2 → legs (canvas bottom) toward camera, tip (canvas top) away behind cube. Sacred arch read guaranteed on any phone.

**Key lesson:** SpotLight.map gobo PBR irradiance on a very dark floor (albedo 0x071) cannot compete with AdditiveBlending floor effects unless intensity is extreme. Belt-and-suspenders: keep the gobo for realistic PBR shadow + light, but always back it with an additive stamp at the same target position.

### v9: Oblique Arch — legs hidden, projection angled (current)

**CLIENT FEEDBACK (Tawfeeq, Feb 28 2026):**
- "I don't want to see the bottom of the arch in frame"
- "Find a composition where the arch doesn't project so straight on"

**ROOT CAUSE — Legs in frame:**
`baseY = sz * 0.99` drew arch legs to the canvas bottom edge. With stamp centered at z=1.5 and plane height 7–9m, the leg texture mapped to world z≈5–6m — directly in the lower-frame foreground. Camera at z=15 sees z=5–6 at the bottom of the viewport. Both problems (legs visible, straight-on composition) trace back to the same origin: stamp centered close to camera, axis-aligned, legs filling near plane.

**Fix A — Clip the legs from texture:**
`baseY = sz * 0.62` (was `0.99`). Legs now stop at 62% down the canvas; the bottom 38% is black. In additive blending, black = 0 contribution — no arch feet in frame, no matter where the stamp is positioned. The arch reads as an OPENING (arch body + tip) rather than a full architectural element with feet on the floor. This is compositionally correct: you are INSIDE or oblique to the arch, not standing in front of it.

**Fix B — Oblique rotation:**
`archBloomMesh.rotation.set(-Math.PI/2, Math.PI*0.22, 0)` and same for `archFloorMesh`. The `rotation.y = Math.PI*0.22` (~40°) in XYZ Euler order rotates the flat horizontal arch pattern around world Y after it's been laid flat by Rx(-PI/2). Result: arch tip points to back-left (-0.635, 0, -0.772 direction), legs exit toward front-right. Light comes through the arch like a side-window, not a straight overhead slot.

**Fix C — Reposition stamps behind cube:**
`position.set(-0.5, 0, -1.0)` (was `(0.5, 0, 1.5)`). Stamp center is now behind and left of the cube. Arch legs (at short baseY=0.62) end at world ~(0.19, 0, -0.17) — right at the cube base where the cube geometry partly occludes the floor. Arch tip lands at ~(-2.5, 0, -3.5) — deep back-left, appears upper-left in frame.

**Fix D — Gobo swung far left:**
`gobo.position.set(-6, 16, 3)` (was `(-2.0, 16, 5.0)`). Target: `(-0.5, 0, -1.0)`. Throw distance ~17.4m (similar), decay 1.0 unchanged — floor irradiance maintained. Extreme lateral position means the PBR gobo shadow is genuinely oblique: cone footprint elongated across the floor, shadow hard on the left flank, arch interior lit from the left. Angle widened 0.32→0.35 to cover the wider oblique footprint.

**Expected composition:**
- Upper-left: arch body and tip glow amber against dark floor, deep in mid-ground
- Center: cube lit from left by oblique gobo, Deakins warm/cold split sharpened (gobo more lateral = more cube-left warmth)
- Lower/right foreground: deep indigo shadow — no arch legs, no stamp edge visible
- Overall read: light coming through an arch opening from the left, as if the viewer is partially inside the aperture or looking across the sacred space

**Key principle learned:** "Straight-on" arch = stamp centered on camera axis, legs toward viewer. To break it: rotate stamp Y + swing gobo lateral + push stamp center behind the focal subject (cube). Three independent moves that all reinforce the same directional read.

### v8: Two-Layer Arch + Cube Glow

**V7 render diagnosis:**
- Arch stamp shape reads correctly (v4/v6 progress intact) — silhouette is there.
- **Problem A: arch interior reads grey-warm, not amber.** Stamp at opacity 0.14, color 0xffaa40 on a dark floor delivers ~(0.14, 0.093, 0.035) additive. PBR gobo adds ~0.20 irradiance. Combined arch interior is dim and desaturated — not "sacred pool," more "painted mark."
- **Problem B: decal look.** Hard arch edge with low overall luminosity reads as a printed sticker, not projected light. Projected light has a luminous interior with atmospheric glow around it (Nasir al-Mulk: light scatters in the air around the pool).
- **Problem C: cube cold and disconnected.** `uInternalGlow` at 0.14 is too subtle. The cube's Fresnel edges don't warm — cube reads cold/blue, visually severed from the warm arch below.

**Fix A — Two-layer arch stamp:**
- `archBloomMesh`: PlaneGeometry 9×9, same arch texture, color `0xff7020` deep orange-amber, opacity 0.07, renderOrder 1. This creates a wider, dimmer version of the same arch shape — atmospheric halo that bleeds beyond the hard stamp edge.
- `archFloorMesh` (base stamp): 5×5 → **7×7**, opacity 0.14 → **0.20**. With saturated amber color, stacking gobo (0xffc870) + stamp (0xffaa40) stays warm not grey (both are saturated amber, not near-white — confirmed v7 lesson).
- AdditiveBlending: black areas of BOTH layers contribute 0 → dark frame not contaminated by bloom.

**Fix B — Gobo intensity: 50 → 60:**
Floor irradiance now `60/16.6 × cos18° × albedo0.071 ≈ 0.24`. More PBR arch on the floor; dark frame shadow deepens proportionally (the arch silhouette contrast ratio holds).

**Fix C — `uInternalGlow`: 0.14 → 0.24:**
Cube shader: `glowCol = mix(amber, deepOrange, glowFresnel) × 0.24 × (0.2 + 0.8×glowFresnel^2.5)`. At grazing angles (where dichroic reads strongest), warm amber visibly catches the cube edges. Cube is now lit by the same warm shaft system as the arch — visual coherence restored.

**Expected result:**
- Sacred pool: warm amber interior with outer atmospheric corona, reads as glowing not stamped
- Cube: warm amber Fresnel edges, dichroic iridescence on lit faces — tied to the arch
- Deakins split: cube left-warm/right-cold contrast sharpens (more gobo hits cube left face)
- Dark floor: flanks and mid-frame remain deep indigo — Tadao Ando principle holds

**Two-layer arch math:**
arch interior total contribution: gobo PBR ~0.24 + base stamp (0.20×0xffaa40) + bloom (0.07×0xff7020) ≈ warm amber at tonemapped luminance ~0.55 — visibly glowing, not blown.
bloom "halo" region (between 7m and 9m footprints): bloom only at 0.07 = very soft ambient warmth around arch base = atmospheric scatter in Nasir al-Mulk sense.

---

### v7: Tame the Floor Blob

**ROOT CAUSE — v6 overcook:** Two simultaneous contributions to the arch interior (PBR gobo at intensity 80 + additive stamp at opacity 0.45) stacked enough luminosity to saturate AgX tonemapping. The "warm gold" (0xffe080) + near-white gobo (0xfff4d6) averaged to a desaturated neutral grey — the arch interior read as a grey-white blob, not warm amber. The sacred darkness was gone. The dark frame was invisible because the whole floor zone was high-key.

**Fix A — Gobo intensity and colour:**
- Intensity: 80 → 50 (floor irradiance: ~50/16.6 × cos18° × albedo0.071 ≈ 0.20 — still above ambient noise floor, arch interior illuminated)
- Colour: `0xfff4d6` (near-white) → `0xffc870` (candlelight amber). Near-white was washing both arch interior and cube top towards neutral grey. Saturated amber pulls Deakins warm/cold split apart: gobo → warm amber left, coldCounter → deep blue right. Contrast reads as cinematic even on mobile OLED.

**Fix B — Arch stamp scale and opacity:**
- PlaneGeometry: `9×9` → `5×5` (arch interior now ~2.8m wide × 4.75m tall — human-scale, not landscape-scale)
- Opacity: `0.45` → `0.14` — stamp is accent only. PBR gobo does the structural work; stamp guarantees arch warms through additive hand rays.
- Colour: `0xffe080` (pale desaturated gold) → `0xffaa40` (deeper saturated amber). Survives AgX tonemapping as *warm* rather than grey-neutral.

**Expected result:**
- Sacred darkness restored (v5 mood)
- Arch interior: warm amber pool, ~2.8m wide, stamped on foreground floor
- Dark frame: dark indigo flanks either side of arch (≥22% margin = ≥1.1m of true shadow)
- Cube top: candlelight amber from gobo, cold blue counter from coldCounter — Deakins split visible on glass faces
- Prayer beams: unchanged, pop against restored dark floor

**Key lesson (gobo colour matters):** A near-white gobo (0xfff4d6) plus a pale gold additive stamp (0xffe080) compounds into neutral grey under AgX. Use SATURATED warm colours in both so the combined result reads as warm amber not grey. This is the same principle as Nasir al-Mulk's glass — the colour only reads if it's saturated enough to survive the optical mix.

---

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
| godRay plane additive | ~~Air-mass for shaft~~ RETIRED v6 — plane reads as hard diagonal streak when camera sees it edge-on |
| Arch floor stamp (additive) | Belt-and-suspenders behind SpotLight.map gobo: MeshBasicMaterial + AdditiveBlending bypasses PBR irradiance math. Dark floor albedo (0x18182a) is too absorptive for gobo PBR alone to compete with additive spectral hands |
| godRayMesh billboard | Don't use vertical PlaneGeometry for volumetric shafts — edge-on = artifact. Use horizontal layers or true billboarding instead |
| Stamp + gobo colour saturation | Near-white gobo + pale gold stamp = grey blob under AgX. Use saturated colours: gobo `0xffc870` candlelight + stamp `0xffaa40` deep amber. Same principle as Nasir al-Mulk glass — saturation must survive the optical mix |
| Stamp opacity ceiling ~0.15 (near-white) | When gobo+stamp are BOTH near-white, above 0.15 → grey blob. With SATURATED amber on both, 0.20 base + 0.07 bloom is safe — the combined colour stays warm not neutral. Saturation is the unlock. |
| Two-layer arch (base + bloom) | Base stamp (7×7, 0.20) = hard arch silhouette. Bloom (9×9, 0.07) = atmospheric halo beyond edges. Same arch texture for both; additive black = 0 so dark frame stays dark. Nasir al-Mulk principle: light scatters around the pool. |
| Penumbra 0.05 on gobo | Crisp arch edge on floor; penumbra would soften the silhouette |

---

## OPEN QUESTIONS / FUTURE ITERATION

1. **Arch tip sharpness** — current bezier produces gently curved ogee. Consider steeper control points for more dramatic pointed arch silhouette (like Mamluk horse-shoe arch).
2. **Floor reflectivity** — floor material is roughness 0.88. A slight specular (metalness 0.05, roughness 0.65) could add wet-stone shimmer without killing the sacred mood.
3. ~~**Gobo colour warmth**~~ — RESOLVED v7. Gobo colour set to `0xffc870` candlelight amber. Near-white was graying out the floor; saturated amber read confirmed.
4. **Gobo intensity pulse** — subtle breath animation on `gobo.intensity` (± 2 around 30) to simulate candle/lantern flicker. Don't do it with `uOpacity` (that's fog); do it directly on the SpotLight.
5. **Prayer beam / arch interaction** — arch should recede when prayer beams activate. Future: `gobo.intensity` lerps down during prayer window.
6. **Arch rotation per prayer** — each prayer could project a different arch rotation, symbolically "turning" toward the prayer direction.
7. **Shadow map resolution** — currently 2048 on desktop, 1024 on mobile. 4096 on desktop would give sharper arch edges but may stress GPU. Test.
8. **Cube rotation** — `prismGroup.rotation.y = Math.PI/4`. At this angle, the cube presents a corner toward camera — edges catch the most light. Best for dichroic at grazing angles.
