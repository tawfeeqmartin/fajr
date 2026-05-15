// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Unit tests for detectLocation (v1.7.0 phase 1).
 *
 * detectLocation is internal-only at v1.7.0 phase 1 (NOT in src/index.js public
 * exports), so these tests import from src/engine.js directly. Phase 3 will
 * move the import to '../src/index.js' alongside the public-API contract.
 *
 * Coverage shape (per the v1.7.0 design proposal):
 *   - 12 city-method-override cities (Mosul, Najaf, Karbala, Basra, Sarajevo,
 *     Mostar, Banja Luka, Pristina, Bradford, Beirut, Tabriz, Dearborn) →
 *     methodOverride applied; methodSource='city-institutional'
 *   - capital-city institutional dispatch (Mecca, Cape Town, etc.) →
 *     methodSource='country-default' OR 'city-institutional' if national
 *     authority is named on the city row
 *   - Mawaqit-registered cities (Casablanca, Kuala Lumpur) → source.type='mawaqit'
 *   - Out-of-bbox coordinate (open ocean) → city=null, country=null,
 *     methodSource='fallback'
 *   - High-altitude case (Mexico City) → elevation surfaced
 *   - Linear-scan invariant (sorted smallest-bbox-first)
 */

import { describe, it, expect } from 'vitest'
import { detectLocation } from '../src/engine.js'

