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
        if (geometry.provider === 'geoboundaries') {
          expect(geometry.stableId).toMatch(/^geoboundaries:[A-Z]{3}-ADM\d+-\d+:[A-Za-z0-9]+$/)
          expect(geometry.ids?.boundaryId, geometry.stableId).toMatch(/^[A-Z]{3}-ADM\d+-\d+$/)
          expect(geometry.ids?.shapeId, geometry.stableId).toBeTruthy()
          expect(geometry.ids?.releaseType, geometry.stableId).toBeTruthy()
          expect(geometry.ids?.boundaryType, geometry.stableId).toMatch(/^ADM\d+$/)
          expect(geometry.licenseUse).toBe('audit-and-reviewed-bbox-proposal')
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
      ['Singapore|SG', 'wof:locality:102032341'],
      ['Johor Bahru|MY', 'wof:locality:102022781'],
      ['Klang|MY', 'wof:locality:102022835'],
      ['Shah Alam|MY', 'wof:locality:102022833'],
      ['Petaling Jaya|MY', 'wof:locality:102023395'],
      ['Kuala Lumpur|MY', 'wof:locality:102023407'],
      ['Sialkot|PK', 'wof:locality:421175525'],
      ['Toronto|CA', 'wof:locality:101735835'],
      ['Mississauga|CA', 'wof:locality:101735893'],
      ['Laval|CA', 'wof:locality:101737759'],
      ['Windsor|CA', 'wof:locality:101735855'],
      ['Detroit|US', 'wof:locality:85951091'],
      ['Dearborn|US', 'wof:locality:85951061'],
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
    expect(statusFor('Al Buraimi|OM')).toBe('runtime-bbox-shipped')
    expect(statusFor('Khasab|OM')).toBe('runtime-bbox-shipped')
    expect(statusFor('Dibba Al-Baya|OM')).toBe('runtime-bbox-shipped')
    expect(statusFor('Madha|OM')).toBe('runtime-bbox-shipped')
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
    expect(statusFor('Shenzhen|CN')).toBe('runtime-bbox-shipped')
    expect(statusFor('Singapore|SG')).toBe('runtime-bbox-shipped')
    expect(statusFor('Johor Bahru|MY')).toBe('runtime-bbox-shipped')
    expect(statusFor('Klang|MY')).toBe('runtime-bbox-shipped')
    expect(statusFor('Shah Alam|MY')).toBe('runtime-bbox-shipped')
    expect(statusFor('Petaling Jaya|MY')).toBe('runtime-bbox-shipped')
    expect(statusFor('Kuala Lumpur|MY')).toBe('runtime-bbox-shipped')
    expect(statusFor('Sialkot|PK')).toBe('runtime-bbox-shipped')
    expect(statusFor('Windsor|CA')).toBe('runtime-bbox-shipped')
    expect(statusFor('Geneva|CH')).toBe('runtime-bbox-shipped')
    expect(statusFor('Annemasse|FR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Ferney-Voltaire|FR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Strasbourg|FR')).toBe('runtime-bbox-shipped')
    expect(statusFor('Kehl|DE')).toBe('runtime-bbox-shipped')
    expect(statusFor('Brazzaville|CG')).toBe('runtime-bbox-shipped')
    expect(statusFor('Kinshasa|CD')).toBe('runtime-bbox-shipped')
  })

  it('documents the Al Buraimi guardrail as WOF-supported but clipped to city centre', () => {
    const entry = sourceMap.cities.find(row => row.cityKey === 'Al Buraimi|OM')
    expect(entry).toBeTruthy()
    expect(entry.review.status).toBe('runtime-bbox-shipped')
    expect(entry.priority).toContain('al-ain-buraimi-seam')
    expect(entry.neighborRelations).toEqual([
      expect.objectContaining({
        cityKey: 'Al Ain|AE',
        kind: 'cross-border-twin-city',
      }),
    ])

    const locality = entry.geometries.find(row => row.stableId === 'wof:locality:421177367')
    expect(locality).toMatchObject({
      provider: 'wof',
      sourceConfidence: 'low',
      matchConfidence: 'point-like-runtime-guardrail',
      reviewStatus: 'runtime-bbox-shipped',
    })
    expect(locality.ids).toMatchObject({
      repo: 'whosonfirst-data-admin-om',
      placetype: 'locality',
      mzIsCurrent: -1,
    })

    const county = entry.geometries.find(row => row.stableId === 'wof:county:421184225')
    expect(county).toMatchObject({
      provider: 'wof',
      sourceConfidence: 'medium',
      matchConfidence: 'placetype-mismatch-context',
      reviewStatus: 'candidate',
    })
  })

  it('documents Musandam and Madha guardrails as WOF point plus county context', () => {
    const rows = [
      ['Khasab|OM', 'wof:locality:890443207', 'wof:county:1108721073', 'musandam-exclave'],
      ['Dibba Al-Baya|OM', 'wof:locality:1310693245', 'wof:county:1108721075', 'musandam-exclave'],
      ['Madha|OM', 'wof:locality:1260383081', 'wof:county:1108721093', 'madha-exclave'],
    ]

    for (const [cityKey, localityId, countyId, priority] of rows) {
      const entry = sourceMap.cities.find(row => row.cityKey === cityKey)
      expect(entry, cityKey).toBeTruthy()
      expect(entry.review.status).toBe('runtime-bbox-shipped')
      expect(entry.priority).toContain(priority)
      expect(entry.priority).toContain('city-center-guardrail')

      const locality = entry.geometries.find(row => row.stableId === localityId)
      expect(locality, `${cityKey} locality`).toMatchObject({
        provider: 'wof',
        sourceConfidence: 'low',
        matchConfidence: 'point-like-runtime-guardrail',
        reviewStatus: 'runtime-bbox-shipped',
      })
      expect(locality.ids).toMatchObject({
        repo: 'whosonfirst-data-admin-om',
        placetype: 'locality',
        mzIsCurrent: -1,
      })

      const county = entry.geometries.find(row => row.stableId === countyId)
      expect(county, `${cityKey} county`).toMatchObject({
        provider: 'wof',
        sourceConfidence: 'medium',
        matchConfidence: 'placetype-mismatch-context',
        reviewStatus: 'candidate',
      })
      expect(county.ids).toMatchObject({
        repo: 'whosonfirst-data-admin-om',
        placetype: 'county',
        mzIsCurrent: 1,
      })
    }
  })

  it('documents Shenzhen as a geoBoundaries-backed Hong Kong border fix', () => {
    const entry = sourceMap.cities.find(row => row.cityKey === 'Shenzhen|CN')
    expect(entry).toBeTruthy()
    expect(entry.review.status).toBe('runtime-bbox-shipped')
    expect(entry.priority).toContain('hong-kong-shenzhen-border')
    expect(entry.priority).toContain('geoboundaries-runtime-bbox')

    const geometry = entry.geometries.find(row =>
      row.stableId === 'geoboundaries:CHN-ADM2-17275852:17275852B31711539663260'
    )
    expect(geometry).toMatchObject({
      provider: 'geoboundaries',
      sourceConfidence: 'high',
      matchConfidence: 'clipped-runtime-bbox',
      licenseUse: 'audit-and-reviewed-bbox-proposal',
      reviewStatus: 'runtime-bbox-shipped',
    })
    expect(geometry.ids).toMatchObject({
      boundaryId: 'CHN-ADM2-17275852',
      shapeId: '17275852B31711539663260',
      shapeName: 'Shenzhenshi',
      releaseType: 'gbOpen',
      boundaryType: 'ADM2',
    })
  })

  it('marks the WOF row-level source as shipped for WOF-supported runtime bboxes', () => {
    const clippedRuntimeRows = new Set([
      // Dubai uses a clipped lookup cell from the WOF lead, not the full WOF
      // envelope, so the geometry row remains a candidate by design.
      'Dubai|AE',
    ])

    for (const entry of sourceMap.cities) {
      if (entry.review.status !== 'runtime-bbox-shipped') continue
      if (clippedRuntimeRows.has(entry.cityKey)) continue
      if (!(entry.geometries || []).some(geometry => geometry.provider === 'wof')) continue

      const shippedWofRows = (entry.geometries || [])
        .filter(geometry => geometry.provider === 'wof')
        .filter(geometry => geometry.reviewStatus === 'runtime-bbox-shipped')

      expect(shippedWofRows.length, entry.cityKey).toBeGreaterThan(0)
    }
  })

  it('keeps Egypt metro geometry as source-map-only until clipping is reviewed', () => {
    const expected = new Map([
      ['Cairo|EG', [
        'wof:locality:421174399',
        'wof:locality:421175733',
        'geoboundaries:EGY-ADM2-37247803:37247803B52731964573716',
        'geoboundaries:EGY-ADM2-37247803:37247803B64528254011318',
        'geoboundaries:EGY-ADM2-37247803:37247803B99181648743437',
        'geoboundaries:EGY-ADM2-37247803:37247803B58056872224952',
        'geoboundaries:EGY-ADM2-37247803:37247803B49811870233448',
      ]],
      ['Giza|EG', [
        'wof:locality:421204393',
        'wof:county:1092021173',
        'wof:county:1092021203',
        'geoboundaries:EGY-ADM2-37247803:37247803B55829024150134',
        'geoboundaries:EGY-ADM2-37247803:37247803B59036266241246',
        'geoboundaries:EGY-ADM2-37247803:37247803B9687639154335',
        'geoboundaries:EGY-ADM2-37247803:37247803B56780050438943',
        'geoboundaries:EGY-ADM2-37247803:37247803B46347292779018',
      ]],
      ['6th of October|EG', [
        'wof:county:1092014009',
        'geoboundaries:EGY-ADM2-37247803:37247803B48784531357995',
        'geoboundaries:EGY-ADM2-37247803:37247803B57962000824705',
        'geoboundaries:EGY-ADM2-37247803:37247803B86158206640686',
      ]],
    ])

    for (const [cityKey, stableIds] of expected) {
      const entry = sourceMap.cities.find(row => row.cityKey === cityKey)
      expect(entry, cityKey).toBeTruthy()
      expect(entry.review.status, cityKey).toBe('candidate')
      expect(entry.priority, cityKey).toContain('source-map-only')
      expect(entry.priority, cityKey).toContain('needs-clipping-review')

      for (const stableId of stableIds) {
        const geometry = entry.geometries.find(row => row.stableId === stableId)
        expect(geometry, `${cityKey} ${stableId}`).toBeTruthy()
        expect(geometry.reviewStatus, `${cityKey} ${stableId}`).toBe('candidate')
      }

      const officialRows = entry.geometries.filter(row => row.provider === 'geoboundaries')
      expect(officialRows.length, cityKey).toBeGreaterThan(0)
      for (const row of officialRows) {
        expect(row.sourceConfidence, `${cityKey} ${row.stableId}`).toBe('high')
        expect(row.matchConfidence, `${cityKey} ${row.stableId}`).toContain('adm2')
        expect(row.ids).toMatchObject({
          boundaryId: 'EGY-ADM2-37247803',
          releaseType: 'gbOpen',
          boundaryType: 'ADM2',
          boundaryYearRepresented: '2020',
        })
      }
    }
  })

  it('keeps Canada metro geometry as source-map-only until seams are reviewed', () => {
    const expected = new Map([
      ['Toronto|CA', ['wof:locality:101735835', 'wof:county:890457465']],
      ['Mississauga|CA', ['wof:locality:101735893']],
      ['Montreal|CA', ['wof:county:890458661']],
      ['Laval|CA', ['wof:locality:101737759', 'wof:county:890457693']],
    ])

    for (const [cityKey, stableIds] of expected) {
      const entry = sourceMap.cities.find(row => row.cityKey === cityKey)
      expect(entry, cityKey).toBeTruthy()
      expect(entry.review.status, cityKey).toBe('candidate')
      expect(entry.priority, cityKey).toContain('canada-metro')
      expect(entry.priority, cityKey).toContain('source-map-only')

      for (const stableId of stableIds) {
        const geometry = entry.geometries.find(row => row.stableId === stableId)
        expect(geometry, `${cityKey} ${stableId}`).toBeTruthy()
        expect(geometry.reviewStatus, `${cityKey} ${stableId}`).toBe('candidate')
      }
    }
  })

  it('keeps Windsor source provenance aligned with the raw WOF record', () => {
    const entry = sourceMap.cities.find(row => row.cityKey === 'Windsor|CA')
    const geometry = entry?.geometries?.find(row => row.stableId === 'wof:locality:101735855')
    expect(geometry).toBeTruthy()
    expect(geometry.ids).toMatchObject({
      repo: 'whosonfirst-data-admin-ca',
      placetype: 'locality',
      srcGeom: 'quattroshapes',
      mzIsCurrent: 1,
    })
    expect(geometry.reviewStatus).toBe('runtime-bbox-shipped')
  })

  it('keeps Detroit/Dearborn geometry source-map-only around the shipped Windsor seam', () => {
    const expected = new Map([
      ['Detroit|US', ['wof:locality:85951091', 'wof:localadmin:404506393']],
      ['Dearborn|US', ['wof:locality:85951061', 'wof:localadmin:404508577']],
    ])

    for (const [cityKey, stableIds] of expected) {
      const entry = sourceMap.cities.find(row => row.cityKey === cityKey)
      expect(entry, cityKey).toBeTruthy()
      expect(entry.review.status, cityKey).toBe('candidate')
      expect(entry.priority, cityKey).toContain('detroit-windsor-border')
      expect(entry.priority, cityKey).toContain('source-map-only')

      for (const stableId of stableIds) {
        const geometry = entry.geometries.find(row => row.stableId === stableId)
        expect(geometry, `${cityKey} ${stableId}`).toBeTruthy()
        expect(geometry.ids.repo, `${cityKey} ${stableId}`).toBe('whosonfirst-data-admin-us')
        expect(geometry.ids.srcGeom, `${cityKey} ${stableId}`).toBe('uscensus')
        expect(geometry.ids.mzIsCurrent, `${cityKey} ${stableId}`).toBe(1)
        expect(geometry.reviewStatus, `${cityKey} ${stableId}`).toBe('candidate')
      }
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
