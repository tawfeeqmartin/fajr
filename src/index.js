// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr — public API
 *
 * This is the stable public interface. Do not modify without human review.
 * Internal implementation lives in engine.js and the other src/ modules.
 */

import { prayerTimes as _prayerTimes, applyElevationCorrection, dayTimes as _dayTimes } from './engine.js'
import { qibla } from './qibla.js'
import { hijri } from './hijri.js'
import { hilalVisibility } from './hilal.js'
import { nightThirds } from './night.js'
import { travelerMode } from './traveler.js'

/**
 * Calculate prayer times with all applicable corrections.
 *
 * @param {object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {Date}   params.date
 * @param {number} [params.elevation=0]
 * @param {string} [params.method]  Override auto-detected method
 * @returns {object}
 */
function prayerTimes(params) {
  let times = _prayerTimes(params)
  if (params.elevation && params.elevation > 0) {
    times = applyElevationCorrection(times, params.elevation)
  }
  return times
}

/**
 * Single-call convenience returning the 6 prayers + sunrise + sunset +
 * midnight + qiyam in one object. See engine.js dayTimes() for details.
 */
function dayTimes(params) {
  return _dayTimes(params)
}

export default {
  prayerTimes,
  dayTimes,
  qibla,
  hijri,
  hilalVisibility,
  nightThirds,
  travelerMode,
}

export {
  prayerTimes,
  dayTimes,
  qibla,
  hijri,
  hilalVisibility,
  nightThirds,
  travelerMode,
}
