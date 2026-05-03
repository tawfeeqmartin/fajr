# Azerbaijan — prayer-time conventions

## Institutional reference body
- **Name:** Caucasian Muslims Office / Qafqaz Müsəlmanları İdarəsi (QMİ)
- **URL:** https://qafqazislam.com/
- **Population served:** ~10M (≈97% Muslim; roughly 85% Twelver Shi'a, 15% Sunni Hanafi/Shafi'i in Lankaran/north)
- **Madhab:** Twelver Jafari (majority); Sunni Hanafi/Shafi'i (minority)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Tehran` (17.7°/14° + Maghrib +4.5 min + middle-of-night Isha fallback)
- **Fajr angle:** 17.7°
- **Isha angle:** 14°
- **Asr school:** Standard
- **Special offsets:** Maghrib +4.5 min (Jafari disappearance-of-redness convention)
- **Classification:** 🟡→🟢 Approaching established (Shia-majority institutional convention)

## Why this method
Azerbaijan's Muslim population is overwhelmingly **Twelver Shi'a** (~85%), making the **Jafari Maghrib timing** — sun must have visibly set and the redness in the eastern sky must have disappeared — the dominant institutional convention. The Tehran method (Aladhan method 7) numerically matches this with its 17.7°/14° angle pair plus a +4.5 min Maghrib offset. The Caucasian Muslims Office (QMİ) led by Sheikh-ul-Islam Allahshukur Pashazadeh (in office since 1980) is the institutional authority across the South Caucasus and Russian North Caucasus republics.

This was a v1.6.0 classification-audit correction: Azerbaijan was previously routed to `Turkey` (Diyanet) on the assumption of Turkic-cultural alignment; the correct routing is `Tehran` reflecting the Shi'a-majority institutional reality.

## Known points of ikhtilaf within the country
- **Sunni minority (~15%) in Lankaran and northern Azerbaijan** follows Diyanet 18°/17° + Hanafi Asr; Tehran method does not match their convention.
- v1.7.0 follow-up: city-override for Lankaran/Astara/Quba to route to Diyanet method.

## Open questions
- A v1.7.0 city-override list for Sunni-majority municipalities is planned per the v1.6.0 audit log.

## Sources
- Caucasian Muslims Office: https://qafqazislam.com/
- Sheikh-ul-Islam Allahshukur Pashazadeh biographical page: https://qafqazislam.com/index.php?lang=en&sectionid=9
- Aladhan API method 7 (`Tehran`): https://aladhan.com/calculation-methods
- v1.6.0 classification audit: `autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
