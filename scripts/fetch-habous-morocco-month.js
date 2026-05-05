// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Snapshot Morocco Habous official current Hijri-month city tables.
 *
 * Source:
 *   https://www.habous.gov.ma/prieres/
 *   https://www.habous.gov.ma/prieres/horaire_hijri_2.php?ville={id}
 *
 * Habous archive articles preserve monthly provenance, but the machine-readable
 * city table appears to be a current-month endpoint rather than a stable
 * historical API. Run this monthly to preserve official tables going forward.
 *
 * Usage:
 *   node scripts/fetch-habous-morocco-month.js --city Rabat --allow-insecure-habous-cert
 *   node scripts/fetch-habous-morocco-month.js --out /private/tmp/habous-morocco-month.json --allow-insecure-habous-cert
 *   node scripts/fetch-habous-morocco-month.js --city Rabat --from-file raw.html --today 2024-01-06
 *   node scripts/fetch-habous-morocco-month.js --city Rabat --wayback-from 202401 --wayback-to 202605
 *
 * By default this prints fixture-shaped JSON to stdout. It does not write
 * eval/data unless an explicit --out path points there.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import https from 'node:https'
import { dirname } from 'node:path'
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib'
import cityModule from '../src/data/cities.json' with { type: 'json' }
import habousMap from './data/habous-morocco-cities.json' with { type: 'json' }

const BASE_URL = 'https://www.habous.gov.ma/prieres'
const PRAYERS = [
  ['fajr', 'الصبح'],
  ['sunrise', 'الشروق'],
  ['dhuhr', 'الظهر'],
  ['asr', 'العصر'],
  ['maghrib', 'المغرب'],
  ['isha', 'العشاء'],
]

const GREGORIAN_MONTHS = new Map([
  ['يناير', 1],
  ['فبراير', 2],
  ['مارس', 3],
  ['أبريل', 4],
  ['ابريل', 4],
  ['إبريل', 4],
  ['ماي', 5],
  ['يونيو', 6],
  ['يونيه', 6],
  ['يوليوز', 7],
  ['يوليو', 7],
  ['غشت', 8],
  ['شتنبر', 9],
  ['سبتمبر', 9],
  ['أكتوبر', 10],
  ['اكتوبر', 10],
  ['نونبر', 11],
  ['نوفمبر', 11],
  ['دجنبر', 12],
  ['ديسمبر', 12],
])

const args = new Map()
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (!arg.startsWith('--')) continue
  const key = arg.slice(2)
  const next = process.argv[i + 1]
  if (!next || next.startsWith('--')) {
    args.set(key, true)
  } else {
    args.set(key, next)
    i++
  }
}

const allowInsecureHabousCert = args.has('allow-insecure-habous-cert')
const cityFilter = args.get('city')
const fromFile = args.get('from-file')
const outPath = args.get('out')
const rawDir = args.get('raw-dir')
const sourceUrlOverride = args.get('source-url')
const sourceFetchedOverride = args.get('source-fetched')
const limit = args.has('limit') ? Number(args.get('limit')) : null
const today = args.has('today') ? parseIsoDate(args.get('today')) : todayInMorocco()
const waybackFrom = args.get('wayback-from')
const waybackTo = args.get('wayback-to')
const useWayback = Boolean(waybackFrom || waybackTo)

if (Number.isNaN(limit)) {
  console.error('Usage error: --limit must be a number.')
  process.exit(2)
}

const cities = cityModule.cities || cityModule.default?.cities || []
const cityByKey = new Map(cities.map(city => [`${city.name}|${city.countryISO}`, city]))

let mappings = habousMap.mappedCities
if (cityFilter) {
  const needle = cityFilter.toLowerCase()
  mappings = mappings.filter(row =>
    row.fajrCity.toLowerCase().includes(needle) ||
    row.habousArabic.toLowerCase().includes(needle)
  )
}
if (limit != null) mappings = mappings.slice(0, limit)

