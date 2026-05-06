// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr — Layer 4 validity warnings (v1.8.0)
 *
 * Per fajr#101 (5-layer canonical architecture, agot-claude) and the design
 * spec at autoresearch/proposals/2026-05-05-layer-4-validity-warnings-design.md.
 *
 * Pure, read-only checker. Receives the raw (pre-rounding) adhan.PrayerTimes
 * object and the rounded result, returns an array of ValidityWarning objects
 * that flag fiqh-validity violations and high-latitude advisories.
 *
 * Motivated by fajr#100: the row-3-vs-row-17 misread would have been caught
 * automatically if MAGHRIB_BEFORE_SUNSET had been firing on the day's data.
 *
 * v1.8.0 ships P0 + P1 critical / info checks; v1.8.1+ adds the advisory tier
 * once we have field reports on false-positive rate (per agot's call in
 * agiftoftime#30).
 *
 * Classification: 🟢 Established — the checked conditions (Maghrib after
 * sunset, Fajr before Shuruq, Asr between Dhuhr and Maghrib, Dhuhr at or
 * after solar noon) are the *shar'i definitions* of prayer time windows,
 * not interpretations. See Ibn Qudama al-Mughni; Hadith of Jibril (Abu
 * Dawud, Tirmidhi, Nasa'i); classical fiqh treatises.
 */

import * as adhan from 'adhan'
import { hijri } from './hijri.js'

const MS_PER_MIN = 60_000

/**
 * Morocco's Ramadan DST exception: Morocco observes year-round GMT+1 except
 * during Ramadan, when it switches to GMT+0. Modern Node (≥18) and v8 model
 * this correctly via the IANA tz database, but consumers on older Node, on
 * stale tzdata, or applying custom date arithmetic may miss the offset.
 * Layer 4 emits MOROCCO_RAMADAN_DST_GAP as info when both conditions hold:
 * (a) coordinates land in the Morocco bbox, (b) the date is in Ramadan.
 *
 * Bbox source: same conservative bounds as detectCountry's Morocco case.
 * Hijri detection: src/hijri.js (Umm al-Qura by default — close enough to
 * Morocco's Habous Hijri for boundary detection; Habous occasionally lags by
 * 1 day, which doesn't affect this warning meaningfully).
 */
const MOROCCO_BBOX = { latMin: 21, latMax: 36, lonMin: -17, lonMax: -1 }
function isInMoroccoBbox(lat, lon) {
  return lat >= MOROCCO_BBOX.latMin && lat <= MOROCCO_BBOX.latMax
      && lon >= MOROCCO_BBOX.lonMin && lon <= MOROCCO_BBOX.lonMax
}
function isInRamadan(date) {
  try { return hijri(date).month === 9 } catch { return false }
}

/**
 * @typedef {Object} ValidityWarning
 * @property {'critical'|'advisory'|'info'} severity
 * @property {'fajr'|'shuruq'|'dhuhr'|'asr'|'maghrib'|'isha'|null} prayer
 * @property {string} code
 * @property {string} message
 * @property {string|null} astronomicalReference  ISO8601 UTC or null
 * @property {string|null} applied  ISO8601 UTC or null
 * @property {number|null} diffMinutes  applied − reference, signed (negative = earlier)
 * @property {string} [fix]
 */

// NOTE: fajrAtAngle / ishaAtAngle helpers were removed alongside the
// FAJR_BEFORE_DAWN_12DEG / ISHA_BEFORE_TWILIGHT_12DEG checks (polarity bug
// in design doc; deferred to v1.8.1). Keeping the deletion explicit here so
// the next agent who picks up the v1.8.1 polarity fix knows where the
// reference-angle helpers used to live and re-introduces them per CLAUDE.md
// Layer 1 lint (angles only in src/engine.js or src/methods.js).

function isInvalidDate(d) {
  return !d || (d instanceof Date && Number.isNaN(d.getTime()))
}

function diffMin(applied, reference) {
  return Math.round(((applied.getTime() - reference.getTime()) / MS_PER_MIN) * 100) / 100
}

function fmtTime(d) {
  return d.toISOString().slice(11, 16)  // HH:MM
}

/**
 * @param {object} args
 * @param {adhan.PrayerTimes} args.rawTimes  pre-rounding adhan times
 * @param {object} args.result  the assembled result with rounded Date instances
 * @param {object} args.params  the adhan params object (has highLatitudeRule if applied)
 * @param {adhan.Coordinates} args.coords
 * @param {Date} args.date
 * @returns {ValidityWarning[]}
 */
export function computeValidityWarnings({ rawTimes, result, params, coords, date }) {
  const warnings = []

  const highLatRuleApplied = !!(params && params.highLatitudeRule != null && params.highLatitudeRule !== adhan.HighLatitudeRule.MiddleOfTheNight)
  // MiddleOfTheNight is the adhan default — the explicit check is for non-default rules.
  // But for our purposes, ANY non-trivial highLat rule presence indicates synthesis.
  const anyHighLatRule = !!(params && params.highLatitudeRule != null)

  // ── Polar: degenerate cases where adhan returns Invalid Date for sunset/sunrise
  if (isInvalidDate(rawTimes.sunset) || isInvalidDate(rawTimes.sunrise)) {
    warnings.push({
      severity: 'critical',
      prayer: isInvalidDate(rawTimes.sunset) ? 'maghrib' : 'shuruq',
      code: isInvalidDate(rawTimes.sunset) ? 'POLAR_NO_SUNSET' : 'POLAR_NO_SUNRISE',
      message: isInvalidDate(rawTimes.sunset)
        ? 'The sun does not set below the horizon on this date at this latitude (continuous polar day or astronomical-event boundary). The returned Maghrib time has no astronomical basis. Consider showing a "prayer times unavailable" state in your UI for this date.'
        : 'The sun does not rise above the horizon on this date at this latitude (continuous polar night or astronomical-event boundary). The returned Shuruq time has no astronomical basis. Consider showing a "prayer times unavailable" state in your UI for this date.',
      astronomicalReference: null,
      applied: null,
      diffMinutes: null,
    })
    // Skip downstream Maghrib/Shuruq comparisons — they would compare against Invalid Date
    return warnings
  }

  // ── Fajr: did the high-latitude rule fire?
  // The signal: rawTimes.fajr exists but the parameter set has a highLatitudeRule.
  // We can't distinguish "rule applied" from "rule available but not needed" without
  // re-running adhan with no highLat rule. Pragmatic: if any high-lat rule is
  // configured AND the latitude is sub-polar high (|lat| > 48°), assume it may have
  // fired. Emit info for transparency.
  const lat = coords.latitude != null ? coords.latitude : (coords.latitude_ ?? 0)
  const absLat = Math.abs(lat)
  if (anyHighLatRule && absLat > 48) {
    warnings.push({
      severity: 'info',
      prayer: 'fajr',
      code: 'FAJR_HIGH_LAT_RULE_APPLIED',
      message: `Latitude ${lat.toFixed(2)}° with method-configured high-latitude rule. Fajr may be derived from a night-fraction rule (MiddleOfTheNight, SeventhOfTheNight, or TwilightAngle) rather than from a strict astronomical depression angle.`,
      astronomicalReference: null,
      applied: result.fajr ? result.fajr.toISOString() : null,
      diffMinutes: null,
    })
    warnings.push({
      severity: 'info',
      prayer: 'isha',
      code: 'ISHA_HIGH_LAT_RULE_APPLIED',
      message: `Latitude ${lat.toFixed(2)}° with method-configured high-latitude rule. Isha may be derived from a night-fraction rule rather than from a strict astronomical depression angle.`,
      astronomicalReference: null,
      applied: result.isha ? result.isha.toISOString() : null,
      diffMinutes: null,
    })
  }

  // Detect whether high-lat synthesis actually occurred by checking if rawTimes
  // values exist when a baseline 18° calc would have returned NaN.
  // For the FAJR_AFTER_SHURUQ guard: if high-lat rule fired, skip the strict
  // ordering check (Fajr ≈ Shuruq is expected in extreme summer at high lat).
  const skipFajrShuruqCheck = anyHighLatRule && absLat > 60

  // ── MAGHRIB_BEFORE_SUNSET (P0 critical, motivated by fajr#100)
  if (!isInvalidDate(rawTimes.sunset) && result.maghrib instanceof Date) {
    if (result.maghrib.getTime() < rawTimes.sunset.getTime()) {
      const d = diffMin(result.maghrib, rawTimes.sunset)
      warnings.push({
        severity: 'critical',
        prayer: 'maghrib',
        code: 'MAGHRIB_BEFORE_SUNSET',
        message: `Maghrib (${fmtTime(result.maghrib)} UTC) is ${Math.abs(d).toFixed(1)} min before astronomical apparent sunset (${fmtTime(rawTimes.sunset)} UTC). The sun is still above the horizon per standard refraction (0.833°). Maghrib prayer before the sun sets is not valid under any recognised school.`,
        astronomicalReference: rawTimes.sunset.toISOString(),
        applied: result.maghrib.toISOString(),
        diffMinutes: d,
      })
    }
  }

  // ── FAJR_AFTER_SHURUQ (P0 critical) — skip in polar high-lat regime
  if (!skipFajrShuruqCheck && result.fajr instanceof Date && result.shuruq instanceof Date) {
    if (result.fajr.getTime() > result.shuruq.getTime()) {
      const d = diffMin(result.fajr, result.shuruq)
      warnings.push({
        severity: 'critical',
        prayer: 'fajr',
        code: 'FAJR_AFTER_SHURUQ',
        message: `Fajr (${fmtTime(result.fajr)} UTC) is ${d.toFixed(1)} min after Shuruq (${fmtTime(result.shuruq)} UTC). Fajr's prayer window has closed before the displayed Fajr time. This indicates a calculation error or extreme method mismatch.`,
        astronomicalReference: result.shuruq.toISOString(),
        applied: result.fajr.toISOString(),
        diffMinutes: d,
      })
    }
  }

  // ── DHUHR_BEFORE_SOLAR_NOON (P1 critical)
  if (rawTimes.dhuhr instanceof Date && result.dhuhr instanceof Date) {
    if (result.dhuhr.getTime() < rawTimes.dhuhr.getTime() - 30_000) {
      // 30-second tolerance for rounding artefacts; rawTimes.dhuhr IS solar noon (per adhan)
      const d = diffMin(result.dhuhr, rawTimes.dhuhr)
      warnings.push({
        severity: 'critical',
        prayer: 'dhuhr',
        code: 'DHUHR_BEFORE_SOLAR_NOON',
        message: `Dhuhr (${fmtTime(result.dhuhr)} UTC) is ${Math.abs(d).toFixed(1)} min before astronomical solar noon (${fmtTime(rawTimes.dhuhr)} UTC). Dhuhr begins AT solar noon — a time before is not in any valid Dhuhr window.`,
        astronomicalReference: rawTimes.dhuhr.toISOString(),
        applied: result.dhuhr.toISOString(),
        diffMinutes: d,
      })
    }
  }

  // ── ASR ordering (P1 critical, two checks)
  if (result.asr instanceof Date && result.dhuhr instanceof Date && result.asr.getTime() <= result.dhuhr.getTime()) {
    warnings.push({
      severity: 'critical',
      prayer: 'asr',
      code: 'ASR_NOT_AFTER_DHUHR',
      message: `Asr (${fmtTime(result.asr)} UTC) must be after Dhuhr (${fmtTime(result.dhuhr)} UTC). The returned Asr is at or before Dhuhr, which is not a valid Asr time.`,
      astronomicalReference: result.dhuhr.toISOString(),
      applied: result.asr.toISOString(),
      diffMinutes: diffMin(result.asr, result.dhuhr),
    })
  }
  if (result.asr instanceof Date && result.maghrib instanceof Date && result.asr.getTime() >= result.maghrib.getTime()) {
    warnings.push({
      severity: 'critical',
      prayer: 'asr',
      code: 'ASR_NOT_BEFORE_MAGHRIB',
      message: `Asr (${fmtTime(result.asr)} UTC) must be before Maghrib (${fmtTime(result.maghrib)} UTC). The returned Asr is at or after Maghrib, which is not a valid Asr time.`,
      astronomicalReference: result.maghrib.toISOString(),
      applied: result.asr.toISOString(),
      diffMinutes: diffMin(result.asr, result.maghrib),
    })
  }

  // NOTE: The design doc proposed FAJR_BEFORE_DAWN_12DEG and
  // ISHA_BEFORE_TWILIGHT_12DEG as P1 absolute-floor checks against 12°
  // depression. Implementation revealed the polarity was inverted in the
  // doc: steeper depression (larger angle, e.g. MWL 18°, UmmAlQura 18.5°,
  // Egyptian 19.5°) places Fajr/Isha EARLIER in time than 12°, not later.
  // 12° is the LATEST any school uses, not the earliest. The "Fajr earlier
  // than 12°" check would false-positive on every standard method.
  //
  // Deferred to v1.8.1 with the polarity fix: use ~20° as the deepest-
  // depression-anyone-uses threshold for the "Fajr suspiciously early"
  // critical check, OR redefine the 12° check as a CEILING ("Fajr later
  // than 12° = past the dawn window, no school places Fajr that late").
  // Tracking issue to be filed with v1.8.0 ship.

  // ── MOROCCO_RAMADAN_DST_GAP (info, fajr#106): defensive warning for
  // consumers on older Node versions or custom display layers that may not
  // correctly model Morocco's Ramadan GMT+0 exception. Modern Node ≥18 with
  // current tzdata handles this correctly via Africa/Casablanca; the warning
  // exists to flag cases where the consumer might be on stale infrastructure.
  if (isInMoroccoBbox(lat, coords.longitude ?? coords.longitude_ ?? 0) && isInRamadan(date)) {
    warnings.push({
      severity: 'info',
      prayer: null,
      code: 'MOROCCO_RAMADAN_DST_GAP',
      message: 'Morocco observes UTC+0 during Ramadan (vs UTC+1 the rest of the year). Modern Node (≥18) with up-to-date tzdata applies this exception correctly when displaying via the `Africa/Casablanca` timezone, but consumers on older Node, on stale tzdata, or applying custom date arithmetic may miss the offset and display times 60 minutes late. Verify your display layer applies Africa/Casablanca correctly for this date.',
      astronomicalReference: null,
      applied: null,
      diffMinutes: null,
      fix: 'Use Date.toLocaleString(\"...\", { timeZone: \"Africa/Casablanca\" }) on a Node ≥18 runtime to get the correct local-time rendering during Ramadan.',
    })
  }

  return warnings
}
