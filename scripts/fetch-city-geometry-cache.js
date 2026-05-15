// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Hydrate reviewed build-time geometry cache files from source-map entries.
 *
 * This script is intentionally limited to providers whose source-map entries
 * carry enough license/repository metadata for deterministic fetches. It does
 * not mutate src/data/cities.json and does not commit raw geometry.
 *
 * Usage:
 *   node scripts/fetch-city-geometry-cache.js --provider wof --dry-run
 *   node scripts/fetch-city-geometry-cache.js --provider wof --city Rabat
 *   node scripts/fetch-city-geometry-cache.js --provider geoboundaries --city Cairo
 *   node scripts/fetch-city-geometry-cache.js --provider wof --format json
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  geoboundariesApiUrl,
  geometryEntries,
  geoBoundariesFeatureCollection,
  parseGeoBoundariesStableId,
  safeCachePath,
  wofRawUrl,
} from './lib/city-geometry-cache.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const args = parseArgs(process.argv.slice(2))
const sourcePath = path.resolve(ROOT, args.sources || 'scripts/data/city-geometry-sources.json')
const sourceMap = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const cacheDir = path.resolve(ROOT, args.cacheDir || sourceMap.cacheRoot || '.cache/city-geometry')
const provider = args.provider || 'wof'
const branch = args.branch || 'master'
const format = args.format || 'text'
const dryRun = Boolean(args.dryRun)
const overwrite = Boolean(args.overwrite)

if (!['wof', 'geoboundaries'].includes(provider)) {
  console.error('Usage error: --provider must be wof or geoboundaries.')
  process.exit(2)
}

const rows = []
const entries = geometryEntries(sourceMap, { provider, city: args.city })
for (const { entry, geometry } of entries) {
  const target = safeCachePath(cacheDir, geometry.cacheFile)
  const url = sourceUrl(geometry, { branch, provider })
  const row = {
    cityKey: entry.cityKey,
    provider: geometry.provider,
    stableId: geometry.stableId,
    cacheFile: geometry.cacheFile,
    sourceConfidence: geometry.sourceConfidence || null,
    matchConfidence: geometry.matchConfidence || null,
    licenseUse: geometry.licenseUse || null,
    url,
  }

  if (fs.existsSync(target) && !overwrite) {
    rows.push({ ...row, status: 'skipped-existing' })
    continue
  }
  if (dryRun) {
    rows.push({ ...row, status: 'would-fetch' })
    continue
  }

  try {
    const geojson = provider === 'geoboundaries'
      ? await fetchGeoBoundariesFeature(geometry)
      : await fetchGeojson(url)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, `${JSON.stringify(geojson, null, 2)}\n`)
    rows.push({ ...row, status: 'fetched' })
  } catch (err) {
    rows.push({ ...row, status: 'error', error: err.message })
  }
}

const report = {
  version: 1,
  generatedAt: new Date().toISOString(),
  sourcePath: path.relative(ROOT, sourcePath),
  cacheDir: path.relative(ROOT, cacheDir),
  provider,
  dryRun,
  summary: {
    rows: rows.length,
    fetched: rows.filter(row => row.status === 'fetched').length,
    skippedExisting: rows.filter(row => row.status === 'skipped-existing').length,
    wouldFetch: rows.filter(row => row.status === 'would-fetch').length,
    errors: rows.filter(row => row.status === 'error').length,
  },
  rows,
}

if (format === 'json') {
  console.log(JSON.stringify(report, null, 2))
} else {
  printText(report)
}

if (report.summary.errors) process.exit(1)

function sourceUrl(geometry, { branch, provider }) {
  if (provider === 'geoboundaries') return geoboundariesApiUrl(geometry)
  return wofRawUrl(geometry, { branch })
}

async function fetchGeoBoundariesFeature(geometry) {
  const parsed = parseGeoBoundariesStableId(geometry.stableId)
  const metadataUrl = geoboundariesApiUrl(geometry)
  const metadata = await fetchJson(metadataUrl)
  const url = metadata.gjDownloadURL || metadata.simplifiedGeometryGeoJSON
  if (!url) throw new Error(`geoBoundaries metadata lacks GeoJSON download URL: ${metadataUrl}`)
  const geojson = await fetchGeojson(url)
  return geoBoundariesFeatureCollection(geojson, geometry.ids?.shapeId || parsed.shapeId)
}

async function fetchGeojson(url) {
  const geojson = await fetchJson(url)
  if (!geojson || typeof geojson !== 'object' || !geojson.type) {
    throw new Error(`Invalid GeoJSON from ${url}`)
  }
  return geojson
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'fajr-city-geometry-cache/1.0 (https://github.com/tawfeeqmartin/fajr/issues/118)',
      'Accept': 'application/geo+json, application/json',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--sources') out.sources = argv[++i]
    else if (arg === '--cache-dir') out.cacheDir = argv[++i]
    else if (arg === '--provider') out.provider = argv[++i]
    else if (arg === '--city') out.city = argv[++i]
    else if (arg === '--branch') out.branch = argv[++i]
    else if (arg === '--format') out.format = argv[++i]
    else if (arg === '--dry-run') out.dryRun = true
    else if (arg === '--overwrite') out.overwrite = true
  }
  return out
}

function printText(report) {
  console.log(`# City Geometry Cache Fetch (${report.provider})`)
  console.log('')
  console.log(`Source map: ${report.sourcePath}`)
  console.log(`Cache dir: ${report.cacheDir}`)
  console.log(`Rows: ${report.summary.rows}`)
  console.log('')
  for (const row of report.rows) {
    const suffix = row.error ? ` (${row.error})` : ''
    console.log(`- ${row.status}: ${row.cityKey} ${row.stableId} -> ${row.cacheFile}${suffix}`)
  }
}
