# Elevation Effects on Prayer Times

An observer at elevation above sea level sees a geometrically depressed horizon; this makes sunrise appear earlier and sunset appear later, with effects ranging from ~1 minute at 100m to ~8 minutes at 3,600m.

---

## The Physical Mechanism

All standard prayer time algorithms assume the observer is at sea level and that the horizon is at 0° altitude (true horizontal). When an observer is at height `h` above the reference geoid, the visible horizon is not at 0° but is geometrically *depressed* below true horizontal by an angle δ (the "dip of the horizon").

This depression means:
- **Shuruq (sunrise):** The sun's disk reaches the observer's visible horizon *before* it would for a sea-level observer at the same latitude/longitude. Sunrise is **earlier** at elevation.
- **Maghrib (sunset):** The sun's disk remains above the depressed horizon *longer* than at sea level. Sunset is **later** at elevation.
- **Fajr/Isha:** These are defined by twilight angles (the sun being 15°–20° below the horizon). The twilight angle is referenced to the astronomical horizon, not the geometric dip horizon. The sun must reach the same absolute altitude below the true horizon regardless of observer elevation. **Fajr and Isha are not directly affected by elevation.** ⚠️ SCHOLARLY REVIEW NEEDED on whether the shar'i definition implies the visible or astronomical horizon for twilight-based prayers — see discussion below.
- **Dhuhr:** Defined by the sun crossing the local meridian (solar noon). This is independent of horizon geometry and is not affected by elevation.
- **Asr:** Defined by shadow length ratios, which depend on the sun's altitude angle above the observer, not on the horizon. Not directly affected by elevation. (Indirectly affected insofar as Asr end time depends on Maghrib in some edge-case calculations — negligible.)

---

## Dip Angle Formula

The geometric dip of the horizon for an observer at height `h` (meters) above sea level:

**Exact formula:**
```
δ = arccos(R / (R + h))   [radians, then convert to degrees]
```

**Approximation (valid for h << R):**
```
δ ≈ sqrt(2h / R) × (180 / π)   [degrees]
```

where:
- `R` = 6,371,000 m (mean Earth radius)
- `h` = elevation in meters above sea level

**Derivation:** The observer at height `h` has a line of sight tangent to the Earth's surface. The geometry forms a right triangle with the hypotenuse being the line of sight (length = sqrt(2Rh + h²) ≈ sqrt(2Rh)), the adjacent side being R, and the angle at the Earth's center being arccos(R/(R+h)).

Note: This formula gives the *geometric* dip. The *apparent* dip is slightly less than geometric dip due to atmospheric refraction along the line of sight to the horizon. The correction is approximately: apparent dip ≈ 0.87 × geometric dip, but this refinement is rarely applied in prayer time calculations. See [[wiki/corrections/atmosphere]] for the full refraction treatment.

---

## Example Values

| Location | Elevation | Geometric Dip δ | Approx. Time Shift |
|----------|-----------|----------------|-------------------|
| Sea level reference | 0 m | 0° | 0 min |
| Generic coastal city | 50 m | 0.23° | ~0.9 min |
| Generic inland city | 100 m | 0.32° | ~1.3 min |
| Makkah, Saudi Arabia | 277 m | 0.53° | ~2.1 min |
| Madinah, Saudi Arabia | 608 m | 0.79° | ~3.2 min |
| Ankara, Turkey | 938 m | 0.98° | ~3.9 min |
| Amman, Jordan | 777 m | 0.89° | ~3.6 min |
| Kabul, Afghanistan | 1,791 m | 1.36° | ~5.4 min |
| Addis Ababa, Ethiopia | 2,355 m | 1.56° | ~6.2 min |
| La Paz, Bolivia | 3,640 m | 1.94° | ~7.8 min at equator |
| Top of Burj Khalifa | 828 m | 0.92° | ~3.7 min |

Time shift values are approximate, computed as: Δt ≈ δ / (0.25° per minute) = δ × 4 minutes/degree. Actual shift depends on the sun's angle to the horizon, which varies with latitude and season; at higher latitudes the sun rises/sets at a more oblique angle and each degree of dip corresponds to more time.

---

