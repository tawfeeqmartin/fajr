# Tunisia — prayer-time conventions

## Institutional reference body
- **Name:** Ministry of Religious Affairs (Wizārat aš-Šuʾūn ad-Dīniyya / Ministère des Affaires religieuses)
- **URL:** https://www.affaires-religieuses.tn/
- **Population served:** ~12M (≈99% Muslim)
- **Madhab:** Sunni Maliki

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Other` with custom angles (`fajrAngle = 18°`, `ishaAngle = 18°`)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard (Maliki — 1× shadow)
- **Special offsets:** none
- **Classification:** 🟢 Established (institutional preset)

## Why this method
The Tunisian Ministry of Religious Affairs publishes the national prayer-time calendar; its convention of **18°/18°** matches Aladhan API method 18 ("Tunisia") and is consistently mirrored across third-party services (IslamicFinder, Muslim Pro, timesprayer.com) querying Tunisian cities. Tunisia is Maliki, so Asr is Standard (1× shadow); we therefore use `adhan.CalculationMethod.Other()` with explicit angle overrides rather than `Karachi()` (which would set Hanafi Asr).

## Known points of ikhtilaf within the country
- None known at the national level. Tunisian Maliki convention is uniform across the country's mosques.

## Sources
- Aladhan API method 18 (`Tunisia`): https://aladhan.com/calculation-methods
- Ministère des Affaires religieuses: https://www.affaires-religieuses.tn/
- timesprayer.com Tunis listing: https://timesprayer.com/en/prayer-times-in-tunis.html

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
