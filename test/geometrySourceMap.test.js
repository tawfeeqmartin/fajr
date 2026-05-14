// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import path from 'node:path'
import { describe, expect, it } from 'vitest'
import sourceMap from '../scripts/data/city-geometry-sources.json' with { type: 'json' }
import cityModule from '../src/data/cities.json' with { type: 'json' }

describe('city geometry source map', () => {
  const registryKeys = new Set(
    cityModule.cities.map(city => `${city.name}|${city.countryISO}`)
  )

  it('references only existing registry city rows', () => {
    const seen = new Set()
    for (const entry of sourceMap.cities) {
      expect(registryKeys.has(entry.cityKey), entry.cityKey).toBe(true)
      expect(seen.has(entry.cityKey), entry.cityKey).toBe(false)
      seen.add(entry.cityKey)
    }
  })

  it('keeps raw geometry paths inside the expected per-city cache folder', () => {
    for (const entry of sourceMap.cities) {
      const [city, iso] = entry.cityKey.split('|')
      const expectedPrefix = `${iso}/${slug(city)}/`
      for (const geometry of entry.geometries || []) {
        expect(geometry.cacheFile, entry.cityKey).toBeTruthy()
        expect(path.posix.normalize(geometry.cacheFile), geometry.cacheFile)
          .toBe(geometry.cacheFile)
        expect(geometry.cacheFile.startsWith(expectedPrefix), `${entry.cityKey} ${geometry.stableId}`)
          .toBe(true)
      }
    }
  })

  it('keeps OSM audit-only and marks WOF placetype mismatches as lower confidence', () => {
    for (const entry of sourceMap.cities) {
      for (const geometry of entry.geometries || []) {
        if (geometry.provider === 'osm') {
          expect(geometry.stableId).toMatch(/^osm:relation:\d+$/)
          expect(geometry.licenseUse).toBe('audit-only-until-license-review')
        }
        if (geometry.provider === 'wof') {
          expect(geometry.stableId).toMatch(/^wof:[a-z]+:\d+$/)
          expect(geometry.ids?.repo, geometry.stableId).toMatch(/^whosonfirst-data-/)
          expect(geometry.licenseUse).toBe('audit-and-reviewed-bbox-proposal')
          if (geometry.ids?.placetype !== 'locality') {
            expect(geometry.sourceConfidence).not.toBe('high')
            expect(geometry.matchConfidence).toContain('placetype-mismatch')
          }
        }
      }
    }
  })

  it('does not store unstable Nominatim place IDs', () => {
    const forbiddenKeys = []
    collectForbiddenKeys(sourceMap, forbiddenKeys)
    expect(forbiddenKeys).toEqual([])
  })

  it('uses explicit neighbor relations instead of stale expected warnings', () => {
    const staleKeys = []
    collectKeys(sourceMap, 'expectedNeighborWarnings', staleKeys)
    expect(staleKeys).toEqual([])
  })

  it('requires a review reason for rows with no geometry candidates', () => {
    const blankEntries = sourceMap.cities.filter(entry => !(entry.geometries || []).length)
    expect(blankEntries.map(entry => entry.cityKey)).toEqual(['Jerusalem|PS'])
    expect(blankEntries[0].review.status).toBe('intentional-routing-anchor')
  })

  it('keeps reviewed WOF locality candidates for audited border pairs', () => {
    const expected = new Map([
      ['Basel|CH', 'wof:locality:101748459'],
      ['Mulhouse|FR', 'wof:locality:101749573'],
      ['Rabat|MA', 'wof:locality:421190103'],
      ['Agadir|MA', 'wof:locality:421170495'],
      ['Berrechid|MA', 'wof:locality:1125988395'],
      ['Settat|MA', 'wof:locality:421190099'],
      ['Fes|MA', 'wof:locality:421190143'],
      ['Sefrou|MA', 'wof:locality:421190111'],
      ['Tangier|MA', 'wof:locality:421190123'],
      ['Nador|MA', 'wof:locality:421190085'],
      ['Oujda|MA', 'wof:locality:421200921'],
      ['Abu Dhabi|AE', 'wof:locality:421179641'],
      ['Al Ain|AE', 'wof:locality:421168687'],
      ['Istanbul|TR', 'wof:locality:890460455'],
      ['Ankara|TR', 'wof:locality:890460453'],
      ['Izmir|TR', 'wof:locality:890461083'],
      ['Bursa|TR', 'wof:locality:890461315'],
      ['Konya|TR', 'wof:locality:890463545'],
      ['Gaziantep|TR', 'wof:locality:890461631'],
      ['Adana|TR', 'wof:locality:890461703'],
      ['Antalya|TR', 'wof:locality:101912923'],
      ['Samsun|TR', 'wof:locality:101911033'],
      ['Trabzon|TR', 'wof:locality:101912783'],
      ['Windsor|CA', 'wof:locality:101735855'],
      ['Geneva|CH', 'wof:locality:101748445'],
      ['Annemasse|FR', 'wof:locality:101757307'],
      ['Ferney-Voltaire|FR', 'wof:locality:101753277'],
      ['Strasbourg|FR', 'wof:locality:101751113'],
      ['Kehl|DE', 'wof:locality:101753099'],
      ['Brazzaville|CG', 'wof:locality:421180023'],
      ['Kinshasa|CD', 'wof:locality:421166913'],
    ])

    for (const [cityKey, stableId] of expected) {
      const entry = sourceMap.cities.find(row => row.cityKey === cityKey)
      const geometry = entry?.geometries?.find(row => row.stableId === stableId)
      expect(geometry, cityKey).toBeTruthy()
      expect(geometry.ids).toMatchObject({
        placetype: 'locality',
        mzIsCurrent: 1,
      })
      expect(geometry.sourceConfidence).toBe('high')
      expect(geometry.licenseUse).toBe('audit-and-reviewed-bbox-proposal')
    }
  })

  it('tracks runtime-shipped and needs-clipping geometry outcomes separately', () => {
    expect(statusFor('Basel|CH')).toBe('runtime-bbox-shipped')
    expect(statusFor('Mulhouse|FR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Rabat|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Agadir|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Casablanca|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Berrechid|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Settat|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Fes|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Sefrou|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Tangier|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Nador|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Oujda|MA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Abu Dhabi|AE')).toBe('runtime-bbox-shipped')
    expect(statusFor('Al Ain|AE')).toBe('runtime-bbox-shipped')
    expect(statusFor('Dubai|AE')).toBe('runtime-bbox-shipped')
    expect(statusFor('Sharjah|AE')).toBe('runtime-bbox-shipped')
    expect(statusFor('Ajman|AE')).toBe('runtime-bbox-shipped')
    expect(statusFor('Istanbul|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Ankara|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Izmir|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Bursa|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Konya|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Gaziantep|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Adana|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Antalya|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Samsun|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Trabzon|TR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Windsor|CA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Geneva|CH')).toBe('runtime-bbox-shipped')
    expect(statusFor('Annemasse|FR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Ferney-Voltaire|FR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Strasbourg|FR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Kehl|DE')).toBe('runtime-bbox-shipped')
    expect(statusFor('Brazzaville|CG')).toBe('runtime-bbox-shipped')
    expect(statusFor('Kinshasa|CD')).toBe('runtime-bbox-shipped')
  })
})

function slug(city) {
  return city
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function collectForbiddenKeys(value, out, pathParts = []) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenKeys(item, out, [...pathParts, String(index)]))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'place_id' || key === 'placeId') out.push([...pathParts, key].join('.'))
    collectForbiddenKeys(child, out, [...pathParts, key])
  }
}

function collectKeys(value, targetKey, out, pathParts = []) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectKeys(item, targetKey, out, [...pathParts, String(index)]))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === targetKey) out.push([...pathParts, key].join('.'))
    collectKeys(child, targetKey, out, [...pathParts, key])
  }
}

function statusFor(cityKey) {
  return sourceMap.cities.find(row => row.cityKey === cityKey)?.review?.status
}
