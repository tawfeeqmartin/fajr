// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch official KEMENAG Imsakiyya prayer times from bimasislam.kemenag.go.id
 *
 * Directly fetches from the official KEMENAG Bimas Islam portal,
 * not through third-party wrappers like myQuran. Fetches yearly calendar
 * (Jan—Dec 2026) for 10 major Indonesian cities.
 *
 * Output routes to eval/data/test/kemenag-official-yearly.json
 *
 * API:
 *   POST /jadwalshalat/by_city/{city_code}/{year}
 *   Returns monthly Imsakiyya pages (HTML with embedded prayer times)
 *
 * Usage: node scripts/fetch-kemenag-official-yearly.js
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 10 major Indonesian cities to fetch (confirmed to exist in KEMENAG system)
// City codes are from the KEMENAG dropdown / API routing
const CITIES = [
  { name: 'Jakarta', code: 'KOTA JAKARTA', province: 'DKI JAKARTA', lat: -6.2088, lon: 106.8456, tz: 'Asia/Jakarta' },
  { name: 'Surabaya', code: 'KOTA SURABAYA', province: 'JAWA TIMUR', lat: -7.2575, lon: 112.7521, tz: 'Asia/Jakarta' },
  { name: 'Bandung', code: 'KOTA BANDUNG', province: 'JAWA BARAT', lat: -6.9175, lon: 107.6412, tz: 'Asia/Jakarta' },
  { name: 'Medan', code: 'KOTA MEDAN', province: 'SUMATERA UTARA', lat: 3.1955, lon: 98.6722, tz: 'Asia/Jakarta' },
  { name: 'Semarang', code: 'KOTA SEMARANG', province: 'JAWA TENGAH', lat: -6.9667, lon: 110.4167, tz: 'Asia/Jakarta' },
  { name: 'Makassar', code: 'KOTA MAKASSAR', province: 'SULAWESI SELATAN', lat: -5.3667, lon: 119.4167, tz: 'Asia/Jakarta' },
  { name: 'Palembang', code: 'KOTA PALEMBANG', province: 'SUMATERA SELATAN', lat: -2.9667, lon: 104.7500, tz: 'Asia/Jakarta' },
  { name: 'Denpasar', code: 'KOTA DENPASAR', province: 'BALI', lat: -8.6500, lon: 115.2167, tz: 'Asia/Jakarta' },
  { name: 'Yogyakarta', code: 'KOTA YOGYAKARTA', province: 'DAERAH ISTIMEWA YOGYAKARTA', lat: -7.8000, lon: 110.4000, tz: 'Asia/Jakarta' },
  { name: 'Banjarmasin', code: 'KOTA BANJARMASIN', province: 'KALIMANTAN SELATAN', lat: -3.3256, lon: 114.5908, tz: 'Asia/Jakarta' },
]

const YEAR = 2026
const BASE_URL = 'https://bimasislam.kemenag.go.id/jadwalshalat'

async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { timeout: 15000 })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.text()
    } catch (err) {
      if (i === maxRetries - 1) throw err
      await new Promise(r => setTimeout(r, 2000 * (i + 1)))
    }
  }
}

/**
 * Parse KEMENAG Imsakiyya HTML page.
 * The page contains a table with prayer times; parse rows for each day.
 * Expected structure: <tr><td>1</td><td>HH:MM</td>... (Imsak, Subuh, Terbit, Dhuha, Dzuhur, Ashar, Maghrib, Isya)
 */
