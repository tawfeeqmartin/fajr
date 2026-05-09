// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'
import {
  geometryEntries,
  safeCachePath,
  wofDataPath,
  wofRawUrl,
} from '../scripts/lib/city-geometry-cache.js'

const ROOT = process.cwd()
const SCRIPT = path.join(ROOT, 'scripts/fetch-city-geometry-cache.js')
const tmpDirs = []

describe('city geometry cache fetch helpers', () => {
  afterEach(() => {
    while (tmpDirs.length) {
      fs.rmSync(tmpDirs.pop(), { recursive: true, force: true })
    }
  })

  it('builds WOF data paths in repository layout order', () => {
    expect(wofDataPath(421190103)).toBe('421/190/103')
    expect(wofDataPath(1108784811)).toBe('110/878/481/1')
    expect(() => wofDataPath('not-an-id')).toThrow(/Invalid WOF id/)
  })

  it('builds raw GitHub URLs from explicit WOF repo metadata', () => {
    expect(wofRawUrl({
      stableId: 'wof:locality:421190103',
      ids: { repo: 'whosonfirst-data-admin-ma' },
    })).toBe('https://raw.githubusercontent.com/whosonfirst-data/whosonfirst-data-admin-ma/master/data/421/190/103/421190103.geojson')
  })

  it('filters source-map entries by provider and city', () => {
    const entries = geometryEntries(sampleSourceMap(), { provider: 'wof', city: 'Rabat' })
    expect(entries).toHaveLength(1)
    expect(entries[0].entry.cityKey).toBe('Rabat|MA')
    expect(entries[0].geometry.stableId).toBe('wof:locality:421190103')
  })

  it('rejects cache paths outside the cache directory', () => {
    const dir = tempDir()
    expect(safeCachePath(dir, 'MA/rabat/test.geojson')).toBe(path.join(dir, 'MA/rabat/test.geojson'))
    expect(() => safeCachePath(dir, '../outside.geojson')).toThrow(/escapes cache dir/)
  })

  it('prints dry-run JSON without fetching network data', () => {
    const dir = tempDir()
    const sourcePath = path.join(dir, 'sources.json')
    const cacheDir = path.join(dir, 'cache')
    writeJson(sourcePath, sampleSourceMap())

    const report = JSON.parse(execFileSync(process.execPath, [
      SCRIPT,
      '--sources', sourcePath,
      '--cache-dir', cacheDir,
      '--provider', 'wof',
      '--dry-run',
      '--format', 'json',
    ], { cwd: ROOT, encoding: 'utf8' }))

    expect(report.summary).toMatchObject({
      rows: 2,
      fetched: 0,
      skippedExisting: 0,
      wouldFetch: 2,
      errors: 0,
    })
    expect(report.rows[0].url).toContain('/whosonfirst-data-admin-ma/master/data/421/190/103/421190103.geojson')
    expect(fs.existsSync(cacheDir)).toBe(false)
  })
})

function sampleSourceMap() {
  return {
    version: 1,
    cacheRoot: '.cache/city-geometry',
    cities: [
      {
        cityKey: 'Rabat|MA',
        geometries: [
          {
            provider: 'wof',
            stableId: 'wof:locality:421190103',
            ids: { wofId: 421190103, repo: 'whosonfirst-data-admin-ma' },
            cacheFile: 'MA/rabat/wof-locality-421190103.geojson',
            licenseUse: 'audit-and-reviewed-bbox-proposal',
          },
        ],
      },
      {
        cityKey: 'Sale|MA',
        geometries: [
          {
            provider: 'wof',
            stableId: 'wof:county:1108784811',
            ids: { wofId: 1108784811, repo: 'whosonfirst-data-admin-ma' },
            cacheFile: 'MA/sale/wof-county-1108784811.geojson',
            licenseUse: 'audit-and-reviewed-bbox-proposal',
          },
          {
            provider: 'osm',
            stableId: 'osm:relation:2801066',
            cacheFile: 'MA/sale/osm-relation-2801066.geojson',
            licenseUse: 'audit-only-until-license-review',
          },
        ],
      },
    ],
  }
}

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fajr-geometry-cache-'))
  tmpDirs.push(dir)
  return dir
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}
