// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch yearly prayer times from Aladhan API for Iran (method=7, Tehran
 * Institute of Geophysics) and Pakistan (method=1, Karachi University of
 * Islamic Sciences). Calc-vs-calc reproducibility check at the country-
 * dispatch level for the two methods fajr's selectMethod() routes there.
 *
 * Per fajr#109 Phase 2 research: the Tehran Institute of Geophysics is
 * Cloudflare-protected (no direct fetch path) and Karachi U Islamic
 * Sciences has no canonical web URL. Aladhan methods 7 and 1 are the
 * accessible proxies for both — they reproduce the institutional angle
 * pairs (17.7°/14° Tehran; 18°/18° Karachi) that fajr dispatches.
 *
 * Usage:
 *   node scripts/fetch-aladhan-iran-pakistan.js
 *
 * Outputs to: eval/data/test/iran-pakistan-aladhan-yearly.json
 * Rate limits: 0.5 sec between requests.
 *
 * Classification: 🟢 Established — pure data fetch + parse.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const OUT_PATH = new URL('../eval/data/test/iran-pakistan-aladhan-yearly.json', import.meta.url).pathname
const YEAR = 2026
const RATE_LIMIT_MS = 500

const CITIES = [
  // Iran — Tehran method (Aladhan method=7), 17.7°/14° per Institute of Geophysics, U. Tehran
  { city: 'Tehran',     country: 'Iran', method: 7, methodName: 'Tehran (Institute of Geophysics)',     latitude: 35.6892, longitude: 51.3890, elevation: 1200, timezone: 'Asia/Tehran' },
  { city: 'Mashhad',    country: 'Iran', method: 7, methodName: 'Tehran (Institute of Geophysics)',     latitude: 36.2605, longitude: 59.6168, elevation:  995, timezone: 'Asia/Tehran' },
  { city: 'Isfahan',    country: 'Iran', method: 7, methodName: 'Tehran (Institute of Geophysics)',     latitude: 32.6539, longitude: 51.6660, elevation: 1574, timezone: 'Asia/Tehran' },
  { city: 'Shiraz',     country: 'Iran', method: 7, methodName: 'Tehran (Institute of Geophysics)',     latitude: 29.5926, longitude: 52.5836, elevation: 1500, timezone: 'Asia/Tehran' },
  { city: 'Tabriz',     country: 'Iran', method: 7, methodName: 'Tehran (Institute of Geophysics)',     latitude: 38.0962, longitude: 46.2738, elevation: 1351, timezone: 'Asia/Tehran' },
  // Pakistan — Karachi method (Aladhan method=1), 18°/18° per University of Islamic Sciences
  { city: 'Karachi',    country: 'Pakistan', method: 1, methodName: 'Karachi (U. Islamic Sciences)',    latitude: 24.8607, longitude: 67.0011, elevation:    8, timezone: 'Asia/Karachi' },
  { city: 'Lahore',     country: 'Pakistan', method: 1, methodName: 'Karachi (U. Islamic Sciences)',    latitude: 31.5204, longitude: 74.3587, elevation:  217, timezone: 'Asia/Karachi' },
  { city: 'Islamabad',  country: 'Pakistan', method: 1, methodName: 'Karachi (U. Islamic Sciences)',    latitude: 33.6844, longitude: 73.0479, elevation:  540, timezone: 'Asia/Karachi' },
  { city: 'Peshawar',   country: 'Pakistan', method: 1, methodName: 'Karachi (U. Islamic Sciences)',    latitude: 34.0151, longitude: 71.5249, elevation:  331, timezone: 'Asia/Karachi' },
  { city: 'Quetta',     country: 'Pakistan', method: 1, methodName: 'Karachi (U. Islamic Sciences)',    latitude: 30.1798, longitude: 66.9750, elevation: 1680, timezone: 'Asia/Karachi' },
]

main().catch(err => { console.error(err); process.exit(1) })

async function main() {
  console.log(`[aladhan-iran-pakistan] fetching ${CITIES.length} cities (5 Iran method=7 + 5 Pakistan method=1); year=${YEAR}`)

  const records = []
  for (let cityIdx = 0; cityIdx < CITIES.length; cityIdx++) {
    const city = CITIES[cityIdx]
    process.stdout.write(`[${cityIdx + 1}/${CITIES.length}] ${city.city} (${city.country}, method=${city.method})... `)

    try {
      const dates = await fetchYearlyCalendar(city)
      if (dates.length === 0) { console.log('SKIP'); continue }

      records.push({
        city: city.city,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        elevation: city.elevation,
        timezone: city.timezone,
        method: city.methodName,
        source: `Aladhan API (api.aladhan.com) - ${city.methodName} (method=${city.method})`,
        source_institution: city.country === 'Iran'
          ? 'Aladhan (Institute of Geophysics, U. Tehran proxy)'
          : 'Aladhan (University of Islamic Sciences, Karachi proxy)',
        source_method: `${city.methodName} (Aladhan method=${city.method})`,
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

  // Verify-response-date: confirm first record's first date is in the requested year
  if (records.length > 0) {
    const firstDate = records[0].dates?.[0]?.date
    if (!firstDate || !firstDate.startsWith(String(YEAR))) {
      console.warn(`[verify-response-date] WARN: first record's first date is ${firstDate}, expected year=${YEAR}.`)
    }
  }

  if (!existsSync(dirname(OUT_PATH))) mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(records, null, 2))
  const totalRows = records.reduce((a, r) => a + (r.dates?.length || 0), 0)
  console.log(`\n[aladhan-iran-pakistan] wrote ${records.length} cities, ${totalRows} day-rows to ${OUT_PATH}`)
}

async function fetchYearlyCalendar(city) {
  const dates = []
  for (let month = 1; month <= 12; month++) {
    const url = buildUrl(city, month)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (fajr-research; +https://github.com/tawfeeqmartin/fajr)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for month ${month}`)
    const json = await res.json()
    if (json.code !== 200) throw new Error(`API error for month ${month}: ${json.status}`)

    for (const entry of json.data) {
      const t = entry.timings
      const [dd, mm, yyyy] = entry.date.gregorian.date.split('-')
      const strip = s => s.replace(/\s*\(.*\)/, '').trim()
      dates.push({
        date: `${yyyy}-${mm}-${dd}`,
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
    method: city.method,
    year: YEAR,
    month: month,
  })
  return `https://api.aladhan.com/v1/calendar/${YEAR}/${month}?${params.toString()}`
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
