# CHRIS LOOKDEV AUDIT — v167
## Seven Heavens Studio — agiftoftime.app
### Chris, Lookdev Artist — March 3, 2026

---

## EXECUTIVE SUMMARY

The scene has matured considerably since the early arch-lighting iterations. The "Quibla of Light" concept is now mostly expressed through the prayer window polar discs rather than the gobo system (arch disabled at v80). The glass cube shader is sophisticated — per-channel IOR dispersion, thin-film iridescence, Fresnel edges, world-space specular. The podium reads as polished obsidian. Overall the scene is dark, moody, and sacred. But there are several areas where the lookdev can be tightened.

**Rating: 7.5/10** — Good foundation, needs polish in 5 specific areas.

---

## 1. GLASS CUBE DICHROIC SHADER — DETAILED REVIEW

### What's Working
- **Per-channel IOR** (R:1.50, G:1.56, B:1.63) creates visible chromatic dispersion. The spread is physically plausible for heavy optical glass.
- **FBO refraction** technique is solid — rendering the scene without the cube, then sampling that texture with per-channel UV offsets. This is the right approach for real-time glass.
- **Thin-film iridescence** via `thinFilm()` function — RGB phase offset from cos(theta). Clean implementation.
- **Edge catch** at `pow(1.0 - NdotV, 4.5) * 1.80` — gives razor-sharp silhouette definition. "You could cut yourself on this glass" — good.
- **Shadow-side fill** (line ~644-648) — subtle cool blue on faces away from key. Prevents dark-side faces reading as opaque solid. Smart.
- **Top-face dichroic** (lines ~672-680) — thin-film color shift on the top face at `topFace * 0.40` blend. This was apparently iterated heavily; current values match the v155 "scored 8.9" approach.

### Issues & Improvements

#### A. Bottom Face — Blowout Risk (CRITICAL)
**Current state:** Lines 685-689:
```glsl
float bottomFace = smoothstep(-0.5, -0.92, Nw.y);
col += vec3(0.35, 0.45, 0.7) * bottomFace * 0.25;
float bottomRim = smoothstep(-0.7, -0.98, Nw.y) * (1.0 - smoothstep(-0.98, -1.0, Nw.y));
col += vec3(0.6, 0.7, 1.0) * bottomRim * 0.45;
```
The bottom-face glow and rim add `0.25 + 0.45 = 0.70` units of additive blue-white to the bottom face. Combined with:
- `bottomAtten` (line 614) only reduces transmission by 55% at Nw.y = -0.95, leaving 45% of `refracted * 1.7`
- `cubeSun` at intensity 35 positioned at (0, 0.2, -2.8) — directly behind/below the cube
- `sideFacing * 0.22` also contributes on vertical edges near the bottom

**Diagnosis:** The bottom face is getting hit from THREE additive sources: residual transmission through `bottomAtten`, the explicit `bottomFace` glow, and the `bottomRim` catch. At certain camera angles (33° elevation, looking down at 45° rotation), these stack. The `bottomAtten` clamping at 55% is good but the additive glow/rim on top may push past AgX's shoulder.

**Recommendation:**
- Reduce `bottomFace` multiplier from `0.25` → `0.15`. The glow should separate the cube from podium but not compete with the top-face dichroic.
- Reduce `bottomRim` from `0.45` → `0.25`. The rim should be a hint, not a feature.
- Or better: make `bottomFace` glow reactive to `cubeSun` intensity — when the sun is hot behind the glass, the bottom already glows from transmission. The additive glow is redundant and stacks.

#### B. Transmission Multiplier Too Aggressive
**Line 614:** `vec3 col = refracted * vec3(0.94, 0.97, 1.06) * 1.7 * bottomAtten;`

The `1.7` multiplier on refracted content is high. Combined with `cubeSun` at 35 intensity, the FBO captures a very bright backlight that gets amplified 1.7×. For a crystal/glass look, 1.3-1.4 would be more physically motivated — glass absorbs light passing through it. The blue tint `(0.94, 0.97, 1.06)` is correct (optical glass has a slight blue transmission bias), but the 1.7 boost fights the tint.

