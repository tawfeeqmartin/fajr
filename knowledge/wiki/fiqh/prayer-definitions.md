# Islamic Definitions of Prayer Time Boundaries

The five daily prayers each have a defined time window (*waqt*) established by Quranic verses and the Sunnah; the start and end of each window is determined by observable solar phenomena that astronomical calculation approximates.

---

## Scriptural Foundation

> "Indeed, prayer has been decreed upon the believers at specified times." [Quran 4:103]

The Quran establishes that prayers are time-bound obligations. The specific times are elaborated in multiple verses and definitively established by the *Hadith of Jibril*, in which the Angel Jibril (Gabriel) led the Prophet ﷺ in prayer twice — once at the beginning of each prayer's time window and once at the end — demonstrating both the opening and closing of each *waqt* [Tirmidhi, 149; Abu Dawud, 393].

The Hadith of Jibril is the single most important hadith for prayer time calculation because it provides, in narrative form, a complete specification of all five prayer times. Scholars of *'ilm al-miqat* (Islamic timekeeping) have treated it as the primary source text for over a millennium.

---

## The Six Solar Events and Their Prayers

### Fajr (الفجر)

**Begin:** *Al-fajr al-sadiq* — the "true dawn" — defined as the moment when white light begins to spread horizontally across the eastern horizon. This is distinct from *al-fajr al-kadhib* (the false dawn), which appears as a vertical beam of light and then fades before the true dawn.

**End:** Sunrise (*shuruq al-shams*) — the moment the upper limb of the sun appears above the horizon.

**Scriptural basis:** [Quran 17:78] — "Establish prayer at the decline of the sun until the darkness of the night and [also] the Quran of dawn. Indeed, the recitation of dawn is ever witnessed." [Tirmidhi, 149] (Hadith of Jibril, establishing both beginning and end times).

**Astronomical proxy:** The sun reaching an angle of 15°–20° below the horizon (varies by calculation method — see [[wiki/methods/overview]]). The true dawn corresponds to the onset of astronomical twilight in the eastern sky.

**The two-dawn distinction:** [Al-Bukhari, 1093] — "The Messenger of Allah ﷺ said: 'There are two dawns: the dawn that is like a wolf's tail [vertical beam, al-fajr al-kadhib] does not make the Fajr prayer obligatory and does not forbid eating [for those fasting]. As for the horizontal dawn [al-fajr al-sadiq], it makes the prayer obligatory and forbids eating.'" This distinction is critical: the calculation must approximate *al-fajr al-sadiq*, not simply any pre-sunrise twilight.

---

### Shuruq (الشروق) — Sunrise

**Event:** The moment the upper limb of the sun appears above the true horizon (as corrected for refraction; the sun's apparent disk clears the horizon when the sun's center is at approximately −0.833° geometric altitude).

**Prayer significance:** Shuruq marks the **end** of Fajr prayer time. After Shuruq, the time enters *waqt al-karahah* (the time of dislike for prayer), which lasts until the sun has risen one "spear's length" above the horizon (approximately 20 minutes after Shuruq in classical texts, now standardized as approximately 20 minutes in most timetables). Nafl (voluntary) prayers are forbidden at Shuruq itself.

**No obligatory prayer at Shuruq:** Shuruq is a boundary event, not the start of a prayer. It is, however, the optimal time for the two-rak'ah *Ishraq* prayer (after the sun has risen), which has special merit [Tirmidhi, 586].

---

### Dhuhr (الظهر) — Midday Prayer

**Begin:** *Zawaal* — the moment the sun begins to decline from its zenith (meridian crossing). Strictly, *zawaal* is when the shadow begins to lengthen after reaching its minimum. Astronomically: true solar noon + a small margin (some scholars say the prayer begins the moment of zenith; others say to wait until the shadow clearly begins moving — Ibn Qudama in *al-Mughni* documents both positions).

**End:** When the shadow of an object equals the object's height plus the shadow at zenith (Shafi'i, Hanbali, and Maliki position) — i.e., shadow length = original noon shadow + 1× object height.

**Scriptural basis:** [Quran 17:78] — "Establish prayer at the decline of the sun." [Muslim, 612] — The Prophet ﷺ said: "The time of Dhuhr is from when the sun declines until the shadow of a man equals his height." [Tirmidhi, 149] (Hadith of Jibril).

