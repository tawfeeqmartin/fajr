# Changelog

All notable changes to `@tawfeeqmartin/fajr` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):

- **Major (`X.0.0`)** — breaking changes to the public API surface (`prayerTimes`,
  `dayTimes`, `tarabishyTimes`, `detectLocation`, `nearestCity`,
  `applyElevationCorrection`, `applyTayakkunBuffer`, `hilalVisibility`, `qibla`,
  `hijri`, `nightThirds`, `travelerMode`).
- **Minor (`x.Y.0`)** — additive features, new exports, new methods, new fields
  on existing return shapes, new accuracy calibrations that materially shift
  output for some users.
- **Patch (`x.y.Z`)** — bug fixes, internal refactors, doc-only changes,
  publish hotfixes.

The "Honest caveats" section of each entry calls out anything users of the
library should specifically know — observable-behavior changes that aren't
strictly API-breaking but may shift returned values for some inputs.

Cross-references: per-release autoresearch logs live in [`autoresearch/logs/`](autoresearch/logs/);
proposals live in [`autoresearch/proposals/`](autoresearch/proposals/).

---

## [1.7.7] — 2026-05-03

### Changed

- **README and INTEGRATION docs catch-up** for v1.7.5 + v1.7.6 features. Status
  banner now reflects v1.7.6. New README sections: City registry validation in
  CI (v1.7.5), Hijri calendar conventions (v1.7.6), Elevation note magnitude
  (v1.7.6). API stability table updated to document `hijri`'s `convention`
  parameter.
- **CHANGELOG.md introduced** (this file). Reverse-chronological per-release
  narrative covering v1.0.0 through v1.7.7. Future releases append to the top.
- **`examples/agiftoftime/INTEGRATION.md` overhauled** to cover everything
  shipped since the v1.5.2 last-update — v1.6.x country dispatch expansion,
  v1.7.0 city-aware location + 12 city-method overrides + auto-elevation,
  v1.7.2 4 new city overrides, v1.7.3 nearestCity fallback, v1.7.4 cross-runtime
  compatibility, v1.7.5 city-registry validation, v1.7.6 Umm al-Qura hijri +
  elevation note magnitude. Per-feature integration recipes for agiftoftime
  added inline.

### No code change

This is a pure documentation release. No `src/*` files were modified; eval
WMAE is unchanged. Bumped to allow npm to surface the doc improvements via
`npm view @tawfeeqmartin/fajr readme`.

---

## [1.7.6] — 2026-05-03

### Added

- **`hijri()` `convention` option** — `hijri(date, { convention })`, where
  `convention ∈ 'umm-al-qura' | 'tabular' | 'observational'`. New default:
  `'umm-al-qura'`. Type-exported as `HijriConvention` and `HijriOptions` from
  `src/index.d.ts`.
- **Embedded Umm al-Qura tabular data** at [`src/data/umm-al-qura-tabular.json`](src/data/umm-al-qura-tabular.json)
  (31 KB; 1318–1500 AH coverage; pre-computed from `umalqura/umalqura` MIT and
  cross-validated against the .NET BCL Umm al-Qura calendar / ummulqura.org.sa).
- **`computeElevationDipMinutes(elevation, latitude)` magnitude** in the
  city-registry elevation auto-resolution `notes[]` entry, e.g. "Riyadh, 612m
  → Maghrib +2.7 min later, Shuruq -2.7 min earlier vs sea-level."

### Changed

