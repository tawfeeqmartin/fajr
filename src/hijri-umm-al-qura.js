// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Hijri Umm al-Qura calendar — tabular lookup implementation.
 *
 * Converts Gregorian dates to the Hijri calendar using the official
 * Saudi Arabia Umm al-Qura calendar data embedded in a compact tabular
 * JSON file. Coverage: 1318–1500 AH / 1900-04-30 – 2077-11-16 Gregorian.
 *
 * Data source: umalqura/umalqura (MIT), cross-validated against the .NET BCL
 * Umm al-Qura calendar which is itself validated against ummulqura.org.sa.
 * AlAdhan, IslamicFinder, IACAD, and Microsoft Windows all use this same data.
 *
 * 🟡→🟢 Approaching established — Umm al-Qura is Saudi Arabia's official
 * calendar, used by AlAdhan, IslamicFinder, IACAD, Microsoft. Tabular lookup
 * (not arithmetic approximation) gives exact correspondence to the official
 * Saudi calendar.
 *
 * See knowledge/wiki/corrections/hijri-umm-al-qura.md
 */

// Imported as a JS module (not JSON) to avoid require()/createRequire,
// which fails in browsers loaded via esm.sh / unenv polyfill (see #55).
// The .js wrapper is auto-generated from src/data/umm-al-qura-tabular.json
// at maintainer-time; consumers always get a clean ESM import path.
import TABLE from './data/umm-al-qura-tabular.js'

const TABLE_MIN_STR = '1900-04-30'
const TABLE_MAX_STR = '2077-11-17'  // sentinel — first day NOT covered
const TABLE_MIN = new Date(TABLE_MIN_STR + 'T00:00:00Z')
const TABLE_MAX = new Date(TABLE_MAX_STR + 'T00:00:00Z')

// Pre-sort the Hijri year keys numerically (1318..1501) and cache their Dates.
// 1501 is the upper-bound sentinel — startGregorian['1501'] = '2077-11-17'
// but it has no monthLengths entry.
const SORTED_KEYS = Object.keys(TABLE.startGregorian).map(Number).sort((a, b) => a - b)
const SORTED_DATES = SORTED_KEYS.map(hy => new Date(TABLE.startGregorian[String(hy)] + 'T00:00:00Z'))

/**
 * Convert a Gregorian Date to Hijri using the Umm al-Qura tabular calendar.
 *
 * @param {Date} date  Input date. Only the UTC year/month/day are used.
 * @returns {{ year: number, month: number, day: number }}
 * @throws {RangeError} If the date is outside the table's coverage
 */
export function gregorianToHijriUAQ(date) {
  // Normalise to UTC midnight
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

  if (utc < TABLE_MIN || utc >= TABLE_MAX) {
    throw new RangeError(
      `Date ${utc.toISOString().slice(0, 10)} is outside ` +
      `Umm al-Qura coverage: 1900-04-30 to 2077-11-16 ` +
      `(1318–1500 AH). Use convention: 'tabular' for arithmetic fallback.`
    )
  }

  // Binary search for the largest Hijri year whose Gregorian start <= utc.
  let lo = 0
  let hi = SORTED_KEYS.length - 1  // includes the 1501 sentinel
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (SORTED_DATES[mid] <= utc) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  const hy = SORTED_KEYS[lo]
  const hyStart = SORTED_DATES[lo]

  // Days elapsed since the start of this Hijri year
  let nDays = Math.round((utc - hyStart) / 86400000)

  // Walk the month lengths to find month + day
  const lengths = TABLE.monthLengths[String(hy)]
  let month = 1
  for (let i = 0; i < lengths.length; i++) {
    if (nDays < lengths[i]) {
      month = i + 1
      break
    }
    nDays -= lengths[i]
  }

  return { year: hy, month, day: nDays + 1 }
}
