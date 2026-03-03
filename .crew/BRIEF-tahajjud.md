# BRIEF: Tahajjud Mode — The Last Third of the Night

## What
When the clock enters the last third of the night (dynamically calculated from Isha to Fajr), the entire scene shifts into a distinct visual state. This is the most theologically loaded hour in Islam — the moment of divine descent.

## Why
The hadith: "Our Lord descends every night to the lowest heaven in the last third of the night and says: 'Who is calling upon Me that I may answer? Who is asking of Me that I may give? Who is seeking My forgiveness that I may forgive?'" — Bukhari & Muslim

This isn't just another prayer window. It's the ONE time when the tradition says heaven opens. The clock should feel different. The user who wakes at 3am and opens the app should feel that something sacred is happening.

## Time Calculation
- Night = Isha to Fajr (next day)
- Last third = start time + 2/3 of night duration
- Example: Isha 7:00 PM, Fajr 5:48 AM → night = 10h48m → last third starts at 2:12 AM
- Must be dynamically calculated from `window._prayerTimings`
- Already have Isha and Fajr times in the prayer engine

## Visual Direction (for Chris)
Opus suggested: "Darker, quieter, with the hadith about divine descent surfaced"

Possible approaches (Chris decides):
- **Cube**: Emissive dims, dichroic shifts to cooler/deeper tones
- **Fog**: Density increases slightly — the world closes in, intimate
- **Prayer beam**: Single warm amber/gold beam instead of the normal prayer color
- **Podium**: Emissives drop to near-zero — everything recedes except the cube
- **Breathing**: Slow sinusoidal pulse on cube intensity (4-6 sec cycle) — the presence indicator
- **Background**: Could go even darker than `#0d0d12`

## Hadith Overlay
- One-line text that fades in when Tahajjud activates
- Arabic + English, frosted mini-card style (match info mode)
- Position: top of screen, below header, gentle opacity
- Auto-fades after 10-15 seconds? Or stays persistent but subtle?
- The hadith: رَبُّنَا يَنْزِلُ كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا / "Our Lord descends every night to the lowest heaven..."

## Technical Approach
1. Add `_isLastThird()` function — compares current time against Isha+2/3(Fajr-Isha)
2. In render loop, check `_isLastThird()` (throttled, once per minute)
3. When true: lerp scene parameters to Tahajjud state
4. When false: lerp back to normal
5. All Tahajjud-specific values as uniforms/variables — adjustable in dev panel

## Dev Panel
- "Tahajjud" section with toggle to force-enable
- Sliders for: fog density, cube dim factor, beam warmth, pulse speed, pulse amplitude
- Shows calculated last-third start time

## Constraints
- Must feel DIFFERENT from normal prayer windows, not just "another color"
- The transition should be gradual — a slow settling, not a snap
- Keep it minimal. One quote, one visual shift. Stillness, not spectacle.
- No sound changes (spatial adhan handles its own thing)

## Reference
- Opus notes: `references/opus-agot-inspiration.md` → "The Last Third of the Night — Tahajjud Mode"
- Time in Islam essay: `references/time-in-islam-opus.md`
