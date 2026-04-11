# Knowledge Wiki — Master Index

This wiki contains structured, compiled knowledge distilled from raw sources in `../raw/`.
It is the primary reference for the autoresearch agent.

See `../compile.md` for how to update this wiki from raw sources.
See `../lint.md` for quality and consistency rules.

---

## Astronomy

| Article | Description |
|---------|-------------|
| [Solar position](astronomy/solar-position.md) | SPA algorithm, equation of time, equation of center |
| [Twilight](astronomy/twilight.md) | Civil, nautical, astronomical twilight; al-fajr al-sadiq vs al-kadhib |
| [Atmospheric refraction](astronomy/refraction.md) | Standard 0.833°, temperature/pressure corrections |
| [Horizon geometry](astronomy/horizon.md) | Dip of horizon, elevation effects |
| [High latitudes](astronomy/high-latitudes.md) | Midnight sun, permanent twilight, scholarly rulings |

## Fiqh (Islamic Law)

| Article | Description |
|---------|-------------|
| [Prayer time definitions](fiqh/definitions.md) | Quranic and hadith basis for each prayer time |
| [Twilight disagreement](fiqh/twilight-ikhtilaf.md) | Scholarly positions on Fajr twilight angle (15° vs 18° vs other) |
| [Asr madhab difference](fiqh/asr-madhab.md) | Hanafi (2x shadow) vs standard (1x shadow) |
| [High latitude rulings](fiqh/high-latitude-rulings.md) | Scholarly positions on prayers in extreme latitudes |
| [Traveler rulings](fiqh/traveler.md) | Conditions for qasr and jam' |

## Calculation Methods

| Article | Description |
|---------|-------------|
| [Method comparison](methods/comparison.md) | Side-by-side angle tables for all major methods |
| [ISNA](methods/isna.md) | Islamic Society of North America — 15°/15° |
| [MWL](methods/mwl.md) | Muslim World League — 18°/17° |
| [Egypt](methods/egypt.md) | Egyptian General Authority — 19.5°/17.5° |
| [Morocco](methods/morocco.md) | Moroccan Ministry of Habous — 18°/17° |
| [Umm al-Qura](methods/umm-al-qura.md) | Saudi method — 18.5° / 90 min after maghrib |
| [Turkey](methods/turkey.md) | Diyanet — 18°/17°, Hanafi Asr |

## Regional Corrections

| Article | Description |
|---------|-------------|
| [Morocco](regions/morocco.md) | Official timetable notes, known corrections |
| [Saudi Arabia](regions/saudi-arabia.md) | Umm al-Qura vs Makkah observed |
| [North America](regions/north-america.md) | High latitude corrections, ISNA vs closest city |
| [Southeast Asia](regions/southeast-asia.md) | JAKIM method, Malaysia/Indonesia variations |

## Correction Algorithms

| Article | Classification | Description |
|---------|---------------|-------------|
| [Elevation horizon](corrections/elevation-horizon.md) | 🟡 Limited precedent | Horizon dip formula and prayer time shift |
| [Atmospheric refraction](corrections/refraction-temperature.md) | 🟡 Limited precedent | Temperature/pressure refraction correction |
| [Terrain horizon](corrections/terrain-horizon.md) | 🔴 Novel | Surrounding terrain blocking the horizon |
| [Light pollution](corrections/light-pollution.md) | 🔴 Novel | Urban sky glow affecting visual dawn threshold |

---

*Wiki last compiled: see git log for `knowledge/wiki/`*
