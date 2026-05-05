// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch prayer times from Egypt's General Authority of Survey (ESA) VIEWSTATE form.
 *
 * The ESA publishes monthly prayer-time tables for 83 Egyptian cities at
 * http://www.esa.gov.eg/praytimes.aspx. This is an ASP.NET WebForms site
 * that requires VIEWSTATE and EVENTVALIDATION tokens to POST city selections.
 *
 * Approach:
 * 1. Fetch the initial page to harvest VIEWSTATE/EVENTVALIDATION tokens
 * 2. POST the form with a city selection (using Arabic city name)
 * 3. Parse the returned HTML table to extract the monthly prayer times
 * 4. Verify response dates match requested dates (guard against parsing bugs)
 * 5. Emit JSON fixture for eval/data/test/ or eval/data/train/
 *
 * Known limitation: The page uses JavaScript to render the dropdown dynamically.
 * This fetcher harvests the form tokens and POSTs directly, which works for
 * known city names (like القاهرة for Cairo, الأسكندرية for Alexandria) but may
 * require manual token refresh if the server's VIEWSTATE algorithm changes.
 *
 * Usage: node scripts/fetch-egypt-esa.js
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ESA city list: Arabic name → { English name, latitude, longitude, elevation }
const CITIES = [
  {
    arabic: 'القـاهـرة',
    city: 'Cairo',
    latitude: 30.0626,
    longitude: 31.2497,
    elevation: 23,
  },
  {
    arabic: 'الأسكندرية',
    city: 'Alexandria',
    latitude: 31.2001,
    longitude: 29.9187,
    elevation: 7,
  },
  {
    arabic: 'أسوان',
    city: 'Aswan',
    latitude: 24.0889,
    longitude: 32.8998,
    elevation: 104,
  },
  {
    arabic: 'الأقصر',
    city: 'Luxor',
    latitude: 25.6872,
    longitude: 32.6396,
    elevation: 71,
  },
  {
    arabic: 'بورسعيد',
    city: 'Port Said',
    latitude: 31.2653,
    longitude: 32.3019,
    elevation: 3,
  },
  {
    arabic: 'السويس',
    city: 'Suez',
    latitude: 29.9737,
    longitude: 32.5263,
    elevation: 12,
  },
  {
    arabic: 'شرم الشيخ',
    city: 'Sharm el-Sheikh',
    latitude: 27.9158,
    longitude: 34.3299,
    elevation: 17,
  },
]

const ESA_URL = 'http://www.esa.gov.eg/praytimes.aspx'
const MONTH = 5  // May 2026
const YEAR = 2026

/**
 * Fetch and parse the initial ESA page to harvest VIEWSTATE/EVENTVALIDATION tokens.
 */
async function getFormTokens() {
  console.log(`Fetching initial ESA page: ${ESA_URL}`)
  try {
    const res = await fetch(`https://www.esa.gov.eg/praytimes.aspx`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    })
    if (!res.ok) {
      console.warn(`  WARNING: HTTP ${res.status} — page may not load correctly`)
    }

    const html = await res.text()

    // Try to extract VIEWSTATE and EVENTVALIDATION tokens
    // The page may be JavaScript-rendered, so these may not exist
    const viewstateMatch = html.match(/name="__VIEWSTATE"\s+value="([^"]+)"/)
    const viewstate = viewstateMatch ? viewstateMatch[1] : ''

    const eventMatch = html.match(/name="__EVENTVALIDATION"\s+value="([^"]+)"/)
    const eventvalidation = eventMatch ? eventMatch[1] : ''

    if (!viewstate || !eventvalidation) {
      console.warn('  WARNING: Could not harvest VIEWSTATE/EVENTVALIDATION tokens')
      console.warn('  Likely the form is rendered client-side. Returning empty tokens.')
      return { viewstate: '', eventvalidation: '' }
    }

    console.log(`  ✓ Harvested VIEWSTATE (${viewstate.substring(0, 40)}...)`)
    console.log(`  ✓ Harvested EVENTVALIDATION (${eventvalidation.substring(0, 40)}...)`)
    return { viewstate, eventvalidation }
  } catch (err) {
    console.error(`  ERROR fetching tokens: ${err.message}`)
    return null
  }
}

/**
 * POST the ESA form to request prayer times for a specific city.
 * Returns the HTML response containing the monthly prayer table.
 */
