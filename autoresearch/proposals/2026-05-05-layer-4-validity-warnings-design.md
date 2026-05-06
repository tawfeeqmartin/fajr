// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

# Layer 4 Validity Warnings — Design Proposal

**Status:** Draft for review  
**Date:** 2026-05-05  
**Author:** fajr-claude-agent (sonnet-layer-4-designer)  
**References:** fajr#101 (5-layer canonical architecture), fajr#100 (motivating incident)  
**Target version:** v1.8.0 (core), v1.8.1+ (extensions)

---

## Background and Motivation

fajr#100 documented the "row-3-vs-row-17" failure mode: the engine was labeled as "Habous-aligned" while actually tracking the Mawaqit/AlAdhan-method-21 calculation cluster, with Habous's *real* published Imsakiyya diverging by 7-14 minutes on Maghrib and Isha. More critically, the real Habous Maghrib (20:10) was ~6 minutes *earlier* than the astronomical apparent sunset (20:16-20:18) — a fiqh-significant inversion that no existing tooling would have surfaced automatically.

fajr#101 (agot-claude's 5-layer architecture proposal) names **Layer 4 — Fiqh-Validity Warnings** as the layer that catches exactly this class of error: checking returned times against religiously valid astronomical windows and emitting machine-readable warnings for downstream decision-making.

This document specifies Layer 4 in implementation-ready detail.

---

## 1. API Surface — Opt-In vs Always-On

**Decision: Always-on, empty array when no warnings.**

### Rationale

The `notes[]` field is already always-on and users have adopted it. A `validityWarnings[]` field following the same convention is consistent and zero-overhead for clean calls: `result.validityWarnings.length > 0` is the idiomatic check.

The opt-in argument (`includeValidity: true`) would preserve the response byte-shape for v1.7.x callers who are strict-typed. However:

1. `validityWarnings` is a **new field**, not a mutation of an existing one. Per the TypeScript interface in `src/index.d.ts`, new fields on `PrayerTimesResult` are additive — existing callers destructuring `{ fajr, shuruq, dhuhr }` are unaffected.
2. The religious-safety argument is decisive: if a Maghrib time is returned that precedes astronomical sunset, the library *must not* require the caller to explicitly ask "was that time valid?" The warning must be unconditional.
3. Consistency with `notes[]`: the existing `notes` field is always-on without complaint from v1.7.x callers.
4. Opt-in creates a gap where library consumers who don't know about the flag get no protection — defeating the entire purpose of Layer 4.

**Counter-consideration acknowledged:** Some callers may want to suppress warnings for display (e.g. "show only the times, no caveats"). The correct architecture for that is `if (result.validityWarnings.length === 0) display(result)` — the caller filters at render time, not at compute time. The library's job is to flag; the app's job is to decide what to show.

**Verdict:** `validityWarnings: []` always present, always populated by the engine, always in the TypeScript interface on `PrayerTimesResult`.

---

## 2. Warning Categories

Three severity tiers, defined precisely:

### `critical`

A definite fiqh violation under *any* recognised scholarly school. The returned time is astronomically impossible given the prayer's *shar'i* definition. Examples: Maghrib before apparent sunset, Fajr after Shuruq, Asr outside the Dhuhr-Maghrib window.

**Action required by consumer:** Surface prominently. Do not show the time silently. A prayer performed at this time may be invalid regardless of madhab.

### `advisory`

The time is outside the typical range for one or more scholarly schools, but may be valid under a minority position or a different calculation convention. The caller may have intentionally overridden to a method that implies this (e.g. using UOIF 12° Fajr where MWL 18° is the regional default). Not necessarily wrong — requires human judgment.

**Action required by consumer:** Surface as a soft alert. Useful for "verify with your imam" UX patterns.

### `info`

A high-latitude adjustment rule fired, an unusual institutional parameter was applied, or the time differs significantly from a reference cluster. The calculation is valid and defensible — this is transparency, not a warning. Equivalent to a verbose `notes[]` entry but machine-readable.

