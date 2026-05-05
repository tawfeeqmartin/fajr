// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Mawaqit yearly fetcher — extracts the embedded full-year calendar from
 * each mosque page on mawaqit.net.
 *
 * Why this exists (audit-gap disclosure 2026-05-05, fajr#99):
 * Existing `fetch-mawaqit.js` pulls today's prayer times only. fajr's
 * train + test fixtures consequently cover one date per mosque, which
 * undersells temporal coverage and means the v1.5.0 / v1.7.16 Path A
 * calibrations were tuned to a single day of the year.
 *
 * Each Mawaqit mosque page at https://mawaqit.net/en/m/<slug> embeds an
 * inline JSON `"calendar":[<12 months>]` array. Each month entry maps
 * day-of-month → [Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha] in HH:MM
 * local time. Across 191 active slugs in fajr's registry that's ~69,715
 * rows of seasonal mosque-published ground truth.
 *
 * Output schema matches `eval/data/test/kemenag.json` (flat array of
 * city records, each with top-level lat/lon/elevation/timezone +
 * `dates: [{date, fajr, sunrise, dhuhr, asr, maghrib, isha}, ...]`).
 *
 * Usage:
 *   node scripts/fetch-mawaqit-yearly.js                     # all 191 active slugs
 *   node scripts/fetch-mawaqit-yearly.js --slug <slug>        # single slug
 *   node scripts/fetch-mawaqit-yearly.js --limit 5            # first N slugs
 *   node scripts/fetch-mawaqit-yearly.js --out <path>         # custom output path
 *   node scripts/fetch-mawaqit-yearly.js --year 2025          # tag the calendar's year
 *
 * Rate limits: 2 sec between requests to mawaqit.net (be polite to a
 * free institutional resource that the global Muslim community
 * relies on).
 *
 * Classification: 🟢 Established — pure data fetch + parse; no shar'i
 * judgment involved. The output is ground truth; whether fajr's
 * calculations match it is the eval's question.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const REGISTRY_PATH = new URL('./data/mawaqit-mosques.json', import.meta.url).pathname
const DEFAULT_OUT = new URL('../eval/data/test/mawaqit-yearly.json', import.meta.url).pathname
const RATE_LIMIT_MS = 2000

const args = parseArgs(process.argv.slice(2))
const targetYear = args.year ? Number(args.year) : new Date().getUTCFullYear()
const outPath = args.out || DEFAULT_OUT

main().catch(err => { console.error(err); process.exit(1) })

async function main() {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
  const active = (registry.active || []).filter(m => {
    if (args.slug && m.slug !== args.slug) return false
    if (args.country && m.country !== args.country) return false
    return true
  })
  const slugs = args.limit ? active.slice(0, Number(args.limit)) : active
  console.log(`[mawaqit-yearly] fetching ${slugs.length} active slugs; year=${targetYear}; out=${outPath}`)

  const records = []
  const failures = []
  for (let i = 0; i < slugs.length; i++) {
    const m = slugs[i]
    process.stdout.write(`[${i + 1}/${slugs.length}] ${m.slug}... `)
    try {
      const fetched = await fetchYearlyCalendar(m.slug)
      if (!fetched) {
        console.log('SKIP (no calendar in HTML)')
        failures.push({ slug: m.slug, reason: 'no-calendar' })
        continue
      }
      const dates = calendarToDates(fetched.calendar, targetYear)
      // Coord priority: mosque-page embed > registry > 0 fallback.
      const latitude = fetched.latitude ?? m.lat ?? m.latitude ?? 0
      const longitude = fetched.longitude ?? m.lng ?? m.longitude ?? 0
      const mosqueName = fetched.name || m.name
      records.push({
        city: m.city || m.cityName || 'unknown',
        country: m.country || 'unknown',
        latitude,
        longitude,
        elevation: m.elevation ?? 0,
        timezone: m.timezone || 'UTC',
        method: 'mosque-published',
        source: `Mawaqit mosque ${m.slug}${mosqueName ? ' (' + mosqueName + ')' : ''}`,
        source_institution: 'Mawaqit (mosque-published)',
        source_method: mosqueName ? `Mosque-published (${mosqueName})` : 'Mosque-published',
        source_url: `https://mawaqit.net/en/m/${m.slug}`,
        source_fetched: new Date().toISOString(),
        source_year: targetYear,
        dates,
      })
      console.log(`OK (${dates.length} days, ${latitude.toFixed(2)}/${longitude.toFixed(2)})`)
    } catch (err) {
      console.log(`FAIL (${err.message?.slice(0, 60) || err})`)
      failures.push({ slug: m.slug, reason: String(err).slice(0, 200) })
    }
    if (i < slugs.length - 1) await sleep(RATE_LIMIT_MS)
  }

  // Verify-response-date: confirm at least one record's first date matches the requested year
  if (records.length > 0) {
    const first = records[0]
    const firstDate = first.dates?.[0]?.date
    if (!firstDate || !firstDate.startsWith(String(targetYear))) {
      console.warn(`[verify-response-date] WARN: first record's first date is ${firstDate}, expected year=${targetYear}. Calendar may be cached / stale.`)
    }
  }

  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(records, null, 2))
  const totalRows = records.reduce((a, r) => a + (r.dates?.length || 0), 0)
  console.log(`\n[mawaqit-yearly] wrote ${records.length} mosques, ${totalRows} day-rows to ${outPath}`)
  if (failures.length) {
    console.log(`[mawaqit-yearly] ${failures.length} failures:`)
    for (const f of failures.slice(0, 10)) console.log(`  - ${f.slug}: ${f.reason}`)
    if (failures.length > 10) console.log(`  ...and ${failures.length - 10} more`)
  }
}

