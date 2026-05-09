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

function matchesCity(cityKey, filter) {
  const normalized = normalizeCityFilter(cityKey)
  return normalized === filter || normalized.startsWith(`${filter}|`)
}

function normalizeCityFilter(value) {
  return String(value || '').trim().toLowerCase()
}
