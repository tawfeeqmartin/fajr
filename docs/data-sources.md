# Data Sources

Last refreshed: 2026-05-06

This page explains what fajr validates against, how each source should be
trusted, and where the raw source details live. It is not the source of truth
for prayer-time fixtures: the canonical data remains in `eval/data/`, source
registries remain in `scripts/data/`, and current WMAE/counts are generated in
[docs/progress.md](progress.md) and [SCOREBOARD.md](../SCOREBOARD.md).

The purpose of this page is to prevent a common failure mode: treating every
API, mosque row, paper, or blocked URL as equally authoritative. They are not.

## Source Classes

| Class | Meaning | Used for |
|---|---|---|
| Ratchet train | Sources included in `eval/data/train/`; changes must not regress train WMAE or per-region safety rules. | Release gating. |
| Holdout diagnostic | Sources included in `eval/data/test/`; reported but never optimized against. | Drift detection, source-quality triage, coverage. |
| Institutional reference | Named publisher of a method or policy, but not yet fixture-backed. | Citation chain and future ingestion. |
| Research lead | Promising but blocked, stale, JS-rendered, PDF-only, or not yet verified. | Issue tracking, not calibration. |
| Noisy aggregator | Third-party consumer API or mosque row with known variance. | Warning signal only. |

## Trust Policy

When sources disagree, fajr should prefer:

1. Official ministry/council timetable for that place.
2. Validated multi-mosque local practice across cities and seasons.
3. Named institutional method specification.
4. Calc-vs-calc agreement with independent engines.
5. Aggregator data or single mosque rows.

Do not average sources until the source type is understood. A mosque row may
contain adhan time, iqama time, local ihtiyat, stale app settings, timezone
misconfiguration, or a mosque-specific convention. A stronger position needs
official data, multiple local mosques, seasonal validation, or a clearly
documented institutional method.

## Current Fixture Summary

Current generated metrics live in [docs/progress.md](progress.md). As of the
latest generated run:

| Set | Entries | Fixture files | Role |
|---|---:|---:|---|
| Train | 215 | 12 | Ratchet-gated. |
| Holdout | 29,004 | 186 | Diagnostic only; do not optimize against this aggregate. |

### Train Sources

| Source | Entries | Current role | Notes |
|---|---:|---|---|
| Mawaqit Morocco | 25 | Mosque-published train anchor | Anchors Morocco Path A calibration. Strong for community practice, but individual mosque rows are still checked for data quality. |
| Diyanet Turkiye | 30 | Official institutional train source | Official Turkiye source via `ezanvakti.emushaf.net`; verified city-ID mapping now lives in `scripts/data/diyanet-ezanvakti-cities.json`, but yearly fixture promotion is still a separate curation step. |
| JAKIM via waktusolat.app | 30 | Institutional train source via proxy | Used for Malaysia calibration; proxy should be treated as a channel to JAKIM data, not the authority itself. |
| Aladhan API | 130 | Calc-consistency train anchor | Useful for formula drift. It is not a local authority and should not override mosque/ministry data. |

Train files currently present:

```txt
eval/data/train/diyanet.json
eval/data/train/dubai.json
eval/data/train/egypt.json
eval/data/train/jakarta.json
eval/data/train/karachi.json
eval/data/train/mawaqit-morocco.json
eval/data/train/paris.json
eval/data/train/saudi.json
eval/data/train/toronto.json
eval/data/train/uk.json
eval/data/train/usa.json
eval/data/train/waktusolat.json
```

### Holdout Sources

