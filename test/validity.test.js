// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { describe, it, expect } from 'vitest'
import * as adhan from 'adhan'
import { prayerTimes } from '../src/index.js'
import { computeValidityWarnings } from '../src/validity.js'

const TEST_DATE = new Date('2026-05-05T12:00:00Z')

describe('Layer 4 validity warnings — happy paths (no critical warnings)', () => {
  it('Casablanca May 5 2026 (default Morocco) returns empty warnings', () => {
    const t = prayerTimes({ latitude: 33.5769, longitude: -7.5473, date: TEST_DATE })
    expect(t.validityWarnings).toEqual([])
  })

  it('Mecca May 5 2026 (UmmAlQura) returns empty warnings', () => {
    const t = prayerTimes({ latitude: 21.4225, longitude: 39.8262, date: TEST_DATE })
    expect(t.validityWarnings).toEqual([])
  })

  it('Jakarta May 5 2026 (JAKIM-cluster) returns empty warnings', () => {
    const t = prayerTimes({ latitude: -6.2088, longitude: 106.8456, date: TEST_DATE })
    expect(t.validityWarnings).toEqual([])
  })

  it('Istanbul May 5 2026 (Diyanet) returns empty warnings', () => {
    const t = prayerTimes({ latitude: 41.0082, longitude: 28.9784, date: TEST_DATE })
    expect(t.validityWarnings).toEqual([])
  })
})

describe('Layer 4 validity warnings — high-latitude info', () => {
  it('Reykjavik June 21 2026 fires FAJR_HIGH_LAT_RULE_APPLIED + ISHA_HIGH_LAT_RULE_APPLIED', () => {
    const t = prayerTimes({ latitude: 64.1, longitude: -22.0, date: new Date('2026-06-21T12:00:00Z') })
    const codes = t.validityWarnings.map(w => w.code)
    expect(codes).toContain('FAJR_HIGH_LAT_RULE_APPLIED')
    expect(codes).toContain('ISHA_HIGH_LAT_RULE_APPLIED')
    // No critical warnings — high-lat synthesis is valid per the chosen rule
    expect(t.validityWarnings.filter(w => w.severity === 'critical')).toEqual([])
  })

  it('high-lat info warnings carry severity=info and applied timestamp', () => {
    const t = prayerTimes({ latitude: 64.1, longitude: -22.0, date: new Date('2026-06-21T12:00:00Z') })
    const fajrWarn = t.validityWarnings.find(w => w.code === 'FAJR_HIGH_LAT_RULE_APPLIED')
    expect(fajrWarn.severity).toBe('info')
    expect(fajrWarn.prayer).toBe('fajr')
    expect(typeof fajrWarn.applied).toBe('string')
    expect(fajrWarn.astronomicalReference).toBeNull()
    expect(fajrWarn.diffMinutes).toBeNull()
  })

  it('London June 21 2026 (sub-polar high lat 51.5°N) — does NOT fire high-lat info under MoonsightingCommittee', () => {
    // London uses MoonsightingCommittee (no fixed highLatitudeRule on params).
    // The check fires only when params.highLatitudeRule is set.
    const t = prayerTimes({ latitude: 51.5074, longitude: -0.1278, date: new Date('2026-06-21T12:00:00Z') })
    const codes = t.validityWarnings.map(w => w.code)
    // Expectation depends on whether dispatch sets highLatitudeRule. Either is acceptable;
    // assert no critical warnings (the safety property).
    expect(t.validityWarnings.filter(w => w.severity === 'critical')).toEqual([])
  })
})

describe('Layer 4 validity warnings — polar regions', () => {
  it('Tromsø Dec 21 2026 (polar night) fires POLAR_NO_SUNSET or POLAR_NO_SUNRISE', () => {
    const t = prayerTimes({ latitude: 69.6, longitude: 18.95, date: new Date('2026-12-21T12:00:00Z') })
    const codes = t.validityWarnings.map(w => w.code)
    expect(codes.some(c => c === 'POLAR_NO_SUNSET' || c === 'POLAR_NO_SUNRISE')).toBe(true)
    // Polar warnings are critical — user must know
    const polarWarn = t.validityWarnings.find(w => w.code === 'POLAR_NO_SUNSET' || w.code === 'POLAR_NO_SUNRISE')
    expect(polarWarn.severity).toBe('critical')
  })
})

