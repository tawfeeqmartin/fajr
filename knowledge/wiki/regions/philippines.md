# Philippines — prayer-time conventions

## Institutional reference body
- **Name:** Bangsamoro Darul-Ifta' (BDI-BARMM); National Commission on Muslim Filipinos (NCMF)
- **URL:** BDI-BARMM: https://bdi.bangsamoro.gov.ph/ ; NCMF: https://ncmf.gov.ph/
- **Population served:** ~6M Muslims (~6% of Philippines), concentrated in the Bangsamoro Autonomous Region in Muslim Mindanao (BARMM) — Maguindanao, Lanao del Sur, Basilan, Sulu, Tawi-Tawi
- **Madhab:** Sunni Shafi'i (Maguindanaon, Maranao, Tausug, Yakan, Sama traditions; per Islam in the Philippines literature: "Most Muslim Filipinos practice Sunni Islam according to the Shafi'i school")

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MWL` (Muslim World League, 18°/17°) — Aladhan world-default for `PH`
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard (Shafi) — adhan.js default; matches the Bangsamoro Sunni Shafi'i tradition
- **Special offsets:** none
- **Classification:** 🟡→🟢 Approaching established (Aladhan-aligned default; BDI-BARMM institutional citation now active for v1.7.2 city-overrides Cotabato + Marawi)

## Why this method
Philippines routes to MWL because:
- The Bangsamoro Autonomous Region (BARMM) and the rest of the Filipino Muslim community follow Sunni Shafi'i fiqh.
- BDI-BARMM (Bangsamoro Darul-Ifta') is the institutional fatwa authority for the autonomous region, including Ramadan moon-sighting determinations. Its published timetables align with the MWL 18°/17° + Shafi Asr convention.
- Aladhan API regional-default for Philippines is MWL — multi-app fallback consistent with adhan.js Shafi'i-default Asr.

## Known points of ikhtilaf within the country
- **Bangsamoro / BARMM** (Maguindanao, Lanao del Sur, Basilan, Sulu, Tawi-Tawi) — uniformly Sunni Shafi'i, BDI-BARMM is the dominant institutional authority.
- **Manila / Luzon Muslim diaspora** — smaller population, NCMF Manila offices are the principal institutional reference. Some ISNA-style 15°/15° usage observed in third-party apps (Muslim Pro), reflecting North America-influenced compromise practice — surfaced via altMethods on the Cotabato/Marawi overrides.

## City-level overrides (active in fajr v1.7.x)
- **Cotabato** (Maguindanao del Norte, BARMM seat) → MWL 18°/17° + Shafi Asr (BDI-BARMM institutional traceability)
- **Marawi** (Lanao del Sur, BARMM Maranao centre) → MWL 18°/17° + Shafi Asr (BDI-BARMM institutional traceability)

These overrides do not change the calculation result vs. country-default — they exist for explicit per-city institutional traceability (same pattern as Bradford / Sarajevo) and to surface BDI-BARMM as the source institution rather than the generic Aladhan/MWL fallback.

## Open questions
- BDI-BARMM does not currently publish a calculation-methodology page on its website. The institutional citation rests on its role as the BARMM fatwa-issuing body; primary-source angle documentation would strengthen the override classification from 🟡→🟢 to 🟢.
- NCMF Manila-aligned 15°/15° ISNA-style timing: minority practice in some diaspora apps. v1.8.0+ could add a Manila city-override if institutional documentation surfaces.

## Sources
- BDI-BARMM (Bangsamoro Darul-Ifta'): https://bdi.bangsamoro.gov.ph/
- BARMM Official Website: https://bangsamoro.gov.ph/ (Ramadan moon-sighting announcements)
- NCMF: https://ncmf.gov.ph/
- Aladhan API regional-default routing for `PH`: https://aladhan.com/calculation-methods

## Last reviewed
- 2026-05-03 by fajr-agent (v1.7.2 initial creation; Cotabato + Marawi city-overrides shipped)
