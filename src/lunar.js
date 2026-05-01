// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Lunar (and incidental solar) position calculation for hilal visibility.
 *
 * Geocentric lunar position uses Meeus chapter 47's Brown's lunar theory
 * truncated to the dominant periodic terms. Solar position uses Meeus
 * chapter 25 simplified series.
 *
 * Targeted accuracy:
 *   - Lunar RA / Dec:    ≤ 0.05°  (~3 arcmin)
 *   - Lunar distance:     ≤ 0.5%
 *   - Solar RA / Dec:    ≤ 0.01°
 * That is comfortably below the ~1° atmospheric / observer noise floor
 * that dominates crescent visibility in practice — see
 * knowledge/wiki/astronomy/hilal.md.
 *
 * References:
 *   Meeus, J. (1998). Astronomical Algorithms (2nd ed.). Willmann-Bell.
 *     Ch. 22 (Sidereal time), Ch. 25 (Solar position), Ch. 40 (Topocentric
 *     parallax), Ch. 47 (Position of the Moon).
 *
 * 🟢 Established — these are textbook formulas widely used by USNO, JPL,
 * and every major observatory.
 */

const DEG = Math.PI / 180

export function jdFromDate(date) {
  // Unix-epoch JD = 2440587.5 (1970-01-01T00:00:00Z)
  return 2440587.5 + date.getTime() / 86400000
}

export function dateFromJd(jd) {
  return new Date((jd - 2440587.5) * 86400000)
}

export function julianCentury(jd) {
  return (jd - 2451545.0) / 36525
}

function mod360(x) {
  return ((x % 360) + 360) % 360
}

// ─────────────────────────────────────────────────────────────────────────────
// Solar position (Meeus 25.2–25.7)
// ─────────────────────────────────────────────────────────────────────────────

export function solarPosition(jd) {
  const T = julianCentury(jd)

  const L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T)
  const M  = mod360(357.52911 + 35999.05029 * T - 0.0001537 * T * T)
  const e  = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T

  const Mr = M * DEG
  const C =
      (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr)

  const trueL = L0 + C       // true geocentric ecliptic longitude
  const trueAnomaly = M + C
  const R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly * DEG))

  // Apparent longitude (correct for aberration + nutation, simplified)
  const omega = 125.04 - 1934.136 * T
  const lambda = trueL - 0.00569 - 0.00478 * Math.sin(omega * DEG)

  // Mean obliquity of the ecliptic (Meeus 22.2)
  const epsilon0 = 23.0 + 26.0/60 + 21.448/3600
                   - (46.8150*T + 0.00059*T*T - 0.001813*T*T*T) / 3600
  const epsilon = epsilon0 + 0.00256 * Math.cos(omega * DEG)  // apparent

  const lambdaR = lambda * DEG
  const epsR = epsilon * DEG

  const sinDec = Math.sin(epsR) * Math.sin(lambdaR)
  const dec = Math.asin(sinDec) / DEG
  let ra = Math.atan2(Math.cos(epsR) * Math.sin(lambdaR), Math.cos(lambdaR)) / DEG
  if (ra < 0) ra += 360

  return { jd, lambda, ra, dec, distance: R, epsilon }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lunar position (Meeus 47)
// ─────────────────────────────────────────────────────────────────────────────

// Selection of the largest periodic terms in longitude / distance from
// Meeus Table 47.A. Each entry: [D, M, M', F, A_lon (sin coef × 1e-6 deg),
// A_dist (cos coef × 1e-3 km)]. Includes the 14 dominant terms; together
// they capture the geocentric longitude to better than 0.05°.
const LON_TERMS = [
  [0,  0, 1, 0,  6288774, -20905355],
  [2,  0,-1, 0,  1274027,  -3699111],
  [2,  0, 0, 0,   658314,  -2955968],
  [0,  0, 2, 0,   213618,   -569925],
  [0,  1, 0, 0,  -185116,     48888],
  [0,  0, 0, 2,  -114332,     -3149],
  [2,  0,-2, 0,    58793,    246158],
  [2, -1,-1, 0,    57066,   -152138],
  [2,  0, 1, 0,    53322,   -170733],
  [2, -1, 0, 0,    45758,   -204586],
  [0,  1,-1, 0,   -40923,   -129620],
  [1,  0, 0, 0,   -34720,    108743],
  [0,  1, 1, 0,   -30383,    104755],
  [2,  0, 0,-2,    15327,     10321],
]

// Largest latitude terms from Meeus Table 47.B.
// [D, M, M', F, A_lat (sin coef × 1e-6 deg)]
const LAT_TERMS = [
  [0,  0, 0, 1,  5128122],
  [0,  0, 1, 1,   280602],
  [0,  0, 1,-1,   277693],
  [2,  0, 0,-1,   173237],
  [2,  0,-1, 1,    55413],
  [2,  0,-1,-1,    46271],
  [2,  0, 0, 1,    32573],
  [0,  0, 2, 1,    17198],
  [2,  0, 1,-1,     9266],
  [0,  0, 2,-1,     8822],
]

