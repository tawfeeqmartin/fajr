# Zambia — prayer-time conventions

## Institutional reference body
- **Name:** **Islamic Council of Zambia (ICZ)** — Lusaka-based, the institutional body for Zambian Muslim affairs
- **URL:** No consistent online presence
- **Population served:** ~150,000–300,000 Muslims (~1–2% of Zambia's ~21M total — predominantly **Indian-origin** (Gujarati Memon / Bohra Hanafi via the post-1900 Indian Ocean diaspora into the Copperbelt), plus Yao / Tumbuka ethnic-Muslim communities (eastern Zambia, Swahili-coast institutional inheritance), Lebanese-origin merchants; concentrated in Lusaka, Ndola, Kitwe, Livingstone, Eastern Province)
- **Madhab(s):** Sunni Hanafi (Indian-origin Memon majority — Karachi convention via Pakistani / Indian institutional ties); Sunni Shafi'i (eastern Yao / Tumbuka, Swahili-coast inheritance)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Indian-origin Memon Hanafi institutional alignment would suggest Karachi method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Zambia (`ZM`) to MWL. The Indian-origin Memon Hanafi community is institutionally aligned with Karachi 18°/18° via Pakistani / Indian institutional ties. The eastern Yao / Tumbuka Shafi'i community is aligned with the broader East African MWL convention via Tanzania / Mozambique. fajr's MWL routing is the multi-app default; v1.6.3+ may revisit for Indian-origin Hanafi-majority urban population centers (Lusaka, Ndola, Kitwe).

## Known points of ikhtilaf within the country
- **Indian-origin Memon Hanafi (Lusaka / Copperbelt urban centers)** — Karachi institutional alignment via Indian Ocean diaspora; users may prefer manual `method: 'Karachi'` and `madhab: 'Hanafi'` overrides.
- **Yao / Tumbuka Shafi'i (eastern Zambia)** — Standard Asr; methodological alignment with broader Swahili-coast MWL.

## Open questions
- v1.6.3+ candidate for re-routing to Karachi method per Indian-origin Memon Hanafi institutional convention (especially for urban centers).

## Sources
- Aladhan API regional default for `ZM` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
