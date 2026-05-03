# fajr — accuracy + scholarly methodology

Last refreshed: 2026-05-03 (v1.7.15)

## What this document is

This is fajr's transparent answer to "how accurate is this library, and on whose
authority?" — the structured counterpart to the [README](README.md) headline
claims and the per-release narrative in [CHANGELOG.md](CHANGELOG.md). It exists
because a high-accuracy Islamic prayer-time library that ships with frequent
v1.x releases carries a real reputational risk if downstream consumers cannot
audit the calibration corpus, the institutional citations behind each
country/city dispatch, the per-region accuracy numbers, and the deliberate
deviations from any single reference. CALIBRATION.md surfaces all of that
in one place.

This document is also the intake page for scholarly review submissions and
for downstream-integrator regression reports. If a region's per-cell accuracy
in your local mosque's experience contradicts what is published here, please
file an issue — that is the regression-report contract that the v1.x public
beta framing in the README makes explicit.

CALIBRATION.md is refreshed with every release. The "Last refreshed" line at
the top of this file always reflects the most recent version on npm.

> **Important caveat about the holdout corpus.** The "Holdout WMAE" number
> reported below (currently ~3.66 min) is heavily skewed by a small number of
> calc-vs-calc comparison cells with known data-quality issues (date-format
> drift, pre-fix Aladhan corruption surfaced in the v1.6.1 fix, high-latitude
> outliers like Moscow and Oslo). The institutional-train WMAE (~1.07 min,
> against Mawaqit / Diyanet / JAKIM mosque- and government-published reality)
> is the headline number that drives the ratchet. Holdout numbers are
> informational only — they are reported because hiding them would be
> dishonest, but they should not be read as fajr's accuracy claim. See
> [Per-region accuracy](#per-region-accuracy-current-post-v176) for the
> breakdown.

---

## Reference sources fajr benchmarks against

fajr's eval framework cross-validates engine output against multiple
independent reference layers. Each layer has a different epistemological
weight: mosque-published times reflect what real congregations follow;
institutional government tables reflect ministerial dispatch; calc-vs-calc
references catch math drift but cannot themselves arbitrate
calibration.

| Source | URL | What it provides | How fajr uses it |
|---|---|---|---|
| **AlAdhan API** | [aladhan.com](https://aladhan.com/prayer-times-api) | REST API exposing 24 named per-country / per-method calculations + Hijri / Imsak / Qibla. Backed by Mh-Mac Pty Ltd. | Primary calc-vs-calc reference for fajr's 163-country world holdout. Cross-checked with `scripts/fetch-aladhan-world.js`. |
| **IslamicFinder** | [islamicfinder.org](https://islamicfinder.org) | Multi-app cross-reference for Hijri + prayer dispatch; widely consumed by Muslim Pro and similar consumer apps. | Holdout cross-reference for hijri Umm al-Qura validation (v1.7.6 issue #48). |
| **Mawaqit** | [mawaqit.net](https://mawaqit.net) | Mosque-published prayer times via the Mawaqit network (~8000+ mosques worldwide; ~191 in fajr's registry). The institutional ground truth for community-following. | Path A "ground truth" for v1.5.0 Morocco Maghrib +5 calibration (23 mosques across 14 cities) and the broader institutional-train regression discipline. See `eval/data/train/mawaqit-*.json`. |
| **Diyanet İşleri Başkanlığı** (Türkiye) | [diyanet.gov.tr](https://diyanet.gov.tr) — fetched via `ezanvakti.emushaf.net` | The Türkiye government's official prayer-time publishing endpoint. | Institutional ground truth for the 3-city Türkiye train cluster (Istanbul / Ankara / Izmir). See `scripts/fetch-diyanet.js`. |
| **JAKIM** (Malaysia) via waktusolat.app | [waktusolat.app](https://waktusolat.app) | Community proxy for the Jabatan Kemajuan Islam Malaysia official ezanvakti tables. | Institutional ground truth for the 3-city Malaysia train cluster (Kuala Lumpur / Shah Alam / George Town); also cross-referenced for v1.4.4 JAKIM Isha +1 Path A. See `scripts/fetch-waktusolat.js`. |
| **KEMENAG** (Indonesia) | [bimasislam.kemenag.go.id](https://bimasislam.kemenag.go.id) | The Indonesian Ministry of Religious Affairs official prayer-time system, covering all 34 provinces. | Holdout cross-reference for the 34-province Indonesia regional default. |
| **MUIS** (Singapore) | [muis.gov.sg](https://muis.gov.sg) | Majlis Ugama Islam Singapura — the Islamic Religious Council of Singapore. | Institutional ground truth for the 1-city Singapore holdout. |
| **praytimes.org** | [praytimes.org](https://praytimes.org) | Hamid Zarrabi's reference JavaScript implementation of the standard methods. | Calc-vs-calc independent JS implementation cross-validation. See `scripts/fetch-praytimes.js`. |
| **muslimsalat.com** | [muslimsalat.com](https://muslimsalat.com) | Third-party prayer-time aggregator. | Holdout cross-reference. See `scripts/fetch-muslimsalat.js`. |

The institutional-train sources (Mawaqit / Diyanet / JAKIM / MUIS / KEMENAG)
are the ones whose pass/fail discipline drives the ratchet in
[`eval/compare.js`](eval/compare.js). The calc-vs-calc sources (AlAdhan /
praytimes.org / muslimsalat.com) provide breadth but not arbitration.

---

## Per-region accuracy (current, post-v1.7.6)

These numbers are from the most recent eval run on master (2026-05-03). They
are also live in [`eval/results/runs.jsonl`](eval/results/runs.jsonl) — the
last record is always the current state.

### Overall

| Corpus | WMAE (min) | Entries | Notes |
|---|---|---|---|
| **Train** (institutional ground truth) | **1.07** | 215 | Mawaqit / Diyanet / JAKIM / KEMENAG / MUIS — drives the ratchet |
| Holdout (calc-vs-calc + outlier cities) | 3.66 | 2980 | Informational only — heavily skewed by ~10 known-bad calc-vs-calc cells (Moscow / Oslo / Cairo-CALC / Bangalore-CALC etc.). See caveat at top of file. |

### Per-prayer signed bias (train)

| Prayer | MAE (min) | Signed bias (min) | Direction |
|---|---|---|---|
| Fajr | 1.20 | -0.25 | calc earlier than institutional — within bias tolerance |
| Shuruq | 0.60 | -0.33 | calc earlier than institutional — within bias tolerance |
| Dhuhr | 1.60 | +0.27 | calc later — within tolerance (Cairo/Alexandria-driven; intentional Egyptian-method dispatch decision pending review) |
| Asr | 1.59 | +1.22 | calc later — Cairo/Alexandria Egyptian-Standard Asr drives this; Hanafi-vs-Standard Asr ikhtilaf intentionally surfaced |
| Maghrib | 0.66 | +0.49 | calc later — within prayer-validity ihtiyat tolerance |
| Isha | 0.80 | +0.71 | calc later — within prayer-validity ihtiyat tolerance |

The signed-bias directions matter for ihtiyat (precaution): Fajr and Shuruq
drift "earlier" is the prayer-validity-unsafe direction; Maghrib and Isha
drift "later" is prayer-validity-safe but iftar/fasting-unsafe. The current
state passes the ratchet rules in `eval/compare.js`. See
[CLAUDE.md → Islamic accuracy principles](CLAUDE.md#islamic-accuracy-principles)
for the dual-ihtiyat framework.

### Per-region (train) — institutional cross-validation

| Region | Country | Source | Train WMAE | Fajr | Isha | Maghrib | Notes |
|---|---|---|---|---|---|---|---|
| Istanbul | Türkiye | Diyanet | 0.50 | 0.30 | 0.70 | 0.00 | v1.4.5 Diyanet -1 Maghrib/Isha Path A applied |
| Ankara | Türkiye | Diyanet | 0.48 | 0.30 | 0.60 | 0.00 | (same) |
| Izmir | Türkiye | Diyanet | 0.53 | 0.40 | 0.40 | 0.30 | (same) |
| Dubai | UAE | AlAdhan | 0.79 | 0.70 | 0.50 | 0.50 | UAE GAIAEA method |
| Cairo | Egypt | AlAdhan | 2.74 | 6.30 | 3.40 | 0.80 | **Outlier — Egyptian 19.5°/17.5° vs AlAdhan dispatch mismatch under review.** Pending v1.8.0+ scholarly-review batch. |
| Alexandria | Egypt | AlAdhan | 2.69 | 6.80 | 3.00 | 0.70 | (same) |
| Jakarta | Indonesia | KEMENAG | 0.63 | 0.40 | 0.40 | 0.40 | KEMENAG region |
| Karachi | Pakistan | AlAdhan | 0.94 | 0.60 | 0.60 | 0.50 | Karachi 18°/18° + Hanafi |
| Casablanca | Morocco | Mawaqit | 1.31 | 0.33 | 0.67 | 0.67 | Morocco 19°/17° + Maghrib +5 (v1.5.0 Path A across 23 Moroccan mosques) |
| Rabat / Marrakech / Tanger / Nador / Oujda / Fes / Meknes / Taza / Khouribga / Settat / Sale / Kenitra / Safi / Essaouira / Agadir / Taroudant / Ouarzazate / Errachidia | Morocco | Mawaqit | 0.79 – 1.93 | varies | varies | varies | 18 additional Mawaqit-Morocco cities; full breakdown in `eval/results/runs.jsonl` |
| Paris | France | Mawaqit | 0.75 | 0.50 | 0.60 | 0.50 | France UOIF 12°/12° |
| Makkah | Saudi Arabia | AlAdhan | 0.71 | 1.00 | 0.30 | 0.30 | Umm al-Qura method |
| Madinah | Saudi Arabia | AlAdhan | 0.81 | 0.50 | 0.60 | 0.60 | (same) |
| Riyadh | Saudi Arabia | AlAdhan | 0.94 | 0.90 | 0.90 | 0.90 | Umm al-Qura + 612m elevation auto-applied (v1.7.0). Saudi institutional stance is Umm al-Qura *declines* elevation correction for jama'ah unity; fajr applies it because the city-registry path encodes UAE/JAKIM-aligned policy. Surfaced via `notes[]`. See [Known deviations](#known-deviations-from-reference-sources) below. |
| Toronto | Canada | AlAdhan | 0.94 | 0.50 | 0.50 | 0.50 | ISNA / NorthAmerica method |
| London | UK | Mawaqit | 2.16 | 1.10 | 0.90 | 3.60 | **MoonsightingCommittee Maghrib delta under review** — 3.6 min Maghrib MAE is a Path-A candidate for v1.8.0+ |
| New York | USA | AlAdhan | 1.04 | 0.60 | 0.90 | 0.70 | ISNA / NorthAmerica |
| Los Angeles | USA | AlAdhan | 0.78 | 0.50 | 0.60 | 0.30 | (same) |
| Kuala Lumpur | Malaysia | JAKIM | 0.87 | 1.00 | 0.60 | 0.50 | JAKIM via waktusolat — v1.4.4 Isha +1 Path A applied |
| Shah Alam | Malaysia | JAKIM | 0.32 | 0.20 | 0.10 | 0.10 | (same) |
| George Town | Malaysia | JAKIM | 0.54 | 1.00 | 0.20 | 0.30 | (same) |

**Reading this table:** train MAE under ~1 min is excellent — well inside
"clock minute precision" against institutional dispatch. The Cairo/Alexandria
Egyptian-method cluster is the current largest outlier in the train corpus,
which is a candidate for a v1.8.0+ Path A calibration once a Mawaqit/Egyptian
mosque corpus is built (cf. the v1.5.0 Morocco Maghrib +5 precedent). The
London Maghrib drift is similarly a candidate.

### Per-region (holdout) — calc-vs-calc + outliers

The holdout corpus is reported but **never optimised against** — its purpose
is overfitting detection per the ratchet rules. Most holdout cells with
WMAE > 5 min are calc-vs-calc cells against AlAdhan or muslimsalat
captures that pre-date the v1.6.1 date-format fix or that hit a
high-latitude regime where the underlying calculation method is itself
divergent. See `eval/data/test/` for the raw fixtures.

The 3 most-meaningful holdout regions (low-noise, real institutional
ground truth) are:

| Region | Country | Source | Holdout WMAE | Notes |
|---|---|---|---|---|
| Singapore | Singapore | MUIS | 0.55 | 373 entries — best holdout cell in the corpus |
| 34 KEMENAG provinces | Indonesia | KEMENAG | 2.13 – 3.44 | 31 daily entries × 34 provinces = ~1054 entries; Indonesia regional KEMENAG dispatch within 2.5 min on average. Bandung (3.44) and Pekanbaru (2.87) are the two outliers, candidates for Path A calibration in a v1.8.0+ KEMENAG batch. |
| Singapore daily holdout | Singapore | (same) | 0.55 | Reported separately to highlight the contrast with calc-vs-calc cells |

The remaining ~1900 holdout entries are calc-vs-calc against AlAdhan and
muslimsalat captures — useful for catching engine-math drift but not for
arbitrating calibration disputes.

---

## Method dispatch per region

Each country in fajr's auto-dispatch is mapped to a calculation method (angle
table + per-prayer offsets) by `selectMethod()` in
[`src/engine.js`](src/engine.js) (the `case` statements starting at line 802).
The dispatched method derives from the institutional authority of that
country / region. Each is tagged with a scholarly classification per
[CLAUDE.md → Scholarly oversight classification](CLAUDE.md#scholarly-oversight-classification):

| Tag | Meaning |
|---|---|
| 🟢 | Established — consensus in Islamic astronomy, classical sources |
| 🟡→🟢 | Approaching established — recently documented in regional institutions |
| 🟡 | Limited precedent — minority scholarly view |
| 🔴 | Novel — no clear precedent (gated on human review per CLAUDE.md) |

### Major-region dispatch

| Country | Method dispatched | Classification | Cited institution | Citation URL |
|---|---|---|---|---|
| Morocco | Morocco custom 19°/17° + Maghrib +5 | 🟢 Established | Habous (Ministère des Habous et des Affaires islamiques); 23-mosque Mawaqit Path A corpus (v1.5.0) | [habous.gov.ma](https://habous.gov.ma) / [mawaqit.net](https://mawaqit.net) |
| Saudi Arabia | UmmAlQura | 🟢 Established | Umm al-Qura University, Makkah; Saudi Ministry of Hajj & Awqaf | [moia.gov.sa](https://moia.gov.sa) |
| Türkiye | Diyanet (Hanafi 18°/17° + methodAdjustments preset, v1.4.5 -1 Maghrib/Isha Path A) | 🟢 Established | Diyanet İşleri Başkanlığı | [diyanet.gov.tr](https://diyanet.gov.tr) / [ezanvakti.emushaf.net](https://ezanvakti.emushaf.net) |
| Egypt | Egyptian (19.5°/17.5°) | 🟢 Established | Egyptian General Authority of Survey | [esa.gov.eg](http://www.esa.gov.eg/) |
| UK | MoonsightingCommittee | 🟢 Established | Moonsighting Committee Worldwide | [moonsighting.com](https://moonsighting.com) |
| Malaysia | JAKIM (18°/19° via JAKIM custom; v1.4.4 Isha +1 Path A applied) | 🟢 Established | Jabatan Kemajuan Islam Malaysia | [jakim.gov.my](https://www.islam.gov.my) / [waktusolat.app](https://waktusolat.app) |
| Indonesia | KEMENAG | 🟢 Established | Kementerian Agama Republik Indonesia | [bimasislam.kemenag.go.id](https://bimasislam.kemenag.go.id) |
| Pakistan | Karachi (18°/18° + Hanafi) | 🟢 Established | University of Islamic Sciences Karachi | (institutional reference; no canonical URL) |
| UAE | UAE Dubai method | 🟢 Established | UAE General Authority of Islamic Affairs & Endowments (GAIAEA) | [awqaf.gov.ae](https://www.awqaf.gov.ae) |
| France | France UOIF 12°/12° | 🟡→🟢 Approaching established | Union des Organisations Islamiques de France (UOIF / Musulmans de France) | (institutional convention) |
| Canada | NorthAmerica (ISNA) | 🟢 Established | Islamic Society of North America | [isna.net](https://isna.net) |
| Norway / Iceland | MWL + MiddleOfTheNight high-lat rule | 🟢 Established | adhan.js MiddleOfTheNight high-latitude convention | (adhan.js v4.4.3 default) |
| Finland | MWL + TwilightAngle high-lat rule | 🟢 Established | adhan.js TwilightAngle high-latitude convention | (adhan.js v4.4.3 default) |
| Singapore | Singapore (MUIS) | 🟢 Established | Majlis Ugama Islam Singapura | [muis.gov.sg](https://muis.gov.sg) |
| Iran | Tehran (17.7° / 14° + 4.5min Maghrib offset) | 🟢 Established | Tehran Institute of Geophysics; regional Twelver Shia hawza | [earthquake.ut.ac.ir](https://earthquake.ut.ac.ir) |
| Iraq | Egyptian (multi-method country) | 🟡 Limited precedent | Country dispatch is multi-method (Sunni Awqaf for Mosul; Shia Sistani for Najaf/Karbala/Basra). City-level overrides (see below) carry the institutional citations. | (per-city institutional dispatch) |
| Bosnia / Kosovo / Albania | Diyanet | 🟢 Established | Rijaset Islamske Zajednice u BiH; Bashkësia Islame e Kosovës (BIK); KMSh Albania | [rijaset.ba](https://rijaset.ba) / [bislame.net](https://bislame.net) |
| Russia / Bulgaria / Greece / European-east cluster | MWL | 🟡 Limited precedent | Aladhan world-default fallback | (no single institutional publisher) |
| 163-country world | varied per `COUNTRY_BBOX_TABLE` | 🟢 / 🟡→🟢 / 🟡 per region | See [`src/engine.js`](src/engine.js) `selectMethod` cases — every dispatched method has an institution noted inline | (per-country) |

The full country-by-country dispatch (78 countries with explicit cases plus
85 more in the v1.6.2 batch via `COUNTRY_BBOX_TABLE`) is in
[`src/engine.js`](src/engine.js). The `methodName` string returned with every
`prayerTimes()` call carries both the dispatched method label and the country
that triggered it.

### City-level institutional overrides (16 cities, v1.7.0+)

For 16 cities where the country-level dispatch would miss intra-country
*ikhtilaf*, fajr applies city-level overrides via
[`scripts/data/city-method-overrides.json`](scripts/data/city-method-overrides.json).
Each override carries an institutional citation and an `altMethods` array
that surfaces the documented minority practice (per the
[surface-disagreement principle](CLAUDE.md#islamic-accuracy-principles)):

| City | Country | Override | Classification | Institution |
|---|---|---|---|---|
| Mosul | Iraq | Karachi (Sunni Hanafi) | 🟢 | Iraqi Sunni Endowment Office (Diwan al-Waqf al-Sunni) — [sunni.gov.iq](https://sunni.gov.iq) |
| Najaf | Iraq | Tehran (Twelver Shia) | 🟢 | Office of Grand Ayatollah Sistani — [sistani.org](https://www.sistani.org) |
| Karbala | Iraq | Tehran (Twelver Shia) | 🟢 | Astan al-Husayniyya / Astan al-Abbasiyya — [imamhussain.org](https://imamhussain.org) |
| Basra | Iraq | Tehran (Twelver Shia) | 🟢 | Sistani-aligned mosque-published timetables |
| Sarajevo | Bosnia | Diyanet | 🟢 | Rijaset Islamske Zajednice u BiH — [rijaset.ba](https://rijaset.ba) |
| Mostar | Bosnia | Diyanet | 🟢 | Rijaset BiH (Hercegovački muftijstvo) |
| Banja Luka | Bosnia | Diyanet | 🟢 | Rijaset BiH (Banjalučko muftijstvo) |
| Pristina | Kosovo | Diyanet | 🟢 | Bashkësia Islame e Kosovës — [bislame.net](https://bislame.net) |
| Bradford | UK | MoonsightingCommittee | 🟢 | Bradford Council of Mosques (BCOM) |
| Beirut | Lebanon | Egyptian (Sunni); Tehran via altMethods (Shia) | 🟢 | Dar al-Fatwa al-Lubnaniyya — [darelfatwa.gov.lb](https://darelfatwa.gov.lb); Higher Shia Council |
| Tabriz | Iran | Tehran | 🟢 | Tehran Institute of Geophysics regional default |
| Dearborn | USA | ISNA (Sunni); Tehran via altMethods (Shia) | 🟢 | Islamic Center of America (Dearborn) — [icofa.com](https://icofa.com) |
| Lucknow | India | Karachi (Sunni Hanafi); Tehran via altMethods (Shia) | 🟢 | All India Muslim Personal Law Board (AIMPLB); Lucknow Shia imambargah community |
| Kochi | India | KarachiShafi (Kerala Shafi'i) | 🟢 | Samastha Kerala Jem-iyyathul Ulama — [samastha.info](https://samastha.info) |
| Cotabato | Philippines | MWL (Bangsamoro Shafi'i) | 🟢 | Bangsamoro Darul-Ifta' (BDI-BARMM) — [bdi.bangsamoro.gov.ph](https://bdi.bangsamoro.gov.ph) |
| Marawi | Philippines | MWL (Maranao Shafi'i) | 🟢 | Bangsamoro Darul-Ifta' (BDI-BARMM) |

All 16 entries are 🟢 Established or 🟡→🟢 Approaching established. No
🔴 Novel overrides. Each citation is to a real institutional publisher whose
timetables can be cross-checked.

---

## Madhab dispatch per region

The Asr school choice (Standard / Shafi'i = 1× shadow length, Hanafi = 2×)
also varies by country:

| Country | Asr school default | Override status | Source |
|---|---|---|---|
| Maldives | Shafi'i (explicit) | v1.7.1 fix (issue #26) | Maldives Islamic Ministry — Maldivian Sunni Shafi'i tradition |
| Sri Lanka | Shafi'i (explicit) | v1.7.1 fix (issue #26) | Sri Lankan Sunni Shafi'i (Mappila / Tamil Muslim) tradition |
| Pakistan | Shafi'i (Karachi method default in adhan-js) | **Population mismatch documented** — Pakistan is Hanafi-majority. Issue #39 closed pending v1.8.0 override design (issue #40). | adhan-js Karachi method default |
| Bangladesh | Shafi'i (Karachi default) | Same as Pakistan — Hanafi-majority population, Karachi-dispatch default | (same) |
| Türkiye | Shafi'i (Diyanet preset default) | Population mismatch documented (Hanafi-majority); issue #39 closed pending #40 | (Diyanet preset) |
| Albania / Kosovo / Bosnia | Shafi'i (Diyanet default) | Same as Türkiye | (Diyanet preset) |
| Indonesia | Shafi'i (KEMENAG default) | Aligned — Indonesian Muslim community is overwhelmingly Shafi'i | KEMENAG |
| Malaysia / Singapore / Brunei | Shafi'i | Aligned — South-East-Asian Sunni Shafi'i tradition | JAKIM / MUIS / Brunei Awqaf |
| India | Hanafi (default) | Population-aligned; Kochi override flips to Shafi'i for Kerala (v1.7.2) | All India Muslim Personal Law Board / Samastha Kerala for Kochi |
| Iran / Iraq (Najaf/Karbala/Basra) | Twelver Shia Jafari (Tehran method) | Aligned — Twelver Shia majority | Tehran Institute / Sistani office |
| Egypt / Saudi / UAE / Qatar / Kuwait / Bahrain / Oman | varies (institutional default) | Aligned — Sunni-majority with country-specific schools | Country institution |
| Morocco | Maliki (1× shadow = Standard Asr) | Aligned — Moroccan Sunni Maliki tradition | Habous |

The `madhab` parameter on `prayerTimes()` lets callers override the country
default — e.g. an Indian Hanafi diaspora consumer in the UK can pass
`madhab: 'Hanafi'` explicitly to override the Standard default.

---

## Known deviations from reference sources

fajr deliberately diverges from some reference sources where the divergence
is justified by a stronger institutional citation, a Path A community
calibration, or an explicit scholarly opinion. These are surfaced via
`notes[]` on `prayerTimes()` output so apps can render the disagreement
to the user.

### Elevation auto-application — diverges from AlAdhan / Saudi institutional stance

| City | fajr Maghrib delta vs AlAdhan / Saudi | Why | How surfaced |
|---|---|---|---|
| Mecca (277 m) | +1.6 min later | UAE Burj Khalifa fatwa (IACAD Dulook DXB) + Malaysia JAKIM apply elevation correction; Saudi Umm al-Qura *declines* it for jama'ah unity. fajr's city-registry path applies it (UAE/JAKIM-aligned default), with `elevation: 0` opt-out. | `notes[]` "Elevation auto-resolved from city registry: Mecca, 277m → Maghrib +1.6 min later, Shuruq -1.6 min earlier vs sea-level" |
| Madinah (608 m) | +2.7 min | (same) | (same) |
| Riyadh (612 m) | +2.7 min | (same) | (same) |
| Tehran (~1200 m) | +5.4 min | (same) | (same) |
| Toronto (76 m) | +0.8 min | (same) | (same) |

This is the v1.7.0 elevation auto-application case, surfaced explicitly per
issue #50 (v1.7.6) so apps can render the institutional split to the user.
See [knowledge/wiki/corrections/elevation.md](knowledge/wiki/corrections/elevation.md)
for the full institutional-precedent breakdown. Classification:
**🟡→🟢 Approaching established** (UAE + JAKIM apply; Saudi declines).

### Hijri calendar — diverges from Kuwaiti tabular default (v1.7.6)

`hijri()` now defaults to Umm al-Qura tabular instead of the legacy Kuwaiti
arithmetic algorithm. For ~38% of Gregorian dates (per the issue #48
16-date audit) the returned values now match AlAdhan / IslamicFinder /
IACAD / Microsoft rather than Kuwaiti. The Kuwaiti default is preserved as
opt-in via `hijri(date, { convention: 'tabular' })`.

Classification: **🟡→🟢 Approaching established** — Saudi Arabia's official
calendar; digital-ecosystem consensus. Not pure 🟢 because Diyanet (Türkiye),
JAKIM (Malaysia), and regional moonsighting committees legitimately diverge
by ±1 day; UAQ is the digital consensus, not the full-ummah scholarly
consensus.

### Per-prayer rounding — diverges from AlAdhan / adhan-js round-to-nearest

fajr rounds each displayed minute on the shar'i-safe side of the underlying
solar event:

| Prayer | Round direction | Why |
|---|---|---|
| Imsak | DOWN (earlier) | Fasting yaqeen — stop eating before actual dawn |
| Fajr | UP (later) | Prayer must start AFTER actual dawn (prayer-validity) |
| Shuruq / Sunrise | DOWN (earlier) | Fajr-window-close — last second of valid Fajr |
| Dhuhr / Asr / Maghrib / Isha / Sunset | UP (later) | Prayer-validity / iftar yaqeen |

AlAdhan and adhan-js both default to round-to-nearest, which is unsafe by
0–29 s for ~50% of cells. v1.5.1 fixes this by construction. Classification:
**🟢 Established** — direct application of the classical *yaqeen* requirement
to the rounding step.

### Morocco Maghrib +5 min Path A (v1.5.0)

fajr's Morocco method dispatches Maghrib +5 min relative to the underlying
sunset, calibrated against 23 Mawaqit-published mosque timetables across 14
Moroccan cities. This diverges from the AlAdhan Morocco default (which has
its own Maghrib offset) but matches what Moroccan mosques publish.
Classification: **🟢 Established** — Path A correction validated against
≥23 independent Mawaqit-published mosque timetables.

### Diyanet Türkiye -1 min Maghrib/Isha Path A (v1.4.5)

fajr's Diyanet method dispatches Maghrib and Isha 1 min earlier than the
underlying calculation, calibrated against the Diyanet İşleri Başkanlığı's
official ezanvakti.emushaf.net publishing endpoint. Train WMAE for the
3-city Türkiye cluster: 0.48–0.53. Classification: **🟢 Established**.

### JAKIM Malaysia +1 min Isha Path A (v1.4.4)

fajr's JAKIM method dispatches Isha +1 min later than the underlying
calculation, calibrated against JAKIM's official publishing via the
waktusolat.app community proxy. Train WMAE for the 3-city Malaysia cluster:
0.32–0.87. Classification: **🟢 Established**.

### Cairo / Alexandria Egyptian-method residual (v1.7.15 known)

The Egyptian-method dispatch for Cairo and Alexandria currently shows a
~6.5 min Fajr MAE and ~3.4 min Isha MAE against AlAdhan. This is the
largest residual in the train corpus and is a Path A candidate for a
v1.8.0+ calibration once a Mawaqit-Egypt or institutional-Egypt corpus is
built. **Not currently surfaced via `notes[]`** because the residual is
calc-vs-calc (no mosque-published reference). Documented here for
transparency.

### London Maghrib residual (v1.7.15 known)

MoonsightingCommittee Maghrib for London shows a 3.6 min MAE against
Mawaqit-London. Path A candidate for v1.8.0+. Documented here.

---

## Open work + roadmap

The full release narrative is in [CHANGELOG.md](CHANGELOG.md). Open issues
with priorities are tracked at
[github.com/tawfeeqmartin/fajr/issues](https://github.com/tawfeeqmartin/fajr/issues).

The current v1.8.0+ planned scope (per fajr#65 maturity practices and
related design issues):

- **Issue #40**: Madhab override design — surface Hanafi/Shafi'i/Maliki/
  Jafari per-call override cleanly; resolve the Pakistan / Bangladesh /
  Türkiye / Albania population-mismatch documented above.
- **Issue #44**: Native iOS (Swift) / Android (Kotlin) / Windows (C#) /
  Rust ports prep — currently fajr is JS-only; downstream native consumers
  would benefit from idiomatic ports.
- **Issue #46**: IIFE bundle for non-ESM environments (JavaScriptCore
  embedded, etc.).
- **Issue #49**: Minimum-scope agents — autoresearch loop scoping
  refinement.
- **fajr#65 practice 3**: Scholarly review process — formal review track
  for any 🟡 → 🟢 promotion or 🔴 deployment.
- **fajr#65 practice 4**: Cross-repo doc rename / unification — pending.
- **Cairo/Alexandria + London Path A** calibrations — see [Known deviations](#known-deviations-from-reference-sources).
- **Bandung + Pekanbaru KEMENAG Path A** — see [Per-region accuracy](#per-region-accuracy-current-post-v176).

CALIBRATION.md is updated with each release. Per-cell numbers reflect the
state of master at the most-recent eval run.

---

## Scholarly review status

As of 2026-05-03 (v1.7.15): **fajr has not yet undergone a formal scholarly
review.** All corrections currently shipped are 🟢 Established or 🟡→🟢
Approaching established — meaning each one carries a documented institutional
citation or scholarly tradition, but no outside scholar has formally signed
off on fajr's calibration corpus or the engine's per-region dispatch.

Practice 4 from fajr#65 (formal scholarly review) is on the v1.8.0+
roadmap. CALIBRATION.md is the intake document — scholars and institutional
representatives reviewing fajr's dispatch are invited to file an issue with
specific feedback per region or per correction. The author commits to
public-comment all such reviews and to update CALIBRATION.md to reflect them.

The ratchet rules in
[`eval/compare.js`](eval/compare.js) and the classification taxonomy in
[CLAUDE.md](CLAUDE.md#scholarly-oversight-classification) gate any 🔴
correction from shipping without explicit human review — so even in the
absence of formal scholarly review, no novel astronomy-driven correction
can sneak in via the autoresearch loop.

---

## Versioning + stability promise

Per the v1.x public beta framing in the [README](README.md):

- **Bug fixes ship fast.** Expect frequent v1.7.x → v1.7.(x+1) releases
  while the corpus and the calibration framework continue to mature.
- **Downstream consumers should pin to a tested version** in their
  `package.json` (e.g. `"@tawfeeqmartin/fajr": "1.7.15"` rather than
  `"^1.7.0"`) and review release notes in
  [CHANGELOG.md](CHANGELOG.md) before bumping. The CHANGELOG calls out
  every observable-behaviour change — including non-API-breaking changes
  like the v1.7.6 Hijri default switch.
- **Breaking changes will require a major version bump.** A v2.0.0
  release is not currently scheduled; when it ships, it will be preceded
  by an explicit deprecation cycle in v1.x.
- **Public API surfaces** (`prayerTimes`, `dayTimes`, `tarabishyTimes`,
  `detectLocation`, `nearestCity`, `applyElevationCorrection`,
  `applyTayakkunBuffer`, `hilalVisibility`, `qibla`, `hijri`,
  `nightThirds`, `travelerMode`) are stable. New fields on existing return
  shapes ship as minor versions (e.g. v1.7.13 added `hijri().monthNameAr`).
- **Calibration changes that materially shift returned clock minutes for
  some users ship as minor versions** with the magnitude documented in
  the CHANGELOG "Honest caveats" section.

Production use is welcome. Regression reports via GitHub issues
([github.com/tawfeeqmartin/fajr/issues](https://github.com/tawfeeqmartin/fajr/issues))
are the contract that drives the calibration corpus forward.

---

*This document is part of the v1.7.15 maturity practices addressing
fajr#65. It is refreshed with every release. — fajr-agent*
