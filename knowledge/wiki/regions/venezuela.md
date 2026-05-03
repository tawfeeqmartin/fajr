# Venezuela — prayer-time conventions

## Institutional reference body
- **Name:** **Centro Islámico de Venezuela** — Caracas-based, founded 1993; **Mezquita Sheikh Ibrahim Al-Ibrahim** (Caracas, Saudi-funded, opened 1993, one of Latin America's largest mosques)
- **URL:** Centro Islámico de Venezuela: https://www.islamvenezuela.org/ (community portal)
- **Population served:** ~100,000–200,000 Muslims (~0.4–0.8% of Venezuela's ~28M total — predominantly **Lebanese / Syrian / Palestinian-origin** community (post-1948 / post-1973 / post-1985 migration waves), plus growing Venezuelan convert community; concentrated in Caracas, Maracaibo, Porlamar (Margarita Island — substantial Arab community), Valencia)
- **Madhab(s):** Sunni multi-madhab (Maliki / Shafi'i for Arab); Twelver Shi'a (significant via Lebanese Shi'a diaspora)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Venezuela (`VE`) to MWL. The Centro Islámico de Venezuela publishes prayer schedules consistent with MWL angles. The Saudi-funded Mezquita Sheikh Ibrahim Al-Ibrahim aligns with Umm al-Qura method per Saudi institutional convention. fajr's MWL routing follows the Aladhan default.

## Known points of ikhtilaf within the country
- **Twelver Shi'a Lebanese-heritage community** — institutional ties to Tehran method. Margarita Island and Caracas Shi'a communities — users may prefer manual `method: 'Tehran'` override.
- **Saudi-funded mosques (Caracas)** — Umm al-Qura institutional alignment.

## Open questions
- Citation pending — currently MWL Aladhan-aligned per v1.6.2 audit.

## Sources
- Centro Islámico de Venezuela: https://www.islamvenezuela.org/
- Aladhan API regional default for `VE` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
