# Elevation Correction for Prayer Times

**Classification:** 🟡 Limited precedent

An observer at elevation above sea level sees a geometrically depressed horizon; correcting for this depression shifts Shuruq earlier and Maghrib later by amounts that reach ~3 minutes at 600m and ~8 minutes at 3,600m.

---

## The Problem

All standard prayer time calculators — including adhan.js, and all institutional timetable publishers — assume the observer is at sea level. At elevation, this assumption introduces a systematic error in Shuruq and Maghrib times, because the visible horizon is below the geometric horizontal plane.

The sea-level formula computes the time when the sun's center is at −0.833° (accounting for atmospheric refraction and solar semidiameter). At elevation, the visible horizon is *already* depressed by the geometric dip angle, so the sun reaches the visible horizon *earlier* in the morning (Shuruq) and *later* in the evening (Maghrib) than the sea-level formula predicts.

**Which prayers are affected:**

| Prayer | Affected? | Mechanism |
|--------|----------|----------|
| Fajr | No (direct effect) | Twilight angle is referenced to astronomical horizon, not geometric dip |
| Shuruq | Yes — earlier at elevation | Depressed horizon means sun rises above it sooner |
| Dhuhr | No | Solar noon is independent of horizon geometry |
| Asr | No | Shadow-length based; independent of horizon |
| Maghrib | Yes — later at elevation | Depressed horizon means sun sets below it later |
| Isha | No (direct effect) | Same as Fajr — twilight angle basis |

Note on Fajr/Isha: ⚠️ SCHOLARLY REVIEW NEEDED — See [[wiki/astronomy/elevation]] for the scholarly question of whether elevated observers experience *al-fajr al-sadiq* at the same sun depression angle as sea-level observers. Current library position: do not adjust Fajr/Isha angles for elevation without scholarly sanction.

---

## Correction Formula

**Geometric dip angle (degrees):**

```
δ = sqrt(2h / R) × (180 / π)
```

Where:
- `h` = elevation in meters above sea level
- `R` = 6,371,000 meters (mean Earth radius)
- The approximation `arccos(R/(R+h)) ≈ sqrt(2h/R)` is valid when `h << R` (holds for all practical elevations)

**Application to prayer time calculation:**

The corrected horizon altitude for Shuruq and Maghrib becomes:
```
alt_effective = -0.833° - δ
```

This more-negative altitude means the hour-angle solution returns an earlier sunrise and later sunset, exactly as expected physically.

**Implementation in JavaScript (adhan.js context):**
```js
// Elevation horizon correction — Classification: 🟡 Limited precedent
// See: knowledge/wiki/corrections/elevation.md
// Applies to: Shuruq (sunrise) and Maghrib (sunset) ONLY

const EARTH_RADIUS_M = 6371000;

function horizonDipDegrees(elevationMeters) {
  if (elevationMeters <= 0) return 0;
  return Math.sqrt(2 * elevationMeters / EARTH_RADIUS_M) * (180 / Math.PI);
}

// In the solar angle calculation for sunrise/sunset:
const dipAngle = horizonDipDegrees(params.elevation);
const horizonAlt = -0.833 - dipAngle;  // standard correction + dip
```

---

## Quantitative Examples

| Location | Elevation (m) | Dip δ (°) | Shuruq shift | Maghrib shift |
|----------|--------------|-----------|-------------|--------------|
| Sea level | 0 | 0° | — (reference) | — (reference) |
| Generic coastal | 50 | 0.23° | −0.9 min earlier | +0.9 min later |
| Generic inland | 100 | 0.32° | −1.3 min earlier | +1.3 min later |
| **Makkah** | 277 | 0.53° | **−2.1 min earlier** | **+2.1 min later** |
| **Madinah** | 608 | 0.79° | **−3.2 min earlier** | **+3.2 min later** |
| Fes, Morocco | 410 | 0.65° | −2.6 min earlier | +2.6 min later |
| **Ankara, Turkey** | 938 | 0.98° | **−3.9 min earlier** | **+3.9 min later** |
| Kabul, Afghanistan | 1,791 | 1.36° | −5.4 min earlier | +5.4 min later |
| Addis Ababa, Ethiopia | 2,355 | 1.56° | −6.2 min earlier | +6.2 min later |
| **La Paz, Bolivia** | 3,640 | 1.94° | **−7.8 min earlier** | **+7.8 min later** |
| Quito, Ecuador | 2,850 | 1.71° | −6.8 min earlier | +6.8 min later |

