# Morocco — Regional Notes for Prayer Time Calculation

Morocco requires careful handling of terrain diversity, UTC offset instability during Ramadan, and the distinction between formula-based calculation and Ministry-published timetables as the true authority.

---

## Official Authority

**Institution:** Ministère des Habous et des Affaires Islamiques (Ministry of Habous and Islamic Affairs), Rabat.

**Method:** 18°/17° angles (identical to MWL), Maliki Asr (standard, 1× shadow), but the Ministry's published timetables are authoritative over formula output. See [[wiki/methods/morocco]] for method details.

**Publication:** Annual *imsakiyya* (prayer timetable), daily city-specific times at times.habous.gov.ma, broadcast on state radio/TV.

---

## Major Cities: Coordinates and Elevation

| City | Latitude | Longitude | Elevation | Notes |
|------|---------|----------|-----------|-------|
| Casablanca (الدار البيضاء) | 33.59°N | 7.62°W | 56m | Largest city; Atlantic coastal |
| Rabat (الرباط) | 34.02°N | 6.84°W | 75m | Capital; Atlantic coastal |
| Fes (فاس) | 34.03°N | 5.00°W | 410m | Inland; major religious center |
| Marrakech (مراكش) | 31.63°N | 8.00°W | 466m | Pre-Saharan; High Atlas gateway |
| Meknes (مكناس) | 33.89°N | 5.55°W | 546m | Inland plateau |
| Agadir (أكادير) | 30.43°N | 9.60°W | 49m | Southern Atlantic coast |
| Tangier (طنجة) | 35.79°N | 5.80°W | 15m | Mediterranean/Atlantic junction |
| Oujda (وجدة) | 34.69°N | 1.91°W | 465m | Eastern border city |
| Ouarzazate (ورزازات) | 30.93°N | 6.89°W | 1,136m | High altitude; trans-Atlas |
| Ifrane (إفران) | 33.53°N | 5.11°W | 1,665m | High altitude; Atlas mountains |
| Errachidia (الراشيدية) | 31.93°N | 4.43°W | 1,048m | Pre-Saharan |

Elevation data sourced from SRTM; precise city-center elevations may vary by ±20m.

---

## Terrain and Elevation Effects

Morocco's terrain ranges from sea level on the Atlantic and Mediterranean coasts to 4,167m at Jbel Toubkal (High Atlas). This range creates significant elevation-related variation in prayer times that is not captured by formula calculations based on sea-level assumptions.

**Elevation correction magnitude (illustrative):**

| City | Elevation | Geometric Dip δ | Shuruq/Maghrib Shift |
|------|-----------|----------------|---------------------|
| Agadir | 49m | 0.22° | ~0.9 min |
| Casablanca | 56m | 0.24° | ~0.9 min |
| Rabat | 75m | 0.28° | ~1.1 min |
| Oujda / Fes area | ~400–465m | 0.64°–0.69° | ~2.5–2.8 min |
| Meknes | 546m | 0.75° | ~3.0 min |
| Marrakech | 466m | 0.69° | ~2.8 min |
| Ouarzazate | 1,136m | 1.08° | ~4.3 min |
| Ifrane | 1,665m | 1.31° | ~5.2 min |

These shifts apply to **Shuruq and Maghrib only** (horizon-crossing prayers). Fajr and Isha (twilight-angle prayers) are not directly affected by elevation geometry, though atmospheric effects at altitude may modify effective twilight visibility. See [[wiki/corrections/elevation]].

**Atlas mountain communities:** Small towns and rural communities in the High Atlas and Anti-Atlas mountains can be at elevations of 1,500–3,500m. At these elevations, the departure from the lowland timetable can reach 5–7 minutes for Maghrib. These communities are served by local mosque practices, which may or may not account for elevation.

**Library guidance:** For mountain communities, apply elevation correction (🟡 Limited precedent) and disclose the correction to users. Do not rely on Casablanca or Rabat timetables for High Atlas locations.

---

## UTC Offset History and Ramadan Complexity

Morocco's UTC offset has been unstable and requires careful handling in the library:

**Timeline:**

