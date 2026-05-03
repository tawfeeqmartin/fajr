# Kenya — prayer-time conventions

## Institutional reference body
- **Name:** Supreme Council of Kenya Muslims (SUPKEM)
- **URL:** https://supkem.org/
- **Population served:** ~5.5M Muslims (~11% of Kenya's ~55M total — concentrated in Coast and North-Eastern regions)
- **Madhab:** Sunni Shafi'i (overwhelmingly — Coast region traditional Swahili/Shirazi inheritance, plus Somali-origin communities in North-Eastern)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
This was a v1.6.0 classification-audit correction. Previously fajr routed Kenya to `Egyptian` (19.5°/17.5°). The audit identified that SUPKEM's institutional convention is the **MWL 18°/17°** angle pair, consistent with the broader Swahili-coast Shafi'i regional convention (also used by Tanzania-BAKWATA and Comoros). Mombasa, Nairobi, Garissa, Lamu, and Malindi default to MWL in Muslim Pro and IslamicFinder.

SUPKEM was established in 1973 as the umbrella body for Kenyan Muslim organisations and is headquartered at Qur'an House, Nairobi.

## Known points of ikhtilaf within the country
- **South Asian-origin communities** (Khoja, Bohra) in Nairobi/Mombasa — Twelver Shi'a / Bohra communities follow their own Jafari conventions; not currently differentiated in fajr.
- **Wahhabi-influenced movements (e.g., among Somali-origin communities)** — observe the same five-prayer angle convention.

## Open questions
- Primary-source citation from a SUPKEM-published Imsakiyya is pending; the v1.6.0 audit reasoning relies on multi-app consensus and the Shafi'i-coastal regional convention.

## Sources
- SUPKEM: https://supkem.org/
- SUPKEM about page: https://www.supkem.org/about-primary/who-we-are
- Aladhan API regional-default routing for `KE`
- v1.6.0 classification audit: `autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