**Action required by consumer:** Optional display. Useful for "Why is my Fajr at this time?" provenance sheets.

---

## 3. Per-Prayer Check Rules

All comparisons use the raw astronomical values from `adhan.PrayerTimes` (pre-rounding, `Rounding.None`). The checks fire against the *returned* (rounded) times, comparing them to raw astronomical reference values.

### Fajr

| Condition | Severity | Code |
|-----------|----------|------|
| `fajr > shuruq` | `critical` | `FAJR_AFTER_SHURUQ` |
| `fajr < astronomical_fajr_at_12deg` | `critical` | `FAJR_BEFORE_DAWN_12DEG` — absolute floor: no scholarly school places Fajr before 12° depression |
| `fajr > astronomical_fajr_at_12deg + 90min` | `advisory` | `FAJR_UNUSUAL_LATE` — high-lat rule applied or unusual offset; time is unusually late relative to any known astronomical dawn |
| High-latitude rule was applied in method selection | `info` | `FAJR_HIGH_LAT_RULE_APPLIED` |

**Notes on the 12° floor:** The most conservative (latest-dawn) school recognised in Islamic jurisprudence is around 12° solar depression. ISNA uses 15°, MWL 18°, Egypt 19.5°. A Fajr time placed earlier than the 12° depression line has no scholarly grounding and is certainly wrong. This is a hard `critical` floor.

### Shuruq (Sunrise)

| Condition | Severity | Code |
|-----------|----------|------|
| `shuruq < astronomical_sunrise_0deg - 3min` | `advisory` | `SHURUQ_UNUSUALLY_EARLY` — more than 3 min before apparent sunrise (accounting for refraction tolerance) |
| `shuruq > astronomical_sunrise_0deg + 3min` | `advisory` | `SHURUQ_UNUSUALLY_LATE` |

Shuruq has no direct fiqh validity window beyond "it is when the sun rises" — the 3-minute tolerance accounts for the 0.833° standard refraction and rounding artefacts. This is advisory, not critical.

### Dhuhr

| Condition | Severity | Code |
|-----------|----------|------|
| `dhuhr < astronomical_solar_noon` | `critical` | `DHUHR_BEFORE_SOLAR_NOON` — impossible: Dhuhr begins *at* astronomical noon, never before |
| `dhuhr > astronomical_solar_noon + 30min` | `advisory` | `DHUHR_UNUSUAL_LATE` — some ihtiyati buffers are large but 30 min is well outside any documented convention |

### Asr

| Condition | Severity | Code |
|-----------|----------|------|
| `asr <= dhuhr` | `critical` | `ASR_NOT_AFTER_DHUHR` |
| `asr >= maghrib` | `critical` | `ASR_NOT_BEFORE_MAGHRIB` |
| `asr < astronomical_asr_standard` | `advisory` | `ASR_BEFORE_STANDARD_SHADOW` — time is before the 1× shadow Asr minimum; valid only under unusual circumstances |

Note: `ASR_BEFORE_STANDARD_SHADOW` is advisory not critical because some published timetables (primarily Hanafi-2× shadow regions) may legitimately return an Asr that is between Dhuhr and the standard Asr point. The implementor must compare against the standard shadow computation (`adhan.Madhab.Shafi` Asr time) rather than the applied Asr.

### Maghrib

| Condition | Severity | Code |
|-----------|----------|------|
| `maghrib < astronomical_sunset` | `critical` | `MAGHRIB_BEFORE_SUNSET` — sun is demonstrably still visible; prayer before this is invalid under *all* schools |
| `maghrib > astronomical_sunset + 30min` | `advisory` | `MAGHRIB_UNUSUAL_LATE` — offset unusually large; could indicate a method bug or an unusual institutional convention |

