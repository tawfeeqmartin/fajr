// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Unit tests for v1.7.0 phase 2 — detectLocation wired into prayerTimes.
 *
 * These cover the new behavioural contract:
 *   - location field always populated
 *   - methodSource: caller-explicit > city-institutional > country-default > fallback
 *   - elevationSource: caller-explicit > city-registry > default-zero
 *   - auto-elevation note when caller silent and city.elevation is set
 *   - auto-method note when caller silent and city.methodOverride is set
 *   - back-compat: caller-explicit elevation/method preserves prior behaviour
 *
 * The 12 city-method-override cities (Mosul, Najaf, Karbala, Basra, Sarajevo,
 * Mostar, Banja Luka, Pristina, Bradford, Beirut, Tabriz, Dearborn) now
 * route through their institutional method automatically, replacing the
 * previous country-default. Spot-check the methodSource and the resulting
 * method label here.
 *
 * Phase 2 tests import from `../src/index.js` (the public wrapper) because
 * `_prayerTimes(params)` is what callers exercise. The wrapper's
 * post-engine elevation correction kicks in only for caller-explicit
 * elevation; phase 2 city-registry elevation is applied inside the engine
 * directly so it survives both code paths.
 */

import { describe, it, expect } from 'vitest'
import { prayerTimes } from '../src/index.js'

const TEST_DATE = new Date('2026-04-15T12:00:00Z')

// ─────────────────────────────────────────────────────────────────────────────
// 1. location field always populated
// ─────────────────────────────────────────────────────────────────────────────

