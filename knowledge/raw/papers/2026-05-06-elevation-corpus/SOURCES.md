# Elevation-correction primary sources — 2026-05-06 batch

Vendored 2026-05-06 in response to fajr#109 (citation-gap audit). The original elevation-correction commit (`666dd76`, April 12 2026) cited the IACAD Burj Khalifa fatwa + the Saudi "declines for jama'ah unity" position as institutional fact without primary citations. This batch surfaces the peer-reviewed scholarly grounding + classical multi-madhab precedent + secondary institutional implementation that legitimizes fajr's `🟡→🟢 Approaching established` classification for elevation correction.

Compiled research notes: `/tmp/islamic-sources-research/RESEARCH-NOTES.md` (807 lines, generated 2026-05-06 by Sonnet research agent).

## Papers

| File | Author(s) | Year | License | Title |
|---|---|---|---|---|
| `safiai_2023_burj_khalifa_elevation.pdf` | Safiai, Mohd Kashim, Ahmad, Jamsari, Hassan Ashari, Muttaqin (5+ Universiti Kebangsaan Malaysia scholars) | 2023 | **CC-BY 4.0** | *Diversity of Time Zones at Burj Khalifa in Performing Prayers and Fasting in Skyscrapers* — International Journal of Advanced Research (IJAR) 11(01), pp. 1808–1812. DOI [10.21474/IJAR01/16210](https://doi.org/10.21474/IJAR01/16210) |
| `jamaluddin_2022_walisongo_landing.html` | Muhammad Jamaluddin (UIN Walisongo Semarang, Indonesia) | 2022 | Open access (DOAJ-listed) | *Development of Astro Time Islamic Prayer Schedule Application and Altitude Correction Test* — Al-Hilal: Journal of Islamic Astronomy 4(2). DOI [10.21580/al-hilal.2022.4.2.12330](https://doi.org/10.21580/al-hilal.2022.4.2.12330). PDF behind login wall; landing page archived. |

## Classical-citation chain (referenced in wiki, not yet vendored as raw text)

The Sonnet research agent surfaced these classical primary scholars cited in IslamQA 220838 (June 15, 2015, supervised by Shaykh Muhammad Saalih al-Munajjid). They form the multi-madhab scholarly basis underlying both the Burj Khalifa fatwa and the elevation-correction principle generally. fajr's `knowledge/wiki/corrections/elevation.md` has been updated to cite these directly:

| Scholar | Madhab | Reference | Quote relevant to fajr |
|---|---|---|---|
| **Ibn 'Uthaymeen** | Hanbali (Saudi) | *Majmoo' Fataawa wa Rasaa'il al-'Uthaymeen* Vol. 15 p. 437 | "People who are on mountain tops or in valleys or in **high buildings**, each of them has his own ruling. The one for whom the sun has set is permitted to break the fast, but the one for whom it has not set is not permitted to do so." |
| **Ibn 'Abidin** | Hanafi (18th c.) | *Hashiyat Ibn 'Abidin* (commentary on al-Durr al-Mukhtar) | "One in a high place, such as the **minaret of Alexandria**, should not break his fast so long as the sun has not yet set from where he is looking." |
| **Standing Committee for Scholarly Research and Ifta (Saudi Arabia)** | (multi-madhab body) | *Fataawa al-Lajnah ad-Daa'imah* (specific fatwa number not yet extracted) | Cited by IslamQA 220838 in support of the elevation-dependent principle. |

These are the canonical multi-madhab classical roots of the elevation-correction stance. The Burj Khalifa fatwa (Dr. Ahmed Al Haddad, IACAD 2011) is the modern application of this classical principle, and Malaysia's 2025 Federal Territories Mufti ruling (citing Safiai et al. 2023 above) is the second institutional implementation.

## Secondary institutional implementation — Malaysia 2025

**Federal Territories Mufti Office (Prime Minister's Department, Malaysia)** issued an official letter dated **26 February 2025** applying floor-stratified elevation correction to KLCC/Petronas Twin Towers buildings exceeding 400 meters / floor 76+:

- Maghrib: 3 minutes after the standard Azan time
- Syuruk (Shuruq): 3 minutes earlier
- Other prayers unchanged
- Implementation: from the first day of Ramadan 2025 onwards
- Scholarly basis: explicitly cites Safiai et al. (UKM/IJAR 2023, the paper above)

Journalism source: Shahril Bahrom, *The Rakyat Post*, "Above 400M? Your Buka Puasa Time Is Not The Same As Your Friends At Ground Level" (March 5, 2025): https://www.therakyatpost.com/news/2025/03/05/above-400m-your-buka-puasa-time-is-not-the-same-as-your-friends-at-ground-level/

This is the second independent national institutional implementation after IACAD/UAE 2011 — confirming the `🟡→🟢` classification trajectory.

## What's NOT in this batch (open follow-ups)

The Sonnet research agent (and the original fajr#109 dispatch) confirmed these primary sources EXIST but couldn't retrieve them from this network:

- **IACAD original Arabic fatwa text.** `iacad.gov.ae/ar/FatwaAndResearch/` returns 404 post-website-restructure. Wayback Machine is blocked from Claude Code's WebFetch. A browser session targeting `web.archive.org/web/20110901*/iacad.gov.ae/ar/FatwaAndResearch/` is the next-step recovery path.
- **Lajnah ad-Daa'imah specific fatwa number** for the elevation-corrected prayer times principle. IslamQA 220838 cites the Standing Committee in support but doesn't quote a specific fatwa number. `alifta.gov.sa` has unverifiable TLS from non-Saudi networks; a Saudi-routable contributor or browser session accepting TLS warnings + searching `الطوابق العالية` / `المباني الشاهقة` would surface the fatwa number.
- **JAKIM systematic state-level elevation correction methodology.** fajr's wiki claims JAKIM applies elevation across all Malaysian states using JUPEM DEM data; this was NOT confirmed by the Sonnet research. What WAS confirmed is the 2025 Federal Territories Mufti ruling (a different body) for one building category. The broader JAKIM-wide claim should be marked unverified pending direct confirmation from JAKIM.

## Provenance integrity

```
$ shasum -a 256 *.pdf *.html
```
(Computed at archive time — see git blame for this commit.)

## Status

These materials are now under `knowledge/raw/` for permanent archival. They are referenced from `knowledge/wiki/corrections/elevation.md` via the standard `[Author, Year]` citation pattern. The compile process from raw materials into the wiki is described in `knowledge/compile.md`.

## License notes

- **Safiai et al. (2023)** — CC-BY 4.0 explicit. Full vendoring + redistribution permitted with attribution. Attribution line: "Safiai, M.H., Mohd Kashim, M.I.A., Ahmad, M.Y., Jamsari, E.A., Hassan Ashari, M.Z.A., & Muttaqin, A. (2023). *Diversity of Time Zones at Burj Khalifa in Performing Prayers and Fasting in Skyscrapers.* International Journal of Advanced Research, 11(01), 1808–1812. https://doi.org/10.21474/IJAR01/16210"
- **Jamaluddin (2022)** — open access (DOAJ-listed); landing page archived only because the PDF is behind a journal-portal login. Citation reproducible from the landing page URL.
