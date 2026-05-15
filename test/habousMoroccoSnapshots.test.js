// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Morocco Habous source-snapshot archive checks.
 *
 * These snapshots are source evidence under fixtures/, not ratchet fixtures
 * under eval/data/. This test keeps the archive structurally reviewable before
 * any later curated promotion into the holdout corpus.
 */

import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import habousMap from '../scripts/data/habous-morocco-cities.json' with { type: 'json' }

const ROOT = path.resolve(import.meta.dirname, '..')
const SNAPSHOT_DIR = path.join(ROOT, 'fixtures/habous-morocco/monthly')
const FILENAME_RE = /^(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})\.json$/
const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

function readSnapshots() {
  if (!existsSync(SNAPSHOT_DIR)) return []

  return readdirSync(SNAPSHOT_DIR)
    .filter(file => file.endsWith('.json'))
    .sort()
    .map(file => {
      const match = file.match(FILENAME_RE)
      if (!match) throw new Error(`Unexpected Habous snapshot filename: ${file}`)

      return {
        file,
        start: match[1],
        end: match[2],
        rows: JSON.parse(readFileSync(path.join(SNAPSHOT_DIR, file), 'utf8')),
      }
    })
}

describe('Morocco Habous monthly source snapshots', () => {
  it('keeps archived monthly snapshots structurally reviewable', () => {
    const snapshots = readSnapshots()
    const expectedCities = habousMap.mappedCities.map(row => row.fajrCity).sort()

    expect(snapshots.length).toBeGreaterThanOrEqual(1)

    for (const snapshot of snapshots) {
      expect(Array.isArray(snapshot.rows), snapshot.file).toBe(true)
      expect(snapshot.rows.length, snapshot.file).toBe(expectedCities.length)

      const actualCities = snapshot.rows.map(row => row.city).sort()
      expect(actualCities, snapshot.file).toEqual(expectedCities)

      const allDates = []
      for (const fixture of snapshot.rows) {
        expect(fixture.country, `${snapshot.file} ${fixture.city}`).toBe('Morocco')
        expect(fixture.timezone, `${snapshot.file} ${fixture.city}`).toBe('Africa/Casablanca')
        expect(fixture.source_institution, `${snapshot.file} ${fixture.city}`)
          .toBe('Ministry of Habous and Islamic Affairs (Morocco)')
        expect(fixture.source_method, `${snapshot.file} ${fixture.city}`)
          .toMatch(/Official Habous city timetable/)
        expect(fixture.source_url, `${snapshot.file} ${fixture.city}`)
          .toMatch(/^https:\/\/(www\.)?habous\.gov\.ma\/prieres\//)
        expect(fixture.dates.length, `${snapshot.file} ${fixture.city}`).toBeGreaterThanOrEqual(29)
        expect(fixture.dates.length, `${snapshot.file} ${fixture.city}`).toBeLessThanOrEqual(31)

        const fixtureDates = fixture.dates.map(row => row.date)
        expect(fixtureDates, `${snapshot.file} ${fixture.city}`).toEqual([...fixtureDates].sort())

        for (const row of fixture.dates) {
          allDates.push(row.date)
          expect(row.date, `${snapshot.file} ${fixture.city}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
          for (const prayer of PRAYERS) {
            expect(row[prayer], `${snapshot.file} ${fixture.city} ${row.date} ${prayer}`)
              .toMatch(HHMM_RE)
          }
        }
      }

      allDates.sort()
      expect(allDates[0], snapshot.file).toBe(snapshot.start)
      expect(allDates.at(-1), snapshot.file).toBe(snapshot.end)
    }
  })
})
