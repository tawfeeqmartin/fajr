// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Validate fajr's Moroccan city output against Morocco's official Habous
 * current-day prayer-time endpoint.
 *
 * Source:
 *   https://www.habous.gov.ma/prieres/
 *   https://www.habous.gov.ma/prieres/horaire-api.php?ville={id}
 *
 * This is a live-source validation helper, not the eval ratchet. It does not
 * write eval/data. Use it to check Moroccan city coverage before publishing or
 * before inviting Moroccan users to sanity-check fajr / agiftoftime.
 *
 * Usage:
 *   node scripts/validate-habous-morocco.js --city Casablanca --allow-insecure-habous-cert
 *   node scripts/validate-habous-morocco.js --limit 10 --allow-insecure-habous-cert
 *
 * The explicit cert flag is needed in some Node environments because Habous's
 * TLS chain can fail Node's bundled CA verification even when curl succeeds.
 */

import https from 'node:https'
import { prayerTimes } from '../src/index.js'
import cityModule from '../src/data/cities.json' with { type: 'json' }
import habousMap from './data/habous-morocco-cities.json' with { type: 'json' }

const PRAYERS = [
  ['fajr', 'الفجر'],
  ['shuruq', 'الشروق'],
  ['dhuhr', 'الظهر'],
  ['asr', 'العصر'],
  ['maghrib', 'المغرب'],
  ['isha', 'العشاء'],
]

const args = new Map()
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (arg.startsWith('--')) {
    const key = arg.slice(2)
    const next = process.argv[i + 1]
    if (!next || next.startsWith('--')) {
      args.set(key, true)
    } else {
      args.set(key, next)
      i++
    }
  }
}

const allowInsecureHabousCert = args.has('allow-insecure-habous-cert')
const cityFilter = args.get('city')
const limit = args.has('limit') ? Number(args.get('limit')) : null
const thresholdMin = args.has('threshold-min') ? Number(args.get('threshold-min')) : 5

if (Number.isNaN(limit) || Number.isNaN(thresholdMin)) {
  console.error('Usage error: --limit and --threshold-min must be numbers.')
  process.exit(2)
}

const cities = cityModule.cities || cityModule.default?.cities || []
const cityByKey = new Map(cities.map(city => [`${city.name}|${city.countryISO}`, city]))

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: !allowInsecureHabousCert })
    const req = https.get(url, {
      agent,
      headers: {
        'User-Agent': 'fajr-habous-morocco-validator/1.0',
        'Accept': 'text/html, text/plain',
      },
      timeout: 20000,
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
      res.setEncoding('utf8')
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => resolve(body))
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchTextWithRetries(url, attempts = 4) {
  let lastError
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchText(url)
    } catch (err) {
      lastError = err
      if (i < attempts - 1) await sleep(500 * (i + 1))
    }
  }
  throw lastError
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseHabousTimes(html) {
  const text = htmlToText(html)
  const out = {}
  for (const [key, arabic] of PRAYERS) {
    const re = new RegExp(`${arabic}\\s*[:：]?\\s*([0-2]?\\d:[0-5]\\d)`)
    const match = text.match(re)
    if (!match) throw new Error(`Could not parse ${key} (${arabic}) from Habous response`)
    out[key] = match[1].padStart(5, '0')
  }
  return out
}

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

function sourceUrl(villeId) {
  return habousMap.source.todayUrlTemplate.replace('{id}', String(villeId))
}

let mappings = habousMap.mappedCities
if (cityFilter) {
  const needle = cityFilter.toLowerCase()
  mappings = mappings.filter(row => row.fajrCity.toLowerCase().includes(needle))
}
if (limit != null) mappings = mappings.slice(0, limit)

if (!mappings.length) {
  console.error(`No Habous Morocco mappings matched${cityFilter ? ` city=${cityFilter}` : ''}.`)
  process.exit(2)
}

const date = todayInMorocco()
let worstAbs = 0
let failCount = 0

console.log(`[habous-morocco] comparing ${mappings.length} mapped city row(s) for ${date.toISOString().slice(0, 10)} (Africa/Casablanca)`)
console.log(`[habous-morocco] source: ${habousMap.source.monthlyUrl}`)
console.log('')
console.log('City                  | Habous city      | Match                 | Fajr | Shuruq | Dhuhr | Asr | Maghrib | Isha | Worst')
console.log('----------------------|------------------|-----------------------|------|--------|-------|-----|---------|------|------')

for (const row of mappings) {
  const city = cityByKey.get(`${row.fajrCity}|${row.countryISO}`)
  if (!city) {
    console.error(`Missing fajr city registry row for ${row.fajrCity}|${row.countryISO}`)
    failCount++
    continue
  }

  const html = await fetchTextWithRetries(sourceUrl(row.habousVilleId))
  const official = parseHabousTimes(html)
  const calc = prayerTimes({ latitude: city.lat, longitude: city.lon, date })

  const deltas = Object.fromEntries(PRAYERS.map(([key]) => {
    const calcHHMM = formatInMorocco(calc[key])
    const delta = signedDelta(calcHHMM, official[key])
    worstAbs = Math.max(worstAbs, Math.abs(delta))
    if (Math.abs(delta) > thresholdMin) failCount++
    return [key, delta]
  }))

  const fmt = n => `${n >= 0 ? '+' : ''}${n}`.padStart(4)
  console.log(
    `${row.fajrCity.padEnd(21)} | ` +
    `${row.habousArabic.padEnd(16)} | ` +
    `${row.match.padEnd(21)} | ` +
    `${fmt(deltas.fajr)} | ${fmt(deltas.shuruq)}   | ${fmt(deltas.dhuhr)}  | ` +
    `${fmt(deltas.asr)} | ${fmt(deltas.maghrib)}    | ${fmt(deltas.isha)} | ` +
    `${Math.max(...Object.values(deltas).map(Math.abs)).toFixed(0).padStart(4)}`
  )
  await sleep(150)
}

console.log('')
console.log(`[habous-morocco] worst absolute delta: ${worstAbs.toFixed(0)} min`)
if (failCount) {
  console.error(`[habous-morocco] ${failCount} prayer delta(s) exceeded threshold ${thresholdMin} min.`)
  process.exit(1)
}
console.log(`[habous-morocco] all deltas within threshold ${thresholdMin} min.`)
