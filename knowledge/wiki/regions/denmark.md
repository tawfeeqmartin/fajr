# Denmark — prayer-time conventions

## Institutional reference body
- **Name:** **Dansk Islamisk Råd (DIR)** — Danish Islamic Council; **Muslimernes Fællesråd (MFR)** — Muslim Joint Council; **Den Islamiske Verdensliga i Danmark** (Muslim World League Denmark branch); state-recognized through the multi-faith trossamfund framework rather than a single Acuerdo-style concordat
- **URL:** DIR: https://www.danskislamiskraad.dk/ ; MFR: https://muslimerne.dk/
- **Population served:** ~325,000 Muslims (~5.5% of Denmark's ~5.9M total — predominantly Turkish, Pakistani, Iraqi, Somali, Lebanese, Moroccan, Afghan-origin)
- **Madhab(s):** Sunni Hanafi (Turkish / Pakistani / Afghan heritage); Sunni multi-madhab (other diaspora); small Twelver Shi'a (Iraqi-origin)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none (TwilightAngle high-latitude rule kicks in only at lat > 55°N — most of Denmark is at lat 54-57°N, so northern Jutland / Bornholm may trigger TwilightAngle)
- **Classification:** 🟡 Limited precedent

## Why this method
ECFR-aligned multi-institutional **MWL 18°/17°** is the European default; Aladhan defaults Denmark (`DK`) to MWL. Danish summer days exceed the 18°/17° MWL practical range, requiring the **TwilightAngle high-latitude rule** for Copenhagen (55.7°N) — fajr's existing high-latitude branch (lat > 55) automatically applies this in northern Denmark.

## Known points of ikhtilaf within the country
- **DİTİB-affiliated Turkish-heritage mosques** — Diyanet preset offsets; users may prefer `method: 'Diyanet'` override.
- **Pakistani / Afghan-origin** communities at Hanafi-heritage mosques may follow Karachi 18°/18°.
- **Hanafi Asr** observed at Turkish / Pakistani / Afghan-heritage mosques.

## Sources
- Dansk Islamisk Råd: https://www.danskislamiskraad.dk/
- Muslimernes Fællesråd: https://muslimerne.dk/
- Aladhan API regional default for `DK` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