function parseImsakiyyaHtml(html) {
  const dates = []

  // Extract the table body content
  // Look for table rows with prayer times
  const tableRowRegex = /<tr[^>]*>\s*<td[^>]*>\s*(\d{1,2})\s*<\/td>(.*?)<\/tr>/gi
  const cellRegex = /<td[^>]*>\s*([0-9:]+)\s*<\/td>/gi

  let match
  while ((match = tableRowRegex.exec(html)) !== null) {
    const day = parseInt(match[1], 10)
    if (day < 1 || day > 31) continue

    const rowHtml = match[2]
    const cells = []
    let cellMatch
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1])
    }

    // Expected order: Imsak, Subuh (Fajr), Terbit (Sunrise), Dhuha, Dzuhur, Ashar, Maghrib, Isya
    // We need: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha
    if (cells.length >= 8) {
      const date = `${YEAR}-${String(1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      dates.push({
        date,
        fajr: cells[1],      // Subuh
        sunrise: cells[2],   // Terbit
        dhuhr: cells[4],     // Dzuhur
        asr: cells[5],       // Ashar
        maghrib: cells[6],   // Maghrib
        isha: cells[7],      // Isya
      })
    }
  }

  return dates
}

/**
 * Fetch Imsakiyya for a single city and month via direct form POST.
 * KEMENAG site uses form submission to filter results.
 */
async function fetchMonthlyImsakiyya(city, month) {
  try {
    // Try direct URL pattern: /jadwalshalat/by_city/{code}/{year}/{month}
    const url = `${BASE_URL}/by_city/${encodeURIComponent(city.code)}/${YEAR}/${month}`
    const html = await fetchWithRetry(url)

    // Verify response contains date info to catch redirect/error pages
    if (!html.includes(String(month)) && !html.includes(`0${month}`)) {
      throw new Error('Response does not appear to contain the expected month')
    }

    return parseImsakiyyaHtml(html)
  } catch (err) {
    console.error(`  ✗ Month ${month}: ${err.message}`)
    return []
  }
}

async function main() {
  console.log('Fetching official KEMENAG Imsakiyya (yearly calendar)...\n')

  const output = {
    source: 'KEMENAG Official Imsakiyya (Yearly)',
    source_url: 'https://bimasislam.kemenag.go.id/jadwalshalat',
    source_fetched: new Date().toISOString(),
    notes: 'Direct fetch from official KEMENAG Bimas Islam portal — not a third-party wrapper. Covers 10 major Indonesian cities for full calendar year 2026.',
    cities: [],
  }

  let totalDatesCollected = 0

  for (const city of CITIES) {
    process.stdout.write(`${city.name.padEnd(15)} `)

    const cityData = {
      city: city.name,
      country: 'Indonesia',
      latitude: city.lat,
      longitude: city.lon,
      elevation: 0,
      timezone: city.tz,
      method: 'kemenag',
      source: `KEMENAG ${city.province} / ${city.code}`,
      source_institution: 'KEMENAG (Kementerian Agama Republik Indonesia)',
      source_method: `Bimas Islam Imsakiyya — ${city.province} — ${city.code}`,
      source_url: 'https://bimasislam.kemenag.go.id/jadwalshalat',
      source_fetched: new Date().toISOString(),
      dates: [],
    }

    let monthsSucceeded = 0

    for (let month = 1; month <= 12; month++) {
      const monthDates = await fetchMonthlyImsakiyya(city, month)
      if (monthDates.length > 0) {
        cityData.dates.push(...monthDates)
        monthsSucceeded++
        totalDatesCollected += monthDates.length
      }

      // Rate limit: 2 sec/req as per CLAUDE.md
      await new Promise(r => setTimeout(r, 2000))
    }

    if (monthsSucceeded > 0) {
      console.log(`✓ (${monthsSucceeded}/12 months, ${cityData.dates.length} days)`)
      output.cities.push(cityData)
    } else {
      console.log(`✗ (0/12 months)`)
    }
  }

  console.log(`\n${output.cities.length}/${CITIES.length} cities landed, ${totalDatesCollected} city-days total`)

  const outPath = join(__dirname, '../eval/data/test/kemenag-official-yearly.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\nWrote: ${outPath}`)
  console.log(`Lines: ${JSON.stringify(output, null, 2).split('\n').length}`)
}

main().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})
