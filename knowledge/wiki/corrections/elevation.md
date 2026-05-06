# Elevation Correction for Shuruq and Maghrib

**Classification:** 🟡→🟢 Approaching established for Shuruq/Sunrise and
Maghrib/Sunset only.

**Current fajr position:** when a city-registry elevation is available, or when
the caller explicitly passes `elevation > 0`, fajr applies geometric horizon-dip
correction to Shuruq/Sunrise and Maghrib/Sunset. fajr does not adjust Fajr,
Dhuhr, Asr, or Isha for elevation. Callers who want uniform sea-level city
timetable practice can pass `elevation: 0`.

This article is the correction-specific backing page. User-facing default
doctrine lives in [docs/positions.md](../../../docs/positions.md), and the
broader disagreement register lives in
[docs/known-disagreements.md](../../../docs/known-disagreements.md).

---

## What Changes

An elevated observer sees a lower visible horizon than an observer at sea
level. That makes the apparent daylight window longer.

| Prayer field | fajr elevation behavior | Reason |
|---|---|---|
| Fajr | unchanged | Twilight-angle boundary; no deployed institutional rule for altitude adjustment. |
| Shuruq / Sunrise | earlier | The sun reaches the depressed visible horizon earlier. |
| Dhuhr | unchanged | Solar noon does not depend on horizon visibility. |
| Asr | unchanged | Shadow-length calculation does not depend on visible horizon. |
| Maghrib / Sunset | later | The sun remains visible above the depressed horizon longer. |
| Isha | unchanged | Twilight-angle boundary; no deployed institutional rule for altitude adjustment. |

fajr exposes the correction through:

- `location.elevation`
- `location.elevationSource`
- `applied.elevationMin`
- `corrections.elevation`
- `corrections.elevationCorrectionMin`
- `notes[]` when city-registry elevation is used or elevation is practically significant

## Formula

Geometric horizon dip:

```txt
dip = arccos(R / (R + h))
```

Approximation for practical elevations:

```txt
dip ~= sqrt(2h / R)
```

Where:

- `h` is elevation above sea level in meters
- `R` is mean Earth radius, 6,371,000 meters

fajr converts the dip angle into minutes with a latitude adjustment:

```txt
minutes ~= dipDegrees * 4 / cos(latitude)
```

The correction is applied as:

- Shuruq/Sunrise: subtract `minutes`
- Maghrib/Sunset: add `minutes`

## Examples

Approximate mid-latitude values:

| Location | Elevation | Correction magnitude |
|---|---:|---:|
| Coastal city | 50 m | about 1 min |
| Makkah | 277 m | about 2 min |
| Fes | 410 m | about 3 min |
| Madinah | 608 m | about 3 min |
| Ankara | 938 m | about 4 min |
| Kabul | 1,791 m | about 5-6 min |
| La Paz | 3,640 m | about 8 min |

Actual clock-minute shifts vary by latitude and date. The sign is stable:
Shuruq/Sunrise earlier, Maghrib/Sunset later.

## Evidence Summary

| Evidence layer | What it supports | Strength | Status |
|---|---|---|---|
| Astronomical geometry | Elevated visible horizon is depressed; sunrise is earlier and sunset later. | Strong | Established physics. |
| Classical fiqh principle | A person who can still see the sun has not yet reached sunset for fasting/Maghrib purposes. | Strong | Multi-madhab principle, but primary-text extraction should continue. |
| UAE / Burj Khalifa | Modern floor-stratified Maghrib/Shuruq handling. | Strong | Reported through multiple public sources and IACAD/Dulook DXB practice; original 2011 IACAD text still needs archival recovery. |
| Safiai et al. 2023 | Scholarly analysis of Burj Khalifa time-zone/floor differentiation. | Medium-strong | Peer-reviewed paper vendored in `knowledge/raw/papers/2026-05-06-elevation-corpus/`. |
| Malaysia Federal Territories / JAKIM-adjacent practice | Modern institutional use of elevation-aware timing for high buildings / topography. | Strong for Malaysia | Source trail should continue to prefer primary mufti/JAKIM publications over journalism. |
| Saudi published city timetables | Uniform Makkah/Madinah city times despite high-rise context. | Strong as observed practice | Do not describe as rejection of the fiqh principle. A primary policy text explaining the rationale has not been retrieved. |
| USNO / AlAdhan calc references | Many standard APIs ignore observer elevation. | Useful for comparison | Explains why elevation can increase error against calc-vs-calc sources while better matching observer reality. |

