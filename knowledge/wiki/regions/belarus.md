# Belarus — prayer-time conventions

## Institutional reference body
- **Name:** **Muslim Religious Association in the Republic of Belarus** (Muslimanskaye relihiynaye ab'yednanne / Мусульманскае рэлігійнае аб'яднанне ў Рэспубліцы Беларусь) — Minsk-based, state-recognized institutional body for the historic **Lipka Tatar** Muslim community continuously present in Belarus since the 14th century
- **URL:** Muslim Religious Association: https://muslim.by/ (community portal)
- **Population served:** ~25,000 Muslims (~0.3% of Belarus' ~9M total — predominantly historic **Lipka Tatar** community (Belarusian Tatar) in Iwie / Slonim / Navagrudak / Hrodna / Minsk; modern Caucasus and Arab diaspora)
- **Madhab(s):** Sunni Hanafi (Lipka Tatar Hanafi institutional inheritance via Grand Duchy of Lithuania / Crimean Khanate Ottoman period)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Lipka Tatar Hanafi institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
ECFR-aligned **MWL 18°/17°** is the European default; Aladhan API defaults Belarus (`BY`) to MWL. The Lipka Tatar community is institutionally Sunni Hanafi via Grand Duchy / Crimean Khanate Ottoman heritage — Diyanet 18°/17° + Hanafi Asr would be more institution-aligned. fajr's MWL routing follows the Aladhan default; v1.6.3+ candidate.

## Known points of ikhtilaf within the country
- **Lipka Tatar institutional convention** — Hanafi via Ottoman heritage; same continuous-tradition story as Lithuania and Poland's Lipka Tatar communities.
- **Iwie's Wooden Mosque** (built 1882, restored 2010s) is the oldest continuously functioning mosque in the post-Soviet northern European Lipka Tatar tradition.
- **Hanafi Asr** observed by Lipka Tatar institutional convention.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Lipka Tatar institutional convention (consistent with proposed Lithuanian / Polish re-routing).

## Sources
- Muslim Religious Association in Belarus: https://muslim.by/
- Aladhan API regional default for `BY` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
