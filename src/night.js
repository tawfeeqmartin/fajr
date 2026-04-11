/**
 * Night divisions calculation.
 *
 * Calculates the last third of the night (for Tahajjud/Qiyam al-Layl)
 * and the first third. Night is defined as Maghrib to Fajr.
 */

/**
 * Calculate the thirds of the night between Maghrib and Fajr.
 *
 * 🟢 Established: Division of night into thirds is documented in hadith
 * and classical fiqh for the timing of Tahajjud prayer.
 *
 * @param {object} params
 * @param {Date} params.maghrib  Maghrib time (start of night)
 * @param {Date} params.fajr     Fajr time of the next day (end of night)
 * @returns {object} { firstThird, secondThird, lastThird, midnight }
 */
export function nightThirds({ maghrib, fajr }) {
  const nightDuration = fajr.getTime() - maghrib.getTime()
  const third = nightDuration / 3

  return {
    firstThird:  new Date(maghrib.getTime() + third),
    secondThird: new Date(maghrib.getTime() + 2 * third),
    lastThird:   new Date(maghrib.getTime() + 2 * third),
    midnight:    new Date(maghrib.getTime() + nightDuration / 2),
  }
}
