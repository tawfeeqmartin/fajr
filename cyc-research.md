# Cyclorama Research — AGOT Glass Cube Scene
## Seven Heavens Studio — Lookdev R&D, March 2026

---

## 1. STUDIO CYCLORAMA FUNDAMENTALS

### What a Cyc Is
A cyclorama (cyc) is a seamless curved backdrop that eliminates the horizon line between floor and wall. In physical studios, it's a plastered or fabric wall with a concave cove radius at the floor junction. The key optical effect: the camera cannot perceive where the floor ends and the wall begins — the subject appears to float in infinite space.

### Cove Radius
- **Standard studio cove radius:** 1.0–2.0m (3–6 ft) for product photography
- **Large VP stages:** 3–5m radius coves (e.g., ILM StageCraft, Pixomondo)
- **The curve matters more than size** — a tight radius (< 0.5m) creates a visible crease; too large wastes space. The sweet spot for product scale is **1.5–2.5× the subject height**
- For our cube (1.2 units tall), that maps to a cove radius of **1.8–3.0 world units**

### Cyc Distance Behind Subject
- **Product photography rule:** cyc wall face sits **2–4× subject width** behind the subject. Closer = visible texture/seams; farther = wasted light, darker falloff
- Our cube is ~1.2 units wide (1.7 diagonal at 45°). Ideal cyc wall distance: **3.5–7 units behind cube center** (z = -3.5 to -7)
- Key constraint: must be far enough that existing backlight fixtures (z = -5.5 to -5) sit BETWEEN cube and cyc

### Cyc Lighting (Studio Practice)
- **Cyc lights are separate from subject lights.** This is the cardinal rule. The cyc is lit independently so its brightness/gradient can be controlled without affecting the subject
- **Even wash vs gradient:** Product photography uses even wash for white/neutral cyc; dramatic VP uses graduated tone (bright horizon, dark top = "infinite depth")
- **Silhouette separation:** A cyc slightly brighter than the subject's dark side creates edge separation. A cyc darker than the subject's lit side preserves the key-side read
- **Colored cyc:** Subtle colored wash on cyc (not the subject) adds atmosphere without contaminating product color. Done with dedicated cyc strip lights or LED panels

### VP LED Volume Cyc Curves
- Virtual Production LED volumes (Mandalorian, House of the Dragon) use physical LED panels arranged in a curved wall, often with a curved LED ceiling
- The curve serves two purposes: (1) no visible seam/corner in reflections, (2) parallax-correct reflections as camera moves
- Key VP insight: **the cyc content doesn't need to be detailed — it's always out of focus.** Low-resolution gradients and color washes work better than sharp imagery because they avoid moire and look more natural in reflections
- VP stages typically curve from floor level to 6–8m height at ~120° arc (not a full cylinder)

---

## 2. CAMERA FRUSTUM ANALYSIS — WHAT THE CAMERA ACTUALLY SEES

### Current Camera Setup
```
Position:  (0.2, 9.7, 15.0)
LookAt:    (0, -0.8, 1.0)
FOV:       35° (telephoto)
```

### Geometry of the View
- **Camera elevation angle:** The vector from camera to lookAt is (−0.2, −10.5, −14.0). Elevation below horizontal = atan2(10.5, 14.0) ≈ **36.9°** downward
- **The camera is looking DOWN at ~37°** — this is a classic product photography overhead angle (not straight-on, not top-down)
- **FOV 35°** is telephoto — narrow field, minimal distortion, compressed depth. The visible vertical span at the cube's depth (z ≈ 0) is roughly ±17.5° from the look vector

### What's Visible Behind the Cube
- The look vector hits the ground plane (y = 0) at approximately z = 1.0
- Behind the cube (z < 0), the camera's upper frustum edge extends to roughly:
  - At z = −5 (where backlights are): visible y range ≈ **0 to 6** (camera sees this zone above the podium top)
  - At z = −10: visible y range ≈ **0 to 9**
  - At z = −15: visible y range ≈ **0 to 12**
- **The floor-to-wall transition (cove) at z = −5 to −8 would be visible if it starts at y = 0.** The camera can see the ground plane behind the cube.

