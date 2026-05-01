# Hilal (Lunar Crescent) Visibility

Predicting whether the new lunar crescent will be visible from a given location after a Hijri month's conjunction. The decision of whether to begin a Hijri month rests with Islamic authorities, not with software; this page documents the *astronomical* methods fajr uses to estimate visibility, and explicitly distinguishes that from the *shar'i* (legal) act of declaring a month begun.

🟡 **Limited precedent** — fajr currently implements the Odeh (2004) criterion. Yallop (1997) and Shaukat (2002) are equally legitimate alternatives that may give different answers in borderline cases.

---

## What is hilal visibility prediction?

Each Hijri month begins after the new crescent moon (*hilal*) is sighted following the conjunction (new moon). The traditional question on the evening of day 29 of any Hijri month is: *will the crescent be visible to a witness at some location at sunset tonight?* If yes, the next month begins at the following sunset; if no, the current month is completed to 30 days.

A "hilal visibility criterion" is an astronomical model that predicts whether the moon will be physically visible. Inputs are the Sun and Moon positions at the observer at the relevant time; outputs are typically a categorical classification (visible to naked eye / visible only with optical aid / not visible).

Several criteria coexist in legitimate scholarly use:

| Criterion | Authority | Year | Approach |
|---|---|---|---|
| **Babylonian rule** | classical | ancient | Lag time ≥ 48 minutes between sunset and moonset |
| **Maunder** | UK | 1911 | Combination of moon age and altitude difference |
| **Bruin** | Netherlands | 1977 | Theoretical contrast threshold model |
| **Yallop** | UK HM Nautical Almanac Office | 1997 | Empirical *q* parameter, four classes |
| **Shaukat** | Pakistan Ruet-e-Hilal | 2002 | Geocentric lag and elongation thresholds |
| **Odeh** | Islamic Crescents' Observation Project | 2004 | Empirical *V* parameter fit to 737 records, four classes |

Each was empirically fit to a different observational dataset, and each gives slightly different answers in borderline cases. The legitimate disagreement between them is *ikhtilaf*, not error.

---

## fajr's implementation: Odeh (2004)

fajr's `hilalVisibility(...)` function returns a classification using the Odeh (2004) criterion, chosen because:

1. It is fit to the largest published observation dataset (737 sightings, naked-eye and aided).
2. It is the basis of the official calculations used by Egypt's Dar al-Iftaa, Jordan, and the Islamic Crescents' Observation Project (ICOP).
3. It produces a single continuous *V* parameter that maps cleanly to four visibility classes.

### Computation

For a given Hijri (year, month) and observer (latitude, longitude), fajr:

1. **Picks the canonical sighting evening.** Day 29 of (month − 1) at the observer's local sunset.
2. **Computes sunset.** Solar topocentric altitude = −0.8333° (standard refraction + solar radius).
3. **Computes moonset.** Lunar topocentric altitude = −0.5833° (standard refraction; lunar parallax handled by topocentric correction).
4. **Computes the best time.** sunset + (4/9) × (moonset − sunset) — Odeh's recommended evaluation epoch, the moment when the crescent is most likely to be visible.
5. **Computes positions at best time:**
   - Solar geocentric position from Meeus chapter 25 truncated series.
   - Lunar geocentric position from Meeus chapter 47 truncated Brown's lunar theory (14 longitude/distance terms, 10 latitude terms — accuracy ≤ 0.05° in RA/Dec, ≤ 0.5% in distance).
   - Lunar topocentric correction from Meeus chapter 40.
6. **Computes ARCV** (arc of vision) — angular separation between Sun (geocentric) and Moon (topocentric) centres at best time.
7. **Computes W** (crescent width in arcminutes) — `SD × (1 − cos(ARCL))`, where SD is the Moon's apparent semi-diameter and ARCL is the elongation.
8. **Computes V**, the Odeh parameter:
   `V = ARCV − (−0.1018 W³ + 0.7319 W² − 6.3226 W + 7.1651)`