| Source | Entries | Current role | Notes |
|---|---:|---|---|
| Mawaqit yearly corpora | 20,296 | Mosque-published seasonal diagnostic | Large and useful, but contains mosque-level variance and occasional stale/corrupt rows. Analyze before calibrating. |
| Morocco Habous monthly | 990 | Official institutional diagnostic | Strong Morocco validation source; supports the canonical Morocco official-timetable position. |
| MUIS Singapore | 365 | Official institutional diagnostic | Clean licensed annual source; currently one of fajr's strongest institutional matches. |
| KEMENAG Indonesia | 1,054 | Official institutional diagnostic | Broad provincial coverage; use for Indonesia position work, not as a blind global correction. |
| KEMENAG via myQuran | 147 | Wrapper diagnostic | Divergence tracked in #97; use to investigate wrapper fidelity, not direct calibration. |
| Aladhan yearly / world fixtures | 4,000+ | Calc-vs-calc diagnostic | Useful for breadth and formula drift; not local authority. |
| praytimes.org | 100 | Independent JS reference | Calc-vs-calc cross-check. |
| muslimsalat.com | 32 | Noisy aggregator | High WMAE; useful because the metric system should flag it as noisy. |
| Stress fixtures | varied | Edge-case validation | High latitude, polar, equator, and high elevation behavior. |

Holdout fixture files are intentionally numerous (`eval/data/test/` currently
contains 186 fixture files). Use [docs/progress.md](progress.md) for the
current per-source WMAE table rather than hand-maintaining that table here.

## Major Source Notes

### Morocco: Habous and Mawaqit

Morocco is the clearest example of how fajr should use multiple source layers.

| Source | What it contributes | Product conclusion |
|---|---|---|
| Ministry of Habous | Official city/region timetable. | Highest authority for Morocco default. |
| Habous monthly fixture | 33 mapped Moroccan cities x current Hijri month. | Confirms broad city-level alignment. |
| Mawaqit Morocco train | Mosque-published local practice. | Anchored early Path A calibration. |
| Mawaqit Morocco yearly corpus | Seasonal mosque data across many mosques. | Reinforces that a single canonical Morocco stance is better than separate semantic aliases. |

Snapshot tooling:

- [`scripts/fetch-habous-morocco-month.js`](../scripts/fetch-habous-morocco-month.js)
  captures the official current Hijri-month table
  `https://www.habous.gov.ma/prieres/horaire_hijri_2.php?ville={id}` into
  fixture-shaped JSON. It prints to stdout by default and writes only when
  `--out` is supplied.
- [`.github/workflows/habous-morocco-snapshot.yml`](../.github/workflows/habous-morocco-snapshot.yml)
  runs recurring captures and opens review PRs with new source snapshots under
  [`fixtures/habous-morocco/`](../fixtures/habous-morocco/). These are archived
  evidence, not automatic eval fixtures.
- The 2026-05-05 probe produced 990 current-month rows across the 33 mapped
  Moroccan cities. Internet Archive recovery was useful but sparse: 7
  Rabat/default monthly snapshots and 3 Casablanca snapshots. That supports
  source triage and seasonal spot-checking, not a dense two-year calibration
  corpus yet.

Fixture gate:

- [`test/habousMoroccoFixture.test.js`](../test/habousMoroccoFixture.test.js)
  verifies that `eval/data/test/morocco-habous-monthly.json` covers every
  mapped Moroccan city, preserves Habous source metadata, and keeps the Morocco
  default within the current official-month envelope for Fajr, Dhuhr, Asr,
  Maghrib, and Isha.
- Sunrise is intentionally excluded from the five-prayer accuracy gate and kept
  as a loose source-sanity check only. In Morocco comparisons it can behave like
  a mosque-practice end-of-Fajr marker rather than a pure astronomical sunrise
  target.

Raw/source locations:

- `eval/data/train/mawaqit-morocco.json`
- `eval/data/test/mawaqit-morocco-yearly.json`
- `eval/data/test/mawaqit-morocco-extended.json`
- `eval/data/test/morocco-habous-monthly.json`
- `eval/data/test/morocco-habous.json`
- `scripts/data/habous-morocco-cities.json`
- `scripts/data/mawaqit-mosques.json`
- `fixtures/habous-morocco/`
- `scripts/fetch-morocco-habous.js`
- `scripts/fetch-habous-morocco-month.js`
- `scripts/fetch-mawaqit.js`
- `scripts/fetch-mawaqit-yearly.js`
- `scripts/validate-habous-morocco.js`