- **`hijri()` default behavior** changed from Kuwaiti arithmetic (tabular) to
  Umm al-Qura tabular. **Observable-behavior change** — see Honest caveats below.
  Closes [#48](https://github.com/tawfeeqmartin/fajr/issues/48).
- **Elevation note text** widened to disclose the actual minute-magnitude of
  the Maghrib/Shuruq shift alongside the existing institutional split. Closes
  [#50](https://github.com/tawfeeqmartin/fajr/issues/50).

### Honest caveats

- The hijri default switch is **observable but not strictly API-breaking** —
  the function signature is unchanged (`hijri(date)` still returns
  `{ year, month, day, monthName }`), but for some Gregorian dates the
  returned values now match AlAdhan / IslamicFinder / IACAD / Microsoft
  rather than the Kuwaiti arithmetic algorithm. agiftoftime-agent's 16-date
  audit (issue #48) found ~38% of dates were off by 1 day or by a full month
  at Eid boundaries (Eid al-Fitr 1444 / 1446 / Eid al-Adha 1445); all 16/16
  now match the AlAdhan reference.
- Apps that rely on the Kuwaiti arithmetic output for any reason can opt back
  in via `hijri(date, { convention: 'tabular' })`.
- Out-of-range dates (pre-1900 or post-2077 Gregorian; pre-1318 or post-1500 AH)
  now throw `RangeError` instead of silently extrapolating. Wrap with a
  tabular fallback if your app handles those ranges:

```js
function hijriSafe(date) {
  try { return hijri(date) }
  catch (e) {
    if (e instanceof RangeError) return hijri(date, { convention: 'tabular' })
    throw e
  }
}
```

### Test results

- 227 tests pass (was 203 in v1.7.5). 24 new tests: 16 UAQ reference dates +
  3 backwards-compat tabular sanity checks + 4 edge cases + 2 elevation note
  magnitude cases.

### Scholarly classification

- Hijri Umm al-Qura: 🟡→🟢 *Approaching established* — Saudi Arabia's official
  calendar; digital-ecosystem consensus (AlAdhan/IslamicFinder/IACAD/Microsoft).
  Not pure 🟢 because Diyanet (Türkiye), JAKIM (Malaysia), and regional
  moonsighting committees legitimately diverge by ±1 day; UAQ is the digital
  consensus, not the full-ummah scholarly consensus.
- Elevation note magnitude: 🟢 Established — presentation refinement; no new
  astronomical claim.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-03-10-10-v1.7.6-hijri-uaq-and-elevation-note.md`](autoresearch/logs/2026-05-03-10-10-v1.7.6-hijri-uaq-and-elevation-note.md)
- Proposal: [`autoresearch/proposals/v1.7.6-hijri-umm-al-qura.md`](autoresearch/proposals/v1.7.6-hijri-umm-al-qura.md)

---

## [1.7.5] — 2026-05-03

### Added

- **`scripts/validate-city-registry.js`** — systematic validator that
  cross-checks every row in [`src/data/cities.json`](src/data/cities.json)
  against three failure classes: `country-claim`, `cross-border`, `bbox-internal`.
  Run via `npm run validate:registry`.
- **`BBOX_OVERRIDES` table** in [`scripts/build-city-registry.js`](scripts/build-city-registry.js)
  — explicit per-city bbox overrides that win over the population-radius
  formula. Six entries shipped: Giza/Cairo, Shah Alam/KL, Johor Bahru,
  Singapore, Sharjah, Dearborn.
- **`city-registry-validation` CI job** in [`.github/workflows/lint.yml`](.github/workflows/lint.yml)
  with a FAIL-class budget (currently 180; v1.7.5 baseline 146). Future PRs
  pushing the count above the budget fail the lint job.

### Fixed

- **Issue [#47](https://github.com/tawfeeqmartin/fajr/issues/47) — four
  false-positive city resolutions** (Toronto → USA, Cairo → "Giza", Kuala Lumpur
  → "Shah Alam", Singapore → "Johor Bahru"). All four FIXED.
- **8 of Reviewer C's 23 catalogued bug classes** — Saudi-bbox/Sinai overlap,
  Saudi-NE/Iran overlap, Mexico/USA northern-border, Vientiane/Phnom Penh/Hanoi/
  Asunción/Montevideo dispatch, Sharjah/Dubai overlap, Dearborn/Windsor (Canada).
  The remaining 14 (sub-national-bbox cases like Cyprus/Belfast/Vladivostok)
  are deferred to v1.7.6+.
- **9 country-claim regressions** exposed by the validator: Vientiane,
  Phnom Penh, Hanoi, Asunción, Montevideo, Mbabane, Gitega, Bangui, Luanda,
  Brazzaville, Niamey — all FIXED via `detectCountry` reorderings.
- **`detectLocation` two-pass refactor** — Pass A skips a candidate city if its
  `countryISO` doesn't agree with `detectCountry`'s verdict (eliminates
  cross-border bbox leaks); Pass B falls back when Pass A returned no match
  but the candidate's claimed country bbox independently contains the coord
  (handles Toronto / Montreal / Ottawa where USA's bbox extends north).

### Changed

- **FAIL-class issue count: 519 → 146 (72% reduction).** Remaining 146 are a
  mix of intra-country sibling overlaps, country-bbox edge cases, and
  validator-strictness false positives where the engine resolves correctly
  via Pass-B.

### Test results

- All 190 unit tests pass. Eval WMAE unchanged (this is a city/country
  detection bugfix, not an accuracy correction).

### Scholarly classification

- 🟢 Established — pure engine bbox / lookup logic; no shar'i ruling involved.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-03-00-04-v1.7.5-city-registry-validation.md`](autoresearch/logs/2026-05-03-00-04-v1.7.5-city-registry-validation.md)
- Issue: [#47](https://github.com/tawfeeqmartin/fajr/issues/47)
- PR: [#52](https://github.com/tawfeeqmartin/fajr/pull/52)

---

## [1.7.4] — 2026-05-02

### Added

- **Runtime compatibility documentation** in README — explicit support table
  for Node ≥18, Browser ESM, React Native ≥0.74, Expo ≥51, Capacitor ≥6,
  Cordova / PhoneGap, Electron ≥30, Tauri ≥2, NativeScript ≥8, JavaScriptCore
  (iOS/macOS embedded), Cloudflare Workers / Vercel Edge / Deno, Bun.
- **Cross-runtime recipes** — React Native / Expo, Capacitor, JavaScriptCore.
- **Native iOS / Android / Windows ports roadmap** referenced (issue [#44](https://github.com/tawfeeqmartin/fajr/issues/44)).
- **JSC IIFE bundle gap noted** — fajr currently ships ESM-only; an IIFE
  bundle for non-ESM environments tracked in issue [#46](https://github.com/tawfeeqmartin/fajr/issues/46).

### Changed

- README "Status" banner updated to v1.7.4.

### No code change

Documentation-only release. No `src/*` files modified.

### Cross-references

- PR: [#45](https://github.com/tawfeeqmartin/fajr/pull/45)

---

## [1.7.3] — 2026-05-02

### Added

- **`nearestCity(latitude, longitude) → { city, distanceKm }`** — kNN-fuzzy
  display-only lookup that always returns the closest city in the bundled
  registry plus haversine distance in km. Never returns null. **DISPLAY-ONLY**
  — for prayer-time dispatch, continue to use the bbox-precise `detectLocation`.
- TypeScript types: `NearestCityResult`.

### Honest caveats

- For coordinates very far from any city (deep ocean, polar research stations),
  `distanceKm` will be in the thousands — apps may want to suppress the label
  above some threshold (e.g. 200 km).

### Scholarly classification

- 🟢 Established — pure lookup, no shar'i ruling involved.

### Cross-references

- Issue: [#37](https://github.com/tawfeeqmartin/fajr/issues/37)
- PR: [#42](https://github.com/tawfeeqmartin/fajr/pull/42)

---

## [1.7.2] — 2026-05-02

### Added

- **4 new city-method overrides** — Lucknow (Karachi via Indian-Sunni
  convention), Kochi (Karachi via Kerala Sunni convention), Cotabato (Karachi
  via Bangsamoro convention), Marawi (Karachi via Bangsamoro convention).
  Resolves [#32](https://github.com/tawfeeqmartin/fajr/issues/32).

### Changed

- City-method-override count: 12 → 16.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-03-03-38-v1.7.2-city-overrides-research.md`](autoresearch/logs/2026-05-03-03-38-v1.7.2-city-overrides-research.md)
- Issue: [#32](https://github.com/tawfeeqmartin/fajr/issues/32)
- PR: [#41](https://github.com/tawfeeqmartin/fajr/pull/41)

---

## [1.7.1] — 2026-05-02

### Added

- **Maldives + Sri Lanka explicit Shafi Asr** — both countries default to the
  Shafi madhab for Asr (1× shadow length) per local consensus.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-03-03-15-v1.7.1-maldives-srilanka-asr.md`](autoresearch/logs/2026-05-03-03-15-v1.7.1-maldives-srilanka-asr.md)
- Issue: [#26](https://github.com/tawfeeqmartin/fajr/issues/26)
- PR: [#38](https://github.com/tawfeeqmartin/fajr/pull/38)

---

## [1.7.0] — 2026-05-02

### Added

- **City-aware location resolution** — bundled 375-city registry at
  [`src/data/cities.json`](src/data/cities.json) (~95 KB) drives city-level
  method overrides, per-city elevation auto-resolution, and rich provenance.
- **`location` field on every `prayerTimes()` / `dayTimes()` return value.**
  Always populated. Carries:
  ```ts
  {
    city: { name, countryISO, elevation, methodOverride, source, altMethods, ... } | null,
    country: string | null,
    timezone: string,
    elevation: number,
    methodSource: 'caller-explicit' | 'city-institutional' | 'country-default' | 'fallback',
    elevationSource: 'caller-explicit' | 'city-registry' | 'default-zero',
  }
  ```
- **`detectLocation(latitude, longitude, fallbackElevation?)`** — public
  standalone export; pure lookup, no astronomy. Returns the same shape plus
  `recommendedMethod`, `altMethods`, `source`. Returns `city: null` honestly
  when the coordinate is outside every registered bbox.
- **12 city-level institutional method overrides:**
  - Mosul → Karachi (Iraqi Sunni Endowment Office / Diwan al-Waqf al-Sunni)
  - Najaf → Tehran (Office of Grand Ayatollah al-Sistani)
  - Karbala → Tehran (Astan al-Husayniyya / Astan al-Abbasiyya)
  - Basra → Tehran (Twelver Shia mosque-published / Sistani-aligned)
  - Sarajevo → Diyanet (Rijaset Islamske Zajednice u BiH)
  - Mostar → Diyanet (Rijaset BiH — Hercegovački muftijstvo)
  - Banja Luka → Diyanet (Rijaset BiH — Banjalučko muftijstvo)
  - Pristina → Diyanet (Bashkësia Islame e Kosovës / BIK Takvimi)
  - Bradford → MoonsightingCommittee (Bradford Council of Mosques / BCOM)
  - Beirut → Egyptian (Dar al-Fatwa al-Lubnaniyya)
  - Tabriz → Tehran (Tehran Institute of Geophysics regional default)
  - Dearborn → ISNA (Dearborn Sunni convention; Tehran-style Twelver Shia
    minority surfaced via altMethods)
- **Auto-elevation from city registry.** When `elevation` is omitted from
  `prayerTimes()`, fajr uses the city's registered elevation if known and
  applies `applyElevationCorrection` inline. Caller-explicit `elevation: 0`
  still wins (Saudi/jama'ah-unity opt-out).
- **`notes[]` auto-resolution entries** — "Method auto-resolved from city
  institutional override: <city> → <method> (<institution>)" and
  "Elevation auto-resolved from city registry: <city>, <m>m" — fired only
  on the auto-resolution paths.
- **Privacy assertion** — fajr never logs, persists, or transmits coordinates
  passed to it. The city resolution happens entirely locally via the bundled
  registry. No telemetry, no analytics, no remote calls.

### Changed

- Method dispatch precedence: caller-explicit > city-institutional >
  country-default > fallback.
- Elevation precedence: caller-explicit > city-registry > default-zero.
- Of the 12 city-method-override cities, 4 (Mosul, Najaf, Karbala, Basra)
  produce **materially-different clock times** vs the v1.6.x country default
  (Mosul Fajr +8min, Najaf/Karbala/Basra Isha −17 to −18 min). The other 8
  produce identical times because the city's `methodOverride` matches the
  country default; the change is observable only via `location.methodSource`
  flipping from `'country-default'` to `'city-institutional'` and the
  auto-resolution `notes[]` entry.

### Honest caveats

- **Bundle size +~95 KB** for the city registry (375 cities, full registry
  shape). Apps that aggressively code-split for PWA size may want to verify
  the impact.
- City-bbox false positives shipped in this release (Toronto, Cairo, KL,
  Singapore) were filed as [#47](https://github.com/tawfeeqmartin/fajr/issues/47) and FIXED in v1.7.5.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-03-02-47-v1.7.0-phase2-prayertimes-integration.md`](autoresearch/logs/2026-05-03-02-47-v1.7.0-phase2-prayertimes-integration.md)
- Proposal: [`autoresearch/proposals/v1.7.0-city-aware-location.md`](autoresearch/proposals/v1.7.0-city-aware-location.md)
- PRs: [#28](https://github.com/tawfeeqmartin/fajr/pull/28) (phase 1 — registry + detectLocation),
  [#34](https://github.com/tawfeeqmartin/fajr/pull/34) (phase 2 — wire into prayerTimes),
  [#36](https://github.com/tawfeeqmartin/fajr/pull/36) (phase 3 — public detectLocation API + types + README + 1.7.0 release bump)

---

## [1.6.5] — 2026-05-02

### Fixed

- Publish hotfix — v1.6.4 ghosted on npm (publish failed on a leaked test file
  from PR [#27](https://github.com/tawfeeqmartin/fajr/pull/27)'s squash). v1.6.5 is the first published version
  containing the v1.6.2 country-coverage closure.

### Cross-references

- PR: [#31](https://github.com/tawfeeqmartin/fajr/pull/31)

---

## [1.6.4] — 2026-05-02

### Cross-references

- PR: [#29](https://github.com/tawfeeqmartin/fajr/pull/29) — version bump after the v1.6.2 85-country-gap close shipped via PR [#27](https://github.com/tawfeeqmartin/fajr/pull/27)
- **Did not publish to npm** — see v1.6.5 hotfix.

---

## [1.6.3] — 2026-05-02

### Fixed

- **7 country-name aliases reconciled** between `engine.js` and Aladhan
  canonical names — internal naming drift was preventing some country lookups
  from finding the right method.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-03-01-58-v1.6.3-alias-normalization.md`](autoresearch/logs/2026-05-03-01-58-v1.6.3-alias-normalization.md)
- PR: [#24](https://github.com/tawfeeqmartin/fajr/pull/24)

---

## [1.6.2] — 2026-05-02

### Added

- **Country dispatch coverage 78 → 163** — `engine.js` now bbox-dispatches
  the right institutional method for 163 countries via the v1.6.0 global-bbox
  framework extended with 85 new entries.
- Wiki backfill: `knowledge/wiki/regions/<country>.md` for the 85 newly-covered
  countries.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-02-v1.6.2-country-coverage.md`](autoresearch/logs/2026-05-02-v1.6.2-country-coverage.md)
- Proposal: [`autoresearch/proposals/v1.6.2-country-coverage.md`](autoresearch/proposals/v1.6.2-country-coverage.md)
- PR: [#27](https://github.com/tawfeeqmartin/fajr/pull/27) (squash-leaked a test file — see v1.6.5 hotfix)

---

## [1.6.1] — 2026-05-02

### Fixed

- **`scripts/fetch-aladhan-world.js` date-format bug** — the script was
  silently parsing `YYYY-MM-DD` request dates as `02 May 2002` (24 years off)
  due to a date-format mismatch with the Aladhan API. All fetch scripts and
  audit routines now reflect-check the response's date field against the
  request date. Closes the silent-data-corruption class of bugs.

### Cross-references

- PR: [#17](https://github.com/tawfeeqmartin/fajr/pull/17)

---

## [1.6.0] — 2026-05-02

### Added

- **Global bbox + method dispatch** — `engine.js` country detection extended
  from 27 to 78 countries via a unified `COUNTRY_BBOX_TABLE` lookup keyed off
  ISO codes. Each country bbox carries a recommended method derived from the
  Aladhan world-default for that country, with overrides for institutional
  authorities (Diyanet for TR/AZ/KZ/UZ/TM/KG/TJ; JAKIM for MY/SG/BN/ID; etc.).
- **Auto-merger for the v1.6.0 batch** — automation to relieve the human
  merge-bottleneck on the 51-country expansion.

### Cross-references

- Autoresearch logs: [`autoresearch/logs/2026-05-02-v1.6.0-global-bbox.md`](autoresearch/logs/2026-05-02-v1.6.0-global-bbox.md), [`autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`](autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md)
- PRs: [#12](https://github.com/tawfeeqmartin/fajr/pull/12), [#14](https://github.com/tawfeeqmartin/fajr/pull/14)

---

## [1.5.2] — 2026-05-02

### Added

- **Elevation advisory at altitudes ≥500 m** — `prayerTimes()` now emits a
  `notes[]` advisory when the caller passes a non-zero elevation that exceeds
  500 m, describing the institutional disagreement (UAE Burj Khalifa fatwa /
  IACAD Dulook DXB + Malaysia JAKIM apply; Saudi Arabia / Umm al-Qura
  declines for jama'ah unity) so apps can present the user with an informed
  toggle to recompute with `elevation: 0` if their local mosque follows the
  Saudi stance.
- **Elevation correction auto-applied** when caller passes non-zero elevation
  via `prayerTimes({ elevation: N })` — fajr's public wrapper now applies
  `applyElevationCorrection` inline (apply-stance default when elevation is
  supplied). To opt out, pass `elevation: 0` explicitly.

### Scholarly classification

- 🟡→🟢 *Approaching established* — UAE Burj Khalifa fatwa, Malaysia JAKIM
  topographic correction. Saudi/Umm al-Qura declines.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-02-elevation-policy.md`](autoresearch/logs/2026-05-02-elevation-policy.md)
- PR: [#16](https://github.com/tawfeeqmartin/fajr/pull/16)

---

## [1.5.1] — 2026-05-02

### Added

- **Per-prayer ihtiyat-aware minute rounding** — every displayed minute is on
  the prayer-validity-safe (or fasting-validity-safe for Imsak) side of the
  underlying solar event, by construction:
  - Imsak: DOWN (earlier) — fasting yaqeen
  - Fajr: UP (later) — prayer must start AFTER actual dawn
  - Shuruq / Sunrise: DOWN (earlier) — Fajr-window-close
  - Dhuhr / Asr / Maghrib / Isha: UP (later) — prayer-validity / iftar yaqeen
  - Sunset: UP (later) — astronomical event coinciding with Maghrib
- **Explicit `imsak` field** on `prayerTimes()` / `dayTimes()` output.
  Default offset: Fajr − 10 min, rounded DOWN. Reported via
  `result.corrections.imsak_offset_min`.
- `result.corrections.rounding` description string.

### Honest caveats

- Round-to-nearest behavior in v1.5.0 and earlier produced a displayed minute
  on the *unsafe* side of the underlying solar event ~50% of the time — meaning
  ~half of all displayed Maghribs could be up to 29 seconds before actual
  sunset, which would invalidate iftar by classical fiqh's *yaqeen* requirement.
  v1.5.1 fixes this by construction.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-02-ihtiyat-rounding.md`](autoresearch/logs/2026-05-02-ihtiyat-rounding.md)
- PR: [#9](https://github.com/tawfeeqmartin/fajr/pull/9)

---

## [1.5.0] — 2026-05-02

### Added

- **Morocco Maghrib +5min Path A calibration** — community-validated against
  23 Mawaqit-published mosque timetables across 14 Moroccan cities. Closes
  the prior systematic ~5-minute Maghrib gap vs Moroccan mosque-published
  reality.
- Morocco corpus expansion in train: 5 → 23 mosques across 14 cities
  (Casablanca/Rabat/Marrakech metro, Northern, Eastern, Interior, Atlantic
  coast, high-elevation Atlas/Sahara).
- Mosque registry — slug extraction to JSON + iconic-wishlist (30 canonical
  mosques).
- KEMENAG (34 Indonesian provinces) corpus + Morocco-extended (13 cities).

### Changed

- Train corpus restructure: 23 mosque-published Mawaqit-Morocco fixtures moved
  into train; 20 Aladhan calc-vs-calc Morocco entries moved to test.
- Path A discipline — every accepted Path A correction must pass the
  `eval/compare.js` ratchet's per-source / per-region / per-cell rules.

### Honest caveats

- v1.5.0's aggregate train WMAE sits *above* v1.4.5's because the corpus
  switch introduced higher-fidelity / higher-noise institutional ground
  truth. The engine is more accurate; the metric is better-calibrated.

### Scholarly classification

- 🟢 Established — Path A correction validated against ≥23 independent
  Mawaqit-published mosque timetables.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-02-morocco-pathA.md`](autoresearch/logs/2026-05-02-morocco-pathA.md)
- PR: [#5](https://github.com/tawfeeqmartin/fajr/pull/5)

---

## [1.4.5] — 2026-05-02

### Fixed

- Diyanet Path A −1 min Maghrib/Isha (train WMAE 0.68 → 0.67). Calibrated
  against the Diyanet İşleri Başkanlığı's official ezanvakti.emushaf.net
  publishing endpoint.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-02-diyanet-pathA.md`](autoresearch/logs/2026-05-02-diyanet-pathA.md)

---

## [1.4.4] — 2026-05-02

### Fixed

- JAKIM Isha +1 min Path A (train WMAE 0.70 → 0.68). Calibrated against
  JAKIM's official publishing via the waktusolat.app community proxy.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-02-jakim-isha.md`](autoresearch/logs/2026-05-02-jakim-isha.md)

---

## [1.4.3] — 2026-05-02

### Fixed

- Elevation-policy heuristic (train WMAE 1.04 → 0.70). Eval framework
  improvement that exposed real institutional residuals previously masked
  by elevation noise.

### Cross-references

- Autoresearch log: [`autoresearch/logs/2026-05-02-elevation-policy.md`](autoresearch/logs/2026-05-02-elevation-policy.md)

---

## [1.4.2] — 2026-05-01

### Added

- **Calibration recipe** at [`docs/calibration-recipe.md`](docs/calibration-recipe.md) — durable methodology guide that future Path A
  calibration work follows.
- **Auto-updating WMAE journey chart** at `docs/charts/wmae-journey.svg`.

---

## [1.4.1] — 2026-05-01

### Fixed

- JAKIM Path A ihtiyati offset (train WMAE 1.25 → 1.04).

---

## [1.4.0] — 2026-05-01

### Added

- Multi-source eval framework — Mawaqit (mosque-published reality), Diyanet
  (Türkiye institutional), JAKIM (Malaysia institutional), Aladhan (regional
  consensus calc-vs-calc), praytimes.org (independent JS reference),
  muslimsalat.com (third-party aggregator holdout).

---

## [1.3.0] — 2026-05-01

### Added

- **`applyTayakkunBuffer(times, mins=5)`** — opt-in 5-minute Fajr buffer per
  Aabed (2015) naked-eye observation paper (Jordan Journal for Islamic Studies
  v. 11(2)).
- **`tarabishyTimes(params, thresholdLat=45)`** — opt-in alternative
  high-latitude method per Tarabishy (2014). Below 45°, identical to
  `prayerTimes()`. Above, computes at the 45° truncated latitude.
- **`notes: string[]` field** on `prayerTimes` output — scholarly-grounded
  location-specific advisories. Initial entry: Odeh-2009 high-latitude
  regime warning at `|lat| ≥ 48.6°`.

### Scholarly classification

- `applyTayakkunBuffer`: 🟡 Limited precedent (Aabed 2015 peer-reviewed
  observational study).
- `tarabishyTimes`: 🟡 Limited precedent (Tarabishy 2014 published recommendation).

---

## [1.2.0] — 2026-05-01

### Added

- **Hilal (lunar crescent) visibility prediction** — three criteria computed
  side-by-side: Odeh (2004), Yallop (1997), Shaukat (2002). Returns
  `criteriaAgree` flag for borderline ikhtilaf cases.
- **`hilalVisibility({ year, month, latitude, longitude })`** export.
- **Meeus-based lunar position implementation** at `src/lunar.js`, validated
  against NASA JPL Horizons DE441 (max ΔRA 156″ for the Moon, max 15″ for
  the Sun).

---

## [1.1.1] — 2026-05-01

### Fixed

- Patch fixes following the v1.1.0 single-call API addition.

---

## [1.1.0] — 2026-05-01

### Added

- **`dayTimes(params)`** — single-call convenience returning all 9 day-times
  in one object: 6 prayers + sunrise + sunset + midnight + qiyam (start of
  last third of night).
- **`sunset` field** on `prayerTimes` output (distinct from `maghrib` for
  methods with a post-sunset offset; identical for most methods).

---

## [1.0.1] — 2026-05-01

### Added

- **`sunrise` alias** on `prayerTimes` output, pointing at the same Date
  instance as `shuruq`. Lets adhan-migrating apps keep their existing
  display code without a field-rename ripple.

---

## [1.0.0] — 2026-04-30

### Added — initial public release

- **Public API surface** (v1.0 stability contract):
  - `prayerTimes({ latitude, longitude, date, elevation?, method? })` — six
    prayers + method label + corrections metadata.
  - `qibla({ latitude, longitude })` — great-circle bearing toward the Kaaba.
  - `hijri(date)` — Kuwaiti tabular Hijri calendar conversion (default
    changed to Umm al-Qura in v1.7.6).
  - `applyElevationCorrection(times, elevation, latitude?)` — opt-in
    geometric horizon-dip correction per UAE Burj Khalifa fatwa / Malaysia
    JAKIM.
  - `nightThirds({ date, latitude, longitude })` or `nightThirds({ maghrib,
    fajr })` — divisions of the night for Tahajjud / Qiyam al-Layl timing.
  - `travelerMode({ times, madhab? })` — qasr / jam' permissibility metadata
    by madhab; user determines actual safar status.
- **27 country auto-dispatch** for the standard institutional methods
  (Morocco, Saudi Arabia, Türkiye, Egypt, UK, Malaysia, Indonesia, Pakistan,
  UAE, France, Canada, Norway/Iceland, Finland, etc.).
- **Two custom angle configs** not in adhan's defaults: Morocco 19°/17°
  community-calibrated, France UOIF 12°/12°.
- **Region-appropriate high-latitude rule selection** — adhan.js's
  `MiddleOfTheNight` for Norway/Iceland, `TwilightAngle` for Finland.
- **Eval framework** — write-protected ratchet at `eval/compare.js`; train
  WMAE drives accept/reject decisions; per-source, per-region, per-cell
  no-regression rules.
- **Knowledge base** at `knowledge/wiki/` — astronomy, fiqh, methods,
  regions, corrections — every correction in `src/engine.js` cites a wiki
  page with a scholarly classification (🟢 / 🟡→🟢 / 🟡 / 🔴).

### Scholarly classification

- All v1.0 corrections are 🟢 Established or 🟡→🟢 Approaching established.
  No 🔴 Novel corrections shipped — gated on human review per CLAUDE.md.

---

[1.7.7]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.7
[1.7.6]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.6
[1.7.5]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.5
[1.7.4]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.4
[1.7.3]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.3
[1.7.2]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.2
[1.7.1]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.1
[1.7.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.0
[1.6.5]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.6.5
[1.6.4]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.6.4
[1.6.3]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.6.3
[1.6.2]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.6.2
[1.6.1]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.6.1
[1.6.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.6.0
[1.5.2]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.5.2
[1.5.1]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.5.1
[1.5.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.5.0
[1.4.5]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.4.5
[1.4.4]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.4.4
[1.4.3]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.4.3
[1.4.2]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.4.2
[1.4.1]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.4.1
[1.4.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.4.0
[1.3.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.3.0
[1.2.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.2.0
[1.1.1]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.1.1
[1.1.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.1.0
[1.0.1]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.0.1
[1.0.0]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.0.0
