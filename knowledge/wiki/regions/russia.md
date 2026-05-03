# Russia — prayer-time conventions

## Institutional reference body
- **Name:** Spiritual Administration of Muslims of the Russian Federation (Духовное управление мусульман Российской Федерации, DUMRF / DUMR), chaired by Mufti Ravil Gainutdin since 1996. Tatarstan-based Central Spiritual Administration (TsDUM, Mufti Talgat Tadzhuddin) and the Coordination Centre of Muslims of the North Caucasus (KTsMSK) operate as parallel federal-level bodies.
- **URL:** https://dumrf.ru/ ; daily prayer times: https://dumrf.ru/regions ; mobile-only Namaz Vakti app
- **Population served:** ~20M Muslims (~14% of Russia's ~143M population — concentrated in Tatarstan, Bashkortostan, Dagestan, Chechnya, Ingushetia, Kabardino-Balkaria, Karachay-Cherkessia, Adygea, North Ossetia)
- **Madhab(s):** Sunni Hanafi (Tatar-Bashkir Volga heartland), Sunni Shafi'i (Dagestan, Chechnya, Ingushetia), Sufi orders (Naqshbandi, Qadiri in North Caucasus)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Other` with custom `fajrAngle = 16°`, `ishaAngle = 15°`, `highLatitudeRule = TwilightAngle`
- **Fajr angle:** 16°
- **Isha angle:** 15°
- **Asr school:** Standard
- **Special offsets:** TwilightAngle high-latitude rule for Moscow/St. Petersburg/Kazan latitudes (>55°N)
- **Classification:** 🟢 Established

## Why this method
DUMR's published Imsakiyya for Moscow, Kazan, Ufa, and St. Petersburg uses the **16°/15° angle pair**, which is materially shallower than the global MWL 18°/17° default. The shallower angles are necessary because Russian latitudes (Moscow 55.7°N, St. Petersburg 59.9°N, Murmansk 68.9°N) exceed the practical range where the 18° astronomical-twilight definition produces a usable Fajr/Isha for several months of the year — 18° twilight is unreachable above ~48°N for parts of summer, and the calculated time becomes either undefined or extremely close to civil-twilight midnight. The 16°/15° preset is the institutional accommodation, paralleling the Russia / North Caucasus DUMR convention recognized by Aladhan as **method 14** ("Russia"). The TwilightAngle high-latitude rule is layered on top to handle the months where even 16°/15° fails.

This convention is also followed by the parallel federal bodies (TsDUM, KTsMSK), and is reflected in regional Imsakiyya published by the Tatarstan Spiritual Administration (DUM RT, https://dumrt.ru/) and Bashkortostan Spiritual Administration (TsDUM RB).

## Known points of ikhtilaf within the country
- **Three federal-level institutional bodies** — DUMRF (Moscow, broader federation), TsDUM (Tatarstan-based, Volga-Urals), and KTsMSK (North Caucasus). All three publish substantively the same 16°/15° angle pair for Moscow/Kazan/Makhachkala; intra-country ikhtilaf is more about institutional governance than calculation method.
- **Hanafi vs. Shafi'i Asr** — Volga Hanafi communities use 2× shadow Asr; Caucasus Shafi'i communities use 1× shadow Asr. fajr currently uses **Standard (1× shadow)** for the country-level default. v1.7.0+ city-overrides for Kazan / Ufa would route to Hanafi Asr.
- **Crimea** — controlled by Russia since 2014; Crimean Tatar Muslim community (Mejlis-aligned) historically followed Diyanet/Hanafi convention via Ottoman-era inheritance, distinct from DUMRF. fajr's bbox-based detection routes Crimea to Russia (since the country is administered as such by Russia); users following Mejlis convention may prefer manual override to Diyanet.

## Sources
- Spiritual Administration of Muslims of the Russian Federation: https://dumrf.ru/
- DUMRF regional prayer times: https://dumrf.ru/regions
- Tatarstan Spiritual Administration (DUM RT): https://dumrt.ru/
- Aladhan API method 14 ("Russia"): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- v1.6.2 implementation log: `autoresearch/logs/2026-05-02-v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
