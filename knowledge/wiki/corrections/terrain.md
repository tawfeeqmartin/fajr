# Terrain Horizon Obstruction Correction

**Classification:** 🔴 Novel
⚠️ SCHOLARLY REVIEW NEEDED — This correction has no precedent in Islamic scholarly tradition and must not be deployed for prayer use without review by qualified scholars.

A mosque in a mountain valley may have its effective horizon raised by surrounding terrain, causing Maghrib to appear later and Shuruq to appear earlier than even the elevation-corrected calculation predicts.

---

## How Terrain Obstruction Differs from Elevation

The [[wiki/corrections/elevation]] page covers the geometric depression of the horizon for an observer at elevation above sea level. That correction assumes the horizon is a smooth spherical Earth surface — the observer sees the "true" mathematical horizon in every direction.

Terrain obstruction is a different and additional effect: even if an observer is at elevation, the surrounding terrain (mountains, ridges, hills) may raise the *visible* horizon above the mathematical spherical-Earth horizon in specific directions. This is distinct from the observer's own elevation — it is caused by features *external to* the observer's position.

**Contrasting scenarios:**

| Scenario | Horizon in sunset direction | Sunrise direction |
|----------|---------------------------|------------------|
| Sea-level flat plain | Standard 0° (sea-level formula) | Standard 0° |
| Mountain peak (1500m) | Depressed by ~1.25° (elevation correction applies) | Depressed by ~1.25° |
| Mountain valley (1000m), surrounded by 500m-higher ridges | Possibly *elevated* above mathematical horizon by ridge height | Possibly elevated |
| Urban area at sea level | Standard; tall buildings rarely significant at distances > 1km | Standard |

In the mountain valley case, the visible horizon in the direction of sunset may be 2°–5° *above* the mathematical horizon due to the ridge on the western side. This means the sun disappears behind the ridge significantly *before* it reaches the mathematical sunset altitude of −0.833°. The visible Maghrib occurs **earlier** than the formula predicts. Similarly, Shuruq (sunrise) from a valley with a high eastern ridge occurs **later** than the formula predicts.

---

## Technical Approach: Horizon Profiles from DEM Data

Computing the terrain-blocked horizon requires a Digital Elevation Model (DEM):

