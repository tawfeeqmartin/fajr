// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr — public API
 *
 * This is the stable public interface. Do not modify without human review.
 * Internal implementation lives in engine.js and the other src/ modules.
 */

import {
  prayerTimes as _prayerTimes,
  applyElevationCorrection,
  applyTayakkunBuffer,
  detectLocation as _detectLocation,
} from './engine.js'
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
    // Pass latitude so the time-correction scales by 4 / cos(φ). Without it
    // the correction defaults to cos(0°) = 1 — underapplying the geometric
    // shift at non-equatorial latitudes (15% under at lat 33°, 50% under
    // at lat 60°). Bug fix v1.5.2.
    times = applyElevationCorrection(times, params.elevation, params.latitude)
  }
  return times
}

/**
 * Single-call convenience returning the 6 prayers + sunrise + sunset +
 * midnight + qiyam in one object. Composes prayerTimes() (which applies
 * elevation correction when params.elevation > 0) for today and tomorrow's
 * fajr, then derives the night-third boundaries from the corrected times.
 */
function dayTimes(params) {
  const today = prayerTimes(params)
  const tomorrow = prayerTimes({
    ...params,
    date: new Date(params.date.getTime() + 24 * 60 * 60 * 1000),
  })
  const nightDuration = tomorrow.fajr.getTime() - today.maghrib.getTime()
  const midnight = new Date(today.maghrib.getTime() + nightDuration / 2)
  const qiyam    = new Date(today.maghrib.getTime() + (2 * nightDuration) / 3)
  return { ...today, midnight, qiyam }
}

/**
 * Compute prayer times using Tarabishy's (2014) latitude-truncation method.
 *
 * 🟡 Limited precedent: Tarabishy 2014 argues that 45° is the highest
 * latitude with "normal" days year-round (using physiological day-length
 * as the criterion). Above 45°, his method computes prayer times for the
 * truncated latitude (45° preserving sign) at the actual longitude, on the
 * grounds that those times match physiological day-length expectations
 * better than direct calculation at the high latitude.
 *
 * This is an opt-in alternative to fajr's default high-latitude rule
 * (MiddleOfTheNight per Odeh 2009). It is NOT a default — Odeh 2009 surveys
 * 12 high-latitude proposals including Tarabishy-style truncation and
 * recommends middle-of-night instead. The Tarabishy approach is included
 * here because it is the principal published dissent and downstream apps
 * may want to expose it as a user-selectable alternative.
 *
 * Below the threshold, behaviour is identical to `prayerTimes()`.
 *
 * @param {object} params           Same as prayerTimes
 * @param {number} [thresholdLat=45] Truncate latitude above this; preserves sign
 * @returns {object} prayerTimes-shape result with method and notes annotated
 */
function tarabishyTimes(params, thresholdLat = 45) {
  if (Math.abs(params.latitude) <= thresholdLat) {
    return prayerTimes(params)
  }
  const truncatedLat = thresholdLat * Math.sign(params.latitude)
  const result = prayerTimes({ ...params, latitude: truncatedLat })
  result.method = `Tarabishy (truncated to ${thresholdLat}° from ${params.latitude.toFixed(2)}°)`
  result.notes = [...result.notes,
    `Times computed at ${thresholdLat}° latitude per Tarabishy (2014); your ` +
    `actual latitude is ${params.latitude.toFixed(2)}°. Tarabishy argues 45° is the ` +
    `highest "normal" latitude where calculated times match physiological ` +
    `day-length expectations. This is the published dissent from the ` +
    `Odeh-2009-endorsed middle-of-night rule.`,
  ]
  return result
}

/**
 * Resolve a coordinate to its city, country, timezone, recommended method,
 * and institutional source.
 *
 * Pure / referentially transparent for a given (lat, lon, fallbackElevation):
 * no astronomical computation, no I/O, no caching. Apps can call this
 * independently of `prayerTimes` to display "you are in <city>" without
 * computing prayer times. The same resolution is also performed silently
 * inside `prayerTimes` and surfaced via the `location` field on its return
 * value, so most callers will never need to invoke this directly.
 *
 * Returns `city: null` honestly when no city in the bundled registry matches —
 * never a wrong-city default. The country fallback (via the existing
 * `detectCountry` bbox table) still populates `country` and
 * `recommendedMethod`. When neither matches (open ocean, Antarctica), all of
 * city/country/recommendedMethod fall through to safe defaults
 * (`null`/`null`/`'ISNA'`) so apps can display a graceful "location unknown"
 * state.
 *
 * Privacy: the (lat, lon) you pass is not logged, persisted, or transmitted
 * anywhere. The city resolution happens entirely locally via the bundled
 * `src/data/cities.json` registry.
 *
 * Classification: 🟢 Established — pure lookup, no shar'i ruling involved.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} [fallbackElevation=0]  Used when the matched city has no
 *                                         elevation field, AND when no city
 *                                         matches. In meters.
 * @returns {object}  Location record. See TypeScript types in src/index.d.ts.
 */
function detectLocation(latitude, longitude, fallbackElevation = 0) {
  return _detectLocation(latitude, longitude, fallbackElevation)
}

export default {
  prayerTimes,
  dayTimes,
  tarabishyTimes,
  detectLocation,
  applyElevationCorrection,
  applyTayakkunBuffer,
  qibla,
  hijri,
  hilalVisibility,
  nightThirds,
  travelerMode,
}

export {
  prayerTimes,
  dayTimes,
  tarabishyTimes,
  detectLocation,
  applyElevationCorrection,
  applyTayakkunBuffer,
  qibla,
  hijri,
  hilalVisibility,
  nightThirds,
  travelerMode,
}
