# Prayer-Reactive Spotlights — Research & Plan
## Chris, Lookdev — Seven Heavens Studio

### Existing Lighting Rig (must remain untouched)
1. **back** — SpotLight 0x4040a0, i:10 — behind-right, illuminates FBO background for glass refraction
2. **cubeBack** — SpotLight 0xffeedd, i:7 — glass transmission (Swarovski technique)
3. **coldCounter** — SpotLight 0x0a1855, i:6 — Deakins warm/cold split from right
4. **violetRim** — SpotLight 0x8055f0, i:6 — Swarovski edge catch from left-behind
5. **ghostFill** — PointLight 0x0c0520, i:0.5 — floor separation from pure black
6. **prayerAmbient** — HemisphereLight — colored shadow fill
7. **rim** — SpotLight 0x8060c0, i:5 — back edges of cube, silhouette separation
8. **cubeSun** — PointLight 0xe8f2ff, i:50 — behind cube, drives rainbow refraction
9. **tawafSpot** — SpotLight 0xffffff, i:8 — orbits at second-hand speed
10. **podiumFrontWash** — SpotLight 0xc0a880, i:12 — illuminates podium front face
11. **podiumLowFill** — SpotLight 0x606080, i:4 — subtle podium form
12. **AmbientLight** 0xffffff, i:0.07 — minimal base
13. **Floor caustics** — 7x PointLight at floor level
14. **Gobo/arch system** — DISABLED (v80)

### Prayer Tracking (`_activePrayer`)
- Set in `updatePrayerWindows()` (line ~1455)
- Shape: `{ startAng, endAng, color, color2, intensity }` or `null`
- Colors from `PRAYER_WINDOWS_DEF` array (line 1153)
- Updated every frame in the render loop
- `_prayerDisc.visible` indicates active prayer beam on floor

### Render Loop
- Lines 1505-1760
- `clock.getElapsedTime()` = elapsed time `t`
- `now` = current Date (real, dev override, or swipe preview)
- FBO two-pass: hide cube → render scene to FBO → show cube → render final
- Key insertion point: just before the FBO pass (line ~1750)

### Design Philosophy — Cinematographic Approach

**Concept: "The Qibla of Time"**

The scene already lives in dramatic chiaroscuro — near-black background, cubeSun providing the heroic backlight, cold/warm split. The prayer spotlights should feel like the scene's environment is responding to sacred time — not projected decoration, but ambient atmospheric shift.

**Placement Strategy (2 accent spotlights):**

1. **Prayer Wash** — From above-left, aimed at the podium front face. This is the KEY prayer accent. Washes the obsidian plinth in prayer color, creating a colored pool on the visible face. Low intensity (2-3), high penumbra (0.85). Positioned to complement the existing podiumFrontWash without competing.

2. **Prayer Rim** — From behind-right (opposite side of violetRim), catches the back edges of the cube in prayer color. Creates subtle colored edge separation. Very low intensity (1.5-2), tight angle. This replaces the static violet rim with a prayer-responsive colored edge during active prayer.

**Why NOT a floor pool light:** The floor already has the prayer disc beams, caustic PointLights, fog layers, and warm/cold fog. Adding another floor light risks visual noise. The plinth face and cube rim are underutilized surfaces.

**Transition:** Lerp color AND intensity over ~2.5 seconds (0.025 lerp rate at 60fps). When no prayer is active, lights go to near-zero intensity with a neutral cool tone — they become invisible, not a distraction.

**Intensity Calibration:**
- Prayer Wash: 3.0 max (podiumFrontWash is 12, so this is 25% — accent, not competition)
- Prayer Rim: 2.0 max (violetRim is 6, so this is 33% — subtle edge tint)
- Both at penumbra 0.85+ for soft, atmospheric edges

### Implementation Plan
1. Create two SpotLights with neutral color, 0 intensity
2. Add them to scene with targets
3. In render loop (before FBO pass), read `_activePrayer`:
   - If active: lerp color → prayer color1, intensity → target
   - If null: lerp intensity → 0
4. Use THREE.Color.lerp for smooth color transition
5. Render and assess
