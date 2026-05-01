# fajr → agiftoftime integration guide

> **Audience:** an engineering agent working inside the agiftoftime.app repo. This doc lives in the fajr repo because fajr defines the API surface; copy or link it, don't fork.
>
> **Goal:** wire `@tawfeeqmartin/fajr` into agiftoftime so the two compose — agiftoftime gets accurate region-aware prayer times, hilal visibility, and signed-bias provenance; fajr gets a real production showcase. The user-facing change is small (subtler method labels, an opt-in provenance panel, and a Ramadan/Eid hilal banner) — the engine change underneath is significant.

## Why integrate

agiftoftime currently calls adhan.js (or equivalent) directly, getting generic ISNA-everywhere or a single-method calculation. fajr is a thin layer over adhan.js that auto-detects the right *regional* method per coordinate, ships custom angle configs not in adhan's defaults (Morocco 19°/17° community-calibrated, France UOIF 12°/12°), validates against multiple independent reference layers (Mawaqit mosque-published times, Diyanet, JAKIM, Aladhan, praytimes.org), and adds a three-criterion hilal visibility prediction (Odeh + Yallop + Shaukat) with explicit ikhtilaf surfacing. **For Moroccan users specifically, the Fajr time changes by 5–7 minutes** — material during Ramadan suhoor.

## Tier 1 — Engine swap (~1 hour)

### Install

```bash
npm install @tawfeeqmartin/fajr
```

### Drop-in replacement

Find the existing prayer-times call in agiftoftime. It probably looks like:

```js
import * as adhan from 'adhan'

const coords = new adhan.Coordinates(latitude, longitude)
const params = adhan.CalculationMethod.MoonsightingCommittee()  // or some hardcoded method
const times = new adhan.PrayerTimes(coords, date, params)

// Returns: { fajr, sunrise, dhuhr, asr, maghrib, isha } as Date objects
```

Replace with:

```js
import { prayerTimes } from '@tawfeeqmartin/fajr'

const times = prayerTimes({ latitude, longitude, date, elevation })
// Returns: { fajr, shuruq, dhuhr, asr, maghrib, isha,
//            method (string),
//            corrections: { elevation: bool, refraction: 'standard (0.833°)' } }
```

**Key differences from raw adhan:**

- No method config needed — fajr auto-selects per country/coordinates.
- Field rename: `sunrise` → `shuruq` (matches Arabic prayer terminology).
- Adds `method` field (the human-readable label, e.g. `"Habous (19°/17°)"` or `"Diyanet (Türkiye)"`) suitable for surfacing in UI.
- All returned times are `Date` objects in UTC, same as adhan.

### Other fajr exports agiftoftime probably uses

```js
import { qibla, hijri, hilalVisibility, nightThirds, travelerMode } from '@tawfeeqmartin/fajr'

const bearing = qibla({ latitude, longitude })
//   → { bearing: 97.4, ... }   bearing in degrees from true north

const date = hijri(new Date())
//   → { year: 1446, month: 9, day: 15, monthName: 'Ramadan' }

const visibility = hilalVisibility({ year: 1446, month: 10, latitude, longitude })
// (see Tier 3 below for the full result shape)

const thirds = nightThirds({ date, latitude, longitude })
//   → { firstThird: Date, lastThird: Date, midnight: Date }

const traveler = travelerMode({ times, madhab: 'shafii' })
//   → qasr/jam' permissibility metadata; user determines actual safar status
```

### What gets better automatically

- Moroccan users: Fajr ~5 min earlier (matches Habous Imsakiyya / Mawaqit mosque-published times)
- French users: UOIF 12°/12° auto-applied (instead of generic 18°)
- Norwegian / Icelandic users: MiddleOfTheNight high-latitude rule auto-applied
- Finnish users: TwilightAngle high-lat rule auto-applied
- Turkish users: full Diyanet method (with Hanafi Asr) auto-applied
- Saudi / UAE / Pakistan / Indonesia / Malaysia / UK / USA / etc.: each gets its institutional method automatically

## Tier 2 — Provenance UX (~3–4 days)

The point is to surface fajr's distinctive layer **without breaking agiftoftime's contemplative mood**. Subtle and discoverable, not loud.

### 2a. Method label under the date/location

Wherever agiftoftime currently shows the city + date, add a small caption with the method:

```html
<header class="prayer-header">
  <h1>13 Ramadan 1446 · Friday</h1>
  <p class="location">Casablanca, Morocco</p>
  <p class="method">Habous (19°/17°) — community-calibrated</p>
</header>
```

Pull `times.method` from the fajr return value. Style it as small caption text, ~70% opacity. Most users won't look; the curious will see *why* the times are what they are.

### 2b. Long-press a prayer time → "Why this time?" sheet

Add an iOS-style bottom sheet that opens on long-press of any prayer time:

