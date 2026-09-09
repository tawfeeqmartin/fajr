# Engineering audit — 2026-09-08

The most useful next work is improving runtime contracts and validation
integrity before tuning more regional offsets. This audit found a public API
crash, incorrect validity diagnostics, an ineffective CI registry gate, and
several reproducible contract gaps. It does not establish worldwide accuracy
or establish that every downstream integration remains compatible.

Reviewed checkout: `1fb68a3`, package version `1.9.3`. Sources: the public API,
engine, validity, calendar, lunar, location and method modules; tests; CI and
release scripts; the read-only eval and wiki; open fajr issues and the
downstream agiftoftime documentation handoff. No remote review routines were
executed or verified by this audit.

## Repair follow-up — authorized 2026-09-08

All five P0/P1 follow-ups below now have repairs in draft PR #191:

- Ratchet: TRAIN-only institutional corroboration, no calculated/unknown
  source escape, per-region enforcement, finite/complete matching metrics,
  and fail-closed malformed-record handling. Sixteen acceptance tests pass.
- Automatic settings: `auto` restores detected method dispatch; grouped
  overrides take precedence over legacy values. Twelve tests pass.
- Raw twilight: actual crossings are no longer night-fraction-clamped and
  absent events remain Invalid Dates. Caller Date mutation cannot change
  later accessors. All 14 astronomy tests pass.
- Dates: UTC year/month/day now select the requested calendar date for
  prayer, day/night, and raw-astronomy APIs. Seven host TZs, midnight edges,
  DST, leap-day and year-end cases are covered. This requires downstream
  review for callers that previously relied on host-local Date fields;
  README documents how to encode a location's civil date. Historical timezone
  skips that make a whole day unrepresentable fail explicitly with RangeError;
  those calculations require a UTC host.
- Registry: returned nested records are detached, with four mutation tests
  proving later lookups and calculations remain unchanged.

CI evaluates the base and candidate when runtime code changes. The default
calibration path still requires a strict WMAE decrease. This human-approved
repair track uses the maintainer `correctness-only` label and a separate
**exact full-metric identity** gate; it cannot accept any train or holdout
metric change. It is not an opt-out for calibration experiments.

Final local release preflight passes: **503 tests**, registry validation
with zero failures, generator sync, and package dry run. Required full docs
regeneration completed, including both JPL reports. Train WMAE remains
**0.9757475083056478 min** and holdout **7.36457344701456 min**. Every metric
is identical after each runtime concern. The strict comparator still rejects
the tie; no calibration improvement is claimed. See the append-only
[repair log](../autoresearch/logs/2026-09-08-04-21.md).

The reproductions below describe the original v1.9.3 defects. They are
retained as evidence, not as claims that those P0/P1 defects remain unfixed
on this draft. P2 source-policy and architectural follow-ups remain open.
No release or merge has been performed; downstream app compatibility has
not yet been verified.

## Initial audit fixes

### Polar-transition crash and validity diagnostics

`prayerTimes({ latitude: 66, longitude: 20,
date: new Date('2026-06-12T12:00:00Z'), elevation: 0 })` previously threw
`RangeError: Invalid time value`. Today's sunrise and sunset exist, but
tomorrow's missing sunrise can make adhan's night-fraction twilight result
invalid. The warning formatter then called `toISOString()` on that result.

`src/validity.js` now returns a critical `PRAYER_TIME_UNAVAILABLE` warning
for unavailable prayers and safely formats the remaining advisories. It
does not synthesize replacement times. Callers still need to handle invalid
Dates when a required event is unavailable.

The same diagnostic layer had two additional errors:

- Dhuhr's pre-rounding value already includes method and caller offsets.
  Treating it as solar noon produces false warnings and can conceal an
  early time when negative offsets are present. Both offsets are now
  removed when reconstructing the reference transit.
- Any configured high-latitude rule suppressed Fajr-after-sunrise checks
  above 60 degrees. The check now runs there too. Its strict comparison
  preserves the existing treatment of equality from minute rounding.

