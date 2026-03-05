# CHRIS-RESEARCH.md — Podium Slash Light Diagnosis

**Chris, Lookdev Specialist — Seven Heavens Studio**  
**Date:** 2026-03-04 · **Version:** v179 · **File:** glass-cube-clock.js  
**Brief:** "I couldn't see any light hitting the plinth for contrast lighting."

---

## 1. Root Cause Diagnosis

The prayerSlash SpotLight is invisible due to **three compounding problems**, not just one:

### Problem A: The Light is Hitting the Front Face at 84° (Nearly Parallel)

This is the **primary killer**. The math is damning:

- Light position: `(4.0, 1.0, 1.8)`
- Target: `(0, -1.5, 1.32)` — the front face (+z) of the podium
- Front face normal: `(0, 0, 1)`
- **NdotL = 0.101** → the light is nearly *parallel* to the front face

In PBR, diffuse contribution = `lightColor × surfaceColor × NdotL`. With NdotL = 0.1, you lose **90% of the light energy** before the surface color even factors in. The light is essentially edge-grazing the front face — it slides right past it.

**The irony:** From position `(4, 1, 1.8)`, the light actually hits the **RIGHT face** (+x) with NdotL = 0.656 — a perfectly usable 49° angle. The slash is painting the wrong face, or more precisely, it's positioned to paint the right face but *aimed* at the front face, getting the worst of both.

### Problem B: `0x12121c` Absorbs ~99% of Light Energy

In sRGB, `0x12121c` = `(18, 18, 28)`. In linear space (what the PBR shader actually uses):

| Color | Linear RGB | Diffuse @ intensity 14 | × NdotL 0.1 |
|-------|-----------|----------------------|-------------|
| `0x12121c` | (0.006, 0.006, 0.012) | (0.085, 0.085, 0.163) | **(0.009, 0.009, 0.016)** |
| `0x1e1e2e` | (0.013, 0.013, 0.027) | (0.182, 0.182, 0.382) | (0.018, 0.018, 0.038) |
| `0x252535` | (0.019, 0.019, 0.036) | (0.259, 0.259, 0.498) | (0.026, 0.026, 0.050) |
| `0x2a2a3a` | (0.023, 0.023, 0.042) | (0.324, 0.324, 0.592) | (0.033, 0.033, 0.059) |

The final column is what actually reaches the eye. **All values are under 0.06 in linear** — functionally invisible against any background, even after tone mapping. Increasing intensity to 40+ would help mathematically, but with 84° NdotL the surface can't catch enough light to render visible color.

### Problem C: Cone is Tight but Not Fatally So

- Cone half-angle: 0.14 rad (8°) → covers ~1.34 of 2.64 unit face width (51%)
- This is tight but workable — **not the primary problem**
- With penumbra 0.55, the edges fade out significantly, so the effective bright area is maybe 30% of the face

### Combined Effect

`0.006 (albedo) × 14 (intensity) × 0.101 (NdotL) × ~0.7 (penumbra falloff) ≈ 0.006`

That's a final linear luminance of ~0.006. The monitor can't distinguish this from black. **The light IS hitting the podium** — it's just producing values so close to zero that they're invisible.

---

## 2. Why Clearcoat Specular Doesn't Save It

The podium has `clearcoat: 0.5, clearcoatRoughness: 0.12`. At 84° incidence, Fresnel reflectance jumps to **60%** — which sounds promising. But:

1. Clearcoat specular is a **mirror-like highlight**, not a diffuse wash. It only appears where the reflection of the light toward the camera aligns perfectly
2. At clearcoatRoughness 0.12, the specular lobe is tight — a small bright streak, not a visible "slash"
3. The camera likely doesn't intersect the reflection path from this geometry, so the specular never appears
4. Even if visible, it would be a tiny white-ish glint, not a colored prayer wash

**Clearcoat helps for jewelry/automotive lookdev with direct viewing angles. It's not the tool for painting color onto dark surfaces.**

---

## 3. What Actually Works for Dark Surfaces in PBR

### 3a. Fix the Geometry First (NdotL)

The single biggest improvement: **position the light so it actually faces the target surface**. For the front face (normal = +z), the light needs z-depth:

| Position | NdotL on Front | Notes |
|----------|---------------|-------|
| `(4.0, 1.0, 1.8)` current | 0.10 | Parallel — invisible |
| `(2.0, 1.0, 5.0)` | 0.75 | 41° — strong diffuse |
| `(1.5, 0.5, 4.0)` | 0.70 | 45° — good slash angle from side |
| `(3.0, 1.0, 4.0)` | 0.56 | Diagonal — balanced |

For a **diagonal slash across the front face**, something like `(2.5, 1.5, 4.5)` aimed at `(0, -1.5, 1.32)` gives ~0.65 NdotL while still coming from an off-axis angle that creates the diagonal sweep.

Alternatively, if the intent was to slash the **right face** (+x), the current position is already good (NdotL = 0.66). Just change the target to the right face center.

### 3b. Lift the Base Color (But Not Too Much)

The comment on line 819 mentions `v7: 0x12121c→0x2a2a3a` — this change was planned but apparently reverted or never applied. The surface needs enough albedo to reflect colored light.

**My recommendation: `0x1a1a28`**

