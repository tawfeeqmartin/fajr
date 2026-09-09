// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
import { describe, expect, it } from 'vitest'
import { prayerTimes, featureInfo } from '../src/index.js'

const date = new Date('2026-05-05T12:00:00Z')
const locations = [
  { latitude: 33.5769, longitude: -7.5473 }, // Morocco country calibration
  { latitude: 36.34, longitude: 43.13 }, // Mosul institutional override
  { latitude: 0, longitude: -140 }, // fallback
]

describe('Automatic method setting', () => {
  it.each(locations)('resets to detected dispatch at %j', location => {
    const params = { ...location, date }
    const automatic = prayerTimes(params)
    for (const setting of [
      { method: 'auto' },
      { override: { method: 'auto' } },
      { method: 'ISNA', override: { method: 'auto' } },
    ]) expect(prayerTimes({ ...params, ...setting })).toEqual(automatic)
  })

  it('honors a grouped explicit method over top-level auto', () => {
    const params = { ...locations[0], date }
    expect(prayerTimes({ ...params, method: 'auto', override: { method: 'Karachi' } }))
      .toEqual(prayerTimes({ ...params, method: 'Karachi' }))
  })

  it.each(featureInfo('methodOverride').values.map(({ value }) => value))('supports advertised setting %s', method => {
    const result = prayerTimes({ ...locations[0], date, override: { method } })
    expect(result.method).not.toContain('unrecognised')
    expect(result.location.methodSource).toBe(method === 'auto' ? 'country-default' : 'caller-explicit')
    expect(Number.isFinite(result.fajr.getTime())).toBe(true)
  })
})
