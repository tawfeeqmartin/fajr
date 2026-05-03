# Botswana — prayer-time conventions

## Institutional reference body
- **Name:** **Botswana Muslim Association (BMA)** — Gaborone-based community institutional body
- **URL:** Botswana Muslim Association: https://botswanamuslims.org/ (community portal)
- **Population served:** ~10,000–20,000 Muslims (~0.5% of Botswana's ~2.6M total — predominantly **Indian-origin** Gujarati Memon Hanafi (via Indian Ocean diaspora through South Africa), Pakistani / Bangladeshi-origin diaspora, small Lebanese / Syrian merchant community; concentrated in Gaborone, Francistown, Lobatse, Selibe-Phikwe)
- **Madhab(s):** Sunni Hanafi (Indian / Pakistani-origin majority)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Indian-origin Memon Hanafi institutional alignment would suggest Karachi method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Botswana (`BW`) to MWL. The Indian-origin Memon Hanafi community is institutionally aligned with Karachi 18°/18°. fajr's MWL routing is the multi-app default; v1.6.3+ may revisit for the Hanafi-majority urban population (Gaborone, Francistown).

## Known points of ikhtilaf within the country
- **Indian-origin Memon Hanafi** — Karachi institutional alignment via Pakistani / Indian institutional ties.
- **Hanafi Asr** observed across the community.

## Open questions
- v1.6.3+ candidate for re-routing to Karachi method per Indian-origin Memon Hanafi institutional convention.

## Sources
- Botswana Muslim Association: https://botswanamuslims.org/
- Aladhan API regional default for `BW` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