**Astronomical implementation:** True solar noon (equation of time applied) marks the beginning of Dhuhr. End time = the time when the sun's altitude satisfies: tan(alt) = 1/(tan(lat - δ) + 1) for the standard (Shafi'i/Maliki/Hanbali) calculation. See [[wiki/fiqh/prayer-definitions#asr]] for the shadow calculation.

---

### Asr (العصر) — Afternoon Prayer

**Begin (Standard — Shafi'i, Maliki, Hanbali):** When the shadow of an object equals its height *plus* the noon shadow. Mathematically:

```
tan(alt_Asr) = 1 / (1 + tan(|lat - δ|))
```

where `alt_Asr` is the sun's altitude, `lat` is observer latitude, and `δ` is solar declination. (The "1" in the numerator corresponds to shadow factor 1×.)

**Begin (Hanafi):** When the shadow equals *twice* the object's height plus the noon shadow:

```
tan(alt_Asr_Hanafi) = 1 / (2 + tan(|lat - δ|))
```

This produces an Asr time approximately 30–60 minutes *later* than the standard position, depending on season and latitude.

**End:** Sunset (the Shafi'i/Maliki/Hanbali preferred end); some extend to twilight. The *mustahabb* (recommended) end is before the sun turns yellow/pale.

**Scriptural basis:** [Quran 2:238] — "Guard strictly the prayers, especially the middle prayer [al-salat al-wusta], and stand before Allah in devout obedience." Many scholars identify Asr as al-salat al-wusta, emphasizing its importance. [Tirmidhi, 149] (Hadith of Jibril — both shadow definitions are reported in different chains).

**Madhab disagreement:** The Hanafi position (2× shadow) is based on a different chain of the Hadith of Jibril and is a genuine *ikhtilaf* (scholarly disagreement), not a calculation error. The fajr library must preserve both. See [[wiki/fiqh/scholarly-oversight]].

---

### Maghrib (المغرب) — Evening Prayer

**Begin:** Sunset — when the last of the sun's disk disappears below the horizon (the sun's center at −0.833° geometric altitude due to refraction and semidiameter).

**End:** Disappearance of the *shafaq* (the reddish or whitish twilight glow in the western sky after sunset). The Shafi'i, Maliki, and Hanbali schools define *shafaq* as the redness (*al-shafaq al-ahmar*); the Hanafi school defines it as the whiteness that follows the redness (*al-shafaq al-abyad*), making their Maghrib time window longer.

**Scriptural basis:** [Quran 11:114] — "Establish prayer at the two ends of the day and during the adjoining portions of the night." [Muslim, 966] — "The time of Maghrib is as long as the twilight has not disappeared."

**Practical implication:** The Hanafi Maghrib end (disappearance of whiteness, approximately 18° twilight) coincides roughly with the standard Isha beginning for the majority schools (17°–18°). In practice, both are often calculated together.

---

### Isha (العشاء) — Night Prayer

**Begin:** Disappearance of the *shafaq* (as defined above by each madhab). For the majority (Shafi'i/Maliki/Hanbali): when the redness disappears from the western horizon, approximately 17°–18° below horizon. For Hanafi: when the whiteness disappears, approximately 18° below horizon.

**End:** Various scholarly positions:
1. **Midnight** (*nisf al-layl*) — the midpoint between Maghrib and the time of Fajr. This is the end of the *mustahabb* (preferred/recommended) time.
2. **Al-fajr al-kadhib** (the false dawn) — approximately 1.5–2 hours before Fajr. This is the outer limit of the *waqt al-darura* (time of necessity).
3. **True dawn** (*al-fajr al-sadiq*) — the absolute outer limit in some scholarly positions (prayers before this time are valid, though greatly delayed).

**Scriptural basis:** [Quran 17:78] — referenced alongside Fajr. [Tirmidhi, 149] (Hadith of Jibril — Jibril prayed Isha when the twilight disappeared on the first day and at midnight on the second day, establishing preferred and permissible windows).

---

## Waqt al-Ikhtiyar and Waqt al-Darura

Classical jurisprudence distinguishes multiple categories within each prayer's time:

| Category | Arabic | Definition |
|----------|--------|-----------|
| Waqt al-fadhila | وقت الفضيلة | The most meritorious time (beginning of the window, or shortly after) |
| Waqt al-ikhtiyar | وقت الاختيار | The preferred time — valid, recommended performance |
| Waqt al-jawaz bila karahah | وقت الجواز بلا كراهة | Valid without dislike |
| Waqt al-karahah | وقت الكراهة | Valid but disliked (near the boundaries) |
| Waqt al-darura | وقت الضرورة | Time of necessity — only valid for those with an excuse |

For prayer time calculation software, the primary published times represent *waqt al-ikhtiyar*. The library does not currently model the sub-divisions within the window, but they are relevant context for understanding why ihtiyat (precaution) matters at the boundaries.

---

## Summary Table

| Prayer | Begins | Ends | Astronomical Proxy |
|--------|--------|------|--------------------|
| Fajr | Al-fajr al-sadiq (true dawn) | Sunrise | Sun at −15° to −20° altitude (method-dependent) |
| Shuruq | (boundary event) | — | Sun center at −0.833° altitude |
| Dhuhr | Zawaal (solar meridian crossing) | Shadow = 1× object (standard) / 2× (Hanafi) | True solar noon; Asr angle calculation |
| Asr | End of Dhuhr | Sunset (or later) | Shadow length formula |
| Maghrib | Sunset | Shafaq disappears | Sun at ~−17° (majority) / ~−18° (Hanafi) |
| Isha | Shafaq disappears | Midnight (preferred) / false dawn (necessity) | Sun at ~−15° to −18° altitude |

---

## Related Pages

- [[wiki/methods/overview]] — How the above shar'i definitions are translated into institutional calculation methods with specific angles
- [[wiki/astronomy/refraction]] — Why the 0.833° sunset/sunrise correction exists and what it represents
- [[wiki/fiqh/scholarly-oversight]] — The classification framework for astronomical corrections to these definitions