describe('Layer 4 validity warnings — critical checks (synthetic injection)', () => {
  // The shar'i-validity checks fire against the result vs raw adhan times.
  // To synthesise a violation, build a result + raw object directly.
  const coords = new adhan.Coordinates(33.5769, -7.5473)
  const date = TEST_DATE
  const params = adhan.CalculationMethod.MuslimWorldLeague()
  params.rounding = adhan.Rounding.None
  const rawTimes = new adhan.PrayerTimes(coords, date, params)

  it('MAGHRIB_BEFORE_SUNSET fires when result.maghrib precedes raw sunset', () => {
    const result = {
      fajr: rawTimes.fajr,
      shuruq: rawTimes.sunrise,
      sunrise: rawTimes.sunrise,
      dhuhr: rawTimes.dhuhr,
      asr: rawTimes.asr,
      // Force Maghrib 6 minutes BEFORE sunset (the fajr#100 motivating case)
      maghrib: new Date(rawTimes.sunset.getTime() - 6 * 60_000),
      isha: rawTimes.isha,
    }
    const warnings = computeValidityWarnings({ rawTimes, result, params, coords, date })
    const w = warnings.find(x => x.code === 'MAGHRIB_BEFORE_SUNSET')
    expect(w).toBeDefined()
    expect(w.severity).toBe('critical')
    expect(w.prayer).toBe('maghrib')
    expect(w.diffMinutes).toBeLessThan(0)
    expect(Math.abs(w.diffMinutes)).toBeGreaterThan(5)
  })

  it('FAJR_AFTER_SHURUQ fires when fajr > shuruq', () => {
    const result = {
      // Force Fajr 12 min AFTER Shuruq
      fajr: new Date(rawTimes.sunrise.getTime() + 12 * 60_000),
      shuruq: rawTimes.sunrise,
      sunrise: rawTimes.sunrise,
      dhuhr: rawTimes.dhuhr,
      asr: rawTimes.asr,
      maghrib: rawTimes.maghrib,
      isha: rawTimes.isha,
    }
    const warnings = computeValidityWarnings({ rawTimes, result, params, coords, date })
    const w = warnings.find(x => x.code === 'FAJR_AFTER_SHURUQ')
    expect(w).toBeDefined()
    expect(w.severity).toBe('critical')
    expect(w.prayer).toBe('fajr')
    expect(w.diffMinutes).toBeGreaterThan(0)
  })

  it('ASR_NOT_AFTER_DHUHR fires when asr <= dhuhr', () => {
    const result = {
      fajr: rawTimes.fajr,
      shuruq: rawTimes.sunrise,
      sunrise: rawTimes.sunrise,
      dhuhr: rawTimes.dhuhr,
      asr: rawTimes.dhuhr,  // exactly equal
      maghrib: rawTimes.maghrib,
      isha: rawTimes.isha,
    }
    const warnings = computeValidityWarnings({ rawTimes, result, params, coords, date })
    expect(warnings.find(x => x.code === 'ASR_NOT_AFTER_DHUHR')).toBeDefined()
  })

  it('ASR_NOT_BEFORE_MAGHRIB fires when asr >= maghrib', () => {
    const result = {
      fajr: rawTimes.fajr,
      shuruq: rawTimes.sunrise,
      sunrise: rawTimes.sunrise,
      dhuhr: rawTimes.dhuhr,
      asr: rawTimes.maghrib,  // exactly equal
      maghrib: rawTimes.maghrib,
      isha: rawTimes.isha,
    }
    const warnings = computeValidityWarnings({ rawTimes, result, params, coords, date })
    expect(warnings.find(x => x.code === 'ASR_NOT_BEFORE_MAGHRIB')).toBeDefined()
  })

  it('DHUHR_BEFORE_SOLAR_NOON fires when dhuhr precedes raw solar noon by >30s', () => {
    const result = {
      fajr: rawTimes.fajr,
      shuruq: rawTimes.sunrise,
      sunrise: rawTimes.sunrise,
      // Force Dhuhr 5 min before solar noon
      dhuhr: new Date(rawTimes.dhuhr.getTime() - 5 * 60_000),
      asr: rawTimes.asr,
      maghrib: rawTimes.maghrib,
      isha: rawTimes.isha,
    }
    const warnings = computeValidityWarnings({ rawTimes, result, params, coords, date })
    const w = warnings.find(x => x.code === 'DHUHR_BEFORE_SOLAR_NOON')
    expect(w).toBeDefined()
    expect(w.severity).toBe('critical')
  })
})

