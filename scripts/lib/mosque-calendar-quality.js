// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

/**
 * Quality heuristics for Mawaqit embedded yearly calendars.
 *
 * Some Mawaqit mosque pages publish a calendar that is structurally
 * implausible — a static fixed time on every day of the year, or
 * Fajr / Sunrise / Isha gaps that don't correspond to any astronomical
 * twilight definition. These tend to be mosques whose admins typed in
 * a single Iqama target time once and never recalibrated, rather than
 * a calculated adhan-time calendar. The fajr eval otherwise treats them
 * as institutional ground truth on equal footing with normal calendars,
 * which inflates per-fixture WMAE by 10-30 min purely as a corpus-quality
 * artifact.
 *
 * This module is **opt-in** — the existing `eval/data/test/mawaqit-*-yearly.json`
 * fixtures are not modified. Future fetcher runs can pass
 * `--filter-degenerate` to skip mosques that fail these heuristics.
 *
 * Empirical calibration (2026-05-15 scan of 125 mosques across 21 yearly
 * fixtures): the thresholds below flag 6 mosques as degenerate, all of
 * which independently looked degenerate on visual inspection (identical
 * Fajr times for 366 days, identical Isha 20:15 every day, etc.). The
 * full audit is recorded in the `[corpus-quality] Mawaqit yearly` issue
 * filed alongside this code.
 *
 * Refs: fajr#99 (Mawaqit yearly seasonal coverage), CALIBRATION.md
 * "Side-finding: 1.4% of Morocco Mawaqit yearly rows structurally
 * implausible".
 */

const PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

const DEFAULT_THRESHOLDS = Object.freeze({
  fajrVarianceMin: 5,
  sunriseVarianceMin: 5,
  ishaVarianceMin: 5,
  maghribVarianceMin: 10,
  fajrSunriseGapMin: 45,
  fajrSunriseGapMax: 180,
  maghribIshaGapMax: 150,
})

/**
 * Compute per-prayer variance + mean inter-prayer gaps for a mosque's
 * yearly calendar. Returns null if there isn't enough data.
 *
 * @param {Array<{date:string, fajr:string, sunrise:string, ..., isha:string}>} dates
 */
export function summarizeCalendar(dates) {
  if (!Array.isArray(dates) || dates.length < 30) return null

  const minutes = {}
  for (const p of PRAYER_KEYS) minutes[p] = []
  for (const d of dates) {
    for (const p of PRAYER_KEYS) {
      const v = parseHM(d[p])
      if (v !== null) minutes[p].push(v)
    }
  }
  if (minutes.fajr.length < 30) return null

  const variance = {}
  for (const p of PRAYER_KEYS) {
    variance[p] = minutes[p].length > 0
      ? Math.max(...minutes[p]) - Math.min(...minutes[p])
      : null
  }

  let fsSum = 0, fsN = 0
  let miSum = 0, miN = 0
  for (const d of dates) {
    const f = parseHM(d.fajr), s = parseHM(d.sunrise)
    const m = parseHM(d.maghrib), i = parseHM(d.isha)
    if (f !== null && s !== null) { fsSum += s - f; fsN++ }
    if (m !== null && i !== null) { miSum += i - m; miN++ }
  }

  return {
    rowCount: dates.length,
    variance,
    meanFajrSunriseGap: fsN ? fsSum / fsN : null,
    meanMaghribIshaGap: miN ? miSum / miN : null,
  }
}

/**
 * Run the degeneracy heuristics against a calendar summary. Returns the
 * list of issue codes; an empty array means the calendar looks fine.
 *
 * Issue codes:
 *   STATIC_FAJR / STATIC_SUNRISE / STATIC_ISHA / STATIC_MAGHRIB
 *     The prayer's time barely varies over the year, indicating a
 *     manually-set fixed time rather than a computed adhan calendar.
 *   SHORT_FAJR_GAP
 *     Mean Fajr-Sunrise gap is too short to be astronomically plausible
 *     (Fajr time is closer to sunrise than any 12-18° twilight angle).
 *   LONG_FAJR_GAP
 *     Mean Fajr-Sunrise gap is implausibly long (Fajr set ~3+ hours
 *     before sunrise on average).
 *   LONG_ISHA_GAP
 *     Mean Maghrib-Isha gap is implausibly long (most likely a mosque
 *     using a fixed-late Isha time independent of twilight).
 */
export function detectIssues(summary, overrides = {}) {
  if (!summary) return []
  const t = { ...DEFAULT_THRESHOLDS, ...overrides }
  const issues = []

  if (summary.variance.fajr !== null && summary.variance.fajr < t.fajrVarianceMin) {
    issues.push('STATIC_FAJR')
  }
  if (summary.variance.sunrise !== null && summary.variance.sunrise < t.sunriseVarianceMin) {
    issues.push('STATIC_SUNRISE')
  }
  if (summary.variance.isha !== null && summary.variance.isha < t.ishaVarianceMin) {
    issues.push('STATIC_ISHA')
  }
  if (summary.variance.maghrib !== null && summary.variance.maghrib < t.maghribVarianceMin) {
    issues.push('STATIC_MAGHRIB')
  }
  if (summary.meanFajrSunriseGap !== null) {
    if (summary.meanFajrSunriseGap < t.fajrSunriseGapMin) issues.push('SHORT_FAJR_GAP')
    else if (summary.meanFajrSunriseGap > t.fajrSunriseGapMax) issues.push('LONG_FAJR_GAP')
  }
  if (summary.meanMaghribIshaGap !== null && summary.meanMaghribIshaGap > t.maghribIshaGapMax) {
    issues.push('LONG_ISHA_GAP')
  }
  return issues
}

/**
 * Convenience: returns true if the calendar should be rejected by an
 * opt-in `--filter-degenerate` fetcher pass.
 */
export function isCalendarDegenerate(dates, overrides = {}) {
  const summary = summarizeCalendar(dates)
  return detectIssues(summary, overrides).length > 0
}

/**
 * Convenience: returns the full assessment (summary + issues).
 */
export function assessCalendarQuality(dates, overrides = {}) {
  const summary = summarizeCalendar(dates)
  const issues = detectIssues(summary, overrides)
  return { summary, issues, degenerate: issues.length > 0 }
}

function parseHM(hm) {
  if (typeof hm !== 'string') return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm)
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}
