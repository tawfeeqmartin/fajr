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

## City-level overrides (active in fajr v1.7.x)
- **Mosul** → Karachi 18°/18° + Hanafi Asr (Sunni Endowment, Nineveh)
- **Najaf** → Tehran (Sistani hawza, Twelver Shia)
- **Karbala** → Tehran (Imam Husayn / Abbas custodial offices)
- **Basra** → Tehran (Twelver Shia Imsakiyya via maraji' offices)

## Open questions
- **KRG (Sulaymaniyah, Erbil) — research not yet conclusive (v1.7.2 status):** Kurdistan Regional Government Ministry of Endowment and Religious Affairs (https://gov.krd/moera-ar/) exists, but no publicly accessible primary-source prayer-time methodology documented. Kurdish Sunni community is overwhelmingly Shafi'i (distinct from Iraqi Arab Sunni Hanafi). Third-party apps (IslamicFinder, Pray Times) default Erbil/Sulaymaniyah to Karachi 18°/18° but do not cite KRG institutional sources. **No override shipped in v1.7.2.** Tracking: deeper data-hunt needed (Wayback Machine, mosque Imsakiyya samples, KRG Ministry direct contact). If future research locates a Diwan al-Awqaf KRG primary source, override candidate is Karachi 18°/18° + Shafi Asr (mirroring the Kerala/Maldives/Sri Lanka pattern).
- The current default Egyptian routing is the Aladhan world-default fallback, not a precise-match institutional choice. Primary-source verification needed for non-overridden Iraqi cities.

## Sources
- Sunni Endowment Office: https://sunniaffairs.gov.iq/
- Shi'a Endowment Office: https://shia-affairs.gov.iq/
- Office of Sayyid Sistani (Najaf): https://www.sistani.org/
- Imam Husayn Holy Shrine (Karbala): https://imamhussain.org/
- Kurdistan Regional Government Ministry of Endowment and Religious Affairs: https://gov.krd/moera-ar/ (KRG primary-source prayer-time methodology pending verification)
- Aladhan API regional-default routing for `IQ`: https://aladhan.com/calculation-methods
- Kurdistan-prayer-times-js community library (community-published, not institutional): https://github.com/ahmadsoran/kurdistan-prayer-times-js

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
- 2026-05-03 by fajr-agent (v1.7.2 — added KRG research status; no override shipped pending primary source)
