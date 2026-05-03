# Belgium — prayer-time conventions

## Institutional reference body
- **Name:** **Executive of the Muslims of Belgium (Exécutif des Musulmans de Belgique / EMB / Moslimexecutief van België)** — the state-recognized representative body of Belgian Muslims since 1998
- **URL:** EMB: https://www.embnet.be/ (institutional); local mosque networks: Diyanet-affiliated Diyanet İşleri Türk-İslam Birliği (DİTİB Belgium), Moroccan-affiliated mosque networks
- **Population served:** ~870,000 Muslims (~7.5% of Belgium's ~11.7M total — predominantly Moroccan-origin (~50%), Turkish-heritage (~25%), plus Albanian, Pakistani, Bosnian, Algerian, Tunisian, Syrian-origin)
- **Madhab(s):** Sunni Maliki (Moroccan-origin majority); Sunni Hanafi (Turkish, Albanian, Pakistani, Bosnian-origin); small Twelver Shi'a community

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
The European multi-institution **MWL 18°/17°** is the ECFR-aligned default; Aladhan API defaults Belgium (`BE`) to MWL. The Moroccan-heritage majority may follow the Habous-Ministry Imsakiyya at Moroccan-affiliated mosques (Brussels Bruxelles, Antwerp Antwerpen, Charleroi); Turkish-heritage worshipers at DİTİB mosques follow Diyanet preset offsets. fajr routes to MWL as the multi-institutional default.

## Known points of ikhtilaf within the country
- **Moroccan-affiliated mosques** — may publish Habous Ministry's 19°/17° + Maghrib +5min. Users may prefer manual `method: 'Morocco'` override.
- **DİTİB / Diyanet-affiliated mosques** — Diyanet preset offsets. Users may prefer manual `method: 'Diyanet'` override.
- **Hanafi Asr** observed by Turkish / Albanian / Pakistani / Bosnian heritage communities; Standard Asr by Maliki Moroccan-heritage majority. fajr country default is Standard Asr.

## Sources
- Executive of the Muslims of Belgium: https://www.embnet.be/
- Aladhan API regional default for `BE` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
