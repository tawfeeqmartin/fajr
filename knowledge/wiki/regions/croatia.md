# Croatia — prayer-time conventions

## Institutional reference body
- **Name:** **Mešihat Islamske zajednice u Hrvatskoj** — Mašihat (executive body) of the Islamic Community in Croatia, Zagreb-based; institutionally affiliated with the broader Bosnian Rijaset and follows the Islamic Community of BiH framework
- **URL:** Mešihat IZ u Hrvatskoj: https://www.islamska-zajednica.hr/ ; Zagreb Mosque (Croatian Islamic Centre): https://www.medzlis-zagreb.hr/
- **Population served:** ~63,000 Muslims (~1.5% of Croatia's ~3.9M total — predominantly Bosniak (the long-established core community via post-Ottoman / Yugoslav-era settlement), plus ethnic-Albanian, Turkish, recent Arab/Pakistani diaspora)
- **Madhab(s):** Sunni Hanafi (Bosniak and ethnic-Albanian heritage)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Bosniak/Diyanet institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Croatia (`HR`) to MWL. The Croatian Mešihat is institutionally affiliated with the Bosnian Rijaset (which uses Diyanet method per fajr's Bosnia routing). For institutional consistency with Bosnia, **Diyanet 18°/17° + Hanafi Asr** would be more institution-aligned. fajr currently routes Croatia to MWL per Aladhan default; v1.6.3+ candidate for re-routing to Diyanet for cross-border Bosniak institutional alignment.

## Known points of ikhtilaf within the country
- **Bosniak community core (Zagreb / Sisak / Rijeka / Pula)** — institutional ties to Bosnian Rijaset.
- **Hanafi Asr** observed by Bosniak / ethnic-Albanian communities; users may prefer manual `madhab: 'Hanafi'` override.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Bosniak institutional alignment (consistent with fajr's Bosnia routing).

## Sources
- Mešihat Islamske zajednice u Hrvatskoj: https://www.islamska-zajednica.hr/
- Medžlis Zagreb: https://www.medzlis-zagreb.hr/
- Aladhan API regional default for `HR` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
