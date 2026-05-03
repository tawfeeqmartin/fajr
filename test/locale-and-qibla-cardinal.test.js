// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Tests for v1.7.20 #63 Proposals 1 + 4:
 *   - prayerNames + prayerName (locale.js)
 *   - qibla() cardinal + cardinalDescription fields
 */

import { describe, it, expect } from 'vitest'
import { prayerNames, prayerName, qibla } from '../src/index.js'

// ─── #63 Proposal 1 — prayerNames + prayerName helper ────────────────────────

describe('prayerNames — multi-language constant', () => {
  it('exports a record keyed by all 7 prayer keys', () => {
    const keys = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha', 'imsak']
    for (const k of keys) {
      expect(prayerNames[k]).toBeDefined()
      expect(typeof prayerNames[k]).toBe('object')
    }
  })

  it('every prayer ships English + Arabic + Turkish + Indonesian + Urdu', () => {
    const langs = ['en', 'ar', 'tr', 'id', 'ur']
    for (const k of Object.keys(prayerNames)) {
      for (const lang of langs) {
        expect(typeof prayerNames[k][lang]).toBe('string')
        expect(prayerNames[k][lang].length).toBeGreaterThan(0)
      }
    }
  })

  it('Arabic forms are voweled (contain at least one diacritic)', () => {
    // Arabic diacritics range: U+064B–U+0652, plus shadda U+0651, sukun U+0652, etc.
    const diacriticRe = /[ً-ٟ]/
    for (const k of Object.keys(prayerNames)) {
      const ar = prayerNames[k].ar
      expect(diacriticRe.test(ar)).toBe(true)
    }
  })

  it('English keys are capitalised consistently', () => {
    for (const k of Object.keys(prayerNames)) {
      const en = prayerNames[k].en
      expect(en[0]).toBe(en[0].toUpperCase())
    }
  })
})

describe('prayerName(prayer, lang) — helper', () => {
  it('returns the named language form', () => {
    expect(prayerName('dhuhr', 'ar')).toBe('الظُّهْر')
    expect(prayerName('isha', 'tr')).toBe('Yatsı')
    expect(prayerName('fajr', 'id')).toBe('Subuh')
    expect(prayerName('maghrib', 'ur')).toBe('مغرب')
  })

  it('defaults to English when lang is omitted', () => {
    expect(prayerName('dhuhr')).toBe('Dhuhr')
    expect(prayerName('asr')).toBe('Asr')
  })

  it('falls back to English for unknown lang code', () => {
    expect(prayerName('fajr', 'xx')).toBe('Fajr')
    expect(prayerName('isha', 'fr')).toBe('Isha')
  })

  it('returns empty string for unknown prayer key', () => {
    expect(prayerName('zhuhr')).toBe('')
    expect(prayerName('something-else', 'ar')).toBe('')
  })
})

// ─── #63 Proposal 4 — qibla cardinal + cardinalDescription ───────────────────

describe('qibla() cardinal label', () => {
  it('returns cardinal + cardinalDescription on every result', () => {
    const r = qibla({ latitude: 51.5074, longitude: -0.1278 })  // London
    expect(typeof r.cardinal).toBe('string')
    expect(typeof r.cardinalDescription).toBe('string')
    expect(r.cardinal.length).toBeGreaterThan(0)
    expect(r.cardinalDescription.length).toBeGreaterThan(0)
  })

  it('London (51.51, -0.13) qibla bearing ~119° → ESE', () => {
    const r = qibla({ latitude: 51.5074, longitude: -0.1278 })
    // London-to-Makkah bearing is ~118-119° great-circle.
    expect(r.bearing).toBeGreaterThan(115)
    expect(r.bearing).toBeLessThan(125)
    expect(r.cardinal).toBe('ESE')
    expect(r.cardinalDescription).toBe('East-southeast')
  })

  it('Mexico City (19.43, -99.13) qibla bearing ~46° → NE', () => {
    const r = qibla({ latitude: 19.4326, longitude: -99.1332 })
    // Mexico-to-Makkah bearing is ~45-47° great-circle.
    expect(r.cardinal).toMatch(/^N(NE|E)$/)
  })

  it('Sydney (-33.87, 151.21) qibla bearing ~277° → W', () => {
    const r = qibla({ latitude: -33.8688, longitude: 151.2093 })
    expect(r.cardinal).toMatch(/^W(NW)?$/)
  })

  it('Madinah (24.47, 39.61) qibla bearing ~176° → S', () => {
    // Madinah is just north of Makkah — bearing is almost due south.
    const r = qibla({ latitude: 24.4709, longitude: 39.6121 })
    expect(r.cardinal).toBe('S')
    expect(r.cardinalDescription).toBe('South')
  })

  it('cardinal is one of the 16 valid abbreviations', () => {
    const valid = new Set([
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
    ])
    // Sample 12 cities worldwide
    const samples = [
      [40.7128, -74.0060],   // New York
      [35.6762, 139.6503],   // Tokyo
      [-1.2921, 36.8219],    // Nairobi
      [55.7558, 37.6173],    // Moscow
      [-23.5505, -46.6333],  // São Paulo
      [1.3521, 103.8198],    // Singapore
      [13.7563, 100.5018],   // Bangkok
      [37.7749, -122.4194],  // San Francisco
      [-26.2041, 28.0473],   // Johannesburg
      [60.1699, 24.9384],    // Helsinki
      [33.8869, 9.5375],     // Tunisia (mid-Mediterranean)
      [22.5726, 88.3639],    // Kolkata
    ]
    for (const [lat, lon] of samples) {
      const r = qibla({ latitude: lat, longitude: lon })
      expect(valid.has(r.cardinal)).toBe(true)
    }
  })
})
