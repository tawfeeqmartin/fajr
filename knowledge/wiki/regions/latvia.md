# Latvia — prayer-time conventions

## Institutional reference body
- **Name:** **Latvijas islāma kultūras centrs** (Latvian Islamic Cultural Centre, LIKC) — Riga-based, the primary institutional body for Latvia's Muslim community
- **URL:** LIKC: https://www.islam.lv/ (community portal)
- **Population served:** ~2,000–4,000 Muslims (~0.2% of Latvia's ~1.9M total — historic Lipka Tatar community (small remnant), plus modern diaspora — Russian / former-Soviet Muslim population, Turkish, Arab, Chechen)
- **Madhab(s):** Sunni Hanafi (historic Lipka Tatar inheritance, modern Tatar / Russian-Muslim diaspora)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°), with `TwilightAngle` high-latitude rule auto-applied at lat > 55°N (Latvia spans lat 55.7-58.1°N, so this rule applies country-wide)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** TwilightAngle high-latitude rule
- **Classification:** 🟡 Limited precedent

## Why this method
ECFR-aligned **MWL 18°/17°** is the European default; Aladhan API defaults Latvia (`LV`) to MWL. Latvia's high latitudes (Riga 56.95°N) require the TwilightAngle high-latitude rule, automatically applied by fajr.

## Known points of ikhtilaf within the country
- **Hanafi institutional inheritance** (Lipka Tatar / Russian-Muslim) — users may prefer manual `madhab: 'Hanafi'` override.
- **High-latitude convention** — Latvia is at the boundary where 18°/17° MWL is unstable in summer; TwilightAngle is the practical fallback.

## Sources
- LIKC: https://www.islam.lv/
- Aladhan API regional default for `LV` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- High-latitude conventions: `knowledge/wiki/regions/high-latitude.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
