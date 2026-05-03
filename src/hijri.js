// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Hijri (Islamic lunar) calendar conversion.
 *
 * Default convention: 'umm-al-qura' — Saudi Arabia's official calendar,
 * used by AlAdhan, IslamicFinder, IACAD, and Microsoft Windows.
 *
 * Legacy convention: 'tabular' — Kuwaiti arithmetic calendar (v1.7.5 and
 * earlier default). Preserved for backwards-compat via { convention: 'tabular' }.
 *
 * 🟡→🟢 Approaching established — Umm al-Qura is Saudi Arabia's official
 * calendar, used by AlAdhan, IslamicFinder, IACAD, Microsoft. Kuwaiti
 * tabular preserved via { convention: "tabular" }.
 *
 * See knowledge/wiki/corrections/hijri-umm-al-qura.md
 */

import { gregorianToHijriUAQ } from './hijri-umm-al-qura.js'

const MONTH_NAMES = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
]

/**
 * Convert a Gregorian date to Hijri.
 *
 * 🟡→🟢 Approaching established — Umm al-Qura is Saudi Arabia's official
 * calendar, used by AlAdhan, IslamicFinder, IACAD, Microsoft. Kuwaiti
 * tabular preserved via { convention: "tabular" }.
 *
 * @param {Date}   date
 * @param {object} [opts={}]
 * @param {string} [opts.convention='umm-al-qura']  'umm-al-qura' | 'tabular' | 'observational'
 * @returns {{ year: number, month: number, day: number, monthName: string }}
 */
export function hijri(date, opts = {}) {
  const convention = opts.convention ?? 'umm-al-qura'

  if (convention === 'observational') {
    throw new Error(
      'NotImplementedError: convention "observational" is not yet implemented. ' +
      'For lunar crescent sighting, see fajr.hilalVisibility(). ' +
      'A full observational Hijri calendar is planned for v1.9.x.'
    )
  }

  if (convention === 'tabular') {
    return _hijriTabular(date)
  }

  // Default: 'umm-al-qura'
  const { year, month, day } = gregorianToHijriUAQ(date)
  return {
    year,
    month,
    day,
    monthName: MONTH_NAMES[month - 1],
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Kuwaiti arithmetic Hijri calendar (v1.7.5-and-earlier default).
 * Preserved for backwards-compat via { convention: 'tabular' }.
 *
 * 🟢 Established: Tabular Hijri calendar conversion is a standard method
 * used by Islamic institutions worldwide.
 *
 * @param {Date} date
 * @returns {{ year: number, month: number, day: number, monthName: string }}
 */
function _hijriTabular(date) {
  const jd = _gregorianToJD(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
  const { year, month, day } = _jdToHijri(jd)
  return {
    year,
    month,
    day,
    monthName: MONTH_NAMES[month - 1],
  }
}

function _gregorianToJD(year, month, day) {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
}

function _jdToHijri(jd) {
  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29
  const month = Math.floor((24 * l3) / 709)
  const day = l3 - Math.floor((709 * month) / 24)
  const year = 30 * n + j - 30

  return { year, month, day }
}