- Linear: ~(0.009, 0.009, 0.018) — 1.5x brighter than current
- Still reads as very dark / obsidian / near-black visually
- But responds to colored spotlights noticeably
- Going higher (`0x252535`, 3.1x) would work even better for light response, but may lose the "obsidian void" aesthetic that makes the podium feel like negative space

The sweet spot depends on the NdotL fix. If NdotL goes from 0.1 to 0.65, the effective brightness jumps 6.5x — that alone may be enough without touching the color. But both together is the safe bet.

### 3c. Roughness Strategy

Current: `roughness: 0.35, metalness: 0.06`

- **Lower roughness (0.15-0.20) on the target face** creates a tighter, more visible specular highlight that moves with the camera. This is the "wet obsidian" look — the slash would appear as a reflective colored streak
- **Higher roughness (0.5-0.6)** spreads the specular into a wider, softer glow — more "painted light" and less "reflected streak"
- **Current 0.35** is a middle ground that does neither particularly well

**Recommendation:** For a slash/edge-catch look, go **lower** (0.18-0.22). The tighter specular reads better against darkness than a diffuse spread that disappears. Combined with the clearcoat, you get a layered specular — sharp clearcoat glint on top of a broader base specular underneath.

### 3d. Metalness Consideration

At `metalness: 0.06`, the material is fully dielectric — specular F0 ≈ 0.04 (4%). Increasing metalness to 0.15-0.25 would:
- Boost F0 to ~0.08-0.12 (specular reflections 2-3x brighter)
- Tint specular reflections with the base color (which is nearly black, so minimal effect)
- Reduce diffuse contribution (metallic surfaces have no diffuse)

**Not recommended.** For catching colored light, diffuse > specular. Keep metalness low. Boost F0 through clearcoat instead.

### 3e. The Emissive Elephant in the Room

The podium faces already have per-face emissive values:
- Right (+x): `0x606098` @ 3.5 intensity — **very strong purple glow**
- Front (+z): `0x161630` @ 0.9 — moderate purple
- Left (-x): `0x141424` @ 0.7 — dim

These emissive values are **additive** and prayer-independent. The right face emissive alone (`0x606098 × 3.5`) puts out roughly `(0.33, 0.33, 0.81)` in linear — **massively** brighter than anything the prayerSlash can achieve on the front face. This means:

1. The prayer color can't compete with the static emissive on the right face
2. On the front face, the emissive `0x161630 × 0.9` ≈ `(0.003, 0.003, 0.013)` is comparable to the spotlight contribution — they'll blend/compete

The emissive creates a baseline glow that's always on. The prayer slash needs to visibly *exceed* this baseline to read as a dynamic change. With the current setup, it can't.

---

## 4. Recommendation — The Path Forward

In priority order (do #1 first, then layer on):

### #1: Fix Light Position (Mandatory)

Reposition prayerSlash so it faces the target face with NdotL > 0.5. Either:
- **Option A:** Move to `~(2.0, 1.5, 4.5)` targeting front face — diagonal slash from front-right
- **Option B:** Keep at `(4, 1, 1.8)` but target the right face instead — the geometry already works

Option A is probably better for a visible "slash" since the front face is what the camera sees. Option B would catch on the right face but might be partially occluded by the cube.

### #2: Lift Base Color to `0x1a1a28` (Recommended)

Minimal visual change, 1.5x more light response. Still obsidian-dark. Combined with NdotL fix, gives ~10x more visible light than current setup.

If this isn't enough after #1, step up to `0x202030` (2x lift). I would NOT go past `0x252535` without Tawfeeq confirming the overall darkness level still feels right.

### #3: Lower Front Face Roughness to 0.20 (Optional, Adds Polish)

Creates a sharper, more cinematic specular catch — the light slash reads as a reflective streak on polished obsidian rather than a diffuse wash. More dramatic, more "showroom."

### #4: Increase Intensity to 25-35 (If Needed After #1-2)

Current 14 might be enough after the geometry fix. If not, push to 25-35. The NdotL fix is worth 6-7x on its own; combined with color lift, you're looking at 10-15x more visible energy. Should be plenty.

### #5: Consider Reducing Front Face Static Emissive (If Slash Gets Drowned)

If the front face emissive `0x161630 × 0.9` competes with the prayer color, lower it to `0.3-0.5` so the dynamic slash light is clearly the dominant color when active.

### What NOT to Do

- ❌ Don't increase metalness (kills diffuse)
- ❌ Don't rely on clearcoat specular alone (too narrow, view-dependent)
- ❌ Don't crank intensity past 40 (will blow out other objects in the cone path)
- ❌ Don't add emissive lerp (already rejected by Tawfeeq — "looks flat and weird")
- ❌ Don't widen the cone past 0.35 rad (loses the "slash" character, becomes a flood)

---

## 5. TL;DR

**The light isn't visible because it's hitting the front face at 84° — nearly parallel. The surface can't catch what doesn't face it.** The dark color makes it worse (99.4% absorption), but even a white surface would struggle at NdotL = 0.1.

Fix: Reposition the light so it actually faces the surface (NdotL > 0.5), give the surface slightly more albedo (`0x1a1a28`), and lower front-face roughness for a cinematic specular catch. These three changes together should produce a clearly visible colored slash at the current intensity of 14.

---

*Chris — Lookdev, Seven Heavens Studio*
