// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Tests for v1.7.21 #81 — "best guess" framing surface:
 *   - location.asrConvention + location.asrConventionSource
 *   - applied: { method, asrSchool, elevationMin } summary object
 *   - disclaimer: turn-key user-facing copy
 */

import { describe, it, expect } from 'vitest'
import { prayerTimes } from '../src/index.js'

describe('#81/#88 — location Asr-convention provenance', () => {
  it('Riyadh SA (Umm al-Qura preset, standard Asr default)', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    // Deprecated aliases remain for v1.7.21 consumers.
    expect(r.location.madhab).toBe('shafii')
    expect(r.location.madhabSource).toBe('method-implied')
  })

  it('Karachi PK (v1.7.22 #83/#85: Hanafi metadata, standard applied Asr)', () => {
    // v1.7.21 used to return shafii/method-implied because of the adhan
    // preset leak. v1.7.22 fixes the metadata while #85 keeps the actual
    // Asr calculation method-implied until caller-side override lands.
    const r = prayerTimes({ latitude: 24.86, longitude: 67.01, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('hanafi')
    expect(r.location.asrConventionSource).toBe('country-default')
    expect(r.location.madhab).toBe('hanafi')
    expect(r.location.madhabSource).toBe('country-default')
    expect(r.applied.asrSchool).toBe('standard')
    expect(r.applied.madhab).toBe('shafii')
  })

  it('Malé MV (KarachiShafi explicit override; correctly matches population)', () => {
    const r = prayerTimes({ latitude: 4.1755, longitude: 73.5093, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('shafii')
    // Source is still 'method-implied' because the explicit composition in
    // selectMethod produces a single method with baked-in Shafi madhab.
    expect(r.location.madhabSource).toBe('method-implied')
  })

  it('open ocean (no city, no country, fallback method)', () => {
    const r = prayerTimes({ latitude: 0, longitude: -120, date: new Date('2026-05-04') })
    expect(r.location.country).toBeNull()
    expect(r.location.methodSource).toBe('fallback')
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('shafii')  // ISNA default
    expect(r.location.madhabSource).toBe('method-implied')
  })
})

describe('#81/#88 — applied dispatch summary', () => {
  it('always present, with method + asrSchool + elevationMin', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: new Date('2026-05-04') })
    expect(r.applied).toBeDefined()
    expect(typeof r.applied.method).toBe('string')
    expect(r.applied.method.length).toBeGreaterThan(0)
    expect(['standard', 'hanafi']).toContain(r.applied.asrSchool)
    expect(['shafii', 'hanafi']).toContain(r.applied.madhab)
    expect(typeof r.applied.elevationMin).toBe('number')
    expect(r.applied.elevationMin).toBeGreaterThanOrEqual(0)
  })

  it('elevationMin > 0 when city-registry has non-zero elevation (Riyadh ~612m)', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: new Date('2026-05-04') })
    expect(r.location.elevationSource).toBe('city-registry')
    expect(r.location.elevation).toBeGreaterThan(500)
    expect(r.applied.elevationMin).toBeGreaterThan(2)
    expect(r.applied.elevationMin).toBeLessThan(5)
  })

  it('elevationMin === 0 at sea level (open ocean)', () => {
    const r = prayerTimes({ latitude: 0, longitude: -120, date: new Date('2026-05-04') })
    expect(r.applied.elevationMin).toBe(0)
  })

  it('applied.method matches result.method (single canonical label)', () => {
    const r = prayerTimes({ latitude: 41.01, longitude: 28.98, date: new Date('2026-05-04') })
    expect(r.applied.method).toBe(r.method)
  })
})

describe('#81 — disclaimer copy', () => {
  it('always present, contains "best guess" framing', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: new Date('2026-05-04') })
    expect(typeof r.disclaimer).toBe('string')
    expect(r.disclaimer).toContain('best guess')
    expect(r.disclaimer).toContain('Verify your location')
    expect(r.disclaimer).toContain('Asr convention')
    expect(r.disclaimer).not.toContain('madhab + elevation')
    expect(r.disclaimer).toContain('local mosque or scholar')
  })

  it('mentions the dispatched method by name (transparency)', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: new Date('2026-05-04') })
    expect(r.disclaimer).toContain(r.method)
  })

  it('country-default dispatches mention the country', () => {
    const r = prayerTimes({ latitude: 24.86, longitude: 67.01, date: new Date('2026-05-04') })
    expect(r.disclaimer).toContain('Pakistan')
    expect(r.disclaimer).toContain('country default')
  })

  it('fallback dispatches do not claim a country', () => {
    const r = prayerTimes({ latitude: 0, longitude: -120, date: new Date('2026-05-04') })
    expect(r.disclaimer).toContain('ISNA')
    // No "(country country default)." for the open-ocean case
    expect(r.disclaimer).not.toMatch(/\([A-Za-z]+ country default\)/)
  })
})

describe('#81 — provenance shape backwards-compat', () => {
  it('all pre-v1.7.21 location fields still present (no breaking removals)', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: new Date('2026-05-04') })
    expect(r.location.city).toBeDefined()
    expect(r.location.country).toBeDefined()
    expect(r.location.timezone).toBeDefined()
    expect(r.location.elevation).toBeDefined()
    expect(r.location.asrConvention).toBeDefined()
    expect(r.location.asrConventionSource).toBeDefined()
    expect(r.location.methodSource).toBeDefined()
    // Deprecated aliases are intentionally still present.
    expect(r.location.madhab).toBeDefined()
    expect(r.location.madhabSource).toBeDefined()
    expect(r.location.elevationSource).toBeDefined()
  })
})
