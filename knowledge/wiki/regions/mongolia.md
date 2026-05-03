# Mongolia — prayer-time conventions

## Institutional reference body
- **Name:** **Mongolian Muslim Society / Bayan-Ölgii Kazakh Muslim community institutional body** — community institutional structure, not state-formalized via a single peak body
- **URL:** No consistent online presence
- **Population served:** ~80,000–120,000 Muslims (~3% of Mongolia's ~3.4M total — predominantly **ethnic Kazakh** community in Bayan-Ölgii Province (the westernmost Mongolian province, ~90,000 ethnic-Kazakh residents), small Turkic / Tatar minority elsewhere; concentrated in Ölgii (the provincial capital), Ulaanbaatar (small modern diaspora))
- **Madhab(s):** Sunni Hanafi (Kazakh institutional inheritance via Central Asian / former-Silk-Road Hanafi convention)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MoonsightingCommittee` (18°/18° + seasonal Shafaq adjustment + high-latitude support)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard
- **Special offsets:** Moonsighting Committee seasonal Shafaq adjustment for high-latitude winter
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Mongolia (`MN`) to **method 14 (Moonsighting Committee Worldwide)**, reflecting the practical need for Shafaq-general high-latitude support — Bayan-Ölgii (~48-50°N) and Ulaanbaatar (~47.9°N) require seasonal adjustment. The Hanafi institutional inheritance would suggest Karachi or Diyanet methodologically; Moonsighting is preferred for the high-latitude support.

## Known points of ikhtilaf within the country
- **Kazakh Bayan-Ölgii community** — institutional ties to Kazakhstan's DUMK Hanafi convention; users may prefer manual `madhab: 'Hanafi'` override.

## Open questions
- Citation pending — currently Aladhan-aligned per v1.6.2 audit.

## Sources
- Aladhan API regional default for `MN` (MoonsightingCommittee): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
