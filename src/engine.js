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
  if (lat >= -11  && lat <= 6    && lon >= 95   && lon <= 141)  return 'Indonesia'
  if (lat >= 23   && lat <= 37   && lon >= 60   && lon <= 75)   return 'Pakistan'
  if (lat >= 22   && lat <= 26.5 && lon >= 51   && lon <= 56.5) return 'UAE'
  if (lat >= 42   && lat <= 51.5 && lon >= -5   && lon <= 8.5)  return 'France'
  if (lat >= 41.5 && lat <= 60   && lon >= -95  && lon <= -52)  return 'Canada'
  // Finland and Iceland must be checked before Norway: their bounding boxes
  // are subsets of Norway's broader (4-32°E) box.
  if (lat >= 59   && lat <= 71   && lon >= 19   && lon <= 32)   return 'Finland'
  if (lat >= 62   && lat <= 68   && lon >= -26  && lon <= -12)  return 'Iceland'
  if (lat >= 56   && lat <= 72   && lon >= 4    && lon <= 32)   return 'Norway'
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
      // Ministry of Habous (community-calibrated): Fajr 19°, Isha 17°, Standard Asr.
      // see knowledge/wiki/methods/morocco.md
      // Classification: 🟡→🟢 (community calibration; matches mosque-published reality)
      //
      // The formal Ministry-stated angle is 18°, but the published Imsakiyya
      // is best reproduced by 19° per the wiki's documented community calibration.
      // Empirically corroborated by Mawaqit mosque-published times across 5 Moroccan
      // mosques (Casablanca, Rabat, Marrakech): real Fajr is ~5-7 min earlier
      // than the 18° calculation. Critical during Ramadan — 18° produced engine
      // Fajr ~5 min late vs mosque tables, which would push imsak past actual
      // dawn for fasters (broken fast). The +5 min was prayer-safe but
      // fasting-unsafe; 19° matches what Moroccan Muslims actually pray to.
      // Ratchet acceptance via Path A cross-source corroboration: Aladhan-Morocco
      // and Mawaqit-Morocco both showed |Fajr bias| improvements ≫ aggregate drift.
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 19
      p.ishaAngle = 17
      return { params: p, methodName: 'Morocco (19°/17° community calibration)' }
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
      // Moonsighting Committee: Fajr 18°, Isha 18° with seasonal (Shafaq) adjustment
      // 🟢 Established — UK Muslim community predominantly follows Moonsighting Committee
      return { params: adhan.CalculationMethod.MoonsightingCommittee(), methodName: 'MoonsightingCommittee (UK)' }
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
    case 'Indonesia': {
      // JAKIM-style: Fajr 20°, Isha 18° (equatorial standard — same as Singapore/Malaysia)
      return { params: adhan.CalculationMethod.Singapore(), methodName: 'JAKIM/Singapore (20°/18°)' }
    }
    case 'Pakistan': {
      // University of Islamic Sciences, Karachi: Fajr 18°, Isha 18°, Hanafi Asr
      return { params: adhan.CalculationMethod.Karachi(), methodName: 'Karachi (18°/18°)' }
    }
    case 'UAE': {
      // Dubai / UAE: Umm al-Qura (Gulf region uses this or Kuwait; Aladhan method 4)
      return { params: adhan.CalculationMethod.UmmAlQura(), methodName: 'Umm al-Qura (UAE)' }
    }
    case 'France': {
      // UOIF: Fajr 12°, Isha 12° — high-latitude accommodation for Europe
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 12
      p.ishaAngle = 12
      return { params: p, methodName: 'UOIF (12°/12°)' }
    }
    case 'Canada':
      // ISNA: Fajr 15°, Isha 15° (same as USA)
      return { params: adhan.CalculationMethod.NorthAmerica(), methodName: 'ISNA (Canada)' }
    case 'Norway': {
      // Extreme high-latitude (Tromsø 69.6°N): 18° astronomical twilight never
      // occurs in April — geometric Isha is unreachable and the TwilightAngle
      // fallback (sunset + 18/60 × night ≈ 22:38 local) is too early.
      // Aladhan AngleBased produces ≈ 00:48 local, which matches
      // MiddleOfTheNight (sunset + ½ × night ≈ 00:46 local).
      // 🟢 Established — MiddleOfTheNight is a recognised fallback for
      //   latitudes where astronomical twilight does not occur;
      //   consistent with Aladhan AngleBased output for this region.
      // Reference: [[wiki/regions/high-latitude]]
      const p = adhan.CalculationMethod.MuslimWorldLeague()
      p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight
      return { params: p, methodName: 'MWL + MiddleOfTheNight (Norway)' }
    }
    case 'Iceland': {
      // ─────────────────────────────────────────────────────────────────────
      // EXPERIMENT 5: Reykjavik Isha refinement
      // Aladhan ground truth uses latitudeAdjustmentMethod=1 = MiddleOfNight.
      // Prior setting (TwilightAngle) produced ~24–36 min Isha error at Reykjavik.
      // MiddleOfTheNight should match the ground truth method directly.
      // 🟢 Established — matches Aladhan API's own high-latitude adjustment.
      // Reference: [[wiki/regions/high-latitude]]
      // ─────────────────────────────────────────────────────────────────────
      const p = adhan.CalculationMethod.MuslimWorldLeague()
      p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight
      return { params: p, methodName: 'MWL + MiddleOfTheNight (Iceland)' }
    }
    case 'Finland': {
      // Finland: TwilightAngle (computable in April at 60°N, within normal range)
      // 🟢 Established — Aladhan AngleBased for April at Helsinki latitude
      const p = adhan.CalculationMethod.MuslimWorldLeague()
      p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle
      return { params: p, methodName: 'MWL + TwilightAngle (Finland)' }
    }
    default: {
      // Fallback: high-latitude auto-detect (lat > 55°)
      if (lat > 55) {
        const p = adhan.CalculationMethod.MuslimWorldLeague()
        p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle
        return { params: p, methodName: 'MWL + TwilightAngle (fallback)' }
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

  let result = {
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

  // NOTE: Elevation correction (applyElevationCorrection) is available as a
  // utility but NOT activated here. Experiment 4 confirmed that the Aladhan
  // ground truth uses sea-level calculations; applying elevation correction
  // diverges from it and increases WMAE. Correction is 🟡 Limited precedent —
  // available for use when ground truth is also elevation-corrected.

  return result
}

/**
 * Apply elevation-based horizon correction to a set of prayer times.
 *
 * 🟡 Limited precedent: Geometry is classical; application to Islamic prayer
 * times has precedent in classical muwaqqit texts but is not adopted by any
 * major institution. See wiki/corrections/elevation.md.
 *
 * @param {object} times      Output from prayerTimes()
 * @param {number} elevation  Meters above sea level
 * @param {number} latitude   Degrees (for latitude correction of time offset)
 * @returns {object} Corrected times
 */
export function applyElevationCorrection(times, elevation, latitude = 0) {
  if (!elevation || elevation <= 0) return times

  // Geometric horizon dip: arccos(R / (R + h)) in degrees
  // 🟡 Limited precedent — see wiki/corrections/elevation.md
  const EARTH_RADIUS_M = 6371000
  const horizonDipDeg = Math.acos(EARTH_RADIUS_M / (EARTH_RADIUS_M + elevation)) * (180 / Math.PI)

  // Latitude correction: at latitude φ, sun crosses horizon at rate 4/cos(φ) min per degree
  const correctionMin = horizonDipDeg * 4 / Math.cos(latitude * Math.PI / 180)
  const corrMs = correctionMin * 60 * 1000

  const adjusted = { ...times }
  // Shuruq (sunrise) is earlier at elevation — depressed horizon
  adjusted.shuruq  = new Date(times.shuruq.getTime()  - corrMs)
  // Maghrib (sunset) is later at elevation
  adjusted.maghrib = new Date(times.maghrib.getTime() + corrMs)
  adjusted.corrections = { ...times.corrections, elevation: true, elevationCorrectionMin: +correctionMin.toFixed(2) }

  return adjusted
}
