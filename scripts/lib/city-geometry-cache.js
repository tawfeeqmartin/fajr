// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Helpers for hydrating build-time city geometry cache files from reviewed
 * source-map entries. Raw geometry stays outside git/npm in .cache.
 */

import path from 'node:path'

export function geometryEntries(sourceMap, { provider = null, city = null } = {}) {
  const cityFilter = city ? normalizeCityFilter(city) : null
  const out = []
  for (const entry of sourceMap.cities || []) {
    if (cityFilter && !matchesCity(entry.cityKey, cityFilter)) continue
    for (const geometry of entry.geometries || []) {
      if (provider && geometry.provider !== provider) continue
      out.push({ entry, geometry })
    }
  }
  return out
}

export function wofDataPath(wofId) {
  const id = String(wofId || '')
  if (!/^\d+$/.test(id)) throw new Error(`Invalid WOF id: ${wofId}`)
  return id.match(/.{1,3}/g).join('/')
}

export function wofRawUrl(geometry, { branch = 'master' } = {}) {
  const wofId = geometry.ids?.wofId || parseWofStableId(geometry.stableId).id
  const repo = geometry.ids?.repo || geometry.repo
  if (!repo) throw new Error(`${geometry.stableId || wofId}: missing WOF repo`)
  return `https://raw.githubusercontent.com/whosonfirst-data/${repo}/${branch}/data/${wofDataPath(wofId)}/${wofId}.geojson`
}

export function geoboundariesApiUrl(geometry, { version = 'current' } = {}) {
  const ids = geometry.ids || {}
  const parsed = parseGeoBoundariesStableId(geometry.stableId)
  const boundaryId = ids.boundaryId || parsed.boundaryId
  const match = /^([A-Z]{3})-(ADM\d+)-/.exec(boundaryId)
  if (!match) throw new Error(`${geometry.stableId || boundaryId}: invalid geoBoundaries boundaryId`)
  const iso = ids.boundaryISO || ids.boundaryIso || match[1]
  const boundaryType = ids.boundaryType || match[2]
  const releaseType = ids.releaseType || 'gbOpen'
  return `https://www.geoboundaries.org/api/${version}/${releaseType}/${iso}/${boundaryType}/`
}

export function geoBoundariesFeatureCollection(geojson, shapeId) {
  if (!shapeId) throw new Error('Missing geoBoundaries shapeId')
  if (!geojson || geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
    throw new Error('geoBoundaries download must be a FeatureCollection')
  }
  const features = geojson.features.filter(feature => feature.properties?.shapeID === shapeId)
  if (!features.length) throw new Error(`geoBoundaries shapeID not found: ${shapeId}`)
  return {
    type: 'FeatureCollection',
    features,
  }
}

export function safeCachePath(cacheDir, cacheFile) {
  if (!cacheFile) throw new Error('Missing cacheFile')
  const root = path.resolve(cacheDir)
  const target = path.resolve(root, cacheFile)
  if (!target.startsWith(root + path.sep) && target !== root) {
    throw new Error(`cacheFile escapes cache dir: ${cacheFile}`)
  }
  return target
}

export function parseWofStableId(stableId) {
  const match = /^wof:([a-z]+):(\d+)$/.exec(String(stableId || ''))
  if (!match) throw new Error(`Invalid WOF stableId: ${stableId}`)
  return { placetype: match[1], id: match[2] }
}

export function parseGeoBoundariesStableId(stableId) {
  const match = /^geoboundaries:([A-Z]{3}-ADM\d+-\d+):([A-Za-z0-9]+)$/.exec(String(stableId || ''))
  if (!match) throw new Error(`Invalid geoBoundaries stableId: ${stableId}`)
  return { boundaryId: match[1], shapeId: match[2] }
}

function matchesCity(cityKey, filter) {
  const normalized = normalizeCityFilter(cityKey)
  return normalized === filter || normalized.startsWith(`${filter}|`)
}

function normalizeCityFilter(value) {
  return String(value || '').trim().toLowerCase()
}
