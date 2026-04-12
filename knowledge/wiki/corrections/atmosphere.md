# Atmospheric Refraction Corrections Beyond Standard

**Classification:** 🟡 Limited precedent

The standard 0.833° horizon correction assumes T=10°C and P=1010 mbar; real atmospheric conditions — especially at high elevation or in extreme temperatures — can shift Shuruq and Maghrib by up to 1.5 minutes from the standard-atmosphere prediction.

---

## What This Page Covers

The standard 0.833° correction (16' solar semidiameter + 34' mean horizon refraction) is built into all prayer time calculations and is documented in [[wiki/astronomy/refraction]]. That page establishes the physical basis. This page covers the *corrections to the standard correction* — adjustments for non-standard temperature and pressure conditions.

These corrections apply to the **horizon refraction component** (the 34'/0.567° part, not the solar semidiameter). The solar semidiameter is not atmosphere-dependent.

---

## Bennett 1982 Formula (Baseline)

**Citation:** [Bennett, 1982] — altitude-dependent refraction formula, as presented in [Meeus, 1998], Chapter 16.

For the horizon (apparent altitude h = 0°):
```
R(0°) = 1 / tan(0° + 7.31 / (0° + 4.4))
       = 1 / tan(7.31/4.4)
       = 1 / tan(1.661°)
       ≈ 34.4 arcminutes
```

This value, under standard atmospheric conditions (T=10°C, P=1010 mbar), is the 34' component of the standard 0.833° correction. All temperature/pressure corrections are applied as multipliers to this baseline value.

---

## Temperature Correction

Higher temperature → less dense air → less refraction → sun's apparent position closer to true position → effective horizon correction decreases → Shuruq occurs slightly later (closer to geometric), Maghrib slightly earlier.

**Formula:**
```
R_T = R_standard × (283 / (273 + T))
```

where T is temperature in Celsius.

**Temperature correction factor:**

| Temperature | Factor | Change in R | Effect |
|------------|--------|------------|--------|
| −30°C (extreme Arctic winter) | 283/243 = 1.165 | +5.6' | Refraction increases; Shuruq earlier, Maghrib later |
| −20°C (Helsinki winter) | 283/253 = 1.119 | +4.0' | +~1.0 min |
| 0°C | 283/273 = 1.037 | +1.3' | +~0.3 min |
| +10°C (standard) | 283/283 = 1.000 | 0 (reference) | — |
| +20°C (spring in mid-latitudes) | 283/293 = 0.966 | −1.2' | −~0.3 min |
| +30°C (summer continental) | 283/303 = 0.934 | −2.3' | −~0.6 min |
| +40°C (Gulf summer, Sahara) | 283/313 = 0.904 | −3.2' | −~0.8 min |
| +50°C (extreme desert) | 283/323 = 0.876 | −4.1' | −~1.0 min |

**Practical range:** ±1 minute across the full realistic temperature range (−20°C to +45°C). Not negligible for sub-minute accuracy goals.

---

## Pressure Correction

Higher pressure → denser air → more refraction. Lower pressure (high altitude) → less refraction.

**Formula:**
```
R_P = R_standard × (P / 1010)
```

where P is atmospheric pressure in millibars.

**Pressure at altitude (standard atmosphere approximation):**
```
P(h) ≈ 1013.25 × (1 - 0.0000226 × h)^5.256   [mbar, h in meters]
```

Approximate values:

| Altitude | Pressure | Pressure Factor | Effect on R |
|---------|---------|----------------|------------|
| 0m (sea level) | 1013 mbar | 1.003 | +0.1' |
| 500m | 954 mbar | 0.945 | −1.9' |
| 1000m | 899 mbar | 0.890 | −3.7' |
| 1500m | 846 mbar | 0.838 | −5.5' |
| 2000m | 795 mbar | 0.787 | −7.3' |
| 2500m | 747 mbar | 0.739 | −9.2' |
| 3000m | 701 mbar | 0.694 | −11.0' |
| 3640m (La Paz) | 649 mbar | 0.643 | −13.6' |

At La Paz (3,640m), the pressure reduction alone reduces horizon refraction from 34' to ~22' — a reduction of 12 arcminutes. This translates to approximately 0.2° less effective refraction and about 0.8 minutes less "lingering" of the sun above the visible horizon at sunset.

---

## Combined Correction

**Full formula:**
```
R_corrected = R_standard × (P / 1010) × (283 / (273 + T))
```

**Example: La Paz in summer (T=15°C, elevation 3640m, P≈650 mbar)**
```
R_corrected = 34' × (650/1010) × (283/(273+15))
            = 34' × 0.644 × 0.982
            = 34' × 0.632
            = 21.5'
```

The effective horizon refraction is 21.5' instead of 34' — a reduction of 12.5 arcminutes. Combined with the solar semidiameter (16'), the effective standard correction at La Paz in summer is:
```
16' + 21.5' = 37.5' = 0.625°   (instead of the standard 0.833°)
```

The difference of 0.208° corresponds to approximately **0.8 minutes** less in Shuruq/Maghrib correction compared to a sea-level, standard-atmosphere calculation. Combined with the elevation geometric dip (~1.94° = ~7.8 min), the elevation effect dominates; the atmospheric correction is a meaningful second-order refinement.

**Example: Helsinki in January (T=−15°C, elevation 15m, P≈1020 mbar)**
```
R_corrected = 34' × (1020/1010) × (283/(273-15))
            = 34' × 1.010 × 1.097
            = 34' × 1.108
            = 37.7'
```

The effective refraction increases to 37.7', making the standard correction 16' + 37.7' = 53.7' = 0.895° instead of 0.833°. This extra 0.062° corresponds to approximately **0.25 minutes** — small but real in the context of sub-minute accuracy goals.

---

## The Irreducible Atmospheric Uncertainty Floor

Even with temperature/pressure corrections, a fundamental uncertainty limit exists.

**Citation:** [Young, 2006] — "Sunset science IV: Low-altitude refraction," *Astronomical Journal* 131:1930–1943.

Young's analysis of real refraction data shows that local atmospheric variability — turbulence, humidity gradients, temperature inversions near the ground — creates an irreducible scatter of approximately **±2 minutes** in observed sunrise/sunset times at a given location, even over consecutive days with similar predicted conditions.

This means:
- The temperature/pressure correction improves the *expected* refraction calculation, but cannot reduce the day-to-day scatter below ~2 minutes.
- For prayer timetables computed months in advance (the standard practice), temperature/pressure data is not available, making these corrections applicable only for real-time calculations.
- Sub-minute prayer time accuracy claims, if based solely on formula improvement, are misleading — the physical atmospheric system imposes a 2-minute irreducible floor on any formula-based approach.

**Library implication:** Temperature/pressure corrections should be applied when real-time T and P data are available (e.g., from a weather API), but the user should understand that the improvement is from ~1-2 minutes of systematic bias to a smaller expected error, not from ~2 minutes to ~0 seconds.

---

## Classification and Institutional Status

**Classification:** 🟡 Limited precedent

The temperature and pressure corrections represent well-established atmospheric physics applied to prayer time calculation. They are:

- ✓ Physically grounded — the Bennet formula and T/P corrections are standard in observational astronomy
- ✓ Directionally consistent with ihtiyat (precaution) — the corrections improve accuracy without systematically biasing toward shorter prayer windows
- ✗ Not formally adopted by any major Islamic institution in published timetables
- ✗ Not documented in classical *'ilm al-miqat* literature (though classical observers implicitly used ambient conditions)

The corrections are consistent with the shar'i intent of using the best available means (*wasail*) to determine prayer times accurately. However, because no institutional authority has formally endorsed them for prayer time use, they remain 🟡 and require disclosure when applied.

⚠️ Real-time temperature/pressure data integration requires scholarly acknowledgment before becoming a default feature. The concern is not the physics — it is the precedent of making prayer times dynamically variable based on weather sensor readings, which may require scholarly confirmation that this is an appropriate application of *'ilm al-miqat* principles.

---

## Related Pages

- [[wiki/astronomy/refraction]] — The physics of atmospheric refraction and the standard 0.833° correction
- [[wiki/corrections/elevation]] — Elevation correction (the primary correction for elevated cities; atmosphere correction is secondary)
- [[wiki/fiqh/scholarly-oversight]] — Classification framework; why 🟡 requires disclosure
