// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Geometry helpers for build-time city-bbox auditing.
 *
 * These functions deliberately use plain GeoJSON and small, dependency-free
 * geometry primitives. They are for registry QA reports, not prayer-time
 * calculation. Runtime detectLocation() remains the compact bbox resolver.
 */

const EPS = 1e-12

export function bboxAreaDeg2(bbox) {
  const [latMin, latMax, lonMin, lonMax] = bbox
  return Math.max(0, latMax - latMin) * Math.max(0, lonMax - lonMin)
}

export function bboxContainsPoint(bbox, lat, lon) {
  const [latMin, latMax, lonMin, lonMax] = bbox
  return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax
}

export function bboxIntersection(a, b) {
  const out = [
    Math.max(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.min(a[3], b[3]),
  ]
  return out[0] <= out[1] && out[2] <= out[3] ? out : null
}

export function bboxForGeojson(input) {
  const coords = []
  collectCoordinates(input, coords)
  if (!coords.length) return null

  let latMin = Infinity
  let latMax = -Infinity
  let lonMin = Infinity
  let lonMax = -Infinity
  for (const [lon, lat] of coords) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    if (lat < latMin) latMin = lat
    if (lat > latMax) latMax = lat
    if (lon < lonMin) lonMin = lon
    if (lon > lonMax) lonMax = lon
  }
  if (!Number.isFinite(latMin)) return null
  return [latMin, latMax, lonMin, lonMax]
}

export function geojsonContainsPoint(input, lat, lon) {
  if (!input) return false
  if (input.type === 'Feature') return geojsonContainsPoint(input.geometry, lat, lon)
  if (input.type === 'FeatureCollection') {
    return input.features.some(feature => geojsonContainsPoint(feature, lat, lon))
  }
  if (input.type === 'GeometryCollection') {
    return input.geometries.some(geometry => geojsonContainsPoint(geometry, lat, lon))
  }
  if (input.type === 'Polygon') return polygonContainsPoint(input.coordinates, lat, lon)
  if (input.type === 'MultiPolygon') {
    return input.coordinates.some(polygon => polygonContainsPoint(polygon, lat, lon))
  }
  if (input.type === 'Point') {
    return Math.abs(input.coordinates[0] - lon) < EPS &&
      Math.abs(input.coordinates[1] - lat) < EPS
  }
  return false
}

export function compareCityBboxToGeojson(city, geojson) {
  const registryBbox = city.bbox
  const geometryBbox = bboxForGeojson(geojson)
  if (!geometryBbox) {
    return {
      city: city.name,
      countryISO: city.countryISO,
      status: 'missing-geometry',
    }
  }

  const intersection = bboxIntersection(registryBbox, geometryBbox)
  const registryArea = bboxAreaDeg2(registryBbox)
  const geometryArea = bboxAreaDeg2(geometryBbox)
  const intersectionArea = intersection ? bboxAreaDeg2(intersection) : 0

  return {
    city: city.name,
    countryISO: city.countryISO,
    status: 'checked',
    registryBbox,
    geometryBbox,
    centerInsideGeometry: geojsonContainsPoint(geojson, city.lat, city.lon),
    centerInsideRegistryBbox: bboxContainsPoint(registryBbox, city.lat, city.lon),
    bboxIntersection: intersection,
    registryBboxAreaDeg2: registryArea,
    geometryBboxAreaDeg2: geometryArea,
    bboxIntersectionAreaDeg2: intersectionArea,
    registryBboxOutsideGeometryBboxRatio: ratio(registryArea - intersectionArea, registryArea),
    geometryBboxOutsideRegistryBboxRatio: ratio(geometryArea - intersectionArea, geometryArea),
    coverage: sampleCoverage(city.bbox, geojson, geometryBbox),
  }
}

export function gridSamplesForBbox(bbox, side = gridSideForBbox(bbox)) {
  const [latMin, latMax, lonMin, lonMax] = bbox
  const out = []
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      out.push({
        lat: latMin + ((y + 0.5) / side) * (latMax - latMin),
        lon: lonMin + ((x + 0.5) / side) * (lonMax - lonMin),
      })
    }
  }
  return out
}

export function gridSideForBbox(bbox) {
  const [latMin, latMax, lonMin, lonMax] = bbox
  const centerLat = (latMin + latMax) / 2
  const heightKm = Math.abs(latMax - latMin) * 111.32
  const widthKm = Math.abs(lonMax - lonMin) * 111.32 * Math.max(0.1, Math.cos(centerLat * Math.PI / 180))
  return clamp(21, 81, Math.ceil(Math.max(widthKm, heightKm) / 2))
}

export function sampleCoverage(registryBbox, geojson, geometryBbox = bboxForGeojson(geojson)) {
  const registrySamples = gridSamplesForBbox(registryBbox)
  const registryOutsideGeometry = registrySamples.filter(
    point => !geojsonContainsPoint(geojson, point.lat, point.lon)
  )

  const geometrySamples = geometryBbox ? gridSamplesForBbox(geometryBbox) : []
  const insideGeometry = geometrySamples.filter(
    point => geojsonContainsPoint(geojson, point.lat, point.lon)
  )
  const geometryOutsideRegistry = insideGeometry.filter(
    point => !bboxContainsPoint(registryBbox, point.lat, point.lon)
  )

  return {
    registryGridSide: Math.sqrt(registrySamples.length),
    geometryGridSide: geometrySamples.length ? Math.sqrt(geometrySamples.length) : 0,
    overcoverageRatio: ratio(registryOutsideGeometry.length, registrySamples.length),
    undercoverageRatio: ratio(geometryOutsideRegistry.length, insideGeometry.length),
    registrySampleCount: registrySamples.length,
    geometrySampleCount: insideGeometry.length,
  }
}

function ratio(numerator, denominator) {
  if (!denominator) return 0
  return Math.max(0, numerator) / denominator
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value))
}

function polygonContainsPoint(polygon, lat, lon) {
  if (!polygon.length) return false
  if (!ringContainsPoint(polygon[0], lat, lon)) return false
  for (let i = 1; i < polygon.length; i++) {
    if (ringContainsPoint(polygon[i], lat, lon)) return false
  }
  return true
}

function ringContainsPoint(ring, lat, lon) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]

    if (pointOnSegment(lon, lat, xi, yi, xj, yj)) return true

    const intersects = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)
    if (intersects) inside = !inside
  }
  return inside
}

function pointOnSegment(x, y, x1, y1, x2, y2) {
  const cross = (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1)
  if (Math.abs(cross) > EPS) return false

  const minX = Math.min(x1, x2) - EPS
  const maxX = Math.max(x1, x2) + EPS
  const minY = Math.min(y1, y2) - EPS
  const maxY = Math.max(y1, y2) + EPS
  return x >= minX && x <= maxX && y >= minY && y <= maxY
}

function collectCoordinates(input, out) {
  if (!input) return
  if (input.type === 'Feature') return collectCoordinates(input.geometry, out)
  if (input.type === 'FeatureCollection') {
    for (const feature of input.features || []) collectCoordinates(feature, out)
    return
  }
  if (input.type === 'GeometryCollection') {
    for (const geometry of input.geometries || []) collectCoordinates(geometry, out)
    return
  }
  collectCoordinateArray(input.coordinates, out)
}

function collectCoordinateArray(value, out) {
  if (!Array.isArray(value)) return
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    out.push(value)
    return
  }
  for (const child of value) collectCoordinateArray(child, out)
}
