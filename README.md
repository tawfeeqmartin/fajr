# fajr فجر

> **High-accuracy Islamic prayer time library** — combining NASA/JPL astronomical precision with classical Islamic scholarship.

[![npm version](https://img.shields.io/npm/v/fajr.svg)](https://www.npmjs.com/package/fajr)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> ⚠️ **Fajr is in active development.** The autoresearch loop is running and the library is not yet validated against ground truth data. Do not use in production. Follow along with development or contribute — but wait for v1.0 before depending on this in your app.

---

## Why "Fajr"?

**Fajr (فجر)** means *dawn* in Arabic — the pre-dawn prayer whose accuracy depends most on the very problems this library aims to solve.

It is the prayer **most affected by the open questions this library addresses**:

- The **twilight angle debate** (15° vs 18° for true dawn — a difference of 10–20 minutes)
- **Atmospheric refraction** variations at extreme altitudes and latitudes
- **Elevation effects** on the horizon — a mosque at 2,000m sees dawn earlier than one in a valley
- **Light pollution** distorting the visual threshold in urban areas

While named after one prayer, **fajr handles all six prayer times** — Fajr, Shuruq, Dhuhr, Asr, Maghrib, Isha — plus Qibla direction, Hijri calendar, hilal (crescent) visibility prediction, night-thirds calculation, and traveler mode. Just as `adhan.js` is named after the call to prayer but calculates all prayer times, `fajr` is named after the prayer that makes precision matter most.

The name also grounds the project in the Islamic tradition: each day begins at Fajr, and the precision of that moment is what this library is trying to improve.

---

## Architecture

Fajr is built around two interlocking research loops and a stable calculation engine:

```
┌─────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE BASE LOOP (continuous)              │
│                                                                   │
│  Raw Sources          LLM Compilation        Structured Wiki     │
│  ┌──────────┐         ┌──────────────┐       ┌──────────────┐   │
│  │ papers/  │──────→  │ compile.md   │──────→│ wiki/        │   │
│  │ fatwas/  │         │ (prompts)    │       │ astronomy/   │   │
│  │ tables/  │         └──────────────┘       │ fiqh/        │   │
│  │ code/    │                                 │ methods/     │   │
│  │ obs/     │                                 │ regions/     │   │
│  └──────────┘                                 │ corrections/ │   │
│                                               └──────┬───────┘   │
└──────────────────────────────────────────────────────┼───────────┘
                                                        │
                                              Feedback bridge
                                                        │
┌──────────────────────────────────────────────────────▼───────────┐
│                    AUTORESEARCH LOOP (batch)                       │
│                                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐ │
│  │ Read engine  │───→│ Read wiki    │───→│ Propose correction   │ │
│  │ src/engine.js│    │ knowledge/   │    │ to src/engine.js     │ │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘ │
│          ▲                                           │             │
│          │                                           ▼             │
│  ┌───────┴──────┐                         ┌──────────────────────┐ │
│  │ Ratchet:     │←────────────────────────│ eval/eval.js         │ │
│  │ commit only  │   WMAE decreases?        │ WMAE against ground  │ │
│  │ if WMAE ↓   │         YES              │ truth timetables     │ │
│  └──────────────┘                         └──────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

**WMAE** = Weighted Mean Absolute Error, measured against official government timetables and verified field observations.

---

## How Fajr Works

### Built on `adhan.js`, not a replacement

Fajr wraps [adhan.js](https://github.com/batoulapps/adhan-js) — the gold standard for Islamic prayer time calculation — with an **accuracy layer**. It inherits adhan's proven astronomical foundations and adds corrections on top.

### Auto-detects the right method for your region

```js
// Morocco → Moroccan method + elevation correction
// Saudi Arabia → Umm al-Qura method + published timetable verification
// North America + high latitude → ISNA or MWL with closest city fallback
fajr.prayerTimes({ latitude, longitude, date, elevation })
```

### Elevation-aware corrections

The standard adhan calculation assumes sea level. At elevation:
- Fajr and Isha shift by up to **±25 minutes** at 3,000m
- Maghrib (sunset) shifts by the geometric horizon depression
- The correction model is validated against field observations

### Official timetable integration

For countries that publish authoritative government timetables (Morocco, Saudi Arabia, UAE, Turkey, Egypt, Pakistan, Malaysia), fajr can **verify and cross-reference** calculated times against the official source.

### Atmospheric refraction beyond 0.833°

The standard refraction correction of 0.833° (used by most prayer time libraries) is an average. Fajr models:
- Temperature and pressure effects on refraction
- Horizon dip at elevation
- Seasonal variation at high latitudes

### Grounded in both traditions

| Source | Use |
|--------|-----|
| NASA/JPL DE440 ephemeris | Planetary positions |
| NREL Solar Position Algorithm (SPA) | Sub-arcsecond solar position |
| Classical Islamic astronomy | Twilight angle definitions, Asr madhab rules |
| Government timetables | Ground truth validation |
| Field observations | Edge case correction |

### Scholarly oversight classification

Every correction in `src/engine.js` is tagged:

- 🟢 **Established** — consensus in Islamic astronomy, well-documented in classical sources
- 🟡 **Limited precedent** — supported by some scholars/institutions, used in regional practice
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

```js
// Qibla direction
const qibla = fajr.qibla({ latitude: 33.9716, longitude: -6.8498 })
// { bearing: 97.4, magneticDeclination: -1.2, trueBearing: 96.2 }

// Night thirds
const night = fajr.nightThirds({ date, latitude, longitude })
// { firstThird: ..., lastThird: ... }

// Hijri date
const hijri = fajr.hijri(new Date())
// { year: 1445, month: 5, day: 4, monthName: 'Jumada al-Awwal' }

// Hilal visibility
const hilal = fajr.hilalVisibility({ year: 1445, month: 6, latitude, longitude })
// { visible: true, confidence: 0.87, elongation: 8.4, lagTime: 42 }

// Traveler mode (shortened/combined prayers)
const travelerTimes = fajr.travelerMode({ ...coords, madhab: 'hanafi' })
```

---

## Research Foundation

### Academic paper

*[Link forthcoming — see `autoresearch/` for the research pipeline]*

### Islamic scholarly foundations

The definitions of prayer times are derived from primary Islamic sources:

- **Quran** — Surah Al-Isra 17:78, Surah Hud 11:114, Surah Ta-Ha 20:130
- **Hadith** — Jibril narrations on prayer time boundaries (Tirmidhi, Abu Dawud)
- **Classical fiqh** — Hanafi, Maliki, Shafi'i, Hanbali rulings on twilight definitions
- **Islamic astronomy tradition** — Al-Biruni, Al-Battani, Ibn al-Shatir, the *muwaqqit* (mosque timekeeper) tradition

### Astronomical sources

- NREL Solar Position Algorithm (SPA) — accuracy within 0.0003°
- JPL DE440 planetary ephemeris
- USNO Astronomical Almanac conventions
- Meeus, *Astronomical Algorithms* (2nd ed.)

---

## Contributing

### Code contributions

Pull requests welcome. See `CLAUDE.md` for the autoresearch architecture and ratchet rules — the eval harness is the arbiter of accuracy improvements.

### Islamic scholarly review

This is especially needed for **🔴 novel corrections** in `src/engine.js`. If you are a scholar or researcher in Islamic astronomy (*'ilm al-miqat*), your review is invaluable. Please open an issue or contact the maintainer.

### Ground truth timetable data

The most valuable contribution is verified timetable data:
- Official government-published timetables (`knowledge/raw/timetables/`)
- Field observations with GPS coordinates and elevation (`knowledge/raw/observations/`)
- Format: see `knowledge/compile.md` for schema

### Adding to the knowledge base

1. Add raw sources to `knowledge/raw/` (papers, fatwas, code references, observations)
2. Run `knowledge/compile.md` instructions to update the wiki
3. The autoresearch loop will pick up new knowledge on next run

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
- **[NREL SPA](https://midcdmz.nrel.gov/spa/)** — National Renewable Energy Laboratory Solar Position Algorithm
- **NASA/JPL** — DE440 planetary ephemeris
- Muslim communities and institutions worldwide who publish official timetables and make them freely available

---

## License

MIT © Tawfeeq Martin

*"Indeed, the prayer has been decreed upon the believers a decree of specified times."* — Quran 4:103
