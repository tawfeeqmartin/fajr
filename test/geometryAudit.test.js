// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { describe, expect, it } from 'vitest'
import {
  bboxForGeojson,
  bboxIntersection,
  compareCityBboxToGeojson,
  geojsonContainsPoint,
  gridSamplesForBbox,
  gridSideForBbox,
  sampleCoverage,
  triageGeometryComparison,
} from '../scripts/lib/geometry-audit.js'

describe('geometry audit helpers', () => {
  const squareWithHole = {
    type: 'Feature',
    properties: { name: 'Test City' },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]],
        [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
      ],
    },
  }

  it('computes bbox in fajr lat-min/lat-max/lon-min/lon-max order', () => {
    expect(bboxForGeojson(squareWithHole)).toEqual([0, 10, 0, 10])
  })

  it('handles polygon shells, holes, and boundary points', () => {
    expect(geojsonContainsPoint(squareWithHole, 2, 2)).toBe(true)
    expect(geojsonContainsPoint(squareWithHole, 5, 5)).toBe(false)
    expect(geojsonContainsPoint(squareWithHole, 0, 5)).toBe(true)
    expect(geojsonContainsPoint(squareWithHole, 12, 5)).toBe(false)
  })

  it('handles multipolygons', () => {
    const multipolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [[[20, 20], [21, 20], [21, 21], [20, 21], [20, 20]]],
        [[[30, 30], [31, 30], [31, 31], [30, 31], [30, 30]]],
      ],
    }
    expect(bboxForGeojson(multipolygon)).toEqual([20, 31, 20, 31])
    expect(geojsonContainsPoint(multipolygon, 20.5, 20.5)).toBe(true)
    expect(geojsonContainsPoint(multipolygon, 25, 25)).toBe(false)
    expect(geojsonContainsPoint(multipolygon, 30.5, 30.5)).toBe(true)
  })

  it('handles FeatureCollection and GeometryCollection inputs', () => {
    const collection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-1, -2] },
          properties: {},
        },
        {
          type: 'Feature',
          geometry: {
            type: 'GeometryCollection',
            geometries: [
              {
                type: 'Polygon',
                coordinates: [[[40, 40], [41, 40], [41, 41], [40, 41], [40, 40]]],
              },
            ],
          },
          properties: {},
        },
      ],
    }
    expect(bboxForGeojson(collection)).toEqual([-2, 41, -1, 41])
    expect(geojsonContainsPoint(collection, -2, -1)).toBe(true)
    expect(geojsonContainsPoint(collection, 40.5, 40.5)).toBe(true)
    expect(geojsonContainsPoint(collection, 20, 20)).toBe(false)
  })

  it('returns null bbox and false containment for empty geometry', () => {
    const empty = { type: 'Polygon', coordinates: [] }
    expect(bboxForGeojson(empty)).toBeNull()
    expect(geojsonContainsPoint(empty, 0, 0)).toBe(false)
  })

  it('computes bbox intersections', () => {
    expect(bboxIntersection([0, 10, 0, 10], [5, 15, 2, 8])).toEqual([5, 10, 2, 8])
    expect(bboxIntersection([0, 1, 0, 1], [2, 3, 2, 3])).toBeNull()
  })

  it('compares registry bbox against external geometry bbox', () => {
    const city = {
      name: 'Test City',
      countryISO: 'TC',
      lat: 2,
      lon: 2,
      bbox: [0, 3, 0, 3],
    }
    const result = compareCityBboxToGeojson(city, squareWithHole)
    expect(result.status).toBe('checked')
    expect(result.centerInsideGeometry).toBe(true)
    expect(result.centerInsideRegistryBbox).toBe(true)
    expect(result.geometryBbox).toEqual([0, 10, 0, 10])
    expect(result.registryBboxOutsideGeometryBboxRatio).toBe(0)
    expect(result.geometryBboxOutsideRegistryBboxRatio).toBe(0.91)
    expect(result.coverage.overcoverageRatio).toBe(0)
    expect(result.coverage.undercoverageRatio).toBeGreaterThan(0.7)
    expect(result.triage.action).toBe('undercoverage-review')
  })

  it('separates center-inside-geometry from center-inside-registry-bbox', () => {
    const city = {
      name: 'Offset City',
      countryISO: 'OC',
      lat: 2,
      lon: 2,
      bbox: [20, 21, 20, 21],
    }
    const result = compareCityBboxToGeojson(city, squareWithHole)
    expect(result.status).toBe('checked')
    expect(result.centerInsideGeometry).toBe(true)
    expect(result.centerInsideRegistryBbox).toBe(false)
    expect(result.bboxIntersection).toBeNull()
    expect(result.triage.action).toBe('registry-center-review')
  })

  it('reports missing geometry when no usable coordinates exist', () => {
    const city = {
      name: 'Missing Geometry City',
      countryISO: 'MG',
      lat: 0,
      lon: 0,
      bbox: [0, 1, 0, 1],
    }
    expect(compareCityBboxToGeojson(city, { type: 'FeatureCollection', features: [] })).toEqual({
      city: 'Missing Geometry City',
      countryISO: 'MG',
      status: 'missing-geometry',
    })
  })

  it('uses deterministic grid samples for coverage estimates', () => {
    expect(gridSideForBbox([0, 0.1, 0, 0.1])).toBe(21)
    const samples = gridSamplesForBbox([0, 1, 0, 1], 3)
    expect(samples).toEqual([
      { lat: 1 / 6, lon: 1 / 6 },
      { lat: 1 / 6, lon: 0.5 },
      { lat: 1 / 6, lon: 5 / 6 },
      { lat: 0.5, lon: 1 / 6 },
      { lat: 0.5, lon: 0.5 },
      { lat: 0.5, lon: 5 / 6 },
      { lat: 5 / 6, lon: 1 / 6 },
      { lat: 5 / 6, lon: 0.5 },
      { lat: 5 / 6, lon: 5 / 6 },
    ])
  })

  it('clamps grid side and returns deterministic coverage results', () => {
    expect(gridSideForBbox([0, 0.01, 0, 0.01])).toBe(21)
    expect(gridSideForBbox([0, 100, 0, 100])).toBe(81)
    const first = sampleCoverage([0, 3, 0, 3], squareWithHole)
    const second = sampleCoverage([0, 3, 0, 3], squareWithHole)
    expect(second).toEqual(first)
  })

  it('triages over-broad registry bboxes for tightening review', () => {
    const city = {
      name: 'Broad City',
      countryISO: 'BC',
      lat: 2,
      lon: 2,
      bbox: [-10, 20, -10, 20],
    }
    const result = compareCityBboxToGeojson(city, squareWithHole)
    expect(result.triage.action).toBe('tighten-review')
    expect(result.triage.severity).toBe('medium')
  })

  it('returns null triage for unchecked rows', () => {
    expect(triageGeometryComparison({ status: 'cache-file-not-found' })).toBeNull()
  })
})
