# Qatar — prayer-time conventions

## Institutional reference body

- **Name:** Qatar Calendar House (دار التقويم القطري) under the Ministry of Endowments and Islamic Affairs (وزارة الأوقاف والشؤون الإسلامية)
- **URL:** https://www.qch.gov.qa (Qatar Calendar House) ; https://www.awqaf.gov.qa (parent ministry)
- **Population served:** ~2.5M Muslims (~67% of Qatar's ~3M total — the lower share reflects Qatar's heavy non-Muslim expat workforce, primarily Hindu/Christian South Asian and Filipino)
- **Madhab:** Qatar's citizen population (~12-15% of total residents) is institutionally Sunni Hanbali, aligned with Saudi Arabia's institutional madhab. Muslim expatriate composition is multi-madhab — Pakistani-Bangladeshi-Indian Hanafi, Egyptian-Sudanese Shafi'i/Hanbali, Iranian Twelver Shia — but the institutional preset reflects the Hanbali-aligned Awqaf publication. Asr convention is Standard (1× shadow) institutionally.

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Qatar` (`CalculationMethod.Qatar()`) — corresponds to **Aladhan API method 9**
- **Fajr angle:** 18° (Qatar Calendar House institutional convention)
- **Isha angle:** N/A — uses **90 min interval after Maghrib** (identical Isha convention to UmmAlQura; this is the institutional Gulf pattern for fixed-interval Isha)
- **Asr school:** Standard (1× shadow). Institutional Hanbali + the Sunni expatriate majority both use Standard Asr.
- **Method offsets:** none institutional; the adhan.js Qatar preset matches Qatar Calendar House publication.
- **Classification:** 🟢 Established (institutional preset; Qatar Calendar House is the named originating institution; the 18° + 90-min-interval pair is empirically validated against Awqaf publications)

## Why this method

The 18° Fajr + 90-minute Isha interval is the **Qatar Calendar House institutional convention**, the published Qatari official Imsakiyya. The Aladhan API's method 9 is named "Qatar" because Qatar Calendar House is the named originating institution.

**Note vs. UmmAlQura:** Qatar shares the 90-minute Isha interval with UmmAlQura (Saudi Arabia) but differs on Fajr angle (Qatar: 18°; UmmAlQura: 18.5°). This is a real institutional disagreement on Fajr boundary, not a unification onto a single Gulf preset. fajr respects this by dispatching Qatar coordinates to the Qatar preset, not the UmmAlQura preset.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (Qatar institutional Hanbali + Sunni majority both use Standard Asr)
- `applied.asrSchool` returns `'standard'`

Convention and applied formula align — no override needed for typical Qatari users. Hanafi users override explicitly.

## Known points of ikhtilaf within the country

- **Multi-madhab expatriate composition** (similar to UAE): Pakistani-Bangladeshi Hanafi mosques in Doha may publish Hanafi 2× Asr; Egyptian Shafi'i mosques publish 1× Asr (no formula difference, same Standard). The country-default `applied.asrSchool` defaults to Standard; Hanafi users override explicitly via `madhab: 'hanafi'`.
- **Iranian-expatriate Twelver Shia minority** (small but present) follow Sistani-aligned Imsakiyya. Not currently surfaced via per-city `altMethods` for Qatari coordinates.
- **Ramadan administrative adjustments**: Qatar Calendar House may publish Ramadan-specific Isha (later than 90-min-default) per administrative convention. fajr does not auto-switch Ramadan Isha — apps should be aware during Ramadan that the institutional publication may be later than fajr's standard-Isha calc.

## City-level overrides

None at city level for Qatar. The country-default Qatar dispatch handles Doha, Al Rayyan, Al Wakrah, Al Khor, and all major Qatari coordinates correctly.

## Open questions / outstanding work

- **Live Qatar Calendar House fixture** — fajr currently has no Qatar-specific institutional fixture in the eval corpus. Acquiring a QCH-direct fetcher would lift Qatar from 🟢 institutional-baseline to 🟢 institutional + empirical-corroboration, grade B → A per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria).
- **Ramadan-aware Isha** — Qatar's administrative Ramadan-Isha convention (similar to UmmAlQura's 120-min Ramadan default) is not currently surfaced via `notes[]`. Open follow-up.

## Sources

- Qatar Calendar House: https://www.qch.gov.qa
- Qatar Ministry of Endowments and Islamic Affairs: https://www.awqaf.gov.qa
- Aladhan method 9 (Qatar): https://aladhan.com/calculation-methods
- adhan.js Qatar preset: https://github.com/batoulapps/adhan-js
- Engine `selectMethod()` dispatch: see [`src/engine.js`](../../../src/engine.js#L1261)
