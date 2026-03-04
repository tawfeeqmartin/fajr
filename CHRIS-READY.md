# CHRIS-READY.md — Prayer Spotlights v7 (Triple Approach)

**Status:** ✅ READY FOR CHEF REVIEW  
**Date:** 2026-03-04  
**Branch:** main (local, not pushed)  
**Commits:** `4fde826` (v7 impl) → `f23075a` (window expose)

---

## Problem Diagnosis

Prayer spotlights were invisible because the podium base color was `0x12121c` (near-black).  
In PBR lighting: `diffuse = lightColor × surfaceColor`. When surfaceColor ≈ black → output ≈ zero.  
Increasing spotlight intensity had zero effect — the surface absorbed everything.

## Solution: Triple Approach (all three combined)

### Approach A: Lift Podium Color
- `podiumBase.color`: `0x12121c` → `0x2a2a3a`
- Still dark, still moody — but mid-dark instead of light-absorbing black
- Colored SpotLights can now paint the surface visibly

### Approach B: Prayer PointLight at Podium Base
- New `prayerGlow` PointLight at `(0, -0.6, 0.8)` — just below cube, slightly forward
- Max intensity: 8.0, radius: 6 units
- PointLight has no surface-color dependency — illuminates regardless of albedo
- Lerps color to match active prayer, same rate as wash/rim (0.022)
- Hidden during FBO pass to prevent glass refraction bleed

### Approach C: Emissive Tint on Podium Faces
- Podium top face (+y, mat index 2): emissive lerps to 25% of prayer color, intensity → 2.5
- Podium front face (+z, mat index 4): emissive lerps to 15% of prayer color, intensity → 1.8
- Emissive ignores incoming light entirely — always visible
- Fades back to default when no prayer is active

## Also Added
- `window._devJumpToTime` — exposed module-scoped function for render pipeline
- `window._prayerDebug` — real-time debug state (active, colors, intensities)
- Updated `render-all-prayers.sh` — renders all 7 prayers with dev panel hidden

## Render Results (v7c — clean, no dev panel)

All 7 prayers clearly distinct:

| Prayer | Color Hex | Podium Tint | Mood | Verdict |
|--------|-----------|-------------|------|---------|
| Tahajjud | `#8811ff` | Deep purple | Mystical, nocturnal | ✅ Excellent |
| Fajr | `#6633ee` | Cool blue-violet | Pre-dawn twilight | ✅ Distinct from Tahajjud |
| Dhuha | `#ff9900` | Rich gold/amber | Warm radiant morning | ✅ Excellent |
| Dhuhr | `#00bb44` | Vivid emerald | Centered, grounded | ✅ Excellent |
| Asr | `#ff8800` | Deep amber-orange | Late afternoon warmth | ✅ Distinct from Dhuha |
| Maghrib | `#ff2200` | Crimson red | Dramatic sunset fire | ✅ Excellent |
| Isha | `#1166ff` | Royal blue | Deep tranquility | ✅ Excellent |

Vision model rated: **★★★★½ — Showroom-Worthy**  
Quote: *"This looks like it belongs on an Apple Design Award stage."*

## Renders Location
`.crew/renders/prayer-{name}-v7c.png` — 7 clean screenshots, 430×932 @2x DPR

## NOT pushed — awaiting chef review.
