# North Macedonia — prayer-time conventions

## Institutional reference body
- **Name:** **Islamska Verska Zaednica vo Republika Severna Makedonija (IVZ-RM / Bashkësia Fetare Islame në Maqedoninë e Veriut)** — Islamic Religious Community of North Macedonia, Skopje-based; led by Reis-ul-Ulema
- **URL:** IVZ-RM: https://bim.mk/ ; daily prayer times via the BIM portal
- **Population served:** ~830,000 Muslims (~33-40% of North Macedonia's ~2.1M total — predominantly ethnic Albanian Muslims (the country's largest ethnic minority), Turkish-Macedonian, Bosniak, Roma Muslim, ethnic-Macedonian Muslim Torbeš communities)
- **Madhab(s):** Sunni Hanafi (universal across the major Muslim ethnic communities — Ottoman institutional inheritance via Skopje as a major Ottoman provincial center)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Hanafi institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
Aladhan API defaults North Macedonia (`MK`) to MWL. The IVZ-RM community is institutionally aligned with the broader Sunni Hanafi Balkan post-Ottoman tradition (Diyanet 18°/17° + Hanafi Asr would be institution-aligned, similar to Bosnia / Albania / Kosovo). fajr currently routes to MWL per Aladhan default; v1.6.3+ candidate for re-routing to Diyanet for ethnic-Albanian/Hanafi institutional consistency with Albania and Kosovo's existing Diyanet routing.

## Known points of ikhtilaf within the country
- **Ethnic-Albanian (Tetovo / Gostivar / Kičevo / Skopje)** — institutionally close to Albania's KMSH; Diyanet alignment would be consistent.
- **Turkish-Macedonian** — direct Diyanet institutional ties.
- **Bosniak** — institutional ties to BiH Rijaset (Diyanet-aligned).
- **Torbeš (ethnic-Macedonian Muslim)** — observe IVZ-RM convention.
- **Hanafi Asr** observed by all major Muslim ethnic communities; users may prefer manual `madhab: 'Hanafi'` override.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method for institutional consistency with neighboring Albania/Kosovo (which are already Diyanet-routed in fajr).

## Sources
- IVZ-RM: https://bim.mk/
- Aladhan API regional default for `MK` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
