# Switzerland — prayer-time conventions

## Institutional reference body
- **Name:** **Föderation Islamischer Dachorganisationen Schweiz (FIDS)** / Fédération d'Organisations Islamiques de Suisse — peak coordinating body; **VIOZ** (Vereinigung der Islamischen Organisationen in Zürich); **CCIS** (Coordination des Communautés Islamiques de Suisse)
- **URL:** FIDS: https://www.fids.ch/ ; VIOZ: https://www.vioz.ch/
- **Population served:** ~440,000 Muslims (~5% of Switzerland's ~8.7M total — predominantly Bosnian / Kosovo-Albanian / North Macedonian (~50%), Turkish, Arab (Maghreb / Levantine), South Asian-origin)
- **Madhab(s):** Sunni Hanafi (Bosnian / Albanian / Turkish heritage majority); Sunni multi-madhab (Arab and other diaspora)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
FIDS endorses the European multi-institutional **MWL 18°/17°** convention via ECFR alignment; Aladhan API defaults Switzerland (`CH`) to MWL. The Swiss Muslim community is heavily Bosnian / Albanian-heritage Hanafi (institutionally aligned with Diyanet via Bosnian Rijaset and Albanian KMSH inheritance). At Albanian / Bosnian-heritage mosques, the published Imsakiyya may track Diyanet 18°/17° + preset offsets rather than pure MWL.

## Known points of ikhtilaf within the country
- **Albanian / Bosnian-heritage mosques** — may publish Diyanet preset offsets producing small (~5-7 min) Maghrib/Isha shifts. Users may prefer manual `method: 'Diyanet'` override.
- **Hanafi Asr (2× shadow)** is observed by Turkish, Bosnian, Albanian-heritage communities (combined majority of Swiss Muslims). fajr's country default is Standard Asr; users at Hanafi-heritage mosques may prefer `madhab: 'Hanafi'` override.

## Sources
- FIDS / Fédération d'Organisations Islamiques de Suisse: https://www.fids.ch/
- VIOZ: https://www.vioz.ch/
- Aladhan API regional default for `CH` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
