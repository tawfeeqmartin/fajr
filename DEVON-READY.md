# DEVON-READY: Sunrise Forbidden-Time Sector

## Summary
Added a 20-minute Sunrise forbidden window sector that separates the makruh (disliked) prayer time from the Dhuha prayer window.

## Changes Made

### glass-cube-clock.js

1. **PRAYER_WINDOWS_DEF** — Split old "Sunrise" entry (Sunrise→Dhuhr) into two:
   - `Sunrise`: Sunrise → Sunrise+20min, grey color `0x888888`, `isForbidden: true`
   - `Dhuha`: Sunrise+20min → Dhuhr, orange color (unchanged)
   - Used `startOffset`/`endOffset` fields for computed times

2. **buildPrayerSectors()** — Now handles `startOffset` and `endOffset` on defs

3. **Disc intensity** — Forbidden sectors render at `OP_FORBIDDEN = 0.25` (vs `OP_ACTIVE = 1.2`)

4. **HOUR_CONTRAST** — Added `Sunrise` entry with grey colors

5. **Swipe navigation** — Updated from 7 to dynamic `prayerSectors.length` (now 8):
   - Qiyam, Fajr, **Sunrise**, Dhuha, Dhuhr, Asr, Maghrib, Isha
   - Sunrise swipe label shows "Avoid prayer" subtitle
   - Dhuha swipe label shows computed start time (Sunrise+20)

### index.html

6. **Header display** — `_displayPrayerTimes()`:
   - Detects 20-min forbidden window (Sunrise → Sunrise+20)
   - Shows "Sunrise" in `#888888` grey during forbidden window
   - Shows "Sunrise" in `#ff9900` orange during Dhuha window (Sunrise+20 → Dhuhr)
   - Nav pill glow uses grey during forbidden window

## Verified
- ✅ 8 swipe labels correct: all names, times, "Avoid prayer" subtitle
- ✅ Dhuha time correctly computed: Sunrise(06:18) + 20 = 06:38
- ✅ Zero console errors
- ✅ JS syntax valid
- ✅ No git push

## Commit
`f20bd79` — `feat: add Sunrise forbidden-time sector (grey disc, 20min window, 8 swipe slots)`
