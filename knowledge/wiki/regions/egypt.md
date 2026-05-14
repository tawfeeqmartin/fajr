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

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (Egyptian Awqaf Ministry timetables historically use Shafi'i / 1× shadow; the institutional convention is Standard despite Al-Azhar's administrative Hanafi affiliation)
- `applied.asrSchool` returns `'standard'`

The Asr-school choice — Shafi'i (Standard, 1× shadow) — is the historical Egyptian Awqaf institutional convention, reflecting the broader Shafi'i-historical population pattern. Al-Azhar's administrative madhab is Hanafi, but Al-Azhar teaches all four Sunni madhabs and its Awqaf-Ministry-published timetables use Standard Asr. Hanafi-observant individuals who want 2× shadow Asr override explicitly via `madhab: 'hanafi'`. The country-default `asrConvention` correctly surfaces "Egypt is institutionally Shafi'i-Standard for prayer-time publication" without silently mutating the calculation.

## Institutional ground truth in fajr's eval corpus

**v1.8.1 update (2026-05-14):** fajr now has a **real Egyptian General Authority of Survey institutional fixture** in the eval corpus, captured directly from https://www.esa.gov.eg/ via the server-side-rendered prayer-time portal. The fetcher is at `scripts/fetch-egypt-esa.js`; the fixture at `eval/data/test/egypt-esa.json`.

- **Coverage:** 15 cities × 1 day (initial single-day snapshot; daily snapshots accumulating via `.github/workflows/egypt-esa-snapshot.yml`)
- **Agreement:** fajr matches the ESA institutional publication at **WMAE 0.68 min** across Fajr/Shuruq/Dhuhr/Asr/Maghrib/Isha — sub-minute agreement validates the `Egyptian` preset dispatch.

This makes Egypt one of the few countries with **institutional-direct ground truth** in fajr's eval corpus (alongside Diyanet for Türkiye, KEMENAG for Indonesia, JAKIM for Malaysia, MUIS for Singapore, Habous for Morocco). Per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria), this lifts Egypt's confidence grade.

## Known points of ikhtilaf within the country

- **Asr school: Shafi'i vs Hanafi.** Egypt's Awqaf Ministry timetables use Shafi'i (1× shadow). Hanafi-administered institutions (some Al-Azhar-affiliated functions, Hanafi-affiliated mosques in Cairo's older quarters) may use Hanafi (2× shadow) in their internal scheduling. Differences run ~30–60 min in Asr. fajr's default is Shafi'i (Standard); Hanafi users override with `madhab: 'hanafi'`.
- **No Egyptian Sufi or Shia internal differences** at the institutional-publishing level — Egypt is institutionally monolithic on prayer-time methodology.
- **EGSA vs Awqaf Ministry vs Dar al-Ifta:** all three Egyptian institutions converge on the 19.5°/17.5° angle pair + Standard Asr; the institutional-precedent for the convention is therefore strongly multi-source institutional, not merely calendrical.

## City-level overrides

None at city level for Egypt. The country-default `Egyptian` dispatch handles Cairo, Alexandria, Giza, Shubra El-Kheima, Port Said, Suez, Mansoura, Tanta, and all major Egyptian coordinates correctly per the v1.8.1 ESA fixture's 15-city agreement.

## Open questions / outstanding work

- **Daily ESA snapshots accumulating** — `.github/workflows/egypt-esa-snapshot.yml` captures fresh ESA times daily into `fixtures/egypt-esa/daily/` via review PRs. Once accumulated to ≥30 days × 15 cities (~450 rows), promotion from single-day to multi-day institutional fixture lifts Egypt's confidence grade from B → A per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria).
- **Provincial granularity** — Egypt's 27 governorates may publish slight per-governorate adjustments via the Awqaf Ministry's regional structures. ESA's single 15-city fixture covers the major governorate capitals; per-governorate variation is not yet surfaced.
- **Hanafi-Asr `notes[]` advisory** — for Egyptian coordinates, a `notes[]` advisory could surface the Shafi'i-vs-Hanafi Asr ikhtilaf with the explicit recommendation that Hanafi users override. Open follow-up; analogous to the Türkiye Hanafi-Asr metadata pattern.
- **Pre-2014 EGSA tables vs post-2014 administrative restructuring** — the EGSA convention is empirically stable but the institutional structure of the Awqaf Ministry has shifted post-2014; documenting the institutional continuity is open follow-up.

## Sources

- Egyptian General Authority of Survey: https://www.esa.gov.eg/
- Dar al-Ifta al-Misriyya: https://www.dar-alifta.org/
- Egyptian Ministry of Awqaf: https://www.awkaf.gov.eg/
- Aladhan API method 5 (`Egyptian`): https://aladhan.com/calculation-methods
- adhan.js `CalculationMethod.Egyptian()` source
- ESA institutional fixture (v1.8.1): `eval/data/test/egypt-esa.json`
- Daily ESA snapshot workflow: `.github/workflows/egypt-esa-snapshot.yml`
- ESA fetcher (v1.8.1): `scripts/fetch-egypt-esa.js`

## Last reviewed

- 2026-05-14 by fajr-claude (deepening + v1.8.1 ESA institutional fixture annotation)
- 2026-05-03 by fajr-agent (initial creation per v1.7.9 docs regen sweep — closing the gap flagged in #57 audit)