```
─────────────────────────────────────
Fajr · 05:08
─────────────────────────────────────

Method:  Habous 19°/17° (Morocco)
         Auto-selected from your coordinates.

Reference layers (lower = closer match):
  Aladhan-Habous    0.05 min  ✓
  Mawaqit (mosque)  1.14 min  ✓ matches local mosque cluster
  Diyanet           N/A       (not Türkiye)

Signed bias: +0.05 min later than Aladhan-Habous.
Direction respects ihtiyat for both prayer and Ramadan
fasting — see [methodology](/about/methodology).

[Close]
```

The numerical data here comes from fajr's `eval/results/runs.jsonl` and `docs/progress.md`. You can either:

- (a) **Static at build time:** download fajr's published `progress.md` during agiftoftime's build, parse the per-region table, embed a JSON map of `{ city → { source, wmae, signedBias } }`. No runtime dep, no privacy implication.
- (b) **Skip per-source numbers** and just show the method + ihtiyat note. Simpler, still meaningful.

I'd recommend (b) for v1 — it's cleaner and doesn't require a build-time data pull.

### 2c. Subtle footer / about-page link

Add one line, somewhere in the About page or footer:

```
Times calculated by fajr — an open accuracy-research framework.
```

Linked to https://github.com/tawfeeqmartin/fajr. That single line is how curious users discover the rigor underneath.

## Tier 3 — Ramadan / Eid hilal banner (the marquee feature, ~1 week)

This is where the integration becomes uniquely valuable. agiftoftime can be **the calmest, clearest hilal experience for Muslims worldwide.**

### Trigger condition

```js
import { hijri, hilalVisibility } from '@tawfeeqmartin/fajr'

function shouldShowHilalBanner(now, latitude, longitude) {
  const today = hijri(now)
  // Show on day 28 or 29 of Sha'ban, Ramadan (sighting eve for Ramadan / Eid)
  if ((today.month === 8 || today.month === 9) && today.day >= 28) {
    return { year: today.year, monthBeingDecided: today.month + 1 }
  }
  // Also Dhul-Qi'dah → Dhul-Hijjah (for Hajj timing) and any month where
  // the user might care: Muharram (Ashura), etc. — start with Ramadan + Eid.
  return null
}
```

### Compute visibility for the user

```js
const trigger = shouldShowHilalBanner(new Date(), userLat, userLng)
if (trigger) {
  const result = hilalVisibility({
    year: trigger.year,
    month: trigger.monthBeingDecided,  // the month whose START is being assessed
    latitude: userLat,
    longitude: userLng,
  })
  // result shape:
  // {
  //   visible: bool,            // Odeh primary verdict
  //   code: 'A'|'B'|'C'|'D',    // Odeh class
  //   V: number,                // Odeh's V parameter
  //   yallop: { visible, code: 'A'..'F', q, ... },
  //   shaukat: { visible, code: 'A'|'B'|'D',
  //              elongationDeg, moonAltAtSunsetDeg, moonAgeHours, lagMinutes,
  //              ... },
  //   criteriaAgree: bool,      // false = borderline ikhtilaf
  //   arcvDeg, widthArcmin, lagTimeMinutes, moonAgeHours,
  //   sunsetUTC, moonsetUTC, bestTimeUTC, conjunctionUTC,
  //   forHijriMonth: { year, month },
  //   latitude, longitude,
  //   note: 'wasail/ibadat reminder string',
  // }
}
```

### Banner copy logic

```js
function bannerCopyFor(result, monthName) {
  if (result.criteriaAgree && result.visible) {
    return {
      tone: 'confident',
      headline: `${monthName} crescent visible at your location tonight`,
      detail: `All three criteria predict naked-eye visibility. Most committees worldwide will likely declare ${monthName} begins tomorrow at sunset.`,
    }
  }
  if (result.criteriaAgree && !result.visible) {
    return {
      tone: 'confident',
      headline: `${monthName} crescent not visible at your location tonight`,
      detail: `All three criteria predict not visible. The current month likely completes to 30 days; ${monthName} begins the day after.`,
    }
  }
  // criteriaAgree === false: ikhtilaf zone
  return {
    tone: 'tentative',
    headline: `Borderline crescent at your location tonight`,
    detail: `Criteria disagree. Odeh: ${result.code}. Yallop: ${result.yallop.code}. Shaukat: ${result.shaukat.code}. Local committees will likely split — check your authority.`,
  }
}
```

### Banner UI (sketch)

