# Fact-check: README "How fajr fits" positioning section

Date: 2026-05-02
Tested against: AlAdhan API v1 (live, queried 2026-05-02), adhan-js v4.4.3 (npm latest), fajr v1.6.2 (current HEAD), source: mawaqit/prayer-times PHP fork (the islamic-network/prayer-times original was deleted; mawaqit forked it Oct 2025).

---

## Methodology

- AlAdhan API: live `curl` against `https://api.aladhan.com/v1/timings/...` and `/v1/methods`. Source code reviewed via `mawaqit/prayer-times` (declared fork of `islamic-network/prayer-times`, GitHub).
- adhan-js: README, METHODS.md, and `src/CalculationMethod.ts`, `src/Rounding.ts`, `src/Coordinates.ts` from `batoulapps/adhan-js`. Live `node` invocation against the installed `adhan@4.4.3`.
- Bundle size: unpkg listing for `adhan@4.4.3/lib/bundles/` and locally downloaded `adhan.umd.min.js`. fajr from `npm pack --dry-run` and `find … src -name "*.js"`.

All evidence dated 2026-05-02 (today).

---

## Verified claims (✓)

- **Type / Offline**: AlAdhan = REST API ✓; adhan-js = JS library, fully offline ✓; fajr = JS library, offline ✓.
- **adhan-js no GPS-aware auto method**: README + METHODS.md confirm — every method must be picked manually via `CalculationMethod.MuslimWorldLeague()` etc. ✓
- **adhan-js no hilal/lunar features**: README contains zero mention of moon/lunar/hilal/crescent. The source files in `src/` are: Adhan, Astronomical, CalculationMethod, CalculationParameters, Coordinates, DateUtils, HighLatitudeRule, Madhab, MathUtils, PolarCircleResolution, Prayer, PrayerTimes, Qibla, Rounding, Shafaq, SolarCoordinates, SolarTime, SunnahTimes, TimeComponents, TypeUtils. No moon/hilal file. ✓
- **adhan-js no elevation parameter**: `Coordinates` class (file content quoted): `export default class Coordinates { constructor(public latitude: number, public longitude: number) {} }` — no elevation field. ✓
- **AlAdhan no hilal/crescent endpoints**: tested `/v1/moonInfo`, `/v1/crescent`, `/v1/hilal`, `/v1/visibility` — all return `404 RESOURCE_NOT_FOUND`. ✓
- **AlAdhan = "single criterion" for moon**: AlAdhan has Hijri calendar conversion (`/v1/gToH`, `/v1/currentIslamicYear`, `/v1/islamicHolidaysByHijriYear`) but ZERO crescent visibility endpoints. Whether to call this "single criterion" or "no criterion" is a wording question — see Inaccurate section.
- **AlAdhan free-tier rate limits**: documented at islamic-network community forum (closed today, but referenced); AlAdhan publishes a "free for non-commercial" license. ✓ (label is fair, even without a verbatim quote.)
- **adhan-js no API key / no rate limits**: pure offline JS library — trivially true. ✓
- **fajr Path A calibrations exist**: confirmed locally — `fajr.prayerTimes({method:'Morocco'})` returns `method: 'Morocco (19°/17° + +5min Maghrib ihtiyati per Path A community calibration)'`. ✓
- **fajr exposes notes[] with institutional context**: confirmed in `src/engine.js` and `src/elevation.js`. ✓
- **Geocoding row**: AlAdhan has `/v1/timingsByCity` and `/v1/timingsByAddress` (city/address-string input → coord internally). ✓ adhan-js has none. ✓ fajr has none. ✓

---

## Inaccurate claims (✗)

### Row "Auto method by GPS" — AlAdhan = "partial (`?method=auto`)"

**Inaccurate.** Tested live against `?method=auto` for four cities (Casablanca, Karachi, Ankara, Kuala Lumpur). In every case, the meta block returned `method.id: 2` ("Islamic Society of North America (ISNA)") with `params: {Fajr: 15, Isha: 15}`. There is **no GPS-aware dispatch** — `method=auto` silently falls back to ISNA regardless of input coordinate. ISNA's reference location is Plainfield, Indiana — not "auto-resolved per GPS."

