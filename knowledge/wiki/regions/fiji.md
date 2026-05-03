# Fiji — prayer-time conventions

## Institutional reference body
- **Name:** **Fiji Muslim League (FML)** — Suva-based, founded 1926, the peak institutional body for Fijian Muslim affairs
- **URL:** Fiji Muslim League: https://fijimuslimleague.com/ (community portal)
- **Population served:** ~52,000–60,000 Muslims (~6% of Fiji's ~920,000 total — predominantly **Indian-Fijian** (Indo-Fijian) Hanafi community via 19th-century indentured-labor diaspora from Bihar / Uttar Pradesh; small modern Pakistani / Bangladeshi / Lebanese / Arab-origin diaspora; concentrated in Viti Levu (Suva, Lautoka, Ba), Vanua Levu)
- **Madhab(s):** Sunni Hanafi (Indian-origin majority); small Sunni Hanafi-Barelvi vs. Hanafi-Deobandi institutional sub-split; small Ahmadiyya community

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; FML Indian-origin Hanafi institutional alignment would suggest Karachi method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Fiji (`FJ`) to MWL. The Fiji Muslim League is institutionally aligned with the broader Indian-origin Hanafi convention via Pakistani / Indian institutional ties — **Karachi 18°/18° + Hanafi Asr** would be canonically institution-aligned. fajr's MWL routing follows the Aladhan default; v1.6.3+ candidate for re-routing.

## Known points of ikhtilaf within the country
- **FML Indian-origin Hanafi institutional convention** — Karachi alignment via Indian Ocean diaspora.
- **Hanafi-Barelvi vs. Hanafi-Deobandi** — institutional sub-split within Indo-Fijian Sunni community; methodologically similar.
- **Ahmadiyya community** — minority, separate institutional structure.

## Open questions
- v1.6.3+ candidate for re-routing to Karachi method per FML Indian-origin Hanafi institutional convention.

## Sources
- Fiji Muslim League: https://fijimuslimleague.com/
- Aladhan API regional default for `FJ` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
