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

## [Unreleased]

## [1.9.1] — 2026-05-14

### Fixed — Sialkot/Gujranwala city-geometry overlap

- Updated `Sialkot|PK` to a reviewed WOF current locality envelope, removing
  the previous overlap where Gujranwala north-east coordinates could resolve to
  Sialkot city provenance.
- Lahore and Gujranwala WOF rows were reviewed but left out of runtime changes
  to avoid a broader coverage shift in this patch.
- No prayer-time calculation math, public API, regional default, or method
  dispatch changed.

### Fixed — Klang Valley city-geometry provenance

- Added WOF-backed runtime rows for `Klang|MY` and `Petaling Jaya|MY`, and
  updated `Kuala Lumpur|MY` / `Shah Alam|MY` toward reviewed WOF locality
  envelopes.
- Klang Valley lookup now preserves distinct city provenance for Kuala Lumpur,
  Petaling Jaya, Shah Alam, and Klang instead of routing the western metro
  area through overbroad Kuala Lumpur/Shah Alam cells.
- No prayer-time calculation math, public API, regional default, or method
  dispatch changed.

### Fixed — Singapore/Johor city-geometry seam

- Added reviewed WOF source-map rows for `Singapore|SG` and `Johor Bahru|MY`.
- Clipped the runtime city bboxes at the Causeway seam so northern Singapore
  coordinates keep Singapore city/timezone provenance, while old overbroad
  Johor Bahru north/east corners no longer resolve to Johor Bahru city
  provenance.
- No prayer-time calculation math, public API, regional default, or method
  dispatch changed.

## [1.9.0] — 2026-05-14

### Added — settings metadata and caller overrides

- Added `features()` and `featureInfo(key)` as structured metadata for
  downstream app settings UIs. Initial keys cover calculation method, Asr
  convention, elevation, tayakkun buffer, and Tarabishy high-latitude method.
- Added the grouped `prayerTimes({ override: { method, elevation,
  asrConvention } })` surface for user settings. Existing top-level `method`
  and `elevation` remain supported; `override` takes priority when both are
  present.
- Added explicit Asr-convention override support. `override.asrConvention:
  'hanafi'` applies Hanafi 2x shadow Asr and reports
  `location.asrConventionSource: 'caller-explicit'`; `'standard'` applies 1x
  shadow. Deprecated `override.madhab` is accepted as an alias for older UIs,
  but remains Asr-convention vocabulary, not a full legal-madhhab taxonomy.

### Honest caveats

- Defaults are unchanged. Hanafi-majority country metadata still does not
  silently mutate Asr calculation; the actual 2x-shadow calculation changes
  only when the caller explicitly passes `override.asrConvention: 'hanafi'`.

## [1.8.1] — 2026-05-14

### Added — Layer 1 astronomical primitives

- Added the public `astronomical(latitude, longitude, date)` export from
  fajr#101 / PR #136. It returns raw deterministic astronomical primitives
  (`solarNoon`, `apparentSunrise`, `apparentSunset`, `fajrAt(angleDeg)`,
  `ishaAt(angleDeg)`, and `asrAt(shadowFactor)`) with no regional method
  dispatch, elevation correction, institutional offsets, or per-prayer
  rounding.
- Added TypeScript declarations and focused tests for the raw-vs-institutional
  split. This gives downstream apps a clean way to show "raw astronomy vs
  official timetable default" without reimplementing solar math.

### Fixed — deprecated madhab alias values