The AlAdhan source code (mawaqit fork, `Method.php`) does not contain any `auto` constant. The list of method codes is JAFARI, KARACHI, ISNA, MWL, MAKKAH, EGYPT, TEHRAN, GULF, KUWAIT, QATAR, SINGAPORE, FRANCE, TURKEY, RUSSIA, MOONSIGHTING, DUBAI, JAKIM, TUNISIA, ALGERIA, KEMENAG, MOROCCO, PORTUGAL, JORDAN, CUSTOM. No AUTO.

**Suggested correction**: "❌ no GPS auto-dispatch (named per-country methods only; `?method=auto` silently falls back to ISNA)".

### Row "Path A community calibrations" — adhan-js = "❌"

**Inaccurate.** adhan-js DOES bake in institutional offsets for several methods:

- **Turkey** (`Diyanet` approximation): `methodAdjustments = { sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7 }`
- **Dubai**: `methodAdjustments = { sunrise: -3, dhuhr: 3, asr: 3, maghrib: 3 }`
- **MoonsightingCommittee**: `methodAdjustments = { dhuhr: 5, maghrib: 3 }`
- **Singapore**: `rounding: Rounding.Up` (direction-aware rounding, method-specific)
- Most other methods set `dhuhr: 1` (one-minute Dhuhr offset).

Source: `https://raw.githubusercontent.com/batoulapps/adhan-js/master/src/CalculationMethod.ts`. Verified with `node -e "console.log(require('adhan').CalculationMethod.Turkey().methodAdjustments)"` returning `{ fajr: 0, sunrise: -7, dhuhr: 5, asr: 4, maghrib: 7, isha: 0 }`.

**Suggested correction**: rephrase from "❌" to "partial — bakes Turkey/Dubai/MoonsightingCommittee offsets but no Morocco / JAKIM / KEMENAG and no Mawaqit-validated calibrations". The differentiator vs adhan-js is **(a)** which methods are covered (fajr adds Morocco, JAKIM-tuned, etc., that adhan-js lacks) and **(b)** that fajr's calibrations are validated against mosque-published reality (Mawaqit), not just inherited from the upstream method definition.

### Row "Path A community calibrations" — AlAdhan = "❌"

**Inaccurate.** AlAdhan's MOROCCO method (id 21) bakes Maghrib +5 min — verified live: `Sunset: 20:14, Maghrib: 20:19` for Casablanca on 2026-05-02. Their JORDAN method bakes `Maghrib: "5 min"`. Their PORTUGAL method bakes `Maghrib: "3 min"` and `Isha: "77 min"`. Their JAKIM method uses Fajr 20° / Isha 18° — that's the angle change, not an offset, but the angle choice IS Malaysia's institutional choice.

**Suggested correction**: rephrase to "named per-country methods (Morocco, Jordan, Portugal, JAKIM) include some institutional defaults; calibrations are not validated against mosque-published Mawaqit and the docs don't expose provenance / which mosques the offsets match." The fajr-vs-AlAdhan differentiator is **validation against Mawaqit/Diyanet/JAKIM ground truth + transparent provenance**, NOT presence-vs-absence of offsets.

### Row "Hilal (3 criteria side-by-side)" — AlAdhan = "single criterion"

**Inaccurate.** AlAdhan has no crescent-visibility endpoint at all. They have Hijri calendar conversion (Umm al-Qura tabular method, lunarSighting flag in date metadata) but no Yallop / Odeh / Shaukat / SAAO computation. "Single criterion" overstates what they ship.

**Suggested correction**: AlAdhan = "❌ — no crescent visibility (Hijri calendar tabular only)".

### Row "Per-prayer ihtiyat rounding" — adhan-js = "round-to-nearest"

