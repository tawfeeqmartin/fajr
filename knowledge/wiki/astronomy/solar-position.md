# Solar Position Algorithms for Prayer Time Calculation

Accurate solar position is the foundation of every calculated prayer time; small angular errors in the sun's position translate directly into errors in sunrise, sunset, and twilight times.

---

## Why Precision Matters

Prayer time calculations depend on the sun reaching specific angular positions relative to the observer's horizon. Because the sun moves at roughly 0.25° per minute (1° per four minutes of time), an error of 1 arcminute (0.0167°) in computed solar altitude translates to approximately 4 seconds of error in sunrise or sunset time. At twilight angles used for Fajr and Isha (typically 15°–20° below the horizon), the sun's rate of altitude change is smaller — the geometry is more oblique — so the same 1 arcminute positional error produces a larger time error of roughly 8–12 seconds. Errors compound across the full chain: coordinate → solar declination → hour angle → time.

At high latitudes (above ~55°N), where the sun travels at a shallow angle to the horizon, even a 0.01° error in solar declination can produce 1–2 minute errors in Fajr/Isha. This makes algorithm selection non-trivial for a library targeting sub-minute accuracy.

---

## Algorithm Tiers

### NREL Solar Position Algorithm (SPA)

**Citation:** [Reda & Andreas, 2004] — "Solar Position Algorithm for Solar Radiation Applications," NREL/TP-560-34302.

The SPA is the reference-grade algorithm for solar position calculation. Key specifications:

- **Accuracy:** ±0.0003° (1.08 arcseconds) in solar zenith and azimuth angles
- **Valid range:** 2000 BCE to 6000 CE
- **Ephemeris basis:** Uses periodic terms derived from the JPL DE405 ephemeris (consistent with DE430 to the precision of the algorithm)
- **Inputs:** Julian Ephemeris Day, observer latitude/longitude/elevation, pressure, temperature, atmospheric refraction coefficient
- **Outputs:** Solar zenith angle, azimuth, right ascension, declination, equation of time, hour angle

The SPA accounts for: Earth's heliocentric longitude/latitude using 64 periodic terms, the nutation in longitude and obliquity using 63 terms, aberration correction, apparent sidereal time, and the atmospheric refraction model.

The SPA is the appropriate choice for validation benchmarks and edge-case verification. For the fajr library, it serves as the ground truth when cross-checking calculated times against observed timetables.

See [[wiki/astronomy/refraction]] for how the SPA handles the refraction input parameter.

### Jean Meeus — Astronomical Algorithms

**Citation:** [Meeus, 1998] — *Astronomical Algorithms*, 2nd ed. Willmann-Bell.

Meeus's book provides accessible, implementable algorithms based on the VSOP87 analytical planetary theory. This is the algorithm underlying most open-source prayer time implementations, including `adhan.js`.

- **Accuracy:** ±0.01° in solar position for dates near J2000.0 (year 2000), degrading slightly for dates further from epoch
- **Implementation complexity:** Moderate — uses truncated VSOP87 series (requires ~50 periodic terms for the truncated version)
- **Key chapters for prayer times:** Chapter 25 (Solar Coordinates), Chapter 27 (Equation of Time and Solar Noon), Chapter 13 (Transformation of Coordinates)

For daily prayer time calculation at normal latitudes and present-day dates, Meeus accuracy is sufficient. The ±0.01° positional error produces at most ±2–3 seconds of prayer time error, well within the irreducible atmospheric uncertainty floor of ~2 minutes discussed in [[wiki/astronomy/refraction]].

The `adhan.js` implementation follows Meeus Chapter 25 for solar coordinates and Chapter 15 for sidereal time. The fajr library inherits this implementation.

### JPL DE440/DE441 Ephemeris

**Citation:** [Park et al., 2021] — "The JPL Planetary and Lunar Ephemerides DE440 and DE441," *Astronomical Journal* 161:105.

