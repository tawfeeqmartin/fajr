# Egypt — prayer-time conventions

## Institutional reference body
- **Name:** Egyptian General Authority of Survey (EGSA / Hay'at al-Misaha al-Misriyya, الهيئة المصرية العامة للمساحة)
- **Secondary authority:** Dar al-Ifta al-Misriyya (دار الإفتاء المصرية) — the state fatwa body — and the Ministry of Awqaf (وزارة الأوقاف) for prayer-time governance.
- **URL:** EGSA: https://www.esa.gov.eg/ ; Dar al-Ifta: https://www.dar-alifta.org/ ; Awqaf: https://www.awkaf.gov.eg/
- **Population served:** ~98M Muslims (~94% of Egypt's ~104M total — Sunni-majority with a Coptic Christian minority; Egypt is a religiously identifying-Muslim state with Islam as the state religion per Article 2 of the constitution).
- **Madhab:** Sunni Shafi'i historically dominant; Hanafi institutionally dominant since the Ottoman period (Al-Azhar's official madhab in administration, though Al-Azhar teaches all four Sunni madhabs); Maliki and Hanbali minorities present.

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Egyptian` (`CalculationMethod.Egyptian()`) — corresponds to **Aladhan API method 5**
- **Fajr angle:** 19.5°
- **Isha angle:** 17.5°
- **Asr school:** Standard (Shafi'i — 1× shadow)
- **Special offsets:** none
- **Classification:** 🟢 Established (institutional preset; EGSA is the named originating authority of the angle pair globally adopted as the "Egyptian" convention)

## Why this method
The 19.5°/17.5° pair is the **EGSA convention**, adopted from Egypt's national surveying authority and used historically by EGSA's published *Taqwim* (calendar) and the Egyptian Awqaf Ministry's official timetables. The angle pair is named "Egyptian" in adhan.js, Aladhan, and PrayTimes.org because EGSA is the originating institution — making the alignment between fajr's dispatch and Egypt's published reality direct.

The Asr school choice is **Shafi'i (Standard)** — although Al-Azhar's administrative madhab is Hanafi, the Egyptian Awqaf Ministry's published timetables historically use Shafi'i (Standard) Asr (1× shadow), reflecting the broader Shafi'i-historical population pattern. This is an open point of internal review; some Egyptian community-level publications use Hanafi Asr (e.g. for Hanafi-affiliated mosques in Cairo's older quarters). For now fajr follows the institutional convention of EGSA + Awqaf Ministry timetables.

## Known points of ikhtilaf within the country
- **Asr school: Shafi'i vs Hanafi.** Egypt's Awqaf Ministry timetables use Shafi'i (1× shadow). Hanafi-administered institutions (some Al-Azhar-affiliated functions) may use Hanafi (2× shadow) in their internal scheduling. Differences run ~30–60 min in Asr. fajr's default is Shafi'i; Hanafi users can override with `madhab: 'hanafi'`.
- **No Egyptian Sufi or Shia internal differences** at the institutional-publishing level.

## Sources
- Egyptian General Authority of Survey: https://www.esa.gov.eg/
- Dar al-Ifta al-Misriyya: https://www.dar-alifta.org/
- Egyptian Ministry of Awqaf: https://www.awkaf.gov.eg/
- Aladhan API method 5 (`Egyptian`): https://aladhan.com/calculation-methods
- adhan.js `CalculationMethod.Egyptian()` source

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.7.9 docs regen sweep — closing the gap flagged in #57 audit)