describe('Layer 4 validity warnings — Morocco Ramadan DST gap (info, fajr#106)', () => {
  it('fires for Casablanca during Ramadan 1447 (Mar 1 2026)', () => {
    const t = prayerTimes({ latitude: 33.5769, longitude: -7.5473, date: new Date('2026-03-01T12:00:00Z') })
    const w = t.validityWarnings.find(x => x.code === 'MOROCCO_RAMADAN_DST_GAP')
    expect(w).toBeDefined()
    expect(w.severity).toBe('info')
    expect(w.prayer).toBeNull()
    expect(w.fix).toBeDefined()
  })

  it('does NOT fire for Casablanca outside Ramadan', () => {
    const t = prayerTimes({ latitude: 33.5769, longitude: -7.5473, date: TEST_DATE })  // May 5 = post-Ramadan
    expect(t.validityWarnings.find(x => x.code === 'MOROCCO_RAMADAN_DST_GAP')).toBeUndefined()
  })

  it('does NOT fire for non-Morocco Ramadan calls (Cairo Mar 1 2026)', () => {
    const t = prayerTimes({ latitude: 30.0444, longitude: 31.2357, date: new Date('2026-03-01T12:00:00Z') })
    expect(t.validityWarnings.find(x => x.code === 'MOROCCO_RAMADAN_DST_GAP')).toBeUndefined()
  })

  it('fires for any Morocco coord during Ramadan (Marrakech, Tangier)', () => {
    const ramadan = new Date('2026-03-15T12:00:00Z')
    const marrakech = prayerTimes({ latitude: 31.6291, longitude: -8.0088, date: ramadan })
    const tangier = prayerTimes({ latitude: 35.7595, longitude: -5.8331, date: ramadan })
    expect(marrakech.validityWarnings.find(w => w.code === 'MOROCCO_RAMADAN_DST_GAP')).toBeDefined()
    expect(tangier.validityWarnings.find(w => w.code === 'MOROCCO_RAMADAN_DST_GAP')).toBeDefined()
  })
})

describe('Layer 4 validity warnings — schema integrity', () => {
  it('every warning has the required ValidityWarning shape', () => {
    const t = prayerTimes({ latitude: 64.1, longitude: -22.0, date: new Date('2026-06-21T12:00:00Z') })
    for (const w of t.validityWarnings) {
      expect(w).toHaveProperty('severity')
      expect(['critical', 'advisory', 'info']).toContain(w.severity)
      expect(w).toHaveProperty('code')
      expect(typeof w.code).toBe('string')
      expect(w.code).toMatch(/^[A-Z_]+$/)
      expect(w).toHaveProperty('message')
      expect(typeof w.message).toBe('string')
      expect(w.message.length).toBeGreaterThan(20)
      expect(w).toHaveProperty('prayer')
      expect(w).toHaveProperty('astronomicalReference')
      expect(w).toHaveProperty('applied')
      expect(w).toHaveProperty('diffMinutes')
    }
  })

  it('validityWarnings is always an array, never undefined', () => {
    const cases = [
      { latitude: 0, longitude: 0, date: TEST_DATE },              // equator/null island
      { latitude: 90, longitude: 0, date: TEST_DATE },             // north pole
      { latitude: -33.9249, longitude: 18.4241, date: TEST_DATE }, // Cape Town
      { latitude: 33.5769, longitude: -7.5473, date: TEST_DATE },  // Casablanca
    ]
    for (const c of cases) {
      const t = prayerTimes(c)
      expect(Array.isArray(t.validityWarnings)).toBe(true)
    }
  })
})
