// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch prayer times from muslimsalat.com — a third-party aggregator
 * (not affiliated with any specific Islamic institution).
 *
 * This is a *cross-validation* source, NOT a regional reference. The fixtures
 * land in eval/data/test/ (holdout) so the engine isn't tuned against them.
 * Their value is detecting drift: if our engine matches Aladhan and Diyanet
 * tightly but disagrees with muslimsalat by 5+ minutes, that's signal worth
 * investigating.
 *
 * Endpoint:
 *   /{cityname}/monthly.json
 * Returns: { items: [{ date_for, fajr, shurooq, dhuhr, asr, maghrib, isha }] }
 * with times in 12-hour format (e.g. "4:36 am").
 *
 * Usage: node scripts/fetch-muslimsalat.js
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CITIES = [
  { city: 'Karachi', country: 'Pakistan',  latitude: 24.8607, longitude: 67.0011, elevation: 10,  timezone: 'Asia/Karachi',    slug: 'karachi'  },
  { city: 'Cairo',   country: 'Egypt',     latitude: 30.0444, longitude: 31.2357, elevation: 23,  timezone: 'Africa/Cairo',     slug: 'cairo'    },
  { city: 'London',  country: 'UK',        latitude: 51.5074, longitude: -0.1278, elevation: 11,  timezone: 'Europe/London',    slug: 'london'   },
  { city: 'Dubai',   country: 'UAE',       latitude: 25.2048, longitude: 55.2708, elevation: 5,   timezone: 'Asia/Dubai',       slug: 'dubai'    },
]

const SOURCE_INSTITUTION = 'muslimsalat.com (third-party aggregator)'
const SOURCE_METHOD      = 'muslimsalat.com — method varies per city, see prayer_method_name'

// "4:36 am" → "04:36"; "12:05 pm" → "12:05"
function parse12hToHHMM(s) {
  const [hm, ampm] = s.trim().toLowerCase().split(/\s+/)
  let [h, m] = hm.split(':').map(Number)
  if (ampm === 'am' && h === 12) h = 0
  if (ampm === 'pm' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// muslimsalat returns date_for like "2026-4-30"; normalize to ISO
function normalizeDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

async function fetchCity(c) {
  const url = `https://muslimsalat.com/${c.slug}/monthly.json`
  console.log(`Fetching ${c.city}: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const data = await res.json()
  if (!data.items) throw new Error(`No items array in response for ${c.city}`)
  // muslimsalat's "monthly" endpoint returns ~8 forward-looking days from today,
  // not a calendar month. Take whatever we get; the eval handles dates independently.
  const entries = data.items
    .map(it => ({ ...it, _iso: normalizeDate(it.date_for) }))
    .slice(0, 10)
  if (entries.length === 0) {
    throw new Error(`muslimsalat returned no entries for ${c.city}`)
  }
  const dates = entries.map(it => ({
    date:    it._iso,
    fajr:    parse12hToHHMM(it.fajr),
    sunrise: parse12hToHHMM(it.shurooq),
    dhuhr:   parse12hToHHMM(it.dhuhr),
    asr:     parse12hToHHMM(it.asr),
    maghrib: parse12hToHHMM(it.maghrib),
    isha:    parse12hToHHMM(it.isha),
  }))
  return {
    city: c.city,
    country: c.country,
    latitude: c.latitude,
    longitude: c.longitude,
    elevation: c.elevation,
    timezone: c.timezone,
    method: data.prayer_method_name?.toLowerCase().split(/[ (]/)[0] ?? 'mws',
    source: `muslimsalat.com /${c.slug}/monthly.json — ${data.prayer_method_name}`,
    source_institution: SOURCE_INSTITUTION,
    source_method:      data.prayer_method_name ?? SOURCE_METHOD,
    source_url:         url,
    source_fetched:     new Date().toISOString(),
    dates,
  }
}

async function main() {
  const fixtures = []
  for (const c of CITIES) {
    try {
      fixtures.push(await fetchCity(c))
    } catch (err) {
      console.error(`  ERROR for ${c.city}: ${err.message}`)
    }
  }
  if (fixtures.length === 0) {
    console.error('No fixtures fetched. Aborting.')
    process.exit(1)
  }
  // Holdout — never used to ratchet
  const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'muslimsalat.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2))
  console.log(`→ wrote ${outPath} (${fixtures.length} cities, ${fixtures.reduce((n,f)=>n+f.dates.length,0)} day-entries)`)
}

main()
