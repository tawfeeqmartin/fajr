# Ecuador — prayer-time conventions

## Institutional reference body
- **Name:** Centro Islámico del Ecuador (Quito) — small institutional footprint
- **URL:** Not consistently published online.
- **Population served:** ~2,000–5,000 Muslims (≪1% of Ecuador's ~18M total — primarily in Quito, Guayaquil)
- **Madhab:** Sunni (mixed; no dominant madhab among the small community)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
Ecuador has no national institutional Muslim authority publishing a definitive preset. The fajr engine routes Ecuador to MWL 18°/17° per Muslim Pro and IslamicFinder convention for Quito and Guayaquil.

## Known points of ikhtilaf within the country
- None publicly documented.

## Open questions
- High-altitude consideration: Quito at ~2,850m has meaningful elevation effects on Shuruq/Maghrib (~2–3 minute shifts vs. sea-level calc — see [[wiki/corrections/elevation]]). fajr's `applyElevationCorrection` is opt-in.
- Equatorial latitude (0° at the country's namesake) — Ecuador may benefit from a higher Fajr angle (e.g., 20° as in Singapore/Malaysia/Indonesia equatorial convention) rather than MWL 18°. **Open question for institutional review** — the Centro Islámico del Ecuador has not published a divergent preset.

## Sources
- Aladhan API regional-default routing for `EC`
- Multi-app convention (Muslim Pro Quito)

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