**Recommendation:** `1.7` → `1.4`, compensate with slightly higher `cubeSun` (35 → 42) if needed. This preserves the brightness but with more physically correct energy distribution — the scene behind the glass should be brighter, not the glass itself amplifying.

#### C. Specular Highlight — Needle is Good, Position is Odd
The spec light orbits at second-hand speed at radius 3.0, y=3.5. This creates a moving highlight that animates with the clock — conceptually nice. But:
- `pow(max(dot(Nw, Hw), 0.0), 256.0)` — specular power 256 is extremely tight. Good for a razor highlight.
- `fresnelW = pow(1.0 - NdotV, 4.0)` gates spec to grazing angles only — correct for glass.
- `uSpecIntensity = 2.8` — reasonable.

**No changes needed.** The orbiting spec is a nice touch.

#### D. Internal Glow Pathway
`uInternalGlow` defaults to 0.0 (off) in normal mode, only activates during Qibla alignment. The implementation (lines 662-665) uses Fresnel-gated emission. Clean. No issues.

#### E. Dichroic Band Width
`uDich = 0.70` and `diagF = exp(-abs(x + y) * 7.0) * 0.70`. The diagonal band is tight (7.0 falloff) which is good — dichroic shows on edges, not face-on. But `0.70` blend strength is high. Real dichroic glass at this thickness would show ~30-40% color shift. Consider `0.50` for subtlety.

**Recommendation:** `uDich: 0.70` → `0.55`. Subtler = more premium.

---

## 2. LIGHTING RIG — CURRENT STATE

### Active Fixtures (v167)
| Fixture | Type | Color | Int | Status |
|---------|------|-------|-----|--------|
| `back` | SpotLight | `0x4040a0` | 10 | ✅ Active — FBO transmission |
| `cubeBack` | SpotLight | `0xffeedd` | 7 | ✅ Active — Swarovski backlight |
| `coldCounter` | SpotLight | `0x0a1855` | 6 | ✅ Active — Deakins split |
| `violetRim` | SpotLight | `0x8055f0` | 6 | ✅ Active — edge catch |
| `ghostFill` | PointLight | `0x0c0520` | 0.5 | ✅ Active — floor separation |
| `prayerAmbient` | Hemisphere | warm/cool | 0.18 | ✅ Active — shadow fill |
| `rim` | SpotLight | `0x8060c0` | 5 | ✅ Active — back-edge |
| `cubeSun` | PointLight | `0xe8f2ff` | 35 | ✅ Active — dispersion source |
| `tawafSpot` | SpotLight | white | 8 | ✅ Active — orbiting catch |
| `ambient` | AmbientLight | white | 0.07 | ✅ Active |
| `podiumFrontWash` | SpotLight | `0xc0a880` | 12 | ✅ Active |
| `podiumLowFill` | SpotLight | `0x606080` | 4 | ✅ Active |
| `gobo` | SpotLight | `0xffc870` | 6 | ❌ Disabled (v80) |
| `godRay` | ShaderMaterial | warm | 0.14 | ❌ Disabled (v6) |
| `archBloom` | MeshBasic | `0xff7020` | 0.12 | ❌ Disabled (v80) |
| `archFloor` | MeshBasic | `0xffaa40` | 0.20 | ❌ Disabled (v80) |
| `shaftMesh` | ShaderMaterial | `0xffc870` | 0.07 | ❌ Disabled (v80) |

### Observations

#### A. Dead Code / Disabled Fixtures
6 fixtures are instantiated, textured, and added to materials but never added to the scene (`// v80: arch disabled`). The arch gobo textures are still generated (1024×DPR canvas each) — that's wasted memory and startup time. Two arch textures × 1024×3 (DPR 3) = 2× 9.4MP canvases = ~113 MB on high-DPR devices. **Recommend removing the dead arch code entirely or gating it behind a feature flag.**

#### B. Lighting Feels Flat From Above
With the arch system disabled, the primary drama source is gone. What remains is:
- `cubeSun` behind glass (dispersion)
- `back` backlight (FBO content)
- `cubeBack` (transmission)
- `coldCounter` (Deakins split)
- `violetRim` + `rim` (edge catches)