if (!mappings.length) {
  console.error(`No Habous Morocco mappings matched${cityFilter ? ` city=${cityFilter}` : ''}.`)
  process.exit(2)
}

if ((fromFile || useWayback) && mappings.length !== 1) {
  console.error('Usage error: --from-file / --wayback-* require --city to select exactly one Habous mapping.')
  process.exit(2)
}

const fixtures = []
const failures = []
for (const row of mappings) {
  const city = cityByKey.get(`${row.fajrCity}|${row.countryISO}`)
  if (!city) {
    failures.push(`${row.fajrCity}: missing fajr city registry row`)
    continue
  }

  const url = monthUrl(row.habousVilleId)
  try {
    if (useWayback) {
      const archived = await fetchWaybackFixtures(row, city, url)
      fixtures.push(...archived)
      continue
    }

    const html = fromFile
      ? readFileSync(fromFile, 'utf8')
      : await fetchRemoteMonth(row, url)
    writeRawHtml(row, html, fromFile ? 'file' : 'live')
    const parsed = parseHabousMonthTable(html, today)
    fixtures.push(buildFixture(row, city, parsed, {
      url: sourceUrlOverride || url,
      fetched: sourceFetchedOverride || new Date().toISOString(),
      archived: false,
    }))
    console.error(`[habous-month]   ${parsed.dates.length} day rows`)
    await sleep(750)
  } catch (err) {
    failures.push(`${row.fajrCity}: ${err.message}`)
  }
}

if (!fixtures.length) {
  console.error('[habous-month] no fixtures parsed.')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

const json = `${JSON.stringify(fixtures, null, 2)}\n`
if (outPath) {
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, json)
  console.error(`[habous-month] wrote ${outPath}`)
} else {
  process.stdout.write(json)
}

