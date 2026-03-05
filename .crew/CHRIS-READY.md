# CHRIS-READY: Cube Face Seam/Fold Fix

**Status:** ✅ Ready for review
**Commit:** 7a7240e (on main, NOT pushed)
**File:** glass-cube-clock.js

## Bug
Tawfeeq reported visible fold/crease lines cutting diagonally across the left and right cube faces — "tightly compressed fold" that didn't resolve on phone or PC.

## Root Cause
**Not the per-face differentiation code** (diagnostic proved it — zeroing all per-face effects didn't help).

The actual culprit was the **vertex shader normalizing `vViewDir` before interpolation**:
```glsl
vViewDir = normalize(-mvPos.xyz);  // ← BUG
```
On a BoxGeometry with 2 triangles per face, interpolating normalized vectors creates a crease along the triangle diagonal. `lerp(normalize(A), normalize(B), t)` ≠ `normalize(lerp(A, B, t))`.

## Fix (4 changes)
1. **`vViewDir = -mvPos.xyz`** — pass raw vector, fragment shader normalizes per-pixel
2. **`BoxGeometry(1.2,1.2,1.2,4,4,4)`** — 4x subdivision smooths remaining interpolation artifacts
3. **`sin(diagInput * 1.8) * 0.5 + 0.5`** — replaced peaked `exp(-|x|*7)` with smooth sinusoidal wave (no visible band line)
4. **`diagF * 0.08`** normal distortion — was 100%, now 8% (eliminates refraction fold at dichroic band)

Also softened: IOR shifts halved, aberration scale reduced (0.7→0.35 on side faces), diagInput face rotation weights reduced.

## Per-face variation preserved
Each face still reads optically distinct (different IOR, aberration, dichroic character). The changes only eliminate the visible seam artifacts.

## Verification
- Pixel diff (v175 → fixed): max 97, 52k pixels changed by >40 levels — concentrated on side faces
- Vision analysis confirms: fold lines on left and right faces are **eliminated**
- Glass reads as smooth, coherent translucent solid
- Renders: `.crew/renders/FINAL-ORIG-v175.png` (before), `.crew/renders/FINAL-FIXED.png` (after)