9. **Classifies:**
   - **A** — `V ≥ 5.65` — visible to naked eye
   - **B** — `2.0 ≤ V < 5.65` — visible to naked eye in perfect sky
   - **C** — `−0.96 ≤ V < 2.0` — visible only with optical aid
   - **D** — `V < −0.96` — not visible even with optical aid

### Validation

`scripts/validate-hilal.js` tests the implementation against five Hijri month transitions (Ramadan 1444, Shawwal 1444, Ramadan 1445, Ramadan 1446, Shawwal 1446) at the relevant national observatory locations.

| Case | Moon age | fajr V | fajr class | Astronomically expected | Committee decision |
|---|---:|---:|---|---|---|
| Ramadan 1444 — Riyadh | 22 h | +6.28 | A | visible | visible (Saudi) ✓ |
| Shawwal 1444 — Riyadh | 11 h | −1.79 | D | not visible | not visible (Saudi) ✓ |
| Ramadan 1445 — Dubai | 5.5 h | −4.05 | D | not visible | UAE accepted ◇ |
| Ramadan 1446 — Cairo | 15 h | +1.60 | C | borderline | Egypt accepted ◇ |
| Shawwal 1446 — Rabat | 8 h | −3.01 | D | not visible | not visible (Morocco) ✓ |

**Astronomical accuracy: 5/5.** Every case matches the astronomically-defensible expectation derived from moon age and Danjon limit (~18 hours minimum for any naked-eye crescent).

**Committee agreement: 3/5.** The two disagreements (UAE Ramadan 1445, Egypt Ramadan 1446) are cases where a national committee accepted witness testimony despite astronomical impossibility or borderline values. Other countries (Pakistan, Morocco, Iran, India) rejected the same sightings on astronomical grounds. fajr aligns with the astronomically rigorous side of that disagreement.

---

## What fajr does NOT do

- **Multi-criterion ensemble.** fajr uses Odeh only; Yallop and Shaukat are not implemented. A future enhancement could compute all three and surface disagreement.
- **Atmospheric customisation.** Local extinction, light pollution, dust, humidity all affect real visibility but are not modelled. fajr uses standard atmospheric refraction (-0.5667°).
- **Witness testimony arbitration.** Committee decisions about whether to *accept* a reported sighting are matters of fiqh, not astronomy. fajr provides the astronomical possibility; the committees decide.
- **Scholarly authority.** This module is wasail (means). The decision to begin a Hijri month is ibadat (worship). fajr does not and cannot replace either a sighting committee or scholarly judgment.

---

## References

- **Odeh, M.S. (2004).** "New criterion for lunar crescent visibility," *Experimental Astronomy* 18, 39–64.
- **Yallop, B.D. (1997).** "A method for predicting the first sighting of the new crescent moon," NAO Technical Note No. 69.
- **Shaukat, K. (2002).** "Lunar crescent visibility — a comprehensive criterion," HMNAO/ICOP working paper.
- **Meeus, J. (1998).** *Astronomical Algorithms* (2nd ed.). Willmann-Bell. Chapters 22, 25, 40, 47.
- **Danjon, A. (1932).** "Jeunes et vieilles lunes," *L'Astronomie* 46, 57–66. (Origin of the "Danjon limit" — minimum elongation for visibility.)
- **Islamic Crescents' Observation Project (ICOP).** [icoproject.org](https://www.icoproject.org/) — ongoing observation database and visibility maps.

---

## Cross-references

- [[wiki/fiqh/scholarly-oversight]] — wasail / ibadat distinction; legitimate scholarly disagreement
- [[wiki/astronomy/refraction]] — atmospheric refraction conventions
- `src/lunar.js` — Meeus-based lunar and solar position implementation
- `src/hilal.js` — Odeh classification and the public `hilalVisibility` API
- `scripts/validate-hilal.js` — historical validation cases