Fourteen targeted tests failed on the original implementation and pass with
the fixes. The tests include five actual polar-transition crash dates,
missing dates for each prayer, positive and negative Dhuhr offsets, and
high-latitude Fajr ordering.

### CI city-registry enforcement

The registry currently passes with zero fail-class issues. However, the lint
workflow discarded its exit status and permitted up to 180 failures. CI now
runs the validator directly and also checks generated registry/source sync.
The existing warn-class exception remains advisory.

### Accuracy documentation

`CALIBRATION.md` now identifies the training set as mixed references: 130 of
215 rows are Aladhan calculations, while 85 are Mawaqit/Diyanet/JAKIM rows.
Historical near-zero bias is no longer described as proof of year-round
accuracy. The document distinguishes absolute bias from change in bias,
corrects the guarded direction descriptions, documents the shipped Asr
override, and refreshes geometric elevation magnitudes from the public API.

## Confirmed findings requiring follow-up

### P1 — Ratchet acceptance depends on holdout and permits calculated corroboration

`eval/compare.js` merges train and test `perSource` records for its Path A
exception. Test records overwrite training records with the same source
name, and there is no source-type restriction on corroboration.

An isolated copy of the unchanged comparator was run with synthetic records:

| Scenario | Train WMAE | Train Fajr bias | Test-source change | Exit |
|---|---|---|---|---|
| No corroboration | 1.0 → 0.9 | 0 → −0.5 min | none | 1, FAIL |
| Calculated holdout corroboration | identical | identical | Aladhan Fajr bias 2 → 0 min | 0, PASS |

Only the diagnostic holdout changed, yet acceptance changed. Moreover, a
calculation-only source qualified as independent evidence. This conflicts
with the documented holdout and non-calculation corroboration requirements.
This is a structural acceptance defect, not evidence that a specific past
release was unsafe.

The comparator is expressly read-only under AGENTS.md. A separate framework
change should define eligible independent sources, keep holdout out of
acceptance, preserve split identities, reject missing/nonfinite metrics,
and test these rules with synthetic runs. The CI test workflow also runs
the eval without a base-versus-head comparator gate; eval completion alone
does not enforce the accuracy ratchet.

### P1 — The settings value `auto` selects the fallback method

`featureInfo('methodOverride')` advertises `auto` as its default and an
allowed selection. Passing it back as `override.method` at Casablanca
returns `ISNA (default — unrecognised method: auto)` instead of Morocco.
That can change prayer times when a user selects Automatic in a generated UI.

Reproduction:

```js
prayerTimes({
  latitude: 33.5769, longitude: -7.5473,
  date: new Date('2026-05-05T12:00:00Z'),
  override: { method: 'auto' },
}).method
```

Until repaired, an app must omit the method override for Automatic. A fix
needs explicit precedence tests when a grouped `auto` conflicts with a
legacy top-level method, plus coverage for every advertised feature value.
Existing training rows do not exercise this settings path.

### P1 — Raw twilight accessors still apply high-latitude estimation

`astronomical(64.1, -22, new Date('2026-06-21T12:00:00Z')).fajrAt(18)`
returns `2026-06-21T01:29:40.000Z`. The wrapper creates ordinary adhan
`PrayerTimes`, whose default night-fraction clamp can replace an absent
angle crossing. The result is therefore not necessarily a raw astronomical
event as documented. The existing high-latitude test only checks that the
result is a Date object, which also passes for an estimated time.

The raw API should use an actual angle-crossing primitive and explicitly
represent absent crossings. Regional prayer-time synthesis belongs in the
separate prayer-time calculation path. This needs a dedicated engine/API
correctness change, strict absence tests, and regenerated engine-derived docs.

### P1 — Civil-date interpretation depends on the host timezone

With the same Casablanca coordinates and Date instant
`2026-05-05T00:30:00Z`, separate Node processes return:

| Host TZ | Fajr |
|---|---|
| UTC | 2026-05-05 04:00 UTC |
| America/Los_Angeles | 2026-05-04 04:01 UTC |
| Asia/Tokyo | 2026-05-05 04:00 UTC |

