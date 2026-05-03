# Ethiopia — prayer-time conventions

## Institutional reference body
- **Name:** Ethiopian Islamic Affairs Supreme Council / Majlis (Yä-Iʾtiyoṗya Esǝlǝmnna Gudayoč Tälaq Mejəlǝs)
- **URL:** Not consistently published online.
- **Population served:** ~40M Muslims (~34% of Ethiopia's ~120M total)
- **Madhab:** Sunni Shafi'i (overwhelmingly — concentrated in Harari, Oromia, Somali, Afar, Bale regions)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
This was a v1.6.0 classification-audit correction. Previously fajr routed Ethiopia to `Egyptian` (19.5°/17.5°). The audit identified that Ethiopian Muslims are overwhelmingly **Sunni Shafi'i** (similar to Somalia, Eritrea coast, and Yemen across the Red Sea), and the regional Shafi'i convention is **MWL 18°/17°** rather than Egyptian. The Majlis publishes Imsakiyya for Ramadan and observes the MWL convention; Aladhan defaults Addis Ababa, Harar, Dire Dawa, Jimma to MWL.

Harar specifically is a UNESCO-recognised historic Muslim city ("the fourth holy city of Islam" per local tradition) and a centre of Shafi'i scholarship.

## Known points of ikhtilaf within the country
- **Ethiopian Orthodox Christian majority** — the calendar context is unusual (Ethiopia uses the Ethiopian solar calendar, ~7–8 years behind Gregorian). Prayer times follow Gregorian/Hijri convention; the Ethiopian calendar does not affect adhan timing.
- **Salafi vs. Sufi tendencies** — different mosques may present slightly different Asr conventions (Sufi-influenced areas Shafi'i Standard; Salafi-influenced may also be Standard but with stricter visual-ihtiyat).

## Open questions
- Citation pending — currently MWL-aligned per v1.6.0 audit; primary-source verification from the Majlis is pending.

## Sources
- Aladhan API regional-default routing for `ET`
- Multi-app convention (Muslim Pro Addis Ababa, Harar)
- v1.6.0 classification audit: `autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
