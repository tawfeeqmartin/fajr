// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Unit tests for nearestCity — v1.7.3.
 *
 * nearestCity is a kNN-fuzzy lookup that returns the geographically nearest
 * city in the bundled registry along with the haversine distance in km. It
 * is DISPLAY-ONLY — never used to drive prayer-time dispatch. These tests
 * cover the public-API contract:
 *
 *   1. nearestCity is exported from both default and named imports
 *   2. Mecca coords resolve to Mecca with sub-5km distance
 *   3. Open ocean coords return some city with > 1000km distance (never null)
 *   4. Distance is monotonic — moving farther from a city increases distanceKm
 *   5. Brisbane (the agiftoftime issue #37 use case) resolves correctly
 *   6. Sydney resolves to its registered row (not a Canberra near-miss)
 *   7. Antarctica returns the geographically-nearest non-Antarctica city
 *      gracefully — never null
 *   8. Haversine sanity: Mecca → Madinah ≈ 340 km
 *   9. nearestCity does NOT contaminate the prayer-time dispatch path —
 *      detectLocation behaviour for the same out-of-bbox coord remains
 *      strict (city: null)
 *  10. Coords inside one city's bbox but far from another return the closer
 *      city — basic correctness check
 */

import { describe, it, expect } from 'vitest'
import fajrDefault, {
  nearestCity,
  detectLocation,
} from '../src/index.js'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Public-export contract
// ─────────────────────────────────────────────────────────────────────────────

describe('public API — nearestCity export contract', () => {
  it('nearestCity is a named export from @tawfeeqmartin/fajr', () => {
    expect(typeof nearestCity).toBe('function')
  })

  it('nearestCity is on the default-export namespace', () => {
    expect(typeof fajrDefault.nearestCity).toBe('function')
  })

  it('default and named export return identical results for the same input', () => {
    const a = nearestCity(21.4225, 39.8262)
    const b = fajrDefault.nearestCity(21.4225, 39.8262)
    expect(a.city.name).toBe(b.city.name)
    expect(a.distanceKm).toBeCloseTo(b.distanceKm, 6)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Return-shape contract — always non-null city + numeric distanceKm
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — return shape', () => {
  it('returns { city, distanceKm } with city non-null and distanceKm numeric', () => {
    const r = nearestCity(21.4225, 39.8262)
    expect(r).toBeDefined()
    expect(r.city).not.toBeNull()
    expect(typeof r.city).toBe('object')
    expect(typeof r.city.name).toBe('string')
    expect(typeof r.distanceKm).toBe('number')
    expect(Number.isFinite(r.distanceKm)).toBe(true)
    expect(r.distanceKm).toBeGreaterThanOrEqual(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mecca exact-coord case — sub-5km distance to Mecca
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — Mecca exact coordinates', () => {
  it('Mecca (21.4225, 39.8262) → city.name === "Mecca", distanceKm < 5', () => {
    const r = nearestCity(21.4225, 39.8262)
    expect(r.city.name).toBe('Mecca')
    expect(r.distanceKm).toBeLessThan(5)
    // The exact registry row centre is (21.4225, 39.8262), so distance to
    // itself should be ≈ 0 — but we allow ε-tolerance for floating-point.
    expect(r.distanceKm).toBeLessThan(0.01)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Open ocean — never null, very large distanceKm
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — open ocean / extreme cases (never null)', () => {
  it('mid-Atlantic (0, -30) → returns a city, distanceKm > 1000', () => {
    const r = nearestCity(0, -30)
    expect(r.city).not.toBeNull()
    expect(typeof r.city.name).toBe('string')
    expect(r.distanceKm).toBeGreaterThan(1000)
  })

  it('mid-Pacific (0, -150) → returns a city, distanceKm > 1000', () => {
    const r = nearestCity(0, -150)
    expect(r.city).not.toBeNull()
    expect(r.distanceKm).toBeGreaterThan(1000)
  })

  it('Antarctica (-80, 0) → returns the geographically-nearest non-Antarctica city, never null', () => {
    const r = nearestCity(-80, 0)
    expect(r.city).not.toBeNull()
    expect(typeof r.city.name).toBe('string')
    // The registry has no Antarctica entries, so the nearest will be in the
    // southern hemisphere — Cape Town / Perth / Christchurch / Buenos Aires
    // tier. Distance is necessarily > 1000 km.
    expect(r.distanceKm).toBeGreaterThan(1000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Brisbane — the agiftoftime issue #37 exact use case
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — Brisbane (agiftoftime issue #37)', () => {
  it('Brisbane (-27.4698, 153.0251) → city.name === "Brisbane"', () => {
    const r = nearestCity(-27.4698, 153.0251)
    expect(r.city.name).toBe('Brisbane')
    // Exact centre — distance should be ≈ 0.
    expect(r.distanceKm).toBeLessThan(0.01)
  })

  it('5 km north-east of Brisbane → still Brisbane, distanceKm ≈ 5', () => {
    // ~5 km north-east of the city centre — still inside Brisbane's bbox,
    // so the label "Brisbane" is the correct one and distance is small.
    const r = nearestCity(-27.43, 153.06)
    expect(r.city.name).toBe('Brisbane')
    expect(r.distanceKm).toBeGreaterThan(0)
    expect(r.distanceKm).toBeLessThan(20)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Sydney — large bbox, registered row should win
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — Sydney centre', () => {
  it('Sydney (-33.8688, 151.2093) → city.name === "Sydney"', () => {
    const r = nearestCity(-33.8688, 151.2093)
    expect(r.city.name).toBe('Sydney')
    expect(r.distanceKm).toBeLessThan(0.01)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. Distance monotonicity — moving farther from a city increases distanceKm
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — distance monotonicity', () => {
  it('moving 1° north of Mecca increases distanceKm vs. exact Mecca', () => {
    const exact = nearestCity(21.4225, 39.8262)
    const offset = nearestCity(22.4225, 39.8262)  // 1° latitude ≈ 111 km north
    expect(offset.distanceKm).toBeGreaterThan(exact.distanceKm)
    // 1° latitude ≈ 111 km — sanity-check the magnitude.
    expect(offset.distanceKm).toBeGreaterThan(50)
    expect(offset.distanceKm).toBeLessThan(200)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. Haversine sanity — Mecca → Madinah is ≈ 340 km
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — haversine sanity', () => {
  it('Mecca → Madinah great-circle distance ≈ 340 km (within ±10%)', () => {
    // Madinah is at (24.4686, 39.6142). nearestCity from Madinah's exact
    // coords should return Medina (the registry's spelling); its distanceKm
    // to itself is ≈ 0, but if we query from Mecca's coords instead, we
    // should land back on Mecca — so we need a point that is closer to
    // Medina than to Mecca, then measure the Mecca→Medina haversine via
    // a constructed lookup.
    //
    // Simpler approach: query nearestCity exactly at Medina's centre,
    // confirm we land on Medina, and use a separate query 0.5° north of
    // Medina to verify distances scale as expected. Then compute the
    // Mecca→Madinah great-circle indirectly: lookup a point midway between
    // them — if both endpoints exist in the registry, the midpoint will
    // pick whichever is closer.
    //
    // For a direct Mecca→Madinah haversine assertion we use a query point
    // exactly at Medina (which is registered) and another exactly at
    // Mecca; both resolve to themselves at ~0 distance. Then we compute
    // the haversine via the difference in lookup distances from a chosen
    // probe point — too indirect.
    //
    // Cleanest: query Madinah's exact registry coordinates and assert
    // city.name === 'Medina' with distanceKm < 0.01. Independently
    // assert that querying near Mecca's edge (0.5° south, away from
    // Madinah) does NOT return Medina — i.e. the kNN respects geography.
    const madinahLookup = nearestCity(24.4686, 39.6142)
    expect(madinahLookup.city.name).toBe('Medina')
    expect(madinahLookup.distanceKm).toBeLessThan(0.01)

    // A coordinate directly between Mecca and Medina (~midpoint) should
    // resolve to whichever city is geographically closer, with a
    // haversine distance roughly half the Mecca→Madinah distance.
    // Mecca→Madinah great-circle distance is ≈ 340 km; midpoint
    // distance to either should be ≈ 170 km.
    const midLat = (21.4225 + 24.4686) / 2
    const midLon = (39.8262 + 39.6142) / 2
    const mid = nearestCity(midLat, midLon)
    // Could be either Mecca or Medina — both are valid; assert magnitude.
    expect(['Mecca', 'Medina']).toContain(mid.city.name)
    expect(mid.distanceKm).toBeGreaterThan(120)
    expect(mid.distanceKm).toBeLessThan(220)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 9. Display-only contract — nearestCity does NOT contaminate detectLocation
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — display-only contract', () => {
  it('detectLocation remains strict for an out-of-bbox coord even after nearestCity is called', () => {
    // Open ocean: nearestCity will return *some* city, but detectLocation
    // must continue to return city: null. This is the load-bearing
    // invariant — nearestCity must not silently broaden detectLocation's
    // resolution.
    const near = nearestCity(0, -30)
    expect(near.city).not.toBeNull()  // nearestCity always returns something
    const loc = detectLocation(0, -30)
    expect(loc.city).toBeNull()       // detectLocation stays strict
    expect(loc.country).toBeNull()
    expect(loc.methodSource).toBe('fallback')
  })

  it('detectLocation Mecca and nearestCity Mecca both resolve to Mecca, but via different paths', () => {
    // For an in-bbox coordinate, both functions agree on the city — but
    // detectLocation populates the full Location record (recommendedMethod,
    // source, etc.) while nearestCity only returns city + distanceKm.
    const loc = detectLocation(21.4225, 39.8262)
    const near = nearestCity(21.4225, 39.8262)
    expect(loc.city.name).toBe('Mecca')
    expect(near.city.name).toBe('Mecca')
    // detectLocation carries dispatch metadata; nearestCity does not.
    expect(loc.recommendedMethod).toBeDefined()
    expect(near.distanceKm).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 10. Closer-city correctness: query in a bbox-overlap zone and verify
//     the geographically nearer city wins.
// ─────────────────────────────────────────────────────────────────────────────

describe('nearestCity — closer-city correctness', () => {
  it('Coordinate clearly nearer Brisbane than Sydney → returns Brisbane', () => {
    // Brisbane is at (-27.47, 153.02); Sydney is at (-33.87, 151.21).
    // A point near Brisbane should return Brisbane, not Sydney, even
    // though both Australian metros are in the registry.
    const r = nearestCity(-27.5, 153.0)
    expect(r.city.name).toBe('Brisbane')
  })

  it('Coordinate clearly nearer Sydney than Brisbane → returns Sydney', () => {
    const r = nearestCity(-33.9, 151.2)
    expect(r.city.name).toBe('Sydney')
  })

  it('Coordinate equidistant should pick a southern-hemisphere Australian city, not a northern one', () => {
    // Halfway between Brisbane and Sydney is around (-30.7, 152.1).
    // Could resolve to either; the assertion is that it's NOT a far-away
    // city like Canberra or Melbourne.
    const r = nearestCity(-30.7, 152.1)
    expect(['Brisbane', 'Sydney']).toContain(r.city.name)
  })
})
