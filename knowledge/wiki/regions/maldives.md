# Maldives — prayer-time conventions

## Institutional reference body
- **Name:** Ministry of Islamic Affairs (Wizārat aš-Šuʾūn al-Islāmiyya / Islaamee Kanthahthakaa Behey Wuzaaraa)
- **URL:** https://www.islamicaffairs.gov.mv/
- **Population served:** ~530k (~100% Muslim — Islam is the state religion and a citizenship requirement)
- **Madhab:** Sunni Shafi'i (overwhelmingly)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Karachi` (18°/18°)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Hanafi (2× shadow) — *via the Karachi preset, which sets Hanafi Asr; this is a known mismatch since Maldives is Shafi'i*
- **Special offsets:** none
- **Classification:** 🟢 Established (Aladhan world default for Malé)

## Why this method
The Aladhan API's default for Malé is "Karachi" (method 1), and IslamicFinder/Muslim Pro multi-app consensus aligns with the same 18°/18° angle pair — note that the engine.js comment notes "Maldives Ministry of Islamic Affairs: Umm al-Qura per IslamicFinder/MuslimPro Malé default" but the **shipped code uses `Karachi`**. This is a comment-vs-code drift to flag for the engine team.

**Asr school caveat:** The Karachi method preset includes Hanafi Asr (2× shadow) but Maldives is overwhelmingly Shafi'i (Standard Asr, 1× shadow). This produces an Asr time ~30–60 minutes later than the Maldivian institutional convention. A future refinement should switch Maldives to `Other` with explicit `fajrAngle = 18°, ishaAngle = 18°, madhab = Standard` if Maldivian institutional Imsakiyya confirms Standard Asr.

## Known points of ikhtilaf within the country
- None known at the institutional level — Maldives is religiously homogeneous.

## Open questions
- **Engine.js comment-vs-code drift** — the engine.js comment mentions "Umm al-Qura per IslamicFinder/MuslimPro Malé default" but the shipped routing is `Karachi`. Either the comment or the code needs correction. Recommend: verify against the Maldives Ministry of Islamic Affairs published Imsakiyya, then update both comment and code consistently.
- **Asr school mismatch** — Karachi preset is Hanafi Asr; Maldives is Shafi'i (Standard Asr). Needs verification + fix.

## Sources
- Maldives Ministry of Islamic Affairs: https://www.islamicaffairs.gov.mv/
- Aladhan API regional-default routing for `MV`
- Multi-app convention (Muslim Pro Malé)

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
