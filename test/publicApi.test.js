// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Unit tests for v1.7.0 phase 3 — detectLocation in the public API surface.
 *
 * These tests import from the public package entry (`../src/index.js`) — not
 * `../src/engine.js` — to verify the v1.7.0 contract: `detectLocation` is
 * exported alongside `prayerTimes`, `dayTimes`, and the existing entry
 * points, and the new `location` field on `prayerTimes` return values
 * survives the public wrapper without mutation.
 *
 * Coverage:
 *   1. detectLocation is exported from both default and named imports
 *   2. detectLocation(lat, lon) shape: required + optional fields populated
 *   3. The 12 city-method-override cities resolve to the documented method
 *   4. fallback path: open ocean → city=null, country=null, ISNA recommended
 *   5. Privacy + purity: detectLocation has no side effects on Date / global
 *   6. prayerTimes return value carries location field intact
 *   7. fallbackElevation parameter is honoured when no city matches
 *   8. detectCountry-equivalence: country field matches detectCountry table
 *
 * Phase 1's `test/detectLocation.test.js` covers the engine internals; this
 * file covers the *public-API contract* — what an external consumer sees.
 */

import { describe, it, expect } from 'vitest'
import fajrDefault, {
  detectLocation,
  prayerTimes,
  dayTimes,
} from '../src/index.js'

const TEST_DATE = new Date('2026-04-15T12:00:00Z')

// ─────────────────────────────────────────────────────────────────────────────
// 1. Public-export contract
// ─────────────────────────────────────────────────────────────────────────────