This is the exact check that would have caught the Habous anomaly in fajr#100 (Habous published 20:10 against astronomical sunset ~20:16 → `MAGHRIB_BEFORE_SUNSET` critical). The `astronomical_sunset` reference here is `times.sunset` from adhan.js with `Rounding.None` — the same value already surfaced as `result.sunset` in the API.

### Isha

| Condition | Severity | Code |
|-----------|----------|------|
| `isha < astronomical_isha_at_12deg` | `critical` | `ISHA_BEFORE_TWILIGHT_12DEG` — absolute floor; no school places Isha before 12° |
| `isha < astronomical_isha_at_15deg` | `advisory` | `ISHA_BEFORE_15DEG` — ISNA and similar schools require ≥15°; caller may have chosen a smaller-angle method intentionally |
| High-latitude rule was applied in method selection | `info` | `ISHA_HIGH_LAT_RULE_APPLIED` |

The 12°-floor `critical` for Isha mirrors Fajr: no recognised school places Isha before the 12° twilight disappears. The 15° `advisory` catches UOIF-style 12° methods when deployed in regions where 15° or 17° is the documented default — useful signal for Layer 4 reviewers but not a hard violation.

---

## 4. Return Shape — JSON Schema

Each entry in `validityWarnings[]` conforms to:

```ts
interface ValidityWarning {
  /** Severity tier — drives consumer rendering decision. */
  severity: 'critical' | 'advisory' | 'info'

  /** Which prayer this warning applies to.
   *  null for warnings that span multiple prayers or are structural. */
  prayer: 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null

  /** Machine-readable code for programmatic handling and i18n keying.
   *  Stable across versions — new codes may be added but existing codes
   *  will not be removed or redefined. */
  code: string

  /** Human-readable English explanation, complete sentence.
   *  Suitable for display in a "Why?" provenance sheet or developer log.
   *  NOT suitable for end-user-facing prayer-time display without i18n. */
  message: string

  /** The astronomical reference value being checked against.
   *  ISO 8601 UTC string, or null when the reference is not a timestamp
   *  (e.g. for structural warnings like HIGH_LAT_RULE_APPLIED). */
  astronomicalReference: string | null

  /** The time fajr returned for this prayer.
   *  ISO 8601 UTC string, or null for structural warnings. */
  applied: string | null

  /** Optional magnitude of the discrepancy in minutes (applied - reference),
   *  signed: positive = applied is later than reference, negative = earlier.
   *  null for structural warnings or when no scalar diff makes sense. */
  diffMinutes: number | null

  /** Optional human-readable suggestion for resolving the warning.
   *  Present only for warnings that have a clear resolution path
   *  (e.g. "pass elevation: 0 to opt out of elevation correction"). */
  fix?: string
}
```

### Example: Maghrib Before Sunset (critical)

```json
{
  "severity": "critical",
  "prayer": "maghrib",
  "code": "MAGHRIB_BEFORE_SUNSET",
  "message": "Maghrib (20:10) is 6.0 min before astronomical apparent sunset (20:16). The sun is still above the horizon per standard refraction (0.833°). Maghrib prayer before the sun sets is not valid under any recognised school.",
  "astronomicalReference": "2026-05-05T18:16:00.000Z",
  "applied": "2026-05-05T18:10:00.000Z",
  "diffMinutes": -6.0,
  "fix": "Switch to a method that places Maghrib at or after astronomical sunset. Current method: Habous-Morocco-Imsakiyya."
}
```

### Example: High-Latitude Rule Applied (info)

```json
{
  "severity": "info",
  "prayer": "fajr",
  "code": "FAJR_HIGH_LAT_RULE_APPLIED",
  "message": "Fajr at Reykjavik (64.1°N) on 21 June: the MiddleOfTheNight high-latitude rule was applied because astronomical 18° dawn does not occur on this date. Calculated Fajr (00:46) is derived from the midpoint of the night, not from an astronomical angle. This is the Odeh (2009) recommended rule for extreme latitudes.",
  "astronomicalReference": null,
  "applied": "2026-06-21T22:46:00.000Z",
  "diffMinutes": null
}
```