async function fetchCityTable(city, tokens) {
  if (!tokens) {
    console.warn(`  SKIP: No VIEWSTATE tokens available`)
    return null
  }

  console.log(`  Posting form for city: ${city.city} (${city.arabic})`)

  // Build the POST body. The ESA form uses DropDownList1 for city selection.
  const body = new URLSearchParams()
  body.append('__VIEWSTATE', tokens.viewstate)
  body.append('__EVENTVALIDATION', tokens.eventvalidation)
  body.append('__EVENTTARGET', 'ctl00$placeholder1$DropDownList1')
  body.append('__EVENTARGUMENT', '')
  body.append('ctl00$placeholder1$DropDownList1', city.arabic)
  body.append('ctl00$placeholder1$Button1', 'عرض الجدول')  // "Show Table" button

  try {
    const res = await fetch(ESA_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; fajr-egypt-esa-fetcher/1.0)',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      console.warn(`    WARNING: HTTP ${res.status}`)
      return null
    }

    return await res.text()
  } catch (err) {
    console.error(`    ERROR: ${err.message}`)
    return null
  }
}

/**
 * Parse HTML table from ESA response.
 * Expected format: rows with 6 cells (Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha)
 * and a date column (usually first or last).
 *
 * This is a conservative parser that looks for <table> elements and
 * attempts to extract prayer time values.
 */
function parseEsaTable(html, city, year, month) {
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi
  const tables = html.match(tableRegex)

  if (!tables || tables.length === 0) {
    console.warn(`    WARNING: No <table> elements found`)
    return []
  }

  const results = []

  // Try each table; the prayer times table should have consistent row counts
  for (const table of tables) {
    const rows = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []

    // Skip header/footer rows and look for data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/gi) || []

      if (cells.length < 6) continue  // Need at least date + 5 or 6 prayers

      // Extract cell text
      const cellTexts = cells.map(cell => {
        // Strip HTML tags and trim
        const text = cell.replace(/<[^>]*>/g, '').trim()
        // Remove Arabic diacritics and extra spaces
        return text.replace(/ً|ٌ|ٍ|َ|ُ|ِ|ّ|ْ/g, '').trim()
      })

      // Try to parse the row. Usually: [date, fajr, sunrise, dhuhr, asr, maghrib, isha] or similar
      // Look for time patterns (HH:MM)
      const timePattern = /^(\d{1,2}):(\d{2})$/
      const timeIndices = cellTexts.map((t, i) => timePattern.test(t) ? i : -1).filter(i => i >= 0)

      if (timeIndices.length < 5) continue  // Need at least 5 prayers

      // Identify the date cell (usually first cell or one of the non-time cells)
      let dateStr = null
      for (let j = 0; j < cellTexts.length; j++) {
        if (timeIndices.includes(j)) continue
        const cell = cellTexts[j]
        // Try to match DD/MM or DD-MM or similar
        if (/^\d{1,2}[\/\-]\d{1,2}$/.test(cell)) {
          dateStr = cell
          break
        }
      }

      if (!dateStr) continue

      // Parse date (assume format is DD/MM or DD-MM for current month/year)
      const dateMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})$/)
      if (!dateMatch) continue

      const day = parseInt(dateMatch[1], 10)
      const dateMonth = parseInt(dateMatch[2], 10)

      // Verify the month matches what we requested
      if (dateMonth !== month) {
        console.warn(`    WARNING: Date month ${dateMonth} != requested month ${month}; skipping row`)
        continue
      }

      // Extract the prayer times
      const times = {}
      const prayerNames = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']
      for (let p = 0; p < Math.min(6, timeIndices.length); p++) {
        const idx = timeIndices[p]
        const timeStr = cellTexts[idx]
        if (p < prayerNames.length) {
          times[prayerNames[p]] = timeStr
        }
      }

      // Only include if we have at least fajr through isha (skip sunrise if needed)
      if (!times.fajr || !times.dhuhr || !times.maghrib || !times.isha) {
        continue
      }

      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      results.push({
        date,
        fajr: times.fajr,
        sunrise: times.sunrise || null,
        dhuhr: times.dhuhr,
        asr: times.asr,
        maghrib: times.maghrib,
        isha: times.isha,
      })
    }

    // If we found enough rows, this is likely the right table
    if (results.length >= 5) break
  }

  return results
}

/**
 * Verify that parsed dates are in the expected month/year.
 * This is the v1.6.1 "reflect-check" to catch silent date-parsing bugs.
 */
function verifyDateRange(dates, year, month) {
  const expectedMonth = String(month).padStart(2, '0')

  for (const entry of dates) {
    const parts = entry.date.split('-')
    if (parts.length !== 3) {
      console.warn(`    WARNING: Invalid date format "${entry.date}"`)
      return false
    }

    if (parts[0] !== String(year) || parts[1] !== expectedMonth) {
      console.warn(`    WARNING: Date "${entry.date}" not in ${year}-${expectedMonth}; verify parsing`)
      return false
    }
  }

  return true
}

