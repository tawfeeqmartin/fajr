# CHRIS-READY — Lookdev Pass Complete

**Date:** 2026-03-03
**Branch:** main (v172+2 commits, unpushed)
**Commits:**
- `bc10a73` — Per-face optical differentiation
- `fe38853` — Compass prism beam sharpening + dev mode alignment bugfix

---

## Fix 1: Cube Face Differentiation

**Problem:** Three visible cube faces showed identical refraction/distortion patterns — read as same texture repeated 3x.

**Solution:** Per-face optical variation using `vWorldNormal` as face discriminator:
- **Per-face IOR shift** — Side faces get wider red-blue prismatic split, top face is tighter/bluer, front face is green-shifted. Each face bends light with distinct chromatic character.
- **Per-face aberration scale** — Side faces get 70% more chromatic spread, top face gets 30% less. Different depth of refraction per face.
- **Per-face dichroic band rotation** — Side: default x+y diagonal. Top: x+z sweep. Front: y-z sweep. Bands run in different directions on each face.
- **Per-face UV offset** — Each face samples a different region of the FBO texture, preventing identical distortion patterns.

**Result:** Left face reads cool/deep blue, front face has warm chromatic aberration (visible orange/rainbow), top face has distinct band direction. Each face is optically unique.

**Renders:** `face-diff-v2.png` (final)

---

## Fix 2: Compass Prism Beams

**Problem:** Prism beam in compass mode was invisible — lost all symbolic clarity.

**Root Cause:** Dev mode bug — `window._compassCalibrated` was never set, so `_compassAligned` reverted to `false` on the next animation frame after the 500ms init. Fan disc never became visible.

**Fixes applied:**
1. **Bug fix:** Set `window._compassCalibrated = true` in compass dev mode init
2. **Fan shader:** Tighter radial falloff (`exp(-r²*2.5)`), sharper angular mask (smoothstep 0.82), 1.6x color boost for additive visibility
3. **Fan width:** Narrowed from 0.35 to 0.25 radians — precise prism, not flood light
4. **Entry beam:** Wider strip (6.0 center), more visible (0.65 max opacity)
5. **Entry disc:** Tighter focus (0.05 rad), brighter (0.45 max)
6. **Caustic light:** Boosted to 1.8x (was 0.5 — invisible)
7. **Bloom disc:** Pulled back (0.18 max) to avoid washing out the fan

**Result:** Clear prism symbolic read — white light enters from above, cube splits it into distinct rainbow spectrum (VIBGYOR) directed at viewer. Entry beam visible, fan precise and intentional.

**Renders:** `compass-v5.png` (final)

---

## Normal Mode Verified
Normal clock mode unaffected — `normal-verify.png` confirms face differentiation works beautifully with the existing light rig.

## Status
Ready for chef review. Do NOT push — 2 commits ahead of origin/main.
