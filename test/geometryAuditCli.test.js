// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const SCRIPT = path.join(ROOT, 'scripts/audit-city-geometry.js')
const tmpDirs = []

describe('city geometry audit CLI', () => {
  afterEach(() => {
    while (tmpDirs.length) {
      fs.rmSync(tmpDirs.pop(), { recursive: true, force: true })
    }
  })

  it('prints an advisory and exits 0 when the source map is absent', () => {
    const dir = tempDir()
    const missing = path.join(dir, 'missing.json')
    const out = runCli(['--sources', missing, '--format', 'json'])
    expect(out).toContain('no source map found')
    expect(out).toContain('city-geometry-sources.json')
  })

  it('reports source-map rows without geometry candidates and missing cache files', () => {
    const dir = tempDir()
    const sourcePath = path.join(dir, 'sources.json')
    const cacheDir = path.join(dir, 'cache')
    fs.mkdirSync(cacheDir)
    writeJson(sourcePath, {
      version: 1,
      cacheRoot: cacheDir,
      cities: [
        {
          cityKey: 'Rabat|MA',
          review: { status: 'unreviewed' },
          geometries: [],
        },
        {
          cityKey: 'Sale|MA',
          geometries: [
            {
              provider: 'osm',
              stableId: 'osm:relation:2801066',
              cacheFile: 'sale.geojson',
              reviewStatus: 'candidate',
            },
          ],
        },
      ],
    })

    const report = JSON.parse(runCli(['--sources', sourcePath, '--format', 'json']))
    expect(report.summary.sourceMapCities).toBe(2)
    expect(report.summary.noGeometryCandidates).toBe(1)
    expect(report.summary.missingCacheFiles).toBe(1)
    expect(report.rows.map(row => row.status)).toEqual([
      'no-geometry-candidates',
      'cache-file-not-found',
    ])
  })

  it('reads cached local GeoJSON and emits checked rows', () => {
    const dir = tempDir()
    const sourcePath = path.join(dir, 'sources.json')
    const cacheDir = path.join(dir, 'cache')
    fs.mkdirSync(cacheDir)
    writeJson(path.join(cacheDir, 'rabat.geojson'), squareFeature(-7, 33.5, -6, 34.5))
    writeJson(sourcePath, {
      version: 1,
      cacheRoot: cacheDir,
      cities: [
        {
          cityKey: 'Rabat|MA',
          geometries: [
            {
              provider: 'osm',
              stableId: 'osm:relation:2799215',
              cacheFile: 'rabat.geojson',
              reviewStatus: 'candidate',
            },
          ],
        },
      ],
    })

    const report = JSON.parse(runCli(['--sources', sourcePath, '--format', 'json']))
    expect(report.summary.checked).toBe(1)
    expect(report.rows[0].status).toBe('checked')
    expect(report.rows[0].centerInsideGeometry).toBe(true)
  })

  it('reports cache path escapes instead of reading outside cache dir', () => {
    const dir = tempDir()
    const sourcePath = path.join(dir, 'sources.json')
    const cacheDir = path.join(dir, 'cache')
    fs.mkdirSync(cacheDir)
    writeJson(sourcePath, {
      version: 1,
      cacheRoot: cacheDir,
      cities: [
        {
          cityKey: 'Rabat|MA',
          geometries: [
            {
              provider: 'osm',
              stableId: 'osm:relation:2799215',
              cacheFile: '../outside.geojson',
              reviewStatus: 'candidate',
            },
          ],
        },
      ],
    })

    const report = JSON.parse(runCli(['--sources', sourcePath, '--format', 'json']))
    expect(report.rows[0].status).toBe('cache-path-outside-cache-dir')
  })
})

function tempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fajr-geometry-audit-'))
  tmpDirs.push(dir)
  return dir
}

function runCli(args) {
  return execFileSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
  })
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2))
}

function squareFeature(west, south, east, north) {
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ]],
    },
  }
}
