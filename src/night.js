// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Night divisions calculation.
 *
 * Calculates the last third of the night (for Tahajjud/Qiyam al-Layl)
 * and the first third. Night is defined as Maghrib to Fajr-of-next-day.
 */

import { prayerTimes } from './engine.js'

/**
 * Calculate the thirds of the night.
 *
 * 🟢 Established: Division of night into thirds is documented in hadith
 * and classical fiqh for the timing of Tahajjud prayer.
 *
 * Two call shapes:
 *
 *   nightThirds({ date, latitude, longitude })
 *     → computes maghrib (today) and fajr (tomorrow) internally via prayerTimes
 *
 *   nightThirds({ maghrib, fajr })
 *     → advanced: caller already has the two boundary times
 *
 * @param {object} params
 * @param {Date}    [params.date]
 * @param {number}  [params.latitude]
 * @param {number}  [params.longitude]
 * @param {Date}    [params.maghrib]   Override: maghrib time (start of night)
 * @param {Date}    [params.fajr]      Override: fajr time of next day (end of night)
 * @returns {object} { firstThird, secondThird, lastThird, midnight }
 */
export function nightThirds({ date, latitude, longitude, maghrib, fajr }) {
  if (!maghrib || !fajr) {
    if (!date || latitude === undefined || longitude === undefined) {
      throw new Error("nightThirds requires either { maghrib, fajr } or { date, latitude, longitude }")
    }
    const today = prayerTimes({ latitude, longitude, date })
    const tomorrow = prayerTimes({
      latitude,
      longitude,
      date: new Date(date.getTime() + 24 * 60 * 60 * 1000),
    })
    maghrib = today.maghrib
    fajr    = tomorrow.fajr
  }

  const nightDuration = fajr.getTime() - maghrib.getTime()
  const third = nightDuration / 3

  return {
    firstThird:  new Date(maghrib.getTime() + third),         // start of second third
    secondThird: new Date(maghrib.getTime() + 2 * third),     // start of last third
    lastThird:   new Date(maghrib.getTime() + 2 * third),     // alias — start of last third
    midnight:    new Date(maghrib.getTime() + nightDuration / 2),
  }
}
