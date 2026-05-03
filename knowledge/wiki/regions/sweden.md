# Sweden — prayer-time conventions

## Institutional reference body
- **Name:** **Sveriges Muslimska Råd (SMR)** — Swedish Muslim Council; **Förenade Islamiska Föreningar i Sverige (FIFS)** — Federation of Islamic Associations; **Sveriges Muslimska Förbund (SMuF)** — Swedish Muslim Federation; **Islamiska Förbundet i Sverige (IFiS)** — Islamic Association of Sweden
- **URL:** SMR: https://www.sverigesmuslimskarad.se/ ; IFiS: https://islamiskaforbundet.se/
- **Population served:** ~810,000 Muslims (~7.7% of Sweden's ~10.5M total — predominantly Iraqi, Iranian, Bosnian, Turkish, Somali, Afghan, Syrian, Eritrean-origin)
- **Madhab(s):** Sunni multi-madhab (Hanafi for Turkish / Bosnian / Afghan, Maliki for North African, Shafi'i for Somali / Yemeni, multi-madhab for Iraqi / Syrian); Twelver Shi'a (~25-30% of Iranian and Iraqi-origin Muslims, significant population fraction)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°), with `TwilightAngle` high-latitude rule auto-applied at lat > 55°N (most of Sweden is at lat 55-69°N, so this rule applies country-wide for Stockholm 59.3°N and northward)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** TwilightAngle high-latitude rule for the entire country
- **Classification:** 🟡→🟢 Approaching established (high-latitude TwilightAngle is the established Aladhan convention for Sweden)

## Why this method
ECFR-aligned **MWL 18°/17°** is the European default; Aladhan defaults Sweden (`SE`) to MWL. Sweden's high latitudes (Stockholm 59.3°N, Göteborg 57.7°N, Malmö 55.6°N, Umeå 63.8°N, Kiruna 67.9°N) require the **TwilightAngle high-latitude rule** — the standard 18°/17° angles are unreachable for several months of the year. Above ~65°N, even TwilightAngle approaches MiddleOfNight behavior; Norway (`Norway` case in fajr) explicitly switches to MiddleOfNight, while Sweden currently uses TwilightAngle. v1.6.3+ may consider matching Norway's behavior for the northernmost Swedish coordinates.

## Known points of ikhtilaf within the country
- **SMR vs. FIFS/SMuF/IFiS** — institutional structure is fragmented; multiple peak bodies. All publish MWL-aligned Imsakiyya for the daily prayer-time use case.
- **Twelver Shi'a population (substantial)** — Iranian / Iraqi-heritage communities; users at Shi'a mosques may prefer manual `method: 'Tehran'` override.
- **Bosnian / Turkish-heritage mosques** — Hanafi Asr; some publish Diyanet preset offsets.
- **Northern Sweden (above lat 65°N)** — astronomical twilight does not occur in summer; TwilightAngle becomes a numerical placeholder. Users at extreme latitudes should note that the calculated Fajr/Isha is a regulatory convention rather than astronomically-grounded.

## Sources
- Sveriges Muslimska Råd: https://www.sverigesmuslimskarad.se/
- Islamiska Förbundet i Sverige: https://islamiskaforbundet.se/
- Aladhan API regional default for `SE` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- High-latitude conventions: `knowledge/wiki/regions/high-latitude.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