```
┌────────────────────────────────────────────────┐
│ 🌒 Ramadan crescent observation tonight        │
│                                                │
│ At your location (Casablanca, Morocco):        │
│                                                │
│   Odeh:    not visible (sub-Danjon)           │
│   Yallop:  not visible (sub-Danjon)           │
│   Shaukat: not visible (moon age 5.5 h)       │
│                                                │
│ Likely declarations tonight:                   │
│   Sighted:  Saudi Arabia, UAE, Egypt, Qatar    │
│   Not sighted:  Morocco, Pakistan, Iran        │
│                                                │
│ fajr is wasail (means), not ibadat (worship). │
│ Consult your local authority.                  │
│                                                │
│ [View world map]   [Methodology]   [Dismiss]  │
└────────────────────────────────────────────────┘
```

The "likely declarations" lookup can be hardcoded — for any given Hijri month, fajr's `eval/data/hilal-observations.json` has the curated dataset of historical decisions you can use to predict patterns. Or for v1, hardcode the canonical "stricter / less strict" country pairings:
- Stricter (less likely to declare sighted on borderline): Pakistan, Morocco, Iran, India, Indonesia
- Less strict (more likely): Saudi Arabia, UAE, Egypt, Qatar, Turkey

### "View world map" button

Tap → renders fajr's hilal world map for that Hijri month inline. We have a generator at `scripts/build-hilal-map.js`; you can either:

- **(a) Pre-render and bundle:** generate the map for upcoming Ramadan / Eid each year as part of agiftoftime's build, ship the SVG with the PWA. Free, offline-capable.
- **(b) Render at runtime:** harder; would need to bundle the lat/lng grid computation (requires fajr's full lunar position math). Doable but heavier — V2 if you want fully dynamic.

I'd recommend (a) for v1.

## Bidirectional value loop

### Cross-references (free, no code)

- agiftoftime About page: one line linking github.com/tawfeeqmartin/fajr ("Times calculated by fajr…")
- fajr README: list agiftoftime as the reference deployment in the "Credits" section. Already mentions agiftoftime in the dedication; just add a "Used in production by:" line next to it.

### Telemetry (optional, requires consent)

If agiftoftime collects any usage telemetry (it doesn't currently — explicit "no tracking" in the README), this is moot. If you ever add an opt-in feedback mechanism ("help fajr improve"), the most useful signal is **regional distribution** — what countries / methods are users in? — to help prioritize which institutional sources fajr should add next.

### Auto-update via npm

Every accuracy improvement that lands in fajr's master (passes the autoresearch ratchet) ships to agiftoftime users via a simple `npm update @tawfeeqmartin/fajr` + redeploy. No agiftoftime code change needed. Worth setting up CI to bump fajr periodically (Dependabot or similar).

## Questions to ask the fajr maintainer

If something below stops you, ping the human (or me, working in the fajr repo) — these are the questions worth a synchronous answer rather than guessing:

1. **API stability** — fajr is currently 0.x. Before agiftoftime depends on it in production, is there a v1.0 plan / pinned API surface? (See open question in fajr's README about defining the v1.0 bar.)
2. **Bundle size** — fajr's hilal stack adds ~700 lines of lunar/solar math. If agiftoftime is already aggressively code-split for PWA size, may want to import only the modules you use (`prayerTimes` + `hilalVisibility` + `hijri`) rather than the full default export.
3. **Date-fns / dayjs / moment compatibility** — fajr returns native `Date` objects. If agiftoftime uses a date library, no conversion needed; just check timezone handling at the integration boundary.
4. **Geolocation precision** — fajr is most accurate when given real lat/lng. IP-geo (~10 km) is fine for Tier 1; for the hilal banner the topocentric corrections matter more, so prefer `navigator.geolocation` if user has granted permission.
5. **Service worker caching** — the hilal world maps are bundled SVGs (~50 KB each). If agiftoftime's PWA caches static assets aggressively, decide whether the maps for current + next Hijri month should be permanently cached.

## Suggested PR structure for agiftoftime

Three commits or three PRs, isolating the changes for review:

1. **`feat: swap adhan.js for @tawfeeqmartin/fajr`** — Tier 1, engine swap only. Visual change for users: zero. Underneath: regional auto-config + Morocco fix kicks in. Test against the locales agiftoftime users span.
2. **`feat: surface method + provenance in UI`** — Tier 2. Adds the method caption and the long-press "Why this time?" sheet. Cosmetic-feeling but lays the discovery layer.
3. **`feat: Ramadan/Eid hilal banner`** — Tier 3. The marquee feature. Ship in time for next Ramadan or next Eid, whichever comes first.

## License notes

fajr is MIT-licensed; agiftoftime can use it freely. The vendored `scripts/lib/PrayTimes.js` (used internally for hilal) is LGPL v3.0 from praytimes.org but is wrapped, not exposed in the public API — agiftoftime doesn't need to comply with LGPL because it never imports that file directly.

---

If anything above is unclear, the fajr-side maintainer is available — open an issue at github.com/tawfeeqmartin/fajr/issues or message the user directly.
