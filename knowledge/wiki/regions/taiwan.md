# Taiwan — prayer-time conventions

## Institutional reference body
- **Name:** **Chinese Muslim Association (CMA / 中國回教協會, Zhōngguó Huíjiào Xiéhuì)** — Taipei-based, founded 1938 in Republican China and re-established in Taiwan post-1949; the peak institutional body for Taiwanese Muslim affairs
- **URL:** Chinese Muslim Association: https://www.cmainroc.org.tw/ (institutional)
- **Population served:** ~60,000–280,000 Muslims (~0.3–1.2% of Taiwan's ~23M total — historic **Hui Muslim** community (Mandarin-speaking, post-1949 immigration from mainland China, ~60,000), plus large modern Indonesian and Filipino migrant-worker community (~150,000+ during peak migration, mostly temporary), plus Pakistani / Bangladeshi / Malaysian / Egyptian / Turkish-origin diaspora; concentrated in Taipei, Kaohsiung, Taichung)
- **Madhab(s):** Sunni Hanafi (Hui Mandarin-speaking community via Central Asian / Silk Road institutional inheritance); Sunni Shafi'i (Indonesian migrant majority); Sunni multi-madhab (other diaspora)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Taiwan (`TW`) to MWL. CMA operates the Taipei Grand Mosque (the oldest and largest mosque in Taiwan, opened 1960) and publishes prayer schedules consistent with MWL angles. The Indonesian migrant-worker community follows JAKIM/Singapore convention via family/origin practice.

## Known points of ikhtilaf within the country
- **Hui Hanafi institutional inheritance** — users may prefer manual `madhab: 'Hanafi'` override.
- **Indonesian migrant community** — institutional ties to Indonesian KEMENAG / JAKIM convention.

## Open questions
- Citation pending — currently MWL Aladhan-aligned per v1.6.2 audit.

## Sources
- Chinese Muslim Association: https://www.cmainroc.org.tw/
- Aladhan API regional default for `TW` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