Do not re-expand mosque slug lists in this document. The canonical slug
registry is `scripts/data/mawaqit-mosques.json`, including active, excluded,
and wishlist entries.

### Turkiye: Diyanet

Diyanet is the authoritative institutional source for Turkiye. Current train
coverage is Istanbul, Ankara, and Izmir. The ezanvakti API uses numeric city and
district IDs, so multi-city fetches must use the verified mapping file instead
of guessed IDs. The mapping covers every bundled Turkish registry city, but it
does not by itself promote a yearly Diyanet fixture.

Raw/source locations:

- `eval/data/train/diyanet.json`
- `scripts/data/diyanet-ezanvakti-cities.json`
- `scripts/fetch-diyanet.js`

### Malaysia: JAKIM via Waktusolat

JAKIM is the authority; `waktusolat.app` is the current data channel. Treat this
as institutional evidence through a proxy, with future work to prefer official
JAKIM endpoints if available.

Raw/source locations:

- `eval/data/train/waktusolat.json`
- `scripts/fetch-waktusolat.js`

### Singapore: MUIS

MUIS publishes annual data through data.gov.sg under Singapore's Open Data
Licence. This is a clean official source and should be a model for future
institutional ingestion.

Raw/source locations:

- `eval/data/test/muis.json`
- `scripts/fetch-muis.js`

### Indonesia: KEMENAG

KEMENAG is the authority for Indonesia. The official KEMENAG fixture is more
important than wrapper data. The myQuran wrapper is retained as a diagnostic
because its divergence can reveal wrapper or mapping issues.

Raw/source locations:

- `eval/data/test/kemenag.json`
- `eval/data/test/indonesia-myquran.json`
- `scripts/data/kemenag-provinces.json`
- `scripts/fetch-kemenag.js`
- `scripts/fetch-kemenag-official-yearly.js`
- `scripts/fetch-indonesia-myquran.js`

### Aladhan and PrayTimes

Aladhan and praytimes.org are valuable independent calculation references. They
catch method-dispatch and formula drift, but they cannot arbitrate local
practice against official timetables or mosque-published reality.

Raw/source locations:

- `eval/data/train/*` files with source `Aladhan API`
- `eval/data/test/world-*.json`
- `eval/data/test/iran-pakistan-aladhan-yearly.json`
- `eval/data/test/uk-aladhan-moonsighting-yearly.json`
- `eval/data/test/praytimes-reference.json`
- `scripts/fetch-aladhan.js`
- `scripts/fetch-aladhan-world.js`
- `scripts/fetch-aladhan-iran-pakistan.js`
- `scripts/fetch-aladhan-uk-yearly.js`
- `scripts/fetch-praytimes.js`

### Mawaqit Outside Morocco

Mawaqit is excellent for discovering lived mosque practice, but mosque pages can
have corrupt embedded calendars, stale values, or local buffers. Treat large
Mawaqit yearly corpora as a diagnostic and calibration lead, not as automatic
ground truth.

Raw/source locations:

- `eval/data/test/mawaqit.json`
- `eval/data/test/mawaqit-france-yearly.json`
- `eval/data/test/mawaqit-uk-yearly.json`
- `scripts/data/mawaqit-mosques.json`
- `scripts/fetch-mawaqit.js`
- `scripts/fetch-mawaqit-yearly.js`

## Institutional References Not Yet Fully Fixture-Backed

These sources are important for citation and future ingestion, but a named
institution is not the same thing as a passing fixture.

