// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { describe, expect, it } from 'vitest'
import {
  assessCalendarQuality,
  detectIssues,
  isCalendarDegenerate,
  summarizeCalendar,
} from '../scripts/lib/mosque-calendar-quality.js'

function buildHealthyCalendar() {
  // Mid-latitude (40°N) plausible calendar — 366 days with seasonal swing
  // on every prayer. Constructed analytically, not via the engine.
  const dates = []
  for (let day = 0; day < 366; day++) {
    const t = (day / 366) * 2 * Math.PI
    const dhuhrMin = 12 * 60
    // Solar declination swing — affects sunrise/sunset symmetrically by ~180 min
    const declination = Math.sin(t - Math.PI / 2) // -1 at winter solstice, +1 at summer
    const sunriseMin = dhuhrMin - (6 * 60) - declination * 90    // 6h before noon at equinox
    const sunsetMin = dhuhrMin + (6 * 60) + declination * 90
    const fajrMin = sunriseMin - 80     // 18° twilight ~= 80 min before sunrise at 40°N
    const ishaMin = sunsetMin + 80
    const asrMin = dhuhrMin + 3 * 60    // Shafi'i 1× shadow approx
    dates.push({
      date: `2026-${String(Math.floor(day / 30.5) + 1).padStart(2, '0')}-${String((day % 30) + 1).padStart(2, '0')}`,
      fajr: hm(fajrMin),
      sunrise: hm(sunriseMin),
      dhuhr: hm(dhuhrMin),
      asr: hm(asrMin),
      maghrib: hm(sunsetMin),
      isha: hm(ishaMin),
    })
  }
  return dates
}

function buildStaticFajrCalendar() {
  return buildHealthyCalendar().map(d => ({ ...d, fajr: '05:00' }))
}

function buildStaticIshaCalendar() {
  return buildHealthyCalendar().map(d => ({ ...d, isha: '20:15' }))
}

function buildShortFajrSunriseGapCalendar() {
  // Like Bangalore mosque[1] in the real fixture — Fajr ~35 min before sunrise
  return buildHealthyCalendar().map(d => {
    const sun = toMin(d.sunrise)
    return { ...d, fajr: hm(sun - 35) }
  })
}

function hm(min) {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`
}
function toMin(s) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + m
}

describe('mosque calendar quality heuristics', () => {
  it('accepts a healthy mid-latitude calendar', () => {
    const cal = buildHealthyCalendar()
    expect(isCalendarDegenerate(cal)).toBe(false)
    expect(detectIssues(summarizeCalendar(cal))).toEqual([])
  })

  it('flags a calendar with a single fixed Fajr time as STATIC_FAJR', () => {
    const cal = buildStaticFajrCalendar()
    expect(isCalendarDegenerate(cal)).toBe(true)
    expect(detectIssues(summarizeCalendar(cal))).toContain('STATIC_FAJR')
  })

  it('flags a calendar with a single fixed Isha time as STATIC_ISHA', () => {
    const cal = buildStaticIshaCalendar()
    expect(detectIssues(summarizeCalendar(cal))).toContain('STATIC_ISHA')
  })

  it('flags a Fajr set too close to sunrise as SHORT_FAJR_GAP', () => {
    const cal = buildShortFajrSunriseGapCalendar()
    expect(detectIssues(summarizeCalendar(cal))).toContain('SHORT_FAJR_GAP')
  })

  it('returns null summary when given too few rows', () => {
    expect(summarizeCalendar([])).toBeNull()
    expect(summarizeCalendar(buildHealthyCalendar().slice(0, 10))).toBeNull()
  })

  it('assessCalendarQuality bundles summary + issues + degenerate flag', () => {
    const cal = buildStaticIshaCalendar()
    const result = assessCalendarQuality(cal)
    expect(result.summary).not.toBeNull()
    expect(result.issues).toContain('STATIC_ISHA')
    expect(result.degenerate).toBe(true)
  })

  it('respects custom thresholds via overrides', () => {
    // Healthy calendar with thresholds tightened so even normal Maghrib
    // variance trips the static check — confirms thresholds are wired.
    const cal = buildHealthyCalendar()
    const tight = detectIssues(summarizeCalendar(cal), { maghribVarianceMin: 999 })
    expect(tight).toContain('STATIC_MAGHRIB')
  })
})
