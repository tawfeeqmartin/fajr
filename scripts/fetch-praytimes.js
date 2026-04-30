// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Compute reference prayer times using the praytimes.org JavaScript library
 * (Hamid Zarrabi-Zadeh, LGPL v3.0 — see scripts/lib/PrayTimes.js).
 *
 * This is a *cross-validation* source: an independent JS implementation of
 * the standard astronomical formulas, distinct from `adhan.js` (the engine's
 * dependency) and from any HTTP timetable provider. Agreement here means our
 * engine's math matches the reference math; disagreement is a signal worth
 * investigating.
 *
 * Computed locally (no network). Output: eval/data/test/praytimes-reference.json
 * (holdout — never used to ratchet).
 *
 * Usage: node scripts/fetch-praytimes.js
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { PrayTimes } from './lib/PrayTimes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Method choice per city — match the institutional method that region uses,
// so per-cell comparison vs Aladhan/Diyanet/JAKIM is apples-to-apples.
const CITIES = [
  { city: 'Mecca',       country: 'Saudi Arabia', latitude: 21.3891, longitude: 39.8579, elevation: 277, timezone: 'Asia/Riyadh',     tz:  3, method: 'Makkah'   },
  { city: 'Madinah',     country: 'Saudi Arabia', latitude: 24.4672, longitude: 39.6112, elevation: 631, timezone: 'Asia/Riyadh',     tz:  3, method: 'Makkah'   },
  { city: 'Cairo',       country: 'Egypt',        latitude: 30.0444, longitude: 31.2357, elevation: 23,  timezone: 'Africa/Cairo',    tz:  2, method: 'Egypt'    },
  { city: 'Istanbul',    country: 'Turkey',       latitude: 41.0082, longitude: 28.9784, elevation: 100, timezone: 'Europe/Istanbul', tz:  3, method: 'MWL'      },
  { city: 'Karachi',     country: 'Pakistan',     latitude: 24.8607, longitude: 67.0011, elevation: 10,  timezone: 'Asia/Karachi',    tz:  5, method: 'Karachi'  },
  { city: 'Kuala Lumpur',country: 'Malaysia',     latitude: 3.139,   longitude: 101.6869,elevation: 22,  timezone: 'Asia/Kuala_Lumpur',tz: 8, method: 'MWL'      },
  { city: 'London',      country: 'UK',           latitude: 51.5074, longitude: -0.1278, elevation: 11,  timezone: 'Europe/London',   tz:  1, method: 'ISNA'     },
  { city: 'New York',    country: 'United States',latitude: 40.7128, longitude: -74.006, elevation: 10,  timezone: 'America/New_York',tz: -4, method: 'ISNA'     },
  { city: 'Paris',       country: 'France',       latitude: 48.8566, longitude: 2.3522,  elevation: 35,  timezone: 'Europe/Paris',    tz:  2, method: 'MWL'      },
  { city: 'Reykjavik',   country: 'Iceland',      latitude: 64.1466, longitude: -21.9426,elevation: 18,  timezone: 'Atlantic/Reykjavik',tz:0, method: 'MWL'      },
]

const SOURCE_INSTITUTION = 'praytimes.org reference (Hamid Zarrabi-Zadeh, LGPL v3.0)'

function computeCity(c) {
  const pt = new PrayTimes(c.method)
  // 24-hour format, no DST offset (already baked into tz)
  const dates = []
  for (let day = 1; day <= 10; day++) {
    const date = new Date(Date.UTC(2026, 3, day, 12, 0, 0)) // Apr=month index 3, noon UTC
    const t = pt.getTimes(date, [c.latitude, c.longitude, c.elevation], c.tz, 0, '24h')
    const isoDate = `2026-04-${String(day).padStart(2, '0')}`
    dates.push({
      date: isoDate,
      fajr:    t.fajr,
      sunrise: t.sunrise,
      dhuhr:   t.dhuhr,
      asr:     t.asr,
      maghrib: t.maghrib,
      isha:    t.isha,
    })
  }
  return {
    city: c.city,
    country: c.country,
    latitude: c.latitude,
    longitude: c.longitude,
    elevation: c.elevation,
    timezone: c.timezone,
    method: c.method.toLowerCase(),
    source: `praytimes.org reference, method=${c.method}`,
    source_institution: SOURCE_INSTITUTION,
    source_method:      `praytimes.org method=${c.method}`,
    source_url:         'https://praytimes.org/code/v2/js/PrayTimes.js (vendored at scripts/lib/PrayTimes.js)',
    source_fetched:     new Date().toISOString(),
    dates,
  }
}

function main() {
  const fixtures = CITIES.map(computeCity)
  const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'praytimes-reference.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2))
  console.log(`→ wrote ${outPath} (${fixtures.length} cities, ${fixtures.reduce((n,f)=>n+f.dates.length,0)} day-entries)`)
  console.log('Source: praytimes.org reference library (LGPL v3.0) — see scripts/lib/PrayTimes.js')
}

main()
