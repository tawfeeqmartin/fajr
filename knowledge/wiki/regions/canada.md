# Canada — prayer-time conventions

## Institutional reference body
- **Primary reference:** Islamic Society of North America — Canada (ISNA Canada / المجمع الإسلامي لأمريكا الشمالية فرع كندا)
- **URL:** https://isnacanada.com/ ; ISNA HQ (US): https://www.isna.net/
- **Population served:** ~1.8M Muslims (~4.9% of Canada's ~38M total — predominantly Sunni, with Twelver Shia, Ismaili, and other minorities; growing diaspora-driven population especially in Toronto/Mississauga, Montreal, Calgary, Edmonton, Vancouver, and Ottawa).
- **Madhab:** Mixed — Hanafi is the largest single school (South Asian and Turkish diaspora); Shafi'i (Egyptian, Yemeni, Somali, Indonesian/Malaysian); Maliki (West African, North African); Hanbali (Saudi-affiliated mosques). Twelver Shia and Nizari Ismaili communities follow their own conventions.

## Calculation method (as implemented in fajr)
- **adhan.js method:** `NorthAmerica` (`CalculationMethod.NorthAmerica()`) — corresponds to **Aladhan API method 2 (ISNA)**
- **Fajr angle:** 15°
- **Isha angle:** 15°
- **Asr school:** Standard (1× shadow) by default; Hanafi (2× shadow) is widely overridden community-by-community. fajr's default follows ISNA's published convention (Standard), with `madhab: 'hanafi'` available for Hanafi-affiliated mosques.
- **Special offsets:** none
- **Classification:** 🟢 Established (ISNA is the dominant institutional reference for North American Sunni mosques; the 15°/15° angle pair is the ISNA-published convention)

## Why this method
ISNA (Islamic Society of North America) is the largest Sunni umbrella body for Canada and the United States combined and publishes the most widely used prayer time tables for the diaspora. ISNA's calculated convention uses **15°/15°** for Fajr/Isha — chosen historically as a higher-latitude-friendly angle that avoids the persistent-twilight problems of 17–18° angle methods at northern Canadian latitudes (which include Edmonton 53°N, Yellowknife 62°N, Iqaluit 64°N, where 18° twilight does not always reach below the horizon in summer).

For comparison: a Saudi-affiliated mosque in Canada might use Umm al-Qura (18.5°) and a Tehran-affiliated mosque (Twelver Shia) might use Tehran (17.7°) instead — both are valid community-level choices. ISNA-15° is the **dominant calculated convention**, which is why it serves as the country-default in fajr.

## Known points of ikhtilaf within the country
- **Asr school:** Shafi'i (Standard) vs Hanafi (2× shadow). Hanafi-affiliated mosques publish Asr ~30–60 min later than ISNA's Shafi'i-aligned Standard. fajr's default is Standard; the engine accepts a `madhab` override.
- **Shia communities:** Toronto's Twelver Shia community (significant Iranian, Iraqi, Lebanese diaspora) follow Tehran-method timing (17.7° Fajr, 14° Isha) rather than ISNA. Aladhan offers method 7 (Tehran) for these mosques; fajr does not currently apply a city-level dispatch for Toronto/Montreal Shia mosques specifically.
- **Ismaili communities:** Nizari Ismaili Muslims (significant Khoja and Pakistani-origin diaspora) follow their own jamatkhana scheduling, not the standard 5-prayer scheduling.
- **High-latitude method choice:** for cities above ~55°N (Edmonton, Calgary outskirts, Saskatoon, Yellowknife, Iqaluit), local ISNA-affiliated mosques may apply *seventh-of-night* or *middle-of-night* fallbacks during summer when 15° twilight does not reach the horizon. fajr applies adhan.js's default high-latitude rule for these cases; users in extreme latitudes should verify against their local mosque.

## Sources
- ISNA Canada: https://isnacanada.com/
- ISNA HQ (US, parent body): https://www.isna.net/
- Aladhan API method 2 (`ISNA`): https://aladhan.com/calculation-methods
- adhan.js `CalculationMethod.NorthAmerica()` source

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.7.9 docs regen sweep — closing the gap flagged in #57 audit)
