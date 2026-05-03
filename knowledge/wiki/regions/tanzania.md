# Tanzania — prayer-time conventions

## Institutional reference body
- **Name:** Baraza Kuu la Waislamu wa Tanzania (BAKWATA / National Muslim Council of Tanzania, mainland); Office of the Mufti and Chief Kadhi of Zanzibar
- **URL:** BAKWATA: https://bakwata.or.tz/ ; Zanzibar Mufti: not consistently online
- **Population served:** ~22M Muslims (~35% of Tanzania's ~65M mainland total; ~99% of Zanzibar's ~1.9M)
- **Madhab:** Sunni Shafi'i (overwhelmingly across both mainland and Zanzibar)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
This was a v1.6.0 classification-audit correction. Previously fajr routed Tanzania to `Egyptian` (19.5°/17.5°). The audit identified that BAKWATA's institutional convention is the **MWL 18°/17°** angle pair, consistent with the broader Swahili-coast Shafi'i regional convention (also used by Kenya-SUPKEM, Comoros). Dar es Salaam, Zanzibar Town, Arusha, Mwanza, and Mtwara default to MWL in Muslim Pro and IslamicFinder.

BAKWATA was established in 1968 as the supreme council coordinating mainland Tanzania Muslim activities; it is headquartered in Kinondoni (Dar es Salaam) with 22 regional and 169 district offices and ~3,000 sheikhs serving ~10,800 mosques.

## Known points of ikhtilaf within the country
- **Zanzibar separate institutions** — the Zanzibar Office of the Mufti, the Chief Kadhi, and the Commission of Endowments and Trust Property operate parallel to mainland BAKWATA. Both follow Shafi'i Standard Asr; no notable angle-pair difference.
- **Khoja Ismaili and Khoja Twelver communities** in Dar es Salaam, Zanzibar, Arusha — follow their own conventions; not currently differentiated in fajr.

## Open questions
- Primary-source citation from a BAKWATA-published Imsakiyya is pending.
- Should Zanzibar (which has its own Mufti) get a separate sub-routing?

## Sources
- BAKWATA: https://bakwata.or.tz/
- BAKWATA alternate site: https://www.bakwata.org/
- Aladhan API regional-default routing for `TZ`
- v1.6.0 classification audit: `autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
