# Zimbabwe — prayer-time conventions

## Institutional reference body
- **Name:** **Islamic Council of Zimbabwe (ICZ)** — Harare-based, the institutional body for Zimbabwean Muslim affairs
- **URL:** No consistent online presence
- **Population served:** ~100,000–200,000 Muslims (~1% of Zimbabwe's ~16M total — predominantly **Indian-origin** (Gujarati Memon Hanafi via post-1900 diaspora), plus Malawian-origin Yao / Tumbuka Shafi'i, Lebanese / Syrian-origin merchants, modern North African and Pakistani diaspora; concentrated in Harare, Bulawayo, Gweru, Mutare)
- **Madhab(s):** Sunni Hanafi (Indian-origin Memon majority — Karachi convention via Pakistani / Indian institutional ties); Sunni Shafi'i (Yao / Tumbuka heritage)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Indian-origin Memon Hanafi institutional alignment would suggest Karachi method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Zimbabwe (`ZW`) to MWL. The Indian-origin Memon Hanafi community is institutionally aligned with Karachi 18°/18°. fajr's MWL routing is the multi-app default; v1.6.3+ may revisit.

## Known points of ikhtilaf within the country
- **Indian-origin Memon Hanafi (Harare / Bulawayo)** — Karachi institutional alignment.
- **Yao / Tumbuka Shafi'i** — Swahili-coast MWL alignment.

## Open questions
- v1.6.3+ candidate for re-routing to Karachi method per Indian-origin Memon Hanafi institutional convention.

## Sources
- Aladhan API regional default for `ZW` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