### Example: Fajr After Shuruq (critical)

```json
{
  "severity": "critical",
  "prayer": "fajr",
  "code": "FAJR_AFTER_SHURUQ",
  "message": "Fajr (06:45) is 12.0 min after Shuruq (06:33). Fajr's prayer window has closed before the displayed Fajr time. This indicates a calculation error or extreme method mismatch.",
  "astronomicalReference": "2026-06-21T04:33:00.000Z",
  "applied": "2026-06-21T04:45:00.000Z",
  "diffMinutes": 12.0
}
```

---

## 5. Edge Cases

### 5.1 Polar Regions (|lat| > 66.5°) and High-Latitude Days With No Twilight

When `adhan.PrayerTimes` returns `null` or `NaN` for Fajr or Isha (because the geometric condition for the angle depression never occurs), the current engine applies a high-latitude rule (MiddleOfTheNight or TwilightAngle) that synthesises a time from night-duration fractions.

**Layer 4 behaviour:** When the high-latitude rule fires for a prayer, emit an `info`-severity `FAJR_HIGH_LAT_RULE_APPLIED` or `ISHA_HIGH_LAT_RULE_APPLIED` warning. The `astronomicalReference` is `null` (no astronomical reference exists — that is *why* the rule fired). Do **not** emit a `critical` or `advisory` for the synthesised time being "before dawn" because there *is* no astronomical dawn on that date.

The implementor detects this condition by checking whether `adhan.PrayerTimes` returns `null` / `Invalid Date` for the prayer at `Rounding.None` before the high-latitude rule is applied. The presence of a `highLatitudeRule` property on the `params_` object passed to adhan.js is the signal.

**Tromsø (69°N) December 21 (polar night):** Isha never reaches 17° (nor 12°) because it is continuous polar night — the sun does not rise. Both Fajr and Isha will use MiddleOfTheNight. Both emit `info` warnings. No `critical` or `advisory` warnings fire. The times are as valid as the chosen high-lat rule allows.

**Tromsø (69°N) June 21 (midnight sun):** The sun does not set below the horizon. adhan.js returns `null` for Maghrib and all subsequent prayers. This is a degenerate case the high-latitude rules do not handle well. Layer 4 should emit a `critical` warning with code `POLAR_NO_SUNSET` / `POLAR_NO_SUNRISE` and `message` explaining the condition. The library returns whatever adhan.js synthesises (which may be unreliable in this regime), but Layer 4 flags it prominently so the caller can show a "prayer times unavailable for this date" state to the user. **This is the correct end-user experience: not a silent wrong time.**

### 5.2 Institution Publishes Time Outside Astronomical Window (e.g. Habous Maghrib)

When the engine is tracking an institution that itself publishes a time outside the Layer 4 validity window (Habous Maghrib 20:10 vs sunset 20:16), the warning fires against **the time fajr returned**, not against the institution. Layer 4 does not know or care whether the anomaly originated from fajr's calibration or from the institution's own published table. It reports the fact: "the time you got is before sunset."

This is the *correct behaviour* from the architectural standpoint established in fajr#101: Layer 4 is a **consumer-side safety net**, not an institutional auditor. If a consumer is tracking Habous for fasting purposes, they deserve to know that Habous's Maghrib is 6 minutes before astronomical sunset — whether that is a Habous convention, a fajr calibration artifact, or a horizon-obstruction effect in Casablanca.

The `fix` field can say "verify against astronomical sunset for your specific location; see fajr#100 for the Habous/Mawaqit cluster analysis."

### 5.3 Caller-Side Method Override

When the caller passes `method: 'UOIF'` (which uses 12°/12°), the Isha `advisory` for `ISHA_BEFORE_15DEG` should **include in its message** that the caller chose UOIF, and that UOIF's 12° is a legitimate smaller-angle convention. The `advisory` still fires because Layer 4 cannot distinguish "caller chose this intentionally" from "caller passed the wrong method string by accident." But the message should be informative, not alarming.

