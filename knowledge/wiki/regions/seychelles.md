# Seychelles — prayer-time conventions

## Institutional reference body
- **Name:** **Seychelles Islamic Society** — Victoria-based community institutional body; **Mosquée Sheikh Khalifa Bin Zayed Al Nahyan** (UAE-funded, opened 2009)
- **URL:** No consistent online presence
- **Population served:** ~1,200–2,500 Muslims (~1.5% of Seychelles' ~100,000 total — predominantly **Indian-origin** (Gujarati / Memon Hanafi via Indian Ocean diaspora), small modern Pakistani / Egyptian / Lebanese / North African diaspora; concentrated on Mahé island)
- **Madhab(s):** Sunni Hanafi (Indian-origin majority)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Egyptian` (19.5°/17.5°)
- **Fajr angle:** 19.5°
- **Isha angle:** 17.5°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; East African Egyptian regional cluster despite Indian-origin Hanafi institutional inheritance)

## Why this method
Aladhan API defaults Seychelles (`SC`) to **Egyptian (19.5°/17.5°)**, reflecting the East African / Indian Ocean Egyptian-method regional cluster. Note that the Indian-origin Memon Hanafi community would be institutionally aligned with Karachi (similar to the Mauritius case); fajr's Egyptian routing follows the Aladhan default.

## Known points of ikhtilaf within the country
- **Indian-origin Memon Hanafi** — Karachi institutional alignment; users may prefer manual `method: 'Karachi'` and `madhab: 'Hanafi'` overrides.

## Open questions
- v1.6.3+ candidate for re-routing to Karachi method per Indian-origin Memon Hanafi institutional convention.

## Sources
- Aladhan API regional default for `SC` (Egyptian): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
