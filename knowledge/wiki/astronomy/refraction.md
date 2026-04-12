# Atmospheric Refraction and Its Effect on Prayer Times

Atmospheric refraction raises the apparent position of the sun above its geometric position; the standard correction of 0.833° is built into all sunrise/sunset calculations, but non-standard conditions can shift prayer times by 1–3 minutes.

---

## What Atmospheric Refraction Is

When sunlight travels from the near-vacuum of space into the Earth's atmosphere, it enters a medium of increasing density. This causes the light path to bend (refract) downward toward the denser layers. The practical effect for an observer on the ground is that the sun appears *higher* in the sky than its true geometric position. At the horizon, this effect is largest: the sun's apparent disk is fully above the geometric horizon even when the sun's geometric center is approximately 0.833° below it.

This matters for prayer times because:

1. **Shuruq (sunrise)** and **Maghrib (sunset)** are defined by the sun's *apparent* disk touching the horizon — the visually observed event.
2. **Fajr** and **Isha** are defined by the appearance/disappearance of twilight, which is itself a refraction-dependent phenomenon (light scattering in the upper atmosphere).
3. The standard 0.833° correction is built into the sunrise/sunset calculation and is not separately tunable in most implementations — but its components can vary.

---

## The Standard 0.833° Correction

The standard horizon altitude used in prayer time calculations is **−0.833°**, composed of two parts:

| Component | Value | Source |
|-----------|-------|--------|
| Sun's mean semidiameter | +0.2667° (16 arcminutes) | Mean angular radius of the sun's disk |
| Mean atmospheric refraction at horizon | +0.5667° (34 arcminutes) | Standard atmospheric conditions |
| **Total** | **0.833°** | **Standard correction** |

The sun's semidiameter varies slightly (0.2617°–0.2723°, i.e., 15.7'–16.3') over the year due to Earth's elliptical orbit. The mean value of 16' is universally used in prayer time tables and is appropriate for the ±0.01° accuracy level of the Meeus algorithm.

The 34' mean refraction value corresponds to standard atmospheric conditions: temperature T = 10°C, pressure P = 1010 mbar. Real atmospheric conditions deviate from this standard, as described below.

**Classification:** 🟢 Established — the 0.833° correction is universally used in Islamic prayer time calculation, embedded in every major institutional timetable system, and consistent with classical astronomical practice.

---

## Bennett 1982 Formula for Altitude-Dependent Refraction

For calculating refraction at altitudes other than the horizon (relevant for the twilight calculations in Fajr and Isha), the Bennett formula is the standard reference:

**Citation:** [Bennett, 1982] — "Practical work in elementary astronomy," cited in Meeus 1998, Chapter 16.

```
R(h) = 1 / tan(h + 7.31 / (h + 4.4))   [arcminutes]
```

where `h` is the apparent altitude in degrees. This formula is valid for `h > −5°`.

Selected values:

| Altitude h | Refraction R |
|-----------|-------------|
| 0° (horizon) | ~34 arcminutes |
| −0.5° | ~39 arcminutes |
| −1° | ~45 arcminutes |
| 5° | ~10 arcminutes |
| 45° | ~1 arcminute |
| 90° (zenith) | ~0 arcminutes |

Note that refraction *increases* as the sun goes below the horizon, meaning the sun's light lingers longer than the geometric calculation suggests. This is relevant to the persistence of twilight at angles just below the horizon.

---

## Saemundsson 1986 Correction for Extreme Low Altitudes

For altitudes below −1°, the Bennett formula becomes less accurate. Saemundsson provides a correction factor applicable at very low altitudes:

**Citation:** [Saemundsson, 1986] — "Atmospheric refraction," *Sky & Telescope* 72:70.

The Saemundsson correction adjusts the Bennett result by approximately +0.06' at −2° altitude, increasing to several arcminutes at very large negative altitudes. For prayer time calculation, this correction is relevant only in the theoretical sense, as the actual twilight phenomena (Fajr and Isha) occur when the sun is 12°–20° below the horizon, where refraction is already very small (< 1 arcminute) and where the continuous-twilight approximations used in high-latitude solutions dominate.

---

