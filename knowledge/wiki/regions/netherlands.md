# Netherlands — prayer-time conventions

## Institutional reference body
- **Name:** **Contactorgaan Moslims en Overheid (CMO)** — Muslim-government Contact Body, recognized as the official Muslim counterparty to the Dutch state; **Raad van Marokkaanse Moskeeën in Nederland** (Council of Moroccan Mosques); **Diyanet-İslamitische Stichting Nederland** (DİTİB equivalent for Turkish-heritage Muslims)
- **URL:** CMO: https://www.cmoweb.nl/ ; Raad van Marokkaanse Moskeeën: https://www.rmmn.nl/
- **Population served:** ~1.1M Muslims (~6.3% of Netherlands' ~17.8M total — predominantly Turkish-heritage (~400,000), Moroccan-origin (~400,000), plus Surinamese-Javanese / Indonesian, Iraqi, Somali, Afghan, Pakistani-origin)
- **Madhab(s):** Sunni Hanafi (Turkish-heritage majority via DİTİB); Sunni Maliki (Moroccan-origin); Sunni Shafi'i (Surinamese-Javanese, Indonesian-heritage); small Twelver Shi'a (Iranian / Iraqi-origin)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
The European multi-institution **MWL 18°/17°** is the ECFR-aligned default; Aladhan API defaults Netherlands (`NL`) to MWL. CMO does not publish a binding national Imsakiyya. The Moroccan-heritage and Turkish-heritage majorities may follow Habous Ministry / Diyanet Imsakiyya at their respective mosques.

## Known points of ikhtilaf within the country
- **Moroccan-affiliated mosques** — may publish Habous Ministry's 19°/17° + Maghrib +5min. Users may prefer `method: 'Morocco'` override.
- **DİTİB-affiliated mosques** (largest Turkish-heritage federation) — Diyanet preset offsets. Users may prefer `method: 'Diyanet'` override.
- **Surinamese-Javanese-heritage** community in Amsterdam, The Hague — distinct Indonesian-heritage Shafi'i convention; some affiliated mosques may follow JAKIM / Singapore method.

## Sources
- Contactorgaan Moslims en Overheid: https://www.cmoweb.nl/
- Raad van Marokkaanse Moskeeën in Nederland: https://www.rmmn.nl/
- Aladhan API regional default for `NL` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