The JPL Development Ephemerides (DE series) represent the highest-precision numerical integration of planetary motion available, fitted to spacecraft tracking data and lunar laser ranging.

- **DE440:** covers 1550–2650 CE, highest precision
- **DE441:** covers 13201 BCE to 17191 CE, slightly lower precision for distant dates
- **Accuracy:** sub-arcsecond (better than 0.001°) for planetary positions
- **Use in fajr:** Appropriate for validation benchmarks only; direct use requires interpolation of binary table files (not practical in a JavaScript runtime without external service calls)

DE440/DE441 is the benchmark against which both SPA and Meeus can be validated. Any systematic bias in the Meeus implementation can be quantified by comparing against DE441 output.

### Low-Precision Approximations

Several faster approximations exist for constrained environments:

- **USNO Circular 163** [Michalsky, 1988]: Accuracy ±0.01°, valid 1950–2050. Used in some embedded systems.
- **IAU SOFA routines**: Software package of reference algorithms from the International Astronomical Union; high accuracy but large footprint.
- **Low-precision formulas** (e.g., as in Meeus Chapter 25 abbreviated form): ±0.1°, sufficient only for rough estimates. Not appropriate for prayer time calculation at any latitude where minute-level precision is needed.

---

## Key Solar Quantities for Prayer Times

The following quantities must be computed for each prayer time calculation:

| Quantity | Definition | Used For |
|----------|-----------|----------|
| **Solar declination (δ)** | Sun's angular distance north/south of celestial equator | All prayer times |
| **Equation of time (EoT)** | Difference between apparent solar noon and mean solar noon | Dhuhr (true solar noon) |
| **True solar noon** | The moment the sun crosses the local meridian | Dhuhr start, hour angle reference |
| **Hour angle at horizon crossing** | Angle from meridian when sun's center is at the target altitude | Fajr, Shuruq, Maghrib, Isha |
| **Right ascension (α)** | Sun's coordinate on the celestial equator | Sidereal time conversion |
| **Apparent sidereal time (θ₀)** | Greenwich sidereal time corrected for nutation | Geographic-to-equatorial coordinate transform |

The critical formula linking these quantities to a prayer time is the spherical law of cosines applied to the astronomical triangle:

```
cos(H) = (sin(alt) - sin(lat)·sin(δ)) / (cos(lat)·cos(δ))
```

where `H` is the hour angle, `alt` is the target altitude (e.g., -0.833° for sunrise/sunset, -18° for astronomical twilight), `lat` is observer latitude, and `δ` is solar declination. See [[wiki/fiqh/prayer-definitions]] for the Islamic definitions of each target altitude.

---

## Algorithm Selection Guidance

| Use Case | Recommended Algorithm | Justification |
|----------|----------------------|---------------|
| Daily production calculation | Meeus (Chapter 25) | ±0.01° accuracy; well-tested in adhan.js; sufficient for normal latitudes |
| Validation against official timetables | NREL SPA | ±0.0003° accuracy; eliminates algorithm error from the comparison |
| Edge case testing (high latitudes, extreme dates) | NREL SPA | Better accuracy near the polar twilight boundaries |
| Embedded/resource-constrained | USNO Circular 163 | Acceptable ±0.01° for 1950–2050 |
| Historical date research | DE441 via external service | Highest accuracy for dates outside J2000.0 vicinity |

For the fajr library's current architecture, Meeus via adhan.js is the production algorithm, with NREL SPA used in the eval harness for validation benchmarks where algorithmic error should not contaminate the measurement of correction effectiveness.

---

## Related Pages

- [[wiki/astronomy/refraction]] — How atmospheric refraction modifies the effective horizon altitude
- [[wiki/astronomy/elevation]] — How observer elevation changes the geometric horizon
- [[wiki/fiqh/prayer-definitions]] — The Islamic definitions of prayer time boundaries that these algorithms serve
- [[wiki/corrections/atmosphere]] — Temperature and pressure corrections to the refraction model