export function lunarPosition(jd) {
  const T = julianCentury(jd)

  // Mean elements (Meeus 47.1–47.5)
  const Lp = mod360(218.3164477 + 481267.88123421*T - 0.0015786*T*T
                  + T*T*T/538841 - T*T*T*T/65194000)
  const D  = mod360(297.8501921 + 445267.1114034*T  - 0.0018819*T*T
                  + T*T*T/545868 - T*T*T*T/113065000)
  const M  = mod360(357.5291092 + 35999.0502909*T   - 0.0001536*T*T
                  + T*T*T/24490000)
  const Mp = mod360(134.9633964 + 477198.8675055*T  + 0.0087414*T*T
                  + T*T*T/69699 - T*T*T*T/14712000)
  const F  = mod360(93.2720950  + 483202.0175233*T  - 0.0036539*T*T
                  - T*T*T/3526000 + T*T*T*T/863310000)

  // Eccentricity correction (Meeus 47.6)
  const E = 1 - 0.002516*T - 0.0000074*T*T

  let sumL = 0
  let sumR = 0
  for (const [d, m, mp, f, aL, aR] of LON_TERMS) {
    const arg = (d*D + m*M + mp*Mp + f*F) * DEG
    const eFactor = m === 0 ? 1 : (Math.abs(m) === 1 ? E : E*E)
    sumL += aL * eFactor * Math.sin(arg)
    sumR += aR * eFactor * Math.cos(arg)
  }
  let sumB = 0
  for (const [d, m, mp, f, aB] of LAT_TERMS) {
    const arg = (d*D + m*M + mp*Mp + f*F) * DEG
    const eFactor = m === 0 ? 1 : (Math.abs(m) === 1 ? E : E*E)
    sumB += aB * eFactor * Math.sin(arg)
  }

  const lambda   = mod360(Lp + sumL / 1e6)   // geocentric ecliptic longitude (deg)
  const beta     = sumB / 1e6                 // geocentric ecliptic latitude  (deg)
  const distance = 385000.56 + sumR / 1e3     // geocentric distance (km)

  // Mean obliquity of ecliptic (Meeus 22.2 simplified)
  const epsilon = 23.4392911 - 0.0130042*T - 0.00000016*T*T + 0.000000503*T*T*T

  const lambdaR = lambda * DEG
  const betaR   = beta   * DEG
  const epsR    = epsilon * DEG

  const sinDec = Math.sin(betaR)*Math.cos(epsR) + Math.cos(betaR)*Math.sin(epsR)*Math.sin(lambdaR)
  const dec = Math.asin(sinDec) / DEG

  let ra = Math.atan2(
    Math.sin(lambdaR)*Math.cos(epsR) - Math.tan(betaR)*Math.sin(epsR),
    Math.cos(lambdaR),
  ) / DEG
  if (ra < 0) ra += 360

  return { jd, lambda, beta, distance, ra, dec, epsilon }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidereal time + topocentric parallax (Meeus 12, 40)
// ─────────────────────────────────────────────────────────────────────────────

export function gmst(jd) {
  const T = julianCentury(jd)
  const theta = 280.46061837
              + 360.98564736629 * (jd - 2451545.0)
              + 0.000387933 * T * T
              - T * T * T / 38710000
  return mod360(theta)
}

// Convert geocentric (ra, dec, distance_km) to topocentric for a given
// observer (Meeus 40.6, 40.7). Returns adjusted ra, dec.
export function topocentric(geo, observerLat, observerLon, jd) {
  const piDeg = Math.asin(6378.14 / geo.distance) / DEG  // equatorial horizontal parallax
  const lst   = mod360(gmst(jd) + observerLon)
  const H     = lst - geo.ra                              // hour angle (deg)

  const phi   = observerLat * DEG
  const u     = Math.atan(0.99664719 * Math.tan(phi))
  const rhoSinPhip = 0.99664719 * Math.sin(u)
  const rhoCosPhip = Math.cos(u)

  const HR    = H * DEG
  const decR  = geo.dec * DEG
  const sinPi = Math.sin(piDeg * DEG)

  const A = Math.cos(decR) * Math.sin(HR)
  const B = Math.cos(decR) * Math.cos(HR) - rhoCosPhip * sinPi
  const C = Math.sin(decR) - rhoSinPhip * sinPi

  const dRa = Math.atan2(-rhoCosPhip * sinPi * Math.sin(HR),
                          Math.cos(decR) - rhoCosPhip * sinPi * Math.cos(HR))
  const raTopo = mod360(geo.ra + dRa / DEG)
  const decTopo = Math.atan2(C, Math.sqrt(A*A + B*B)) / DEG

  return { ...geo, ra: raTopo, dec: decTopo, parallaxDeg: piDeg, hourAngleGeo: H }
}

// Apparent altitude of a body for an observer at (lat, lon) at given jd.
// Uses topocentric coordinates. Returns altitude in degrees, +ve = above horizon.
export function altitude(bodyGeo, observerLat, observerLon, jd) {
  const topo = topocentric(bodyGeo, observerLat, observerLon, jd)
  const lst  = mod360(gmst(jd) + observerLon)
  const H    = (lst - topo.ra) * DEG
  const phi  = observerLat * DEG
  const decR = topo.dec * DEG
  const sinAlt = Math.sin(phi)*Math.sin(decR) + Math.cos(phi)*Math.cos(decR)*Math.cos(H)
  return Math.asin(sinAlt) / DEG
}