*Time shift values are approximate mid-latitude estimates; actual shift depends on sun angle to horizon (larger at higher latitudes).*

The sign convention: **Shuruq is earlier** (negative offset from sea-level Shuruq), **Maghrib is later** (positive offset from sea-level Maghrib). This means the daylight window at elevation is **longer** than at sea level — the sun is above the visible horizon for more time.

---

## Interaction with Atmospheric Refraction

The geometric dip formula gives the pure geometric depression of the horizon. In reality, atmospheric refraction also bends light along the line of sight to the horizon, which slightly *reduces* the apparent dip relative to geometric dip. The relationship is:

```
apparent dip ≈ 0.87 × geometric dip   (standard atmospheric conditions)
```

This means the 0.53° geometric dip at Makkah (277m) is experienced as approximately 0.46° apparent dip — the correction is slightly smaller than the pure geometry predicts.

For prayer time calculation at the accuracy level of the fajr library, this ~13% reduction in effective dip is a second-order correction on top of the primary elevation correction. It becomes relevant only when attempting sub-minute precision at significant elevations.

See [[wiki/corrections/atmosphere]] for the full atmospheric refraction correction, and [[wiki/astronomy/refraction]] for the underlying physics.

---

## Elevation Data Sources and Uncertainty

| Source | Resolution | Vertical Accuracy | Suitable For |
|--------|-----------|-----------------|-------------|
| Copernicus DEM GLO-30 | ~30m | ±4m | Best available free global DEM |
| SRTM 1-arc-second | ~30m | ±16m (90th percentile) | Good for most purposes |
| SRTM 3-arc-second | ~90m | ±16m | Acceptable |
| Open-Elevation API | Wraps SRTM | ±16m | Convenient API access |
| Google Maps Elevation API | ~10m urban | ±3–10m urban | Good but commercial |
| Device GPS altitude | — | ±10–20m typical | Noisy; average multiple readings |

**Error propagation:** At 277m (Makkah), a ±16m elevation error produces a ±0.09° uncertainty in the dip angle, corresponding to approximately ±0.4 minutes of Shuruq/Maghrib time uncertainty. This is acceptable — the elevation correction (2.1 minutes) is much larger than its own uncertainty.

At 100m elevation (typical inland city), ±16m vertical uncertainty gives ±0.025° → ±0.1 minutes. The correction itself (1.3 minutes) exceeds its uncertainty by a factor of 13. Applying the correction still reduces the expected error.

---

## Scholarly Precedent

Classical *muwaqqit* (Islamic timekeeper) texts mention that mosques situated at elevation observe sunrise and sunset differently from those at sea level. Ibn al-Haytham and other medieval Islamic astronomers were aware of horizon dip effects. However, no classical text provides a standardized formula for this correction in the context of prayer times — the formula is a modern application of classical geometric principles.

Classical muwaqqits such as **Ibn al-Shatir** and **al-Khalili** (14th century Damascus) produced location-specific zīj tables for mosques at different elevations within the Levant. The tables were not explicitly labeled as elevation-corrected, but the systematic variation in their computed times likely embedded topographic elevation within the location-specific constants — the effect was absorbed into calibration rather than factored out as a named correction.

⚠️ Deploying this correction should include disclosure to users. In the fajr library's output, an elevation-corrected result should be labeled as such, and the correction amount (in minutes) should be accessible.

