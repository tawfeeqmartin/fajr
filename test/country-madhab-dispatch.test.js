// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Tests for v1.7.22 #83/#88 — country→Asr-convention dispatch table.
 *
 * Fixes the v1.7.21 adhan-preset leak where every country reported
 * `madhab: 'shafii'` regardless of institutional convention. Now
 * Hanafi-majority countries return location.asrConvention='hanafi' as metadata,
 * while applied.asrSchool remains tied to the selected timetable method
 * unless an explicit calculation override is used.
 */

import { describe, it, expect } from 'vitest'
import { prayerTimes } from '../src/index.js'

describe('#83 — Hanafi-majority country dispatch', () => {
  const HANAFI_CITIES = [
    ['Karachi PK',   24.8607, 67.0011],
    ['Dhaka BD',     23.8103, 90.4125],
    ['Istanbul TR',  41.0082, 28.9784],
    ['Tirana AL',    41.3275, 19.8189],
    ['Tashkent UZ',  41.3111, 69.2401],
    ['Almaty KZ',    43.2220, 76.8512],
    ['Bishkek KG',   42.8746, 74.5698],
    ['Sarajevo BA',  43.8563, 18.4131],
    ['Pristina XK',  42.6629, 21.1655],
    ['Skopje MK',    41.9981, 21.4254],
    ['Kabul AF',     34.5553, 69.2075],
    ['Mumbai IN',    19.0760, 72.8777],
    ['Delhi IN',     28.6139, 77.2090],
  ]

  for (const [name, lat, lon] of HANAFI_CITIES) {
    it(`${name} → asrConvention='hanafi' / asrConventionSource='country-default'`, () => {
      const r = prayerTimes({ latitude: lat, longitude: lon, date: new Date('2026-05-04') })
      expect(r.location.asrConvention).toBe('hanafi')
      expect(r.location.asrConventionSource).toBe('country-default')
      // Legacy aliases remain for v1.7.21 consumers.
      expect(r.location.madhab).toBe('hanafi')
      expect(r.location.madhabSource).toBe('country-default')
      expect(r.applied.asrSchool).toBe('standard')
      expect(r.applied.madhab).toBe('shafii')
    })
  }
})

describe('#83/#88 — standard-Asr country dispatch', () => {
  const STANDARD_CITIES = [
    ['Jakarta ID',   -6.2088, 106.8456],
    ['KL MY',         3.1390, 101.6869],
    ['Singapore',     1.3521, 103.8198],
    ['Malé MV',       4.1755,  73.5093],   // also explicit-Shafi composition
    ['Colombo LK',    6.9271,  79.8612],   // also explicit-Shafi composition
    ['Sanaa YE',     15.3694,  44.1910],
    ['Mogadishu SO',  2.0469,  45.3182],
    ['Bandar Seri Begawan BN', 4.9031, 114.9398],
  ]

  for (const [name, lat, lon] of STANDARD_CITIES) {
    it(`${name} → asrConvention='standard'`, () => {
      const r = prayerTimes({ latitude: lat, longitude: lon, date: new Date('2026-05-04') })
      expect(r.location.asrConvention).toBe('standard')
      // Deprecated alias maps standard 1× Asr to adhan.js's historic label.
      expect(r.location.madhab).toBe('shafii')
      expect(r.applied.asrSchool).toBe('standard')
      expect(r.applied.madhab).toBe('shafii')
    })
  }
})

