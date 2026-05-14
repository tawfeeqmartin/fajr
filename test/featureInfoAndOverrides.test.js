// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Public API tests for fajr#40: structured settings metadata and explicit
 * caller override hooks.
 */

import { describe, it, expect } from 'vitest'
import fajr, { featureInfo, features, prayerTimes } from '../src/index.js'

const DATE = new Date('2026-06-21T12:00:00Z')

describe('#40 — structured feature metadata', () => {
  it('exports features() and featureInfo() as named and default APIs', () => {
    expect(typeof features).toBe('function')
    expect(typeof featureInfo).toBe('function')
    expect(typeof fajr.features).toBe('function')
    expect(typeof fajr.featureInfo).toBe('function')
  })

  it('lists stable settings keys for downstream apps', () => {
    expect(features()).toEqual([
      'methodOverride',
      'asrConventionOverride',
      'elevationOverride',
      'tayakkunBuffer',
      'tarabishyMethod',
    ])
  })

  it('returns structured layman/technical/citation metadata for Asr convention', () => {
    const info = featureInfo('asrConventionOverride')
    expect(info).toMatchObject({
      key: 'asrConventionOverride',
      kind: 'radio',
      default: 'auto',
      citation: 'https://github.com/tawfeeqmartin/fajr/blob/master/docs/positions.md#product-guidance',
    })
    expect(info.layman).toMatch(/standard 1x shadow or Hanafi 2x shadow/i)
    expect(info.values.map(v => v.value)).toEqual(['auto', 'standard', 'hanafi'])
  })

  it('returns a clone so consumers cannot mutate the shared metadata', () => {
    const first = featureInfo('methodOverride')
    first.values[0].label = 'Changed'
    const second = featureInfo('methodOverride')
    expect(second.values[0].label).toBe('Automatic')
  })

  it('returns null for unknown feature keys', () => {
    expect(featureInfo('not-a-feature')).toBeNull()
  })

  it('returns null for inherited/prototype property names', () => {
    expect(featureInfo('toString')).toBeNull()
    expect(featureInfo('constructor')).toBeNull()
    expect(featureInfo('__proto__')).toBeNull()
  })
})

describe('#40 — prayerTimes override object', () => {
  it('override.method takes priority over the auto-detected method and legacy method param', () => {
    const r = prayerTimes({
      latitude: 33.5731,
      longitude: -7.5898,
      date: DATE,
      method: 'Morocco',
      override: { method: 'Diyanet' },
    })
    expect(r.location.country).toBe('Morocco')
    expect(r.location.methodSource).toBe('caller-explicit')
    expect(r.method).toMatch(/Diyanet/)
    expect(r.method).not.toMatch(/Morocco/)
  })

  it('override.asrConvention=hanafi changes the actual Asr calculation and provenance', () => {
    const auto = prayerTimes({ latitude: 24.8607, longitude: 67.0011, date: DATE })
    const hanafi = prayerTimes({
      latitude: 24.8607,
      longitude: 67.0011,
      date: DATE,
      override: { asrConvention: 'hanafi' },
    })

    const diffMin = (hanafi.asr.getTime() - auto.asr.getTime()) / 60000
    expect(diffMin).toBeGreaterThan(30)
    expect(hanafi.location.asrConvention).toBe('hanafi')
    expect(hanafi.location.asrConventionSource).toBe('caller-explicit')
    expect(hanafi.location.madhabSource).toBe('caller-explicit')
    expect(hanafi.applied.asrSchool).toBe('hanafi')
    expect(hanafi.applied.madhab).toBe('hanafi')
    expect(hanafi.notes.some(n => n.includes('Asr convention override applied'))).toBe(true)
    expect(hanafi.notes.some(n => n.includes('Asr-convention advisory'))).toBe(false)
  })

  it('override.asrConvention=standard can explicitly decline a Hanafi country metadata default', () => {
    const r = prayerTimes({
      latitude: 24.8607,
      longitude: 67.0011,
      date: DATE,
      override: { asrConvention: 'standard' },
    })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('caller-explicit')
    expect(r.applied.asrSchool).toBe('standard')
    expect(r.notes.some(n => n.includes('Asr-convention advisory'))).toBe(false)
  })

  it('override.madhab remains accepted as a deprecated Asr-convention alias', () => {
    const r = prayerTimes({
      latitude: 33.5731,
      longitude: -7.5898,
      date: DATE,
      override: { madhab: 'hanafi' },
    })
    expect(r.location.asrConvention).toBe('hanafi')
    expect(r.applied.asrSchool).toBe('hanafi')
  })

  it('override.elevation=0 suppresses city-registry elevation correction', () => {
    const auto = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: DATE })
    const uniformCity = prayerTimes({
      latitude: 24.7136,
      longitude: 46.6753,
      date: DATE,
      override: { elevation: 0 },
    })
    expect(auto.location.elevationSource).toBe('city-registry')
    expect(auto.corrections.elevation).toBe(true)
    expect(uniformCity.location.elevation).toBe(0)
    expect(uniformCity.location.elevationSource).toBe('caller-explicit')
    expect(uniformCity.corrections.elevation).toBe(false)
    expect(uniformCity.corrections.elevationCorrectionMin).toBeUndefined()
  })

  it('override.elevation takes priority over the city registry and legacy elevation param', () => {
    const r = prayerTimes({
      latitude: 24.7136,
      longitude: 46.6753,
      date: DATE,
      elevation: 0,
      override: { elevation: 612 },
    })
    expect(r.location.elevation).toBe(612)
    expect(r.location.elevationSource).toBe('caller-explicit')
    expect(r.corrections.elevation).toBe(true)
    expect(r.corrections.elevationCorrectionMin).toBeGreaterThan(0)
  })
})
