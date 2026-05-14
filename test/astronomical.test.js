// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { describe, it, expect } from 'vitest'
import { astronomical, prayerTimes } from '../src/index.js'

const MAY_5 = new Date('2026-05-05T12:00:00Z')
// Casablanca, Morocco — used for the Layer 4 fajr#100 motivating case
const CASABLANCA = { lat: 33.5769, lon: -7.5473 }
// Reykjavik, Iceland — high-latitude edge
const REYKJAVIK = { lat: 64.1, lon: -22.0 }

describe('astronomical() — Layer 1 primitives (fajr#101)', () => {
  it('returns an object with the documented shape', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    expect(a).toHaveProperty('solarNoon')
    expect(a).toHaveProperty('apparentSunrise')
    expect(a).toHaveProperty('apparentSunset')
    expect(a).toHaveProperty('fajrAt')
    expect(a).toHaveProperty('ishaAt')
    expect(a).toHaveProperty('asrAt')

    expect(a.solarNoon).toBeInstanceOf(Date)
    expect(a.apparentSunrise).toBeInstanceOf(Date)
    expect(a.apparentSunset).toBeInstanceOf(Date)
    expect(typeof a.fajrAt).toBe('function')
    expect(typeof a.ishaAt).toBe('function')
    expect(typeof a.asrAt).toBe('function')
  })

  it('Casablanca May 5 2026 — solar noon ≈ 12:30 UTC', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    // Casablanca longitude -7.55°, so solar noon ≈ UTC + (longitude/15h)
    // ≈ 12:00 + 30 min = 12:30 UTC. Allow ±5 min for EoT.
    const utcMin = a.solarNoon.getUTCHours() * 60 + a.solarNoon.getUTCMinutes()
    expect(utcMin).toBeGreaterThan(12 * 60 + 25)
    expect(utcMin).toBeLessThan(12 * 60 + 35)
  })

  it('apparent sunrise < solar noon < apparent sunset (basic ordering)', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    expect(a.apparentSunrise.getTime()).toBeLessThan(a.solarNoon.getTime())
    expect(a.solarNoon.getTime()).toBeLessThan(a.apparentSunset.getTime())
  })

  it('fajrAt(steeper) is earlier than fajrAt(shallower)', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    const f19 = a.fajrAt(19.5)  // Egyptian — deepest, earliest
    const f18 = a.fajrAt(18)    // MWL
    const f15 = a.fajrAt(15)    // ISNA — shallowest, latest
    expect(f19.getTime()).toBeLessThan(f18.getTime())
    expect(f18.getTime()).toBeLessThan(f15.getTime())
  })

  it('ishaAt(deeper) is later than ishaAt(shallower)', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    const i17 = a.ishaAt(17)
    const i15 = a.ishaAt(15)
    const i12 = a.ishaAt(12)
    expect(i17.getTime()).toBeGreaterThan(i15.getTime())
    expect(i15.getTime()).toBeGreaterThan(i12.getTime())
  })

  it('asrAt(2) is later than asrAt(1) (Hanafi later than standard)', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    const standard = a.asrAt(1)
    const hanafi = a.asrAt(2)
    expect(hanafi.getTime()).toBeGreaterThan(standard.getTime())
  })

  it('asrAt is between solar noon and apparent sunset', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    const asr = a.asrAt(1)
    expect(asr.getTime()).toBeGreaterThan(a.solarNoon.getTime())
    expect(asr.getTime()).toBeLessThan(a.apparentSunset.getTime())
  })

  it('apparentSunset is close to prayerTimes().sunset (within method-rounding window)', () => {
    const pt = prayerTimes({ latitude: CASABLANCA.lat, longitude: CASABLANCA.lon, date: MAY_5 })
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    // prayerTimes() applies ihtiyat-aware UP rounding to sunset; astronomical()
    // returns unrounded. The diff should be < 2 minutes (one round-up bucket
    // plus any method-specific sunset adjustment some presets carry — Türkiye
    // Diyanet's adhan-preset adjustments include sunrise:-7 / maghrib:+7
    // type offsets that can ripple to sunset depending on the dispatch).
    const sunsetDiff = Math.abs(pt.sunset.getTime() - a.apparentSunset.getTime())
    expect(sunsetDiff).toBeLessThan(120_000)
  })

  it('accessor functions are pure — multiple calls return equal Dates', () => {
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    expect(a.fajrAt(18).getTime()).toBe(a.fajrAt(18).getTime())
    expect(a.ishaAt(17).getTime()).toBe(a.ishaAt(17).getTime())
    expect(a.asrAt(1).getTime()).toBe(a.asrAt(1).getTime())
  })

  it('handles high-latitude edge — Reykjavik June 21', () => {
    const a = astronomical(REYKJAVIK.lat, REYKJAVIK.lon, new Date('2026-06-21T12:00:00Z'))
    // At 64°N June 21, the sun does not reach 18° depression — adhan returns
    // Invalid Date. astronomical() exposes this honestly rather than
    // synthesising. Caller is responsible for handling.
    const f18 = a.fajrAt(18)
    // Either a valid Date or an Invalid Date — both are honest representations
    // of "the astronomical event at this angle on this date at this latitude".
    expect(f18).toBeInstanceOf(Date)
  })

  it('no institutional offsets applied — solar noon precedes Dhuhr if a method adds zawal-ihtiyati', () => {
    // Morocco default has +5 min Dhuhr zawal-ihtiyati; astronomical().solarNoon
    // should be ~5 min EARLIER than prayerTimes().dhuhr.
    const pt = prayerTimes({ latitude: CASABLANCA.lat, longitude: CASABLANCA.lon, date: MAY_5 })
    const a = astronomical(CASABLANCA.lat, CASABLANCA.lon, MAY_5)
    const dhuhrMin = pt.dhuhr.getTime() / 60_000
    const noonMin = a.solarNoon.getTime() / 60_000
    expect(dhuhrMin - noonMin).toBeGreaterThan(3)  // method Dhuhr has +5 buffer
    expect(dhuhrMin - noonMin).toBeLessThan(7)
  })
})