| Period | Standard Time | Ramadan | Notes |
|--------|--------------|---------|-------|
| Before 2008 | UTC+0 (WET) | UTC+0 | Standard Western European Time |
| 2008–2011 | DST applied | UTC+0 (reverted during Ramadan) | Morocco began observing DST, but suspended it during Ramadan |
| 2012–2017 | UTC+0 (WET) with summer DST (+1) | UTC+0 | Inconsistent application; varied by year |
| 2018–present | UTC+1 year-round | UTC+1 *or* UTC+0 (varies) | Law 04-18 (October 2018) made UTC+1 permanent; but some Ramadans have seen temporary reversion to UTC+0 |

**Current status (as of 2026):** Morocco is nominally UTC+1 year-round. During Ramadan, the government may or may not temporarily revert to UTC+0 for the fasting month. This decision is made annually and announced close to Ramadan. **It must be verified each year.**

**Library implication:**
1. Use the IANA timezone database identifier `Africa/Casablanca` for current dates — most databases track Moroccan DST announcements.
2. For Ramadan calculations in Morocco, add a verification flag prompting the user to confirm the current UTC offset.
3. Historical calculations before 2018 require year-specific UTC offset verification.

---

## Relationship Between Calculated and Published Times

The Ministry publishes pre-calculated timetables, not real-time calculated values. These timetables are computed in advance for each calendar year and represent the **definitive reference** for Morocco.

**Observed discrepancies between formula and Ministry timetable:**

For coastal cities (Casablanca, Rabat, Agadir), the 18°/17° formula applied at the correct coordinates and UTC offset closely matches the Ministry timetable, typically within 1–2 minutes. This suggests the Ministry uses a formula similar to 18°/17° without additional unpublished corrections for these cities.

For inland/elevated cities (Fes, Meknes, Marrakech), a larger discrepancy (~2–4 minutes for Shuruq/Maghrib) is consistent with elevation effects not corrected for by the sea-level formula, suggesting the Ministry's timetable for these cities either incorporates elevation or is calibrated from observation.

**Evaluation data guidance:** The Morocco eval data in `eval/data/` uses Ministry-published timetables as ground truth. Formula improvements are measured against this ground truth. A 🟡 elevation correction for Fes (410m) or Marrakech (466m) is expected to reduce WMAE for these cities.

---

## Atmospheric Notes

**Atlantic coast:** Casablanca, Rabat, and Agadir are on or near the Atlantic. Marine layer and high humidity can affect local refraction, potentially extending twilight slightly relative to standard atmospheric conditions. This is a 🟡–🔴 level consideration with no institutional documentation.

**Saharan region:** Ouarzazate and areas south of the High Atlas have very dry, clear air with low aerosol content. This can reduce effective twilight (less scattering) and potentially make *al-fajr al-sadiq* visible at a slightly shallower sun depression angle. This is a ⚠️ SCHOLARLY REVIEW NEEDED consideration — it would suggest that the 18° angle may produce a Fajr time slightly later than actual dawn in Saharan conditions.

---

## Data Sources

**Ground truth dataset:** `eval/data/train/morocco.json`

Real prayer times were collected from the Aladhan API (api.aladhan.com) for **April 1–10, 2026** using the following parameters:

| City | Coordinates | Method | API Parameters |
|------|------------|--------|---------------|
| Casablanca | 33.5731°N, 7.5898°W, 56m | Custom 99 | `method=99&methodSettings=19,null,17` |
| Rabat | 34.0132°N, 6.8326°W, 75m | Custom 99 | `method=99&methodSettings=19,null,17` |

**Method rationale:** Morocco uses a custom Aladhan method (99) with Fajr 19° and Isha 17°. This differs slightly from the Ministry's published 18°/17° parameters but reflects the actual angles that best reproduce the Ministry's timetable according to community calibration.

**Observations from the collected data:**
- Casablanca and Rabat times differ by approximately 2–4 minutes across all prayers due to their different longitudes (7.59°W vs 6.83°W), consistent with ~0.3 min/km east-west separation.
- Fajr for Casablanca on April 1, 2026: 05:08; Rabat: 05:04 — confirming the westward delay.
- No anomalous values detected; times progress smoothly day over day with expected spring shortening of night.

---

## Coverage and Validation Gaps (2026-05-02)

fajr's Morocco accuracy claims should be read with these scope boundaries in mind. The 19° community calibration is well-validated for the **specific cities, elevations, and date ranges** listed below — not as a blanket Morocco-wide guarantee.

### What is validated