adhan reads host-local calendar fields. Hijri conversion uses UTC calendar
fields. `dayTimes()` advances by a fixed 24 hours, which is also sensitive
to the eventual civil-date/DST contract. Tests at UTC noon largely miss
these boundaries. The behavior is reproducible; choosing UTC dates versus
location-local dates is a public-contract decision, not a calibration tweak.
Document the existing host-local convention immediately, then settle one
explicit civil-date contract and test it across host timezones and DST.

### P1 — Returned location records expose mutable registry objects

`detectLocation(...).city` points directly at the bundled registry object.
Changing that returned object's name is visible in subsequent lookups;
changing its bbox, method override, or elevation can affect later callers.
`nearestCity()` and prayer-time provenance share the same underlying data.

Return detached records or freeze the registry deeply, with tests showing
that consumer mutations cannot change later method/elevation dispatch.
Choose copying versus freezing deliberately because freezing can make
existing consumer mutations throw in strict mode.

### P2 — Duplicated definitions and misleading metadata

`src/methods.js` and `src/elevation.js` are not imported by the runtime
engine. Their tables/formulas can drift from the real dispatch and horizon
correction. Consolidate around one authoritative method definition before
adding more institutions. `qibla()` also returns magnetic declination `0`
as a placeholder; this is not a magnetic-field calculation.

The Umm al-Qura wiki describes a 120-minute Ramadan interval, while the
engine's preset returns 90 minutes on March 1, 2026 in Mecca. Treat this as
an institutional-policy/source-validation question before changing a default;
the wiki itself is not a freshly verified primary timetable. Explicit
elevation and tayakkun helpers also retain pre-adjustment warning arrays,
so diagnostics can become stale after post-processing.

## Initial audit validation and limits (before repair follow-up)

- Baseline: 446 tests. After diagnostic fixes: 460 tests, all passing.
- Extended runtime sweep: 62,050 calls at ±48° through ±90°, in half-degree
  steps for all 365 days of 2026 at longitude 20°, plus 488 city centers at
  four seasonal dates: **64,002 calls**, zero crashes, zero invalid-prayer
  cases without a critical warning. This tests failure handling, not the
  accuracy or completeness of every warning.
- Registry: 488 cities, 4,880 internal and 4,880 external samples, zero
  failures and one allowlisted warning. Generator sync passes.
- Release preflight passes, including the package dry run.
- Train WMAE: **0.9757475083056478 → 0.9757475083056478 min**.
- Holdout WMAE: **7.36457344701456 → 7.36457344701456 min**.
- Full serialized train and holdout metric objects are identical before and
  after: every region, source, cell, per-prayer MAE and signed bias is unchanged.
- `eval/compare.js` returns FAIL for the unchanged WMAE, as designed. These
  are diagnostic/CI/documentation fixes, not an accepted calibration run.
- No edits to `src/engine.js`, public exports, dependencies, eval code,
  ground-truth fixtures, or the knowledge wiki. Eval execution appended two
  generated run records locally; those records are not hand-edited.

The initial recommended order has now been implemented in the repair
follow-up above. Further regional calibration still needs source-quality
and seasonal-evidence review rather than optimization of the mixed holdout
aggregate.


## Downstream warning follow-up — 2026-09-09

The rendered polar screen exposed misleading diagnostic combinations: an
applied-rule advisory with no returned prayer time, and a MiddleOfTheNight note
under TwilightAngle. Advisories now require a finite result for that prayer;
the specific narrow-gap note requires MiddleOfTheNight. Finite results under
other methods retain general high-latitude disclosure, preserving agiftoftime's
existing Anchorage contract test. The critical unavailable state remains.

Final upstream suite: 506 passing tests; train and holdout metrics remain exactly
identical. See `autoresearch/logs/2026-09-09-01-21.md` and
`autoresearch/logs/2026-09-09-01-34.md`. Downstream fixes and full CI evidence are
in [agiftoftime#56](https://github.com/tawfeeqmartin/agiftoftime/pull/56).