This is a solid crystal photography setup, but the "Quibla of Light" drama — the one dominant sacred shaft — is gone. The prayer discs now carry the color and emotional weight, but the scene lighting itself is even/symmetric. The Deakins warm/cold split works, but without the oblique key light, it's a museum display case, not a mosque interior.

**Recommendation:** Consider a single soft overhead key — not the full arch gobo, just a subtle warm SpotLight from upper-left (like the original gobo position) at low intensity (~2-4), no gobo map, just directional warmth. This would restore the asymmetric "light is coming from somewhere sacred" feel without the arch complexity.

#### C. `tawafSpot` Orbit
The tawafSpot orbits at second-hand speed at radius 3, y=3.5. At intensity 8 with angle 0.4 and penumbra 0.9, it's a soft wash. But it's orbiting the cube at the same speed as the specular highlight — two lights at the same frequency creates a resonance that could read as artificial. Consider offsetting the tawaf orbit to 0.7× second speed (a liturgical tawaf is 7 circuits — a 7:10 ratio against clock seconds would be poetic).

---

## 3. PODIUM — POLISHED OBSIDIAN

### Current Implementation
- Box geometry, 2.64 wide (2.2× cube), 20 units tall
- 6 `MeshPhysicalMaterial` faces with different emissive values
- `roughness: 0.35, metalness: 0.06, clearcoat: 0.5`
- Key face (+x) has emissive `0x606098` at intensity 3.5 — this is the camera-visible face

### Issues

#### A. Emissive Values Are High
The +x face (key face) at emissive `0x606098` × intensity 3.5 = significant self-illumination. For "polished obsidian," the surface should be reflecting scene light, not emitting its own. The emissive acts as a cheat to make the podium visible in the dark scene, but it flattens the material — obsidian should be mirror-dark with sharp highlights, not glowing.

**Recommendation:**
- Reduce emissive intensity on all faces by ~60%
- Increase `clearcoat` to 0.7-0.8 and `clearcoatRoughness` to 0.04 — let scene lights create real reflections
- Add `reflectivity: 1.0` — obsidian is highly reflective at grazing angles
- The podium should catch the prayer disc colors through real light interaction, not fake glow

#### B. Top Face Could Catch Cube Light
The top face (+y) has `roughness: 0.15, clearcoat: 0.8, clearcoatRoughness: 0.06` — this is the most mirror-like face. Good instinct. But with emissive `0x141428` at 0.8, the emissive competes with real light pools. At roughness 0.15, the cube's transmitted light should create a visible reflection/pool on the podium top. Killing the emissive here and trusting scene light would look more physically correct and tie the cube to the podium optically.

---

## 4. PRAYER WINDOW POLAR DISCS

### Architecture
Three `CircleGeometry` discs (active, next, third) with polar sector shader. Fragment shader computes angle-based fan with exponential radial falloff and flat-top angular mask. Clean implementation.

### What's Working
- `uHoleSize: 0.74` — inner cutout prevents disc from bleeding into cube base. Good.
- `uFalloff: 2.2` — exponential radial decay. Prayers glow near the cube and fade into darkness. Physically motivated.
- Color interpolation across fan width — subtle dichroic effect within each prayer window.
- Three-layer system (active at full OP, next dimmer, third dimmer still) — information hierarchy.

### Issues

#### A. OP_ACTIVE = 1.2 — Too Hot?
Additive blending at opacity 1.2 means the prayer disc contributes MORE than 100% of its color to the frame. On top of floor caustics, fog layers, and hand beams, this stacks fast. During active prayer times with a beam and hands overlapping, the floor zone near 6 o'clock could be blown.

**Recommendation:** Audit the 6 o'clock convergence zone at each prayer time. If blown, reduce `OP_ACTIVE` to 0.9-1.0 and compensate with `uFalloff: 1.8` (slower decay = wider glow at lower peak intensity).

