# Iraq — prayer-time conventions

## Institutional reference body
- **Name:** Sunni Endowment Office (Dīwān al-Waqf as-Sunnī); Shi'a Endowment Office (Dīwān al-Waqf aš-Šīʿī); Marjaʿiyya in Najaf
- **URL:** Sunni Endowment: https://sunniaffairs.gov.iq/ ; Shi'a Endowment: https://shia-affairs.gov.iq/
- **Population served:** ~44M (≈99% Muslim; roughly 60–65% Shi'a, 30–35% Sunni)
- **Madhab:** Twelver Jafari (majority); Sunni Hanafi / Shafi'i

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Egyptian` (19.5°/17.5°)
- **Fajr angle:** 19.5°
- **Isha angle:** 17.5°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (multi-method country)

## Why this method
Iraq has substantial intra-country ikhtilaf and no single uniform national timetable. fajr currently routes all Iraqi coordinates to the Egyptian world-default via Aladhan. Reality on the ground:

- **Sunni areas (Anbar, Salahuddin, Mosul, Kirkuk, Baghdad-Sunni neighborhoods):** Sunni Endowment Office publishes timetables that best match **Karachi-style 18°/18°** rather than Egyptian.
- **Shi'a areas (Najaf, Karbala, Basra, Kufa, southern Iraq, Baghdad-Shi'a neighborhoods):** Shi'a Endowment and the Marjaʿiyya in Najaf follow **Jafari/Tehran-style** convention, with Maghrib timed to disappearance of redness in the eastern sky (~5–15 min after sunset), matched numerically by Tehran's 17.7°/14° + Maghrib offset.

## Known points of ikhtilaf within the country
- **Sunni–Shi'a method split** (the dominant ikhtilaf): Sunni Karachi/Egyptian vs. Shi'a Tehran/Jafari Maghrib timing.
- **Within Shi'a:** Marjaʿiyya Najaf follows the disappearance-of-redness Maghrib convention; Marjaʿiyya Qom (in Iran) follows the same convention.

## Open questions
- v1.7.0 follow-up: city-level overrides for Najaf, Karbala, Basra, Kufa to switch them to Tehran method (per v1.6.0 classification-audit log).
- The current default Egyptian routing is the Aladhan world-default fallback, not a precise-match institutional choice. Primary-source verification needed.

## Sources
- Sunni Endowment Office: https://sunniaffairs.gov.iq/
- Shi'a Endowment Office: https://shia-affairs.gov.iq/
- Aladhan API regional-default routing for `IQ`: https://aladhan.com/calculation-methods

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
