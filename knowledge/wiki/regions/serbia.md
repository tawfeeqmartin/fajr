# Serbia — prayer-time conventions

## Institutional reference body
- **Name:** **Islamska zajednica u Srbiji (IZS)** — Islamic Community in Serbia, Belgrade-based, led by Reis-ul-Ulema; **Islamska zajednica Srbije (IZ)** — a separate institutional body based in Novi Pazar / Sandžak. The two have a long-standing institutional split since 2007.
- **URL:** IZS Belgrade: https://www.izs-rs.com/ (institutional); IZ Sandžak (Novi Pazar): http://www.mesihat.org/
- **Population served:** ~280,000 Muslims (~4% of Serbia's ~6.7M total — concentrated in **Sandžak** region (Novi Pazar, Tutin, Sjenica, Prijepolje — Bosniak), Preševo Valley (ethnic Albanian), Vojvodina (small Muslim community), Belgrade (multi-ethnic urban community))
- **Madhab(s):** Sunni Hanafi (Bosniak Sandžak heritage and ethnic-Albanian Hanafi via Ottoman institutional inheritance)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Sandžak Bosniak Diyanet institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Serbia (`RS`) to MWL. The Sandžak Bosniak community (the largest sub-community) is institutionally aligned with the broader Bosnian Rijaset / Diyanet Hanafi convention. The Preševo-valley ethnic-Albanian Muslim community is institutionally aligned with Albania's KMSH (also Diyanet-aligned). Both sub-communities suggest Diyanet would be more institution-aligned; v1.6.3+ candidate for re-routing.

## Known points of ikhtilaf within the country
- **IZS (Belgrade) vs. IZ Sandžak (Novi Pazar)** — long-standing institutional split since 2007 over governance jurisdiction. Both publish similar Hanafi-aligned Imsakiyya methodologically.
- **Bosniak Sandžak vs. ethnic-Albanian Preševo Valley** — both Hanafi, institutionally similar.
- **Hanafi Asr** observed across major Muslim communities; users may prefer manual `madhab: 'Hanafi'` override.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Bosniak Sandžak / ethnic-Albanian Hanafi institutional convention.

## Sources
- Islamska zajednica u Srbiji: https://www.izs-rs.com/
- Mešihat (Islamska zajednica Sandžak): http://www.mesihat.org/
- Aladhan API regional default for `RS` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