| Institution | Region/method relevance | Current status |
|---|---|---|
| Saudi MoIA | Saudi prayer-time practice and possible automated Saudi fetcher. | Reachable; JS-rendered / app-backed extraction needs separate work. |
| General Presidency for the Affairs of the Two Holy Mosques | Makkah/Madinah prayer-time publication. | Canonical but unreachable from current network path; not fixture-backed. |
| Umm al-Qura Calendar / KACST | Saudi Hijri calendar source. | Canonical but direct site unreachable from current network path; use reachable institutional mirrors or archived tables when found. |
| Council of Senior Scholars / al-Ifta | Saudi fatwa source. | Reachable with TLS caveats; primary text extraction still needed. |
| IACAD Dubai | UAE method and high-rise/elevation precedent. | Reachable; original Burj Khalifa fatwa text still needs archival recovery. |
| Egyptian General Authority for Survey | Egyptian method source. | Reachable but JS-rendered; current fetcher is a stub/dead-end marker. |
| Tehran Institute of Geophysics | Tehran method source. | Referenced and partly fixture-backed through Aladhan proxy; direct institutional timetable ingestion remains future work. |
| University of Islamic Sciences Karachi | Karachi method source. | Institutional reference without canonical public URL; needs paper/manual source recovery. |
| Ministry of Habous | Morocco official timetable source. | Fixture-backed and central to Morocco position. |

## Blocked or Noisy Channels

| Channel | Status | Handling |
|---|---|---|
| Egyptian GAS web form | JS/VIEWSTATE rendered. | Keep stub fetcher; use browser/manual path in a separate PR. |
| Saudi Haramain/GPH direct fetch | Network unreachable from current session. | Do not claim fixture coverage until reachable source or manual transcription lands. |
| Pakistan Auqaf / Karachi original method | No clean public API or canonical method URL found. | Treat as literature recovery, not automated ingestion. |
| muslimsalat.com | High WMAE third-party aggregator. | Keep as noisy holdout only. |
| Single Mawaqit mosque anomalies | May be stale/local-buffered/corrupt. | Exclude or mark in `scripts/data/mawaqit-mosques.json`; do not tune globally. |

## Refresh Cadence

| Source family | Script | Cadence |
|---|---|---|
| Mawaqit daily snapshots | `scripts/fetch-mawaqit.js` | Daily or before mosque-practice investigations. |
| Mawaqit yearly corpora | `scripts/fetch-mawaqit-yearly.js` | On-demand per country/region audit. |
| Morocco Habous | `scripts/fetch-morocco-habous.js` and `scripts/validate-habous-morocco.js` | Before Morocco position/calibration changes. |
| KEMENAG | `scripts/fetch-kemenag.js`, `scripts/fetch-kemenag-official-yearly.js` | Before Indonesia calibration work. |
| MUIS | `scripts/fetch-muis.js` | Annual or per release when Singapore changes matter. |
| Diyanet | `scripts/fetch-diyanet.js` | Monthly/quarterly for source health; before any Turkiye fixture expansion claim. |
| JAKIM proxy | `scripts/fetch-waktusolat.js` | Before Malaysia calibration work. |
| Aladhan world/yearly | `scripts/fetch-aladhan*.js` | Calc-vs-calc coverage sweeps, not local-authority arbitration. |
| praytimes / muslimsalat | `scripts/fetch-praytimes.js`, `scripts/fetch-muslimsalat.js` | Occasional drift checks. |

## Contributor Rules

- Never modify existing `eval/data/` rows to make a calibration pass.
- New fixture files should preserve source identity and stay in holdout unless
  the maintainer deliberately promotes them to train.
- Do not describe holdout WMAE as a release gate.
- Do not call a source "official" because a wrapper says it mirrors one; verify
  the upstream institution or label it as a proxy.
- Do not promote a source lead to a position. Convert leads through the chain:
  source found -> fixture built -> source quality checked -> residual analyzed
  -> position/disagreement updated -> only then consider calibration.

## Related Docs

- [Position registry](positions.md)
- [Known disagreements](known-disagreements.md)
- [Calibration methodology](../CALIBRATION.md)
- [Generated progress](progress.md)
- [Scoreboard](../SCOREBOARD.md)