## Temperature and Pressure Corrections

Standard refraction assumes T = 10°C and P = 1010 mbar. Real conditions require correction:

**Combined correction formula:**

```
R_corrected = R_standard × (P / 1010) × (283 / (273 + T))
```

where P is pressure in millibars and T is temperature in Celsius.

**Temperature effect:** Higher temperatures reduce air density, reducing refraction. At T = 40°C (summer in the Gulf), the temperature factor is 283/313 = 0.904, reducing refraction by ~10%. At T = −20°C (winter in Helsinki), the factor is 283/253 = 1.119, increasing refraction by ~12%.

**Pressure effect:** Higher-altitude cities have significantly lower atmospheric pressure. At 3,000m elevation, typical pressure is ~700 mbar; the pressure factor is 700/1010 = 0.693, reducing refraction by ~31%. This interacts with the elevation correction discussed in [[wiki/corrections/elevation]].

**Effect on prayer times:** Each 0.1° change in effective horizon altitude corresponds to approximately 24 seconds at mid-latitudes (40°N) and up to 40 seconds at higher latitudes (55°N). The temperature correction (up to ~0.057° = 3.4' at extreme temperatures) can shift Shuruq/Maghrib by up to ~1.5 minutes in extreme conditions.

**Classification:** 🟡 Limited precedent — the physics of temperature/pressure corrections is well-established astronomy. However, no major Islamic institution formally incorporates temperature/pressure refraction corrections into published timetables. The corrections are consistent with the shar'i intent of precision and with the practice of classical *muwaqqitun* who worked with observed local times. See [[wiki/corrections/atmosphere]] for the full correction implementation.

---

## The Irreducible Uncertainty Floor

**Citation:** [Young, 2006] — "Sunset science IV: Low-altitude refraction," *Astronomical Journal* 131:1930–1943.

Young's analysis of real atmospheric refraction measurements establishes a fundamental result: local atmospheric variability (turbulence, humidity gradients, temperature inversions) creates an irreducible uncertainty in horizon refraction of approximately **±2 minutes**, even under careful observing conditions.

This means:
- No formula, however sophisticated, can predict the exact moment of sunrise or sunset to better than ~2 minutes at a given location on a given day without real-time atmospheric measurement.
- For prayer time tables that are calculated weeks or months in advance, this 2-minute floor is an inherent physical limitation, not a modeling deficiency.
- The implication for the fajr library: sub-minute accuracy improvements from refraction corrections are theoretically meaningful but cannot be verified against observed timetables, since timetables themselves reflect smoothed (not day-by-day atmospheric) values.

This uncertainty floor applies specifically to Shuruq and Maghrib. For Fajr and Isha (defined by twilight angles at 12°–20° below the horizon), the sun is well below the zone of strong horizon refraction, and atmospheric variability has less effect on the twilight calculation — though it remains a factor in the total uncertainty budget.

---

## Summary of Refraction Effects on Prayer Times

| Prayer | Refraction Effect | Magnitude | Classification |
|--------|------------------|-----------|----------------|
| Fajr | Indirect — twilight angle; refraction in upper atmosphere affects sky glow distribution | Small (~0–30 sec) | 🟡 |
| Shuruq | Direct — 0.833° standard correction shifts apparent sunrise | Built into standard calculation | 🟢 |
| Dhuhr | None (solar noon is not altitude-dependent) | — | — |
| Asr | Negligible (sun is well above horizon; refraction < 1') | < 5 seconds | 🟢 |
| Maghrib | Direct — 0.833° standard correction shifts apparent sunset | Built into standard calculation | 🟢 |
| Isha | Indirect — same as Fajr | Small | 🟡 |

---

## Related Pages

- [[wiki/corrections/atmosphere]] — Full implementation of temperature/pressure refraction corrections
- [[wiki/astronomy/elevation]] — Geometric horizon depression at elevation (interacts with refraction)
- [[wiki/astronomy/solar-position]] — The solar position algorithms that feed the refraction-corrected altitude calculation
- [[wiki/fiqh/prayer-definitions]] — Islamic definitions of prayer boundaries, including the shar'i status of the 0.833° standard