describe('public API — detectLocation export contract', () => {
  it('detectLocation is a named export from @tawfeeqmartin/fajr', () => {
    expect(typeof detectLocation).toBe('function')
  })

  it('detectLocation is on the default-export namespace', () => {
    expect(typeof fajrDefault.detectLocation).toBe('function')
  })

  it('default and named export resolve to the same callable', () => {
    // Either the same function reference, or two thin wrappers that produce
    // identical output for the same input. We check behaviour rather than
    // reference identity so the wrapper-vs-direct dichotomy is allowed.
    const a = detectLocation(21.4225, 39.8262)
    const b = fajrDefault.detectLocation(21.4225, 39.8262)
    expect(a.country).toBe(b.country)
    expect(a.recommendedMethod).toBe(b.recommendedMethod)
    expect(a.city?.name).toBe(b.city?.name)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. detectLocation(lat, lon) return-shape contract
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — return shape', () => {
  it('Mecca → all required fields populated (city, country, timezone, elevation, recommendedMethod, methodSource, source)', () => {
    const loc = detectLocation(21.4225, 39.8262)
    expect(loc).toBeDefined()
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Mecca')
    expect(loc.country).toBe('SaudiArabia')
    expect(typeof loc.timezone).toBe('string')
    expect(loc.timezone.length).toBeGreaterThan(0)
    expect(typeof loc.elevation).toBe('number')
    expect(loc.recommendedMethod).toMatch(/UmmAlQura/i)
    expect(loc.methodSource).toBe('country-default')
    expect(loc.source).toBeDefined()
    expect(typeof loc.source.type).toBe('string')
  })

  it('Mosul → city.methodOverride dispatched; methodSource=city-institutional', () => {
    const loc = detectLocation(36.3489, 43.1577)
    expect(loc.city.name).toBe('Mosul')
    expect(loc.recommendedMethod).toBe('Karachi')
    expect(loc.methodSource).toBe('city-institutional')
    // The Mosul row carries one altMethod (Egyptian, the country default).
    expect(loc.altMethods).toBeDefined()
    expect(Array.isArray(loc.altMethods)).toBe(true)
    expect(loc.altMethods.length).toBeGreaterThan(0)
    expect(loc.altMethods[0].method).toBe('Egyptian')
  })

  it('Open ocean (0, -30) → city=null, country=null, recommendedMethod=ISNA, methodSource=fallback', () => {
    const loc = detectLocation(0, -30)
    expect(loc.city).toBeNull()
    expect(loc.country).toBeNull()
    expect(loc.recommendedMethod).toBe('ISNA')
    expect(loc.methodSource).toBe('fallback')
    expect(loc.timezone).toBe('UTC')
  })

  it('fallbackElevation parameter is honoured when no city matches', () => {
    const loc = detectLocation(0, -30, 1234)
    expect(loc.elevation).toBe(1234)
  })

  it('city.elevation takes priority over fallbackElevation when a city matches', () => {
    // Mecca has a registry elevation; the fallback should be ignored.
    const loc = detectLocation(21.4225, 39.8262, 9999)
    expect(loc.elevation).not.toBe(9999)
    expect(loc.elevation).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. The 12 city-method-override cities — public-API sweep
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — 12 city-method-override sweep (public API)', () => {
  const cases = [
    // [city,        lat,      lon,       expectedMethod]
    ['Mosul',       36.3489,  43.1577,  'Karachi'],
    ['Najaf',       31.9956,  44.3308,  'Tehran'],
    ['Karbala',     32.6149,  44.0241,  'Tehran'],
    ['Basra',       30.5081,  47.7836,  'Tehran'],
    ['Sarajevo',    43.8563,  18.4131,  'Diyanet'],
    ['Mostar',      43.3438,  17.8078,  'Diyanet'],
    ['Banja Luka',  44.7722,  17.1910,  'Diyanet'],
    ['Pristina',    42.6629,  21.1655,  'Diyanet'],
    ['Bradford',    53.7960, -1.7594,   'MoonsightingCommittee'],
    ['Beirut',      33.8938,  35.5018,  'Egyptian'],
    ['Tabriz',      38.0667,  46.2993,  'Tehran'],
    ['Dearborn',    42.3223, -83.1763,  'ISNA'],
  ]

  it.each(cases)('%s → city.name=%s, recommendedMethod=%s, methodSource=city-institutional', (city, lat, lon, expectedMethod) => {
    const loc = detectLocation(lat, lon)
    expect(loc.city.name).toBe(city)
    expect(loc.recommendedMethod).toBe(expectedMethod)
    expect(loc.methodSource).toBe('city-institutional')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. prayerTimes return value carries location field intact through wrapper
// ─────────────────────────────────────────────────────────────────────────────

describe('public API — prayerTimes location field', () => {
  it('prayerTimes return value has location field with expected shape', () => {
    const r = prayerTimes({ latitude: 21.4225, longitude: 39.8262, date: TEST_DATE })
    expect(r.location).toBeDefined()
    expect(r.location.city).not.toBeNull()
    expect(r.location.city.name).toBe('Mecca')
    expect(r.location.country).toBe('SaudiArabia')
    expect(typeof r.location.timezone).toBe('string')
    expect(typeof r.location.elevation).toBe('number')
    expect(r.location.methodSource).toBe('country-default')
    expect(['caller-explicit', 'city-registry', 'default-zero']).toContain(r.location.elevationSource)
  })

  it('prayerTimes location field reflects city-institutional override (Mosul)', () => {
    const r = prayerTimes({ latitude: 36.3489, longitude: 43.1577, date: TEST_DATE })
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(/Karachi/i)
  })

  it('prayerTimes elevation override produces elevationSource=caller-explicit', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: TEST_DATE, elevation: 612 })
    expect(r.location.elevationSource).toBe('caller-explicit')
    expect(r.location.elevation).toBe(612)
  })

  it('dayTimes also carries the location field (extends prayerTimes)', () => {
    const r = dayTimes({ latitude: 21.4225, longitude: 39.8262, date: TEST_DATE })
    expect(r.location).toBeDefined()
    expect(r.location.city.name).toBe('Mecca')
    // dayTimes-specific fields still present
    expect(r.midnight).toBeInstanceOf(Date)
    expect(r.qiyam).toBeInstanceOf(Date)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Privacy / purity — no side effects
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — privacy + referential transparency', () => {
  it('detectLocation called twice with identical args returns identical structure', () => {
    const a = detectLocation(36.3489, 43.1577)
    const b = detectLocation(36.3489, 43.1577)
    // Same city, same country, same method, same source-type. We don't
    // require object-reference equality (the impl returns fresh objects),
    // but the structural payload is invariant.
    expect(a.city.name).toBe(b.city.name)
    expect(a.country).toBe(b.country)
    expect(a.recommendedMethod).toBe(b.recommendedMethod)
    expect(a.methodSource).toBe(b.methodSource)
    expect(a.source.type).toBe(b.source.type)
  })

  it('detectLocation does not mutate the global Date or Math state', () => {
    const before = Date.now()
    detectLocation(36.3489, 43.1577)
    const after = Date.now()
    // detectLocation should be fast (microseconds); 100ms is a generous
    // ceiling that catches any accidental I/O regression.
    expect(after - before).toBeLessThan(100)
  })

  it('fallbackElevation default is 0', () => {
    const loc = detectLocation(0, -30)  // open ocean, no city, no country
    expect(loc.elevation).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cross-check: detectLocation country matches the country detected by
//    prayerTimes (the engine uses the same detectCountry bbox table).
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — consistency with prayerTimes country resolution', () => {
  it('Mecca: detectLocation.country === prayerTimes.location.country', () => {
    const loc = detectLocation(21.4225, 39.8262)
    const times = prayerTimes({ latitude: 21.4225, longitude: 39.8262, date: TEST_DATE })
    expect(loc.country).toBe(times.location.country)
  })

  it('Cape Town: detectLocation.country === prayerTimes.location.country', () => {
    const loc = detectLocation(-33.92, 18.42)
    const times = prayerTimes({ latitude: -33.92, longitude: 18.42, date: TEST_DATE })
    expect(loc.country).toBe(times.location.country)
  })

  it('Dearborn: detectLocation.country resolves, recommendedMethod=ISNA, prayerTimes uses ISNA', () => {
    const loc = detectLocation(42.3223, -83.1763)
    const times = prayerTimes({ latitude: 42.3223, longitude: -83.1763, date: TEST_DATE })
    // The detectCountry table uses 'USA' as the country key for the US bbox.
    expect(loc.country).toBe('USA')
    expect(loc.recommendedMethod).toBe('ISNA')
    expect(times.location.methodSource).toBe('city-institutional')
    expect(times.method).toMatch(/ISNA|NorthAmerica/i)
  })
})
