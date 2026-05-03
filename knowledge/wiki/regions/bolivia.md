# Bolivia — prayer-time conventions

## Institutional reference body
- **Name:** Centro Islámico Boliviano (CIB) — small institutional footprint
- **URL:** Not consistently published online.
- **Population served:** ~3,000–10,000 Muslims (≪1% of Bolivia's ~12M total — predominantly converts and Arab-Bolivian descent communities in Santa Cruz, La Paz, Sucre)
- **Madhab:** Sunni (mixed; no dominant madhab among the small community)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
Latin America's small Muslim communities have no national institutional preset. The fajr engine routes Bolivia, Colombia, and Ecuador to the Muslim World League 18°/17° as a regional default per Muslim Pro and IslamicFinder convention for La Paz, Santa Cruz, and Cochabamba.

## Known points of ikhtilaf within the country
- None publicly documented.

## Open questions
- High-altitude consideration: La Paz at ~3,640m and El Alto at ~4,150m have meaningful elevation effects on Shuruq/Maghrib horizon-crossing prayers (~3–5 minute shifts vs. sea-level calc — see [[wiki/corrections/elevation]]). fajr's `applyElevationCorrection` is opt-in; consumers handling Bolivian high-altitude Muslim communities should consider passing elevation parameters.

## Sources
- Aladhan API regional-default routing for `BO`
- Multi-app convention (Muslim Pro La Paz)

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
