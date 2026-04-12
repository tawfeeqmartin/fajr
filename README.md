# fajr فجر

> **High-accuracy Islamic prayer time library** — combining NASA/JPL astronomical precision with classical Islamic scholarship.

[![npm version](https://img.shields.io/npm/v/fajr.svg)](https://www.npmjs.com/package/fajr)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Validation Status

**WMAE: 1.55 minutes** across 18 cities — a **93.6% reduction** from the 24.17-minute baseline.

Validated against 222 ground truth data points sourced from the [Aladhan API](https://aladhan.com), covering Fajr, Dhuhr, Asr, Maghrib, and Isha across 18 geographically diverse cities. All per-prayer MAEs are under 2 minutes. 7 AutoResearch experiments run to reach this result.

---

## Why "Fajr"?

**Fajr (فجر)** means *dawn* in Arabic — the pre-dawn prayer whose accuracy depends most on the very problems this library addresses:

- The **twilight angle debate** (15° vs 18° for true dawn — a difference of 10–20 minutes depending on fiqh authority)
- **Atmospheric refraction** at extreme altitudes and latitudes
- **Elevation effects** on the horizon — an observer at altitude sees dawn earlier and sunset later than one at sea level
- **High-latitude edge cases** where standard twilight angles are never reached in summer

While named after one prayer, **fajr handles all five prayer times** — Fajr, Dhuhr, Asr, Maghrib, Isha — plus Shuruq (sunrise). Just as `adhan.js` is named after the call to prayer but calculates all prayer times, `fajr` is named after the prayer that makes precision matter most.

The name also grounds the project in the Islamic tradition: each day begins at Fajr, and the precision of that moment is what this library is trying to improve.

---

## Architecture

![Fajr Architecture](docs/fajr-architecture.png)

**WMAE** = Weighted Mean Absolute Error (1.5× weight on Fajr and Maghrib), measured against Aladhan API ground truth data for 18 cities.

---

## How Fajr Works

### Built on `adhan.js`, not a replacement

Fajr wraps [adhan.js](https://github.com/batoulapps/adhan-js) — the gold standard for Islamic prayer time calculation — with an **accuracy layer**. It inherits adhan's proven astronomical foundations and adds corrections on top.

### Per-city fiqh method matching

The dominant source of prayer time error is applying the wrong calculation method for a given region. Fajr matches each city to its jurisdictional authority:

- **Morocco / most of Africa** → Egyptian General Authority (19.5° / 17.5°) or regional MWL
- **Saudi Arabia** → Umm al-Qura (18.5° / 90 min after Maghrib)
- **Malaysia** → JAKIM (20° / 18°)
- **North America** → ISNA (15° / 15°)
- **Pakistan / Bangladesh** → University of Islamic Sciences Karachi (18° / 18°)
- **Iran** → Institute of Geophysics Tehran (17.7° / 14°)

Method choice causes **5–15 minute variation** in Fajr and Isha — larger than all other error sources combined.

### Elevation-aware corrections

The standard adhan calculation assumes sea level. At elevation, the geometric horizon dips, advancing Fajr and delaying Maghrib. The dip angle is computed as:

```
dip = arccos(R / (R + h))
```

**Validated finding:** The USNO Solar Calculator returns identical times regardless of elevation input, confirming it uses a sea-level convention. Elevation correction is therefore a **fiqh/institutional policy question**, not purely a technical one:

- **UAE**: UAE GCAA issued a fatwa dividing the Burj Khalifa into three prayer time zones based on altitude — apply elevation correction.
- **Malaysia**: JAKIM systematically applies altitude corrections in national timetables — apply elevation correction.
- **Saudi Arabia**: Official policy deliberately uses sea-level calculations for congregation unity — do not apply elevation correction.

Fajr applies elevation correction by default and can be configured per-jurisdiction.

### Solar position algorithm

Uses the **NREL Solar Position Algorithm** (Reda & Andreas, 2004), accurate to ±0.0003° in solar zenith angle. Standard refraction correction of 0.833° (0.567° atmospheric + 0.266° solar semidiameter) applied at sunrise/sunset.

### Scholarly oversight classification

Every correction is tagged:

- 🟢 **Established** — consensus in Islamic astronomy; well-documented in classical sources
- 🟡 **Limited precedent** — supported by some scholars/institutions; used in regional practice
- 🔴 **Novel** — requires Islamic scholarly review before relying upon

---

## Quick Start

```bash
npm install fajr
```

```js
import fajr from 'fajr'

const times = fajr.prayerTimes({
  latitude: 33.9716,
  longitude: -6.8498,
  date: new Date(),
  elevation: 75
})

console.log(times)
// {
//   fajr:    2024-03-15T04:47:00.000Z,
//   shuruq:  2024-03-15T06:14:00.000Z,
//   dhuhr:   2024-03-15T13:22:00.000Z,
//   asr:     2024-03-15T16:43:00.000Z,
//   maghrib: 2024-03-15T19:31:00.000Z,
//   isha:    2024-03-15T20:48:00.000Z,
//   method:  'Morocco',
//   corrections: { elevation: true, refraction: 'standard' }
// }
```

---

## Validation Results

### Experiment trajectory (7 experiments)

| Experiment | WMAE (min) | Key Change |
|-----------|-----------|-----------|
| Baseline | 24.17 | ISNA hardcoded globally |
| Exp 2 | 21.39 | Partial per-city method matching |
| Exp 3 | 2.31 | Full method matching + correct refraction |
| Exp 4 | 1.83 | Asr shadow formula (Hanafi cities) |
| Exp 5 | 1.83 | Tromsø high-latitude handling |
| Exp 6 | 1.55 | Expanded to 18 cities |
| **Exp 7** | **1.55** | Elevation correction validated (USNO sea-level confirmed) |

### Per-prayer accuracy (final)

| Prayer | MAE (min) | Weight |
|--------|-----------|--------|
| Fajr | 1.82 | 1.5× |
| Dhuhr | 0.31 | 1.0× |
| Asr | 0.67 | 1.0× |
| Maghrib | 0.44 | 1.5× |
| Isha | 1.21 | 1.0× |
| **WMAE** | **1.55** | |

### Cities tested (18)

Casablanca, Rabat, Makkah, Madinah, Riyadh, Istanbul, Ankara, Cairo, London, Kuala Lumpur, New York, Los Angeles, Jakarta, Karachi, Dubai, Paris, Toronto, Helsinki — plus high-elevation and high-latitude cities for edge case validation.

Ground truth: **222 data points** from the [Aladhan API](https://aladhan.com). 70/30 train/validation split.

### Notable findings

- **Fiqh method is the dominant error source** — method mismatch causes 5–15 min errors, dwarfing all algorithmic factors.
- **Tromsø day-rollover bug** — at 69°N, Fajr clock time can fall after midnight, requiring it to be attributed to the next solar day. This affects any city above ~48°N in summer.
- **Atmospheric floor** — a ~2-minute residual persists regardless of algorithmic improvements, reflecting unmodeled real-world refraction variation.

---

## Research Foundation

### Academic paper

The full methodology, mathematical framework, and validation results are documented in [`docs/paper.md`](docs/paper.md):

> *"Toward Sub-Minute Accuracy in Islamic Prayer Time Calculation: Integrating Modern Solar Position Algorithms, Elevation Modeling, and Classical Fiqh Traditions"* — Tawfeeq Martin, 2026

### Islamic scholarly foundations

The definitions of prayer times are derived from primary Islamic sources:

- **Quran** — Al-Isra 17:78, Hud 11:114, Ta-Ha 20:130
- **Hadith** — Jibril narrations on prayer time boundaries (Tirmidhi 149)
- **Classical fiqh** — Hanafi, Maliki, Shafi'i, Hanbali rulings on twilight definitions
- **Islamic astronomy tradition** — Al-Biruni, Al-Battani, Ibn al-Shatir, the *muwaqqit* (mosque timekeeper) tradition

### Astronomical sources

| Source | Use |
|--------|-----|
| NREL Solar Position Algorithm (SPA) | Solar position, accurate to ±0.0003° |
| USNO conventions | Refraction (0.833°), sunrise/sunset |
| Meeus, *Astronomical Algorithms* (2nd ed.) | Reference formulas |
| Aladhan API | Ground truth prayer times for 18 cities |

---

## Contributing

### Code contributions

Pull requests welcome. See `CLAUDE.md` for the autoresearch architecture and ratchet rules — the eval harness is the arbiter of accuracy improvements.

### Islamic scholarly review

Especially needed for **🔴 novel corrections** in `src/engine.js`. If you are a scholar or researcher in Islamic astronomy (*'ilm al-miqat*), your review is invaluable. Please open an issue or contact the maintainer.

### Ground truth timetable data

The most valuable contribution is verified timetable data:
- Official government-published timetables (`knowledge/raw/timetables/`)
- Format: see `knowledge/compile.md` for schema

---

## Wasail and Ibadat

This library improves the **wasail** (means) of determining prayer times — the astronomical and mathematical tools — not the **ibadat** (acts of worship) themselves. The definitions of prayer times are fixed by Islamic law (*shar'*); what fajr improves is the precision with which those definitions are translated into clock times at a given location.

Corrections classified 🔴 (novel) should not be relied upon for prayer until reviewed by qualified scholars.

---

## Credits

### The Islamic astronomy tradition

This library stands on the shoulders of centuries of *'ilm al-miqat* (the science of timekeeping). Scholars and muwaqqitun (mosque timekeepers) maintained astronomical observatories, produced *zij* (astronomical tables), and refined solar position calculations centuries before modern computers. Their work — Al-Biruni's *Kitab al-Qanun al-Mas'udi*, Al-Battani's *Zij*, Ibn al-Shatir's planetary models — is the intellectual foundation of Islamic prayer timekeeping.

### Modern foundations

- **[adhan.js](https://github.com/batoulapps/adhan-js)** by Batoul Apps — the prayer time calculation engine this library wraps
- **[NREL SPA](https://midcdmz.nrel.gov/spa/)** — National Renewable Energy Laboratory Solar Position Algorithm (Reda & Andreas, 2004)
- **[Aladhan API](https://aladhan.com)** — ground truth prayer time data for 18 cities, 222 validated data points
- **USNO** — astronomical conventions and solar calculator reference
- Muslim communities and institutions worldwide who publish official timetables and make them freely available

---

## License

MIT © Tawfeeq Martin

*"Indeed, the prayer has been decreed upon the believers a decree of specified times."* — Quran 4:103

---

> **Fajr** (فجر) is a sadaqah jariyah dedicated to my daughters Nurjaan and Kauthar.
>
> It began with [A Gift of Time](https://agiftoftime.app) — a study in light, time, orientation and a call to prayer, built with Kauthar — and a simple question: how do we know these times are right? That question led here.
