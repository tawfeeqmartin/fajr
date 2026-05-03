# Jordan — prayer-time conventions

## Institutional reference body
- **Name:** Ministry of Awqaf, Islamic Affairs and Holy Places (Wizārat al-Awqāf wa š-Šuʾūn wa l-Muqaddasāt al-Islāmiyya)
- **URL:** https://awqaf.gov.jo/
- **Population served:** ~11M (≈97% Muslim)
- **Madhab:** Sunni Shafi'i / Hanafi

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Other` with custom (`fajrAngle = 18°`, `ishaAngle = 18°`) plus `methodAdjustments.maghrib = +5`
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard
- **Special offsets:** Maghrib +5 min
- **Classification:** 🟢 Established (institutional preset)

## Why this method
The Jordanian Ministry of Awqaf publishes a national prayer-time calendar with the **18°/18° + Maghrib +5 min ihtiyati** convention. This corresponds to **Aladhan API method 23 ("Jordan")** which directly mirrors the Ministry's published angles and Maghrib offset. The Maghrib offset reflects a precaution buffer ensuring complete sun-disc clearance. Jordan is also the location of the canonical [Aabed (2015)](../methods/fajr-angle-empirics.md) naked-eye Fajr empirical study; the 18° Fajr is empirically validated at Jordanian latitudes.

## Known points of ikhtilaf within the country
- None known at the institutional level. The Ministry's national calendar is uniformly followed.

## Sources
- Jordanian Ministry of Awqaf: https://awqaf.gov.jo/
- Aladhan API method 23 (`Jordan`): https://aladhan.com/calculation-methods
- Aabed, A.M. (2015) — Jordan Journal for Islamic Studies, archived at `knowledge/raw/papers/2026-05-01-astronomycenter/aabed_2015_fajr_empirical.pdf`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