**Implementation note:** The `methodSource` field already available in the result (`location.methodSource === 'caller-explicit'`) can be used by the checker to soften the message wording: "Isha is before the 15° astronomical depression. Method: UOIF (12°/12°, caller-explicit). UOIF's 12° Isha angle is a legitimate scholarly convention used in France and European diaspora communities; this advisory fires because 12° is below the more common 15° threshold."

### 5.4 Correctness of `sunset` as the Maghrib Reference

The `result.sunset` field returned by fajr is the *apparent* sunset with standard 0.833° refraction, rounded UP. The `times.sunset` from `adhan.PrayerTimes` with `Rounding.None` is the pre-rounding raw value. Layer 4's `MAGHRIB_BEFORE_SUNSET` check should use the **raw** `times.sunset` (pre-rounding) as the reference, not `result.sunset`. Using `result.sunset` creates an artefact: rounding-UP moves `result.sunset` by up to 59 seconds later than the raw event, which means `result.maghrib` could be 1 second before `result.sunset` due purely to rounding, when the raw times are in the correct order. The check should be:

```js
// Use raw (Rounding.None) times for all Layer 4 checks
const rawTimes = new adhan.PrayerTimes(coords, date, { ...params_, rounding: adhan.Rounding.None })
if (result.maghrib < rawTimes.sunset) { emit MAGHRIB_BEFORE_SUNSET }
```

This means the checker needs access to the raw `adhan.PrayerTimes` output, which is already computed inside `prayerTimes()`. The raw times object should be passed to the validity checker as an internal argument. It does **not** need to be exposed in the public API.

---

## 6. Test Cases

### TC-01: Reykjavik, 64.1°N, 22.0°W — June 21, 2026

**Expected:** `info` warnings for `FAJR_HIGH_LAT_RULE_APPLIED` and `ISHA_HIGH_LAT_RULE_APPLIED`. No `critical` warnings. The times are MiddleOfTheNight-derived; there is no valid astronomical reference to compare against.

Fajr and Isha nominally converge (~00:46 for both in extreme summer). The checker must not fire `FAJR_AFTER_SHURUQ` if Fajr appears "after" Shuruq due to high-lat synthesised times — add a guard: if `FAJR_HIGH_LAT_RULE_APPLIED` is in the warnings, skip the `FAJR_AFTER_SHURUQ` check.

### TC-02: Tromsø, 69.6°N — December 21, 2026 (polar night)

**Expected:** `info` warnings for `FAJR_HIGH_LAT_RULE_APPLIED` and `ISHA_HIGH_LAT_RULE_APPLIED`. The sun does not rise above the horizon; Shuruq and Maghrib are also synthesised. No `critical` warnings.

### TC-03: Casablanca, 33.6°N, -7.6°W — May 5, 2026, Morocco method

**Expected:** Zero `critical` warnings. Zero `advisory` warnings. Possibly an `info` for elevation (not applicable at sea level). The Morocco method (19°/+5min Dhuhr/+5min Maghrib) returns Maghrib well after astronomical sunset; Fajr well before Shuruq. This is the green-state baseline — should produce `validityWarnings: []`.

### TC-04: Casablanca — May 5, 2026, Habous-Imsakiyya times injected

To simulate the fajr#100 bug: apply Habous published times directly (Maghrib 20:10, Isha 21:30, Fajr 05:19). Against astronomical sunset ~20:16:

**Expected:** `critical` `MAGHRIB_BEFORE_SUNSET` (applied 20:10 vs reference ~20:16, diffMinutes: -6.0). Also `advisory` `ISHA_BEFORE_15DEG` (applied 21:30 vs astronomical 17°-Isha ~21:44, diffMinutes: -14.0). This is the exact scenario Layer 4 exists to catch.

### TC-05: Casablanca — May 5, 2026, hypothetical buggy +30min Maghrib offset

