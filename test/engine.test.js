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
  prayerTimes, qibla, hijri, hilalVisibility,
  nightThirds, travelerMode,
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
    [3.14,   101.69, /JAKIM|Singapore/i,         'Kuala Lumpur'],
    [40.71,  -74.01, /ISNA|NorthAmerica/i,       'New York'],
    [25.20,  55.27,  /Umm al-Qura|UAE/i,         'Dubai'],
    [48.86,  2.35,   /UOIF|12/i,                 'Paris'],
    [24.86,  67.00,  /Karachi/i,                 'Karachi'],
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

  it('returns prayers in chronological order for a typical mid-latitude location', () => {
    const result = prayerTimes({ latitude: 33.97, longitude: -6.85, date: TEST_DATE })
    for (let i = 1; i < PRAYERS.length; i++) {
      expect(result[PRAYERS[i]].getTime()).toBeGreaterThan(result[PRAYERS[i-1]].getTime())
    }
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
      fajr: new Date(t), shuruq: new Date(t), dhuhr: new Date(t),
      asr: new Date(t), maghrib: new Date(t), isha: new Date(t),
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
  it('exposes prayerTimes, qibla, hijri, hilalVisibility, nightThirds, travelerMode', () => {
    for (const fn of ['prayerTimes', 'qibla', 'hijri', 'hilalVisibility', 'nightThirds', 'travelerMode']) {
      expect(typeof fajr[fn]).toBe('function')
    }
  })
})
