// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr — core calculation engine
 *
 * This file is the primary target of the autoresearch loop.
 * See CLAUDE.md for editing rules, ratchet conditions, and scholarly classification.
 *
 * Each correction block is tagged:
 *   🟢 Established  — consensus in Islamic astronomy, classical sources
 *   🟡 Limited precedent — regional use, some scholarly support
 *   🔴 Novel — no clear Islamic scholarly precedent, needs review
 */

import * as adhan from 'adhan'

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT 1: Regional method auto-selection
// 🟢 Established — selecting calculation methods by country/region
// Reference: [[wiki/methods/overview]]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect country from coordinates using bounding boxes.
 * Returns a country key or null if not matched.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {string|null}
 */
function detectCountry(lat, lon) {
  if (lat >= 27   && lat <= 36.5 && lon >= -14  && lon <= -1)   return 'Morocco'
  if (lat >= 16   && lat <= 33   && lon >= 34   && lon <= 56)   return 'SaudiArabia'
  if (lat >= 35   && lat <= 43   && lon >= 25   && lon <= 45)   return 'Turkey'
  if (lat >= 21   && lat <= 32   && lon >= 24   && lon <= 38)   return 'Egypt'
  if (lat >= 49   && lat <= 62   && lon >= -9   && lon <= 2.5)  return 'UK'
  if (lat >= 0.5  && lat <= 8    && lon >= 99   && lon <= 120)  return 'Malaysia'
  if (lat >= 24   && lat <= 50   && lon >= -125 && lon <= -66)  return 'USA'
  if (lat >= -24  && lat <= -9   && lon >= -70  && lon <= -57)  return 'Bolivia'
  if (lat >= -5   && lat <= 13   && lon >= -82  && lon <= -66)  return 'Colombia'
  if (lat >= -6   && lat <= 2    && lon >= -82  && lon <= -74)  return 'Ecuador'
  if (lat >= 56   && lat <= 72   && lon >= 4    && lon <= 32)   return 'Norway'
  if (lat >= 62   && lat <= 68   && lon >= -26  && lon <= -12)  return 'Iceland'
  if (lat >= 59   && lat <= 71   && lon >= 19   && lon <= 32)   return 'Finland'
  return null
}

/**
 * Select calculation method and method name for a country/location.
 *
 * 🟢 Established: Method selection by region is the standard practice.
 * See [[wiki/methods/overview]] for the full reference table.
 *
 * @param {string|null} country
 * @param {number} lat
 * @param {adhan.Coordinates} coords
 * @returns {{ params: object, methodName: string }}
 */
function selectMethod(country, lat, coords) {
  switch (country) {
    case 'Morocco': {
      // Ministry of Habous: Fajr 18°, Isha 17°, Standard Asr
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 18
      p.ishaAngle = 17
      return { params: p, methodName: 'Morocco (18°/17°)' }
    }
    case 'SaudiArabia':
      // Umm al-Qura University: Fajr 18.5°, Isha +90 min
      return { params: adhan.CalculationMethod.UmmAlQura(), methodName: 'Umm al-Qura' }
    case 'Turkey':
      // Diyanet İşleri Başkanlığı: Fajr 18°, Isha 17° + minute adjustments
      return { params: adhan.CalculationMethod.Turkey(), methodName: 'Diyanet (Turkey)' }
    case 'Egypt':
      // Egyptian General Authority of Survey: Fajr 19.5°, Isha 17.5°
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (19.5°/17.5°)' }
    case 'UK':
      // Muslim World League: Fajr 18°, Isha 17°
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (UK)' }
    case 'Malaysia': {
      // JAKIM: Fajr 20°, Isha 18° — equatorial standard; use Singapore (same angles)
      return { params: adhan.CalculationMethod.Singapore(), methodName: 'JAKIM/Singapore (20°/18°)' }
    }
    case 'USA':
      // ISNA: Fajr 15°, Isha 15°
      return { params: adhan.CalculationMethod.NorthAmerica(), methodName: 'ISNA (NorthAmerica)' }
    case 'Bolivia':
    case 'Colombia':
    case 'Ecuador':
      // South America: Muslim World League is the reference method
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (South America)' }
    case 'Norway':
    case 'Iceland':
    case 'Finland': {
      // High-latitude: MWL + recommended high-latitude rule
      const p = adhan.CalculationMethod.MuslimWorldLeague()
      p.highLatitudeRule = adhan.HighLatitudeRule.recommended(coords)
      return { params: p, methodName: 'MWL + HighLatRule (high latitude)' }
    }
    default: {
      // Fallback: high-latitude auto-detect (lat > 55°)
      if (lat > 55) {
        const p = adhan.CalculationMethod.MuslimWorldLeague()
        p.highLatitudeRule = adhan.HighLatitudeRule.recommended(coords)
        return { params: p, methodName: 'MWL + HighLatRule (fallback)' }
      }
      return { params: adhan.CalculationMethod.NorthAmerica(), methodName: 'ISNA (default)' }
    }
  }
}

/**
 * Calculate prayer times for a given location and date.
 *
 * @param {object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {Date}   params.date
 * @param {number} [params.elevation=0]  Elevation in meters above sea level
 * @param {string} [params.method]       Override auto-detected method
 * @returns {object} Prayer times with metadata
 */
export function prayerTimes({ latitude, longitude, date, elevation = 0, method }) {
  const coords = new adhan.Coordinates(latitude, longitude)

  // 🟢 Established: Region-aware method selection
  const country = detectCountry(latitude, longitude)
  const { params, methodName } = selectMethod(country, latitude, coords)

  // adhan v4+ takes a plain Date directly (DateComponents was removed)
  const times = new adhan.PrayerTimes(coords, date, params)

  return {
    fajr:    times.fajr,
    shuruq:  times.sunrise,
    dhuhr:   times.dhuhr,
    asr:     times.asr,
    maghrib: times.maghrib,
    isha:    times.isha,
    method:  methodName,
    corrections: {
      elevation: false,
      refraction: 'standard (0.833°)',
    },
  }
}

/**
 * Apply elevation-based horizon correction to a set of prayer times.
 *
 * 🔴 Novel: The specific formula below is derived from geometric horizon
 * depression and has not been reviewed by Islamic scholars. Do not rely on
 * this for prayer without scholarly validation.
 *
 * @param {object} times  Output from prayerTimes()
 * @param {number} elevation  Meters above sea level
 * @returns {object} Corrected times
 */
export function applyElevationCorrection(times, elevation) {
  if (!elevation || elevation <= 0) return times

  // Geometric horizon dip in degrees
  // 🔴 Novel — see CLAUDE.md on novel corrections
  const EARTH_RADIUS_M = 6371000
  const horizonDipDeg = Math.sqrt(2 * elevation / EARTH_RADIUS_M) * (180 / Math.PI)

  // Convert degrees to minutes of time (solar motion ~1° per 4 min)
  const correctionMin = horizonDipDeg * 4

  const adjusted = { ...times }
  // Shuruq (sunrise) is earlier at elevation — horizon is lower
  adjusted.shuruq = new Date(times.shuruq.getTime() - correctionMin * 60 * 1000)
  // Maghrib (sunset) is later at elevation
  adjusted.maghrib = new Date(times.maghrib.getTime() + correctionMin * 60 * 1000)
  adjusted.corrections = { ...times.corrections, elevation: true }

  return adjusted
}