### Critical Insight: Floor Transition Visibility
The camera at 37° downward WILL see the cove curve where the floor meets the cyc wall. Two strategies:
1. **Place the cove far enough back** that the podium (2.64 wide, top at y ≈ 0) occludes it
2. **Start the cyc above the visible floor line** — the podium + fog already handle the floor. The cyc only needs to fill the UPPER background behind the cube (y > ~1, z < −3)

Given the existing podium (2.64 × 20 tall box, top face at y ≈ 0) and the FogExp2 (density 0.035), the floor zone behind the cube is already dark and occluded. **The cyc primarily needs to fill the sky zone** — the area above the podium top, behind and around the cube, from roughly y = 0 to y = 10+.

### Visible Cyc Arc
From the 35° telephoto FOV:
- Horizontal visible width at z = −8: approximately **±5 units** (10 units total)
- The cyc needs to be at least **12–16 units wide** to fill frame with margin for any slight camera drift
- Height: **8–12 units** above floor level to fill the upper frame

---

## 3. INTERACTION WITH EXISTING LIGHTING

### Lights That Hit the Background (z < 0 zone)
| Light | Position | Direction | Impact on Cyc |
|-------|----------|-----------|---------------|
| `back` | (3, 3, −5.5) | → (0, 0.5, 0) | Aimed AT cube, away from cyc. Would backlight cyc if cyc is at z < −5.5 |
| `cubeBack` | (0.5, 10, −5) | → (0, 0.6, 0) | High, aimed at cube. Some spill onto cyc |
| `violetRim` | (−4, 9, −2) | → (0, 0.6, 0) | Camera-left, aimed at cube. Minimal cyc spill |
| `rim` | (−1.5, 5.5, −3.5) | → (0, 0.6, 0) | Behind cube, aimed forward. Backwash on cyc possible |
| `plinthSun` | orbiting, y ≈ 4.5 | → cube top | Animated. Could intermittently graze cyc |

### FBO Implications (CRITICAL)
The cube's dichroic glass effect works via FBO — it captures what's BEHIND the glass and refracts it. **Anything visible through the cube in the FBO pass will appear refracted inside the glass.** This means:
- A bright cyc behind the cube = bright refracted content inside the glass (potentially desirable — glass looks more transparent/alive)
- A colored cyc = colored refraction inside the glass (could conflict with prayer color system)
- The existing prayer accent lights are **disabled during FBO pass** (lines 2271–2278) specifically to avoid colored contamination. A cyc would need the same treatment OR be deliberately designed to enhance the FBO content

### Fog Interaction
- `FogExp2(0x0d0d12, 0.035)` — the fog color matches the scene background
- At z = −8, fog attenuation = e^(−0.035 × 8)² = e^(−0.078) ≈ 0.93 — barely visible
- At z = −15, fog = e^(−0.035 × 15)² = e^(−0.276) ≈ 0.76 — subtle darkening
- At z = −25, fog = e^(−0.035 × 25)² = e^(−0.766) ≈ 0.46 — significant
- **Fog helps blend the cyc edges** — cyc doesn't need sharp boundaries; fog will naturally fade it. But the cyc material should use `fog: true` to integrate, or `fog: false` if we want it to punch through as a deliberate backdrop

---

## 4. THREE PROPOSED OPTIONS

---

### OPTION A: MINIMAL CYC — Silent Gradient Wall

**Concept:** A dark, neutral curved plane that replaces the flat scene.background with a subtle vertical gradient. No color, no reactivity. The cyc exists to add depth perception — the brain reads a gradient as "distance" even when the values are very close. Think: Apple product photography — invisible but essential.

**Geometry:**
- Shape: Half-cylinder section, ~140° arc
- Radius: 12 units (center at origin)
- Height: 14 units (y = −2 to y = 12) — extends below visible floor to prevent gap
- Segments: 32 radial, 1 vertical (smooth curve, no detail needed)
- Position: centered at (0, 5, 0), opening faces +z (toward camera)
- The cyc wall sits at z ≈ −12 directly behind the cube

**Material:**
- `ShaderMaterial` with vertical gradient: bottom = `0x0d0d12` (matches scene.background exactly), top = `0x060608` (slightly darker — infinite void above)
- No emissive, no reflectivity — purely diffuse/unlit
- `fog: true` — blends naturally with scene fog at edges
- `side: THREE.BackSide` — camera sees the inside of the curve
- `depthWrite: false` — never occludes scene elements