#### B. Second Hand Opacity Reduction During Prayer
Lines 1643-1645:
```js
const secBase = _prayerDisc.visible ? 0.40 : 0.62;
```
Good catch — reducing the white second hand when it's over a colored prayer beam prevents additive blowout. But 0.40 is aggressive — the second hand loses readability. `0.50` might balance better.

---

## 5. FLOOR ATMOSPHERE

### Fog Layer
- Indigo fog (`0x1a2888`) at opacity 0.27, radial falloff from center — `smoothstep(0.15, 1.0, dist)`. Breathing at 0.6 Hz. Clean.

### Warm Fog
- Amber (`0x9e4200`) at opacity 0.09, additive, offset to foreground (z=7.0). Far enough from cube to not interfere. Good separation.

### Floor Caustics
7 colored PointLights near cube base simulating prism dispersal. Positions tightened since v5 — all within 1.8 units of center. Intensity values (0.7-1.6) are reasonable. **No blowout risk at current values.**

### Observation
The warm fog at z=7.0 is positioned quite far into the foreground. With the camera at z=15 and lookAt at z=1.0, z=7.0 is in the lower third of the frame. The warm amber there counterbalances the cold indigo center — good principle. But the effect is subtle at 0.09 opacity. Consider whether it's earning its draw call.

---

## 6. SCENE-LEVEL CONCERNS

### A. Fog Density
`scene.fog = new THREE.FogExp2(0x0d0d12, 0.035)` — exponential fog at density 0.035 with the scene background color. At the camera distance of ~15 units, fog factor = `exp(-0.035² × 15²) ≈ exp(-0.276) ≈ 0.76` — so objects at camera distance retain ~76% of their color. The cube at ~15 units from camera loses ~24% to fog. This is subtle but correct — adds depth. **No change needed.**

### B. Tone Mapping
`AgXToneMapping` at exposure 0.95. AgX is the right choice — it handles saturated colors better than ACES Filmic (which desaturates at high intensity). Exposure 0.95 is slightly under neutral — darkens the overall scene by ~5%. Combined with the already-dark lighting, this might crush shadow detail. 

**Recommendation:** Consider `1.0` exposure and trust the lighting to control darkness. The 0.95 was set in v57 to "darken outside arch" but the arch is now disabled.

### C. Memory: Dead Arch Texture Generation
`_makeArchTexture()` and `_makeArchOutlineTexture()` are called at module load (lines 148 and 207). The outline texture is only used by a removed mesh, and the fill texture is only used by disabled meshes. These generate large canvases on every page load.

**Recommendation:** Remove or lazy-gate behind arch feature flag.

---

## PRIORITY ACTIONS (if approved)

| # | Area | Action | Impact | Risk |
|---|------|--------|--------|------|
| 1 | Bottom face | Reduce `bottomFace * 0.25 → 0.15`, `bottomRim * 0.45 → 0.25` | Fixes blowout | Low |
| 2 | Dead code | Remove/gate arch texture generation + disabled meshes | Saves ~113MB RAM on hi-DPR | Low |
| 3 | Podium emissive | Reduce emissive ~60%, increase clearcoat | More physically correct obsidian | Medium |
| 4 | Tone mapping | Exposure 0.95 → 1.0 | Recover shadow detail | Low |
| 5 | Dichroic strength | `uDich 0.70 → 0.55` | Subtler, more premium | Low |
| 6 | Transmission mult | `1.7 → 1.4` | More physically correct glass | Medium |
| 7 | Asymmetric key | Add soft overhead warm SpotLight (no gobo) | Restore sacred shaft feel | Medium |

---

## WHAT I'D LEAVE ALONE

- Edge catch at 1.80 — it's aggressive but it works. The cube needs to "cut" the dark scene.
- Specular orbit at second-hand speed — conceptually clean.
- Prayer disc architecture — the three-layer system with polar shaders is elegant.
- Floor caustic positions — well-placed, not stacking.
- Warm/cold fog separation — good atmospheric principle.
- Camera angle at 33° elevation, FOV 35° telephoto — the cube reads beautifully at this framing.

---

*— Chris, Lookdev Artist, Seven Heavens Studio*
*Audit completed March 3, 2026. No code changes made. All recommendations pending chef approval.*
