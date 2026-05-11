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

  it('requires a review reason for rows with no geometry candidates', () => {
    const blankEntries = sourceMap.cities.filter(entry => !(entry.geometries || []).length)
    expect(blankEntries.map(entry => entry.cityKey)).toEqual(['Jerusalem|PS'])
    expect(blankEntries[0].review.status).toBe('intentional-routing-anchor')
  })

  it('keeps reviewed WOF locality candidates for the Basel/Mulhouse warning pair', () => {
    const expected = new Map([
      ['Basel|CH', 'wof:locality:101748459'],
      ['Mulhouse|FR', 'wof:locality:101749573'],
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
