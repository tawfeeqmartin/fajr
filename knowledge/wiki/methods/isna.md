# ISNA — Islamic Society of North America Method

The ISNA method uses 15° angles for both Fajr and Isha with the standard (Shafi'i/Maliki/Hanbali) Asr convention, established as the primary prayer time standard for the North American Muslim community.

---

## Parameters

| Parameter | Value |
|-----------|-------|
| **Fajr angle** | 15° below horizon |
| **Isha angle** | 15° below horizon |
| **Asr convention** | Standard (shadow = 1× object height) |
| **Isha calculation type** | Angle (not fixed offset) |
| **High-latitude fallback** | Angle-based with time cap (varies by implementation) |

---

## History and Authority

**Endorsing institution:** Islamic Society of North America (ISNA), headquartered in Plainfield, Indiana.

The ISNA method was developed and formalized in the 1980s as the Muslim population of North America grew and needed a standardized, institutionally-backed prayer timetable for use across a continent spanning roughly 25°N (Miami) to 49°N (the U.S.-Canada border) and beyond into Canada's higher latitudes.

ISNA is the largest Muslim umbrella organization in North America and works closely with the Fiqh Council of North America (FCNA), whose scholarly endorsement provides the religious authority for the method. The 15° angles have appeared in ISNA-published timetables and software since at least the mid-1980s and are the de facto standard for most North American mosque scheduling systems, Islamic apps, and community organizations.

**Classification:** 🟢 Established — institutional consensus within North America, continuously published and endorsed for over three decades.

---

## Geographic Applicability

**Primary:** United States, Canada
**Latitude range of primary use:** 25°N (southern Florida, Hawaii) to ~55°N (southern Canada)
**High-latitude note:** Above approximately 48°N (which includes cities like Seattle, Minneapolis, Toronto, Montreal, Calgary, Edmonton, Vancouver), the 15° angle may encounter the high-latitude problem during summer months where the sun does not reach 15° depression and an Isha/Fajr time cannot be computed geometrically. Implementations should apply an appropriate fallback; see [[wiki/regions/high-latitude]].

---

## Scholarly Basis for the 15° Angle

The 15° angle represents a **pragmatic accommodation** for North American conditions, arrived at through the following reasoning:

1. **Egyptian precedent re-examined:** The Egyptian General Authority of Survey uses 19.5°/17.5°, derived from observations in Egypt (latitude ~22°N–31°N) under Egyptian atmospheric conditions. When applied to North American communities, especially those at higher latitudes (40°N–50°N), the 19.5° Fajr angle produced prayer times that the local scholarly community judged to be before visible dawn — effectively, the astronomer was computing a theoretical angle that did not correspond to observed *al-fajr al-sadiq* in North American skies.

2. **North American atmospheric context:** The North American continent, particularly the interior (less maritime humidity than coastal Arabia or Egypt), has generally clearer atmospheric conditions. This potentially means *al-fajr al-sadiq* becomes visible at a shallower depression angle than in more humid or aerosol-rich environments, supporting a somewhat smaller Fajr angle.

3. **Community observation and ijma':** ISNA scholars and the Fiqh Council conducted consultations with Muslim communities across North America. The 15° angle emerged as a value that more accurately reflected the onset of visible dawn as reported by community observers. This process is consistent with the classical approach of the *muwaqqitun* who calibrated angles to local observation.

4. **Latitude diversity:** The single angle must work across a vast range of latitudes. An angle calibrated for 30°N (Cairo) will behave differently at 40°N (New York) or 45°N (Minneapolis). The 15° angle's selection reflects a compromise across this range.

---

## Criticisms and Responses

**Criticism:** Some scholars argue that 15° is too shallow and does not reliably correspond to *al-fajr al-sadiq* in all conditions. They argue that true dawn is not visible at 15° depression in many locations, meaning Fajr is calculated *later* than the actual start of the valid prayer time.

**Response from ISNA context:** The concern reflects the asymmetry of ihtiyat (precaution). If the angle is too shallow, the published Fajr time is *later* than the actual dawn — meaning one begins praying after the valid time has already started, not before. This is the *less serious* error from a jurisprudential standpoint (missing some of the valid window is less severe than praying before the valid window begins). The Egyptian 19.5°, by contrast, risks calling Fajr *before* visible dawn under certain atmospheric conditions, which is the more serious jurisprudential error.

**Criticism:** The same angle (15°) is used for both Fajr and Isha, which is symmetrical but not necessarily physically justified, since Fajr and Isha twilight may not be mirror images.

**Response:** Symmetry simplifies implementation and community communication. The difference between a 15° and 17° Isha angle is approximately 8–15 minutes; within the range of normal variation. ISNA's use of 15°/15° is deliberately symmetrical.

---

## Comparison with Adjacent Methods

| Feature | ISNA (15°/15°) | MWL (18°/17°) | Egypt (19.5°/17.5°) |
|---------|--------------|--------------|---------------------|
| Fajr time | Latest of three | Intermediate | Earliest of three |
| Isha time | Latest for Isha | Earlier Isha | Intermediate |
| Community | North American | International | North African / Middle Eastern |
| Scholarly basis | FCNA/ISNA consensus | MWL global standard | Observatory measurement |

The ISNA Fajr is consistently later (by 15–30 minutes at mid-latitudes) than the Egyptian method and 10–20 minutes later than MWL. This difference is the practical expression of the scholarly disagreement over the correct Fajr angle.

---

## adhan.js Implementation Notes

In `adhan.js`, ISNA is available as `CalculationMethod.ISNA()` and returns a `CalculationParameters` object with:
```js
{ fajrAngle: 15, ishaAngle: 15, madhab: Madhab.Shafi }
```

No special high-latitude override is built into the base ISNA parameters — the high-latitude fallback is a separate configuration in `adhan.js`'s `HighLatitudeRule` setting.

---

## Related Pages

- [[wiki/methods/overview]] — Full comparison table of all methods
- [[wiki/fiqh/prayer-definitions]] — The shar'i definitions that ISNA approximates
- [[wiki/regions/high-latitude]] — High-latitude solutions relevant for Canadian and northern U.S. cities