## Institutional Split

The core fiqh and geometry are not the main dispute. The live product question
is whether a prayer-time system should publish individual elevation-specific
times or a uniform city timetable.

fajr's default is elevation-aware because:

1. The geometry is clear for horizon-crossing events.
2. The observer-visible sunset principle is classically grounded.
3. Modern institutional precedent exists in UAE and Malaysia.
4. The API can disclose the correction and allow opt-out with `elevation: 0`.

But apps should not hide the institutional split:

- Some places publish elevation-aware or floor-aware guidance.
- Some places publish uniform city times for communal practice.
- A local mosque timetable should win for congregational use.

For Saudi Arabia specifically, current wording should be careful: official
Saudi/Umm al-Qura city timetables are uniform. fajr has not retrieved a primary
Saudi policy text saying that the uniform practice is a formal rejection of
elevation correction. Treat that as an institutional practice and citation gap,
not as proof of a fiqh disagreement.

## What fajr Does Not Do

fajr does not adjust Fajr or Isha for altitude. That question involves
atmospheric scattering and observed twilight, not just the geometric visible
horizon. A math-only correction here would be too speculative without stronger
institutional or field-observation support.

fajr also does not infer local mosque buffers from one mosque row. Mosque data
can include adhan/iqama confusion, stale app settings, rounding conventions, or
local ihtiyat buffers. Elevation policy should be validated against official or
multi-mosque data before it becomes a stronger local position.

## Implementation References

- `src/engine.js` resolves city-registry elevation, computes the preview
  correction, emits notes, and applies correction for the city-registry path.
- `src/index.js` preserves the public wrapper behavior for explicit
  `elevation > 0`.
- `applyElevationCorrection(times, elevation, latitude)` applies the correction
  to Shuruq/Sunrise and Maghrib/Sunset only.
- `computeElevationDipMinutes(elevation, latitude)` computes the displayed
  correction magnitude.

## Open Work

- Retrieve primary Arabic IACAD fatwa text for the 2011 Burj Khalifa ruling.
- Retrieve primary Malaysia mufti/JAKIM publications for high-building and
  topographic elevation handling.
- Retrieve or rule out a primary Saudi policy text explaining uniform
  Makkah/Madinah city times in high-rise contexts.
- Build institution-backed elevation fixtures where available, instead of
  relying only on calc-vs-calc sources that ignore elevation.
- Keep Fajr/Isha altitude effects in research only until stronger scholarly and
  observational support exists.

## Related Pages

- [Position registry](../../../docs/positions.md)
- [Known disagreements](../../../docs/known-disagreements.md)
- [Atmospheric refraction](atmosphere.md)
- [Terrain horizon](terrain.md)
- [Astronomy: elevation](../astronomy/elevation.md)
- [Scholarly oversight](../fiqh/scholarly-oversight.md)

## External Scholarly References

- Jamaluddin, M. (2023). "Altitude Correction Test for Islamic Prayer Schedule
  Calculation." Al-Hilal: Journal of Islamic Astronomy, 4(2). DOI:
  [10.21580/al-hilal.2022.4.2.12330](https://doi.org/10.21580/al-hilal.2022.4.2.12330).
- Safiai, M.H. et al. (2023). "Diversity of Time Zones at Burj Khalifa in
  Performing Prayers and Fasting in Skyscrapers." International Journal of
  Advanced Research, 11(01), 1808-1812. DOI:
  [10.21474/IJAR01/16210](https://doi.org/10.21474/IJAR01/16210).
