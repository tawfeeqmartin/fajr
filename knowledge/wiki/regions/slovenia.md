# Slovenia — prayer-time conventions

## Institutional reference body
- **Name:** **Islamska skupnost v Republiki Sloveniji (IS-RS)** — Islamic Community in the Republic of Slovenia, Ljubljana-based; institutionally affiliated with the Bosnian Rijaset framework
- **URL:** IS-RS: https://www.islamska-skupnost.si/
- **Population served:** ~50,000 Muslims (~2.4% of Slovenia's ~2.1M total — predominantly Bosniak (post-Yugoslav settlement), plus ethnic-Albanian, Turkish, Macedonian-Muslim, recent diaspora)
- **Madhab(s):** Sunni Hanafi (Bosniak / ethnic-Albanian / Macedonian Hanafi heritage)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Bosniak/Diyanet institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Slovenia (`SI`) to MWL. IS-RS is institutionally affiliated with the Bosnian Rijaset (which uses Diyanet method per fajr's Bosnia routing). v1.6.3+ candidate for re-routing to Diyanet for institutional consistency.

The Ljubljana Mosque (the country's first purpose-built mosque) opened in 2020 after a 50-year community campaign; serves as the institutional center.

## Known points of ikhtilaf within the country
- **Bosniak community** — institutional ties to Bosnian Rijaset; Diyanet alignment would be consistent.
- **Hanafi Asr** observed by major Muslim communities; users may prefer manual `madhab: 'Hanafi'` override.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Bosniak institutional alignment.

## Sources
- Islamska skupnost v RS: https://www.islamska-skupnost.si/
- Aladhan API regional default for `SI` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
