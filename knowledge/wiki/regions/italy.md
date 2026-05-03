# Italy — prayer-time conventions

## Institutional reference body
- **Name:** **UCOII** (Unione delle Comunità Islamiche d'Italia / Union of Islamic Communities of Italy); **Centro Islamico Culturale d'Italia** (Grande Moschea di Roma — King Faisal-funded, Saudi institutional alignment); **CO.RE.IS Italiana** (Comunità Religiosa Islamica Italiana); **Lega Musulmana Mondiale Italia**
- **URL:** UCOII: https://www.ucoii.it/ ; Grande Moschea di Roma: https://www.centroislamico.it/ ; CO.RE.IS: https://www.coreis.it/
- **Population served:** ~2.7M Muslims (~4.5% of Italy's ~59M total — predominantly Moroccan, Albanian, Egyptian, Bangladeshi, Pakistani, Senegalese, Tunisian-origin communities; concentrated in Lombardy, Emilia-Romagna, Veneto, Lazio, Sicily)
- **Madhab(s):** Sunni Maliki (Moroccan / Tunisian / Senegalese majority); Sunni Hanafi (Albanian / Bangladeshi / Pakistani-origin); Sunni Shafi'i (Egyptian Yemeni-origin); small Twelver Shi'a community

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡→🟢 Approaching established

## Why this method
The Italian Muslim community is institutionally fragmented (no formal state-recognized Intesa concordat with any Muslim institution as of 2026), but **UCOII** — the largest umbrella organization with ~150 affiliated mosques — endorses the **MWL 18°/17°** convention via **European Council for Fatwa and Research (ECFR)** alignment. The Grande Moschea di Roma also publishes Imsakiyya consistent with MWL angles. Aladhan API defaults Italy (`IT`) to MWL.

## Known points of ikhtilaf within the country
- **UCOII vs. Grande Moschea di Roma** — both publish MWL-aligned Imsakiyya; institutional differences are governance, not method.
- **Diaspora madhab variance** — Maliki-majority North African communities use Standard Asr (1× shadow); Albanian Hanafi communities use Hanafi Asr (2× shadow). fajr's country default is Standard Asr; users at Albanian-majority mosques may prefer manual `madhab: 'Hanafi'` override.
- **Sicily** historically had significant Muslim institutional presence (Norman / Hauteville period via Arab heritage); contemporary Sicilian Muslim communities follow modern Italian institutional structure.

## Sources
- UCOII: https://www.ucoii.it/
- Grande Moschea di Roma: https://www.centroislamico.it/
- European Council for Fatwa and Research: https://www.e-cfr.org/
- Aladhan API regional default for `IT` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