if (failures.length) {
  console.error(`[habous-month] ${failures.length} city fetch(es) failed:`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

async function fetchRemoteMonth(row, url) {
  console.error(`[habous-month] fetching ${row.fajrCity} from ${url}`)
  return fetchTextWithRetries(url)
}

async function fetchWaybackFixtures(row, city, originalUrl) {
  const cdxUrl = buildCdxUrl(originalUrl)
  console.error(`[habous-month] querying Wayback CDX for ${row.fajrCity}: ${cdxUrl}`)
  const cdxJson = await fetchTextWithRetries(cdxUrl)
  const captures = parseCdx(cdxJson)
  if (!captures.length) throw new Error(`No Wayback captures found for ${originalUrl}`)

  const archived = []
  for (const capture of captures) {
    const archivedUrl = waybackUrl(capture)
    try {
      console.error(`[habous-month] fetching archived ${row.fajrCity}: ${capture.timestamp}`)
      const html = await fetchTextWithRetries(archivedUrl)
      writeRawHtml(row, html, capture.timestamp)
      const parsed = parseHabousMonthTable(html, timestampDate(capture.timestamp))
      archived.push(buildFixture(row, city, parsed, {
        url: archivedUrl,
        fetched: timestampIso(capture.timestamp),
        archived: true,
        originalUrl: capture.original,
        digest: capture.digest,
      }))
      console.error(`[habous-month]   ${capture.timestamp}: ${parsed.dates.length} day rows`)
      await sleep(750)
    } catch (err) {
      console.error(`[habous-month]   ${capture.timestamp}: skipped (${err.message})`)
    }
  }

  if (!archived.length) throw new Error(`Wayback captures found but none parsed for ${originalUrl}`)
  return archived
}

function buildFixture(row, city, parsed, source) {
  const archivedSuffix = source.archived ? '; archived via Internet Archive' : ''
  return {
    city: row.fajrCity,
    country: 'Morocco',
    latitude: city.lat,
    longitude: city.lon,
    elevation: 0,
    timezone: 'Africa/Casablanca',
    method: 'Morocco (Habous official city table)',
    source: `Habous Ministry monthly table (${row.habousArabic})`,
    source_institution: 'Ministry of Habous and Islamic Affairs (Morocco)',
    source_method: `Official Habous city timetable; match=${row.match}; ville=${row.habousVilleId}${archivedSuffix}`,
    source_url: source.url,
    source_fetched: source.fetched,
    source_original_url: source.originalUrl,
    source_wayback_digest: source.digest,
    source_hijri_month: parsed.hijriMonth,
    source_gregorian_months: parsed.gregorianMonthsLabel,
    dates: parsed.dates,
  }
}

function writeRawHtml(row, html, label) {
  if (!rawDir) return
  mkdirSync(rawDir, { recursive: true })
  writeFileSync(`${rawDir}/${row.habousVilleId}-${slug(row.fajrCity)}-${slug(label)}.html`, html)
}

function monthUrl(villeId) {
  if (Number(villeId) === 1) return `${BASE_URL}/index.php`
  return `${BASE_URL}/horaire_hijri_2.php?ville=${villeId}`
}

function buildCdxUrl(originalUrl) {
  const target = new URL(originalUrl)
  const urlKey = `${target.hostname}${target.pathname}${target.search}`
  const params = new URLSearchParams({
    url: urlKey,
    output: 'json',
    fl: 'timestamp,original,statuscode,mimetype,digest',
    filter: 'statuscode:200',
    collapse: 'timestamp:6',
  })
  if (waybackFrom) params.set('from', waybackFrom)
  if (waybackTo) params.set('to', waybackTo)
  return `https://web.archive.org/cdx/search/cdx?${params}`
}

function parseCdx(json) {
  const rows = JSON.parse(json)
  if (!Array.isArray(rows) || rows.length < 2) return []
  const [header, ...values] = rows
  const index = Object.fromEntries(header.map((key, i) => [key, i]))
  return values.map(row => ({
    timestamp: row[index.timestamp],
    original: row[index.original],
    statuscode: row[index.statuscode],
    mimetype: row[index.mimetype],
    digest: row[index.digest],
  }))
}

function waybackUrl(capture) {
  return `https://web.archive.org/web/${capture.timestamp}id_/${capture.original}`
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: !allowInsecureHabousCert })
    const req = https.get(url, {
      agent,
      headers: {
        'User-Agent': 'fajr-habous-month-snapshot/1.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'ar,en;q=0.8',
        'Referer': `${BASE_URL}/index.php`,
      },
      timeout: 25000,
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume()
        fetchText(new URL(res.headers.location, url).href).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        res.resume()
        reject(new Error(`HTTP ${res.statusCode} from ${url}`))
        return
      }
      const chunks = []
      res.on('data', chunk => { chunks.push(chunk) })
      res.on('end', () => {
        try {
          resolve(decodeBody(Buffer.concat(chunks), res.headers['content-encoding']))
        } catch (err) {
          reject(err)
        }
      })
      res.on('error', reject)
    })
    req.on('timeout', () => req.destroy(new Error(`Timeout fetching ${url}`)))
    req.on('error', err => {
      if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        reject(new Error(
          'Habous TLS certificate chain failed Node verification. ' +
          'Re-run with --allow-insecure-habous-cert if you accept the live-source probe risk.'
        ))
      } else {
        reject(err)
      }
    })
  })
}

function decodeBody(buffer, encoding) {
  const normalized = String(encoding || '').toLowerCase()
  if (normalized.includes('gzip')) return gunzipSync(buffer).toString('utf8')
  if (normalized.includes('deflate')) return inflateSync(buffer).toString('utf8')
  if (normalized.includes('br')) return brotliDecompressSync(buffer).toString('utf8')
  if (buffer[0] === 0x1f && buffer[1] === 0x8b) return gunzipSync(buffer).toString('utf8')
  return buffer.toString('utf8')
}