- Resolved the agiftoftime QA finding from [#88](https://github.com/tawfeeqmartin/fajr/issues/88):
  Morocco no longer exposes `location.madhab: 'shafii'` or
  `applied.madhab: 'shafii'` when the engine only means standard 1× Asr.
- The primary fields remain unchanged: apps should still render
  `location.asrConvention` for local Asr-convention metadata and
  `applied.asrSchool` for the formula actually used.
- Deprecated `location.madhab` and `applied.madhab` now mirror
  `standard | hanafi` Asr values. This is an observable compatibility cleanup
  for the deprecated fields, not a prayer-time calculation change.

### Fixed — Morocco city bbox routing

- Adjusted the Rabat and Agadir runtime bboxes using reviewed Who's On First
  locality candidates, clipped to preserve deterministic non-overlap with the
  neighboring Sale/Temara and Inezgane rows. Prayer-time math is unchanged; this
  only affects city/source provenance for coordinates near those bbox edges.
- Synchronized the city-registry generator overrides so future
  `scripts/build-city-registry.js` runs preserve the reviewed Rabat/Agadir
  bboxes.
- Added a `scripts/build-city-registry.js --check` guard and reconciled
  generator inputs for Lisbon, Pattani, and Iraqi override source institutions
  so the checked-in city registry can no longer drift silently from its source
  data.
- Tightened six additional Morocco lookup cells (`Berrechid`, `Settat`,
  `Sefrou`, `Tangier`, `Nador`, `Oujda`) to reviewed WOF locality envelopes,
  and taught the geometry audit to label bbox-envelope matches separately from
  residual polygon-shape mismatch.
- Tightened the Basel and Mulhouse lookup cells to reviewed WOF locality
  envelopes, removing that cross-border validator warning while preserving both
  Mawaqit city centers.
- Fixed the city-registry validator so bboxes that only touch at an edge are
  not reported as cross-country overlaps; Brazzaville/Kinshasa now stays
  tracked as a geometry-undercoverage/clipping review item instead of a false
  runtime overlap warning.
- Tightened the Casablanca lookup cell to the reviewed WOF current county
  envelope, which matches the OSM admin-8 city geometry while avoiding WOF's
  deprecated/point-like locality rows.
- Tightened the Fes lookup cell to WOF current locality `421190143`, which
  supersedes the older Fes WOF row and matches OSM admin-8 Fes closely enough
  for the offline city lookup cell.
- Documented the #118 Morocco geometry source boundary: remaining
  Temara/Inezgane/Meknes/Tetouan/Sale work needs reviewed WOF locality
  geometry, compatible official/commune-level geometry, or should stay an audit
  gap rather than deriving runtime bboxes from OSM alone or broad WOF county
  rows.
- Added UAE WOF locality source-map rows for Abu Dhabi, Al Ain, and the
  Dubai/Sharjah/Ajman metro; shipped Abu Dhabi and Al Ain runtime bbox updates
  where the WOF envelopes do not collide.
- Clipped Dubai, Sharjah, and Ajman into adjacent runtime lookup cells:
  Dubai keeps its centre while no longer overlapping Sharjah, Sharjah gains
  eastward coverage, and Ajman gains reviewed WOF extent while only
  edge-touching Sharjah.
- Tightened ten large Turkey city lookup cells to reviewed WOF current locality
  envelopes (`Istanbul`, `Ankara`, `Izmir`, `Bursa`, `Konya`, `Gaziantep`,
  `Adana`, `Antalya`, `Samsun`, `Trabzon`) and left ambiguous Turkish WOF rows
  for separate review.
- Tightened the Giza lookup cell's western edge so the smaller 6th of October
  cell no longer shadows Giza validation samples.
- Added a clipped WOF-backed `Windsor|CA` lookup cell and moved Detroit/Dearborn
  north of the river seam so Windsor coordinates no longer resolve to US city
  provenance.
- Tightened `Geneva|CH` and added WOF-backed `Annemasse|FR` and
  `Ferney-Voltaire|FR` lookup cells so adjacent French border towns no longer
  resolve to Geneva/Switzerland.
- Separated the `Strasbourg|FR` / `Kehl|DE` Rhine seam with clipped WOF-backed
  lookup cells so Kehl no longer resolves to Strasbourg/France.
- Extended Equatorial Guinea's country bbox by 0.01° north so Malabo's own
  northern city samples remain in Equatorial Guinea instead of falling through
  to Cameroon.
- Tightened the `Brazzaville|CG` / `Kinshasa|CD` Congo River seam with
  WOF-backed runtime cells so each capital's edge samples keep their own
  country/timezone without filling the river gap.
- Aligned Morocco WOF-backed geometry source-map statuses with shipped runtime
  bboxes, leaving OSM-only rows as audit candidates pending license review.

### Changed — documentation doctrine cleanup

- Added [docs/positions.md](docs/positions.md), a compact registry for the
  regional default that fajr applies, the confidence grade behind it, and the
  end-user wording downstream apps should prefer.
- Added [docs/known-disagreements.md](docs/known-disagreements.md) so active
  ikhtilaf, institutional splits, and source-quality gaps are surfaced in one
  place instead of being buried in calibration prose.
- Rewrote [knowledge/wiki/corrections/elevation.md](knowledge/wiki/corrections/elevation.md)
  from an accumulated research log into a clear position page: Shuruq/Sunrise
  and Maghrib/Sunset only, current fajr behavior first, evidence summary
  second, and Saudi uniform-city practice labeled carefully as a citation gap
  rather than overclaimed as a formal rejection.
- Updated README and CALIBRATION links so users and other agents can find the
  new doctrine layer before diving into raw evidence.
- Rewrote [docs/data-sources.md](docs/data-sources.md) as a source-trust map:
  ratchet train vs holdout diagnostic vs institutional reference vs research
  lead, with raw corpus details preserved in `eval/data/` and `scripts/data/`.

### Added — Morocco Habous monthly snapshot tooling

- Added `scripts/fetch-habous-morocco-month.js`, a non-mutating helper that
  snapshots Morocco's official Habous current Hijri-month city tables into
  fixture-shaped JSON. It writes only when `--out` is supplied and supports
  `--from-file` / `--wayback-from` recovery for archived HTML.
- Added `test/habousMoroccoFixture.test.js`, a focused holdout gate that keeps
  fajr's Morocco five-prayer output close to the official Habous monthly city
  fixture and validates the fixture source metadata.
- Added a scheduled Morocco Habous snapshot workflow that opens review PRs with
  future official monthly table captures under `fixtures/habous-morocco/`.

### Added — city geometry bbox audit scaffold

- Added `scripts/audit-city-geometry.js` and `scripts/lib/geometry-audit.js`,
  a no-network advisory audit path for comparing reviewed cached GeoJSON
  geometries against the shipped city bbox registry.
- Added `scripts/data/city-geometry-sources.json`, a seed source map for 20
  high-priority bbox QA rows: Morocco/Habous phase-1 cities plus Jerusalem
  routing, Congo River clipping, and Basel/Mulhouse resolved-warning rows.
- Added WOF candidate IDs for Morocco source-map rows where WOF has a plausible
  locality or reviewed lower-confidence county geometry, including Berrechid
  and Settat which previously had no geometry candidate.
- Added reviewed WOF locality candidates for the Basel/Mulhouse cross-border
  validator-warning pair, confirming the current issue is over-broad shipped
  lookup cells rather than missing municipal coverage.
- Added reviewed WOF locality candidates for the Brazzaville/Kinshasa
  cross-border warning pair, documenting that their rectangular envelopes still
  overlap across the diagonal Congo River boundary.
- Added `scripts/fetch-city-geometry-cache.js`, a WOF-only cache hydration
  helper that fetches reviewed source-map geometry into `.cache/city-geometry/`
  without committing raw geometry or changing runtime bboxes.
- Added [docs/city-geometry-audit.md](docs/city-geometry-audit.md), documenting
  why raw municipal polygons stay out of the runtime package, which sources are
  safe for audit vs bundled derivation, and which Morocco/current-warning rows
  should be reviewed first.
- Added CLI coverage for source-map rows with missing local cache files,
  intentionally blank geometry candidates, cached local GeoJSON, and cache-path
  escapes.
- Added automatic geometry-audit triage labels for undercoverage, over-broad
  bboxes, center mismatches, source-review needs, and low-priority matches.
- Added focused geometry helper tests covering GeoJSON bbox extraction,
  polygon holes, multipolygons, deterministic grid sampling, and bbox coverage
  metrics.

### Fixed — Diyanet city-ID mapping guardrail

- Added `scripts/data/diyanet-ezanvakti-cities.json`, a verified mapping from
  every bundled Turkish registry city to the correct ezanvakti `sehirID` and
  central `ilceID`, addressing #102's broken guessed-ID failure mode.
- Updated `scripts/fetch-diyanet.js` to consume the verified mapping, verify
  live API names on request, and require `--out` / `--stdout` before widening
  beyond the existing three-city train fixture.

### Honest caveats

- Documentation and note-text cleanup only. The correction math and returned
  prayer Date instants are unchanged.
- The public `notes[]` wording around Saudi elevation practice is softened to
  avoid overclaiming a primary policy rationale that has not yet been retrieved.
- The Habous monthly snapshot helper does not promote rows into `eval/data`. A
  2026-05-05 probe produced 990 current-month rows across the 33 mapped
  Moroccan cities, but Internet Archive recovery is sparse, so a dense two-year
  Morocco calibration corpus still needs recurring snapshots or another
  official historical source.
- The Habous fixture test is diagnostic, not a train-ratchet change. It gates
  the five prayer times and treats Sunrise as loose source sanity only because
  Moroccan published Sunrise can encode mosque-practice ihtiyat rather than a
  pure astronomical calculation.
- Scheduled Habous captures are source snapshots only. Promotion into
  `eval/data/` remains a separate curated fixture PR.
- The Diyanet mapping fix does not promote a new yearly Turkiye fixture. It
  prevents future bad fixture generation; curated fixture promotion still needs
  a separate PR with cross-source spot checks.
- The city geometry audit scaffold does not change `detectLocation()`, city
  bboxes, package runtime behavior, or prayer-time calculations. It exits
  cleanly when a source map is absent, and reports `cache-file-not-found` until
  reviewed external geometry is fetched into `.cache/city-geometry/`.
- The seeded city geometry source map stores stable OSM relation IDs and
  Habous authority IDs only. OSM-derived geometries and bbox edits remain
  audit-only until explicit license review approves any derived MIT-package
  data.

## [1.8.0] — 2026-05-06

### Added — Layer 4 fiqh-validity warnings (#101, #106)

Per the 5-layer canonical architecture proposed by agot-claude in fajr#101.
Layer 4 ships as an always-on `validityWarnings: ValidityWarning[]` field on
every `prayerTimes()` response. Empty array when no warnings; entries flag
fiqh-validity violations and high-latitude / polar / Ramadan-DST advisories.

#### New module

- **`src/validity.js`** (260 lines, pure read-only checker, Bismillah header).
  Receives the raw `adhan.PrayerTimes` and the rounded result, returns
  `ValidityWarning[]`. Integrates into `prayerTimes()` at the tail, after
  elevation correction.

#### New TypeScript surface

- **`ValidityWarning` interface** — severity (`'critical'|'advisory'|'info'`),
  prayer, code, message, astronomicalReference, applied, diffMinutes, fix.
- **`ValidityWarningSeverity` type** — exported for downstream consumption.
- **`PrayerTimesResult.validityWarnings: ValidityWarning[]`** — new always-on
  field. JavaScript destructuring callers unaffected; TypeScript callers get
  the new field automatically.

#### Codes shipped in v1.8.0

| Code | Severity | When it fires |
|---|---|---|
| `MAGHRIB_BEFORE_SUNSET` | critical | Maghrib precedes astronomical apparent sunset (the fajr#100 motivating case) |
| `FAJR_AFTER_SHURUQ` | critical | Fajr ≥ Shuruq (window collapse) |
| `ASR_NOT_AFTER_DHUHR` | critical | Asr ≤ Dhuhr |
| `ASR_NOT_BEFORE_MAGHRIB` | critical | Asr ≥ Maghrib |
| `DHUHR_BEFORE_SOLAR_NOON` | critical | Dhuhr precedes solar noon by > 30s |
| `POLAR_NO_SUNSET` | critical | Continuous midnight sun — no astronomical Maghrib reference |
| `POLAR_NO_SUNRISE` | critical | Continuous polar night — no astronomical Shuruq reference |
| `MOROCCO_RAMADAN_DST_GAP` | info | Morocco coords + Ramadan dates — defensive flag for stale tzdata consumers (fajr#106) |
| `FAJR_HIGH_LAT_RULE_APPLIED` | info | High-latitude rule may have synthesised Fajr |
| `ISHA_HIGH_LAT_RULE_APPLIED` | info | High-latitude rule may have synthesised Isha |

#### Codes deferred to v1.8.1+

- `FAJR_BEFORE_DAWN_12DEG` / `ISHA_BEFORE_TWILIGHT_12DEG` — design-doc had
  inverted polarity (12° is the SHALLOWEST any school uses, not deepest).
  Implementation caught the false-positive on Casablanca + Mecca during smoke
  testing. Will refile with polarity fix in v1.8.1.
- All `advisory`-tier codes (`MAGHRIB_UNUSUAL_LATE`, `ISHA_BEFORE_15DEG`, etc.)
  per agot's explicit defer call in agiftoftime#30.

### Added — SCOREBOARD.md auto-regenerated health/trajectory snapshot (#105)

Per the documentation-discipline proposal from agot-claude in fajr#105.

- **`scripts/build-scoreboard.js`** (Node ESM, ~250 lines) — reads
  `eval/results/runs.jsonl`, `package.json`, `gh issue list`, `git log`,
  `src/data/cities.json`, `eval/data/`, and test counts; regenerates
  `SCOREBOARD.md` from current state.
- **`SCOREBOARD.md`** at repo root — current verdict, per-source WMAE,
  coverage, bug health, test corpus, reference-source freshness, release
  history (last 5), 30-day trajectory verdict.
- **`docs/INCIDENT-LOG.md`** — bootstrap with 5 entries from this session
  (Habous row-mapping, Türkiye fetcher city-IDs, Layer 4 12° polarity,
  Morocco Ramadan DST false alarm, v1.7.6 browser-load regression). Format:
  date / severity / triggered-by / root-cause / resolution / prevention.

#### Deferred per spec to v1.8.x

- CI gate to auto-regen on release tag — defer to v1.8.x once SCOREBOARD
  stabilises.
- `CALIBRATION.md` health-metadata extension — defer to v1.8.x.
- Doc-vs-code consistency agent (#49 QA roster) — separate work.

### Fixed — MoroccoMawaqit / MoroccoHabous semantic-alias collapse (#103)

Per agot-claude's empirical decision rule in fajr#103: cross-season Habous
verification (32 cities × 3 seasons × 6,660 cells) confirmed the proposed
`MoroccoMawaqit` and `MoroccoHabous` method-string aliases would have
returned identical calc to the country default. Single canonical Morocco
stance is the right surface; the aliases were premature complexity.

The aliases were never published to npm (added in unmerged commit `0a03ab4`,
removed before merge). No migration needed for existing v1.7.x callers.

### Honest caveats

- **API addition, not breaking.** `validityWarnings` is a new field; existing
  destructuring callers are unaffected. TypeScript callers using the full
  `PrayerTimesResult` type get the new field automatically.
- **No calc behavior change.** Layer 4 is a diagnostic surface; `prayerTimes()`
  returns the same Date instants for `fajr/shuruq/dhuhr/asr/maghrib/isha`
  as v1.7.25. Train ratchet WMAE 0.9757 unchanged.
- **The `MOROCCO_RAMADAN_DST_GAP` info warning is defensive, not corrective.**
  Modern Node ≥18 with current tzdata correctly handles Morocco's Ramadan
  GMT+0 exception via `Africa/Casablanca`. The warning surfaces the risk for
  consumers on stale runtimes; fajr does NOT shift the returned Date instants.
- **Polarity bug caught in design doc.** The original Layer 4 spec had
  `FAJR_BEFORE_DAWN_12DEG` checking the wrong direction; implementation smoke
  testing on Casablanca + Mecca caught it. Deferred with marker in code; v1.8.1
  will ship the corrected version.

### Cross-repo

- agiftoftime#30: agot signed off on Layer 4 design (POLAR=critical,
  advisory deferred to v1.8.1, sign convention as spec).
- agiftoftime#31: agot endorsed the COLLAPSE verdict on the alias question.

---

## [1.7.25] — 2026-05-05

### Added — Track A holdout-corpus expansion + Track D data corrections

Bundled implementation of the deep-research proposals:
- `autoresearch/proposals/2026-05-05-mosque-corpus-expansion.md` (Track A)
- `autoresearch/proposals/2026-05-05-city-confidence-audit.md` (Track D)

#### New fetcher scripts + holdout fixtures

- **`scripts/fetch-indonesia-myquran.js`** + `eval/data/test/indonesia-myquran.json` —
  Indonesia myQuran community wrapper around KEMENAG. Closes the
  KEMENAG dead-end documented in `docs/calibration-recipe.md`. **21 cities ×
  7 days = 147 city-days** of fresh KEMENAG data covering Java / Sumatra /
  Kalimantan / Sulawesi / Nusa Tenggara / Maluku / Papua + metro regions.
- **`scripts/fetch-morocco-habous.js`** + `eval/data/test/morocco-habous.json` —
  Morocco Habous Ministry direct PHP API. **12 Moroccan cities × 1 day**
  (Casablanca, Rabat, Marrakech, Fès, Tangier, Agadir, Meknes, Oujda,
  Tetouan, Salé, Kenitra, Taza). HOLDOUT cross-reference for the v1.5.0
  Mawaqit-Morocco train anchor — ministry vs mosque-published divergence.
- **`scripts/fetch-egypt-esa.js`** + `eval/data/test/egypt-esa.json` —
  Egypt ESA (General Authority of Survey) scraper attempt. **Stub fixture
  only**: ESA's VIEWSTATE form turns out to be JS-rendered, so raw HTTP
  scrape fails. Script + stub document the failure path; next-round
  attempt should use Puppeteer/Playwright headless browser.

#### Data corrections (Track D top 5)

- **Mosul citation URL** in `scripts/data/city-method-overrides.json`:
  `sunni.gov.iq/` → `sunniaffairs.gov.iq/en/` (previous URL doesn't resolve)
- **Tabriz citation URL** in `scripts/data/city-method-overrides.json`:
  `earthquake.ut.ac.ir/` → `geophysics.ut.ac.ir/en/` (seismology subdomain
  was not the institutional homepage)
- **Lisbon (PT) elevation** in `src/data/cities.json`: `2m` → `50m`
  (3 sources confirm 45-62m city-centre)
- **Pattani (TH) population** in `src/data/cities.json`: `144000` → `45000`
  (correcting city-proper vs province confusion; citypopulation.de city-
  proper is 44,353)
- **Karbala / Najaf / Basra source.institution** in `src/data/cities.json`:
  rewritten from "Tehran Institute of Geophysics" to
  "Najaf hawza maraji' (Office of Sistani; Astan al-Husayniyya custodial
  offices) — Tehran-style timing convention". Tehran Institute is the
  Iran-side anchor, not the institutional voice for Twelver Shia Iraqi
  cities.

### Honest caveats

- **Pure data + corpus expansion**: no engine code change; no dispatch
  logic affected. Train WMAE 0.9757 unchanged (verified — new fixtures
  are added to `eval/data/test/`, never gate the ratchet per CLAUDE.md
  rule 2).
- **Egypt ESA is a stub**: the script documents the JS-rendered VIEWSTATE
  failure mode and suggests Puppeteer/Playwright next round. Track A's
  audit estimated Effort 3 / Value 5 for this channel — the JS-rendering
  finding pushes effort closer to 4. Cairo/Alexandria 6.5-min train
  outlier (fajr#69) remains open until a deeper scrape lands.
- **Morocco Habous** is a HOLDOUT cross-reference (test corpus), NOT a
  replacement for the v1.5.0 Mawaqit-Morocco train anchor. The latter
  (mosque-published) remains sacred per CLAUDE.md ratchet rule 5.

### Cross-references

- Track A audit: `autoresearch/proposals/2026-05-05-mosque-corpus-expansion.md`
- Track D audit: `autoresearch/proposals/2026-05-05-city-confidence-audit.md`
- Builds on v1.7.23 (#88 Track C metadata extension) + v1.7.24 (Track B
  bbox routing corrections)
- Pattern reference for fetchers: `scripts/fetch-aladhan.js`
- All 4 deep-research tracks (A/B/C/D) from the 2026-05-05 push are now
  implemented; remaining channels (Track A #2 Brunei MoRA, #5 Kazakhstan
  KMDB; Track A #4 Egypt deeper-scrape) are queued for future rounds

---

## [1.7.24] — 2026-05-05

### Fixed — bbox routing corrections (Track B audit)

`src/engine.js#detectCountry` corrections per the Track B deep-research
audit (`autoresearch/proposals/2026-05-05-bbox-validation.md`). The audit
verified **0 HIGH-severity country-claim mismatches** in the 477-city
registry but identified routing gaps for cities NOT currently registered
plus dead-code cleanup opportunities.

- **Hatay province TR carve-out** before Syria. Antakya / İskenderun /
  Hatay city now correctly route to Türkiye instead of Syria. Box
  `[lat 35.85-36.65, lon 35.93-36.55]` is tightened from the audit's
  draft to exclude Latakia SY (35.53, 35.79) and Tartus SY (34.89, 35.89)
  on the Syrian coast.
- **Iğdır + Ağrı province TR carve-out** before Caucasus. Iğdır city,
  Doğubeyazıt and the surrounding E. Anatolian provinces now correctly
  route to Türkiye instead of Armenia. Box `[lat 39.5-40.05, lon 43.86-44.30]`;
  Yerevan AM (40.18, 44.51) excluded by both lat (>40.05) and lon (>44.30).
- **Iran NW corner carve-out** before Caucasus. Maku IR (39.30, 44.52)
  and Khoy IR (38.55, 44.95) — W. Azerbaijan province IR — now correctly
  route to Iran instead of being caught by Armenia/Azerbaijan first.
- **Iran main bbox extension** from `[lat 25-39, lon 47-63]` to
  `[lat 25-39.8, lon 44-63]` to cover Urmia IR (37.55, 45.07) and other
  W. Azerbaijan IR cities. Iraq / Türkiye E / Caucasus checks all fire
  before Iran so no overlap regression.

### Cleaned up — dead-code removal

- **Türkiye legacy single-bbox check** removed. `[lat 35-43, lon 25-45]`
  was shadowed by the v1.7.19 split (Eastern + Western strips) plus the
  v1.7.24 Hatay and Iğdır carve-outs.
- **Sudan duplicate bbox check** removed. Duplicated the v1.7.19 early-
  Sudan check at line 160 added to claim Port Sudan SD before Saudi.

### Honest caveats

- **Pure routing correction; no calc-path change**. Train WMAE
  0.9757 → 0.9757 (0.00 drift on every cell). All per-region MAE deltas
  0.00. All per-prayer signed bias deltas 0.00. Eval+compare run + verified
  per `feedback_eval_ratchet_before_shippable`. The compare.js verdict
  "FAIL — wash is a rejection" applies to accuracy-improving engine work;
  this PR is structurally outside that scope (bbox-routing corrections
  for cities not in train fixtures cannot move WMAE).
- **Spot-check verification**: 35/36 border-zone cities pass.
  The 1 fail (Kapan AM at 39.20, 46.42 → Azerbaijan instead of Armenia)
  is a pre-existing Armenia-Azerbaijan border issue not caused by v1.7.24
  changes. Tracked for a future round.
- **Track B #5 deferred**: Afghanistan main `lat <= 37` → `<= 37.5` would
  not actually fix Faizabad AF (37.12, 70.58) because Tajikistan's bbox
  catches it FIRST. The real fix requires paired Tajikistan-bbox tightening,
  which has scholarly + regional implications warranting a separate
  research pass. Tracked.

### Cross-references

- Audit: `autoresearch/proposals/2026-05-05-bbox-validation.md`
- Log: `autoresearch/logs/2026-05-05-08-45-v1.7.24-bbox-routing-corrections.md`
- Builds on v1.7.19 (#75) + v1.7.22/23 metadata-vs-calculation framework
- Track A (mosque corpus expansion) + Track D (per-city confidence audit)
  ship in separate next-round PRs

---

## [1.7.23] — 2026-05-05

### Added — `COUNTRY_ASR_CONVENTION` extension (Track C scholarly grounding)

15 metadata-only additions to `src/engine.js`'s `COUNTRY_ASR_CONVENTION`
table per the audit in [`autoresearch/proposals/2026-05-05-madhab-asr-convention-grounding.md`](autoresearch/proposals/2026-05-05-madhab-asr-convention-grounding.md):

- **Maghreb Maliki cluster** (5): Morocco, Mauritania, Tunisia, Algeria,
  Libya — all `'standard'`. Closes the Morocco-Maliki cautionary-example
  loop from CALIBRATION.md / [#88](https://github.com/tawfeeqmartin/fajr/issues/88).
- **West African Maliki cluster** (6): Senegal, Mali, Gambia, Niger,
  BurkinaFaso, CoteDIvoire — all `'standard'`. Maliki Trans-Saharan
  tradition + Tijaniyya/Mouride/Qadiriyya Sufi affiliations.
- **Twelver Jafari** (1): Iran — `'standard'` (Jafari uses 1× shadow Asr,
  same convention as Sunni standard; pedagogical disambiguation).
- **SE Asia Sunni Shafi'i** (3): Cambodia (Cham), Thailand (Patani Malay),
  Philippines (BARMM/Bangsamoro) — all `'standard'`.

Plus 2 inline-comment improvements:

- **India**: added demographic estimate (~140M Hanafi / ~36M Shafi'i /
  ~28M Twelver per Census of India 2011 + Pew 2021 + Samastha Kerala).
- **Yemen**: explicit Zaydi-Shafi'i 35/65 split + 1× shadow consistency.

Plus header rewrite: the `'standard'` label block now explicitly disclaims
that the value is Asr-shadow-convention metadata only, NOT a Shafi'i legal
madhhab claim. Maliki, Hanbali, and Jafari all use 1× shadow despite being
distinct legal madhhabs.

### Honest caveats

- **Pure metadata-only change**: no `applied.asrSchool` or prayer-time
  shift. Train WMAE 0.9757 → 0.9757 (0.00 drift). All per-region MAE
  deltas 0.00. All per-prayer signed bias deltas 0.00. Eval+compare run
  + verified per `feedback_eval_ratchet_before_shippable` (the rule
  introduced after v1.7.22's PR #84 ratchet failure). The `compare.js`
  verdict line "FAIL — wash is a rejection" applies to accuracy-improving
  engine work; this PR is structurally outside its scope.
- **`location.asrConvention === 'standard'`** in Morocco / Iran / etc.
  does not mean Shafi'i. The disclaimer + README "How to think about
  fajr's outputs" section make this explicit.
- **No reclassifications**: the audit found zero entries in the existing
  table that warrant reclassification. The 14 Hanafi + 15 prior `'standard'`
  entries all defend cleanly against primary sources. v1.7.23 is purely
  additive.

### Cross-references

- Audit proposal: `autoresearch/proposals/2026-05-05-madhab-asr-convention-grounding.md`
- Autoresearch log: `autoresearch/logs/2026-05-05-08-30-v1.7.23-asr-convention-table-extension.md`
- Builds on v1.7.22 metadata-vs-calculation split (commits `2b28e77` + `6f6ae23`,
  resolves [#83](https://github.com/tawfeeqmartin/fajr/issues/83) / [#85](https://github.com/tawfeeqmartin/fajr/issues/85))
- Closes pedagogically: the Morocco-Maliki cautionary example from
  [#88](https://github.com/tawfeeqmartin/fajr/issues/88)

---

## [1.7.22] — 2026-05-03

### Fixed

- **City registry row-quality validation** — resolves
  [#86](https://github.com/tawfeeqmartin/fajr/issues/86). Shah Alam's
  Malaysia bbox now contains its own canonical row center, Kuala Lumpur's
  adjacent western edge no longer shadows Shah Alam, and
  `validate:registry` now fails any non-allowlisted city whose row lat/lon
  sits outside its declared bbox. `Jerusalem|PS` is explicitly allowlisted
  as an intentional Palestine routing anchor while `Jerusalem|IL` owns the
  canonical Jerusalem coordinate.

- **Country→Asr-convention metadata dispatch** parallel to country→method — resolves
  [#83](https://github.com/tawfeeqmartin/fajr/issues/83) and the
  naming follow-up in [#88](https://github.com/tawfeeqmartin/fajr/issues/88).
  v1.7.21
  exposed `location.madhab` but the field always reported `'shafii'`
  because adhan.js's method presets all default to standard 1× shadow
  Asr regardless of country. v1.7.22 introduces an explicit
  `COUNTRY_ASR_CONVENTION` table in `src/engine.js` and uses it as
  Hanafi-vs-standard Asr convention metadata for country-default and city-institutional
  dispatch paths (skipping caller-explicit + skipping methods whose name
  carries an explicit `+ Shafi Asr` / `+ Hanafi Asr` composition marker).
  New integrations should read `location.asrConvention` /
  `location.asrConventionSource`; `location.madhab` / `madhabSource` remain
  deprecated v1.7.21 aliases only.

### Behavioral note — metadata fixed, Asr calculation not silently shifted

After [#85](https://github.com/tawfeeqmartin/fajr/issues/85), v1.7.22
deliberately splits the likely local Asr convention from the
calculation-facing Asr school. After [#88](https://github.com/tawfeeqmartin/fajr/issues/88),
the primary field names are explicit Asr-convention names, because the
two-value Hanafi-vs-standard Asr convention is not a full legal-madhhab
taxonomy. Morocco is the cautionary example: Moroccan users may be Maliki,
while `location.asrConvention` correctly reports `standard` 1× Asr.

- `location.asrConvention` / `location.asrConventionSource` describe likely local
  Asr-convention metadata.
- `applied.asrSchool` describes what the engine actually used for Asr.
- `location.madhab`, `location.madhabSource`, and `applied.madhab` remain
  deprecated compatibility aliases and should not be rendered as "local
  madhhab" in user-facing UI.

Hanafi-convention countries now report `location.asrConvention: 'hanafi'`, but
this does **not** automatically mutate Asr to 2× shadow:

- **Pakistan** (Karachi region; Hanafi metadata)
- **Bangladesh** (Karachi region; Hanafi metadata)
- **Türkiye** (Diyanet region; Hanafi metadata)
- **Albania** (Diyanet region; Hanafi metadata)
- **Bosnia, Kosovo, North Macedonia** (Diyanet region; Hanafi metadata)
- **Afghanistan** (Karachi region; Hanafi metadata)
- **India** (Karachi region; Hanafi-majority metadata via AIMPLB)
- **Uzbekistan, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan**
  (Hanafi tradition)

Cities with explicit Shafi'i overrides (Maldives, Sri Lanka, Lucknow,
Kochi, Cotabato, Marawi) are honored correctly. Sarajevo and other
Diyanet city overrides can report Hanafi local metadata while their
calculation-facing Asr remains method-implied unless a future explicit
override or source-specific 2× shadow implementation is added.

### Honest caveats

- **Why not default Hanafi times immediately?** Product-wise, Hanafi-majority
  countries should preselect Hanafi in app settings. Engine-wise, fajr's
  default calculation is benchmarked against published timetable fixtures.
  A blanket country-level 2× shadow mutation failed the ratchet: Diyanet
  Türkiye and Karachi/AlAdhan Asr moved away from current ground truth.
  The safe split is: metadata now, explicit caller/source-specific Asr
  override later. Tracked in [#40](https://github.com/tawfeeqmartin/fajr/issues/40)
  and [#85](https://github.com/tawfeeqmartin/fajr/issues/85).
- **Mixed-madhab countries** (Egypt, Saudi, Iraq, Lebanon, Syria,
  Morocco, Western diaspora) are intentionally not in `COUNTRY_ASR_CONVENTION`
  and fall through to `asrConventionSource: 'method-implied'`. The
  `disclaimer` field flags this for users; #40's caller-side override
  surface in v1.8.x is the actionable mechanism.
- **`asrConventionSource: 'country-default'`** is the primary new value
  (mirrored by deprecated `madhabSource` for v1.7.21 compatibility). Apps
  relying on the previous binary union should update; the change is additive
  (no removed values).
- **`applied.asrSchool`** is a new additive field (`'standard' | 'hanafi'`)
  so apps can distinguish likely local Asr-convention metadata from
  the Asr formula used in the returned time.

### Changed

- **README simplified and reorganized** — resolves
  [#51](https://github.com/tawfeeqmartin/fajr/issues/51) via
  [#89](https://github.com/tawfeeqmartin/fajr/pull/89). The front page
  is now a compact project overview instead of a combined research paper,
  API reference, changelog, and bibliography. It links directly to
  [CALIBRATION.md](CALIBRATION.md), [docs/progress.md](docs/progress.md),
  [docs/data-sources.md](docs/data-sources.md), and
  [examples/agiftoftime/INTEGRATION.md](examples/agiftoftime/INTEGRATION.md)
  for the deeper material, while preserving the sadaqah jariyah dedication to
  Nurjaan and Kauthar, crediting AlAdhan as an eval reference layer, and
  clarifying that qiyam/last-third times live on `dayTimes()` / `nightThirds()`.

- **Habous Morocco live validation resource captured** — adds
  `scripts/data/habous-morocco-cities.json` and
  `scripts/validate-habous-morocco.js` after a Moroccan user thread pointed
  to the official Ministry of Habous city/region prayer-time portal. The
  helper maps all 33 bundled Moroccan registry cities to official Habous
  `ville` IDs (using explicit nearest-city mappings where Habous has no
  separate city option) and compares live official current-day times against
  fajr output without modifying `eval/data/`.

### Cross-references

- Resolves [#83](https://github.com/tawfeeqmartin/fajr/issues/83)
- Resolves [#51](https://github.com/tawfeeqmartin/fajr/issues/51)
- Builds on v1.7.21 (#81 best-guess framing surface)
- Cross-refs [#40](https://github.com/tawfeeqmartin/fajr/issues/40)
  (caller-side override umbrella — composes with this), [#26](https://github.com/tawfeeqmartin/fajr/issues/26)
  (Maldives/Sri-Lanka madhab fix — same pattern, this generalizes)

---

## [1.7.21] — 2026-05-03

### Added

- **"Best guess" provenance surface on every `prayerTimes()` return** —
  resolves [#81](https://github.com/tawfeeqmartin/fajr/issues/81). Auto-
  dispatched values now carry explicit framing so downstream apps can
  drive verify-this-default UX without re-deriving from scattered output
  fields. New fields:
  - `location.madhab: 'shafii' | 'hanafi'` — legacy name for the Asr
    convention implicit in the dispatched method (standard 1× shadow Asr
    vs Hanafi 2× shadow, which can shift Asr by 30-60 minutes). Superseded
    by `location.asrConvention` in v1.7.22.
  - `location.madhabSource: 'caller-explicit' | 'method-implied'` —
    legacy provenance of the Asr-convention choice. Until [#40](https://github.com/tawfeeqmartin/fajr/issues/40)
    lands the v1.8.x override surface, the value is always
    `'method-implied'`.
  - `applied: { method, madhab, elevationMin }` — single canonical
    "what we did" summary apps can surface as a badge.
  - `disclaimer: string` — turn-key user-facing copy framing the
    auto-dispatched values as best guess and recommending verification.
    Apps can render verbatim in long-press / "Why this time?" sheets,
    or ignore it.
- **README "How to think about fajr's outputs"** section near the top
  of the README — explicit "best-effort defaults, not religious
  pronouncements" framing with the verify-location / check-settings /
  consult-local-mosque guidance.
- **Status banner updated** to call out the best-guess framing inline.

### Honest caveats

- Pure additive change; no breaking API surface. Existing
  `prayerTimes()` consumers continue to receive the same fields
  unchanged, just with three new top-level properties (`applied`,
  `disclaimer`) and three new `location` properties (`madhab`,
  `madhabSource`, plus the existing `methodSource` / `elevationSource`).
- **Every country currently reports `madhab: shafii`** because adhan.js's
  Madhab default is Shafi'i (1× shadow) for all method presets. The only
  cases that explicitly compose Hanafi are the `KarachiShafi` overrides
  in Maldives / Sri Lanka / Lucknow / Kochi (which redundantly enforce
  Shafi'i). Pakistan / Bangladesh / Türkiye / Albania users following
  Hanafi will see `madhab: shafii` in fajr's output until
  [#40](https://github.com/tawfeeqmartin/fajr/issues/40) ships the user-
  override surface in v1.8.x. The new `disclaimer` field flags this
  exactly.
- The `disclaimer` text is intentionally generic. Apps wanting a
  region-specific disclaimer can render their own copy alongside.

### Cross-references

- Resolves [#81](https://github.com/tawfeeqmartin/fajr/issues/81)
  (frame auto-dispatched values as best guess)
- Cross-refs [#40](https://github.com/tawfeeqmartin/fajr/issues/40)
  (madhab override umbrella — the v1.8.x mechanism that makes the
  verification prompt actionable for users), [#65](https://github.com/tawfeeqmartin/fajr/issues/65)
  (custodianship maturity — same trajectory of honest framing)

---

## [1.7.20] — 2026-05-03

### Added

- **`prayerNames` constant + `prayerName(prayer, lang)` helper** in
  [`src/locale.js`](src/locale.js) — multi-language prayer-name strings
  (English / Arabic / Turkish / Indonesian / Urdu) so every consuming app
  inherits a single canonical set instead of vendoring its own. Arabic forms
  are voweled per the v1.7.13 `monthNameAr` (#62) convention. Falls back to
  English for unknown locales. Resolves [#63](https://github.com/tawfeeqmartin/fajr/issues/63)
  Proposal 1.
- **`qibla()` cardinal + cardinalDescription fields** — qibla() now returns
  `cardinal` (16-point compass abbreviation, e.g. `'WNW'`) and
  `cardinalDescription` (human-readable expansion, e.g. `'West-northwest'`)
  alongside the existing `bearing` / `magneticDeclination` / `trueBearing`
  fields. Resolves [#63](https://github.com/tawfeeqmartin/fajr/issues/63)
  Proposal 4.

### Honest caveats

- Pure additive change; no breaking API surface. Existing
  `prayerTimes()` / `qibla()` consumers continue to receive the same fields
  unchanged, just with two new optional fields appearing on every `qibla()`
  result.
- Bundle-size delta: ~1.5 KB raw for the locale strings + ~0.3 KB for the
  cardinal table. Acceptable.
- **#63 Proposals 2, 3, 5 (rakah counts, prayer windows, method short label)
  are NOT shipped in this release.** They depend on the user-override
  surface area tracked in [#40](https://github.com/tawfeeqmartin/fajr/issues/40)
  and ship in v1.8.x. Per the suggested ship sequence in #63 itself.

### Cross-references

- Resolves Proposals 1 + 4 of [#63](https://github.com/tawfeeqmartin/fajr/issues/63)
  (downstream-app metadata bundle from agot-agent)
- Parallel pattern to [#62](https://github.com/tawfeeqmartin/fajr/issues/62)
  Arabic month names (v1.7.13)

---

## [1.7.19] — 2026-05-03

### Fixed

- **6 cities deferred from v1.7.18 now resolve to the correct country**
  via engine-side `detectCountry()` bbox-table fixes. Cities now in
  registry: Sialkot PK, Pekanbaru ID, Manado ID, Eindhoven NL,
  Gaziantep TR, Port Sudan SD. Total registry 471 → 477 cities (+6).
- **Sialkot PK** (32.49, 74.52) was caught by Afghanistan; fixed via
  Afghanistan-bbox split into main (lat 29.4-37) + Wakhan corridor
  (lat 36.5-38.5, lon 71.5-74.95). Pakistan now safely extends to
  lon 75.0.
- **Pekanbaru ID** (0.51, 101.45) was caught by Malaysia; fixed by
  tightening Malaysia lat-min from 0.5 to 1.0 (excludes northern
  Sumatra; Johor Bahru 1.49 still inside).
- **Eindhoven NL** (51.44, 5.45) was caught by Belgium; fixed by
  reordering `detectCountry()` to put Netherlands BEFORE Belgium
  AND before France. **Maastricht NL** (50.85, 5.69) — previously
  routing to France — now also resolves to Netherlands.
- **Gaziantep TR** (37.07, 37.38) was caught by Syria; fixed by
  tightening Syria lat-max from 37.4 to 37.05 + adding two-strip
  Türkiye coverage (eastern lat 37.05-42.10, western lat 36.0-37.05).
- **Port Sudan SD** (19.62, 37.22) was caught by Saudi Arabia; fixed
  by adding an early Sudan check between Egypt and Saudi.
- **Wadi Halfa SD** (21.81, 31.34) — previously routing to Egypt — now
  resolves to Sudan via Egypt lat-min tightening from 21 to 22 (1899
  Anglo-Egyptian parallel).

### Changed

- `COUNTRY_BBOX_TABLE` Pass-B coverage added for Turkey, Indonesia,
  Netherlands, Sudan. Names match `ISO_TO_ENGINE_COUNTRY_LOCAL` keys
  (English `Turkey`, not `Türkiye` — engine canonical preserved).
- 2 new `BBOX_OVERRIDES`: Sialkot|PK (clears Gujranwala overlap),
  Luton|GB (eastern lon-max -0.30 → -0.36).

### Honest caveats

- **Pre-existing routing limitations not fixed in this release** (none
  of these cities are in the registry yet, so no validator FAIL):
  - Iğdır TR routes to Armenia (Armenia bbox covers it)
  - Faizabad / Wakhan AF route to Tajikistan (Tajikistan bbox covers them)
  - Hatay province TR cities route to Syria (Syria's lon range catches Hatay)
  These can be addressed via `BBOX_OVERRIDES` if/when those cities are
  added to the registry.
- **No prayer-time changes** for previously-resolved cities. Only the
  6 newly-registered cities + Maastricht (when added) + Wadi Halfa (when
  added) get different country-method dispatch than they would have
  under v1.7.18.

### Cross-references

- PR: [#77](https://github.com/tawfeeqmartin/fajr/pull/77)
- Resolves: [#75](https://github.com/tawfeeqmartin/fajr/issues/75)
- Autoresearch log: `autoresearch/logs/2026-05-03-11-30-v1.7.19-engine-bbox-fixes.md`

---

## [1.7.18] — 2026-05-03

### Added

- **City registry expansion: 387 → 471 cities (+84 cities)** in
  `src/data/cities.json`. Targets under-represented Muslim metros and
  diaspora hubs across 6 region clusters: Asia non-capitals (32 cities —
  Pakistan / India / Iran / Saudi / UAE / Egypt / Central Asia), Indonesia
  provincial capitals (10), Türkiye top-population provinces (7), Africa (5),
  Europe diaspora (18 — Leeds, Stuttgart, Naples, Sevilla, Cordoba, Grozny),
  Americas (12 — Boston, San Francisco, Seattle, Foz do Iguaçu, Maracaibo).
- **12 new `BBOX_OVERRIDES`** for sibling-metro disambiguation: Ajman ↔
  Sharjah, Düsseldorf ↔ Cologne, Coventry ↔ Birmingham, Luton ↔ London,
  Dammam ↔ Khobar, Trabzon clear of Georgia, Kinshasa clear of Brazzaville,
  etc.
- **Track E redo verification audit** archived as
  `autoresearch/proposals/v1.7.18-city-verification-audit.md`. Tier
  distribution on the v1.7.15 baseline (387 cities): 167 verified (43.2%) /
  1 approaching / 218 partial / 1 unverified (Jerusalem-PS, intentional
  duplicate). Mosque-anchor coverage 40.6% + override coverage 3.9% =
  43.4% institutional anchors. Identifies 6 priority region clusters for
  the next Mawaqit corpus expansion (S Asia HIGHEST, then SE Asia, W
  Africa, S Africa, E Africa, Iran/Caucasus).
- **Research-papers survey** archived as
  `autoresearch/proposals/research-papers-survey-2026-05.md` — 22 papers
  (2014-2025), 12 actionable items, 3 candidate validation sets.
  Notable finding: Faid 2024 Nature-Sci-Reports validates fajr's existing
  Aabed-2015 Fajr 18° position (dark-sky 17.49° matches institutional 18°;
  urban 11.5° is artificial light at night, not calculation error).

### Changed

- **Jerusalem-PS row bbox** retargeted to West Bank east-of-Jerusalem
  (Eizariya / Abu Dis / Ma'ale Adumim) to clear 4 prior validation FAILs
  without disturbing Jerusalem-IL routing.

### Validation

- `npm run validate:registry` → **0 FAIL-class issues** on 471 cities
  (2 acceptable WARN-class bbox-overlap-cross-country pairs).

### Honest caveats

- Six high-population cities were **intentionally NOT added** in this
  release because they sit at `src/engine.js#detectCountry` country-bbox
  edges and would route to the wrong country: Sialkot PK (caught by
  Afghanistan), Pekanbaru / Manado ID (caught by Malaysia), Eindhoven NL
  (caught by Belgium), Gaziantep TR (caught by Syria), Port Sudan SD
  (Sudan absent from `COUNTRY_BBOX_TABLE`, caught by Saudi Arabia).
  Engine bbox-table fixes are tracked in
  [#75](https://github.com/tawfeeqmartin/fajr/issues/75); these cities
  will be registered in a follow-up release once the engine fix lands.
- This is a **routing-coverage release, not a calculation release**.
  Per-source WMAE numbers stay exactly where v1.7.16 left them
  (train 0.9757, holdout 3.62). No engine.js / eval / API changes.

### No prayer-time changes

`prayerTimes()` for any previously-registered city produces identical
output to v1.7.16. Only `nearestCity()` and `detectLocation()` resolution
changes for the 84 newly-registered metros.

### Cross-references

- PR: [#73](https://github.com/tawfeeqmartin/fajr/pull/73)
- Tracking: [#75](https://github.com/tawfeeqmartin/fajr/issues/75)
  (deferred 6 cities awaiting engine bbox-table fixes)
- Autoresearch log: `autoresearch/logs/2026-05-03-10-45-v1.7.18-city-registry-expansion.md`
- Verification audit: `autoresearch/proposals/v1.7.18-city-verification-audit.md`

---

## [1.7.16] — 2026-05-03

### Added

- **First Karpathy autoresearch ratchet session — train WMAE breaks the
  1-minute barrier** (1.0668 → 0.9757, **-9%**). Two Path A community
  calibrations, both ratchet-PASS (train strictly decreases, no per-region
  regression, no ihtiyat-unsafe drift):

  1. **Morocco Dhuhr +5 min** — Path A extension of the v1.5.0 Morocco
     Maghrib +5 precedent. Closes -4.80 min systematic bias across 25
     Mawaqit Morocco fixtures. Same scholarly-fixture-matching methodology,
     same scope (Morocco-bounded). Mawaqit per-source WMAE 1.5171 → 0.8829
     (-41.8%).
  2. **JAKIM Dhuhr +2 / Asr +1** — Path A for Malaysia's JAKIM-via-
     waktusolat.app fixtures. Dhuhr bias -0.77 closes; Asr bias -0.97
     closes (Asr +1 preserves the ihtiyat-rounds-UP direction). JAKIM
     per-source WMAE 0.5786 → 0.4548 (-21.4%).

- **Per-source unchanged-source flatness**: Aladhan (1.2231) and Diyanet
  (0.5024) per-source WMAE stay **exactly flat** before vs after — confirming
  the Path A offsets are correctly region-bounded and don't leak into
  unrelated sources.

### Agent self-restraint — 5 flagged items NOT auto-fixed

The autoresearch agent surfaced 5 issues it deliberately deferred because
they need human scholarly judgment per the ihtiyat-safety rules. Each gets
its own tracking issue so flags don't become a black hole:

- **Cairo / Alexandria Fajr & Isha** — fixture says "Egyptian" but
  empirically matches MWL. Tracking: [#69](https://github.com/tawfeeqmartin/fajr/issues/69).
- **London Maghrib/Dhuhr Path A trade-off** — AlAdhan-UK and Mawaqit-London
  disagree on MoonsightingCommittee +5/+3 offsets. Tracking:
  [#70](https://github.com/tawfeeqmartin/fajr/issues/70).
- **Diyanet Asr +1.0 systematic** — fixable but in ihtiyat-unsafe direction
  (closing it would shift Asr earlier). Agent correctly refused. Tracking:
  [#71](https://github.com/tawfeeqmartin/fajr/issues/71).
- **AlAdhan Asr +1.5 to +2.5 systematic across 11+ cities** — likely
  adhan-js vs AlAdhan formula divergence. Tracking:
  [#72](https://github.com/tawfeeqmartin/fajr/issues/72).
- **Pakistan / Bangladesh / Türkiye / Albania Asr school dispatch** —
  Hanafi-majority on Standard-school. Folds into existing
  [#40](https://github.com/tawfeeqmartin/fajr/issues/40)
  override-parameter umbrella.

### Honest caveats

- Cities using **Mawaqit-published times as their reference** will see
  prayer times shift 1-5 min:
  - Casablanca / Rabat / Marrakech **Dhuhr**: +5 min (matches mosque reality)
  - Kuala Lumpur / Selangor / Penang **Dhuhr**: +2 min
  - Kuala Lumpur / Selangor / Penang **Asr**: +1 min
- Cities using **AlAdhan or Diyanet as reference**: no change (per-source
  flatness verified).
- **Holdout WMAE 3.62 vs train 0.98** is ~4x — intentional. Holdout is
  weighted toward harder cases: polar latitudes that break twilight
  calculation (Longyearbyen 78°N, Oslo 60°N), elevation outliers (La Paz
  3640m), third-party aggregator stress data (muslimsalat.com 26 min WMAE).
  Holdout moved the same direction as train (3.66 → 3.62) — that's the
  no-overfit signal.

### Cross-references

- PR: [#67](https://github.com/tawfeeqmartin/fajr/pull/67)
- Announcement: [agot#22](https://github.com/tawfeeqmartin/agiftoftime/issues/22)
- Autoresearch logs:
  `autoresearch/logs/2026-05-03-17-30-iteration-1-morocco-dhuhr-path-a.md`,
  `autoresearch/logs/2026-05-03-17-36-iteration-2-jakim-dhuhr-asr-extension.md`

---

## [1.7.15] — 2026-05-03

### Changed

- **README status banner replaced** with the v1.x public-beta framing
  recommended by agot-agent in [#65](https://github.com/tawfeeqmartin/fajr/issues/65).
  Previous banner had grown into a multi-paragraph release-narrative that
  duplicated the CHANGELOG; new banner is a 2-sentence stability + reporting
  contract that points at CHANGELOG.md and CALIBRATION.md for detail.
- **`docs/progress.md` and other narrative content** continues unchanged —
  this release only changes the headline framing, not the underlying
  accuracy claims.

### Added

- **[CALIBRATION.md](CALIBRATION.md)** at the repo root — fajr's structured
  transparency document. Covers (a) the 9 reference sources fajr benchmarks
  against (Mawaqit / Diyanet / JAKIM / KEMENAG / MUIS / AlAdhan /
  IslamicFinder / praytimes.org / muslimsalat.com), (b) per-region accuracy
  with current train (1.07 min) and holdout (3.66 min) WMAE, (c) method
  dispatch per region with institutional citations (78 country cases + 16
  city-level overrides, all 🟢 or 🟡→🟢 classified), (d) madhab dispatch per
  region with the v1.7.1 Maldives/Sri-Lanka Shafi'i fix and the documented
  Pakistan/Bangladesh/Türkiye/Albania population-mismatch pending v1.8.0
  override design, (e) known deviations from reference sources with
  rationale (elevation auto-application, Hijri UAQ default, per-prayer
  rounding, Morocco Maghrib +5, Diyanet -1, JAKIM Isha +1, plus the
  Cairo/Alexandria + London Path A candidates currently shipping as
  documented residuals), (f) open work + roadmap, (g) scholarly review
  status (no formal review yet — practice 4 from #65 on the v1.8.0+
  roadmap), and (h) the versioning + stability promise that the README
  banner refers to.
- Resolves [#65](https://github.com/tawfeeqmartin/fajr/issues/65) practices 1
  + 2. Practices 3 (minimum-scope agents per #49), 4 (formal scholarly
  review), and 5 (cross-repo doc rename) are scoped for v1.8.0+.

### No code change

This is a pure documentation release. No `src/*` files modified; eval WMAE
unchanged. Bumped to allow npm to surface the doc improvements via
`npm view @tawfeeqmartin/fajr readme` and to pin a checkpoint version that
downstream consumers (notably agiftoftime) can pin against.

### Cross-references

- Issue: [#65](https://github.com/tawfeeqmartin/fajr/issues/65)
- PR: pending — see branch `chore/v1.7.15-public-beta-framing-and-calibration-md`

---

## [1.7.13] — 2026-05-02

### Added

- **`hijri()` now returns `monthNameAr`** (Arabic month name with full
  diacritics — sukūn, fatḥa, kasra, shadda) alongside the existing English
  `monthName`. Voweled per AlAdhan / IslamicFinder convention. The 12 strings
  — مُحَرَّم, صَفَر, رَبِيع الأَوَّل, رَبِيع الآخِر, جُمَادَى الأُولَى,
  جُمَادَى الآخِرَة, رَجَب, شَعْبَان, رَمَضَان, شَوَّال, ذُو الْقَعْدَة,
  ذُو الْحِجَّة — let downstream Islamic apps drop their locally-vendored
  arrays and inherit consistent voweling. Present on both the default
  Umm al-Qura path and the legacy `{ convention: 'tabular' }` path.
  Resolves [#62](https://github.com/tawfeeqmartin/fajr/issues/62).
- `HijriResult.monthNameAr: string` added to `src/index.d.ts`.

### Honest caveats

- Pure additive change; no breaking API surface. All existing consumers
  continue to receive the same `year` / `month` / `day` / `monthName` fields
  unchanged. The new field appears alongside.
- Bundle-size delta: ~600 bytes for the 12 voweled Arabic strings.

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

[1.7.15]: https://github.com/tawfeeqmartin/fajr/releases/tag/v1.7.15
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
