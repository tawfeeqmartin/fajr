# Türkiye — prayer-time conventions

## Institutional reference body

- **Name:** Diyanet İşleri Başkanlığı (Presidency of Religious Affairs, the official Türkiye state Islamic authority)
- **URL:** https://www.diyanet.gov.tr/ ; published Imsakiyya at https://namazvakitleri.diyanet.gov.tr/ ; data feed via https://ezanvakti.emushaf.net/
- **Population served:** ~84M Muslims (~99% of Türkiye's ~85M total). Sunni-majority with Alevi minority (~15%, follow distinct devotional practice but use same publishing).
- **Madhab:** Sunni Hanafi (institutionally dispatched + demographically dominant). Diyanet preset uses Standard 1× shadow Asr in its calculation despite Hanafi madhab membership, an institutional-vs-calculation split discussed below.

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Turkey` (`CalculationMethod.Turkey()`) — corresponds to **Aladhan API method 13**
- **Fajr angle:** 18° (Diyanet preset)
- **Isha angle:** 17° (Diyanet preset)
- **Asr school:** Standard (1× shadow) — adhan.js's Turkey preset default
- **Method offsets (from adhan.js Turkey preset):** sunrise:-7 / dhuhr:5 / asr:4 / maghrib:7 / isha:0
- **Path A community calibration (v1.4.5, fajr-specific):** additional **-1 min** offset applied to both Maghrib and Isha after the preset offsets, closing the residual Diyanet-vs-calc bias seen on ezanvakti.emushaf.net data.
- **Classification:** 🟡→🟢 (Approaching established — preset is institutional; the v1.4.5 -1 min calibration is community-empirical against 30 train rows across Istanbul/Ankara/Izmir)

## Why this method

The 18°/17° angle pair is the **Diyanet institutional convention**, used in Diyanet's official Imsakiyya publication and the ezanvakti.emushaf.net data feed (Diyanet's open-data publishing channel for app developers). The Aladhan API's method 13 is named "Turkey" because Diyanet is the named originating institution.

The **adhan.js Turkey preset** comes with built-in per-prayer offsets (sunrise:-7 / dhuhr:5 / asr:4 / maghrib:7 / isha:0) that match Diyanet's internal calibration. fajr applies these AND a v1.4.5 -1 min adjustment on Maghrib + Isha based on the empirical residual against ezanvakti.emushaf.net for the 3 training cities. This is a Path A community calibration documented in `autoresearch/logs/`.

The **Asr school choice** is the v1.7.22 metadata split (per fajr#88):
- `location.asrConvention` returns `'hanafi'` because Türkiye is Hanafi-majority and Diyanet itself is Hanafi-affiliated administratively
- `location.asrConventionSource` returns `'country-default'`
- `applied.asrSchool` returns `'standard'` because the adhan.js Turkey preset uses 1× shadow Asr in its calculation (this is the Diyanet institutional preset's choice; not a fajr-side override)

Callers wanting Hanafi 2× shadow Asr calculation should pass `madhab: 'hanafi'` explicitly. The country-default `asrConvention` correctly surfaces "this is a Hanafi country" without silently mutating the calculation away from what the Diyanet preset publishes.

## Known points of ikhtilaf within the country

- **Asr convention metadata vs calculation:** Türkiye is Hanafi but Diyanet publishes Standard 1× Asr in its official Imsakiyya. This is a real institutional choice, not a fajr-side bug. Hanafi-observant individuals who want 2× shadow Asr calculation must override explicitly. fajr's metadata correctly surfaces the convention as Hanafi while the applied formula remains Standard — apps render `location.asrConvention` and `applied.asrSchool` separately.
- **Alevi practice:** Alevi communities (~15% of Turkish Muslims) have distinct devotional patterns but generally follow Diyanet's published Imsakiyya for the 5 daily prayers. No separate dispatch is needed.
- **Path A -1 min calibration:** is a Türkiye-specific empirical adjustment. Apps querying fajr for a Turkish coordinate get Diyanet+ -1 min by default. Callers can pass `method: 'Diyanet'` explicitly to bypass the -1 min and get the bare adhan.js Turkey preset — useful for Bosnia/Kosovo/Sarajevo where the Turkish institutional lineage matters but the Path A is Türkiye-specific.

## City-level overrides

None at city level for Türkiye proper. The Hatay and Iğdır provinces have geographic carve-outs in `detectCountry()` (they lie geographically on the Syrian/Iranian sides of the simple bbox) but route to Türkiye correctly via explicit point-in-polygon carve-outs.

Bosnia, Kosovo, and Sarajevo route to the bare Diyanet preset (no -1 min) via city-level overrides per their historical Diyanet lineage; see `knowledge/wiki/regions/bosnia.md`.

## Open questions

- The Path A -1 min calibration is currently single-sourced (3 cities × 10 days train fixture). Yearly Diyanet fixture promotion (post-fajr#111 ezanvakti city-ID verification) would lift Türkiye from B → A per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria) and verify the -1 min holds seasonally.
- The Hanafi-vs-Standard Asr ikhtilaf in the metadata split is documented but not yet surfaced via `notes[]` automatically. Could add a `TURKIYE_HANAFI_ASR_METADATA` info-tier validity warning in v1.8.x — analogous to the Saudi elevation note.

## Sources

- Diyanet İşleri Başkanlığı: https://www.diyanet.gov.tr/
- Diyanet Imsakiyya: https://namazvakitleri.diyanet.gov.tr/
- ezanvakti.emushaf.net (Diyanet open-data feed)
- Aladhan method 13 documentation: https://aladhan.com/calculation-methods
- Verified city-ID mapping: `scripts/data/diyanet-ezanvakti-cities.json` (fajr#111)
- v1.4.5 Path A autoresearch log
