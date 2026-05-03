# Trinidad and Tobago — prayer-time conventions

## Institutional reference body
- **Name:** **Anjuman Sunnat-ul-Jamaat Association (ASJA)** — Trinidad-based, founded 1936, the largest institutional Muslim body for Indo-Trinidadian Sunni Hanafi affairs; **Trinidad Muslim League (TML)**; **Tackveeyatul Islamic Association (TIA)**; **Council of Imams of Trinidad and Tobago**
- **URL:** ASJA: https://www.asja.tt/ ; community portals
- **Population served:** ~95,000–105,000 Muslims (~7% of Trinidad and Tobago's ~1.4M total — predominantly **Indian-origin (Indo-Trinidadian)** Hanafi community via 19th-century indentured-labor diaspora from Bihar / Uttar Pradesh; small Afro-Trinidadian convert community; concentrated in Trinidad's central / southern districts (San Fernando, Princes Town, Couva, Penal-Debe))
- **Madhab(s):** Sunni Hanafi (Indian-origin majority); small Hanafi-Barelvi vs. Hanafi-Deobandi institutional sub-split (similar to Mauritius / Fiji); small Ahmadiyya community

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent — **deviation flagged for v1.6.3** (Aladhan-aligned default; ASJA Indian-origin Hanafi institutional alignment would canonically use Karachi)

## Why this method
Aladhan API defaults Trinidad and Tobago (`TT`) to MWL. **However, this is institutionally anomalous**: ASJA and the broader Indo-Trinidadian Hanafi community is institutionally aligned with **Karachi 18°/18° + Hanafi Asr (2× shadow)** via Pakistani / Indian institutional convention.

The MWL routing was preserved in v1.6.2 for Aladhan-alignment / ratchet stability; the deviation is **explicitly flagged** for v1.6.3 follow-up: re-route Trinidad and Tobago to Karachi if direct ASJA-published Imsakiyya becomes available.

## Known points of ikhtilaf within the country
- **ASJA Indian-origin Hanafi institutional convention** — Karachi alignment via Indian Ocean diaspora; users may prefer manual `method: 'Karachi'` and `madhab: 'Hanafi'` overrides.
- **TML (Trinidad Muslim League)** — separate Hanafi institutional structure.
- **TIA (Tackveeyatul Islamic Association)** — Hanafi-Barelvi institutional sub-community.

## Open questions
- **v1.6.3 candidate** for re-routing to Karachi method per ASJA Indian-origin Hanafi institutional convention.

## Sources
- Anjuman Sunnat-ul-Jamaat Association: https://www.asja.tt/
- Aladhan API regional default for `TT` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- v1.6.2 implementation log (deviation flag): `autoresearch/logs/2026-05-02-v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
