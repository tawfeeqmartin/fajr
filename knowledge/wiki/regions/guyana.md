# Guyana — prayer-time conventions

## Institutional reference body
- **Name:** **Central Islamic Organisation of Guyana (CIOG)** — Georgetown-based, founded 1979, the peak institutional body for Guyanese Muslim affairs; **Guyana Islamic Trust**; **Anjuman Hifazatul Islam Guyana**
- **URL:** CIOG: https://www.ciog.org.gy/ ; community portal
- **Population served:** ~50,000–100,000 Muslims (~6–13% of Guyana's ~800,000 total — predominantly **Indian-origin (Indo-Guyanese) Hanafi** community via 19th-century indentured-labor diaspora from Bihar / Uttar Pradesh; small modern Pakistani / Bangladeshi / Lebanese / Arab-origin diaspora; concentrated in Georgetown, Berbice, Demerara, Essequibo)
- **Madhab(s):** Sunni Hanafi (Indian-origin majority via Pakistani / Indian institutional ties)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent — **deviation flagged for v1.6.3** (Aladhan-aligned default; CIOG Indian-origin Hanafi institutional alignment would canonically use Karachi)

## Why this method
Aladhan API defaults Guyana (`GY`) to MWL. **However, this is institutionally anomalous**: the Indo-Guyanese Hanafi community is institutionally aligned with **Karachi 18°/18° + Hanafi Asr (2× shadow)** via Pakistani / Indian institutional convention.

The MWL routing was preserved in v1.6.2 for Aladhan-alignment / ratchet stability; the deviation is **explicitly flagged** for v1.6.3 follow-up: re-route Guyana to Karachi if direct CIOG-published Imsakiyya becomes available.

## Known points of ikhtilaf within the country
- **CIOG Indian-origin Hanafi institutional convention** — Karachi alignment via Indian Ocean diaspora; users may prefer manual `method: 'Karachi'` and `madhab: 'Hanafi'` overrides.
- **Anjuman Hifazatul Islam Guyana** — Hanafi-Barelvi institutional sub-community.

## Open questions
- **v1.6.3 candidate** for re-routing to Karachi method per CIOG Indian-origin Hanafi institutional convention. The current MWL routing is acknowledged as Aladhan-aligned-default rather than institution-aligned.

## Sources
- Central Islamic Organisation of Guyana: https://www.ciog.org.gy/
- Aladhan API regional default for `GY` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- v1.6.2 implementation log (deviation flag): `autoresearch/logs/2026-05-02-v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
