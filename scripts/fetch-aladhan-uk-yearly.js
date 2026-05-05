// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch yearly prayer times from Aladhan API for UK cities using MoonsightingCommittee (method=15).
 * Issue #70: Cross-validates London Maghrib/Dhuhr discrepancy against Mawaqit.
 *
 * Usage:
 *   node scripts/fetch-aladhan-uk-yearly.js
 *
 * Outputs to: eval/data/test/uk-aladhan-moonsighting-yearly.json
 * Rate limits: 0.5 sec between requests (be polite to aladhan.com)
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const OUT_PATH = new URL('../eval/data/test/uk-aladhan-moonsighting-yearly.json', import.meta.url).pathname
const YEAR = 2026
const RATE_LIMIT_MS = 500

// UK cities matching the Mawaqit corpus
const CITIES = [
  {
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    elevation: 11,
    timezone: 'Europe/London',
  },
  {
    city: 'Manchester',
    country: 'United Kingdom',
    latitude: 53.4808,
    longitude: -2.2426,
    elevation: 38,
    timezone: 'Europe/London',
  },
  {
    city: 'Birmingham',
    country: 'United Kingdom',
    latitude: 52.4862,
    longitude: -1.8904,
    elevation: 140,
    timezone: 'Europe/London',
  },
]

main().catch(err => { console.error(err); process.exit(1) })

async function main() {
  console.log(`[aladhan-uk-yearly] fetching MoonsightingCommittee (method=15) for ${CITIES.length} UK cities; year=${YEAR}`)

  const records = []
  for (let cityIdx = 0; cityIdx < CITIES.length; cityIdx++) {
    const city = CITIES[cityIdx]
    process.stdout.write(`[${cityIdx + 1}/${CITIES.length}] ${city.city}... `)

    try {
      const dates = await fetchYearlyCalendar(city)
      if (dates.length === 0) {
        console.log('SKIP (no dates returned)')
        continue
      }

      records.push({
        city: city.city,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        elevation: city.elevation,
        timezone: city.timezone,
        method: 'moonsighting-committee',
        source: 'Aladhan API (api.aladhan.com) - MoonsightingCommittee (method=15)',
        source_institution: 'Aladhan (Islamic Society of the UK)',
        source_method: 'MoonsightingCommittee (method=15)',
        source_url: 'https://api.aladhan.com/v1/calendar',
        source_fetched: new Date().toISOString(),
        source_year: YEAR,
        dates,
      })
      console.log(`OK (${dates.length} days)`)
    } catch (err) {
      console.log(`FAIL (${err.message?.slice(0, 80) || err})`)
    }

    if (cityIdx < CITIES.length - 1) await sleep(RATE_LIMIT_MS)
  }

  // Verify-response-date: confirm at least one record's first date matches the requested year
  if (records.length > 0) {
    const first = records[0]
    const firstDate = first.dates?.[0]?.date
    if (!firstDate || !firstDate.startsWith(String(YEAR))) {
      console.warn(`[verify-response-date] WARN: first record's first date is ${firstDate}, expected year=${YEAR}. API response may be cached.`)
    }
  }

  if (!existsSync(dirname(OUT_PATH))) mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(records, null, 2))
  const totalRows = records.reduce((a, r) => a + (r.dates?.length || 0), 0)
  console.log(`\n[aladhan-uk-yearly] wrote ${records.length} cities, ${totalRows} day-rows to ${OUT_PATH}`)
}

async function fetchYearlyCalendar(city) {
  const dates = []
  const daysPerMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  // Fetch all 12 months
  for (let month = 1; month <= 12; month++) {
    const url = buildUrl(city, month)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (fajr-research; +https://github.com/tawfeeqmartin/fajr)',
      },
    })

    if (!res.ok) throw new Error(`HTTP ${res.status} for month ${month}`)
    const json = await res.json()
    if (json.code !== 200) throw new Error(`API error for month ${month}: ${json.status}`)

    // Extract each day's timings
    for (const entry of json.data) {
      const t = entry.timings
      const gregorian = entry.date.gregorian.date // DD-MM-YYYY
      const [dd, mm, yyyy] = gregorian.split('-')
      const date = `${yyyy}-${mm}-${dd}`

      // Strip timezone suffix from times (e.g. "04:45 (+00)")
      const strip = s => s.replace(/\s*\(.*\)/, '').trim()

      dates.push({
        date,
        fajr: strip(t.Fajr),
        sunrise: strip(t.Sunrise),
        dhuhr: strip(t.Dhuhr),
        asr: strip(t.Asr),
        maghrib: strip(t.Maghrib),
        isha: strip(t.Isha),
      })
    }

    if (month < 12) await sleep(RATE_LIMIT_MS)
  }

  return dates
}

function buildUrl(city, month) {
  const params = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    method: 15, // MoonsightingCommittee
    year: YEAR,
    month: month,
  })
  return `https://api.aladhan.com/v1/calendar/${YEAR}/${month}?${params.toString()}`
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
