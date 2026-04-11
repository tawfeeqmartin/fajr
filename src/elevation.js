// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Elevation correction formulas for prayer times.
 *
 * Corrections are tagged with scholarly classification per CLAUDE.md:
 *   🟢 Established | 🟡 Limited precedent | 🔴 Novel
 *
 * See knowledge/wiki/corrections/elevation-horizon.md for derivation and sources.
 */

const EARTH_RADIUS_M = 6_371_000
const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

/**
 * Calculate the geometric horizon dip angle in degrees at a given elevation.
 *
 * 🟡 Limited precedent: The geometric formula is standard astronomy.
 * Its application to Islamic prayer time calculation has precedent in
 * classical muwaqqit texts for elevated mosques, but modern standardized
 * treatment is limited.
 *
 * @param {number} elevationMeters  Height above sea level in meters
 * @returns {number} Horizon dip in degrees (positive = depression below true horizon)
 */
export function horizonDipDegrees(elevationMeters) {
  if (elevationMeters <= 0) return 0
  return Math.sqrt(2 * elevationMeters / EARTH_RADIUS_M) * RAD_TO_DEG
}

/**
 * Convert a horizon dip in degrees to minutes of prayer time shift.
 * Uses the approximation: sun moves ~1° of arc per 4 minutes at equator.
 *
 * 🟡 Limited precedent: The 4 min/degree approximation is valid near the equator
 * but degrades at high latitudes. A full correction requires accounting for
 * latitude and time of year.
 *
 * @param {number} dipDegrees
 * @returns {number} Time shift in minutes
 */
export function dipToMinutes(dipDegrees) {
  return dipDegrees * 4
}

/**
 * Full elevation correction for sunrise/sunset times.
 *
 * @param {Date}   time        The uncorrected prayer time
 * @param {number} elevation   Meters above sea level
 * @param {string} direction   'earlier' (sunrise) or 'later' (sunset)
 * @returns {Date} Corrected time
 */
export function correctForElevation(time, elevation, direction) {
  const dipDeg = horizonDipDegrees(elevation)
  const shiftMin = dipToMinutes(dipDeg)
  const shiftMs = shiftMin * 60 * 1000

  return direction === 'earlier'
    ? new Date(time.getTime() - shiftMs)
    : new Date(time.getTime() + shiftMs)
}
