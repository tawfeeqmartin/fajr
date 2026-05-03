# Thailand — prayer-time conventions

## Institutional reference body
- **Name:** Sheikhul Islam Office of Thailand (Chularajamontri / Chularatchamontri); Central Islamic Council of Thailand (CICOT); Provincial Islamic Council of Pattani (and Yala, Narathiwat)
- **URL:** CICOT: https://www.cicot.or.th/
- **Population served:** ~4M Muslims (~5% of Thailand), majority concentrated in the southern provinces of Pattani, Yala, Narathiwat (the historical Patani sultanate region) and Songkhla
- **Madhab:** Sunni Shafi'i (Malay Patani tradition, culturally and theologically aligned with Kelantan/Malaysia)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MWL` (Muslim World League, 18°/17°) — Aladhan world-default for `TH`
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard (Shafi) — adhan.js default
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; CICOT primary-source citation pending)

## Why this method
Thailand routes to MWL because:
- The Sheikhul Islam Office and CICOT are the national Sunni authority; CICOT's website (https://www.cicot.or.th/) does not publicly publish a calculation methodology on its site (verified 2026-05-03).
- Aladhan API regional-default for Thailand is MWL, which serves as the multi-app fallback documented across IslamicFinder, Muslim Pro, and other widely-used apps.
- The Pattani Malay-cultural Muslim community is closer in fiqh to Kelantan/Malaysia (JAKIM) than to Bangkok central Thai, but no provincial-specific institutional Imsakiyya was located in the v1.7.2 research pass.

## Known points of ikhtilaf within the country
- **Pattani / southern provinces** vs **Bangkok central** — the Patani sultanate region's Muslims may follow Kelantan-aligned 20°/18° JAKIM-style timing rather than the Bangkok-aligned MWL default. Provincial Islamic Councils of Pattani / Yala / Narathiwat exist as institutional bodies but their published Imsakiyya methodologies are not publicly accessible.
- **Cham / Thai-Cham minority** — small population in central Thailand, follows Cambodian-Cham regional pattern (closer to Singapore/MUIS).

## Open questions
- **Pattani — research not yet conclusive (v1.7.2 status):** The southern provinces of Pattani, Yala, and Narathiwat are the population centre of Thailand's Muslims. Cultural alignment with Kelantan / Malaysia suggests JAKIM 20°/18° may be the closer fit than MWL 18°/17°, but no Provincial Islamic Council of Pattani primary-source Imsakiyya was located. Some third-party apps (al-hamdoulillah.com) default Pattani to MWL 18°/17°; others (PrayerTimes.org via Mecca preset) default to Umm al-Qura 18.5°/90min. **No override shipped in v1.7.2.** Tracking: deeper data-hunt needed (Provincial Islamic Council Pattani direct contact, Mawaqit search for southern Thai mosques, Wayback Machine).
- CICOT primary-source citation pending — a published official methodology would resolve the Bangkok-vs-Pattani divergence question.

## Sources
- CICOT (Central Islamic Council of Thailand): https://www.cicot.or.th/
- Aladhan API regional-default routing for `TH`: https://aladhan.com/calculation-methods
- Sheikhul Islam (Chularajamontri) institutional context: https://institusiislamthai.wordpress.com/

## Last reviewed
- 2026-05-03 by fajr-agent (v1.7.2 initial creation; no Pattani override shipped pending primary source)