async function fetchYearlyCalendar(slug) {
  const url = `https://mawaqit.net/en/m/${slug}`
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (fajr-research; +https://github.com/tawfeeqmartin/fajr)',
      'Accept-Language': 'en',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  // Inline JSON: "calendar":[{"1":["07:01","08:35",...],...},{...},...]
  const idx = html.indexOf('"calendar":[')
  if (idx < 0) return null
  const calendar = extractBalancedArray(html, idx + '"calendar":'.length)
  if (!calendar) return null
  // Also pull mosque-embedded coords + name (registry doesn't always have them).
  const latM = html.match(/"latitude":\s*(-?\d+(?:\.\d+)?)/)
  const lonM = html.match(/"longitude":\s*(-?\d+(?:\.\d+)?)/)
  const nameM = html.match(/"name":\s*"((?:[^"\\]|\\.)*)"/)
  return {
    calendar,
    latitude: latM ? Number(latM[1]) : null,
    longitude: lonM ? Number(lonM[1]) : null,
    name: nameM ? JSON.parse('"' + nameM[1] + '"') : null,
  }
}

function extractBalancedArray(html, start) {
  // Walk forward tracking [/] depth; bail out at end of string
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < html.length; i++) {
    const c = html[i]
    if (escape) { escape = false; continue }
    if (c === '\\') { escape = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '[') depth++
    else if (c === ']') {
      depth--
      if (depth === 0) {
        const json = html.slice(start, i + 1)
        try { return JSON.parse(json) } catch { return null }
      }
    }
  }
  return null
}

function calendarToDates(calendar, year) {
  if (!Array.isArray(calendar)) return []
  const out = []
  for (let monthIdx = 0; monthIdx < calendar.length; monthIdx++) {
    const month = calendar[monthIdx]
    if (!month || typeof month !== 'object') continue
    const m1 = String(monthIdx + 1).padStart(2, '0')
    for (const [dayKey, times] of Object.entries(month)) {
      if (!Array.isArray(times) || times.length < 5) continue
      const day = String(Number(dayKey)).padStart(2, '0')
      const date = `${year}-${m1}-${day}`
      // Mawaqit format historically: [Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha]
      // Some pages drop sunrise into a sibling "shuruq" array; calendar arrays
      // observed at >= 5 entries are [F, D, A, M, I] without sunrise. Detect
      // length and map accordingly.
      const row = { date }
      if (times.length >= 6) {
        row.fajr = times[0]
        row.sunrise = times[1]
        row.dhuhr = times[2]
        row.asr = times[3]
        row.maghrib = times[4]
        row.isha = times[5]
      } else {
        // 5-entry calendars: assume no sunrise embedded
        row.fajr = times[0]
        row.dhuhr = times[1]
        row.asr = times[2]
        row.maghrib = times[3]
        row.isha = times[4]
      }
      out.push(row)
    }
  }
  return out
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const v = argv[i + 1]?.startsWith('--') ? true : argv[++i]
      out[k] = v ?? true
    }
  }
  return out
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