Apply a hypothetical method with a +30 min Maghrib offset (20:16 + 30 = 20:46).

**Expected:** `advisory` `MAGHRIB_UNUSUAL_LATE` (applied 20:46 vs reference 20:16, diffMinutes: +30.0). No `critical`. The time is fiqh-valid (Maghrib after sunset) but unusually late by any known convention.

### TC-06: Reykjavik, 64.1°N — February 5, 2026, Fajr hypothetically set to 02:30 MWL

Under the Iceland/MWL MiddleOfTheNight rule, the engine computes a reasonable Fajr. If a bug injected 02:30 AM in summer Iceland:

**Expected:** Check whether 02:30 is before astronomical 12° dawn (if calculable at that date). In February at 64°N, 12° dawn ~exists. If 02:30 is before the 12° astronomical dawn, emit `critical` `FAJR_BEFORE_DAWN_12DEG`.

### TC-07: London, 51.5°N — June 21, 2026, ISNA method

ISNA uses 15° Fajr/Isha. In summer London, the engine applies MiddleOfTheNight.

**Expected:** `info` for `FAJR_HIGH_LAT_RULE_APPLIED` and `ISHA_HIGH_LAT_RULE_APPLIED`. No criticals.

### TC-08: Mecca, 21.4°N, 39.8°E — May 5, 2026, UmmAlQura method

**Expected:** Zero warnings. UmmAlQura is well-tuned for Mecca; Maghrib coincides with astronomical sunset; all times in fiqh-valid windows. Clean `validityWarnings: []`.

### TC-09: Jakarta, -6.2°S, 106.8°E — May 5, 2026, JAKIM method

**Expected:** Zero `critical` warnings. JAKIM's +8min Fajr buffer and +2min Dhuhr buffer produce times well inside valid windows. Possibly an `info` noting the ihtiyati buffers if that level of detail is included in v1.8.0 (out of scope for initial version — defer to v1.8.1).

### TC-10: Ulaanbaatar, 47.9°N, 106.9°E — caller passes `method: 'Egyptian'` explicitly

Egyptian method (19.5°/17.5°) at a Central Asian coordinate where the engine would normally use MWL.

**Expected:** No `critical`. Possibly `advisory` if the Egyptian angles produce an unusual result at this latitude. The warnings' `message` fields should note `methodSource: 'caller-explicit'` to inform the developer that the mismatch (if any) originates from their override.

---

## 7. Backwards Compatibility

### v1.7.x callers

`validityWarnings` is a **new field** on `PrayerTimesResult`. Existing callers destructuring `{ fajr, shuruq, dhuhr, asr, maghrib, isha, method, notes }` are completely unaffected — JavaScript destructuring ignores unknown fields.

TypeScript callers using the full `PrayerTimesResult` type will benefit from the new field automatically once `src/index.d.ts` is updated with the `ValidityWarning` interface and `validityWarnings: ValidityWarning[]` on `PrayerTimesResult`.

**No breaking change. No migration path required.**

### Response size

A clean call (no warnings) adds `"validityWarnings":[]` to the JSON — 22 bytes. A call with one `critical` warning adds ~300–400 bytes. This is negligible for the use case (single-location prayer time calculation).

### The `notes[]` field

`notes[]` is retained as-is. `validityWarnings[]` is complementary, not a replacement. `notes[]` contains freeform scholarly context (high-latitude advisory prose, elevation advisory, Asr-convention disclaimer). `validityWarnings[]` contains machine-readable fiqh-validity signals. Apps rendering a "Why this time?" sheet should render both.

---

## 8. Scope — v1.8.0 vs v1.8.1+

### v1.8.0 (core Layer 4 — implement this)

The following checks should ship in v1.8.0 as they cover the primary safety surface:

