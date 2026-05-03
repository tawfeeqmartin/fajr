# Lebanon — prayer-time conventions

## Institutional reference body
- **Name:** Dar al-Fatwa al-Lubnaniyya (Sunni); Higher Islamic Shi'ite Council (Shi'a)
- **URL:** Dar al-Fatwa: https://www.darelfatwa.gov.lb/ ; Higher Shi'ite Council: not consistently online
- **Population served:** ~5M (≈61% Muslim — split roughly 27% Sunni, 27% Shi'a, 5% Druze, plus others)
- **Madhab:** Sunni Shafi'i / Hanafi (Sunni); Twelver Jafari (Shi'a)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Egyptian` (19.5°/17.5°)
- **Fajr angle:** 19.5°
- **Isha angle:** 17.5°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (multi-method country)

## Why this method
fajr currently routes Lebanon-detected coordinates to the Egyptian regional convention (19.5°/17.5°), the Aladhan default for `LB`. Lebanon has substantial intra-country ikhtilaf:

- **Sunni areas (Beirut, Tripoli, Sidon, Akkar):** Dar al-Fatwa Sunni timetables often align with **Karachi-style 18°/18°** rather than Egyptian; some Tripoli mosques publish times closer to MWL 18°/17°.
- **Shi'a areas (Bekaa, South Lebanon, Dahieh):** Higher Islamic Shi'ite Council timetables follow **Jafari/Tehran-style** convention, with Maghrib timed to disappearance of redness in the eastern sky (~5–15 min after sunset), matched numerically by Tehran's 17.7°/14° + Maghrib offset.

The current default Egyptian routing is the Aladhan world-default fallback rather than a precise-match institutional choice. v1.7.0 follow-up: city-level overrides for Bekaa/South Lebanon to switch them to Tehran method.

## Known points of ikhtilaf within the country
- **Sunni–Shi'a method split** (the dominant ikhtilaf): Sunni Karachi/MWL vs. Shi'a Tehran/Jafari Maghrib timing.
- **Sunni internal variation** (Beirut Hanafi-leaning vs. Tripoli Shafi'i-leaning) does not produce notable angle-pair differences but may differ in Asr (Hanafi 2× shadow vs. Shafi'i 1× shadow).

## Open questions
- Primary-source verification of Dar al-Fatwa's Sunni timetable is pending; the current Egyptian default may be replaced once that is confirmed.
- v1.7.0: city-override list for Shi'a-majority municipalities (Nabatieh, Tyre, Baalbek, Hermel, Dahieh) → Tehran method.

## Sources
- Dar al-Fatwa al-Lubnaniyya: https://www.darelfatwa.gov.lb/
- Aladhan API regional-default routing for `LB`: https://aladhan.com/calculation-methods

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
