# Mauritius — prayer-time conventions

## Institutional reference body
- **Name:** **Jamiat-Ul-Ulama Mauritius (JUM)** — the institutional body for Mauritian Sunni Muslim affairs, **Hanafi-Deobandi** orientation; **Sunni Razvi Society of Mauritius** (Hanafi-Barelvi orientation, separate institutional structure); plus the smaller **Bohra**, **Shi'a**, and **Ahmadiyya** institutional communities
- **URL:** JUM: https://jum.mu/ ; Mauritius Sunni Razvi Society: separate institutional structure
- **Population served:** ~210,000 Muslims (~16.6% of Mauritius' ~1.27M total — predominantly **Indian-origin Hanafi** community via 19th-century indentured-labor / merchant diaspora from Gujarat / Bihar / Uttar Pradesh; mixed Sunni Hanafi-Deobandi (JUM-aligned), Hanafi-Barelvi (Razvi-aligned), and minority Bohra / Shi'a / Ahmadiyya)
- **Madhab(s):** Sunni Hanafi (overwhelming majority via Indian-origin Deobandi / Barelvi institutional inheritance)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Egyptian` (19.5°/17.5°)
- **Fajr angle:** 19.5°
- **Isha angle:** 17.5°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent — **deviation flagged for v1.6.3** (Aladhan-aligned default; JUM Hanafi-Deobandi institutional alignment would canonically use Karachi)

## Why this method
Aladhan API defaults Mauritius (`MU`) to **Egyptian (19.5°/17.5°)**, reflecting the East African / Indian Ocean Egyptian-method regional cluster. **However, this is institutionally anomalous**: Mauritius' Muslim community is overwhelmingly Indian-origin Hanafi (JUM is Hanafi-Deobandi), where **Karachi 18°/18° + Hanafi Asr (2× shadow)** would be the canonical institutional alignment via Pakistani / Indian institutional convention.

The Egyptian routing was preserved in v1.6.2 for Aladhan-alignment / ratchet stability; the deviation is **explicitly flagged** in `src/engine.js` with a v1.6.3 follow-up: re-route Mauritius to Karachi if direct JUM-published Imsakiyya becomes available for primary-source verification.

This case is one of the most prominent **institutional-vs-Aladhan-default mismatches** in fajr's v1.6.2 dispatch.

## Known points of ikhtilaf within the country
- **JUM (Hanafi-Deobandi)** — the institutional majority; would canonically use Karachi 18°/18° + Hanafi Asr.
- **Sunni Razvi Society (Hanafi-Barelvi)** — separate institutional structure; methodologically also Hanafi.
- **Bohra / Shi'a / Ahmadiyya** — minority institutional communities; observe distinct prayer-time conventions.

## Open questions
- **Critical: v1.6.3 candidate** for re-routing to Karachi method per JUM Hanafi-Deobandi institutional convention. The current Egyptian routing is acknowledged as Aladhan-aligned-default rather than institution-aligned. Direct JUM-published Imsakiyya should be obtained for primary-source verification.

## Sources
- Jamiat-Ul-Ulama Mauritius: https://jum.mu/
- Aladhan API regional default for `MU` (Egyptian): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- v1.6.2 implementation log (deviation flag): `autoresearch/logs/2026-05-02-v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