| Code | Prayer | Severity | Priority |
|------|--------|----------|----------|
| `MAGHRIB_BEFORE_SUNSET` | maghrib | critical | P0 — motivated by #100 |
| `FAJR_AFTER_SHURUQ` | fajr | critical | P0 |
| `ASR_NOT_AFTER_DHUHR` | asr | critical | P1 |
| `ASR_NOT_BEFORE_MAGHRIB` | asr | critical | P1 |
| `DHUHR_BEFORE_SOLAR_NOON` | dhuhr | critical | P1 |
| `FAJR_BEFORE_DAWN_12DEG` | fajr | critical | P1 |
| `ISHA_BEFORE_TWILIGHT_12DEG` | isha | critical | P1 |
| `FAJR_HIGH_LAT_RULE_APPLIED` | fajr | info | P1 — already in notes[], now machine-readable |
| `ISHA_HIGH_LAT_RULE_APPLIED` | isha | info | P1 |
| `POLAR_NO_SUNSET` / `POLAR_NO_SUNRISE` | maghrib/shuruq | critical | P1 |

### v1.8.1 (secondary checks — advisory tier)

| Code | Prayer | Severity | Notes |
|------|--------|----------|-------|
| `MAGHRIB_UNUSUAL_LATE` | maghrib | advisory | >30min after sunset |
| `ISHA_BEFORE_15DEG` | isha | advisory | Below common minimum |
| `FAJR_UNUSUAL_LATE` | fajr | advisory | High-lat rule but time is still unusual |
| `SHURUQ_UNUSUALLY_EARLY/LATE` | shuruq | advisory | ±3min tolerance |
| `DHUHR_UNUSUAL_LATE` | dhuhr | advisory | >30min after solar noon |
| `ASR_BEFORE_STANDARD_SHADOW` | asr | advisory | Before 1× shadow minimum |

### v1.8.2+ (deferred)

- Per-institution cross-reference warnings (e.g. "time differs from Diyanet published value by >5 min") — requires Layer 3 institutional fixtures to be in place first
- `IMSAK_AFTER_FAJR` check — theoretically possible with buggy offsets
- `POLAR_CONTINUOUS_TWILIGHT` warning for sub-polar latitudes where twilight never fully ends in summer (common in Scandinavia ~60–65°N in June)

---

## 9. Implementation Architecture

### Where the checker lives

A new module `src/validity.js` contains the `computeValidityWarnings(rawTimes, result, params, highLatRuleApplied)` function. It is:

- **Read-only**: never modifies `result` — returns an array of `ValidityWarning` objects
- **Pure**: deterministic for given inputs, no I/O
- **Internal only**: not exported from `src/index.js` (callers use it only through the `validityWarnings` field on `prayerTimes()` output)

### Integration point in `engine.js`

In `prayerTimes()`, after the raw `adhan.PrayerTimes` object is computed and before the result is assembled:

```js
// Layer 4 — compute raw times (Rounding.None) for fiqh-validity reference
const rawTimes = times  // already computed with Rounding.None per existing code
const highLatRuleApplied = 'highLatitudeRule' in params_

// After rounding and result assembly:
const validityWarnings = computeValidityWarnings(rawTimes, result, params, highLatRuleApplied)
result.validityWarnings = validityWarnings
```

The raw `times` object (from `new adhan.PrayerTimes(coords, date, params_)`) already has `Rounding.None` applied per existing code at line 2830 (`params_.rounding = adhan.Rounding.None`). The checker receives this directly.

### Computing astronomical references

Some checks require values that `adhan.PrayerTimes` does not directly expose (e.g. `fajrAt(12°)`, `ishaAt(12°)` for the absolute floor checks). These can be computed by momentarily instantiating a separate `adhan.PrayerTimes` with a 12° method override:

```js
// Inside computeValidityWarnings:
function fajrAtAngle(coords, date, angleDeg) {
  const p = adhan.CalculationMethod.MuslimWorldLeague()
  p.fajrAngle = angleDeg
  p.rounding = adhan.Rounding.None
  const ref = new adhan.PrayerTimes(coords, date, p)
  return ref.fajr  // raw Date
}
```

