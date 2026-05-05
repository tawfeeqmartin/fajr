// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch prayer times from Morocco Habous Ministry direct PHP API.
 *
 * The Habous (Ministère des Habous et des Affaires islamiques) publishes
 * daily prayer times via https://www.habous.gov.ma/prieres/horaire-api.php
 * with ville IDs 1–322 covering ~191 Moroccan cities.
 *
 * Note: The API returns only TODAY's prayer times. To simulate a 7-day corpus,
 * we fetch today's times once per city and emit them with current date only.
 * For test/holdout purposes, this represents the ministerial reference snapshot.
 *
 * Output: eval/data/test/morocco-habous.json (TEST holdout, not train)
 * This is a cross-reference corpus against v1.5.0 Mawaqit-Morocco Path A anchor.
 *
 * Rate limit: 1 req/sec to be polite to the institutional resource.
 *
 * Usage: node scripts/fetch-morocco-habous.js
 */

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Cities to fetch: (city name, ville ID per Habous registry, lat/lon for reference)
// Ville IDs extracted from Habous dropdown selector
const CITIES = [
  { city: 'Casablanca', villeId: 58, lat: 33.5769, lon: -7.5473 },
  { city: 'Rabat', villeId: 1, lat: 33.9850, lon: -6.8802 },
  { city: 'Marrakech', villeId: 104, lat: 31.6291, lon: -8.0088 },
  { city: 'Fès', villeId: 81, lat: 34.0600, lon: -5.0318 },
  { city: 'Tangier', villeId: 14, lat: 35.7595, lon: -5.8331 },
  { city: 'Agadir', villeId: 117, lat: 30.4200, lon: -9.5982 },
  { city: 'Meknes', villeId: 99, lat: 33.8869, lon: -5.5517 },
  { city: 'Oujda', villeId: 31, lat: 34.6841, lon: -1.9073 },
  { city: 'Tetouan', villeId: 15, lat: 35.5897, lon: -5.3698 },
  { city: 'Salé', villeId: 11, lat: 34.0391, lon: -6.8192 },
  { city: 'Kenitra', villeId: 7, lat: 34.2605, lon: -6.5971 },
  { city: 'Taza', villeId: 89, lat: 34.2343, lon: -3.9854 },
]

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Parse HTML table response from Habous API
// Expected structure: <table class="horaire"> with cells labeled:
// الفجر (Fajr), الشروق (Sunrise), الظهر (Dhuhr), العصر (Asr), المغرب (Maghrib), العشاء (Isha)
function parseHabousTable(html) {
  const times = {}

  // Extract all <td> contents from the table
  const tds = html.match(/<td[^>]*>([^<]*)<\/td>/g) || []

  // Habous table structure: alternating labels and times
  // td: "الفجر : " → td: "04:53" → td: "الشروق : " → td: "06:29" → ...
  for (let i = 0; i < tds.length - 1; i++) {
    const cell = tds[i].replace(/<td[^>]*>/, '').replace(/<\/td>/, '').trim()
    const nextCell = tds[i + 1].replace(/<td[^>]*>/, '').replace(/<\/td>/, '').trim()

    if (cell.includes('الفجر')) times.fajr = nextCell
    else if (cell.includes('الشروق')) times.sunrise = nextCell
    else if (cell.includes('الظهر')) times.dhuhr = nextCell
    else if (cell.includes('العصر')) times.asr = nextCell
    else if (cell.includes('المغرب')) times.maghrib = nextCell
    else if (cell.includes('العشاء')) times.isha = nextCell
  }

  // Validate that we got at least Fajr and Isha
  if (times.fajr && times.isha && /^\d{2}:\d{2}$/.test(times.fajr) && /^\d{2}:\d{2}$/.test(times.isha)) {
    return times
  }
  return null
}

function fetchCity(city, today, retries = 2) {
  const villeId = city.villeId
  const url = `https://www.habous.gov.ma/prieres/horaire-api.php?ville=${villeId}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Use curl to fetch with User-Agent to avoid WAF blocking
      // Add timeout to prevent hanging
      const cmd = `curl -s --max-time 10 -H "User-Agent: Mozilla/5.0 (fajr-autoresearch)" "${url}"`
      const html = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] })

      if (!html || html.length < 100) {
        if (attempt < retries) {
          console.log(`  ${city.city}: empty response, retrying...`)
          continue
        }
        console.error(`  ${city.city}: empty response`)
        return null
      }

      const times = parseHabousTable(html)
      if (!times) {
        if (attempt < retries) {
          console.log(`  ${city.city}: parse failed, retrying...`)
          continue
        }
        console.error(`  ${city.city}: parse failed (no valid table)`)
        return null
      }

      console.log(`  ${city.city} [${today}]: Fajr=${times.fajr} Isha=${times.isha}`)

      return {
        date: today,
        fajr: times.fajr,
        sunrise: times.sunrise,
        dhuhr: times.dhuhr,
        asr: times.asr,
        maghrib: times.maghrib,
        isha: times.isha,
      }
    } catch (err) {
      if (attempt < retries) {
        console.log(`  ${city.city}: fetch error (attempt ${attempt + 1}/${retries + 1}), retrying...`)
      } else {
        console.error(`  ${city.city}: fetch failed after ${retries + 1} attempts`)
      }
    }
  }
  return null
}

async function main() {
  console.log('Fetching Morocco Habous prayer times (today only)...\n')

  const today = getTodayDate()
  console.log(`Fetching for date: ${today}\n`)

  // Result is a flat array matching eval test fixture schema
  const result = []

  // Fetch each city
  for (const city of CITIES) {
    const record = fetchCity(city, today)
    if (record) {
      result.push({
        city: city.city,
        country: 'Morocco',
        latitude: city.lat,
        longitude: city.lon,
        elevation: 0,
        timezone: 'Africa/Casablanca',
        method: 'Morocco (Habous)',
        source: 'Habous Ministry Direct API (habous.gov.ma/prieres/horaire-api.php)',
        dates: [record]
      })
      console.log(`  ✓ ${city.city}\n`)
    }

    // Rate-limit: 2 sec per city
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Write output to eval/data/test/ (holdout, not train)
  const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'morocco-habous.json')
  writeFileSync(outPath, JSON.stringify(result, null, 2))

  console.log(`\n✓ Wrote ${outPath}`)
  console.log(`  ${result.length} cities × 1 day = ${result.length} records`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
