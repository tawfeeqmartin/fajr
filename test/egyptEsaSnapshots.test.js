// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Egypt ESA daily source-snapshot archive checks.
 *
 * These snapshots are source evidence under fixtures/, not ratchet fixtures
 * under eval/data/. This test keeps the archive structurally reviewable before
 * any later curated promotion into the holdout corpus.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SNAPSHOT_DIR = path.join(ROOT, 'fixtures/egypt-esa/daily')
const FILENAME_RE = /^(\d{4}-\d{2}-\d{2})\.json$/
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

function readSnapshots() {
  if (!existsSync(SNAPSHOT_DIR)) return []

  return readdirSync(SNAPSHOT_DIR)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const match = file.match(FILENAME_RE)
      if (!match) throw new Error(`Unexpected Egypt ESA snapshot filename: ${file}`)

      return {
        file,
        date: match[1],
        rows: JSON.parse(readFileSync(path.join(SNAPSHOT_DIR, file), 'utf8')),
      }
    })
}

describe('Egypt ESA daily source snapshots', () => {
  it('keeps archived daily snapshots structurally reviewable', () => {
    const snapshots = readSnapshots()
    expect(snapshots.length).toBeGreaterThanOrEqual(1)

    const expectedCities = snapshots[0].rows.map(row => row.city).sort()
    expect(expectedCities.length, snapshots[0].file).toBeGreaterThanOrEqual(10)

    for (const snapshot of snapshots) {
      expect(Array.isArray(snapshot.rows), snapshot.file).toBe(true)
      expect(snapshot.rows.map(row => row.city).sort(), snapshot.file).toEqual(expectedCities)

      for (const fixture of snapshot.rows) {
        expect(fixture.country, `${snapshot.file} ${fixture.city}`).toBe('Egypt')
        expect(fixture.timezone, `${snapshot.file} ${fixture.city}`).toBe('Africa/Cairo')
        expect(fixture.source_institution, `${snapshot.file} ${fixture.city}`)
          .toBe('Egyptian General Authority for Survey (ESA)')
        expect(fixture.source_method, `${snapshot.file} ${fixture.city}`)
          .toMatch(/Egyptian/)
        expect(fixture.source_url, `${snapshot.file} ${fixture.city}`)
          .toBe('https://www.esa.gov.eg/praytimes.aspx')
        expect(fixture.dates, `${snapshot.file} ${fixture.city}`).toHaveLength(1)

        const row = fixture.dates[0]
        expect(row.date, `${snapshot.file} ${fixture.city}`).toBe(snapshot.date)
        for (const prayer of PRAYERS) {
          expect(row[prayer], `${snapshot.file} ${fixture.city} ${prayer}`).toMatch(HHMM_RE)
        }
      }
    }
  })
})
