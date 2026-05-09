// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Build-time advisory audit for city bbox rows against cached GeoJSON
 * geometry. This script never downloads data and never mutates cities.json.
 *
 * Expected source-map shape:
 * {
 *   "version": 1,
 *   "cities": [
 *     {
 *       "cityKey": "Rabat|MA",
 *       "geometries": [
 *         {
 *           "provider": "wof",
 *           "stableId": "whosonfirst:locality:...",
 *           "licenseUse": "audit-only-until-license-review",
 *           "cacheFile": "MA/rabat.geojson",
 *           "sourceConfidence": "high",
 *           "matchConfidence": "candidate",
 *           "reviewStatus": "candidate"
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cityModule from '../src/data/cities.json' with { type: 'json' }
import { compareCityBboxToGeojson } from './lib/geometry-audit.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const args = parseArgs(process.argv.slice(2))
const sourcePath = path.resolve(ROOT, args.sources || 'scripts/data/city-geometry-sources.json')
const format = args.format || 'markdown'

if (!fs.existsSync(sourcePath)) {
  console.log(`[audit-city-geometry] no source map found at ${path.relative(ROOT, sourcePath)}`)
  console.log('[audit-city-geometry] create scripts/data/city-geometry-sources.json after stable external IDs are reviewed')
  process.exit(0)
}

const sourceMap = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const cacheDir = path.resolve(ROOT, args.cacheDir || sourceMap.cacheRoot || '.cache/city-geometry')
const registry = cityModule.cities || []
const registryByKey = new Map(registry.map(city => [cityKey(city.name, city.countryISO), city]))
const rows = []

for (const entry of sourceMap.cities || []) {
  const parsed = parseCityEntry(entry)
  const city = registryByKey.get(cityKey(parsed.city, parsed.countryISO))
  if (!city) {
    rows.push({
      city: parsed.city,
      countryISO: parsed.countryISO,
      provider: null,
      stableId: null,
      status: 'city-not-found',
    })
    continue
  }

  const sources = geometrySourcesForEntry(entry)
  if (!sources.length) {
    rows.push(sourceMapEntryRow(city, entry, { status: 'no-geometry-candidates' }))
    continue
  }

  for (const source of sources) {
    const cacheFile = source.cacheFile || source.geometryFile
    if (!cacheFile) {
      rows.push(sourceRow(city, source, { status: 'missing-cache-file' }))
      continue
    }

    const geometryPath = path.resolve(cacheDir, cacheFile)
    if (!geometryPath.startsWith(cacheDir + path.sep) && geometryPath !== cacheDir) {
      rows.push(sourceRow(city, source, { status: 'cache-path-outside-cache-dir' }))
      continue
    }
    if (!fs.existsSync(geometryPath)) {
      rows.push(sourceRow(city, source, { status: 'cache-file-not-found' }))
      continue
    }

    const geojson = JSON.parse(fs.readFileSync(geometryPath, 'utf8'))
    rows.push(sourceRow(city, source, compareCityBboxToGeojson(city, geojson)))
  }
}

if (format === 'json') {
  console.log(JSON.stringify(report(rows), null, 2))
} else {
  printMarkdown(rows)
}

function sourceRow(city, source, result) {
  const sourceNeedsReview = source.sourceConfidence !== 'high' ||
    Boolean(source.matchConfidence && source.matchConfidence !== 'candidate')
  return {
    cityKey: `${city.name}|${city.countryISO}`,
    city: city.name,
    countryISO: city.countryISO,
    provider: source.provider || null,
    stableId: source.stableId || source.id || null,
    license: source.license || null,
    sourceConfidence: source.sourceConfidence || source.confidence || null,
    matchConfidence: source.matchConfidence || null,
    licenseUse: source.licenseUse || null,
    reviewStatus: source.reviewStatus || null,
    sourceNeedsReview: result.status === 'checked' ? sourceNeedsReview : null,
    ...result,
  }
}

function sourceMapEntryRow(city, entry, result) {
  return {
    cityKey: `${city.name}|${city.countryISO}`,
    city: city.name,
    countryISO: city.countryISO,
    priority: entry.priority || [],
    reviewStatus: entry.review?.status || null,
    notes: entry.notes || entry.review?.notes || [],
    provider: null,
    stableId: null,
    ...result,
  }
}

function report(rows) {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sourcePath: path.relative(ROOT, sourcePath),
    registryPath: 'src/data/cities.json',
    cacheDir: path.relative(ROOT, cacheDir),
    summary: {
      sourceMapCities: (sourceMap.cities || []).length,
      sourceRowsReported: rows.length,
      checked: rows.filter(row => row.status === 'checked').length,
      missingCacheFiles: rows.filter(row => row.status === 'cache-file-not-found').length,
      missingGeometry: rows.filter(row => row.status === 'missing-geometry').length,
      noGeometryCandidates: rows.filter(row => row.status === 'no-geometry-candidates').length,
      cityNotFound: rows.filter(row => row.status === 'city-not-found').length,
      sourceNeedsReview: rows.filter(row => row.sourceNeedsReview).length,
      triage: triageCounts(rows),
    },
    rows,
  }
}

function triageCounts(rows) {
  const counts = {}
  for (const row of rows) {
    const action = row.triage?.action
    if (!action) continue
    counts[action] = (counts[action] || 0) + 1
  }
  return counts
}

function cityKey(name, iso) {
  return `${String(name).toLowerCase()}|${String(iso).toUpperCase()}`
}

function parseCityEntry(entry) {
  if (entry.cityKey) {
    const [city, countryISO] = String(entry.cityKey).split('|')
    return { city, countryISO }
  }
  return { city: entry.city, countryISO: entry.countryISO }
}

function geometrySourcesForEntry(entry) {
  if (Array.isArray(entry.geometries)) return entry.geometries
  if (entry.provider || entry.stableId || entry.cacheFile || entry.geometryFile) return [entry]
  return []
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--sources') out.sources = argv[++i]
    else if (arg === '--cache-dir') out.cacheDir = argv[++i]
    else if (arg === '--format') out.format = argv[++i]
  }
  return out
}

function printMarkdown(rows) {
  console.log('# City Geometry Bbox Audit')
  console.log('')
  console.log(`Source map: ${path.relative(ROOT, sourcePath)}`)
  console.log(`Cache dir: ${path.relative(ROOT, cacheDir)}`)
  console.log(`Rows checked: ${rows.length}`)
  console.log('')
  console.log('| City | ISO | Provider | Stable ID | Status | Triage | Source review | License use | Center in geometry | Overcoverage | Undercoverage |')
  console.log('|---|---|---|---|---|---|---|---|---:|---:|---:|')
  for (const row of rows) {
    console.log([
      row.city,
      row.countryISO,
      row.provider || '-',
      row.stableId || '-',
      row.status,
      row.triage?.action || '-',
      row.sourceNeedsReview == null ? '-' : String(row.sourceNeedsReview),
      row.licenseUse || '-',
      row.centerInsideGeometry == null ? '-' : String(row.centerInsideGeometry),
      percent(row.coverage?.overcoverageRatio),
      percent(row.coverage?.undercoverageRatio),
    ].map(markdownCell).join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
  }
}

function percent(value) {
  return value == null ? '-' : `${(value * 100).toFixed(1)}%`
}

function markdownCell(value) {
  return String(value).replaceAll('|', '\\|')
}
