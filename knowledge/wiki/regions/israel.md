# Israel — prayer-time conventions

## Institutional reference body
- **Name:** Multiple — the Sharia Courts of Israel (under the Ministry of Justice) administer family law for Israeli Muslims; the **Northern Branch** and **Southern Branch** of the Islamic Movement publish their own Imsakiyya for Arab-Israeli communities. Mosques in East Jerusalem and the Triangle region historically follow the **Awqaf-Jerusalem** convention (Egyptian method) inherited from the pre-1948 / Jordanian / Palestinian Authority continuum.
- **URL:** Sharia Courts: https://www.gov.il/he/departments/units/sharia-courts ; Islamic Movement (Northern, banned 2015): no current portal; Southern Branch: https://www.islamic-mvm.org.il/
- **Population served:** ~1.7M Muslims (~17.5% of Israel's ~9.7M total — primarily Sunni Arab citizens in the Galilee, Triangle, Negev (Bedouin), and East Jerusalem; small Muslim populations in mixed cities Haifa, Lod, Ramla, Jaffa)
- **Madhab(s):** Sunni Shafi'i / Hanafi (Arab-Israeli communities); Sufi orders historically present (Qadiriyya, Shadhiliyya); small Druze, Bedouin, and Circassian communities with distinct practices but observing standard Sunni prayer-times calendar

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Egyptian` (19.5°/17.5°)
- **Fajr angle:** 19.5°
- **Isha angle:** 17.5°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (institutional citation pending)

## Why this method
Israeli-Arab and East Jerusalem Muslim communities have historically followed the **Awqaf-Jerusalem** convention, which inherits the Egyptian (19.5°/17.5°) regional cluster via the pre-1948 / Mandate-era / Jordanian / Palestinian-Authority continuum (Al-Aqsa-published times; Egyptian General Authority of Survey numerically). This is also Aladhan's per-country default for Israel.

Note that Israel's bbox in fajr is configured AFTER Palestine's bbox in `detectCountry()` — this means Palestinian-controlled West Bank / Gaza coordinates dispatch to **Palestine**, while Israeli-territory coordinates (including East Jerusalem when geocoded as Israeli) dispatch to **Israel**. Both currently route to `Egyptian()` so the resulting calculation is the same; future v1.7.0 city-overrides may diverge for Triangle / Galilee Hanafi-leaning communities.

## Known points of ikhtilaf within the country
- **East Jerusalem boundary** — the bbox detection treats East Jerusalem as Israeli territory by default; users following the **Palestinian Awqaf-Jerusalem** institutional framework (see `regions/palestine.md`) may prefer to override.
- **Northern Islamic Movement** (banned in 2015) historically published Imsakiyya consistent with the Egyptian / Awqaf-Jerusalem convention.
- **Southern Islamic Movement** publishes its own community calendar; angles align with Egyptian.
- **Bedouin Negev communities** — observe standard Sunni five-prayer convention; no separate institutional preset.
- **Druze (~1.6% of Israel's population)** observe a separate religious calendar tied to the Druze faith; not Sunni Muslim and not in scope of fajr's prayer-time outputs.

## Open questions
- Citation pending — no Israeli Muslim institutional body publishes a single "official" national Imsakiyya. The Egyptian-method routing is the Aladhan-aligned regional default; primary-source verification from a specific Israeli-Arab institutional Imsakiyya publication would strengthen the classification.

## Sources
- Sharia Courts of Israel (Ministry of Justice): https://www.gov.il/he/departments/units/sharia-courts
- Aladhan API regional-default routing for `IL`: https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
