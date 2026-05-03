# North Korea — prayer-time conventions

## Institutional reference body
- **Name:** No state-recognized Muslim institutional body. The **Iranian Embassy mosque** in Pyongyang (Ar-Rahman Mosque, opened 2012) serves the Iranian diplomatic community and is the only documented mosque in the country.
- **URL:** Iranian embassy in Pyongyang: information sparse / not consistently published
- **Population served:** ~100–500 Muslims (negligible fraction of North Korea's ~26M total — virtually entirely **Iranian diplomatic and trade-mission staff** plus occasional foreign workers/students from Pakistan / Indonesia; no documented native North Korean Muslim community)
- **Madhab(s):** Twelver Shi'a (Iranian diplomatic community via Ar-Rahman Mosque); minority Sunni multi-madhab among other foreign workers

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending — practical use case is near-zero)

## Why this method
Aladhan API defaults North Korea (`KP`) to MWL. The country has near-zero documented Muslim community; the routing exists primarily for defensive coverage in case of foreign-resident or diplomatic-staff users. The Ar-Rahman Mosque (Iranian embassy) follows Tehran method per Iranian institutional convention; users at this specific location may prefer manual `method: 'Tehran'` override.

## Known points of ikhtilaf within the country
- **Ar-Rahman Mosque (Pyongyang)** — Twelver Shi'a / Tehran method via Iranian embassy administration.

## Open questions
- Use case is near-zero; routing is defensive.

## Sources
- Aladhan API regional default for `KP` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