async function fetchTextWithRetries(url, attempts = 4) {
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchText(url)
    } catch (err) {
      lastError = err
      if (i < attempts - 1) await sleep(750 * (i + 1))
    }
  }
  throw lastError
}

function parseHabousMonthTable(html, referenceDate) {
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(match => parseCells(match[1]))
    .filter(cells => cells.length)
  const header = rows.find(cells => cells.some(cell => cell.includes('الأيام')))
  if (!header || header.length < 9) throw new Error('Could not find Habous monthly table header')

  const hijriMonth = header[1]
  const gregorianMonthsLabel = header[2]
  const gregorianMonths = parseGregorianMonths(gregorianMonthsLabel)
  if (!gregorianMonths.length) {
    throw new Error(`Could not parse Gregorian month header "${gregorianMonthsLabel}"`)
  }

  const firstYear = inferFirstGregorianYear(gregorianMonths, referenceDate)
  let monthIndex = 0
  let year = firstYear
  let previousDay = null
  let previousMonth = gregorianMonths[0]
  const dates = []

  for (const cells of rows) {
    if (cells.length < 9 || cells[0].includes('الأيام')) continue
    const gregorianDay = parseDay(cells[2])
    if (!gregorianDay) continue
    if (previousDay != null && gregorianDay < previousDay && monthIndex < gregorianMonths.length - 1) {
      monthIndex++
    }
    const month = gregorianMonths[monthIndex] || gregorianMonths[gregorianMonths.length - 1]
    if (previousMonth === 12 && month === 1) year++
    previousDay = gregorianDay
    previousMonth = month

    const record = {
      date: isoDate(year, month, gregorianDay),
      fajr: normalizeTime(cells[3]),
      sunrise: normalizeTime(cells[4]),
      dhuhr: normalizeTime(cells[5]),
      asr: normalizeTime(cells[6]),
      maghrib: normalizeTime(cells[7]),
      isha: normalizeTime(cells[8]),
    }
    for (const [key] of PRAYERS) {
      if (!record[key]) throw new Error(`Could not parse ${key} from row ${JSON.stringify(cells)}`)
    }
    dates.push(record)
  }

  if (!dates.length) throw new Error('No dated prayer rows parsed from Habous monthly table')
  return { hijriMonth, gregorianMonthsLabel, dates }
}

function parseCells(rowHtml) {
  return [...rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
    .map(match => htmlToText(match[1]))
    .filter(Boolean)
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseGregorianMonths(label) {
  return label
    .split('/')
    .map(part => part.trim())
    .map(part => GREGORIAN_MONTHS.get(part))
    .filter(Boolean)
}

function inferFirstGregorianYear(months, referenceDate) {
  const referenceMonth = referenceDate.getUTCMonth() + 1
  const referenceYear = referenceDate.getUTCFullYear()
  const index = months.indexOf(referenceMonth)
  if (index <= 0) return referenceYear
  return months.slice(0, index).some(month => month > referenceMonth)
    ? referenceYear - 1
    : referenceYear
}

function normalizeTime(value) {
  const match = String(value).match(/([0-2]?\d):([0-5]\d)/)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function parseDay(value) {
  const match = String(value).match(/\d+/)
  return match ? Number(match[0]) : null
}

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    console.error('Usage error: --today must be YYYY-MM-DD.')
    process.exit(2)
  }
  return new Date(`${value}T12:00:00Z`)
}

function timestampDate(timestamp) {
  return parseIsoDate(`${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}`)
}

function timestampIso(timestamp) {
  return `${timestamp.slice(0, 4)}-${timestamp.slice(4, 6)}-${timestamp.slice(6, 8)}T${timestamp.slice(8, 10)}:${timestamp.slice(10, 12)}:${timestamp.slice(12, 14)}Z`
}

function todayInMorocco() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Casablanca',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const get = type => parts.find(part => part.type === type).value
  return new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`)
}

function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