**Lighting Interaction:**
- `back` SpotLight (at z = −5.5) sits between cube and cyc — its cone will graze the lower cyc, creating a subtle light pool. This is GOOD — it gives the cyc life without adding fixtures
- If light spill is too bright, the gradient shader can clamp or attenuate
- FBO pass: cyc is dark enough to be nearly invisible in refraction — glass reads the same as now

**Pros:** Zero performance cost. No disruption to existing lighting. Adds subtle depth.
**Cons:** Boring. Doesn't leverage the prayer window system. Barely noticeable.

---

### OPTION B: PRAYER-REACTIVE CYC — Sacred Atmosphere Wall

**Concept:** The cyc subtly shifts color temperature with the active prayer window. During Fajr, a barely-visible warm horizon glow. During Isha, deep indigo. The cyc becomes a "sky" that you feel more than see — like the difference between a windowless room and one where you can sense the time of day from ambient light on the walls.

**Geometry:**
- Same half-cylinder as Option A: 140° arc, radius 12, height 14
- Add a **floor cove extension:** a quarter-torus at the bottom edge (cove radius 3 units) that curves from vertical wall to horizontal floor plane. This creates the classic cyc sweep
- Cove is occluded by podium from camera angle — acts as smooth light catch, not visible geometry
- Total mesh: ~800 vertices (performance negligible)

**Material:**
- `ShaderMaterial` with two-zone gradient:
  - **Horizon band** (y = 0 to y = 3): faint colored glow, prayer-reactive. Color = desaturated version of current prayer window color at ~5% opacity
  - **Upper void** (y = 3 to y = 12): near-black, blends to scene.background
- Uniforms: `uPrayerColor` (vec3), `uPrayerIntensity` (float 0–1), `uTime` (float for subtle breathing)
- The color shift is SLOW (2–3 second lerp, matching `_plinthLerpRate`) and SUBTLE — max brightness of the horizon band = 0.08 (on a 0–1 scale)
- `fog: true`, `depthWrite: false`, `side: BackSide`

**Lighting Interaction:**
- FBO pass: the faint prayer color on the cyc WILL be captured by the FBO. At 5% brightness this is negligible, but it means the glass gets the faintest prayer tint in its refraction — actually beautiful. The glass subtly "knows" what time it is
- Alternatively: make cyc invisible during FBO pass (add to the existing prayer-light disable block) for zero contamination
- Existing back SpotLight wash on the cyc gets a prayer-tinted surface to bounce off — creates secondary color atmosphere in the scene without new lights

**Prayer Color Mapping (suggested):**
| Window | Cyc Horizon Color | Feeling |
|--------|-------------------|---------|
| Fajr | `0x1a1520` — pre-dawn violet-brown | Night dissolving |
| Sunrise | `0x2a1a10` — warm amber horizon | First light |
| Dhuha | `0x1a1a08` — golden haze | Morning clarity |
| Dhuhr | `0x0d0d12` — neutral (match bg) | Noon — no sky needed |
| Asr | `0x18140d` — amber fade | Afternoon warmth |
| Maghrib | `0x1a0d0d` — deep red-brown | Sunset glow |
| Isha | `0x0d0d1a` — deep indigo | Night sky |
| Tahajjud | `0x0a0810` — near-black violet | Deep night |

**Pros:** Adds temporal atmosphere. Ties into existing prayer color system. Very low performance cost.
**Cons:** Adds a uniform + lerp system to maintain. Risk of color contamination in FBO if not managed.

---

### OPTION C: ATMOSPHERIC CYC — Gradient + Volumetric Shafts

**Concept:** Option B's prayer-reactive gradient PLUS 2–3 faint volumetric light shafts that emerge from behind the cube, as if light is leaking through gaps in an unseen architecture beyond. The shafts reference the "Quibla of Light" concept — the idea that sacred light travels from a source you can't see. Think: Lubezki's light in *The Tree of Life* — you see the beams but not the window.

**Geometry:**
- **Cyc wall:** Same as Option B (half-cylinder, 140° arc, radius 12, height 14, cove)
- **Light shafts:** 2–3 tall, thin PlaneGeometry quads (each ~1.5 × 10 units), positioned behind the cube (z = −4 to −8), angled to fan outward from a convergence point below the cube
- Shafts use the existing shaft mesh approach (see godRayMesh at line 390) — AdditiveBlending ShaderMaterial with vertical falloff