describe('#83 — mixed/leave-default countries fall through to method-implied', () => {
  const FALLTHROUGH_CITIES = [
    ['Cairo EG',      30.0626, 31.2497],
    ['Mecca SA',      21.4225, 39.8262],
    ['Beirut LB',     33.8938, 35.5018],
    ['Baghdad IQ',    33.3152, 44.3661],   // (Mosul/Najaf/Karbala have city overrides)
    ['Casablanca MA', 33.5731, -7.5898],
    ['Tunis TN',      36.8065, 10.1815],
    ['Algiers DZ',    36.7538,  3.0588],
    ['London UK',     51.5074, -0.1278],
    ['New York US',   40.7128, -74.0060],
    ['Paris FR',      48.8566,  2.3522],
    ['Sydney AU',    -33.8688, 151.2093],
  ]

  for (const [name, lat, lon] of FALLTHROUGH_CITIES) {
    it(`${name} → asrConventionSource='method-implied' (no country override)`, () => {
      const r = prayerTimes({ latitude: lat, longitude: lon, date: new Date('2026-05-04') })
      expect(r.location.asrConventionSource).toBe('method-implied')
      expect(r.location.madhabSource).toBe('method-implied')
    })
  }

  it('Morocco exposes standard Asr convention without claiming Shafi legal madhhab', () => {
    const r = prayerTimes({ latitude: 33.5731, longitude: -7.5898, date: new Date('2026-05-04') })
    expect(r.location.country).toBe('Morocco')
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.disclaimer).toContain('Asr convention')
    expect(r.disclaimer).not.toContain('madhab + elevation')
  })
})

describe('#83 — explicit-Shafi composition (Maldives / Sri Lanka / KarachiShafi cities) preserved', () => {
  it('Malé MV preserves explicit Shafi composition; asrConventionSource=method-implied', () => {
    const r = prayerTimes({ latitude: 4.1755, longitude: 73.5093, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('shafii')
    expect(r.location.madhabSource).toBe('method-implied')
    // methodName carries the '+ Shafi Asr' explicit-composition marker
    expect(r.method).toMatch(/\+ Shafi Asr/)
  })

  it('Colombo LK preserves explicit Shafi composition', () => {
    const r = prayerTimes({ latitude: 6.9271, longitude: 79.8612, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('shafii')
    expect(r.location.madhabSource).toBe('method-implied')
    expect(r.method).toMatch(/\+ Shafi Asr/)
  })

  it('Kochi IN city-override (KarachiShafi) preserves Shafi despite India being Hanafi-default', () => {
    const r = prayerTimes({ latitude: 9.9312, longitude: 76.2673, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('shafii')
    expect(r.location.madhabSource).toBe('method-implied')
    expect(r.method).toMatch(/\+ Shafi Asr/)
  })
})

describe('#83/#85 — metadata does not silently shift Asr calculation', () => {
  it('Karachi PK reports Hanafi metadata but keeps method-implied standard Asr', () => {
    // Country-level madhab metadata is useful for UX, but #85 split it from
    // calculation-facing Asr because blanket 2× shadow mutation regressed
    // current institutional fixtures. Karachi and KarachiShafi should remain
    // effectively identical until a caller-explicit Asr override lands.
    const date = new Date('2026-06-21T00:00:00Z')  // summer solstice — biggest Asr gap
    const auto = prayerTimes({ latitude: 24.8607, longitude: 67.0011, date })
    const shafii = prayerTimes({ latitude: 24.8607, longitude: 67.0011, date, method: 'KarachiShafi' })
    const diffMin = (auto.asr.getTime() - shafii.asr.getTime()) / 60000
    expect(auto.location.asrConvention).toBe('hanafi')
    expect(auto.location.asrConventionSource).toBe('country-default')
    expect(auto.location.madhab).toBe('hanafi')
    expect(auto.location.madhabSource).toBe('country-default')
    expect(auto.applied.asrSchool).toBe('standard')
    expect(auto.applied.madhab).toBe('shafii')
    expect(auto.notes.some(note => note.includes('Asr-convention advisory'))).toBe(true)
    expect(Math.abs(diffMin)).toBeLessThanOrEqual(1)
  })
})

describe('#83 — caller-explicit method bypasses COUNTRY_ASR_CONVENTION', () => {
  it('Pakistan + caller method=ISNA → asrConventionSource=method-implied (not country-default)', () => {
    const r = prayerTimes({ latitude: 24.8607, longitude: 67.0011, date: new Date('2026-05-04'), method: 'ISNA' })
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhabSource).toBe('method-implied')
    // ISNA preset uses Shafi (adhan default); caller-explicit path doesn't
    // consult COUNTRY_ASR_CONVENTION so Pakistan's Hanafi default doesn't fire.
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.madhab).toBe('shafii')
  })
})
