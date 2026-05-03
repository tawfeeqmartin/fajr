# Estonia — prayer-time conventions

## Institutional reference body
- **Name:** **Eesti Islami Kogudus** (Estonian Islamic Congregation) — Tallinn-based, state-recognized; the **Eesti Muftiaat** (Mufti's Office of Estonia)
- **URL:** Eesti Islami Kogudus: https://islam.ee/ (community portal)
- **Population served:** ~2,000–3,000 Muslims (~0.2% of Estonia's ~1.4M total — Volga Tatar / Bashkir community (continuous presence since Imperial Russian period), modern diaspora — Turkish, Arab, Chechen, Pakistani-origin)
- **Madhab(s):** Sunni Hanafi (Tatar / Bashkir / Volga heritage majority)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°), with `TwilightAngle` high-latitude rule auto-applied at lat > 55°N (Estonia spans lat 57.5-59.7°N, so this rule applies country-wide)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** TwilightAngle high-latitude rule
- **Classification:** 🟡 Limited precedent

## Why this method
ECFR-aligned **MWL 18°/17°** is the European default; Aladhan API defaults Estonia (`EE`) to MWL. Estonia's high latitudes (Tallinn 59.4°N) require the TwilightAngle high-latitude rule. The Tatar/Bashkir Hanafi institutional inheritance suggests Diyanet might be more institution-aligned, but MWL is the documented Aladhan default.

## Known points of ikhtilaf within the country
- **Hanafi institutional convention** (Tatar / Bashkir / Volga heritage) — users may prefer manual `madhab: 'Hanafi'` override.
- **High-latitude convention** — TwilightAngle is the practical fallback for summer months.

## Sources
- Eesti Islami Kogudus: https://islam.ee/
- Aladhan API regional default for `EE` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- High-latitude conventions: `knowledge/wiki/regions/high-latitude.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
