// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Unit tests for fajr's public API surface.
 *
 * These exercise the behaviour fajr's v1.0 stability contract promises:
 * region-aware method selection, prayerTimes invariants, the three-criterion
 * hilal classification, qibla, hijri, traveler metadata. No network — these
 * are regression tests for the engine itself, not validations against external
 * services (those live in scripts/validate-*.js).
 */

import { describe, it, expect } from 'vitest'
import fajr, {
  prayerTimes, dayTimes, tarabishyTimes, qibla, hijri, hilalVisibility,
  nightThirds, travelerMode, applyTayakkunBuffer,
} from '../src/index.js'
import { applyElevationCorrection } from '../src/engine.js'

const TEST_DATE = new Date('2026-04-15T12:00:00Z')
const PRAYERS = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']

// ─────────────────────────────────────────────────────────────────────────────
// Region detection (via the methodName label that prayerTimes returns)
// ─────────────────────────────────────────────────────────────────────────────

describe('region-aware method auto-selection', () => {
  it.each([
    [33.97,  -6.85,  /Morocco|19/i,             'Rabat'],
    [24.71,  46.68,  /Umm al-Qura/i,             'Riyadh'],
    [41.01,  28.97,  /Diyanet/i,                 'Istanbul'],
    [30.04,  31.24,  /Egyptian/i,                'Cairo'],
    [51.51,  -0.13,  /Moonsighting|MoonsightingCommittee/i, 'London'],
    [3.14,   101.69, /JAKIM.*8min.*Fajr.*1min.*Isha|JAKIM.*ihtiyati/i, 'Kuala Lumpur'],
    [40.71,  -74.01, /ISNA|NorthAmerica/i,       'New York'],
    [25.20,  55.27,  /Umm al-Qura|UAE/i,         'Dubai'],
    [48.86,  2.35,   /UOIF|12/i,                 'Paris'],
    [24.86,  67.00,  /Karachi/i,                 'Karachi'],
    // v1.4 — gap-region coverage additions
    [35.69,  51.39,  /Tehran/i,                  'Tehran'],
    [15.36,  44.19,  /Kuwait.*Yemen/i,           'Sanaa'],
    [25.29,  51.53,  /Qatar Calendar House/i,    'Doha'],
    [29.38,  47.99,  /Kuwait.*Kuwait/i,          'Kuwait City'],
    [26.23,  50.58,  /Kuwait.*Bahrain/i,         'Manama'],
    [23.59,  58.41,  /Kuwait.*Oman/i,            'Muscat'],
    [-33.92, 18.42,  /MWL.*South Africa/i,       'Cape Town'],
    [4.90,   114.94, /JAKIM\/Singapore.*Brunei/i, 'Bandar Seri Begawan'],
    [1.35,   103.82, /MUIS|Singapore/i,          'Singapore'],
  ])('coordinates (%f, %f) → method matches /%s/ — %s', (lat, lng, pattern, _city) => {
    const result = prayerTimes({ latitude: lat, longitude: lng, date: TEST_DATE })
    expect(result.method).toMatch(pattern)
  })

  it('falls back to ISNA for an unmapped coordinate', () => {
    // Middle of the South Pacific, no country bounding box matches.
    const result = prayerTimes({ latitude: -30, longitude: -150, date: TEST_DATE })
    expect(result.method).toMatch(/ISNA|MoonsightingCommittee|MWL|fallback/i)
  })

  it('selects high-latitude rule for Norway / Iceland / Finland', () => {
    const oslo = prayerTimes({ latitude: 60, longitude: 10, date: TEST_DATE })
    expect(oslo.method).toMatch(/MiddleOfTheNight|TwilightAngle|Norway|MWL/i)
    const reykjavik = prayerTimes({ latitude: 64.15, longitude: -21.94, date: TEST_DATE })
    expect(reykjavik.method).toMatch(/MiddleOfTheNight|Iceland|MWL/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// prayerTimes invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('prayerTimes invariants', () => {
  it('returns the six prayers as Date objects', () => {
    const result = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    for (const p of PRAYERS) {
      expect(result[p]).toBeInstanceOf(Date)
      expect(Number.isFinite(result[p].getTime())).toBe(true)
    }
  })

  it('exposes `sunrise` as an alias for `shuruq` (back-compat for adhan.js consumers)', () => {
    const result = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    expect(result.sunrise).toBeInstanceOf(Date)
    expect(result.sunrise.getTime()).toBe(result.shuruq.getTime())
  })

  it('exposes `sunset` as a Date distinct from internal storage (matches adhan.js shape)', () => {
    const result = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    expect(result.sunset).toBeInstanceOf(Date)
    expect(Number.isFinite(result.sunset.getTime())).toBe(true)
    // `sunset` is the astronomical sunset; `maghrib` is the prayer-time
    // value, which may include an institutional ihtiyati offset (Morocco
    // +5min, Diyanet +7min, JAKIM +1min, etc.). The two should be within
    // ~15 minutes of each other for any sane method — anything larger
    // would indicate a unit / DST bug.
    const gapMs = Math.abs(result.sunset.getTime() - result.maghrib.getTime())
    expect(gapMs).toBeLessThan(15 * 60 * 1000)
  })

  it('returns prayers in chronological order for a typical mid-latitude location', () => {
    const result = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    for (let i = 1; i < PRAYERS.length; i++) {
      expect(result[PRAYERS[i]].getTime()).toBeGreaterThan(result[PRAYERS[i-1]].getTime())
    }
  })

  it('exposes `imsak` as a Date 10 min before Fajr, rounded DOWN for fasting yaqeen (v1.5.1)', () => {
    const result = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    expect(result.imsak).toBeInstanceOf(Date)
    expect(Number.isFinite(result.imsak.getTime())).toBe(true)
    // imsak must be earlier than Fajr by at least 9 minutes (default 10,
    // with rounding-direction wiggle of up to 1 minute in either direction).
    const gapMin = (result.fajr.getTime() - result.imsak.getTime()) / 60000
    expect(gapMin).toBeGreaterThanOrEqual(9)
    expect(gapMin).toBeLessThanOrEqual(11)
    // imsak must be a whole minute (seconds=0).
    expect(result.imsak.getUTCSeconds()).toBe(0)
  })

  it('applies ihtiyat-aware per-prayer rounding direction (v1.5.1)', () => {
    const result = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    // All returned times round to whole minutes (seconds=0).
    for (const p of ['imsak', 'fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunset']) {
      expect(result[p].getUTCSeconds()).toBe(0)
    }
    // Corrections metadata exposes the rounding policy and imsak offset.
    expect(typeof result.corrections.rounding).toBe('string')
    expect(result.corrections.rounding).toMatch(/ihtiyat/i)
    expect(result.corrections.imsak_offset_min).toBe(10)
  })

  it('returns a method label string', () => {
    const result = prayerTimes({ latitude: 21.42, longitude: 39.83, date: TEST_DATE })
    expect(typeof result.method).toBe('string')
    expect(result.method.length).toBeGreaterThan(0)
  })

  it('returns the corrections metadata block', () => {
    const result = prayerTimes({ latitude: 0, longitude: 0, date: TEST_DATE })
    expect(result.corrections).toBeDefined()
    expect(typeof result.corrections.elevation).toBe('boolean')
    expect(typeof result.corrections.refraction).toBe('string')
  })

  it('handles southern-hemisphere coordinates without crashing', () => {
    // Cape Town, South Africa
    const result = prayerTimes({ latitude: -33.92, longitude: 18.42, date: TEST_DATE })
    for (const p of PRAYERS) {
      expect(Number.isFinite(result[p].getTime())).toBe(true)
    }
  })

  it('emits no high-latitude or elevation-advisory notes at low-altitude low-latitude locations', () => {
    // Casablanca — well below the high-latitude threshold, ~27m elevation.
    // Pass elevation: 0 explicitly to suppress the v1.7.0 phase 2 auto-
    // elevation note (the test pre-dates phase 2 and asserts the absence
    // of high-latitude / elevation-advisory notes specifically — which
    // is still true under phase 2 when caller-explicit elevation is used).
    const result = prayerTimes({ latitude: 33.57, longitude: -7.59, date: TEST_DATE, elevation: 0 })
    expect(Array.isArray(result.notes)).toBe(true)
    const advisoryNotes = result.notes.filter(n => /high-latitude|Elevation advisory/i.test(n))
    expect(advisoryNotes).toEqual([])
  })

  it('does NOT emit elevation advisory below 500 m threshold (v1.5.2)', () => {
    // Casablanca, ~3m — no elevation note expected
    const result = prayerTimes({ latitude: 33.5731, longitude: -7.5898, date: TEST_DATE, elevation: 3 })
    const elevNotes = result.notes.filter(n => /^Elevation advisory/.test(n))
    expect(elevNotes.length).toBe(0)
  })

  it('emits elevation advisory at ≥500 m with institutional context (v1.5.2)', () => {
    // Riyadh, 612 m — advisory should fire
    const result = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: TEST_DATE, elevation: 612 })
    const elevNote = result.notes.find(n => /^Elevation advisory/.test(n))
    expect(elevNote).toBeDefined()
    // Advisory should mention the institutional disagreement explicitly
    expect(elevNote).toMatch(/UAE|JAKIM/)
    expect(elevNote).toMatch(/Saudi|Umm al-Qura/)
    expect(elevNote).toMatch(/jama'ah/)
    expect(elevNote).toMatch(/612/)
    // High-elevation case scales up
    const sanaa = prayerTimes({ latitude: 15.3694, longitude: 44.1910, date: TEST_DATE, elevation: 2250 })
    const sanaaNote = sanaa.notes.find(n => /^Elevation advisory/.test(n))
    expect(sanaaNote).toBeDefined()
    expect(sanaaNote).toMatch(/2250/)
  })

  it('emits high-latitude advisory at |lat| ≥ 48.6° per Odeh 2009', () => {
    // Pass elevation: 0 to all of these so the v1.7.0 phase 2 auto-
    // elevation note is suppressed and we can isolate the high-latitude
    // advisory shape regardless of whether the test coord falls inside a
    // registered city's bbox (e.g. Reykjavík has city.elevation=61m).
    const HL_RE = /High-latitude|Odeh|48\.6/i

    // Reykjavik — fajr#4 case
    const reykjavik = prayerTimes({ latitude: 64.15, longitude: -21.94, date: TEST_DATE, elevation: 0 })
    const reykjavikHL = reykjavik.notes.filter(n => HL_RE.test(n))
    expect(reykjavikHL.length).toBe(1)
    expect(reykjavikHL[0]).toMatch(/Odeh.*2009/i)
    expect(reykjavikHL[0]).toMatch(/48\.6/)

    // Symmetrical southern hemisphere — Macquarie Island at -54.5° latitude
    const macquarie = prayerTimes({ latitude: -54.5, longitude: 158.95, date: TEST_DATE, elevation: 0 })
    const macquarieHL = macquarie.notes.filter(n => HL_RE.test(n))
    expect(macquarieHL.length).toBe(1)
    expect(macquarieHL[0]).toMatch(/Odeh.*2009/i)

    // Just above the threshold — should still emit
    const edge = prayerTimes({ latitude: 48.6, longitude: 0, date: TEST_DATE, elevation: 0 })
    expect(edge.notes.filter(n => HL_RE.test(n)).length).toBe(1)

    // Just below — should not
    const justBelow = prayerTimes({ latitude: 48.5, longitude: 0, date: TEST_DATE, elevation: 0 })
    expect(justBelow.notes.filter(n => HL_RE.test(n)).length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Path A calibration regression tests
//
// These pin the calibration state established across v1.4.1, v1.4.4, v1.4.5
// so a future adhan.js dependency update or refactor can't silently
// change the cumulative effect. Each assertion pairs a country with the
// expected method-name fragment AND the empirical Fajr/Maghrib/Isha
// shifts the calibration introduces vs adhan.js's underlying preset.
// ─────────────────────────────────────────────────────────────────────────────

describe('Path A calibration regression', () => {
  it('Malaysia — JAKIM Fajr +8 / Isha +1 ihtiyati (v1.4.1 + v1.4.4)', () => {
    const params = { latitude: 3.139, longitude: 101.6869, date: TEST_DATE }
    const r = prayerTimes(params)
    expect(r.method).toMatch(/JAKIM.*8min.*Fajr/i)
    expect(r.method).toMatch(/1min.*Isha/i)

    // The Path A offsets shift Fajr +8 and Isha +1 vs the bare
    // adhan.Singapore() preset. Compute the bare-preset reference and
    // verify the actual deltas hold.
    // Note: methodAdjustments includes adhan's own dhuhr:1 etc., which
    // are unchanged. So the deltas should be exactly 8 and 1 minutes.
    // We can't easily call the un-Path-A version; instead, anchor on
    // an absolute time pinned for KL on TEST_DATE.
    // KL Fajr should be 02:42-02:43 UTC on 2026-04-15 (06:42-06:43 local
    // UTC+8 — JAKIM publishes ~06:42 with the v1.4.1 offset).
    const fajrLocal = new Date(r.fajr.getTime() + 8 * 3600000).toISOString().slice(11, 16)
    const ishaLocal = new Date(r.isha.getTime() + 8 * 3600000).toISOString().slice(11, 16)
    // Sanity bounds — tight enough to catch a missing offset, loose
    // enough to allow legitimate per-day variation.
    expect(fajrLocal >= '05:50' && fajrLocal <= '06:10').toBe(true)
    expect(ishaLocal >= '20:25' && ishaLocal <= '20:50').toBe(true)
  })

  it('Türkiye — Diyanet Maghrib/Isha −1min ezanvakti calibration (v1.4.5)', () => {
    const params = { latitude: 41.01, longitude: 28.97, date: TEST_DATE }
    const r = prayerTimes(params)
    expect(r.method).toMatch(/Diyanet.*Path A.*−1min|Diyanet.*1min.*Maghrib.*Isha/i)
    expect(r.method).toMatch(/ezanvakti/i)

    // Istanbul on 2026-04-15: Maghrib ~19:53 local UTC+3 is the
    // rough expected band. The −1 vs adhan.Turkey()'s preset shifts
    // both Maghrib and Isha 1 minute earlier than they would be with
    // the un-overridden preset.
    const maghribLocal = new Date(r.maghrib.getTime() + 3 * 3600000).toISOString().slice(11, 16)
    const ishaLocal = new Date(r.isha.getTime() + 3 * 3600000).toISOString().slice(11, 16)
    expect(maghribLocal >= '19:40' && maghribLocal <= '20:00').toBe(true)
    expect(ishaLocal >= '21:10' && ishaLocal <= '21:35').toBe(true)
  })

  it('Indonesia — KEMENAG NOT calibrated (no Path A applies)', () => {
    // Path A is JAKIM-Malaysia-specific, NOT Indonesia. Jakarta should
    // route to JAKIM/Singapore equivalent without the +8 Fajr offset
    // because KEMENAG (Indonesia's institutional authority) doesn't
    // bake in the same buffer.
    const r = prayerTimes({ latitude: -6.2088, longitude: 106.8456, date: TEST_DATE })
    expect(r.method).toMatch(/JAKIM\/Singapore/i)
    expect(r.method).not.toMatch(/Path A|ihtiyati|Malaysia/i)
  })

  it('Morocco — community-calibrated 19° (v1.0 Path A predecessor)', () => {
    // The Morocco 19° community calibration is the original Path A
    // case shipped in v1.0 — included here for completeness so future
    // refactors don't accidentally remove it.
    const r = prayerTimes({ latitude: 33.57, longitude: -7.59, date: TEST_DATE })
    expect(r.method).toMatch(/Morocco.*19/i)
    expect(r.method).toMatch(/community.*calibration/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// dayTimes — single-call convenience returning all 9 day-times
// ─────────────────────────────────────────────────────────────────────────────

describe('dayTimes', () => {
  it('returns prayer times + sunset + midnight + qiyam in one object', () => {
    const result = dayTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    for (const f of ['fajr', 'shuruq', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunset', 'midnight', 'qiyam']) {
      expect(result[f]).toBeInstanceOf(Date)
      expect(Number.isFinite(result[f].getTime())).toBe(true)
    }
  })

  it('orders night-third boundaries correctly: maghrib < midnight < qiyam < next-day fajr', () => {
    const result = dayTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    expect(result.maghrib.getTime()).toBeLessThan(result.midnight.getTime())
    expect(result.midnight.getTime()).toBeLessThan(result.qiyam.getTime())
    // qiyam should be in the last third of the night, before fajr-of-tomorrow
    // (we don't have tomorrow's fajr in the result but we know the night
    // ends around fajr+24h since fajr in the result is for today).
    const tomorrowDate = new Date(TEST_DATE.getTime() + 24 * 60 * 60 * 1000)
    const tomorrow = prayerTimes({ latitude: 33.97, longitude: -6.85, date: tomorrowDate })
    expect(result.qiyam.getTime()).toBeLessThan(tomorrow.fajr.getTime())
  })

  it('is consistent with prayerTimes() for the prayer fields', () => {
    const day = dayTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    const six = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    for (const f of ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunset']) {
      expect(day[f].getTime()).toBe(six[f].getTime())
    }
  })

  it('applies elevation correction when elevation > 0 (matches prayerTimes wrapper)', () => {
    // Denver, ~1600m. The bug was that dayTimes() bypassed the elevation
    // wrapper and returned sea-level shuruq/maghrib regardless of elevation.
    const args = { latitude: 39.7392, longitude: -104.9903, date: TEST_DATE, elevation: 1600 }
    const day = dayTimes(args)
    const six = prayerTimes(args)
    expect(day.shuruq.getTime()).toBe(six.shuruq.getTime())
    expect(day.sunrise.getTime()).toBe(six.sunrise.getTime())
    expect(day.maghrib.getTime()).toBe(six.maghrib.getTime())
    expect(day.corrections.elevation).toBe(true)
    expect(day.corrections.elevationCorrectionMin).toBeGreaterThan(0)

    // And the corrected shuruq must actually differ from the sea-level value.
    const sea = dayTimes({ ...args, elevation: 0 })
    expect(day.shuruq.getTime()).toBeLessThan(sea.shuruq.getTime())
    expect(day.maghrib.getTime()).toBeGreaterThan(sea.maghrib.getTime())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// hilalVisibility — three-criterion classification
// ─────────────────────────────────────────────────────────────────────────────

describe('hilalVisibility', () => {
  it('returns Odeh + Yallop + Shaukat side-by-side', () => {
    const r = hilalVisibility({ year: 1446, month: 9, latitude: 30.04, longitude: 31.24 })
    // Odeh top-level
    expect(r).toHaveProperty('visible')
    expect(r).toHaveProperty('code')
    expect(r).toHaveProperty('V')
    expect(r.criterion).toBe('Odeh (2004)')
    // Yallop sub-object
    expect(r.yallop.criterion).toBe('Yallop (1997)')
    expect(r.yallop).toHaveProperty('q')
    expect(r.yallop).toHaveProperty('code')
    // Shaukat sub-object
    expect(r.shaukat.criterion).toBe('Shaukat (2002)')
    expect(r.shaukat).toHaveProperty('elongationDeg')
    expect(r.shaukat).toHaveProperty('moonAltAtSunsetDeg')
    expect(r.shaukat).toHaveProperty('moonAgeHours')
    expect(r.shaukat).toHaveProperty('lagMinutes')
    // Agreement flag
    expect(typeof r.criteriaAgree).toBe('boolean')
  })

  it('classifies Ramadan 1444 (Riyadh, age 22h) as visible', () => {
    const r = hilalVisibility({ year: 1444, month: 9, latitude: 24.71, longitude: 46.68 })
    expect(r.visible).toBe(true)
    expect(['A', 'B']).toContain(r.code)
  })

  it('classifies Ramadan 1445 (Dubai, age 5.5h, sub-Danjon) as not visible across all three criteria', () => {
    const r = hilalVisibility({ year: 1445, month: 9, latitude: 25.20, longitude: 55.27 })
    expect(r.visible).toBe(false)
    expect(r.yallop.visible).toBe(false)
    expect(r.shaukat.visible).toBe(false)
    expect(r.shaukat.code).toBe('D')   // below Danjon limit
    expect(r.criteriaAgree).toBe(true)
  })

  it('classifies Shawwal 1444 (Riyadh, age 11h) as not visible', () => {
    const r = hilalVisibility({ year: 1444, month: 10, latitude: 24.71, longitude: 46.68 })
    expect(r.visible).toBe(false)
    expect(r.code).toBe('D')
  })

  it('returns wasail/ibadat reminder note', () => {
    const r = hilalVisibility({ year: 1446, month: 9, latitude: 30.04, longitude: 31.24 })
    expect(r.note).toMatch(/wasail|ibadat|fiqh|Islamic authorities|criterion/i)
  })

  it('reports the canonical sighting evening (day 29 of prior month)', () => {
    const r = hilalVisibility({ year: 1446, month: 9, latitude: 30.04, longitude: 31.24 })
    expect(r.evaluatedHijriDate).toEqual({ year: 1446, month: 8, day: 29 })
    expect(r.forHijriMonth).toEqual({ year: 1446, month: 9 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// qibla
// ─────────────────────────────────────────────────────────────────────────────

describe('qibla', () => {
  it('returns { bearing, magneticDeclination, trueBearing }', () => {
    const q = qibla({ latitude: 51.51, longitude: -0.13 })  // London
    expect(typeof q.bearing).toBe('number')
    expect(typeof q.magneticDeclination).toBe('number')
    expect(typeof q.trueBearing).toBe('number')
    expect(q.bearing).toBeGreaterThanOrEqual(0)
    expect(q.bearing).toBeLessThan(360)
  })

  it('points roughly south-east from London (Mecca is south-east)', () => {
    const q = qibla({ latitude: 51.51, longitude: -0.13 })
    // London → Mecca: known bearing ~119° (between east and south)
    expect(q.bearing).toBeGreaterThan(80)
    expect(q.bearing).toBeLessThan(150)
  })

  it('points roughly west from Karachi (Mecca is west-southwest)', () => {
    const q = qibla({ latitude: 24.86, longitude: 67.00 })
    // Karachi → Mecca: known bearing ~265° (west, slightly south)
    expect(q.bearing).toBeGreaterThan(255)
    expect(q.bearing).toBeLessThan(280)
  })

  it('points roughly north from Cape Town (Mecca is north-northeast)', () => {
    const q = qibla({ latitude: -33.92, longitude: 18.42 })
    // Cape Town → Mecca: ~30° (slightly east of north)
    expect(q.bearing).toBeGreaterThan(15)
    expect(q.bearing).toBeLessThan(60)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// hijri (tabular Kuwaiti algorithm)
// ─────────────────────────────────────────────────────────────────────────────

describe('hijri', () => {
  it('returns year/month/day/monthName for any Date', () => {
    const r = hijri(new Date('2026-04-15T12:00:00Z'))
    expect(typeof r.year).toBe('number')
    expect(r.month).toBeGreaterThanOrEqual(1)
    expect(r.month).toBeLessThanOrEqual(12)
    expect(r.day).toBeGreaterThanOrEqual(1)
    expect(r.day).toBeLessThanOrEqual(30)
    expect(typeof r.monthName).toBe('string')
  })

  it('produces sane Hijri year for a 2026 date', () => {
    const r = hijri(new Date('2026-06-15T12:00:00Z'))
    // 2026-06 falls in 1447 AH
    expect(r.year).toBeGreaterThanOrEqual(1447)
    expect(r.year).toBeLessThanOrEqual(1448)
  })

  it("returns one of the twelve canonical Hijri month names", () => {
    const validNames = [
      'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
      'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
    ]
    for (let m = 0; m < 12; m++) {
      // walk the year, sample one date per month, accumulate names seen
      const r = hijri(new Date(2026, m, 15))
      expect(validNames).toContain(r.monthName)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// travelerMode (qasr / jam' metadata)
// ─────────────────────────────────────────────────────────────────────────────

describe('travelerMode', () => {
  const stubTimes = () => {
    const t = new Date('2026-04-15T12:00:00Z')
    return {
      fajr: t, shuruq: t, dhuhr: t, asr: t, maghrib: t, isha: t,
    }
  }

  it('reports qasr=true for any madhab', () => {
    const t = travelerMode({ times: stubTimes(), madhab: 'shafii' })
    expect(t.qasr).toBe(true)
  })

  it('reports jam allowed for non-Hanafi madhabs', () => {
    for (const m of ['shafii', 'maliki', 'hanbali']) {
      const t = travelerMode({ times: stubTimes(), madhab: m })
      expect(t.jam).not.toBeNull()
      expect(t.madhab).toBe(m)
    }
  })

  it('reports jam=null for Hanafi madhab', () => {
    const t = travelerMode({ times: stubTimes(), madhab: 'hanafi' })
    expect(t.jam).toBeNull()
  })

  it('emits a fiqh-determination disclaimer note', () => {
    const t = travelerMode({ times: stubTimes(), madhab: 'shafii' })
    expect(t.note).toMatch(/scholar|fiqh|safar|traveler/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// applyElevationCorrection (utility, disabled by default in engine)
// ─────────────────────────────────────────────────────────────────────────────

describe('applyElevationCorrection', () => {
  const baseTimes = () => {
    const t = new Date('2026-04-15T12:00:00Z')
    return {
      fajr: new Date(t), shuruq: new Date(t), sunrise: new Date(t),
      dhuhr: new Date(t), asr: new Date(t),
      maghrib: new Date(t), sunset: new Date(t), isha: new Date(t),
      method: 'test', corrections: { elevation: false, refraction: 'standard' },
    }
  }

  it('shifts shuruq earlier and maghrib later at 1000m elevation', () => {
    const before = baseTimes()
    const after = applyElevationCorrection(before, 1000, 30)
    expect(after.shuruq.getTime()).toBeLessThan(before.shuruq.getTime())
    expect(after.maghrib.getTime()).toBeGreaterThan(before.maghrib.getTime())
  })

  it('marks corrections.elevation = true after applying', () => {
    const after = applyElevationCorrection(baseTimes(), 500, 25)
    expect(after.corrections.elevation).toBe(true)
    expect(typeof after.corrections.elevationCorrectionMin).toBe('number')
  })

  it('returns input unchanged for elevation <= 0', () => {
    const before = baseTimes()
    const after = applyElevationCorrection(before, 0, 30)
    expect(after).toBe(before)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// applyTayakkunBuffer (Aabed 2015) — opt-in 5-min Fajr delay
// ─────────────────────────────────────────────────────────────────────────────

describe('applyTayakkunBuffer', () => {
  it('delays Fajr by 5 minutes by default', () => {
    const before = prayerTimes({ latitude: 31.95, longitude: 35.93, date: TEST_DATE })
    const after = applyTayakkunBuffer(before)
    expect(after.fajr.getTime() - before.fajr.getTime()).toBe(5 * 60 * 1000)
    // Other prayers unchanged
    for (const p of ['shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      expect(after[p].getTime()).toBe(before[p].getTime())
    }
  })

  it('accepts a custom buffer minutes value', () => {
    const before = prayerTimes({ latitude: 31.95, longitude: 35.93, date: TEST_DATE })
    const after = applyTayakkunBuffer(before, 10)
    expect(after.fajr.getTime() - before.fajr.getTime()).toBe(10 * 60 * 1000)
  })

  it('returns input unchanged for mins <= 0', () => {
    const before = prayerTimes({ latitude: 31.95, longitude: 35.93, date: TEST_DATE })
    expect(applyTayakkunBuffer(before, 0)).toBe(before)
    expect(applyTayakkunBuffer(before, -5)).toBe(before)
  })

  it('appends a notes entry citing Aabed 2015', () => {
    const before = prayerTimes({ latitude: 31.95, longitude: 35.93, date: TEST_DATE })
    const after = applyTayakkunBuffer(before)
    expect(after.notes.length).toBe(before.notes.length + 1)
    const note = after.notes[after.notes.length - 1]
    expect(note).toMatch(/Aabed.*2015/i)
    expect(note).toMatch(/tayakkun/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// tarabishyTimes (Tarabishy 2014) — opt-in 45° latitude-truncation method
// ─────────────────────────────────────────────────────────────────────────────

describe('tarabishyTimes', () => {
  it('returns prayerTimes() output unchanged below the 45° threshold', () => {
    const params = { latitude: 33.97, longitude: -6.85, date: TEST_DATE }
    const tarabishy = tarabishyTimes(params)
    const standard  = prayerTimes(params)
    for (const p of ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      expect(tarabishy[p].getTime()).toBe(standard[p].getTime())
    }
  })

  it('truncates latitude to 45° above the threshold (preserving sign)', () => {
    // Reykjavik, 64.15°N — should compute as if at 45°N
    const reykjavik = tarabishyTimes({ latitude: 64.15, longitude: -21.94, date: TEST_DATE })
    const at45      = prayerTimes({ latitude: 45,    longitude: -21.94, date: TEST_DATE })
    for (const p of ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      expect(reykjavik[p].getTime()).toBe(at45[p].getTime())
    }
    expect(reykjavik.method).toMatch(/Tarabishy/i)
    expect(reykjavik.method).toMatch(/45/)
  })

  it('preserves sign on southern-hemisphere truncation', () => {
    // Macquarie Island, -54.5° — should compute as if at -45°
    const macquarie = tarabishyTimes({ latitude: -54.5, longitude: 158.95, date: TEST_DATE })
    const atMinus45 = prayerTimes({ latitude: -45,   longitude: 158.95, date: TEST_DATE })
    for (const p of ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      expect(macquarie[p].getTime()).toBe(atMinus45[p].getTime())
    }
  })

  it('appends a notes entry citing Tarabishy 2014 above threshold', () => {
    const reykjavik = tarabishyTimes({ latitude: 64.15, longitude: -21.94, date: TEST_DATE })
    const note = reykjavik.notes[reykjavik.notes.length - 1]
    expect(note).toMatch(/Tarabishy.*2014/i)
  })

  it('accepts a custom threshold latitude', () => {
    // Force truncation at 50° even for Paris (48.86°) — should NOT truncate
    const params = { latitude: 48.86, longitude: 2.35, date: TEST_DATE }
    const customAbove = tarabishyTimes(params, 50)
    const standard    = prayerTimes(params)
    expect(customAbove.fajr.getTime()).toBe(standard.fajr.getTime())

    // Force truncation at 30° — Paris IS above 30°, should truncate to 30°
    const customBelow = tarabishyTimes(params, 30)
    const at30        = prayerTimes({ ...params, latitude: 30 })
    expect(customBelow.fajr.getTime()).toBe(at30.fajr.getTime())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// nightThirds
// ─────────────────────────────────────────────────────────────────────────────

describe('nightThirds', () => {
  it('returns firstThird / secondThird / lastThird / midnight as Date objects', () => {
    const r = nightThirds({ date: TEST_DATE, latitude: 33.97, longitude: -6.85 })
    for (const k of ['firstThird', 'secondThird', 'lastThird', 'midnight']) {
      expect(r[k]).toBeInstanceOf(Date)
      expect(Number.isFinite(r[k].getTime())).toBe(true)
    }
  })

  it('orders divisions correctly: firstThird < midnight < lastThird', () => {
    const r = nightThirds({ date: TEST_DATE, latitude: 33.97, longitude: -6.85 })
    expect(r.firstThird.getTime()).toBeLessThan(r.midnight.getTime())
    expect(r.midnight.getTime()).toBeLessThan(r.lastThird.getTime())
  })

  it('also accepts the advanced { maghrib, fajr } shape', () => {
    const maghrib = new Date('2026-04-15T19:00:00Z')
    const fajr = new Date('2026-04-16T05:00:00Z')
    const r = nightThirds({ maghrib, fajr })
    // Night is 10 h; midnight is +5 h = 00:00 UTC
    expect(r.midnight.toISOString()).toBe('2026-04-16T00:00:00.000Z')
  })

  it('throws if neither shape provides enough info', () => {
    expect(() => nightThirds({ date: TEST_DATE })).toThrow(/maghrib.*fajr|date.*latitude.*longitude/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Default export shape (used by `import fajr from '@tawfeeqmartin/fajr'`)
// ─────────────────────────────────────────────────────────────────────────────

describe('default export', () => {
  it('exposes prayerTimes, dayTimes, qibla, hijri, hilalVisibility, nightThirds, travelerMode', () => {
    for (const fn of ['prayerTimes', 'dayTimes', 'qibla', 'hijri', 'hilalVisibility', 'nightThirds', 'travelerMode']) {
      expect(typeof fajr[fn]).toBe('function')
    }
  })
})
