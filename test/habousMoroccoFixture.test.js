// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Morocco Habous official-month fixture gate.
 *
 * The fixture is a holdout diagnostic, not the train ratchet. This test keeps
 * the official Habous current-month table usable as a concrete regression
 * signal: fajr's Morocco default should stay close to the official city tables
 * for the five prayer times. Sunrise is checked only as a loose source-parsing
 * sanity signal because Moroccan mosque practice can publish it as an ihtiyat
 * end-of-Fajr marker rather than a pure astronomical sunrise calculation.
 */

import { describe, it, expect } from 'vitest'
import { prayerTimes } from '../src/index.js'
import fixtures from '../eval/data/test/morocco-habous-monthly.json' with { type: 'json' }
import habousMap from '../scripts/data/habous-morocco-cities.json' with { type: 'json' }

const CORE_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const ALL_PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

function formatInMorocco(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Casablanca',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

function minutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function signedDelta(calc, official) {
  let delta = minutes(calc) - minutes(official)
  if (delta > 720) delta -= 1440
  if (delta < -720) delta += 1440
  return delta
}

function summarizeDeltas(prayers = CORE_PRAYERS) {
  const summary = {
    n: 0,
    absTotal: 0,
    maxAbs: 0,
    worst: null,
    byCity: new Map(),
  }

  for (const fixture of fixtures) {
    const cityStats = summary.byCity.get(fixture.city) ?? { n: 0, absTotal: 0, maxAbs: 0, worst: null }
    summary.byCity.set(fixture.city, cityStats)

    for (const day of fixture.dates) {
      const calculated = prayerTimes({
        latitude: fixture.latitude,
        longitude: fixture.longitude,
        date: new Date(`${day.date}T12:00:00Z`),
      })

      for (const prayer of prayers) {
        const delta = signedDelta(formatInMorocco(calculated[prayer]), day[prayer])
        const abs = Math.abs(delta)
        const sample = {
          city: fixture.city,
          date: day.date,
          prayer,
          delta,
          calculated: formatInMorocco(calculated[prayer]),
          official: day[prayer],
        }

        summary.n++
        summary.absTotal += abs
        if (abs > summary.maxAbs) {
          summary.maxAbs = abs
          summary.worst = sample
        }

        cityStats.n++
        cityStats.absTotal += abs
        if (abs > cityStats.maxAbs) {
          cityStats.maxAbs = abs
          cityStats.worst = sample
        }
      }
    }
  }

  summary.mae = summary.absTotal / summary.n
  summary.cityRows = [...summary.byCity.entries()].map(([city, stats]) => ({
    city,
    mae: stats.absTotal / stats.n,
    maxAbs: stats.maxAbs,
    worst: stats.worst,
  }))
  return summary
}

describe('Morocco Habous monthly fixture', () => {
  const fixtureDayCount = fixtures.reduce((total, fixture) => total + fixture.dates.length, 0)

  it('covers every mapped bundled Moroccan city exactly once', () => {
    const expectedCities = habousMap.mappedCities.map(row => row.fajrCity).sort()
    const actualCities = fixtures.map(row => row.city).sort()

    expect(actualCities).toEqual(expectedCities)
  })

  it('preserves source metadata and HH:MM prayer rows', () => {
    const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/

    for (const fixture of fixtures) {
      expect(fixture.country, fixture.city).toBe('Morocco')
      expect(fixture.timezone, fixture.city).toBe('Africa/Casablanca')
      expect(fixture.elevation, fixture.city).toBe(0)
      expect(fixture.source_institution, fixture.city).toBe('Ministry of Habous and Islamic Affairs (Morocco)')
      expect(fixture.source_method, fixture.city).toMatch(/Official Habous city timetable/)
      expect(fixture.source_url, fixture.city).toMatch(/^https:\/\/(www\.)?habous\.gov\.ma\/prieres\//)
      expect(fixture.dates.length, fixture.city).toBeGreaterThanOrEqual(29)
      expect(fixture.dates.length, fixture.city).toBeLessThanOrEqual(31)

      const dates = fixture.dates.map(row => row.date)
      expect(dates, fixture.city).toEqual([...dates].sort())

      for (const row of fixture.dates) {
        expect(row.date, fixture.city).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        for (const prayer of ALL_PRAYERS) {
          expect(row[prayer], `${fixture.city} ${row.date} ${prayer}`).toMatch(hhmm)
        }
      }
    }
  })

  it('keeps Morocco five-prayer output close to official Habous city tables', () => {
    const summary = summarizeDeltas(CORE_PRAYERS)
    const worstCity = summary.cityRows.reduce((worst, row) => row.mae > worst.mae ? row : worst)

    expect(summary.n).toBe(fixtureDayCount * CORE_PRAYERS.length)
    expect(summary.mae, JSON.stringify(summary.worst)).toBeLessThanOrEqual(1.25)
    expect(summary.maxAbs, JSON.stringify(summary.worst)).toBeLessThanOrEqual(3)
    expect(worstCity.mae, JSON.stringify(worstCity)).toBeLessThanOrEqual(1.5)
  })

  it('keeps Habous sunrise rows within a loose source-sanity envelope', () => {
    const summary = summarizeDeltas(['sunrise'])

    expect(summary.n).toBe(fixtureDayCount)
    expect(summary.maxAbs, JSON.stringify(summary.worst)).toBeLessThanOrEqual(10)
  })
})
