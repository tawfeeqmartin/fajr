# CHANGELOG — A Gift of Time

## Lighting Rig Overhaul (Feb 28, 2026)

### Chris Lookdev Notes — Islamic Arch Gobo

**Philosophy:** "Make the arch a *memory of a place*, not a projection of a shape."
Prayer beams = clock voice. Arch = chapel walls. Walls don't speak over the call to prayer.

**Rig Split Decision:**
- Previous: single gobo key at intensity 72 doing everything — burned out arch edges, no shadow contrast
- New: clean key (no gobo) + dedicated arch gobo accent + ghost fill from opposite side

**Key Light** (no gobo, Rembrandt foundation):
- Position: (-3.5, 7.5, 4.0), target (0.3, 0, 0.5)
- Intensity 55, angle 0.32, penumbra 0.25
- Slightly higher than before for more dramatic angle

**Arch Gobo** (dedicated accent, warm candlelight):
- Position: (-2.0, 9.5, 5.5), target (0, -0.5, -1.0) — aimed in front of cube, not at it
- Color: 0xfff5e6 (warm candlelight, not pure white)
- Intensity 6 (was 18, then 12 — both blew out cube top face)
- Angle 0.35, penumbra 0.25, 2K shadow map
- Procedural 512px canvas texture: pointed Islamic arch (mihrab-style)

**Ghost Arch** (spectral fill, bilateral sacred symmetry):
- Position: (2.5, 7.0, 2.0), target (0, 0, 0)
- Color: 0x2a1a4a (deep indigo-violet)
- Intensity 4, angle 0.45, penumbra 0.6, no shadow
- Same arch texture, massively diffused — "barely readable arch silhouette"

**Arch Placement Target:**
- Floor projection = sacred threshold (primary)
- Cube top face = gentle consecration (secondary, not blown out)
- Cube sides = avoid (competes with dichroic IOR refractions)
- Arch peak should land in top-right area of floor from camera POV

**Prayer Beam Conflict Notes:**
- Arch should recede when prayer beams are active (future: fade intensity during prayer windows)
- Warm gobo + magenta hour = pink-orange muddy zone risk
- Alternative: shift gobo to cooler 0xf0f0ff if conflicts arise
- Spatial separation: arch floor projection in front of cube, beams behind/around

**Commits:**
- `f06c54e` — Initial procedural arch gobo texture on key SpotLight
- `9067b79` — Rotated arch peak toward top-right
- `877aa7b` — Restored original light position, rotation adjustments
- `b82865b` — 2D screen overlay attempt (REVERTED — felt flat/disconnected)
- `3f2b8bb` — Reverted 2D overlay
- `f3f92bd` — Split rig: key (55) + arch gobo (12) + ghost fill (4) — Chris lookdev
- `3df385e` — Arch gobo intensity 6, aimed in front of cube, no blowout

---

## Nav Pill (Feb 28, 2026)

**Dichroic Glow (DISABLED):**
- Reactive glow where clock hands + prayer beams bled color onto frosted pill
- `window._handGlow` exposed from glass-cube-clock.js (hand proximity to 6 o'clock)
- `_activePrayer` module-scoped for prayer beam color at 6 o'clock
- Disabled — replaced with simple transparent frosted glass

**Current Pill Style:**
- background: rgba(18,18,22,0.35)
- backdrop-filter: blur(24px) saturate(180%)
- border: 1px solid rgba(232,228,220,.1)

**Commits:**
- `6ec7435` — Initial dichroic pill glow (hand colors bleed)
- `372aedb` — Prayer beams also bleed onto pill
- `0f526eb` — Fix: _activePrayer module scope
- `2c0752e` — Fix: lazy-find modePill (DOM order issue)
- `da6fbdb` — Cranked intensities
- `d0c7a9b` — DISABLED glow, transparent frosted instead

---

## Info Page Snap-Flip (Feb 28, 2026)

- Dedicated `#infoScroller` container (position:fixed, inset:0)
- `scroll-snap-type: y mandatory` + `scroll-snap-stop: always`
- Each section: `height:100svh` for exact page-flip
- Scrollbar hidden (scrollbar-width:none + ::-webkit-scrollbar)
- Dot indicators on right side for position

**Commits:**
- `a9fc5c4` — Dedicated scroll container for iOS Safari snap-flip

---

## Copy Updates (Feb 28, 2026)

- Intro: "Early Muslims meticulously measured prayer times based on the sun — to honor this tradition, this clock signals your appointment through beautifully refracted light."
- Qibla section: "Of all the directions, turn towards what's best for you."
- Mecca → Makkah, Kaaba → Ka'bah across all pages (10+ instances)

**Commits:**
- `fb7c6d4` — Intro copy update
- `d7f70e0` — "as" → "through"
- `6289927` — Drop "with The Creator"
- `14b3762` — Qibla section title
- `f52ce9f` — Mecca → Makkah, Kaaba → Ka'bah

---

## Other Changes (Feb 28, 2026)

- **Audio dedup:** Only one verse plays at a time (`35428ed`)
- **Snappy mode switching:** All transitions removed from pill icons, header, reveal tiles (`c6e4c93`)
- **Guided tour order fixed:** Matches HTML order, removed stale sections (`d2ea5c8`)
- **Hour hand always magenta:** Removed adaptive contrast shifting (`2a23f66`)
- **Countdown seconds unified:** Same weight/opacity as hours/minutes (`7aa30e4`)
- **Compass onboarding:** Slimmer phone, 3D isometric cube, no nav bar (`3a4487f`)
- **Version tag always visible:** Removed all CSS rules hiding it during dev (`35e2572`)