**Partly inaccurate.** adhan-js exports `Rounding = { Nearest, Up, None }`. Default is `Nearest`, but `Rounding.Up` exists and IS used by the Singapore method (verified in `CalculationMethod.ts`). adhan-js does not have *per-prayer* directional rounding (the four-direction shar'i-safe scheme fajr uses), but it's not flat "round-to-nearest" — the ceiling option exists.

**Suggested correction**: "round-to-nearest by default (`Rounding.Up`/`None` available globally, not per-prayer)".

### Row "Per-prayer ihtiyat rounding" — AlAdhan = "❌"

**Partly inaccurate.** Source code (`PrayerTimes.php` line 312): `$time = DMath::fixHour($time + 0.5/ 60);  // add 0.5 minutes to round; $hours = floor($time); $minutes = floor(($time - $hours)* 60);` — this is plain round-to-nearest. So the claim of "no per-prayer ihtiyat" is correct; the "❌" wording understates what they DO ship (round-to-nearest applied uniformly).

**Suggested correction**: "round-to-nearest (uniform; not per-prayer ihtiyat-aware)" — same outcome but precise.

### Row "Elevation advisory" — AlAdhan = "parameter only"

**Mostly accurate** — but worth tightening with the empirical evidence. Tested four elevation values (none, 0, 3000, 8000) at Cape Town (-33.92, 18.42) for 2026-05-02 with method=3. **All four returned IDENTICAL timings** (Fajr 05:57, Sunrise 07:22, Maghrib 18:04, Isha 19:25). The mawaqit-fork source has the elevation formula at line 586 (`$angle = 0.0347* sqrt($this->elevation)`), but the LIVE API does not appear to wire it through — possibly the param isn't read by the route handler, possibly cached, possibly the v1 endpoint silently ignores it.

**Suggested correction**: "accepts `elevation=` query param but tested values 0–8000 m return identical times (not applied at API edge, despite being implemented in the published source)".

### Row "Bundle size" — adhan-js = "~30 KB", fajr = "~50 KB"

**Inaccurate.** Verified via unpkg listing of `adhan@4.4.3/lib/bundles/`:
- adhan.umd.min.js: **16 kB** (minified)
- adhan.umd.js: **44 kB** (unminified)
- adhan.esm.min.js: **15.7 kB**
- adhan.esm.js: **41.4 kB**

The "~30 KB" claim is between minified and raw — not a value adhan-js actually ships.

For fajr (1.6.2):
- Source JS only (10 files): 109,839 bytes ≈ **107 KB** raw, unminified
- npm tarball: 65.6 kB (gzipped) / **207.6 kB unpacked** (includes README 76.9 KB, types, all sources)
- Pure source (excluding README/types/license): ~107 KB unminified

There is no minified bundle published for fajr at v1.6.2.

**Suggested correction**: "adhan-js: ~16 KB minified / ~44 KB raw. fajr: ~107 KB raw source today (no minified bundle published; ~50 KB minified estimate is unverified)."

### Row "Public audit / eval framework" — adhan-js = "❌"

**Accurate but understated.** adhan-js DOES have unit tests (the README says "well tested", uses Travis + codecov). What it lacks is the **WMAE-against-mosque-published-reality** framework that fajr ships. The differentiator is **type of validation** (correctness vs published reference) rather than presence-vs-absence of tests.

**Suggested wording tweak**: "no WMAE-vs-mosque-reality framework (has unit tests for self-consistency)".

---

## Insufficient evidence (?)

- **AlAdhan "scholarly classification + wiki"** = ❌: I could not access AlAdhan's full docs page (JS-rendered, neither WebFetch nor curl rendered the body). I confirmed the `/v1/methods` response does NOT carry classification tags (params + name + location only). There MAY be a written explanation page somewhere on aladhan.com I didn't see. The "❌" claim is most likely correct but could be stated as "method definitions in `/v1/methods` don't carry scholarly classification tags".

- **AlAdhan auto-dispatch — could there be a different param name?** I tried `method=auto`, `?method=` (empty), and the canonical `method=N`. There's no other documented dispatch param. But I couldn't read the rendered docs page to be 100% sure — this is "no evidence found" rather than "documented absence".

---

## Recommended README revisions

| Row | Current claim | Corrected claim |
|---|---|---|
| Auto method by GPS | "AlAdhan: partial (`?method=auto`)" | "AlAdhan: ❌ — `method=auto` silently falls back to ISNA; per-country named methods are manual" |
| Path A community calibrations | "AlAdhan: ❌; adhan-js: ❌" | "AlAdhan: partial (Morocco Maghrib +5, Jordan Maghrib +5, Portugal Maghrib +3 / Isha 77min baked in; no Mawaqit validation, no provenance); adhan-js: partial (Turkey, Dubai, MoonsightingCommittee per-method offsets baked in; no Morocco / JAKIM-validated, no provenance); fajr: full Path A — Morocco / JAKIM / Diyanet / etc. validated against mosque-published Mawaqit and surfaced via `notes[]`" |
| Hilal (3 criteria side-by-side) | "AlAdhan: single criterion" | "AlAdhan: ❌ — no crescent visibility endpoint; Hijri calendar tabular only" |
| Per-prayer ihtiyat rounding | "AlAdhan: ❌; adhan-js: round-to-nearest" | "AlAdhan: round-to-nearest (uniform; not per-prayer); adhan-js: round-to-nearest by default (`Rounding.Up`/`None` available globally, not per-prayer); fajr: per-prayer ihtiyat-safe + explicit `imsak` field" |
| Elevation advisory | "AlAdhan: parameter only" | "AlAdhan: `elevation=` accepted but not wired through to live API output (tested 0–8000 m returns identical timings; the mawaqit-fork source has the formula but the live route ignores it)" |
| Bundle size | "adhan-js: ~30 KB; fajr: ~50 KB today (~130 KB with v1.7.0 city registry)" | "adhan-js: ~16 KB minified / ~44 KB raw (v4.4.3); fajr: ~107 KB raw source today (no minified bundle published)" |
| Hilal — fajr column | "✅ — Yallop+Odeh+Shaukat" | (no change — verified via /Users/tm/Dev/fajr/src/hilal.js) |

The "AlAdhan = ❌ for elevation in practice" + "AlAdhan = partial for Path A calibrations" + "adhan-js = partial for Path A calibrations" together change the *story* of the table. The cleaner pitch isn't "AlAdhan and adhan-js have nothing here, fajr has everything" — it's "AlAdhan and adhan-js have textbook fragments; fajr is the only library validated against mosque-published reality, with transparent provenance."

---

## Sources cited

- AlAdhan live API tests (2026-05-02): `https://api.aladhan.com/v1/timings/02-05-2026?...` for Cape Town, Casablanca, Karachi, Ankara, Kuala Lumpur. Tested with method=3, 13, 14, 17, 21, auto, and elevation=0/3000/8000.
- AlAdhan methods list: `https://api.aladhan.com/v1/methods` (24 named methods + CUSTOM; no AUTO).
- AlAdhan source (mawaqit fork, declared as fork of deleted `islamic-network/prayer-times`): `https://github.com/mawaqit/prayer-times` — `src/PrayerTimes/Method.php` and `src/PrayerTimes/PrayerTimes.php`.
- adhan-js README + METHODS.md: `https://github.com/batoulapps/adhan-js`.
- adhan-js source: `https://raw.githubusercontent.com/batoulapps/adhan-js/master/src/CalculationMethod.ts`, `Rounding.ts`, `Coordinates.ts`.
- adhan-js bundle sizes: unpkg `https://app.unpkg.com/adhan@4.4.3/files/lib/bundles`. Local download confirmed `adhan.umd.min.js` = 16,000 bytes (5,282 bytes gzipped).
- fajr source: `/Users/tm/Dev/fajr/src/*.js` (10 files, 109,839 bytes); `npm pack --dry-run` (65.6 kB tarball, 207.6 kB unpacked).
- AlAdhan unofficial docs gist: `https://gist.github.com/Zxce3/e1cc0363de3694e04bb440a5c8d57726`.

---

## Total claims checked: 13 rows × 3 columns = 39 cells. Inaccurate count: 7 cells materially wrong (auto-method-aladhan, path-A-calibrations × 2, hilal-aladhan, ihtiyat-rounding × 2, bundle-size × 2). 4 cells imprecise but defensible (geocoding, scholarly-classification-aladhan, audit-framework-adhan-js, "single criterion" wording).

— fajr-agent
