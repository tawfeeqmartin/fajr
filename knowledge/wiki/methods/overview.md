# Calculation Method Comparison Table

Side-by-side parameters for all major Islamic prayer time calculation methods, showing how different scholarly institutions have translated the shar'i definitions of prayer time boundaries into specific twilight angles and Asr shadow conventions.

---

## What a "Method" Is

A prayer time calculation method is a set of parameters that, combined with a solar position algorithm and location data, produces a complete daily prayer timetable. The essential parameters are:

1. **Fajr angle:** The sun's depression below the horizon (in degrees) that marks the beginning of Fajr. Higher angles = more depression = earlier Fajr.
2. **Isha angle (or offset):** Either the sun's depression for Isha, or a fixed number of minutes after Maghrib.
3. **Asr shadow convention:** Whether Asr begins when the shadow equals 1× the object height (standard/Shafi'i/Maliki/Hanbali) or 2× (Hanafi).

All other prayer times (Shuruq, Dhuhr, Maghrib) are determined by solar geometry and are not method-dependent (given the same location and date).

---

## Comprehensive Method Parameters

| Method | Institution | Fajr° | Isha | Asr | Primary Regions |
|--------|-------------|-------|------|-----|----------------|
| **MWL** | Muslim World League | 18° | 17° | Standard (1×) | UK, Western Europe, South Africa, Australia |
| **ISNA** | Islamic Society of North America | 15° | 15° | Standard (1×) | USA, Canada |
| **Egypt** | Egyptian General Authority of Survey | 19.5° | 17.5° | Standard (1×) | Egypt, Sudan, Libya, Iraq, Syria |
| **Umm al-Qura** | Umm al-Qura University | 18.5° | +90 min after Maghrib | Standard (1×) | Saudi Arabia (official) |
| **Kuwait** | Kuwait Ministry of Awqaf | 18° | 17.5° | Standard (1×) | Kuwait, Bahrain, Qatar, UAE, Oman |
| **Qatar** | Qatar Ministry of Awqaf | 18° | +90 min after Maghrib | Standard (1×) | Qatar |
| **UOIF** | Union des Organisations Islamiques de France | 12° | 12° | Standard (1×) | France (high-latitude accommodation) |
| **Morocco** | Ministry of Habous and Islamic Affairs | 18° | 17° | Standard (1×) | Morocco; also used in Algeria, Tunisia |
| **Diyanet** | Turkish Directorate of Religious Affairs | 18° | 17° | **Hanafi (2×)** | Turkey, Central Asia, Balkans |
| **Karachi** | University of Islamic Sciences, Karachi | 18° | 18° | **Hanafi (2×)** | Pakistan, Afghanistan, India, Bangladesh |
| **JAKIM** | Jabatan Kemajuan Islam Malaysia | 20° | 18° | Standard (1×) | Malaysia, Singapore, Brunei |
| **Tehran** | Institute of Geophysics, Tehran | 17.7° | 14° (or 4.5° after midnight) | Standard (1×) | Iran |
| **ECFR** | European Council for Fatwa and Research | 12° | 12° | Standard (1×) | Europe (high-latitude accommodation) |
| **Singapore** | Majlis Ugama Islam Singapura (MUIS) | 20° | 18° | Standard (1×) | Singapore |

---

## Fajr Angle Variation: 12° to 20°

The range of Fajr angles across methods — from 12° (UOIF/ECFR) to 20° (JAKIM/Singapore) — represents genuine scholarly and regional variation, not disagreement about basic astronomy.

**Why the angles differ:**

1. **Observational calibration:** Scholars in different regions observed the appearance of *al-fajr al-sadiq* under their local atmospheric conditions and calibrated the angle accordingly. Equatorial regions (Malaysia, Singapore) have denser, moister atmosphere that scatters light differently than the dry atmosphere of Arabia or North Africa; observed true dawn in Malaysia may genuinely correspond to 20° depression.

2. **Precautionary variation:** Some scholars prefer a larger angle (earlier Fajr) as precaution to ensure the prayer window is not missed. Others prefer a smaller angle to avoid imposing a time burden that may not correspond to visible dawn.

3. **Community consensus:** Angles adopted by national institutions represent the consensus of that country's 'ulama (scholars). Changing an angle for a region without scholarly sanction from that region's institutions would override a legitimate religious authority.

4. **High-latitude necessity:** The 12° methods (UOIF, ECFR) are specifically designed to avoid the computational failure that occurs at higher latitudes (above ~55°N) when the sun never reaches the 15°–18° depression range during summer. See [[wiki/regions/high-latitude]].

---

## The Angle vs. Fixed-Offset Distinction for Isha

Most methods calculate Isha from a depression angle, exactly as Fajr is calculated. However, two methods use a **fixed time offset** from Maghrib:

**Umm al-Qura:** Isha = Maghrib + 90 minutes (Ramadan: Maghrib + 120 minutes)
**Qatar:** Isha = Maghrib + 90 minutes

**Why fixed offsets exist:**

At the latitude of Makkah (21.4°N), the sun's depression angle for Isha (17°) produces an actual time interval after Maghrib that varies between approximately 78 and 102 minutes depending on the season. The fixed 90-minute offset captures this range approximately without requiring a trigonometric calculation, and provides administratively uniform prayer schedules year-round.

**Limitations of fixed offsets:**
- At latitudes other than Makkah, the 90-minute offset is only accidentally correct and can be off by 15–20 minutes in extreme seasons.
- During Ramadan, the 120-minute offset provides additional time for Tarawih prayers and Sahur meal, which is a deliberate liturgical accommodation rather than a twilight calculation.
- The offset method should not be used outside Saudi Arabia and Qatar without specific scholarly endorsement for the target location.

**Classification:** 🟢 Established for Saudi Arabia and Qatar; 🟡 Limited precedent if applied elsewhere.

---

## Asr Shadow Convention: Standard vs. Hanafi

The Asr start time is not based on a twilight angle but on shadow length, which is a solar altitude calculation. The two conventions produce different prayer start times:

| Convention | Shadow Length | Schools | Typical Difference |
|-----------|--------------|---------|-------------------|
| Standard | 1× object height + noon shadow | Shafi'i, Maliki, Hanbali | Earlier |
| Hanafi | 2× object height + noon shadow | Hanafi | 30–90 minutes later |

The Hanafi position is based on the report in Ibn Abi Shaybah and traced through specific chains of the Hadith of Jibril. It is a legitimate scholarly position supported by the *Imam* of one of the four major schools of Islamic law. See [[wiki/fiqh/prayer-definitions]] for the mathematical formulas.

The fajr library must provide both Asr conventions and must not suppress or de-emphasize the Hanafi position. Methods like Diyanet and Karachi that use Hanafi Asr should return the Hanafi time by default for those methods.

---

## Regional Method Selection Guidance

| Region | Recommended Method | Notes |
|--------|-------------------|-------|
| Saudi Arabia | Umm al-Qura | Official government method |
| Egypt, Iraq, Syria | Egypt | EGAS published method |
| Morocco, Algeria, Tunisia | Morocco | Ministry of Habous published timetables are authoritative for Morocco |
| Turkey | Diyanet | Official; uses Hanafi Asr |
| Pakistan, Afghanistan, India, Bangladesh | Karachi | UISK method; uses Hanafi Asr |
| Malaysia, Singapore, Brunei | JAKIM or Singapore | 20°/18° equatorial standard |
| Iran | Tehran | Distinctive 17.7°/14° angles from geophysical studies |
| USA, Canada | ISNA | Standard North American institutional method |
| UK, Western Europe | MWL | Common default for European Muslim communities |
| France, Scandinavia, Northern Europe | UOIF or ECFR | High-latitude accommodation required in summer |
| Australia, New Zealand, South Africa | MWL | Common default |

---

## Individual Method Pages

- [[wiki/methods/isna]] — ISNA: Islamic Society of North America
- [[wiki/methods/mwl]] — MWL: Muslim World League
- [[wiki/methods/umm-al-qura]] — Umm al-Qura: Saudi Arabian method
- [[wiki/methods/morocco]] — Morocco: Ministry of Habous method

---

## Related Pages

- [[wiki/fiqh/prayer-definitions]] — The Islamic definitions that these methods approximate
- [[wiki/fiqh/scholarly-oversight]] — Why method parameters represent legitimate ikhtilaf, not error
- [[wiki/regions/high-latitude]] — Solutions for latitudes where standard methods fail
