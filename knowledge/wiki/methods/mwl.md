# MWL — Muslim World League Method

The MWL method uses 18° for Fajr and 17° for Isha with the standard Asr convention, and serves as the most widely-used international default in Islamic prayer time software.

---

## Parameters

| Parameter | Value |
|-----------|-------|
| **Fajr angle** | 18° below horizon |
| **Isha angle** | 17° below horizon |
| **Asr convention** | Standard (shadow = 1× object height) |
| **Isha calculation type** | Angle (not fixed offset) |

---

## History and Authority

**Endorsing institution:** Muslim World League (Rābiṭat al-'Ālam al-Islāmī), headquartered in Makkah al-Mukarramah.

The Muslim World League is an international Islamic organization established in 1962 with headquarters in Makkah, under Saudi governmental support, with the mandate to coordinate Islamic activities and standardization worldwide. Its prayer time method was formalized in the 1970s and has been adopted as the standard for Muslim communities in regions without their own national authority — particularly the United Kingdom, most of Western Europe, South Africa, Australia, New Zealand, and various diaspora communities.

The MWL's standing as a Saudi-backed international body gives its method broad credibility across Sunni Muslim communities globally. It functions as the "default" method in most Islamic prayer time software when no region-specific method is more appropriate.

**Classification:** 🟢 Established — internationally recognized, decades of continuous use, no significant scholarly objection.

---

## Geographic Applicability

**Primary:** United Kingdom, Western Europe (excluding France, which uses UOIF 12°), South Africa, Australia, New Zealand
**Also used as fallback:** Many countries without their own institutional method default to MWL

**Latitude range of primary use:** 35°S (Australia, South Africa) to ~60°N (northern UK, Scandinavia)

**High-latitude note:** At latitudes above ~55°N (Scotland, Scandinavia), the 18° Fajr angle may not be reached during summer, requiring high-latitude fallback methods. See [[wiki/regions/high-latitude]].

---

## Scholarly Basis for the 18° Angle

The 18° twilight angle has deep roots in the history of Islamic astronomy and represents the most classically-grounded choice among modern methods.

**Classical precedent — Al-Biruni:**

**Citation:** [Al-Biruni, ~1030] — *Kitab al-Qanun al-Mas'udi* (The Mas'udic Canon), composed approximately 1030 CE, dedicated to Sultan Mas'ud of Ghazna.

Al-Biruni, one of the greatest scholars of classical Islamic civilization and a master of astronomy (*'ilm al-falak*) and timekeeping (*'ilm al-miqat*), documented 18° as the standard twilight depression angle in his major astronomical compendium. This represents an empirical determination from observation in the medieval Islamic world (primarily Central Asia and the Middle East) and carries the weight of classical scholarly authority.

Al-Biruni's figure was not isolated — it is consistent with the value used by other classical Islamic astronomers including Ibn Yunus and al-Battani in their *zij* (astronomical tables), and aligns with the ancient Greek understanding of "astronomical twilight" as the darkening threshold for star visibility.

**Astronomical correspondence:**

18° depression is precisely the boundary of **astronomical twilight** in Western astronomy:
- Civil twilight: sun at −6°
- Nautical twilight: sun at −12°
- **Astronomical twilight: sun at −18°** — the sky is fully dark and faint stars are visible at the zenith

The alignment between the classical Islamic 18° Fajr angle and the modern astronomical twilight boundary is not coincidental. Both derive from the observation that at 18° depression, the first faint light becomes perceptible on the horizon in a clear, dark atmosphere. The MWL's 18° Fajr is therefore consistent with both classical Islamic scholarship and modern astronomical terminology.

**Isha at 17°:**

The 17° Isha angle is slightly shallower than the 18° Fajr angle. This asymmetry reflects the observational difference between morning and evening twilight: the beginning of morning twilight (*al-fajr al-sadiq*) may require a slightly deeper sun depression to be visually distinct, while the end of evening twilight (*shafaq al-ahmar*) can be perceived at slightly shallower angles. The 1° asymmetry is modest and the difference in Isha time is approximately 4–6 minutes relative to an 18° Isha calculation.

---

## Relationship to Egyptian Method

The Egyptian General Authority of Survey uses 19.5°/17.5°, which is 1.5° deeper for Fajr and 0.5° deeper for Isha than MWL. The Egyptian figures derive from direct astronomical observation studies conducted in Egypt's specific atmospheric and geographic conditions (latitude 22°–31°N, with relatively clear but somewhat dusty desert atmosphere).

The MWL's 18°/17° can be understood as a *conservative internationalization* of Egyptian-style observation: starting from classical 18° rather than the locally-calibrated Egyptian 19.5°, allowing the method to function reasonably across a wider range of latitudes without producing Fajr times that are excessively early at equatorial or sub-equatorial latitudes.

---

## adhan.js Implementation Notes

In `adhan.js`, MWL is available as `CalculationMethod.MuslimWorldLeague()` and returns:
```js
{ fajrAngle: 18, ishaAngle: 17, madhab: Madhab.Shafi }
```

MWL is commonly used as the default fallback in the fajr library when no region-specific method has been specified.

---

## Comparison with Adjacent Methods

| Feature | MWL (18°/17°) | ISNA (15°/15°) | Egypt (19.5°/17.5°) |
|---------|--------------|--------------|---------------------|
| Fajr angle | 18° (classical standard) | 15° (pragmatic accommodation) | 19.5° (observation-calibrated) |
| Isha angle | 17° | 15° | 17.5° |
| Fajr vs. ISNA | ~10–20 min earlier | — | ~15–30 min earlier than ISNA |
| Classical precedent | Strong (Al-Biruni, classical zij) | Limited | Strong (observation-based) |
| International adoption | Very broad | North America | MENA region |

---

## Related Pages

- [[wiki/methods/overview]] — Full comparison table of all methods
- [[wiki/fiqh/prayer-definitions]] — The shar'i definitions that MWL approximates
- [[wiki/methods/morocco]] — Morocco uses the same 18°/17° angles as MWL, but with ministry-published timetables as the authority