**Step 1: Obtain DEM data** around the observer location.
- SRTM 1-arc-second (NASA, ~30m resolution globally)
- ASTER GDEM v3 (~30m)
- Copernicus DEM GLO-30 (~30m, better accuracy ±4m vs. SRTM's ±16m)
- Local national survey data where available (often better than 10m resolution)

**Step 2: Compute horizon profile.** For a set of azimuths (e.g., every 1°), trace a ray from the observer outward to the maximum relevant distance (typically 50–100km for tall ridges) and compute the angular elevation to the highest terrain point along that ray:

```
horizon_angle(azimuth) = max over all points { arctan(height_difference / distance) }
```

**Step 3: Look up the horizon angle at the sun's azimuth** for each prayer's critical solar position (Shuruq azimuth for sunrise, Maghrib azimuth for sunset).

**Step 4: Solve for the time** when the sun's center reaches that elevation (instead of the standard −0.833°). A raised horizon of +2° means the sun must be at +2° − 0.833° = +1.167° for the observer to see it clear the terrain, and the time of this event is Shuruq.

Available APIs and tools:
- **PVGIS Horizon Profile API** (European Commission Joint Research Centre): computes horizon profiles from elevation data for any European location. Free, HTTP API.
- **SunCalc.org terrain profiles:** Manual lookup tool.
- **py-dem-stitcher / elevation.py:** Python libraries for programmatic SRTM access.
- Custom DEM processing with GDAL or rasterio.

---

## Data Accuracy Limits

The fundamental limitation is DEM vertical accuracy:
- SRTM: ±16m vertical error (90th percentile), with known voids and artifacts in steep terrain
- Copernicus DEM GLO-30: ±4m vertical error — significantly better
- ASTER: similar to SRTM, with known striping artifacts

**Error propagation for terrain horizon:**

If a ridge is 10km from the observer and its height has ±16m uncertainty:
```
angular uncertainty = arctan(±16m / 10,000m) = ±0.092°
```

This ±0.092° angular uncertainty in the horizon produces approximately ±0.37 minutes (±22 seconds) of Shuruq/Maghrib uncertainty. Compounded across multiple ridges and with the inherent terrain resolution limitations, the realistic uncertainty in a terrain-corrected prayer time is likely ±0.3°–0.5° = ±1–2 minutes.

At a 30m DEM resolution, terrain features smaller than ~30m are not represented. In high-relief terrain with sharp ridges, the effective horizon angle may be underestimated (terrain appears smoother than it is), causing the correction to be *understated*.

---

## Practical Impact Assessment

**When terrain correction is significant:**
- Observer in a deep valley surrounded by ridges 500m+ higher, within 10–20km
- Single dominant peak or ridge in the direction of sunset/sunrise
- Communities in narrow mountain valleys (Atlas, Alps, Himalayas, Andes, Rockies)

**When terrain correction is negligible:**
- Urban areas (tall buildings are typically < 100m and at < 1km; angular effect < 0.1°)
- Coastal or plains areas with unobstructed horizons
- Elevated positions with 360° view

**Estimated magnitude in extreme cases:**
- Atlas mountain valley at 1,500m, surrounded by 2,500m ridges 5km away:
  - Ridge elevation above observer: +1,000m
  - Angular elevation of ridge: arctan(1000/5000) = 11.3°
  - Even accounting for DEM smoothing and realistic distances, such valleys could have effective horizon obstruction of 3°–8° in specific azimuth directions
  - At 5° horizon obstruction, Maghrib could occur 20+ minutes earlier than the sea-level formula predicts, and 15+ minutes earlier than the elevation-only correction predicts

This is a substantial and real-world effect for communities in such terrain. However, it is also highly location-specific and direction-dependent.

---

## Why This Is Classified 🔴 Novel

Unlike elevation correction (which applies a universal geometric formula that any classical astronomer would recognize), terrain-based DEM correction represents a fundamentally new class of input to prayer time calculation:

1. **No classical precedent:** The *muwaqqitun* knew that mountain communities observed sunrise and sunset differently, but their approach was local observation calibration, not algorithmic DEM processing.

2. **No institutional precedent:** No major Islamic institution — not Umm al-Qura, not JAKIM, not the Egyptian GAAS, not ISNA — has published timetables incorporating terrain DEM corrections.

3. **Approaches the boundary of wasail/ibadat:** Terrain correction redefines when the sun is "visible" to the observer. This connects directly to the shar'i definition of Maghrib ("when the sun sets") and Shuruq ("when the sun rises"). Whether "sunset" means the sun reaching the mathematical horizon or the sun disappearing behind locally visible terrain is a shar'i question, not a purely astronomical one.

4. **Potential for harm:** A poorly implemented terrain correction could systematically shift Maghrib to a time before the mathematical sunset — meaning Iftar in Ramadan would be broken before the sun has actually set as mathematically defined. This would be a serious jurisprudential error.

---

## Library Status

This correction is implemented in the fajr library as a **research and experimental feature only**:
- Not enabled by default
- Not deployed in production prayer time output
- Documented here for future scholarly review
- The eval harness does not measure WMAE for terrain-corrected results

Before this correction can be considered for deployment:
1. A qualified *faqih* or Islamic scholarly institution must rule on whether the shar'i definition of "sunrise" and "sunset" refers to the mathematical horizon or the locally visible horizon
2. The ruling must address mountain valley communities specifically
3. An institutional timetable from a recognized authority must adopt this approach

---

## Related Pages

- [[wiki/corrections/elevation]] — The precursor correction (elevation-based dip) which is 🟡 rather than 🔴
- [[wiki/fiqh/scholarly-oversight]] — Why 🔴 Novel corrections require scholarly review before deployment
- [[wiki/astronomy/elevation]] — The geometric principles underlying both elevation and terrain corrections
