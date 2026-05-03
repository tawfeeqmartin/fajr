# Laos — prayer-time conventions

## Institutional reference body
- **Name:** No formal national Muslim institutional body. **Vientiane Jamia Masjid** (Cham-affiliated, founded by Cham Muslims fleeing Cambodia in the 1970s) is the country's primary mosque and the institutional center for the small community
- **URL:** No consistent online presence
- **Population served:** ~1,000–10,000 Muslims (~0.01–0.1% of Laos' ~7.6M total — predominantly **Cham Muslim** refugees from Cambodia (post-1975 Khmer Rouge displacement), small Tai-Muslim community (Lao Sing Mun / Lao-Loei), and modern Pakistani / Bangladeshi / Malaysian-origin trader / migrant community; concentrated in Vientiane, Pakse)
- **Madhab(s):** Sunni Shafi'i (Cham institutional inheritance via SE Asian regional convention)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; SE Asia regional Singapore/MUIS would be institutionally aligned via Cham/Cambodian connection — flagged for v1.6.3)

## Why this method
Aladhan API defaults Laos (`LA`) to MWL. The Cham Muslim community has institutional and cultural-linguistic ties to Cambodia's Cham Muslim community (which fajr routes to Singapore method per SE Asia regional convention). Singapore/JAKIM 20°/18° would be more SE-Asia-institutionally aligned for Laos; the v1.6.2 proposal initially considered Singapore but reverted to MWL for Aladhan-alignment / ratchet stability. fajr's MWL routing follows the Aladhan default.

## Known points of ikhtilaf within the country
- **Cham community** — institutional ties to Cambodian Cham Muslim community.
- **Modern diaspora** — multi-madhab via origin practice.

## Open questions
- v1.6.3+ candidate for re-routing to Singapore/JAKIM method per SE Asia regional convention (consistent with Cambodia / proposed Vietnam routing).

## Sources
- Aladhan API regional default for `LA` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