This is pure computation — no I/O, instantaneous — acceptable overhead for a library call.

### Bismillah header

`src/validity.js` must begin with:
```js
// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
```

Per the repository convention.

---

## 10. Scholarly Classification

Layer 4's validity checks are **🟢 Established** because:

- The checked conditions (Maghrib after sunset, Fajr before Shuruq, Asr between Dhuhr and Maghrib, etc.) are the *shar'i definitions* of prayer time windows — not corrections or interpretations, but the definitions themselves.
- Ibn Qudama's al-Mughni, the Hadith of Jibril (narrated in Abu Dawud, Tirmidhi, Nasa'i), and the classical fiqh treatises define these boundaries unanimously.
- No scholarly school considers Maghrib valid when the sun is demonstrably above the horizon.
- The 12° absolute floor for Fajr and Isha is a conservative lower bound that represents the most permissive scholarly position — even the most liberal school does not place Fajr before the 12° astronomical depression.

Layer 4 does not *interpret* any scholarly dispute. It enforces the uncontested boundary conditions that *all* schools agree on. The `advisory` tier handles the zone of legitimate ikhtilaf (15° vs 12° Isha, size of post-sunset Maghrib offset) without collapsing the disagreement.

**Tag for `src/validity.js` header comment:**
> 🟢 Established — enforces the shar'i boundary definitions of prayer times that are uncontested across all major madhabs. Advisory checks surface the zone of legitimate ikhtilaf (angle disagreements) without resolving them. See: Hadith of Jibril, Ibn Qudama al-Mughni §prayer times, CLAUDE.md §Islamic accuracy principles.

---

## 11. Open Questions for Human Review Before Implementation

1. **Polar night critical vs info:** Should `POLAR_NO_SUNSET` (continuous midnight sun) be `critical` or `advisory`? The argument for `critical`: the returned Maghrib time has no astronomical basis and the user may unknowingly perform prayer before sunset. The argument for `advisory`: the engine has applied a rule that the community accepts; flagging it `critical` may alarm users who are in Norway in June and getting correct results. **Lean: `critical` with a message that explains the rule was applied and what it means — users deserve to know the time is derived, not astronomical.**

2. **Habous vs fajr attribution in the message:** When `MAGHRIB_BEFORE_SUNSET` fires because fajr is tracking Habous Imsakiyya (which itself publishes a pre-sunset Maghrib), should the `message` say "fajr returned a time before sunset" or "Habous publishes a Maghrib before sunset — see fajr#100"? The latter is more informative for developers but presupposes fajr knows it is tracking Habous. The `result.method` string contains the method label — the checker can include it verbatim. **Recommendation: include `result.method` in the message; let the developer draw the attribution from that.**

3. **`diffMinutes` sign convention:** Proposed: `diffMinutes = (applied − reference) / 60000`, so negative = applied is earlier than reference (the dangerous direction for `MAGHRIB_BEFORE_SUNSET`). This matches `signedMinutesDiff(calc, gt)` in `eval/compare.js`. **Confirm this convention is consistent with existing eval tooling before implementation.**

4. **v1.8.0 scope gating:** Should the advisory-tier checks (Section 8, v1.8.1) be deferred entirely or included in v1.8.0 behind a comment? Recommendation: ship only the `critical` + `info` tiers in v1.8.0; advisory tier in v1.8.1. This keeps the initial implementation minimal and testable, and lets the critical-tier checks be audited by Layer 2/3 reviewers without advisory noise.

5. **TypeScript discriminated union:** Should `ValidityWarning` use a discriminated union on `severity` so TypeScript callers can narrow type on the severity field? E.g. `type CriticalWarning = { severity: 'critical'; prayer: PrayerKey; ... }`. Recommendation: start with a single flat interface; add the discriminated union in v1.8.1 if consumers request it. It is additive.

---

*End of design document.*

— fajr-claude-agent (sonnet-layer-4-designer)
