// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Regression tests for fajr#102.
 *
 * Diyanet's ezanvakti proxy uses numeric city and district IDs. A prior
 * multi-city fetcher attempt guessed IDs and produced impossible 8-57 minute
 * Fajr errors for several Turkish cities. These tests keep the verified mapping
 * aligned with the bundled Turkish city registry.
 */

import { describe, it, expect } from 'vitest'
import citiesModule from '../src/data/cities.json' with { type: 'json' }
import diyanetMap from '../scripts/data/diyanet-ezanvakti-cities.json' with { type: 'json' }

const registryCities = citiesModule.cities.filter(city => city.countryISO === 'TR')
const mappingByCity = new Map(diyanetMap.cities.map(row => [row.fajrCity, row]))

describe('Diyanet ezanvakti city mapping', () => {
  it('maps every bundled Turkish city to a verified ezanvakti district', () => {
    const missing = registryCities
      .map(city => city.name)
      .filter(name => !mappingByCity.has(name))

    expect(missing).toEqual([])
  })

  it('does not contain mappings for cities outside the Turkish registry', () => {
    const registryNames = new Set(registryCities.map(city => city.name))
    const extras = diyanetMap.cities
      .map(row => row.fajrCity)
      .filter(name => !registryNames.has(name))

    expect(extras).toEqual([])
  })

  it('uses explicit, non-empty numeric city and district IDs', () => {
    for (const row of diyanetMap.cities) {
      expect(row.countryISO).toBe('TR')
      expect(row.sehirID, row.fajrCity).toMatch(/^\d+$/)
      expect(row.ilceID, row.fajrCity).toMatch(/^\d+$/)
      expect(row.sehirAdiEn, row.fajrCity).toBeTruthy()
      expect(row.ilceAdiEn, row.fajrCity).toBeTruthy()
      expect(row.match, row.fajrCity).toBe('exact-central-district')
    }
  })
})
