# Montenegro — prayer-time conventions

## Institutional reference body
- **Name:** **Islamska zajednica u Crnoj Gori** (Islamic Community of Montenegro / Bashkësia Islame e Malit të Zi) — Podgorica-based, the institutional Muslim body for Bosniak (~50% of Montenegrin Muslims) and ethnic-Albanian Muslim communities
- **URL:** Islamska zajednica u Crnoj Gori: https://monteislam.com/
- **Population served:** ~120,000 Muslims (~19% of Montenegro's ~620,000 total — concentrated in Sandžak / Pljevlja / Rožaje / Bijelo Polje / Plav (Bosniak), Ulcinj / Tuzi (ethnic Albanian))
- **Madhab(s):** Sunni Hanafi (Bosniak and ethnic-Albanian heritage via Ottoman institutional inheritance)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Sandžak Bosniak Diyanet institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
ECFR-aligned **MWL 18°/17°** is the European default; Aladhan API defaults Montenegro (`ME`) to MWL. The Sandžak Bosniak Hanafi community is institutionally aligned with the Bosnian Rijaset (which uses Diyanet method per fajr's Bosnia case). The ethnic-Albanian Muslim community (Ulcinj, Tuzi) is institutionally aligned with Albania's KMSH (which also uses Diyanet). Both sub-communities suggest **Diyanet** would be more institution-aligned than MWL; v1.6.3+ candidate for re-routing.

## Known points of ikhtilaf within the country
- **Sandžak Bosniak vs. ethnic-Albanian** sub-communities — both Hanafi; institutional governance via Islamska zajednica u Crnoj Gori covers both.
- **Hanafi Asr** observed by both major sub-communities; users may prefer manual `madhab: 'Hanafi'` override.
- **Cross-border Sandžak ikhtilaf** — Sandžak straddles Serbia/Montenegro border; Bosniak community is unitary across the border but governed by separate institutional bodies.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Sandžak Bosniak / ethnic-Albanian Hanafi institutional convention.

## Sources
- Islamska zajednica u Crnoj Gori: https://monteislam.com/
- Aladhan API regional default for `ME` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
