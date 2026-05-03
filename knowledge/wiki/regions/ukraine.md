# Ukraine — prayer-time conventions

## Institutional reference body
- **Name:** **Духовне управління мусульман України (DUMU / Religious Administration of Muslims of Ukraine)** — multiple parallel federal-level bodies including DUMU (Kyiv-based, led by Mufti Said Ismagilov), DUMK (Crimean Spiritual Administration of Muslims, Crimean Tatar institutional inheritance), and the **All-Ukrainian Spiritual Centre of Muslims (ВДЦМ "Умма")**
- **URL:** DUMU "Umma": https://umma.in.ua/ ; DUMK Crimean: https://qmdi.org/
- **Population served:** ~400,000–500,000 Muslims (~1% of Ukraine's ~38M total pre-2022 — predominantly **Crimean Tatar** community (~250,000–300,000, the historic indigenous Muslim population of Crimea, now significantly displaced post-2014 Russian occupation), Volga Tatar / Bashkir, ethnic-Crimean Tatar diaspora across mainland Ukraine, Caucasus / Chechen / Azerbaijani-heritage, Arab / Pakistani diaspora)
- **Madhab(s):** Sunni Hanafi (Crimean Tatar institutional inheritance via Crimean Khanate Ottoman period — historically the most prominent sub-community)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Crimean Tatar Hanafi institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Ukraine (`UA`) to MWL. The Crimean Tatar community is institutionally Sunni Hanafi via Crimean Khanate Ottoman heritage — DUMK's pre-2014 Imsakiyya followed Diyanet-style Hanafi-Asr conventions. Mainland Ukrainian Muslim institutions (DUMU, DUMU-Umma) align with the broader European MWL consensus per ECFR for the multi-ethnic urban communities. Both routings are defensible; fajr's MWL routing follows the Aladhan default.

## Known points of ikhtilaf within the country
- **DUMK Crimean (under Russian occupation since 2014)** — historic Crimean Tatar institutional convention, Hanafi via Ottoman heritage. Crimea's bbox detection routes to Russia's `Russia` case (DUMR 16°/15°), not Ukraine's MWL — this reflects the de facto administrative reality but may not match Mejlis-aligned Crimean Tatar institutional convention.
- **DUMU (mainland Ukraine)** — multi-ethnic urban communities; MWL alignment.
- **DUMU "Umma"** — separate institutional body for Crimean Tatar diaspora and broader Sunni community.
- **Hanafi Asr** observed by Crimean Tatar / Volga Tatar communities; users may prefer manual `madhab: 'Hanafi'` override.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Crimean Tatar / Hanafi institutional convention.
- Crimea's bbox detection (currently routes to Russia per fajr's DUMR case) — Mejlis-aligned users may prefer manual override.

## Sources
- DUMU "Umma": https://umma.in.ua/
- DUMK Crimean: https://qmdi.org/
- Aladhan API regional default for `UA` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
