# Maldives — prayer-time conventions

## Institutional reference body
- **Name:** Ministry of Islamic Affairs (Wizārat aš-Šuʾūn al-Islāmiyya / Islaamee Kanthahthakaa Behey Wuzaaraa)
- **URL:** https://www.islamicaffairs.gov.mv/
- **Population served:** ~530k (~100% Muslim — Islam is the state religion and a citizenship requirement)
- **Madhab:** Sunni Shafi'i (overwhelmingly)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Karachi` (18°/18°) with explicit `madhab = Madhab.Shafi`
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard (Shafi, 1× shadow length) — set explicitly in `selectMethod()` since v1.7.1
- **Special offsets:** none
- **Classification:** 🟡→🟢 Approaching established (Aladhan world default + multi-app convention; Ministry of Islamic Affairs primary-source citation pending)

## Why this method
The Aladhan API's default for Malé is method 1 (`Karachi`, "University of Islamic Sciences, Karachi"), with `school=STANDARD` (Shafi Asr) — verified via `https://api.aladhan.com/v1/timingsByCity?city=Male&country=Maldives` on 2026-05-02. IslamicFinder/Muslim Pro multi-app consensus aligns with the same 18°/18° angle pair + Shafi Asr.

**v1.7.1 fix (issue #26):** Earlier versions of this page and the engine.js comment mentioned "Umm al-Qura per IslamicFinder/MuslimPro Malé default" — that was incorrect; the actual Aladhan default is Karachi-angles, not Umm al-Qura. Both have been reconciled. The wiki claim that "Karachi preset includes Hanafi Asr (2× shadow)" was also incorrect — adhan-js's `CalculationMethod.Karachi()` returns `Madhab.Shafi` by default. The v1.7.1 fix sets madhab explicitly to defend against any future change in the upstream default.

## Known points of ikhtilaf within the country
- None known at the institutional level — Maldives is religiously homogeneous.

## Resolution log
- **2026-05-02 (v1.7.1)** — Asr-school open question resolved. adhan-js's `CalculationMethod.Karachi()` already defaults to `Madhab.Shafi`, so no behavior change for Malé Asr; the v1.7.1 fix made the Shafi madhab explicit in the dispatch and corrected the comment-vs-code drift. Aladhan default for Malé verified as method 1 (Karachi) + Standard Asr (Shafi).

## Sources
- Maldives Ministry of Islamic Affairs: https://www.islamicaffairs.gov.mv/
- Aladhan API regional-default routing for `MV` — verified 2026-05-02: `method=1 (Karachi, 18°/18°)`, `school=STANDARD (Shafi)`
- Multi-app convention (Muslim Pro Malé, IslamicFinder)

## Last reviewed
- 2026-05-02 by fajr-agent (v1.7.1 — Asr-school resolution per issue #26)
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
