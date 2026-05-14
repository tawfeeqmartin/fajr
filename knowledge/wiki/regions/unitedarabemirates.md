# United Arab Emirates (UAE) — prayer-time conventions

## Institutional reference body

- **Name:** IACAD (Islamic Affairs and Charitable Activities Department, Dubai) — administers Dubai's Islamic affairs including the official Dulook DXB prayer-time application. Also the source of the Burj Khalifa floor-stratified fatwa.
- **URL:** https://www.iacad.gov.ae
- **Secondary:** General Authority of Islamic Affairs and Endowments (Awqaf) for federal-level guidance; National Audit Bureau & Ministry of Foreign Affairs for cross-emirate coordination.
- **Population served:** ~7.4M Muslims (~76% of UAE's ~9.7M total). Sunni-majority (Hanbali institutional, Maliki + Shafi'i + Hanafi minorities given the large expatriate Muslim population — Pakistani-Bangladeshi-Indian Hanafi, Egyptian-Sudanese Shafi'i/Hanbali, Iranian Twelver Shia).
- **Madhab:** Institutionally Hanbali (aligned with Saudi institutional convention). Population is multi-madhab due to expatriate composition.

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Dubai` is **not** an adhan.js preset. fajr currently dispatches UAE coordinates to the **Gulf cluster default** — typically routes via Umm al-Qura (method=4) for Saudi-adjacent jurisdictions.
- **Fajr angle:** 18.5° (Umm al-Qura when dispatched there) or 18° (Gulf cluster Aladhan method=8)
- **Isha angle:** 90-min interval (Umm al-Qura) or 18° (Gulf cluster)
- **Asr school:** Standard
- **Special offsets:** none institutional. Elevation correction is the distinguishing UAE feature — see below.
- **Classification:** 🟡→🟢 (Approaching established — Burj Khalifa fatwa is the most-cited modern elevation-correction precedent; the angle-pair dispatch is institutionally aligned with the Saudi/UAQ cluster)

## Why this method

The UAE has no canonical national prayer-time methodology distinct from the Gulf cluster. Dispatch to the UAQ-cluster preset is empirically defensible — IACAD's Dulook DXB application internally uses UAQ-equivalent angle pairs.

The **defining UAE-specific feature** is the **floor-stratified elevation correction** for high-rise buildings, codified in the Burj Khalifa fatwa:

- **Zone 1 (floors 1–80):** Standard ground-level prayer times
- **Zone 2 (floors 81–150):** +2 minutes on Maghrib/Shuruq
- **Zone 3 (floors 151–163):** +3 minutes on Maghrib/Shuruq

This fatwa is the **first known building-specific, floor-stratified prayer time ruling** in modern Islamic jurisprudence, and was incorporated into the official IACAD Dulook DXB prayer-time application. The fatwa explicitly applies geometric horizon dip principles within an Islamic-jurisprudence framework — formal scholarly determination that elevation is a legitimate wasail correction.

**Classical scholarly basis:** the modern fatwa is a 21st-century application of multi-madhab classical consensus on elevation-dependent prayer times — see `knowledge/wiki/corrections/elevation.md` § "Classical multi-madhab scholarly grounding" (Ibn 'Uthaymeen Hanbali, Ibn 'Abidin Hanafi, Standing Committee). The Burj Khalifa fatwa is journalism-confirmed (BBC News 2011) but the IACAD primary Arabic text is currently unretrievable post-website-restructure.

**fajr's elevation correction** applies the geometric horizon-dip principle when:
- The matched city has elevation in fajr's city registry, OR
- The caller passes `elevation > 0` explicitly

The correction matches the Burj Khalifa fatwa's spirit within ~1 minute at relevant elevations.

## Known points of ikhtilaf within the country

- **Twelver Shia minority** (Iranian-expatriate, primarily Dubai-resident) — follows Sistani-aligned Imsakiyya. Not currently surfaced via per-city `altMethods` in fajr. The expatriate composition makes per-community per-city overrides less geographically clean than in pure-citizen Saudi cities.
- **Multi-madhab expatriate composition:** UAE's Muslim population is dramatically more multi-madhab than its Saudi neighbor. Pakistani-Bangladeshi Hanafi mosques in Dubai may publish Hanafi 2× Asr; Egyptian Shafi'i mosques publish Shafi'i 1× Asr. fajr's `applied.asrSchool` defaults to Standard; Hanafi users override explicitly.

## City-level overrides

No per-city overrides currently. The Gulf-cluster default + IACAD elevation correction handles Dubai, Abu Dhabi, Sharjah, Ras Al Khaimah, and all major UAE coordinates correctly.

For Burj Khalifa-specific floor-aware prayer times, the caller passes the building floor's actual elevation (Floor 80 ≈ 320m, Floor 150 ≈ 590m, Floor 160 ≈ 630m) and fajr applies geometric horizon-dip correction.

## Open questions / outstanding work

- **No UAE-specific institutional fixture** in fajr's eval corpus. The closest data is via Aladhan world-coverage fixtures + the empirical Dubai-cluster dispatch agreement. An IACAD-direct fetcher (Dulook DXB API or equivalent) would surface UAE-specific institutional ground truth.
- **IACAD Arabic primary fatwa text** for the Burj Khalifa ruling — open recovery via Wayback Machine targeting `iacad.gov.ae/ar/FatwaAndResearch/*` from 2011. Currently citation chain is journalism (BBC, The National, Al Khaleej, Wikipedia footnote) → IACAD-Dulook-DXB implementation. Per fajr#109 / Phase 2 research.
- **Multi-madhab altMethods** for Dubai cities — would surface the institutional choice surface for the large expatriate Hanafi population.

## Sources

- IACAD: https://www.iacad.gov.ae
- Burj Khalifa fatwa journalism: BBC News 2011 https://www.bbc.com/news/world-middle-east-13899115 ; The National 2011 https://www.thenationalnews.com/uae/fatwa-means-late-iftar-on-top-burj-khalifa-floors-1.432286
- Peer-reviewed analysis: Safiai et al. (2023). "Diversity of Time Zones at Burj Khalifa..." International Journal of Advanced Research 11(01), 1808-1812. DOI 10.21474/IJAR01/16210. CC-BY 4.0. Vendored at `knowledge/raw/papers/2026-05-06-elevation-corpus/safiai_2023_burj_khalifa_elevation.pdf`
- Second institutional implementation: Malaysia Federal Territories Mufti Office, letter dated 26 Feb 2025 (cites Safiai et al.)
