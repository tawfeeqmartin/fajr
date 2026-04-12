# Knowledge Wiki — Master Index

Structured, compiled knowledge distilled from raw sources in `../raw/`. Primary reference for the autoresearch agent.

See `../compile.md` for how to update this wiki from raw sources.
See `../lint.md` for quality and consistency rules.

---

## Astronomy

| Article | Description |
|---------|-------------|
| [Solar position](astronomy/solar-position.md) | NREL SPA (±0.0003°), Meeus VSOP87, JPL DE440; algorithm selection by use case |
| [Atmospheric refraction](astronomy/refraction.md) | Standard 0.833° = 16' semidiameter + 34' refraction; Bennett 1982; Saemundsson 1986; Young 2006 ±2 min floor |
| [Elevation and horizon](astronomy/elevation.md) | Dip angle δ = arccos(R/(R+h)); Burj Khalifa example; Fajr/Isha scholarly question; elevation data sources |

---

## Fiqh (Islamic Law)

| Article | Description |
|---------|-------------|
| [Prayer time definitions](fiqh/prayer-definitions.md) | Quranic basis (Al-Isra 17:78, Hud 11:114, Ta-Ha 20:130); Hadith of Jibril (Tirmidhi 149); Hanafi vs Shafi'i Asr |
| [Scholarly oversight](fiqh/scholarly-oversight.md) | 🟢/🟡/🔴 classification framework; ihtiyat, ikhtilaf, wasail vs ibadat |

---

## Calculation Methods

| Article | Description |
|---------|-------------|
| [Methods overview](methods/overview.md) | Full comparison table: MWL 18°/17°, ISNA 15°/15°, Egyptian 19.5°/17.5°, Umm al-Qura 18.5°/90min, Karachi, UOIF, Tehran, Morocco, Diyanet, JAKIM 20°/18° |
| [ISNA](methods/isna.md) | 15°/15°; changed from 17.5° in 2011; Fiqh Council of North America; used in North America |
| [MWL](methods/mwl.md) | 18°/17°; Muslim World League; most widely used globally; conservative Fajr angle |
| [Umm al-Qura](methods/umm-al-qura.md) | 18.5° Fajr; Isha = Maghrib + 90 min (120 in Ramadan); used in Saudi Arabia |
| [Morocco](methods/morocco.md) | 19°/17° base with per-city adjustments; Ministry of Habous publishes official times monthly |

---

## Regions

| Article | Description |
|---------|-------------|
| [Morocco](regions/morocco.md) | Sea level to 4167m (Toubkal); DST complications; Ministry authoritative timetables; Azan Now app |
| [High latitudes](regions/high-latitude.md) | Above ~48°N: persistent twilight; 1/7 night, nearest city, middle of night, angle-based solutions; ECFR rulings |

---

## Correction Algorithms

| Article | Classification | Description |
|---------|---------------|-------------|
| [Elevation](corrections/elevation.md) | 🟡 Limited precedent | Dip angle correction for Shuruq/Maghrib; adhan.js implementation; per-prayer applicability |
| [Atmospheric refraction](corrections/atmosphere.md) | 🟡 Limited precedent | Bennett formula with T/P: R × (P/1010) × (283/(273+T)); 0–2 min practical impact |
| [Terrain horizon](corrections/terrain.md) | 🔴 Novel | DEM/SRTM horizon profiles; PVGIS API; 30–60 min shifts in mountain valleys; no Islamic precedent |

---

*Wiki last compiled: see git log for `knowledge/wiki/`*
