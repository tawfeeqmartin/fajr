// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { describe, expect, it } from 'vitest'
import * as adhan from 'adhan'
import { astronomical, prayerTimes } from '../src/index.js'
import { computeValidityWarnings } from '../src/validity.js'

const date = new Date('2026-05-05T12:00:00Z')

function scenario(latitude = 33.5769, longitude = -7.5473) {
  const coords = new adhan.Coordinates(latitude, longitude)
  const params = adhan.CalculationMethod.Turkey()
  params.rounding = adhan.Rounding.None
  const rawTimes = new adhan.PrayerTimes(coords, date, params)
  const result = { ...rawTimes, shuruq: rawTimes.sunrise }
  return { coords, params, rawTimes, result, date }
}

describe('validity at astronomical and polar boundaries', () => {
  it('does not treat the Diyanet Dhuhr buffer as astronomical solar noon', () => {
    const s = scenario()
    const noon = astronomical(s.coords.latitude, s.coords.longitude, date).solarNoon
    s.result.dhuhr = new Date(+noon + 60_000)
    expect(computeValidityWarnings(s).map(w => w.code)).not.toContain('DHUHR_BEFORE_SOLAR_NOON')
  })

  it('detects pre-noon Dhuhr even when method and caller offsets move the reference earlier', () => {
    const s = scenario()
    s.params.adjustments.dhuhr = -8
    s.rawTimes = new adhan.PrayerTimes(s.coords, date, s.params)
    s.result = { ...s.rawTimes, shuruq: s.rawTimes.sunrise }
    const noon = astronomical(s.coords.latitude, s.coords.longitude, date).solarNoon
    const warning = computeValidityWarnings(s).find(w => w.code === 'DHUHR_BEFORE_SOLAR_NOON')
    expect(warning).toMatchObject({ severity: 'critical', astronomicalReference: noon.toISOString(), diffMinutes: -3 })
  })

  it('still flags Fajr after sunrise above 60 degrees with a configured high-latitude rule', () => {
    const s = scenario(64, 20)
    s.result.fajr = new Date(+s.result.shuruq + 12 * 60_000)
    expect(computeValidityWarnings(s).map(w => w.code)).toContain('FAJR_AFTER_SHURUQ')
  })

  it.each(['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'])('reports an invalid %s date without crashing', prayer => {
    const s = scenario(64, 20)
    s.result[prayer] = new Date(NaN)
    const warnings = computeValidityWarnings(s)
    expect(warnings).toContainEqual(expect.objectContaining({
      code: 'PRAYER_TIME_UNAVAILABLE', severity: 'critical', prayer, applied: null,
    }))
    expect(warnings.filter(w => w.prayer === prayer && w.code.endsWith('_HIGH_LAT_RULE_APPLIED'))).toEqual([])
    expect(() => JSON.stringify(warnings)).not.toThrow()
  })

  it('does not describe a TwilightAngle calculation as the middle-of-night rule', () => {
    const times = prayerTimes({ latitude: 66, longitude: 20, date: new Date('2026-06-12T12:00:00Z'), elevation: 0 })
    expect(times.method).toContain('TwilightAngle')
    expect(times.notes.join(' ')).not.toContain('middle-of-night')
    expect(times.validityWarnings.filter(w => w.code.endsWith('_HIGH_LAT_RULE_APPLIED'))).toEqual([])
  })

  it('retains general high-latitude disclosure for finite results under other methods', () => {
    const times = prayerTimes({ latitude: 61.2181, longitude: -149.9003, date, elevation: 0 })
    expect(times.notes.join(' ')).toContain('High-latitude regime')
    expect(times.notes.join(' ')).toContain(times.method)
    expect(times.notes.join(' ')).not.toContain('middle-of-night')
  })

  it('retains the narrow-gap note for finite middle-of-night results', () => {
    const times = prayerTimes({ latitude: 64.1466, longitude: -21.9426, date: new Date('2026-07-12T12:00:00Z'), elevation: 0 })
    expect(times.method).toContain('MiddleOfTheNight')
    expect(times.notes.join(' ')).toContain('middle-of-night')
  })

  it.each([
    [66, '2026-06-12'],
    [66.5, '2026-06-06'],
    [67, '2026-06-02'],
    [68, '2026-05-26'],
    [69, '2026-05-21'],
  ])('returns warnings instead of throwing on the last sunset before polar day at %s degrees', (latitude, day) => {
    const times = prayerTimes({ latitude, longitude: 20, date: new Date(day + 'T12:00:00Z'), elevation: 0 })
    expect(Number.isFinite(+times.sunset)).toBe(true)
    expect(times.validityWarnings).toContainEqual(expect.objectContaining({
      code: 'PRAYER_TIME_UNAVAILABLE', severity: 'critical',
    }))
  })
})
