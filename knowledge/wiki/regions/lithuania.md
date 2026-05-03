# Lithuania — prayer-time conventions

## Institutional reference body
- **Name:** **Dvasinis Musulmonų Religinis Lietuvos Centras** (DUMRL — Spiritual Centre of Muslims of Lithuania) / Lithuanian Muslim Sunni Mufti's Office — represents the historical **Lipka Tatar** Muslim community
- **URL:** DUMRL: http://www.muftiatas.lt/ (community portal); Lithuanian Muftiate
- **Population served:** ~3,000–4,000 Muslims (~0.1% of Lithuania's ~2.8M total — historic Lipka Tatar community continuously present in Lithuania since the 14th century, with mosques in Kaunas, Nemėžis, Raižiai, Keturiasdešimt Totorių; small modern diaspora)
- **Madhab(s):** Sunni Hanafi (Lipka Tatar inheritance via Grand Duchy of Lithuania / Crimean Khanate Ottoman period)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Lipka Tatar Hanafi institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
ECFR-aligned **MWL 18°/17°** is the European default; Aladhan API defaults Lithuania (`LT`) to MWL. Lithuania's historic Lipka Tatar community is institutionally Sunni Hanafi — Diyanet 18°/17° + Hanafi Asr would be institution-aligned. fajr's MWL routing follows the Aladhan default; v1.6.3+ may revisit.

## Known points of ikhtilaf within the country
- **Lipka Tatar Hanafi institutional convention** — historically observed via DUMRL's Mufti's Office; users may prefer manual `method: 'Diyanet'` and `madhab: 'Hanafi'` overrides.
- **Continuous tradition since 14th century** — the Lipka Tatar settlement under Grand Duke Vytautas (~1397) makes Lithuania one of the oldest continuous European Muslim institutional traditions.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Lipka Tatar institutional convention.

## Sources
- DUMRL / Lithuanian Muftiate: http://www.muftiatas.lt/
- Aladhan API regional default for `LT` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
