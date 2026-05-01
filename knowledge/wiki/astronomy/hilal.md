# Hilal (Lunar Crescent) Visibility

Predicting whether the new lunar crescent will be visible from a given location after a Hijri month's conjunction. The decision of whether to begin a Hijri month rests with Islamic authorities, not with software; this page documents the *astronomical* methods fajr uses to estimate visibility, and explicitly distinguishes that from the *shar'i* (legal) act of declaring a month begun.

🟡 **Limited precedent** — fajr implements both the Odeh (2004) and Yallop (1997) criteria, returning their classifications side-by-side along with a `criteriaAgree` flag highlighting borderline ikhtilaf cases. Shaukat (2002) and pure naked-eye sighting traditions remain equally legitimate and are not yet implemented.

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

## fajr's implementation: Odeh (2004) + Yallop (1997)

fajr's `hilalVisibility(...)` function returns classifications from **both** the Odeh (2004) and Yallop (1997) criteria. The two share their geometric inputs (ARCV, W) but use different empirical polynomial fits and different category boundaries, so they can disagree in borderline cases — and that disagreement is itself useful signal.

**Why both, rather than picking one as canonical:**

1. They were fit to different observation datasets (Odeh: 737 records published 2004; Yallop: HMNAO records published 1997). Either alone overfits to its training data.
2. Different national authorities reference different criteria. Egypt's Dar al-Iftaa and ICOP align with Odeh; UK Nautical Almanac Office and several European committees use Yallop.
3. When both agree on visible/not-visible, the verdict is stable. When they disagree, the case is borderline and witness testimony / scholarly judgment matters more — fajr surfaces this with `criteriaAgree: false`.

**Why these two, not Shaukat or others:**

Odeh and Yallop are the two most-cited modern criteria with published, validated polynomial fits. Shaukat (2002) is also legitimate and is used by Pakistan's Ruet-e-Hilal Committee; it is on the roadmap but not yet implemented.

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
8. **Computes Odeh's V parameter:**
   `V = ARCV − (−0.1018 W³ + 0.7319 W² − 6.3226 W + 7.1651)`
   Classified into four bins (A–D):
   - **A** — `V ≥ 5.65` — visible to naked eye
   - **B** — `2.0 ≤ V < 5.65` — visible to naked eye in perfect sky
   - **C** — `−0.96 ≤ V < 2.0` — visible only with optical aid
   - **D** — `V < −0.96` — not visible even with optical aid

9. **Computes Yallop's q parameter:**
   `q = (ARCV − (11.8371 − 6.3226 W + 0.7319 W² − 0.1018 W³)) / 10`
   Classified into six bins (A–F):
   - **A** — `q ≥ 0.216` — easily visible to naked eye
   - **B** — `−0.014 ≤ q < 0.216` — visible to naked eye in perfect conditions
   - **C** — `−0.160 ≤ q < −0.014` — may need optical aid
   - **D** — `−0.232 ≤ q < −0.160` — will need optical aid
   - **E** — `−0.293 ≤ q < −0.232` — not visible with telescope
   - **F** — `q < −0.293` — not visible (below Danjon limit)

The two polynomials are structurally similar (same cubic in W with the same coefficients) but anchored to different visibility thresholds — Odeh's constant is 7.1651, Yallop's is 11.8371, and Yallop's overall division by 10 gives him finer-grained bin boundaries near zero. In practice Yallop is the more conservative of the two (an Odeh "C" — optical aid only — typically maps to a Yallop E or F).

### Validation

`scripts/validate-hilal.js` tests the implementation against five Hijri month transitions (Ramadan 1444, Shawwal 1444, Ramadan 1445, Ramadan 1446, Shawwal 1446) at the relevant national observatory locations.

| Case | Moon age | Odeh V (class) | Yallop q (class) | Astronomically expected | Committee |
|---|---:|---:|---:|---|---|
| Ramadan 1444 — Riyadh | 22 h | +6.28 (A) | +0.161 (B) | visible | visible (Saudi) ✓ |
| Shawwal 1444 — Riyadh | 11 h | −1.79 (D) | −0.646 (F) | not visible | not visible (Saudi) ✓ |
| Ramadan 1445 — Dubai | 5.5 h | −4.05 (D) | −0.872 (F) | not visible | UAE accepted ◇ |
| Ramadan 1446 — Cairo | 15 h | +1.60 (C) | −0.307 (F) | not visible | Egypt accepted ◇ |
| Shawwal 1446 — Rabat | 8 h | −3.01 (D) | −0.768 (F) | not visible | not visible (Morocco) ✓ |

**Astronomical accuracy: 5/5.** Every case matches the astronomically-defensible expectation derived from moon age and Danjon limit (~18 hours minimum for any naked-eye crescent).

**Committee agreement: 3/5.** The two disagreements (UAE Ramadan 1445, Egypt Ramadan 1446) are cases where a national committee accepted witness testimony despite astronomical impossibility or borderline values. Other countries (Pakistan, Morocco, Iran, India) rejected the same sightings on astronomical grounds. fajr aligns with the astronomically rigorous side of that disagreement.

---

## What fajr does NOT do

- **Shaukat or Bruin criteria.** fajr currently runs Odeh + Yallop. Shaukat (2002, used by Pakistan's Ruet-e-Hilal Committee) and Bruin (1977) are on the roadmap but not yet implemented.
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
