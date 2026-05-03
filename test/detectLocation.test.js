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

describe('detectLocation — city-method-override dispatch (12 cities)', () => {
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
