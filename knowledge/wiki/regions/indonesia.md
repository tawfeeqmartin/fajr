# Indonesia — prayer-time conventions

## Institutional reference body

- **Name:** Kementerian Agama Republik Indonesia (KEMENAG / Ministry of Religious Affairs)
- **URL:** https://bimasislam.kemenag.go.id (Bimas Islam = directorate-general for Islamic guidance, publishes per-kabupaten/kota Imsakiyya)
- **Secondary:** Majelis Ulama Indonesia (MUI, Indonesian Council of Ulama) — issues fatwas but not the prayer-time publisher
- **Population served:** ~241M Muslims (~87% of Indonesia's ~278M total — the **world's largest Muslim population**)
- **Madhab:** Sunni Shafi'i is overwhelmingly dominant. Hanafi minority among ethnic-Chinese Muslim communities in some urban areas. Salafi/Wahhabi (anti-madhab) presence in academic-institutional contexts. Twelver Shia minority concentrated in Madura, Jakarta, Yogyakarta (≤1%).

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Singapore` (`CalculationMethod.Singapore()`) — corresponds to **Aladhan API method 6**
- **Fajr angle:** 20° (Singapore/JAKIM/KEMENAG cluster convention)
- **Isha angle:** 18° (Singapore/JAKIM/KEMENAG cluster convention)
- **Asr school:** Standard (Shafi'i — 1× shadow). Matches the demographic Shafi'i majority.
- **Special offsets:** none institutional; per-province KEMENAG publication carries minor regional adjustments fajr does not currently apply
- **Classification:** 🟢 Established (institutional preset; KEMENAG is the named Indonesian authority + the Singapore-cluster 20°/18° convention is empirically well-validated)

## Why this method

The 20°/18° angle pair is the **regional convention** shared by Singapore (MUIS), Malaysia (JAKIM), and Indonesia (KEMENAG) — all three institutional bodies publish on this angle pair. The Aladhan API's method 6 is named "Singapore" because MUIS is the first-published institutional source globally; fajr dispatches Indonesia to the same preset because KEMENAG is institutionally aligned.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (Indonesia is Shafi'i-majority + KEMENAG publishes Standard Asr)
- `applied.asrSchool` returns `'standard'`

This is one of the cases where convention and applied formula align cleanly — Indonesia is the Shafi'i baseline case.

## Known points of ikhtilaf within the country

- **myQuran wrapper vs. official KEMENAG** (fajr#97, closed 2026-05-13): the third-party `api.myquran.com/v2/sholat/jadwal/` endpoint is byte-for-byte identical to the official `bimasislam.kemenag.go.id` data on overlapping cells. The 3× WMAE divergence originally reported was a sample-coverage artifact (21 cities × 7 days vs 34 × 31), not a wrapper-divergence issue. Both fixtures are valid; both label `source_institution` as KEMENAG with provenance disambiguation.
- **Daudi Bohra minority in Madura/Jakarta:** small Tayyibi Isma'ili community follows Dawat-e-Hadiyah Imsakiyya (different from KEMENAG numerically). Not currently surfaced via fajr `altMethods`. Same shape as the India per-community split entry in `docs/known-disagreements.md`.
- **Twelver Shia minority:** ≤1% of Indonesian Muslims; not currently surfaced via per-city `altMethods` since geographic concentration is diffuse.
- **Per-province KEMENAG publication carries minor regional adjustments** (~1-2 min per kabupaten/kota) that fajr does not currently apply. The aggregate per-source bias against the 34-province KEMENAG fixture is ~2 min, partly explained by these regional adjustments.

## City-level overrides

None at city level for Indonesia proper. Country-default Singapore/KEMENAG dispatch handles every Indonesian coordinate.

## Open questions / outstanding work

- **Per-province bias** in the KEMENAG fixture (~2 min Maghrib bias mean across 34 provinces). Per fajr's Promotion Criteria, this is just below the ≤2 min C→B threshold. With more empirical work (per-province bias analysis + maybe per-kabupaten overrides for the worst-bias provinces), Indonesia could promote to A. Currently grade B.
- **Daudi Bohra altMethods** for Madura cities specifically — open follow-up tracked in the India per-community known-disagreements entry.

## Sources

- KEMENAG Bimas Islam: https://bimasislam.kemenag.go.id
- MUI (Majelis Ulama Indonesia): https://mui.or.id
- Aladhan method 6: https://aladhan.com/calculation-methods
- KEMENAG fixture: `eval/data/test/kemenag.json` (34 provinces × 31 days)
- myQuran wrapper fixture: `eval/data/test/indonesia-myquran.json` (21 cities × 7 days)
- Mawaqit Indonesia: limited (1 mosque in Jakarta in the active Mawaqit registry); not fetched as yearly fixture due to low coverage
