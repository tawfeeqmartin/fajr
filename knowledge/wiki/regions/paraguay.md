# Paraguay — prayer-time conventions

## Institutional reference body
- **Name:** **Centro Cultural Islámico del Paraguay (CCIP)** — Ciudad del Este-based, the institutional center for Paraguay's Muslim community (the **Tri-Border Area** between Paraguay, Brazil, and Argentina has a substantial Lebanese-Sunni / Lebanese-Shi'a community)
- **URL:** No consistent online presence
- **Population served:** ~10,000–25,000 Muslims (~0.15–0.3% of Paraguay's ~6.8M total — predominantly **Lebanese / Syrian / Palestinian-origin** community concentrated in Ciudad del Este (the eastern Tri-Border Area), Asunción, Foz do Iguaçu cross-border with Brazil; small Paraguayan convert community)
- **Madhab(s):** Sunni multi-madhab (Maliki / Shafi'i for Sunni Arab); significant Twelver Shi'a (via Lebanese Shi'a diaspora — Ciudad del Este has one of Latin America's largest Shi'a communities)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Paraguay (`PY`) to MWL. The Paraguayan Muslim community is concentrated in the Tri-Border Area; CCIP publishes prayer schedules consistent with MWL angles. MWL is the multi-app Latin-America default.

## Known points of ikhtilaf within the country
- **Twelver Shi'a Lebanese-heritage community in Ciudad del Este** — significant population fraction; institutional ties to Tehran method. Users at Shi'a mosques may prefer manual `method: 'Tehran'` override.
- **Sunni Lebanese-Palestinian-Syrian-origin** — Maliki / Shafi'i institutional inheritance.

## Open questions
- Citation pending — currently MWL Aladhan-aligned per v1.6.2 audit.

## Sources
- Aladhan API regional default for `PY` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
