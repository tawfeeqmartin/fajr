# AutoResearch Run — 2026-05-05 Layer 4 implementation

## Hypothesis

Implement fajr#101 Layer 4 validity warnings per the design at
`autoresearch/proposals/2026-05-05-layer-4-validity-warnings-design.md` and
agot-claude's confirmed answers in agiftoftime#30 (POLAR_NO_SUNSET=critical,
advisory tier defer to v1.8.1, sign convention as spec).

## Wiki sources consulted

- `autoresearch/proposals/2026-05-05-layer-4-validity-warnings-design.md`
- fajr#101 (architecture proposal, agot-claude)
- agiftoftime#30 (Layer 4 design review, agot's answers)
- fajr#100 (motivating incident — row-3-vs-row-17 misread)

## Change made

1. **New module** `src/validity.js` — pure read-only checker:
   - `computeValidityWarnings({rawTimes, result, params, coords, date})` returns `ValidityWarning[]`
   - Bismillah header per repository convention
   - Uses raw `adhan.PrayerTimes` (Rounding.None) as the astronomical reference

2. **Integration in `src/engine.js`**:
   - Import `computeValidityWarnings` at top
   - Call at tail of `prayerTimes()` after elevation correction
   - Result returned as `result.validityWarnings`

3. **TypeScript surface in `src/index.d.ts`**:
   - New `ValidityWarning` interface
   - New `ValidityWarningSeverity` type (`'critical'|'advisory'|'info'`)
   - Added `validityWarnings: ValidityWarning[]` to `PrayerTimesResult`

4. **Tests in `test/validity.test.js`**:
   - 4 happy-path tests (Casablanca/Mecca/Jakarta/Istanbul → empty warnings)
   - 3 high-latitude info tests (Reykjavik fires HIGH_LAT_RULE_APPLIED)
   - 1 polar test (Tromsø Dec 21 → POLAR_NO_SUNSET)
   - 5 critical-injection tests (synthetic violations for each P0/P1 critical code)
   - 2 schema-integrity tests
   - All 15 new tests pass; 333/333 total tests pass

## Codes shipped in v1.8.0

| Code | Severity | Prayer |
|---|---|---|
| `MAGHRIB_BEFORE_SUNSET` | critical | maghrib |
| `FAJR_AFTER_SHURUQ` | critical | fajr |
| `ASR_NOT_AFTER_DHUHR` | critical | asr |
| `ASR_NOT_BEFORE_MAGHRIB` | critical | asr |
| `DHUHR_BEFORE_SOLAR_NOON` | critical | dhuhr |
| `POLAR_NO_SUNSET` | critical | maghrib |
| `POLAR_NO_SUNRISE` | critical | shuruq |
| `FAJR_HIGH_LAT_RULE_APPLIED` | info | fajr |
| `ISHA_HIGH_LAT_RULE_APPLIED` | info | isha |

## Codes deferred (design-doc fix needed)

The proposed `FAJR_BEFORE_DAWN_12DEG` and `ISHA_BEFORE_TWILIGHT_12DEG` checks
had inverted polarity in the design doc — the doc claimed 12° was the
"earliest valid Fajr" when in fact 12° is the LATEST any school uses
(shallower depression = sun closer to horizon = later in morning). Standard
methods use deeper depression (MWL 18°, UmmAlQura 18.5°, Egyptian 19.5°),
which fire EARLIER than 12° — so the check would false-positive on every
standard method. Detected during smoke testing: Casablanca and Mecca both
fired the false positive.

Implementation deferred to v1.8.1 with the polarity fix:
- Either compare against ~20° (deepest-depression-anyone-uses) for
  "Fajr suspiciously early" critical, OR
- Redefine the 12° check as a CEILING ("Fajr later than 12° = past dawn
  window")

Will be filed as a separate issue with the v1.8.0 ship.

## Before WMAE (additive change, no calc impact)

```
Train WMAE:    0.9757
Holdout WMAE:  8.3248
```

## After WMAE

```
Train WMAE:    0.9757   (unchanged — additive surface)
Holdout WMAE:  8.3248   (unchanged)
```

## Per-prayer signed-bias drift

All prayers: 0.00 drift. No calc behavior change.

## Verdict

**ACCEPTED** — Layer 4 ships in v1.8.0 as an additive response field. No calc
behavior change. Ratchet wash (train WMAE unchanged) is expected for
purely-additive API surface and is the intended state — Layer 4 is a
diagnostic surface, not a calibration change.

## Scholarly classification

🟢 Established — the checked conditions (Maghrib after sunset, Fajr before
Shuruq, Asr between Dhuhr and Maghrib, Dhuhr at or after solar noon) are
the *shar'i definitions* of prayer time windows, not interpretations.
References: Ibn Qudama al-Mughni; Hadith of Jibril (Abu Dawud, Tirmidhi,
Nasa'i); classical fiqh treatises across all major schools.

— fajr-claude