## Fajr and Isha: The Scholarly Question

Standard elevation correction applies only to Shuruq and Maghrib. Fajr and Isha present a more complex question.

The shar'i definitions:
- **Fajr** begins when *al-fajr al-sadiq* (the true dawn) appears: "the spreading of white light across the horizon" [Al-Bukhari, 1093]. This is a visual phenomenon in the upper atmosphere.
- **Isha** ends (or begins) when the *shafaq* (twilight glow) disappears [Muslim, 966].

The astronomical proxy for these phenomena is the sun reaching a specific angle below the horizon (typically 15°–18° for Fajr, 15°–17° for Isha). This angle is referenced to the astronomical horizon (true horizontal plane through the observer) — it is a property of the sun's position in the sky, not of the observer's visible horizon.

**The question:** Does being at 3,000m elevation change when *al-fajr al-sadiq* becomes visible? Astronomically, the answer is: slightly yes, because at elevation the upper atmosphere is thinner and darker on the observer's side, potentially requiring the sun to be slightly *closer* to the horizon (shallower angle) for the same light level to appear. This would imply a *smaller* effective twilight angle at high elevation — Fajr would be slightly *later* and Isha slightly *earlier*.

This remains ⚠️ SCHOLARLY REVIEW NEEDED — no major Islamic institution has published guidance on elevation-corrected Fajr/Isha angles, and classical *muwaqqit* texts do not address this distinction systematically.

**Current implementation guidance:** Apply elevation correction to Shuruq and Maghrib only. Do not adjust Fajr/Isha twilight angles for elevation without scholarly sanction. See [[wiki/fiqh/scholarly-oversight]] for the classification framework.

---

## Elevation Data Sources

| Source | Resolution | Vertical Accuracy | Access |
|--------|-----------|------------------|--------|
| SRTM 1-Arc-Second (NASA) | ~30m | ±16m (90th percentile) | Free download (earthdata.nasa.gov) |
| SRTM 3-Arc-Second | ~90m | ±16m | Free download |
| ASTER GDEM v3 | ~30m | ±17m | Free download (earthdata.nasa.gov) |
| Copernicus DEM GLO-30 | ~30m | ±4m (much better) | Free (Copernicus Open Access) |
| Open-Elevation API | Wraps SRTM | ±16m | Free, rate-limited |
| Google Maps Elevation API | ~10m (urban), 30m (rural) | ±3–10m (urban) | Commercial, per-request |
| Device GPS altitude | — | ±10–20m typical | Real-time, noisy |

For prayer time calculation, vertical accuracy of ±16m (SRTM) produces dip angle uncertainty of approximately ±0.04° at 277m (Makkah), corresponding to ±0.16 minutes (~10 seconds) of time uncertainty. This is acceptable for the ~1-2 minute correction being applied. GPS altitude is noisier and subject to multipath errors; smoothed GPS altitude from multiple readings is preferable.

---

## Implementation Notes

The elevation correction should be applied as an additive offset to the horizon altitude used in the hour-angle calculation:

```
// Elevation correction for sunrise/sunset
// Classification: 🟡 Limited precedent
// See: knowledge/wiki/astronomy/elevation.md
const dipAngleDeg = Math.sqrt(2 * elevationMeters / 6371000) * (180 / Math.PI);
const adjustedHorizonAlt = -0.833 - dipAngleDeg;  // for Shuruq/Maghrib
```

The dip angle is subtracted from (i.e., makes more negative) the horizon altitude, causing the hour angle solution to yield an earlier sunrise and later sunset.

**Classification:** 🟡 Limited precedent — geometrically unambiguous, consistent with classical astronomical practice, but not uniformly adopted by major Islamic institutions in published timetables. See [[wiki/corrections/elevation]] for the full correction page.

---

## Related Pages

- [[wiki/corrections/elevation]] — Full correction implementation with per-prayer applicability
- [[wiki/astronomy/refraction]] — Atmospheric refraction interacts with the geometric dip
- [[wiki/fiqh/scholarly-oversight]] — Classification framework governing whether this correction can be deployed
- [[wiki/regions/morocco]] — Morocco's High Atlas mountains (up to 4,167m) as a practical case study
