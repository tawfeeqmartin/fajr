// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Hilal (lunar crescent) visibility prediction using the Odeh (2004) criterion.
 *
 * Given a Hijri year and month plus an observer location, returns whether the
 * new crescent is expected to be visible on the evening of day 29 of the
 * preceding Hijri month — the night when sighting committees decide whether
 * the next month begins at the following sunset (visible) or after a
 * thirty-day completion of the current month (not visible).
 *
 * 🟡 Limited precedent: Odeh (2004) is empirically fit to 737 historical
 * observations and is the basis for several Muslim-majority countries'
 * official calculation guidance (notably Egypt's Dar al-Iftaa, Jordan,
 * and the Islamic Crescents' Observation Project). It is NOT the sole
 * accepted criterion — Yallop, Shaukat, Bruin, and naked-eye sighting
 * traditions all coexist in legitimate ikhtilaf.
 *
 * The decision of whether to begin a Hijri month rests with Islamic
 * authorities, not with software. This module provides an astronomical
 * probability estimate; it is wasail (means), not ibadat (worship).
 *
 * see knowledge/wiki/astronomy/hilal.md
 *
 * References:
 *   Odeh, M.S. (2004). "New criterion for lunar crescent visibility,"
 *     Experimental Astronomy 18, 39–64.
 *   Meeus, J. (1998). Astronomical Algorithms (2nd ed.), Chs 47, 49.
 */

import { jdFromDate, dateFromJd, lunarPosition, solarPosition, topocentric, altitude } from './lunar.js'

const DEG = Math.PI / 180

// Hijri (tabular Kuwaiti algorithm, inverse of jdToHijri in hijri.js).
// 1 Muharram 1 AH = JD 1948440 (16 July 622 CE Julian / 19 July CE Gregorian).
function hijriToJd(year, month, day) {
  return (
      Math.floor((11 * year + 3) / 30)
    + 354 * year
    + 30 * month
    - Math.floor((month - 1) / 2)
    + day
    + 1948440
    - 385
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sunset, moonset, conjunction
// ─────────────────────────────────────────────────────────────────────────────

const SUN_HORIZON_DEG  = -0.8333   // standard refraction + solar radius
const MOON_HORIZON_DEG = -0.5833   // standard refraction; lunar parallax handled by topocentric()

// Find the JD where solar topocentric altitude crosses the given threshold,
// going downward — i.e., sunset on the Gregorian day enclosing the supplied
// JD anchor, for an observer at the given longitude.
//
// We estimate the sunset time from longitude (UT ≈ 18 − lon/15 hours) and
// search ±0.25 days around that estimate, which covers latitudinal sunset
// drift (well into polar regions) without false-bracketing the previous or
// next day's sunset.
function findSunset(jdNoonUT, observerLat, observerLon) {
  const expectedSunsetUT = jdNoonUT - 0.5 + (18 - observerLon / 15) / 24
  return findAltitudeCrossing(
    jd => solarAltitude(solarPosition(jd), observerLat, observerLon, jd),
    SUN_HORIZON_DEG,
    expectedSunsetUT - 0.25,
    expectedSunsetUT + 0.25,
  )
}

function findMoonset(jdStart, jdEnd, observerLat, observerLon) {
  return findAltitudeCrossing(
    jd => altitude(lunarPosition(jd), observerLat, observerLon, jd),
    MOON_HORIZON_DEG,
    jdStart,
    jdEnd,
  )
}

function solarAltitude(sun, lat, lon, jd) {
  // Inline a lightweight altitude calculation (sun's parallax is negligible).
  const T = (jd - 2451545.0) / 36525
  const gmstDeg = ((280.46061837 + 360.98564736629*(jd - 2451545.0)
                   + 0.000387933*T*T - T*T*T/38710000) % 360 + 360) % 360
  const lst = ((gmstDeg + lon) % 360 + 360) % 360
  const H = (lst - sun.ra) * DEG
  const phi = lat * DEG
  const dec = sun.dec * DEG
  return Math.asin(Math.sin(phi)*Math.sin(dec) + Math.cos(phi)*Math.cos(dec)*Math.cos(H)) / DEG
}

// Bisection to find the JD where altitudeFn(jd) crosses `threshold` going downward.
// Returns null if no downward crossing within [jdLo, jdHi].
function findAltitudeCrossing(altitudeFn, threshold, jdLo, jdHi) {
  // Coarse scan
  const STEP = 1 / 1440  // 1-minute steps
  let prevJd = jdLo
  let prevAlt = altitudeFn(prevJd) - threshold
  for (let jd = jdLo + STEP; jd <= jdHi; jd += STEP) {
    const alt = altitudeFn(jd) - threshold
    if (prevAlt > 0 && alt <= 0) {
      // bracketed — refine via bisection
      let a = prevJd, b = jd
      for (let i = 0; i < 25; i++) {
        const mid = (a + b) / 2
        const v = altitudeFn(mid) - threshold
        if (v > 0) a = mid; else b = mid
      }
      return (a + b) / 2
    }
    prevJd = jd
    prevAlt = alt
  }
  return null
}

// Find the JD of the conjunction (new moon) within ± searchDays of the centre.
// Solves for sun.lambda - moon.lambda ≡ 0 (mod 360), with the moon catching
// up to (or just leaving) the sun.
function findConjunction(jdCentre, searchDays = 1.5) {
  // The lunation function: signed difference (moon − sun) ecliptic longitude,
  // wrapped into [-180, +180]. Ascends through zero at conjunction.
  const f = jd => {
    let d = lunarPosition(jd).lambda - solarPosition(jd).lambda
    while (d > 180) d -= 360
    while (d < -180) d += 360
    return d
  }

  let lo = jdCentre - searchDays
  let hi = jdCentre + searchDays
  let fLo = f(lo)
  let fHi = f(hi)

  // The function is monotonic over a 3-day window (moon pulls ahead of sun by
  // ~12 °/day, sun moves ~1 °/day, so the difference grows ~11 °/day). If they
  // don't bracket a zero we widen the search.
  let widen = 0
  while (fLo * fHi > 0 && widen++ < 5) {
    lo -= 0.5
    hi += 0.5
    fLo = f(lo)
    fHi = f(hi)
  }
  if (fLo * fHi > 0) return null

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const fMid = f(mid)
    if (fMid * fLo > 0) { lo = mid; fLo = fMid }
    else                 { hi = mid; fHi = fMid }
  }
  return (lo + hi) / 2
}

// ─────────────────────────────────────────────────────────────────────────────
// Geometry: arc of vision and crescent width
// ─────────────────────────────────────────────────────────────────────────────

// Great-circle angular separation between two equatorial coordinates.
function angularSeparation(ra1, dec1, ra2, dec2) {
  const r1 = ra1 * DEG, d1 = dec1 * DEG
  const r2 = ra2 * DEG, d2 = dec2 * DEG
  const cosSep = Math.sin(d1)*Math.sin(d2) + Math.cos(d1)*Math.cos(d2)*Math.cos(r1 - r2)
  return Math.acos(Math.max(-1, Math.min(1, cosSep))) / DEG
}

// Angular separation between two equatorial coordinates — used both for the
// arc of vision and for the moon-sun elongation (they differ by < 0.1° at
// best time for any plausible crescent configuration).
function arcOfVision(a, b) {
  return angularSeparation(a.ra, a.dec, b.ra, b.dec)
}

// Crescent width W in arcminutes (Odeh 2004, eq. 2):
//   W = SD × (1 − cos(ARCL))
// where ARCL is the elongation (Moon-Sun arc) in degrees and SD is the
// Moon's apparent semi-diameter in arcminutes. (1 − cos) is dimensionless,
// so W comes out in the same units as SD.
function crescentWidth(arclDeg, moonDistanceKm) {
  const MOON_RADIUS_KM = 1737.4
  const sdArcmin = (Math.atan(MOON_RADIUS_KM / moonDistanceKm) / DEG) * 60
  return sdArcmin * (1 - Math.cos(arclDeg * DEG))
}

// ─────────────────────────────────────────────────────────────────────────────
// Odeh (2004) classification
// ─────────────────────────────────────────────────────────────────────────────

// V = ARCV − (-0.1018 W³ + 0.7319 W² − 6.3226 W + 7.1651)
// (Odeh 2004, eq. 6, with ARCV in degrees, W in arcminutes.)
function odehV(arcvDeg, widthArcmin) {
  const W = widthArcmin
  const correction = -0.1018*W*W*W + 0.7319*W*W - 6.3226*W + 7.1651
  return arcvDeg - correction
}

// Classification thresholds (Odeh 2004, Table 1).
function classifyOdeh(V) {
  if (V === null || Number.isNaN(V)) return { code: '?', label: 'unknown', visible: null }
  if (V >= 5.65)  return { code: 'A', label: 'visible to naked eye',                visible: true  }
  if (V >= 2.0)   return { code: 'B', label: 'visible to naked eye in perfect sky', visible: true  }
  if (V >= -0.96) return { code: 'C', label: 'visible only with optical aid',       visible: false }
  return            { code: 'D', label: 'not visible even with optical aid',         visible: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Yallop (1997) classification — HM Nautical Almanac Office TN No. 69
// ─────────────────────────────────────────────────────────────────────────────

// q = (ARCV − f(W)) / 10
// where f(W) = 11.8371 − 6.3226 W + 0.7319 W² − 0.1018 W³
// (Same polynomial structure as Odeh but with constant 11.8371 vs 7.1651
// and a /10 normalisation. Empirically fit to a different sighting record;
// gives 6-class A–F output instead of Odeh's 4-class A–D.)
function yallopQ(arcvDeg, widthArcmin) {
  const W = widthArcmin
  const fW = 11.8371 - 6.3226*W + 0.7319*W*W - 0.1018*W*W*W
  return (arcvDeg - fW) / 10
}

// Classification thresholds (Yallop 1997, Table 2).
function classifyYallop(q) {
  if (q === null || Number.isNaN(q)) return { code: '?', label: 'unknown', visible: null }
  if (q >=  0.216) return { code: 'A', label: 'easily visible to naked eye',                          visible: true  }
  if (q >= -0.014) return { code: 'B', label: 'visible to naked eye in perfect conditions',           visible: true  }
  if (q >= -0.160) return { code: 'C', label: 'may need optical aid to find crescent',                visible: false }
  if (q >= -0.232) return { code: 'D', label: 'will need optical aid to find crescent',               visible: false }
  if (q >= -0.293) return { code: 'E', label: 'not visible with a telescope',                          visible: false }
  return            { code: 'F', label: 'not visible (below Danjon limit)',                            visible: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate hilal visibility for the start of a Hijri month at a given location.
 *
 * Convention: visibility is evaluated at sunset on day 29 of the *preceding*
 * Hijri month — the canonical sighting evening for deciding whether the named
 * month begins at the following sunset or whether the current month is
 * completed to 30 days.
 *
 * @param {object} params
 * @param {number} params.year       Hijri year
 * @param {number} params.month      Hijri month (1–12); the month whose start is being assessed
 * @param {number} params.latitude   Observer latitude (deg, north positive)
 * @param {number} params.longitude  Observer longitude (deg, east positive)
 * @returns {object}
 */
export function hilalVisibility({ year, month, latitude, longitude }) {
  // Day 29 of the prior Hijri month is the canonical evaluation date.
  const priorMonth = month === 1 ? 12 : month - 1
  const priorYear  = month === 1 ? year - 1 : year
  const jdEval     = hijriToJd(priorYear, priorMonth, 29)

  // hijriToJd returns an integer JD = noon UT of that Hijri day. findSunset
  // expects the noon-UT anchor and uses observer longitude to estimate the
  // local sunset time before bracketing the search.
  const jdSunset = findSunset(jdEval, latitude, longitude)
  if (jdSunset === null) {
    return notVisible({ year, month, reason: 'sun-never-sets-on-this-date', latitude, longitude })
  }

  // Moonset between sunset and sunset+1 day.
  const jdMoonset = findMoonset(jdSunset, jdSunset + 1, latitude, longitude)
  if (jdMoonset === null) {
    return notVisible({ year, month, reason: 'moon-never-sets-after-sunset', latitude, longitude })
  }

  // Lag time (minutes).
  const lagMinutes = (jdMoonset - jdSunset) * 1440
  if (lagMinutes <= 0) {
    return degenerateNotVisible({
      reason: 'moon sets before sun — crescent below horizon at sunset',
      lagMinutes, year, month, latitude, longitude,
    })
  }

  // Best time = sunset + 4/9 × lag (Odeh 2004 §3.1).
  const jdBestTime = jdSunset + (4/9) * (jdMoonset - jdSunset)

  // Positions at best time.
  // Sun: geocentric is fine (solar parallax ≈ 9″, negligible at this scale).
  // Moon: topocentric is required — Odeh's thresholds are calibrated against
  //       topocentric arcs (lunar parallax is up to ~1° near horizon, the
  //       same scale as the crescent-visibility classification boundaries).
  const sun       = solarPosition(jdBestTime)
  const moonGeo   = lunarPosition(jdBestTime)
  const moonTopo  = topocentric(moonGeo, latitude, longitude, jdBestTime)

  const ARCV = arcOfVision(sun, moonTopo)
  const ARCL = ARCV   // for sub-degree crescents these differ by < 0.1°
  const W    = crescentWidth(ARCL, moonGeo.distance)   // distance unchanged by parallax

  // Compute both criteria. Odeh is the top-level "primary" answer for
  // backward compatibility; Yallop is reported alongside so that
  // disagreement between the two is surfaced rather than hidden.
  const V          = odehV(ARCV, W)
  const odeh       = classifyOdeh(V)
  const q          = yallopQ(ARCV, W)
  const yallop     = classifyYallop(q)
  const agree      = odeh.visible === yallop.visible

  // Conjunction (for reporting only).
  const jdConjunction = findConjunction(jdEval - 1, 1.5)
  const moonAgeHours  = jdConjunction === null ? null : (jdBestTime - jdConjunction) * 24

  return {
    // Top-level: Odeh (primary, preserved API).
    visible:   odeh.visible,
    code:      odeh.code,
    label:     odeh.label,
    criterion: 'Odeh (2004)',
    V: round(V, 3),

    // Yallop side-by-side.
    yallop: {
      criterion: 'Yallop (1997)',
      visible: yallop.visible,
      code:    yallop.code,
      label:   yallop.label,
      q:       round(q, 4),
    },

    // Multi-criterion agreement summary. `criteriaAgree: false` flags an
    // ikhtilaf case worth surfacing in any UI — the two empirical fits
    // give different verdicts, so neither alone is decisive.
    criteriaAgree: agree,

    // Geometry (shared between criteria).
    arcvDeg:        round(ARCV, 3),
    widthArcmin:    round(W, 3),
    lagTimeMinutes: round(lagMinutes, 1),
    moonAgeHours:   moonAgeHours === null ? null : round(moonAgeHours, 2),
    bestTimeUTC:    dateFromJd(jdBestTime).toISOString(),
    sunsetUTC:      dateFromJd(jdSunset).toISOString(),
    moonsetUTC:     dateFromJd(jdMoonset).toISOString(),
    conjunctionUTC: jdConjunction === null ? null : dateFromJd(jdConjunction).toISOString(),

    // Hijri context.
    evaluatedHijriDate: { year: priorYear, month: priorMonth, day: 29 },
    forHijriMonth:      { year, month },
    latitude, longitude,

    note: "Odeh (2004) and Yallop (1997) are two of several legitimate visibility criteria. When they disagree (`criteriaAgree: false`), the case is borderline and witness testimony / scholarly judgment matters. The decision of whether to begin a Hijri month rests with Islamic authorities, not with software. See knowledge/wiki/astronomy/hilal.md.",
  }
}

function notVisible(meta) {
  return degenerateNotVisible(meta)
}

function degenerateNotVisible(meta) {
  // Both criteria agree on degenerate cases (no sunset, no moonset, or
  // moon-before-sun). Construct a uniform response shape so callers don't
  // need to special-case missing yallop fields.
  return {
    visible: false,
    code: 'D',
    label: meta.reason,
    criterion: 'Odeh (2004)',
    V: null,
    yallop: {
      criterion: 'Yallop (1997)',
      visible: false,
      code: 'F',
      label: meta.reason,
      q: null,
    },
    criteriaAgree: true,
    lagTimeMinutes: meta.lagMinutes ?? null,
    moonAgeHours: null,
    arcvDeg: null,
    widthArcmin: null,
    forHijriMonth: { year: meta.year, month: meta.month },
    latitude: meta.latitude,
    longitude: meta.longitude,
    note: meta.reason,
  }
}

function round(x, digits) {
  if (x === null || Number.isNaN(x)) return null
  const k = 10 ** digits
  return Math.round(x * k) / k
}