| Layer | Cities | Sample size | Status |
|---|---|---|---|
| Aladhan-Habous calc-vs-calc | Casablanca, Rabat | 20 day-entries (Apr 1–10, 2026) | ~0-min match per [`eval/data/train/morocco.json`](../../../eval/data/train/morocco.json) |
| Mawaqit mosque-published | Casablanca (3 mosques: Moulay Ismail, Qm L-Slm, Bab Arrahmane), Rabat (Ummah), Marrakech (Lthr) | 5 single-day entries | ~2-min WMAE per [`eval/data/test/mawaqit.json`](../../../eval/data/test/mawaqit.json) |

All validated cities are in **coastal or central Morocco at <500m elevation** (Casablanca 56m, Rabat 75m, Marrakech 466m). All validation is on **non-Ramadan days**.

### What is NOT validated

| Untested scope | Why it might matter |
|---|---|
| **Northern Morocco** — Tangier (35.78°N), Tetouan, Al Hoceima, Nador | Latitudes 35°+ produce slightly different twilight-angle behaviour vs Casablanca's 33.6°N. Most likely fine since Habous-19° still routes; needs direct validation. |
| **Eastern Morocco** — Oujda (34.69°N, 1.91°W), Berkane | Eastern longitudes shift sun position. Same fix-pattern as northern; untested. |
| **High-elevation cities** — Ifrane (1665m), Errachidia (1100m), Imilchil (2230m), Ouarzazate (1135m), High Atlas village settlements | fajr's `applyElevationCorrection` is opt-in. Default behaviour returns sea-level times (matches Habous Ministry). If a consumer passes `elevation > 0`, the auto-correction may shift Maghrib/Sunrise by minutes vs local mosque tables. **Untested at any Moroccan coordinate above 500m.** |
| **Sahara / southern provinces** — Laayoune (27.15°N), Dakhla (23.69°N), Smara | Southern latitudes 23-27°N progress further from Casa's 33.6°N. Different shadow lengths affect Asr; different Fajr-angle convergence. Untested. |
| **Ramadan DST transition** | Morocco shifts UTC+1 → UTC+0 during Ramadan, then back. fajr's eval uses `eval/eval.js`'s Intl-based dynamic resolver — handles standard DST transitions but Morocco's Ramadan-specific shift may not resolve cleanly across the transition day. Re-test before relying on fajr for Ramadan suhoor. |
| **Mosque-to-mosque variance** | The 3-mosque Casablanca Mawaqit sample shows ~1-3 min individual variance between mosques. fajr matches the *aggregate* / Habous-published time; individual mosques may add their own *ihtiyati* offset. |

### Known *ikhtilāf* about the 19° community calibration

The Habous Ministry's **formally stated** Fajr angle is **18°**. fajr ships **19°** because that empirically reproduces what Habous actually publishes (Path A community calibration). Users who follow the **formal 18°** will see fajr's Fajr ~5 minutes earlier than their preference.

This is a known *ikhtilāf*, not a bug. Both are defensible:
- **19° (fajr default):** matches what Habous Ministry tables ACTUALLY publish + what Moroccan mosques pray to. Fasting-safer (later imsak window for suhoor).
- **18° (formal stated):** matches the methodology document literally. Some users prefer literal-formal alignment.

### How to extend coverage

1. **Mawaqit slug additions** — extend `scripts/fetch-mawaqit.js` with mosque slugs from Tangier, Oujda, Ifrane, Laayoune. Re-run `npm run fetch:mawaqit`. Each new mosque adds an institutional-grounding signal that the daily refresh routine then tracks.
2. **Habous PDF *imsākiyya* digitisation** — manually transcribe a Habous-published timetable for an untested city (Tangier, Ifrane) into `eval/data/test/habous-extended.json`. Single source of authoritative ground truth covering otherwise-untested coords.
3. **Ramadan-transition test** — once Ramadan 1448 (Feb 2027) approaches, run fajr at Casablanca for the DST-transition days and compare against Habous-published Ramadan calendar.

---

## Cross-References

- [[wiki/methods/morocco]] — Method parameters and institutional authority
- [[wiki/corrections/elevation]] — Elevation correction implementation and classification
- [[wiki/corrections/atmosphere]] — Atmospheric refraction corrections (relevant for coastal/mountain variation)
- [`docs/calibration-recipe.md`](../../../docs/calibration-recipe.md) — generalized methodology for Path A calibrations
