# Umm al-Qura — Saudi Arabian Method

The Umm al-Qura method uses 18.5° for Fajr and a fixed 90-minute offset from Maghrib for Isha, and is the official prayer time standard of the Kingdom of Saudi Arabia.

---

## Parameters

| Parameter | Value |
|-----------|-------|
| **Fajr angle** | 18.5° below horizon |
| **Isha calculation** | Maghrib + 90 minutes |
| **Isha (Ramadan)** | Maghrib + 120 minutes |
| **Asr convention** | Standard (shadow = 1× object height) |
| **Isha calculation type** | Fixed offset (not angle) |

---

## History and Authority

**Endorsing institution:** Umm al-Qura University (جامعة أم القرى), Makkah al-Mukarramah, in collaboration with the Ministry of Islamic Affairs, Endowments, Da'wah and Guidance (وزارة الشؤون الإسلامية).

Umm al-Qura University, established in 1949 as the College of Sharia and later expanded into a full university, is the primary Islamic academic institution in the Kingdom of Saudi Arabia. Its calendar and prayer time calculations hold official government status.

The Umm al-Qura method has been the official Saudi Arabian prayer time standard since approximately **1981**, when the Kingdom standardized on the current parameters through the university's astronomy department and the oversight of the Saudi Supreme Court (in its role confirming the Islamic calendar). Prior to this, various regional practices existed across the Arabian Peninsula.

The Umm al-Qura University also publishes the official **Umm al-Qura Calendar** — the Islamic lunar calendar used by the Saudi government — making it the single institution responsible for both the Hijri date and the daily prayer times in the Kingdom.

**Classification:** 🟢 Established for Saudi Arabia and jurisdictions that have officially adopted it.

---

## Geographic Applicability

**Official:** Kingdom of Saudi Arabia — all regions, including Makkah, Madinah, Riyadh, Jeddah, and the Eastern Province.

**Also used:** Historically applied in Kuwait, Bahrain, and some Gulf communities, though these countries now have their own institutional methods (Kuwait uses 18°/17.5°). Expatriate Muslims in Saudi Arabia and Hajj/Umrah pilgrims typically follow the Umm al-Qura method during their stay.

**Latitude of primary use:** Saudi Arabia spans approximately 16°N (Jizan, near the Yemen border) to 32°N (Tabuk in the northwest). Makkah is at 21.4°N, Madinah at 24.5°N, Riyadh at 24.7°N.

---

## Scholarly Basis for the 18.5° Fajr Angle

The 18.5° angle is slightly higher than the classical MWL standard of 18°, but the difference (0.5°) is modest — approximately 2–3 minutes of prayer time.

**Available documentation is limited.** Unlike the MWL method (with its classical Al-Biruni precedent) or the Egyptian method (with published observatory studies), the 18.5° Fajr angle for Umm al-Qura does not have prominent published scholarly derivations in the open literature.

**Citation:** [Al-Baz, 1996] — A study by the Riyadh Observatory examined twilight observations in central Arabia and produced figures consistent with the 18.5° value, though this study was not published in international astronomical journals.

The practical implications of 18.5° vs. 18.0° are small enough (2–3 minutes at Makkah's latitude) that the choice appears to be a deliberate conservative margin over the classical 18° standard, consistent with the precautionary principle (*ihtiyat*). Early Fajr is the safer error (one begins praying before the valid window rather than after, which is the more serious jurisprudential error in the Hanbali tradition prevalent in Saudi Arabia).

⚠️ SCHOLARLY REVIEW NEEDED: A definitive published source for the 18.5° angle's derivation would strengthen this documentation.

---

## The Fixed Isha Offset: Analysis

The 90-minute Isha offset is the most distinctive and administratively unusual feature of the Umm al-Qura method.

**What it replaces:** Most methods calculate Isha from a depression angle (typically 17°–18°). At Makkah's latitude (21.4°N), this produces actual intervals after Maghrib that vary seasonally:
- Summer (long days): sun sets with lower depression trajectory → Isha at ~17° comes approximately **78–85 minutes** after Maghrib
- Winter (short days): sun sets with steeper trajectory → Isha at ~17° comes approximately **95–102 minutes** after Maghrib
- **Annual average at Makkah:** approximately 88–90 minutes

The 90-minute fixed offset is therefore the approximate **seasonal average** for Makkah, hard-coded to avoid seasonal variation.

**Why this approach was chosen:**

1. **Administrative uniformity:** A fixed interval allows mosques and prayer call (*adhan*) schedules to be planned with a constant interval between Maghrib and Isha throughout the year. This is valuable in a country where the official prayer times are broadcast nationally and mosque opening times must be pre-scheduled.

2. **Simplicity of communication:** "Isha is 90 minutes after Maghrib" is simple to remember and communicate, particularly for pilgrims from diverse countries unfamiliar with local prayer time tables.

3. **Conservative position:** The 90-minute offset means Isha sometimes comes earlier than a 17° angle calculation would suggest (in winter) and sometimes later (in summer). Given that earlier Isha is the more conservative position (allowing more time after Isha before midnight), this is arguably a reasonable precautionary choice.

**Limitations outside Saudi Arabia:**

The 90-minute offset is derived from the average at Makkah's latitude. At significantly different latitudes:
- At 30°N (northern Saudi Arabia, Jordan), the interval varies more widely; the 90-minute average is less accurate.
- At 40°N (Turkey, central Mediterranean), a 17° Isha angle would produce intervals ranging from 65–120 minutes; the 90-minute offset diverges substantially in summer and winter.
- At equatorial latitudes (0°), a 17° angle gives approximately 65–70 minutes — the 90-minute offset is consistently too long.

For these reasons, the Umm al-Qura method is **not recommended** for use outside Saudi Arabia and the immediate Gulf region without scholarly review of whether the offset remains appropriate.

**Classification of the offset approach:** 🟡 Limited precedent outside Saudi context — the physics and administrative rationale are clear, but no major institution outside the Gulf has formally endorsed applying a Saudi-calibrated 90-minute offset to their own community.

---

## Ramadan Modification: +120 Minutes

During Ramadan, the Isha offset is extended to **Maghrib + 120 minutes**. This modification is explicitly liturgical rather than astronomical:

1. **Tarawih prayer:** The extended Ramadan night prayers (*Tarawih*) are performed after Isha and can last 60–90 minutes in major mosques. Delaying the start of Isha allows communities to complete Tarawih at a reasonable hour.
2. **Sahur window:** By pushing Isha later, the perceived "night" period is slightly compressed, which may encourage Muslims to rest earlier and wake for Sahur (the pre-dawn meal) more easily.
3. **Community coordination:** During Ramadan, Saudi Arabia operates a unified national religious-social rhythm; the extended offset coordinates this rhythm officially.

This Ramadan modification has no astronomical basis and is entirely a deliberate administrative and liturgical choice. It is explicitly acknowledged as such by Saudi religious authorities.

---

## adhan.js Implementation Notes

In `adhan.js`, Umm al-Qura is available as `CalculationMethod.UmmAlQura()` and returns:
```js
{ fajrAngle: 18.5, ishaInterval: 90, madhab: Madhab.Shafi }
```

Note the use of `ishaInterval` (minutes) rather than `ishaAngle` (degrees), which is handled separately in the library's calculation path.

---

## Related Pages

- [[wiki/methods/overview]] — Full comparison table of all methods
- [[wiki/fiqh/prayer-definitions]] — The shar'i basis for Isha and Fajr boundaries
- [[wiki/fiqh/scholarly-oversight]] — Why the fixed-offset approach carries a different classification outside Saudi context
