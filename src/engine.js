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
// BASELINE ENGINE (autoresearch starting point)
// Uses ISNA method as the universal baseline.
// The autoresearch loop will replace this with region-aware method selection
// and layered corrections as WMAE evidence accumulates.
// ─────────────────────────────────────────────────────────────────────────────

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

  // 🟢 Established: Method selection — baseline is ISNA
  // TODO (autoresearch): replace with region-aware method selection
  // See knowledge/wiki/methods/ for per-region angle tables
  const params = adhan.CalculationMethod.NorthAmerica()

  // adhan v4+ takes a plain Date directly (DateComponents was removed)
  const times = new adhan.PrayerTimes(coords, date, params)

  return {
    fajr:    times.fajr,
    shuruq:  times.sunrise,
    dhuhr:   times.dhuhr,
    asr:     times.asr,
    maghrib: times.maghrib,
    isha:    times.isha,
    method:  'ISNA (baseline)',
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