describe('prayerTimes.location — always populated', () => {
  it('Mecca with no opts → location.city.name=Mecca, country=SaudiArabia, country-default UmmAlQura, city-registry elevation', () => {
    const r = prayerTimes({ latitude: 21.4225, longitude: 39.8262, date: TEST_DATE })
    expect(r.location).toBeDefined()
    expect(r.location.city).not.toBeNull()
    expect(r.location.city.name).toBe('Mecca')
    expect(r.location.country).toBe('SaudiArabia')
    expect(r.location.methodSource).toBe('country-default')
    expect(r.location.elevationSource).toBe('city-registry')
    expect(r.method).toMatch(/Umm al-Qura/i)
    // Mecca is at ~277m so still below the 500m advisory threshold.
    expect(r.location.elevation).toBeGreaterThan(100)
  })

  it('Mosul with no opts → city-institutional Karachi (NOT Iraq country-default Egyptian)', () => {
    // Mosul is the keystone phase 2 case: Iraq's country-default is Egyptian
    // (19.5°/17.5°), but the Mosul row carries methodOverride='Karachi' (18°/
    // 18°, Sunni-Awqaf convention via Mawaqit-registered local mosque). Phase
    // 2 must dispatch through Karachi automatically. The discriminator: Fajr
    // 18° (Karachi) vs Fajr 19.5° (Egyptian) — Karachi's lower angle puts
    // dawn LATER (the angle measures sun-below-horizon depression for the
    // dawn boundary; smaller depression = later in clock time).
    const r       = prayerTimes({ latitude: 36.3489, longitude: 43.1577, date: TEST_DATE })
    const rExp    = prayerTimes({ latitude: 36.3489, longitude: 43.1577, date: TEST_DATE, method: 'Karachi' })
    const rExpEgy = prayerTimes({ latitude: 36.3489, longitude: 43.1577, date: TEST_DATE, method: 'Egyptian' })
    expect(r.location.city.name).toBe('Mosul')
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(/Karachi/i)
    // Karachi 18° dawn arrives later than Egyptian 19.5° dawn — verify
    expect(r.fajr.getTime()).toBe(rExp.fajr.getTime())
    expect(r.fajr.getTime()).toBeGreaterThan(rExpEgy.fajr.getTime())
    // notes[] should mention the auto-method resolution
    const methodNote = r.notes.find(n => /Method auto-resolved.*Mosul.*Karachi/.test(n))
    expect(methodNote).toBeDefined()
  })

  it('Bradford with no opts → city-institutional MoonsightingCommittee', () => {
    // Bradford's country-default for UK is already MoonsightingCommittee, so
    // method names look the same. The distinguishing observable is
    // methodSource, plus the auto-method note in notes[].
    const r = prayerTimes({ latitude: 53.7960, longitude: -1.7594, date: TEST_DATE })
    expect(r.location.city.name).toBe('Bradford')
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(/MoonsightingCommittee/i)
    const methodNote = r.notes.find(n => /Method auto-resolved.*Bradford.*MoonsightingCommittee/.test(n))
    expect(methodNote).toBeDefined()
  })

  it('Kochi (Kerala) → city-institutional KarachiShafi (explicit Shafi Asr matches Samastha Kerala Sunni Shafi tradition)', () => {
    // Kochi is the v1.7.2 keystone case: India country-default is Karachi
    // 18°/18° (the engine's selectMethod 'India' branch returns plain
    // adhan.CalculationMethod.Karachi() which inherits adhan's default Shafi
    // Asr — meaning the country-default already happens to use Shafi Asr).
    // The Kochi override therefore aligns with the country-default for Asr
    // but pins the Shafi'i school explicitly so future adhan.js default
    // changes don't silently break the Shafi-majority Mappila population
    // (same defensive pattern as v1.7.1 for Maldives + Sri Lanka).
    // Discriminator: a caller who explicitly opts into Hanafi Asr (e.g. a
    // North Indian Hanafi Deobandi visitor) should see a LATER Asr.
    const r        = prayerTimes({ latitude: 9.9312, longitude: 76.2673, date: TEST_DATE })
    expect(r.location.city.name).toBe('Kochi')
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(/Shafi/i)
    const methodNote = r.notes.find(n => /Method auto-resolved.*Kochi.*KarachiShafi/.test(n))
    expect(methodNote).toBeDefined()
  })

  it('Cotabato (Bangsamoro) → city-institutional MWL with BDI-BARMM provenance', () => {
    // Cotabato is the BDI-BARMM seat. Philippines country-default already
    // dispatches to MWL (Aladhan default), so the override is for traceability
    // — same pattern as Bradford/Sarajevo.
    const r = prayerTimes({ latitude: 7.2178, longitude: 124.2451, date: TEST_DATE })
    expect(r.location.city.name).toBe('Cotabato')
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(/MWL|Muslim World League/i)
    const methodNote = r.notes.find(n => /Method auto-resolved.*Cotabato.*MWL/.test(n))
    expect(methodNote).toBeDefined()
  })

  it('Lucknow → city-institutional Karachi (same as India country-default; explicit traceability + Shia altMethod surfaced)', () => {
    const r = prayerTimes({ latitude: 26.8467, longitude: 80.9462, date: TEST_DATE })
    expect(r.location.city.name).toBe('Lucknow')
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(/Karachi/i)
    // altMethods are surfaced on the city object inside location.city
    expect(r.location.city.altMethods).toBeDefined()
    expect(r.location.city.altMethods.length).toBe(1)
    expect(r.location.city.altMethods[0].method).toBe('Tehran')  // surface Shia minority
  })

  it('Sarajevo with no opts → city-institutional Diyanet (NOT Bosnia Diyanet — same method, but methodSource differs)', () => {
    const r = prayerTimes({ latitude: 43.8563, longitude: 18.4131, date: TEST_DATE })
    expect(r.location.city.name).toBe('Sarajevo')
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(/Diyanet/i)
  })

  it('Cape Town with no opts → city-registry elevation, country-default MWL', () => {
    const r = prayerTimes({ latitude: -33.92, longitude: 18.42, date: TEST_DATE })
    expect(r.location.city.name).toBe('Cape Town')
    expect(r.location.elevationSource).toBe('city-registry')
    expect(r.location.methodSource).toBe('country-default')
    expect(r.location.elevation).toBeGreaterThan(0)
    expect(r.method).toMatch(/MWL.*South Africa/i)
    const elevNote = r.notes.find(n => /Elevation auto-resolved.*Cape Town/.test(n))
    expect(elevNote).toBeDefined()
  })

  it('Cape Town with explicit elevation: 0 → caller-explicit, no auto-elevation note', () => {
    const r = prayerTimes({ latitude: -33.92, longitude: 18.42, date: TEST_DATE, elevation: 0 })
    expect(r.location.elevationSource).toBe('caller-explicit')
    expect(r.location.elevation).toBe(0)
    const elevNote = r.notes.find(n => /Elevation auto-resolved/.test(n))
    expect(elevNote).toBeUndefined()
  })

  it('Random ocean coord (0, -30) → city=null, country=null, methodSource=fallback', () => {
    const r = prayerTimes({ latitude: 0, longitude: -30, date: TEST_DATE })
    expect(r.location.city).toBeNull()
    expect(r.location.country).toBeNull()
    expect(r.location.methodSource).toBe('fallback')
    expect(r.location.elevationSource).toBe('default-zero')
    expect(r.location.elevation).toBe(0)
    expect(r.location.timezone).toBe('UTC')
  })

  it('Mexico City (high-altitude) → city.elevation>=2000, ≥500m advisory in notes', () => {
    const r = prayerTimes({ latitude: 19.43, longitude: -99.13, date: TEST_DATE })
    expect(r.location.city.name).toBe('Mexico City')
    expect(r.location.elevationSource).toBe('city-registry')
    expect(r.location.elevation).toBeGreaterThanOrEqual(2200)
    const advisory = r.notes.find(n => /Elevation advisory/.test(n))
    expect(advisory).toBeDefined()
    expect(advisory).toMatch(/2240/)
  })

  it('caller-explicit method=Egyptian in Mosul → methodSource=caller-explicit, method=Egyptian (not Karachi), no city-institutional note', () => {
    const r = prayerTimes({ latitude: 36.3489, longitude: 43.1577, date: TEST_DATE, method: 'Egyptian' })
    expect(r.location.methodSource).toBe('caller-explicit')
    expect(r.method).toMatch(/Egyptian/i)
    expect(r.method).not.toMatch(/Karachi/i)
    const methodNote = r.notes.find(n => /Method auto-resolved/.test(n))
    expect(methodNote).toBeUndefined()
  })

  it('caller-explicit elevation: 612 in Riyadh → caller-explicit, no auto-elevation note (existing behaviour preserved)', () => {
    const r = prayerTimes({ latitude: 24.7136, longitude: 46.6753, date: TEST_DATE, elevation: 612 })
    expect(r.location.elevationSource).toBe('caller-explicit')
    expect(r.location.elevation).toBe(612)
    const autoNote = r.notes.find(n => /Elevation auto-resolved/.test(n))
    expect(autoNote).toBeUndefined()
    // The legacy ≥500m advisory still fires regardless of source.
    const advisory = r.notes.find(n => /Elevation advisory/.test(n))
    expect(advisory).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. The 12 city-method-override cities — methodSource sweep
// ─────────────────────────────────────────────────────────────────────────────

describe('prayerTimes.location — 16 city-method-override sweep', () => {
  const cases = [
    // [city,        lat,      lon,       expectedMethodPattern]
    ['Mosul',       36.3489,  43.1577,  /Karachi/i],
    ['Najaf',       31.9956,  44.3308,  /Tehran/i],
    ['Karbala',     32.6149,  44.0241,  /Tehran/i],
    ['Basra',       30.5081,  47.7836,  /Tehran/i],
    ['Sarajevo',    43.8563,  18.4131,  /Diyanet/i],
    ['Mostar',      43.3438,  17.8078,  /Diyanet/i],
    ['Banja Luka',  44.7722,  17.1910,  /Diyanet/i],
    ['Pristina',    42.6629,  21.1655,  /Diyanet/i],
    ['Bradford',    53.7960, -1.7594,   /MoonsightingCommittee/i],
    ['Beirut',      33.8938,  35.5018,  /Egyptian/i],
    ['Tabriz',      38.0667,  46.2993,  /Tehran/i],
    ['Dearborn',    42.3223, -83.1763,  /ISNA|NorthAmerica/i],
    // v1.7.2 additions — Lucknow/Kerala/BARMM
    ['Lucknow',     26.8467,  80.9462,  /Karachi/i],
    ['Kochi',        9.9312,  76.2673,  /Karachi.*Shafi|Shafi.*Karachi/i],
    ['Cotabato',     7.2178, 124.2451,  /MWL|Muslim World League/i],
    ['Marawi',       7.9988, 124.2937,  /MWL|Muslim World League/i],
  ]

  it.each(cases)('%s → methodSource=city-institutional, method matches /%s/', (city, lat, lon, pattern) => {
    const r = prayerTimes({ latitude: lat, longitude: lon, date: TEST_DATE })
    expect(r.location.city.name).toBe(city)
    expect(r.location.methodSource).toBe('city-institutional')
    expect(r.method).toMatch(pattern)
    // Auto-method note must include the city name and override
    const methodNote = r.notes.find(n => /Method auto-resolved/.test(n))
    expect(methodNote).toBeDefined()
    expect(methodNote).toMatch(new RegExp(city.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Caller-silent vs caller-explicit symmetry
// ─────────────────────────────────────────────────────────────────────────────

describe('prayerTimes.location — caller-silent vs caller-explicit', () => {
  it('caller-silent in Sarajevo and caller-explicit method=Diyanet produce same Fajr time (institutional override is a no-op for Bosnia)', () => {
    const silent  = prayerTimes({ latitude: 43.8563, longitude: 18.4131, date: TEST_DATE })
    const explicit = prayerTimes({ latitude: 43.8563, longitude: 18.4131, date: TEST_DATE, method: 'Diyanet' })
    expect(silent.fajr.getTime()).toBe(explicit.fajr.getTime())
    expect(silent.location.methodSource).toBe('city-institutional')
    expect(explicit.location.methodSource).toBe('caller-explicit')
  })

  it('caller-explicit elevation overrides city-registry elevation', () => {
    // Mexico City registry elevation is 2240m, but caller passes 0
    const explicit = prayerTimes({ latitude: 19.43, longitude: -99.13, date: TEST_DATE, elevation: 0 })
    expect(explicit.location.elevationSource).toBe('caller-explicit')
    expect(explicit.location.elevation).toBe(0)
    const advisory = explicit.notes.find(n => /Elevation advisory/.test(n))
    expect(advisory).toBeUndefined()  // ≥500m advisory does NOT fire at 0m
  })
})