async function main() {
  console.log(`\nEgypt ESA Prayer Time Fetcher\n${'='.repeat(50)}\n`)

  // Harvest VIEWSTATE/EVENTVALIDATION tokens from the initial page load
  const tokens = await getFormTokens()

  if (!tokens || !tokens.viewstate || !tokens.eventvalidation) {
    console.log('\nFAILURE MODE TRIGGERED: VIEWSTATE form inaccessible.\n')
    console.log('Root cause: The ESA praytimes.aspx page uses client-side JavaScript rendering.')
    console.log('The VIEWSTATE/EVENTVALIDATION tokens are generated dynamically and are not')
    console.log('present in the initial HTML response to static fetch() calls.\n')

    console.log('Path forward:')
    console.log('1. Implement a headless browser scraper (Puppeteer/Playwright) to render the')
    console.log('   page before extracting tokens.')
    console.log('2. Consult the ESA development team for a machine-readable JSON/REST API.')
    console.log('3. Monitor the Mawaqit mosque-published Egypt corpus for institutional alignment.')
    console.log()
    console.log('Writing empty test fixture with notes field as documented in CLAUDE.md...\n')

    // Write the stub with empty dates and failure documentation
    const stub = []
    for (const city of CITIES) {
      stub.push({
        city: city.city,
        country: 'Egypt',
        latitude: city.latitude,
        longitude: city.longitude,
        elevation: city.elevation,
        timezone: 'Africa/Cairo',
        method: 'Egyptian (19.5°/17.5°)',
        source: {
          type: 'national-authority',
          institution: 'Egyptian General Authority of Survey (EGSA)',
          url: 'https://esa.gov.eg/praytimes.aspx',
        },
        notes: 'ESA VIEWSTATE form inaccessible — page uses client-side JavaScript rendering. Stub written as documented in CLAUDE.md failure modes. Future: implement Puppeteer/Playwright-based scraper or contact ESA for JSON API.',
        dates: [],
      })
    }

    const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'egypt-esa.json')
    writeFileSync(outPath, JSON.stringify(stub, null, 2))
    console.log(`✓ Wrote stub to ${outPath}`)
    return
  }

  console.log(`\nFetching prayer times for ${CITIES.length} Egyptian cities...\n`)

  const allCities = []

  for (const city of CITIES) {
    console.log(`\nProcessing: ${city.city}`)

    const html = await fetchCityTable(city, tokens)
    if (!html) {
      console.log(`  SKIP: No response`)
      continue
    }

    const dates = parseEsaTable(html, city, YEAR, MONTH)
    console.log(`  → Parsed ${dates.length} days`)

    if (dates.length === 0) {
      console.log(`  SKIP: No valid rows parsed`)
      continue
    }

    // Reflect-check: verify dates are in the expected month/year
    if (!verifyDateRange(dates, YEAR, MONTH)) {
      console.log(`  SKIP: Date verification failed`)
      continue
    }

    // Filter to a representative sample (first 7 days)
    const sample = dates.slice(0, 7)

    allCities.push({
      city: city.city,
      country: 'Egypt',
      latitude: city.latitude,
      longitude: city.longitude,
      elevation: city.elevation,
      timezone: 'Africa/Cairo',
      method: 'Egyptian (19.5°/17.5°)',
      source: {
        type: 'national-authority',
        institution: 'Egyptian General Authority of Survey (EGSA)',
        url: 'https://esa.gov.eg/praytimes.aspx',
      },
      source_fetched: new Date().toISOString(),
      dates: sample,
    })

    console.log(`  ✓ Added ${sample.length} days for ${city.city}`)

    // Polite rate-limiting: 1 second between city requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Summary: ${allCities.length} cities × 7 days = ${allCities.reduce((sum, c) => sum + c.dates.length, 0)} total records`)
  console.log(`${'='.repeat(50)}\n`)

  if (allCities.length === 0) {
    console.log('ERROR: No cities fetched. Check logs above and ESA site status.')
    return
  }

  // Emit the JSON fixture
  const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'egypt-esa.json')
  writeFileSync(outPath, JSON.stringify(allCities, null, 2))
  console.log(`✓ Written ${outPath}`)
  console.log(`\nFixture ready for eval.js integration.\n`)
}

main().catch(err => {
  console.error(`FATAL: ${err.message}`)
  process.exit(1)
})