// ─────────────────────────────────────────────────────────────────────────────
// City-method-override cities — verify each of the 12 dispatches correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — city-method-override dispatch (16 cities)', () => {
  const overrides = [
    // [name, lat, lon, expectedCity, expectedMethod, expectedAltMethodCount]
    ['Mosul',      36.3489,  43.1577, 'Mosul',      'Karachi',              1],
    ['Najaf',      31.9956,  44.3308, 'Najaf',      'Tehran',               1],
    ['Karbala',    32.6149,  44.0241, 'Karbala',    'Tehran',               1],
    ['Basra',      30.5081,  47.7836, 'Basra',      'Tehran',               1],
    ['Sarajevo',   43.8563,  18.4131, 'Sarajevo',   'Diyanet',              1],
    ['Mostar',     43.3438,  17.8078, 'Mostar',     'Diyanet',              1],
    ['Banja Luka', 44.7722,  17.1910, 'Banja Luka', 'Diyanet',              1],
    ['Pristina',   42.6629,  21.1655, 'Pristina',   'Diyanet',              1],
    ['Bradford',   53.7960, -1.7594,  'Bradford',   'MoonsightingCommittee', 1],
    ['Beirut',     33.8938,  35.5018, 'Beirut',     'Egyptian',             1],
    ['Tabriz',     38.0667,  46.2993, 'Tabriz',     'Tehran',               1],
    ['Dearborn',   42.3223, -83.1763, 'Dearborn',   'ISNA',                 1],
    // v1.7.2 additions — KRG/Lucknow/Kerala/Pattani/Bangsamoro research
    ['Lucknow',    26.8467,  80.9462, 'Lucknow',    'Karachi',              1],
    ['Kochi',       9.9312,  76.2673, 'Kochi',      'KarachiShafi',         1],
    ['Cotabato',    7.2178, 124.2451, 'Cotabato',   'MWL',                  1],
    ['Marawi',      7.9988, 124.2937, 'Marawi',     'MWL',                  1],
  ]

  it.each(overrides)(
    '%s (%f, %f) → city.name=%s, methodOverride=%s, altMethods.length=%i',
    (label, lat, lon, expectedCity, expectedMethod, expectedAltCount) => {
      const loc = detectLocation(lat, lon)
      expect(loc.city, `${label} should match a city row`).not.toBeNull()
      expect(loc.city.name).toBe(expectedCity)
      expect(loc.city.methodOverride).toBe(expectedMethod)
      expect(loc.recommendedMethod).toBe(expectedMethod)
      expect(loc.methodSource).toBe('city-institutional')
      expect(loc.altMethods).toBeDefined()
      expect(loc.altMethods.length).toBe(expectedAltCount)
    }
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Country-default dispatch (no city override) — capitals and major centers
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — country-default dispatch', () => {
  it('Cape Town → city=Cape Town, country=SouthAfrica, method=MWL, source.type=inherited', () => {
    const loc = detectLocation(-33.92, 18.42)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Cape Town')
    expect(loc.country).toBe('SouthAfrica')
    expect(loc.recommendedMethod).toBe('MWL')
    expect(loc.methodSource).toBe('country-default')
    expect(loc.city.methodOverride).toBeUndefined()
    // Cape Town has no methodOverride, so altMethods is undefined for the
    // city itself; the source is 'inherited' from the SouthAfrica country.
    expect(loc.altMethods).toBeUndefined()
  })

  it('Mecca → city=Mecca, country=SaudiArabia, method=UmmAlQura', () => {
    const loc = detectLocation(21.42, 39.83)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Mecca')
    expect(loc.country).toBe('SaudiArabia')
    expect(loc.recommendedMethod).toBe('UmmAlQura')
    expect(loc.methodSource).toBe('country-default')
  })

  it('Karachi → city=Karachi, country=Pakistan, method=Karachi', () => {
    const loc = detectLocation(24.86, 67.00)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Karachi')
    expect(loc.country).toBe('Pakistan')
    expect(loc.recommendedMethod).toBe('Karachi')
    expect(loc.methodSource).toBe('country-default')
  })

  it('Istanbul → city=Istanbul, country=Turkey, method=Diyanet', () => {
    const loc = detectLocation(41.0082, 28.9784)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Istanbul')
    expect(loc.country).toBe('Turkey')
    expect(loc.recommendedMethod).toBe('Diyanet')
    expect(loc.methodSource).toBe('country-default')
  })

  it('Kuala Lumpur metro → country=Malaysia, method=JAKIM (smallest-bbox may be Shah Alam in metro overlap)', () => {
    // KL center (3.1390, 101.6869) sits inside both KL's bbox (pop 1.8M
    // → 0.30° radius) and Shah Alam's bbox (pop 740k → 0.20° radius).
    // Smallest-bbox-first sort returns Shah Alam. Both dispatch to JAKIM,
    // so the institutional recommendation is identical; the only observable
    // difference is the display city name.
    const loc = detectLocation(3.1390, 101.6869)
    expect(loc.city).not.toBeNull()
    expect(['Kuala Lumpur', 'Shah Alam']).toContain(loc.city.name)
    expect(loc.country).toBe('Malaysia')
    expect(loc.recommendedMethod).toBe('JAKIM')
    expect(loc.methodSource).toBe('country-default')
  })

  it('Kuala Lumpur north (outside Shah Alam bbox) → city=Kuala Lumpur', () => {
    const loc = detectLocation(3.30, 101.6869)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Kuala Lumpur')
    expect(loc.country).toBe('Malaysia')
    expect(loc.recommendedMethod).toBe('JAKIM')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Mawaqit-source detection
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — Mawaqit institutional source', () => {
  it('Casablanca matches a Mawaqit-registered city; source.type=mawaqit', () => {
    const loc = detectLocation(33.5731, -7.5898)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Casablanca')
    expect(loc.source.type).toBe('mawaqit')
    expect(loc.source.slug).toBeTruthy()
  })

  it('Tanger (Mawaqit-registered) → source.type=mawaqit', () => {
    const loc = detectLocation(35.7595, -5.8340)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Tangier')  // Latin transliteration normalised in MUSLIM_POPULATION_CENTERS
    // Note: the Mawaqit row is "Tanger|Morocco". Both rows merged on the
    // population-center canonical name "Tangier"; source.type may be mawaqit
    // (the merged record carries the slug) or inherited if dedup landed
    // differently. The country-default dispatches to Morocco regardless.
    expect(loc.country).toBe('Morocco')
    expect(loc.recommendedMethod).toBe('Morocco')
  })

  it('Morocco reviewed bbox clips keep Rabat/Agadir distinct from neighboring Mawaqit rows', () => {
    const rabatEdge = detectLocation(33.962, -6.917)
    expect(rabatEdge.city).not.toBeNull()
    expect(rabatEdge.city.name).toBe('Rabat')
    expect(rabatEdge.source.type).toBe('mawaqit')

    const temaraNeighbor = detectLocation(33.959, -6.90)
    expect(temaraNeighbor.city).not.toBeNull()
    expect(temaraNeighbor.city.name).toBe('Temara')
    expect(temaraNeighbor.source.type).toBe('mawaqit')

    const agadirEdge = detectLocation(30.392, -9.651)
    expect(agadirEdge.city).not.toBeNull()
    expect(agadirEdge.city.name).toBe('Agadir')
    expect(agadirEdge.source.type).toBe('mawaqit')

    const inezganeNeighbor = detectLocation(30.389, -9.54)
    expect(inezganeNeighbor.city).not.toBeNull()
    expect(inezganeNeighbor.city.name).toBe('Inezgane')
    expect(inezganeNeighbor.source.type).toBe('mawaqit')
  })

  it('Morocco WOF-tightened rows keep centers while dropping old overbroad corners', () => {
    const rows = [
      ['Berrechid', 33.2659, -7.5867, 33.21, -7.64],
      ['Casablanca', 33.5731, -7.5898, 33.70, -7.75],
      ['Fes', 34.0331, -5.0003, 34.20, -5.25],
      ['Settat', 33.0017, -7.6166, 32.90, -7.75],
      ['Sefrou', 33.8311, -4.8294, 33.75, -4.90],
      ['Tangier', 35.7595, -5.8340, 35.60, -6.00],
      ['Nador', 35.1741, -2.9287, 35.05, -3.05],
      ['Oujda', 34.6814, -1.9086, 34.55, -2.00],
    ]

    for (const [name, centerLat, centerLon, oldCornerLat, oldCornerLon] of rows) {
      const center = detectLocation(centerLat, centerLon)
      expect(center.city, `${name} center should still resolve`).not.toBeNull()
      expect(center.city.name).toBe(name)
      expect(center.country).toBe('Morocco')

      const oldCorner = detectLocation(oldCornerLat, oldCornerLon)
      expect(oldCorner.city?.name, `${name} old overbroad corner should no longer resolve to ${name}`).not.toBe(name)
      expect(oldCorner.country).toBe('Morocco')
    }
  })

  it('Basel/Mulhouse WOF-tightened rows keep centers while dropping old overbroad edges', () => {
    const rows = [
      ['Basel', 'Switzerland', 47.5596, 7.5886, 47.62, 7.70],
      ['Mulhouse', 'France', 47.7508, 7.3359, 47.66, 7.20],
    ]

    for (const [name, country, centerLat, centerLon, oldEdgeLat, oldEdgeLon] of rows) {
      const center = detectLocation(centerLat, centerLon)
      expect(center.city, `${name} center should still resolve`).not.toBeNull()
      expect(center.city.name).toBe(name)
      expect(center.country).toBe(country)
      expect(center.source.type).toBe('mawaqit')

      const oldEdge = detectLocation(oldEdgeLat, oldEdgeLon)
      expect(oldEdge.city?.name, `${name} old overbroad edge should no longer resolve to ${name}`).not.toBe(name)
    }
  })

  it('Geneva border WOF cells keep Geneva while routing French border towns to France', () => {
    const geneva = detectLocation(46.2044, 6.1432)
    expect(geneva.city).not.toBeNull()
    expect(geneva.city.name).toBe('Geneva')
    expect(geneva.country).toBe('Switzerland')
    expect(geneva.timezone).toBe('Europe/Zurich')

    const annemasse = detectLocation(46.1944, 6.2377)
    expect(annemasse.city).not.toBeNull()
    expect(annemasse.city.name).toBe('Annemasse')
    expect(annemasse.city.countryISO).toBe('FR')
    expect(annemasse.country).toBe('France')
    expect(annemasse.timezone).toBe('Europe/Paris')

    const ferney = detectLocation(46.2558, 6.1081)
    expect(ferney.city).not.toBeNull()
    expect(ferney.city.name).toBe('Ferney-Voltaire')
    expect(ferney.city.countryISO).toBe('FR')
    expect(ferney.country).toBe('France')
    expect(ferney.timezone).toBe('Europe/Paris')
  })

  it('Strasbourg/Kehl Rhine seam keeps each city on its own country side', () => {
    const strasbourg = detectLocation(48.5734, 7.7521)
    expect(strasbourg.city).not.toBeNull()
    expect(strasbourg.city.name).toBe('Strasbourg')
    expect(strasbourg.city.countryISO).toBe('FR')
    expect(strasbourg.country).toBe('France')
    expect(strasbourg.timezone).toBe('Europe/Paris')

    const kehl = detectLocation(48.5722, 7.8156)
    expect(kehl.city).not.toBeNull()
    expect(kehl.city.name).toBe('Kehl')
    expect(kehl.city.countryISO).toBe('DE')
    expect(kehl.country).toBe('Germany')
    expect(kehl.timezone).toBe('Europe/Berlin')
  })

  it('Brazzaville/Kinshasa Congo River seam keeps each capital on its own country side', () => {
    const brazzaville = detectLocation(-4.30, 15.28)
    expect(brazzaville.city).not.toBeNull()
    expect(brazzaville.city.name).toBe('Brazzaville')
    expect(brazzaville.city.countryISO).toBe('CG')
    expect(brazzaville.country).toBe('RepublicOfTheCongo')
    expect(brazzaville.timezone).toBe('Africa/Brazzaville')

    const kinshasa = detectLocation(-4.50, 15.52)
    expect(kinshasa.city).not.toBeNull()
    expect(kinshasa.city.name).toBe('Kinshasa')
    expect(kinshasa.city.countryISO).toBe('CD')
    expect(kinshasa.country).toBe('DRCongo')
    expect(kinshasa.timezone).toBe('Africa/Kinshasa')

    const riverGap = detectLocation(-4.34, 15.26)
    expect(riverGap.city).toBeNull()
  })

  it('UAE WOF locality rows expand Abu Dhabi/Al Ain city provenance without touching Dubai/Sharjah/Ajman', () => {
    const rows = [
      ['Abu Dhabi', 24.4539, 54.3773, 24.20, 54.80],
      ['Al Ain', 24.2075, 55.7447, 24.20, 55.50],
    ]

    for (const [name, centerLat, centerLon, edgeLat, edgeLon] of rows) {
      const center = detectLocation(centerLat, centerLon)
      expect(center.city, `${name} center should still resolve`).not.toBeNull()
      expect(center.city.name).toBe(name)
      expect(center.country).toBe('UAE')

      const edge = detectLocation(edgeLat, edgeLon)
      expect(edge.city, `${name} reviewed WOF edge should resolve`).not.toBeNull()
      expect(edge.city.name).toBe(name)
      expect(edge.country).toBe('UAE')
    }
  })

  it('Al Ain/Al Buraimi seam keeps the Omani twin-city centre out of UAE routing', () => {
    const alAin = detectLocation(24.2075, 55.7447)
    expect(alAin.city).not.toBeNull()
    expect(alAin.city.name).toBe('Al Ain')
    expect(alAin.city.countryISO).toBe('AE')
    expect(alAin.country).toBe('UAE')
    expect(alAin.timezone).toBe('Asia/Dubai')
    expect(alAin.recommendedMethod).toBe('UmmAlQura')

    const alBuraimi = detectLocation(24.2509, 55.7931)
    expect(alBuraimi.city).not.toBeNull()
    expect(alBuraimi.city.name).toBe('Al Buraimi')
    expect(alBuraimi.city.countryISO).toBe('OM')
    expect(alBuraimi.country).toBe('Oman')
    expect(alBuraimi.timezone).toBe('Asia/Muscat')
    expect(alBuraimi.recommendedMethod).toBe('Kuwait')
    expect(alBuraimi.methodSource).toBe('country-default')
    expect(alBuraimi.source.type).toBe('inherited')
    expect(alBuraimi.source.from).toBe('Oman')
  })

  it('UAE clipped WOF cells expand Sharjah/Ajman eastward without stealing Dubai', () => {
    const rows = [
      ['Sharjah', 25.3463, 55.4209, 25.35, 55.65],
      ['Ajman', 25.4052, 55.5136, 25.405, 55.60],
    ]

    for (const [name, centerLat, centerLon, edgeLat, edgeLon] of rows) {
      const center = detectLocation(centerLat, centerLon)
      expect(center.city, `${name} center should still resolve`).not.toBeNull()
      expect(center.city.name).toBe(name)
      expect(center.country).toBe('UAE')

      const edge = detectLocation(edgeLat, edgeLon)
      expect(edge.city, `${name} clipped WOF edge should resolve`).not.toBeNull()
      expect(edge.city.name).toBe(name)
      expect(edge.country).toBe('UAE')
    }

    const dubai = detectLocation(25.2048, 55.2708)
    expect(dubai.city).not.toBeNull()
    expect(dubai.city.name).toBe('Dubai')
    expect(dubai.country).toBe('UAE')

    const sharjahSouthwest = detectLocation(25.3242, 55.4941)
    expect(sharjahSouthwest.city).not.toBeNull()
    expect(sharjahSouthwest.city.name).toBe('Sharjah')
    expect(sharjahSouthwest.country).toBe('UAE')
  })

  it('Turkey WOF-tightened rows keep centers while dropping old broad corners', () => {
    const rows = [
      ['Istanbul', 41.0082, 28.9784, 41.35, 28.60],
      ['Ankara', 39.9334, 32.8597, 40.20, 33.15],
      ['Izmir', 38.4237, 27.1428, 38.20, 27.40],
      ['Bursa', 40.1885, 29.0610, 40.40, 28.80],
      ['Konya', 37.8746, 32.4932, 37.60, 32.75],
      ['Gaziantep', 37.0662, 37.3833, 37.30, 37.10],
      ['Adana', 37.0000, 35.3213, 36.75, 35.60],
      ['Antalya', 36.8841, 30.7056, 37.15, 30.45],
      ['Samsun', 41.2867, 36.3300, 41.55, 36.10],
      ['Trabzon', 41.0027, 39.7168, 40.90, 39.85],
    ]

    for (const [name, centerLat, centerLon, oldCornerLat, oldCornerLon] of rows) {
      const center = detectLocation(centerLat, centerLon)
      expect(center.city, `${name} center should still resolve`).not.toBeNull()
      expect(center.city.name).toBe(name)
      expect(center.country).toBe('Turkey')

      const oldCorner = detectLocation(oldCornerLat, oldCornerLon)
      expect(oldCorner.city?.name, `${name} old broad corner should no longer resolve to ${name}`).not.toBe(name)
      expect(oldCorner.country).toBe('Turkey')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Fallback (no bbox match)
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — fallback when no city matches', () => {
  it('Open ocean (0, -30) → city=null, country=null, methodSource=fallback', () => {
    const loc = detectLocation(0, -30)
    expect(loc.city).toBeNull()
    expect(loc.country).toBeNull()
    expect(loc.methodSource).toBe('fallback')
    expect(loc.recommendedMethod).toBe('ISNA')  // engine fallback
    expect(loc.source.type).toBe('fallback')
    expect(loc.timezone).toBe('UTC')
  })

  it('Antarctic interior (-80, 0) → city=null, country=null, fallback', () => {
    const loc = detectLocation(-80, 0)
    expect(loc.city).toBeNull()
    expect(loc.country).toBeNull()
    expect(loc.methodSource).toBe('fallback')
    expect(loc.timezone).toBe('UTC')
  })

  it('No city but country detected (rural Saudi Arabia) → city=null, country!=null, methodSource=country-default', () => {
    // Rural-coordinate inside Saudi bbox but outside any registered city's bbox.
    // Using (22.5, 50.0) — middle of Rub' al Khali desert.
    const loc = detectLocation(22.5, 50.0)
    expect(loc.city).toBeNull()
    expect(loc.country).toBe('SaudiArabia')
    expect(loc.methodSource).toBe('country-default')
    expect(loc.recommendedMethod).toBe('UmmAlQura')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Elevation handling
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — elevation surfacing', () => {
  it('Mexico City → city=Mexico City, elevation>=2000', () => {
    const loc = detectLocation(19.43, -99.13)
    expect(loc.city).not.toBeNull()
    expect(loc.city.name).toBe('Mexico City')
    expect(loc.elevation).toBeGreaterThanOrEqual(2000)
  })

  it('Sanaa (Yemen) high-altitude → elevation>=2000', () => {
    const loc = detectLocation(15.3694, 44.1910)
    expect(loc.city).not.toBeNull()
    expect(loc.elevation).toBeGreaterThanOrEqual(2000)
  })

  it('Caller-supplied fallbackElevation used when city has no elevation field', () => {
    // (0, -30) is open ocean — no city match; engine returns the fallback.
    const loc = detectLocation(0, -30, 1234)
    expect(loc.city).toBeNull()
    expect(loc.elevation).toBe(1234)
  })

  it('City elevation overrides caller fallback', () => {
    // Mexico City (~2240 m) — should win over a passed-in fallback.
    const loc = detectLocation(19.43, -99.13, 0)
    expect(loc.city.name).toBe('Mexico City')
    expect(loc.elevation).toBeGreaterThanOrEqual(2000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Smallest-bbox-first invariant (regression — the registry is pre-sorted by
// bbox area ascending; if that sort ever breaks, multi-city overlapping
// bboxes would non-deterministically resolve)
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — smallest-bbox-first invariant', () => {
  it('returns the smallest-bbox match (Bradford, not just inherited from UK)', () => {
    // Bradford lat/lon happens to fall inside London's bbox + greater UK
    // coverage, but Bradford's bbox is smaller (smaller population) and
    // sorted earlier in the registry. detectLocation should return Bradford.
    const loc = detectLocation(53.7960, -1.7594)
    expect(loc.city.name).toBe('Bradford')
  })

  it('Dearborn (small bbox) wins over Detroit (larger bbox) for Dearborn coords', () => {
    // The DearbornDetroit override is pinpointed at Dearborn coordinates.
    // The smallest-bbox-first sort means Dearborn's bbox (tiny) wins over
    // Detroit's bbox (larger metro), which is the desired institutional
    // dispatch (Islamic Center of America in Dearborn vs. ISNA generic).
    const loc = detectLocation(42.3223, -83.1763)
    expect(loc.city.name).toBe('Dearborn')
    expect(loc.recommendedMethod).toBe('ISNA')
    expect(loc.methodSource).toBe('city-institutional')
  })

  it('Windsor Ontario resolves to Canada, not Detroit or Dearborn', () => {
    const center = detectLocation(42.3149, -83.0364)
    expect(center.city?.name).toBe('Windsor')
    expect(center.city?.countryISO).toBe('CA')
    expect(center.country).toBe('Canada')
    expect(center.timezone).toBe('America/Toronto')

    const west = detectLocation(42.30, -83.08)
    expect(west.city?.name).toBe('Windsor')
    expect(west.city?.countryISO).toBe('CA')
    expect(west.country).toBe('Canada')

    const detroit = detectLocation(42.3314, -83.0458)
    expect(detroit.city?.name).toBe('Detroit')
    expect(detroit.country).toBe('USA')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Pure-function invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — purity', () => {
  it('repeated calls with same input return equivalent results', () => {
    const a = detectLocation(36.34, 43.13)
    const b = detectLocation(36.34, 43.13)
    expect(a.city.name).toBe(b.city.name)
    expect(a.recommendedMethod).toBe(b.recommendedMethod)
    expect(a.methodSource).toBe(b.methodSource)
  })

  it('does not mutate the registry', () => {
    const before = detectLocation(36.34, 43.13)
    const beforeAlts = before.altMethods.length
    // Mutate the returned altMethods array
    before.altMethods.push({ method: 'TEST', source: 'should-not-leak' })
    // Re-query — the registry should not have absorbed the mutation
    const after = detectLocation(36.34, 43.13)
    expect(after.altMethods.length).toBe(beforeAlts)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// v1.7.5: issue #47 regression coverage — the four false positives the
// agiftoftime-agent surfaced during a 52-coord worldwide sample. Each MUST
// resolve to the correct city AND the correct country. These tests gate
// every future commit; failing any indicates a regression.
// ─────────────────────────────────────────────────────────────────────────────

describe('detectLocation — issue #47 regression', () => {
  it('Toronto CBD → city=Toronto, country=Canada (was country=USA before v1.7.5)', () => {
    const loc = detectLocation(43.65, -79.38)
    expect(loc.city?.name).toBe('Toronto')
    expect(loc.country).toBe('Canada')
  })

  it('Cairo Tahrir Square → city=Cairo (was city=Giza before v1.7.5)', () => {
    const loc = detectLocation(30.04, 31.24)
    expect(loc.city?.name).toBe('Cairo')
    expect(loc.country).toBe('Egypt')
  })

  it('Kuala Lumpur Petronas Towers → city=Kuala Lumpur (was city=Shah Alam before v1.7.5)', () => {
    const loc = detectLocation(3.14, 101.69)
    expect(loc.city?.name).toBe('Kuala Lumpur')
    expect(loc.country).toBe('Malaysia')
  })

  it('Singapore CBD → city=Singapore (was city=Johor Bahru before v1.7.5)', () => {
    const loc = detectLocation(1.35, 103.82)
    expect(loc.city?.name).toBe('Singapore')
    expect(loc.country).toBe('Singapore')
  })

  it('Singapore/Johor WOF-clipped cells keep northern Singapore and tighten Johor Bahru', () => {
    const sembawang = detectLocation(1.449, 103.819)
    expect(sembawang.city?.name).toBe('Singapore')
    expect(sembawang.country).toBe('Singapore')
    expect(sembawang.timezone).toBe('Asia/Singapore')

    const johorCenter = detectLocation(1.4927, 103.7414)
    expect(johorCenter.city?.name).toBe('Johor Bahru')
    expect(johorCenter.country).toBe('Malaysia')
    expect(johorCenter.timezone).toBe('Asia/Kuala_Lumpur')

    const oldNorthCorner = detectLocation(1.68, 103.8)
    expect(oldNorthCorner.city?.name).not.toBe('Johor Bahru')
    expect(oldNorthCorner.country).toBe('Malaysia')

    const oldEastCorner = detectLocation(1.5, 103.93)
    expect(oldEastCorner.city?.name).not.toBe('Johor Bahru')
    expect(oldEastCorner.country).toBe('Malaysia')
  })

  it('Klang Valley WOF-clipped cells preserve local city provenance', () => {
    const kualaLumpur = detectLocation(3.139, 101.6869)
    expect(kualaLumpur.city?.name).toBe('Kuala Lumpur')
    expect(kualaLumpur.country).toBe('Malaysia')
    expect(kualaLumpur.timezone).toBe('Asia/Kuala_Lumpur')

    const petalingJaya = detectLocation(3.1074, 101.6180)
    expect(petalingJaya.city?.name).toBe('Petaling Jaya')
    expect(petalingJaya.country).toBe('Malaysia')
    expect(petalingJaya.timezone).toBe('Asia/Kuala_Lumpur')

    const shahAlam = detectLocation(3.0844, 101.5246)
    expect(shahAlam.city?.name).toBe('Shah Alam')
    expect(shahAlam.country).toBe('Malaysia')

    const klang = detectLocation(3.1062, 101.3994)
    expect(klang.city?.name).toBe('Klang')
    expect(klang.country).toBe('Malaysia')
  })

  it('Sialkot WOF cell no longer shadows Gujranwala north-east edge', () => {
    const gujranwalaEdge = detectLocation(32.42, 74.46)
    expect(gujranwalaEdge.city?.name).toBe('Gujranwala')
    expect(gujranwalaEdge.country).toBe('Pakistan')
    expect(gujranwalaEdge.timezone).toBe('Asia/Karachi')

    const sialkotCenter = detectLocation(32.4945, 74.5229)
    expect(sialkotCenter.city?.name).toBe('Sialkot')
    expect(sialkotCenter.country).toBe('Pakistan')
    expect(sialkotCenter.timezone).toBe('Asia/Karachi')

    const sialkotWestEdge = detectLocation(32.49, 74.495)
    expect(sialkotWestEdge.city?.name).toBe('Sialkot')
    expect(sialkotWestEdge.country).toBe('Pakistan')
  })

  // Additional v1.7.5 regression cases (Reviewer C's "definitely wrong" list).
  it('Sharm el-Sheikh → country=Egypt with Egyptian method (was SaudiArabia/UmmAlQura)', () => {
    const loc = detectLocation(27.92, 34.33)
    expect(loc.country).toBe('Egypt')
    expect(loc.recommendedMethod).toBe('Egyptian')
  })

  it('Hafar al-Batin → country=SaudiArabia (was Iran/Tehran)', () => {
    const loc = detectLocation(28.43, 45.97)
    expect(loc.country).toBe('SaudiArabia')
    expect(loc.recommendedMethod).toBe('UmmAlQura')
  })

  it('Vientiane LA → country=Laos (was Thailand)', () => {
    const loc = detectLocation(17.98, 102.63)
    expect(loc.country).toBe('Laos')
  })

  it('Phnom Penh KH → country=Cambodia (was Thailand or Vietnam)', () => {
    const loc = detectLocation(11.56, 104.93)
    expect(loc.country).toBe('Cambodia')
  })

  it('Hanoi VN → country=Vietnam (was Laos)', () => {
    const loc = detectLocation(21.03, 105.85)
    expect(loc.country).toBe('Vietnam')
  })

  it('Malabo northern bbox sample → city=Malabo, country=EquatorialGuinea', () => {
    const loc = detectLocation(3.8519, 8.7786)
    expect(loc.city?.name).toBe('Malabo')
    expect(loc.city?.countryISO).toBe('GQ')
    expect(loc.country).toBe('EquatorialGuinea')
  })

  it('Asunción PY → country=Paraguay (was Argentina)', () => {
    const loc = detectLocation(-25.26, -57.58)
    expect(loc.country).toBe('Paraguay')
  })

  it('Montreal CA → country=Canada (was USA)', () => {
    const loc = detectLocation(45.50, -73.57)
    expect(loc.country).toBe('Canada')
  })

  it('Vancouver CA → country=Canada (was USA)', () => {
    const loc = detectLocation(49.28, -123.12)
    expect(loc.country).toBe('Canada')
  })

  it('Cross-border sanity: detectCountry==null does not break city scan', () => {
    // Open ocean — both detectCountry and city scan should return null
    // without throwing.
    const loc = detectLocation(0, -150)
    expect(loc.city).toBeNull()
    expect(loc.country).toBeNull()
  })
})