**Material — Cyc Wall:**
- Same prayer-reactive gradient as Option B

**Material — Light Shafts:**
- `ShaderMaterial`, `AdditiveBlending`, `transparent: true`
- Vertical gradient: bright at base (y ≈ 0, just above podium top), fades to zero at y ≈ 8
- Horizontal gaussian: bright at center, soft edges
- Color: slightly warm white `0xfff4e0` — matches the Quibla of Light palette
- Animated: very slow sway (0.02 Hz sine on rotation), subtle pulse (0.05 Hz on opacity)
- Base opacity: 0.03–0.06 — these should be FELT, not seen. If you can clearly see them, they're too bright
- Prayer-reactive: shaft opacity scales with prayer intensity (brighter during active prayer, dimmer during transition)

**Position — Light Shafts:**
- Shaft 1: (−1.5, 5, −5) — camera-left, angled 8° right. Echoes the original gobo direction
- Shaft 2: (1.0, 5, −6) — camera-right, angled 5° left. Counter-shaft for balance
- Shaft 3 (optional): (0, 6, −7) — center, vertical. Creates a "pillar of light" behind cube

**Lighting Interaction:**
- Shafts use AdditiveBlending — they ADD to whatever's behind them. Against the dark cyc, they read as faint beams. Against bright areas, they boost
- FBO pass: shafts should be **hidden during FBO** (`visible = false`). Bright additive geometry behind the glass would create blown-out white patches in the refraction. The cyc gradient alone is fine for FBO
- Shafts can catch the existing backlight color — if back SpotLight has prayer-tinted color (via the `_plinthLooks` system), the shafts inherit that atmosphere

**Pros:** Most atmospheric. Directly extends the Quibla of Light concept. Creates genuine depth and mystery.
**Cons:** Most complex. 3 additional meshes + shaders. Risk of visual clutter — the scene's strength is restraint ("darkness as co-designer"). The existing godRay mesh was DISABLED (line 392) because it read as a "hard diagonal light leak" — these new shafts must avoid the same trap.

---

## 5. RECOMMENDATION

**Start with Option A, graduate to Option B.**

Rationale:
1. The scene's design philosophy is "darkness as co-designer" — restraint over spectacle
2. The current scene.background is a flat color (`0x0d0d12`). Even a neutral gradient cyc (Option A) is a significant upgrade in perceived depth
3. Option B's prayer-reactive color is the natural next step once A proves the geometry works
4. Option C's light shafts should only be attempted after A+B are validated — and even then, with extreme subtlety. The godRay disable precedent (line 392) is a warning

**Implementation order:**
1. Build the cyc geometry (half-cylinder, BackSide, depthWrite false)
2. Verify from camera angle — adjust radius/height until it fills frame cleanly
3. Add vertical gradient shader (dark top, scene-bg bottom)
4. Test FBO interaction — ensure glass refraction isn't disrupted
5. If A looks good: add prayer color uniform for Option B
6. If B looks good: experiment with one shaft for Option C (not three — start with one)

---

## 6. TECHNICAL NOTES FOR IMPLEMENTATION

### Cyc Geometry Construction
```
// Half-cylinder: CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)
// 140° arc centered behind cube (opening faces +Z toward camera)
// thetaStart = π + (π - 140°/2 in rad) = needs calculation
// Use BackSide so camera sees inner surface
```

### Shader Uniforms Needed
- `uGradientTop` (vec3) — color at top of cyc
- `uGradientBottom` (vec3) — color at bottom/horizon
- `uPrayerColor` (vec3) — prayer window color (Option B)
- `uPrayerIntensity` (float) — prayer color blend factor
- `uTime` (float) — for subtle animation
- `uFogColor` (vec3) — match scene fog for edge blending
- `uFogDensity` (float) — match scene fog density

### FBO Pass Considerations
- If cyc material has `fog: true`, it will darken with distance — may need to disable fog on cyc during FBO pass, or use a separate render layer
- Simplest approach: keep cyc on default layer, let it be captured by FBO. At the proposed dark values, the FBO impact is negligible
- If problems arise: add cyc to layer 1, exclude from FBO camera

### Performance Budget
- Half-cylinder mesh: ~64 vertices — negligible
- Shader: one gradient + one color uniform — negligible
- No shadow casting/receiving needed
- No texture sampling — pure math shader
- Total cost: < 0.1ms per frame
