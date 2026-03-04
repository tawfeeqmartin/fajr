# Prayer-Reactive Spotlights — Chris Ready for Review
## Chris, Lookdev — Seven Heavens Studio — Mar 4, 2026

### What I Built
Two SpotLight accents that smoothly transition color/intensity to match the active prayer window. The scene's atmosphere shifts with sacred time — like sunrise warming a room before you notice it.

### Light Placement

**1. Prayer Wash** (above-forward-left: -3, 5, 5.5)
- Aimed at podium center (-1.5y), angle 0.40, penumbra 0.88
- Washes the obsidian plinth face and surrounding background in prayer color
- Max intensity: 2.0 | Decay: 1.5 | Distance: 13
- Color: primary prayer color desaturated 35% toward warm neutral (0x998877)
- This is the KEY accent — visible atmospheric tint on the podium column

**2. Prayer Rim** (behind-right: 3.5, 5, -3.5)
- Aimed at cube center (0.5y), angle 0.20, penumbra 0.72
- Catches cube back edges and background in prayer color2 (lighter variant)
- Max intensity: 1.2 | Decay: 1.7 | Distance: 10
- Color: secondary prayer color desaturated 15% toward neutral (0xaaaaaa)
- Subtle edge definition — a hint of prayer on the silhouette

### FBO Isolation (Critical Detail)
Both lights are hidden (`visible = false`) during the FBO render pass. The glass cube's ShaderMaterial refracts what the FBO captures behind it. Without isolation, prayer-colored light bleeds into the FBO background → the glass refracts colored content → the cube turns into a tinted blob. Visibility toggle is the cleanest solution — one toggle per frame, zero overhead.

### Transition Behavior
- **Lerp rate:** 0.022/frame (~3 seconds at 60fps)
- **Active prayer:** color lerps toward prayer color, intensity lerps toward max
- **No active prayer:** intensity lerps toward 0 (fade to invisible)
- **Compass mode:** lights disabled (lerp to 0) — compass has its own visual language
- Transitions feel organic, like slow breathing. No snapping.

### Color Processing
- Wash desaturates prayer color 35% toward warm neutral — atmospheric, not neon
- Rim desaturates 15% — edge catch can be slightly richer
- This prevents saturated colors (especially green/violet) from looking garish

### Per-Prayer Atmospheric Read
| Prayer | Atmosphere | Notes |
|--------|-----------|-------|
| Tahajjud | Deep violet mystical | Most dramatic — appropriate for deepest night prayer |
| Fajr | Indigo/lavender dawn | Cool night-to-dawn transition |
| Dhuha | Warm amber/golden | Sunrise warmth, complementary with existing warm lighting |
| Dhuhr | Subtle green tint | Green mixes with existing cool tones — fresh noon feel |
| Asr | Warm amber/orange | Afternoon warmth, beautiful on obsidian podium |
| Maghrib | Red-orange sunset | Dramatic lower atmosphere, sunset drama |
| Isha | Cool blue night | Blends naturally with existing blue scene palette |

### Performance
- 2 SpotLights (no shadow casting) = negligible GPU cost
- One lerp operation per frame per light (color + intensity)
- One visibility toggle per frame per light (FBO isolation)
- No new geometry, no new materials, no new shaders

### Files Changed
- `glass-cube-clock.js` — all changes

### Renders
All renders in `.crew/renders/prayer-*-v5.png` (7 prayers)

### What I Didn't Do
- No irradiance probes / CubeCamera / LightProbe (constraint respected)
- No area lights (SpotLights only, as specified)
- No changes to existing lighting rig (all additive)
- No floor pool light (floor already has prayer discs + caustics + fog)

### Open Questions for Chef/Tawfeeq
1. The existing prayer disc beams contribute significant color to the FBO background (visible as colored cube tint at Tahajjud/Dhuha). This predates my spotlights. Should we also hide prayer discs during FBO for even cleaner glass?
2. Intensity calibration: current values are conservative. Happy to dial up if Tawfeeq wants more drama.

---
*Ready for chef QC review. Do not git push.*