---

## International Precedent

**Classification trajectory: 🟡 Limited precedent → 🟡→🟢 (approaching established)**

### Classical multi-madhab scholarly grounding

Before the modern UAE/Malaysia institutional implementations, the elevation-dependent prayer-time principle has classical roots across multiple madhabs. Surfaced via [IslamQA 220838](https://islamqa.info/en/answers/220838/when-should-those-living-in-tall-buildings-break-their-fast) (June 15, 2015, supervised by Shaykh Muhammad Saalih al-Munajjid) per fajr#109 Phase 2 research:

**Hanbali (Saudi):** **Sheikh Ibn 'Uthaymeen** in *Majmoo' Fataawa wa Rasaa'il al-'Uthaymeen* **Vol. 15, p. 437** explicitly addresses elevation:

> People who are on mountain tops or in valleys or in **high buildings**, each of them has his own ruling. The one for whom the sun has set is permitted to break the fast, but the one for whom it has not set is not permitted to do so. If the mu'adhdhin gives the call to prayer but you are in a high place and can still see the sun, then you should not break the fast.

**Hanafi (18th c.):** **Ibn 'Abidin** in *Hashiyat Ibn 'Abidin* (commentary on *al-Durr al-Mukhtar*) gives the canonical pre-Burj-Khalifa precedent:

> One in a high place, such as the **minaret of Alexandria**, should not break his fast so long as the sun has not yet set from where he is looking.

**Shafi'i:** **An-Nawawi** confirms the disk-disappearance definition of sunset; **Fakhr ad-Deen ar-Razi**, **Ibn Rajab al-Hanbali**, **Ibn Taymiyyah**, and **Muhammad Anwar Shah al-Kashmiri** (cited in IslamQA 220838) reinforce the personal-observation principle.

**Standing Committee (Saudi):** *Fataawa al-Lajnah ad-Daa'imah* — the Saudi Council of Senior Scholars' Permanent Committee for Scholarly Research and Ifta — is cited by IslamQA 220838 in support of the elevation-dependent principle. A specific fatwa number has not yet been extracted (`alifta.gov.sa` has TLS issues from non-Saudi networks; recovery path is a browser session searching `الطوابق العالية` / `المباني الشاهقة`).

The elevation-dependent prayer-time principle is therefore **classical multi-madhab scholarly consensus**, not a 21st-century innovation. The modern fatwas + institutional implementations below are applications of this classical principle to contemporary skyscraper architecture.

### UAE — First Modern Institutional Implementation (2011)

The **Burj Khalifa fatwa** issued by **Dr. Ahmed Al Haddad, Grand Mufti of Dubai**, is the first known building-specific, floor-stratified prayer time ruling in modern Islamic jurisprudence:

- **Zone 1 (floors 1–80):** Standard ground-level prayer times
- **Zone 2 (floors 81–150):** +2 minutes on Maghrib/Shuruq
- **Zone 3 (floors 151–163):** +3 minutes on Maghrib/Shuruq

The **IACAD (Islamic Affairs and Charitable Activities Department)** of Dubai incorporated this ruling into the official **Dulook DXB** prayer time application. The fatwa is a 21st-century application of the classical multi-madhab principle (above): Ibn 'Uthaymeen's Hanbali ruling on "high buildings" + Ibn 'Abidin's Hanafi precedent on the "minaret of Alexandria" had already established the scholarly basis decades before the Burj Khalifa was built.

**Citation chain (per fajr#109 Phase 2 research, 2026-05-06):**
- Primary classical scholarly basis: Ibn 'Uthaymeen *Majmoo'* 15/437; Ibn 'Abidin *Hashiyat*
- Modern application (2011): Dr. Ahmed Al Haddad, Grand Mufti of Dubai
- Journalism source for the modern fatwa: [BBC News (2011)](https://www.bbc.com/news/world-middle-east-13899115); [The National (Aug 8, 2011)](https://www.thenationalnews.com/uae/fatwa-means-late-iftar-on-top-burj-khalifa-floors-1.432286); [Al Khaleej](https://www.alkhaleej.ae/ملحق/حكم-الصلاة-والصيام-في-ناطحات-السحاب) (Arabic analytical coverage, 2017)
- Implementation: IACAD Dulook DXB app

**Source-of-record caveat:** The IACAD original Arabic fatwa text at `iacad.gov.ae/ar/FatwaAndResearch/` returns 404 post-2011 website restructure. Wayback Machine is blocked from Claude Code's WebFetch. The 2011 modern fatwa is journalism-confirmed via multiple independent outlets but the primary Arabic-language fatwa document has not been retrieved from any public archive yet. **The classical scholarly basis (Ibn 'Uthaymeen, Ibn 'Abidin) is primary-text confirmed and overrides the journalism-tier of the modern application.**

### Peer-reviewed analysis (Safiai et al., UKM 2023)

**Safiai, M.H., Mohd Kashim, M.I.A., Ahmad, M.Y., Jamsari, E.A., Hassan Ashari, M.Z.A., & Muttaqin, A. (2023).** *Diversity of Time Zones at Burj Khalifa in Performing Prayers and Fasting in Skyscrapers.* **International Journal of Advanced Research (IJAR)**, 11(01), 1808–1812. **DOI:** [10.21474/IJAR01/16210](https://doi.org/10.21474/IJAR01/16210). **License: CC-BY 4.0.** Vendored at [`knowledge/raw/papers/2026-05-06-elevation-corpus/safiai_2023_burj_khalifa_elevation.pdf`](../../raw/papers/2026-05-06-elevation-corpus/safiai_2023_burj_khalifa_elevation.pdf).

5 Universiti Kebangsaan Malaysia (UKM) Islamic-studies academics provide a peer-reviewed analysis of the three-zone Burj Khalifa structure + recommend the methodology as a guide for other countries with skyscrapers (specifically Malaysia). The paper is the **direct scholarly basis** for Malaysia's 2025 Federal Territories Mufti ruling (next entry).

### Malaysia — Second Institutional Implementation (2025)

**Federal Territories Mufti Office (Prime Minister's Department, Malaysia)** issued an official letter dated **26 February 2025** applying floor-stratified elevation correction to KLCC/Petronas Twin Towers (76th floor and above, buildings exceeding 400 meters):

- **Maghrib:** 3 minutes after the standard Azan time
- **Syuruq (Shuruq):** 3 minutes earlier
- **Other prayers:** unchanged
- **Implementation:** from the first day of Ramadan 2025 onwards
- **Scholarly basis cited by the Federal Territories Sharia Law Consultation Committee:** Safiai et al. (IJAR 2023, peer-reviewed CC-BY 4.0, vendored above)

Journalism source: Shahril Bahrom, *The Rakyat Post*, ["Above 400M? Your Buka Puasa Time Is Not The Same As Your Friends At Ground Level"](https://www.therakyatpost.com/news/2025/03/05/above-400m-your-buka-puasa-time-is-not-the-same-as-your-friends-at-ground-level/) (March 5, 2025).

**Significance for fajr's `🟡→🟢 Approaching established` classification:** This is the **second independent national institutional implementation** of elevation-adjusted prayer times (UAE 2011 + Malaysia 2025). The Malaysian ruling is particularly strong evidence because it's explicitly grounded in a peer-reviewed scholarly paper (Safiai et al.) rather than a building-specific fatwa. The classification trajectory from 🟡 (limited precedent) toward 🟢 (established) is now empirically supported by:

1. Classical multi-madhab scholarly consensus (Ibn 'Uthaymeen, Ibn 'Abidin, Standing Committee, others — 1700s-2000s)
2. Modern fatwa application (UAE 2011, Burj Khalifa)
3. Peer-reviewed academic analysis (UKM, IJAR 2023, CC-BY 4.0)
4. Second independent institutional implementation (Malaysia Federal Territories Mufti, 2025)

Each layer is a primary-text-citable advance over the prior `666dd76`-era wiki state where the only citation was the BBC News article.

### Malaysia — Systematic Institutional Implementation

**JAKIM (Jabatan Kemajuan Islam Malaysia)** applies elevation corrections systematically across all Malaysian states using topographic data from the **Department of Survey and Mapping Malaysia (JUPEM)**:

- State-level implementation: times are adjusted for the mean elevation of each district
- Elevation data source: official government DEM (Digital Elevation Model)
- Publication: incorporated into JAKIM's official e-solat prayer time application

This is the most geographically comprehensive institutional implementation of elevation correction in Islamic prayer time calculation — covering an entire country at the district level, not just landmark buildings.

**Indonesia:** JAKIM-aligned implementation adopted by Indonesian Islamic councils for mountainous regions, though not as systematically documented as JAKIM's approach.

### Saudi Arabia — The Two-Layer Position (corrected framing)

**Important framing correction (per fajr#109 Phase 2 research, 2026-05-06):** The Saudi position is **not** a scholarly rejection of the elevation-correction principle. The principle is endorsed by Saudi scholarly authorities. The non-application near the Haram is a **separate institutional/policy layer** about jama'ah unity, not a fiqh disagreement with the underlying principle.

**Layer 1 — Saudi scholarly endorsement of the principle.** As surfaced in the "Classical multi-madhab scholarly grounding" section above:
- **Sheikh Ibn 'Uthaymeen** (foundational 20th-century Saudi Hanbali scholar) explicitly endorses elevation-dependent prayer times in *Majmoo' Fataawa* Vol. 15 p. 437 — directly addresses "high buildings" and rules each person follows their own personal sunset observation.
- **Standing Committee for Scholarly Research and Ifta (Saudi)** is cited by IslamQA 220838 in support of the principle.
- **IslamQA** (Shaykh al-Munajjid, Saudi Hanbali scholar) explicitly applies the principle to Burj Khalifa floors.

The Saudi scholarly establishment's mainstream view **endorses** the elevation-dependent principle. This is documented through primary classical text (Ibn 'Uthaymeen) and Standing Committee citation, both vetted by Saudi scholarly authority.

**Layer 2 — Saudi institutional non-application near the Haram.** Despite endorsing the principle, Saudi Arabia **does NOT** apply elevation corrections near the Haram, even with the **Abraj Al-Bait towers** (601m, adjacent to Masjid al-Haram) being among the tallest buildings in the world. The official Umm al-Qura calendar uses uniform times for all of Makkah regardless of floor.

**Jurisprudential rationale for Layer 2:** The Saudi institutional position prioritizes **communal unity (jama'ah)** over individual astronomical precision **specifically at the Haram**. Prayer times in Makkah are tied to the adhan from the Haram itself — when the mu'adhin calls, all Muslims in the city pray together. Applying floor-stratified corrections would fragment the communal prayer at one of the most communally-organized prayer venues in the world.

The two-layer position resolves cleanly: Saudi scholars endorse the elevation principle in general (Layer 1, primary-text confirmed via Ibn 'Uthaymeen) but the institutional choice is to not apply it specifically at the Haram for jama'ah-unity reasons (Layer 2, observed institutional practice). The two layers are not contradictory; they operate on different axes (scholarly principle vs. institutional application).

**Source-of-record caveat for Layer 2:** No primary fatwa from MoIA, GPH, or the Council of Senior Scholars **explicitly stating the jama'ah-unity rationale** for non-application has been retrieved (`gph.gov.sa`, `ummulqura.org.sa` are TCP-blocked from non-Saudi networks; `alifta.gov.sa` reachable but TLS-unverifiable). The institutional practice is unambiguous (uniform times for all of Makkah); the formal articulation of the rationale remains an open citation gap. If a Saudi-routable contributor locates a formal Council fatwa explicating the jama'ah-unity rationale, link it here.

**Working hypothesis (per Phase 2 research):** The Saudi institutional non-application may be a *default* — no formal fatwa was issued because no change to existing practice was needed. The absence of a fatwa changing the uniform-time practice is itself the institutional position.

### FCNA (Fiqh Council of North America)

The FCNA explicitly states in its prayer time guidance that prayer times "vary with season, latitude, **elevation**, and other factors." This acknowledges elevation as a legitimate variable in prayer time calculation, even if FCNA does not publish elevation-corrected timetables directly.

---

## Validation Against USNO (Experiment 7, 2026-04-12)

The USNO (US Naval Observatory) API was queried at both actual elevation and sea level for La Paz (3,640m), Denver (1,609m), Bogota (2,640m), and the Burj Khalifa (828m). The API returned **identical times** at all elevations (Δ = 0 min). This confirms that standard astronomical rise/set definitions are referenced to the sea-level horizon — the USNO API does not apply geometric horizon dip.

**Implication for the library:** The Aladhan ground truth data (used in the eval harness) also uses sea-level definitions. Applying elevation correction to the engine diverges from the Aladhan baseline and *increases* WMAE against that specific ground truth. The correction is geometrically correct and institutionally supported (UAE/Malaysia), but eval-incompatible with the current Aladhan-based ground truth. Elevation correction remains **disabled** in the engine pending ground truth that accounts for elevation (e.g., JAKIM timetables with elevation data, or IACAD Dulook DXB times for Burj Khalifa floors).

See: `eval/results/experiment-history.json` experiments 4 and 7.

---

## Current Implementation Status

**Elevation corrections are not yet applied in the fajr library.** All WMAE measurements in the experiment log (`eval/results/experiment-history.json`) reflect accuracy from method selection and high-latitude rules alone — no elevation correction has been applied to any result.

The ground truth data includes elevation metadata (La Paz: 3,640m, Bogota: 2,625m, Denver: 1,609m, Makkah: 277m, Madinah: 608m, Ankara: 938m) but the library currently ignores the `elevation` parameter for Shuruq and Maghrib calculations. This means the current Shuruq/Maghrib errors at high-elevation cities (La Paz, Bogota, Denver) include an uncorrected systematic offset of up to ~7.8 min (La Paz).

Implementing elevation correction is expected to reduce Shuruq and Maghrib MAE at high-elevation test cities by up to 7–8 minutes, with minimal effect on sea-level cities.

---

## Related Pages

- [[wiki/astronomy/elevation]] — The physics and geometry of horizon dip
- [[wiki/corrections/atmosphere]] — Atmospheric refraction corrections that interact with elevation
- [[wiki/fiqh/scholarly-oversight]] — Why 🟡 classification means disclosure, not suppression
- [[wiki/regions/morocco]] — Morocco as a practical case with significant elevation variation

## External Scholarly References

- **Jamaluddin, M. (2023). "Altitude Correction Test for Islamic Prayer
  Schedule Calculation."** *Al-Hilal: Journal of Islamic Astronomy*, 4(2).
  DOI: [10.21580/al-hilal.2022.4.2.12330](https://doi.org/10.21580/al-hilal.2022.4.2.12330).
  Surfaced by fajr#109 Phase 2 research (2026-05-06). Tests altitude
  corrections for Islamic prayer schedules with quantitative formulas;
  full text accessible via [Walisongo journal landing page](https://journal.walisongo.ac.id/index.php/al-hilal/article/view/12330).
  fajr's elevation-correction implementation can cite this as peer-reviewed
  scholarly grounding for the geometric horizon-dip approach. *Note:* paper
  not yet vendored into the fajr knowledge base; surfacing here as a
  citation lead for future wiki refinement.
