# Poland — prayer-time conventions

## Institutional reference body
- **Name:** **Muzułmański Związek Religijny w Rzeczypospolitej Polskiej (MZR)** — Muslim Religious Union in the Republic of Poland, founded 1925 — represents the historical **Lipka Tatar** Muslim community continuously present in Poland since the 14th century
- **URL:** MZR: https://www.mzr.pl/ ; Mufti's office: https://muftikat.mzr.pl/
- **Population served:** ~30,000–50,000 Muslims (~0.1% of Poland's ~37M total — historic Lipka Tatar community (~3,000–5,000, mainly in Białystok / Podlaskie / Bohoniki / Kruszyniany villages with the only two wooden mosques in Poland); plus modern diaspora — Turkish, Arab, Chechen, Syrian, Pakistani-origin)
- **Madhab(s):** Sunni Hanafi (Lipka Tatar historic majority — Hanafi madhab inherited from Crimean Khanate / Golden Horde Ottoman period); Sunni multi-madhab (modern diaspora)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Lipka Tatar Hanafi institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
ECFR-aligned **MWL 18°/17°** is the European default; Aladhan API defaults Poland (`PL`) to MWL. Note that the historical **Lipka Tatar** community is institutionally Sunni Hanafi via Crimean Khanate / Golden Horde Ottoman heritage — Diyanet 18°/17° + Hanafi Asr would be more institution-aligned for the Lipka Tatar community. fajr's MWL routing follows the Aladhan default; v1.6.3+ may revisit if MZR-published Imsakiyya is better matched by Diyanet.

## Known points of ikhtilaf within the country
- **Lipka Tatar communities** (Bohoniki, Kruszyniany, Białystok, Sokółka, Gdańsk Suchodolski) — Hanafi institutional alignment; users may prefer manual `method: 'Diyanet'` and `madhab: 'Hanafi'` overrides.
- **Modern diaspora communities** in Warsaw, Kraków, Wrocław, Poznań — multi-madhab; MWL is the documented default.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method if MZR's published Imsakiyya better matches Diyanet 18°/17° + Hanafi Asr per Lipka Tatar institutional convention.

## Sources
- Muzułmański Związek Religijny w RP: https://www.mzr.pl/
- Mufti's office: https://muftikat.mzr.pl/
- Aladhan API regional default for `PL` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
