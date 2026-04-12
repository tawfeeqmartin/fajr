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

No major contemporary Islamic institution (MWL, ISNA, JAKIM, Diyanet, Egyptian GAAS) has formally published elevation-corrected prayer timetables. The correction is geometrically established but institutionally unadopted.

This gives the correction a **🟡 Limited precedent** classification: the underlying geometry is classical and uncontroversial, but the systematic application to prayer times is not formally endorsed by any institution.

⚠️ Deploying this correction should include disclosure to users. In the fajr library's output, an elevation-corrected result should be labeled as such, and the correction amount (in minutes) should be accessible.

---

## Related Pages

- [[wiki/astronomy/elevation]] — The physics and geometry of horizon dip
- [[wiki/corrections/atmosphere]] — Atmospheric refraction corrections that interact with elevation
- [[wiki/fiqh/scholarly-oversight]] — Why 🟡 classification means disclosure, not suppression
- [[wiki/regions/morocco]] — Morocco as a practical case with significant elevation variation
