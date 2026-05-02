// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch prayer time calendar from Aladhan API for every country in
 * `scripts/data/world-cities.json`. Output goes under
 * `eval/data/test/world-coverage/<ISO>.json` (test holdout — reported
 * but never used for ratchet decisions).
 *
 * Aladhan rate limit is ~60 requests/minute. We respect that with a
 * 1100ms delay between requests and process sequentially.
 *
 * Each request fetches 7 days for the current month. The 7-day window
 * is sufficient for the eval's per-source / per-region MAE; we don't
 * need 30 days × 145 countries when 7 × 145 already covers seasonal
 * and latitudinal variation adequately for a coverage check.
 *
 * Usage:
 *   node scripts/fetch-aladhan-world.js              # fetch all 145
 *   node scripts/fetch-aladhan-world.js OIC          # OIC member states only
 *   node scripts/fetch-aladhan-world.js DIASPORA     # diaspora-significant only
 *   node scripts/fetch-aladhan-world.js IR YE QA     # specific country codes
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
// Output goes directly under eval/data/test/ (flat) because eval/eval.js
// only reads .json at one level. Each world-coverage fixture is named
// `world-<ISO>.json` so they sort together and don't collide with the
// existing per-region fixtures (mawaqit.json, quito.json, etc.).
const OUT_DIR = join(REPO_ROOT, 'eval/data/test')
const CITIES_FILE = join(REPO_ROOT, 'scripts/data/world-cities.json')

const RATE_LIMIT_MS = 1100  // ~55 req/min — under Aladhan's 60/min cap
const DAYS_PER_FETCH = 7    // first 7 days of the current month

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true })
}

const config = JSON.parse(readFileSync(CITIES_FILE, 'utf8'))
const allCountries = {
  ...config.OIC_member_states,
  ...config.diaspora_significant,
}

const args = process.argv.slice(2)
let toFetch = allCountries
if (args.length > 0) {
  if (args[0] === 'OIC') {
    toFetch = config.OIC_member_states
  } else if (args[0] === 'DIASPORA') {
    toFetch = config.diaspora_significant
  } else {
    toFetch = {}
    for (const code of args) {
      if (allCountries[code]) toFetch[code] = allCountries[code]
      else console.warn(`[fetch-world] unknown country code: ${code}`)
    }
  }
}

const codes = Object.keys(toFetch)
console.log(`[fetch-world] fetching ${codes.length} countries → ${OUT_DIR}`)
console.log(`[fetch-world] rate-limited to ${(60_000 / RATE_LIMIT_MS).toFixed(1)} req/min`)
console.log()

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function fmtDate(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

async function fetchCountry(code, info) {
  const startDate = new Date()
  startDate.setUTCHours(12, 0, 0, 0)

  const dates = []
  for (let i = 0; i < DAYS_PER_FETCH; i++) {
    const d = new Date(startDate.getTime() + i * 86400000)
    dates.push(fmtDate(d))
  }

  // We use the /timings/<date> endpoint without iso8601 — Aladhan then
  // returns times as local-time HH:MM strings with a "(+TZ)" suffix that
  // we strip. This matches the existing fetch-aladhan.js convention so
  // the eval's tz logic (local-time HH:MM → UTC via timezone offset)
  // works identically for the world-coverage fixtures. The iso8601 mode
  // returned ISO timestamps tagged "+00:00" but with local-clock numerals,
  // which the eval mis-parsed as UTC and produced ~100-min systematic
  // biases until this was caught.
  const dayData = []
  for (const dateStr of dates) {
    const url = `https://api.aladhan.com/v1/timings/${dateStr}` +
      `?latitude=${info.latitude}&longitude=${info.longitude}` +
      `&method=${info.aladhanMethod}` +
      `&elevation=${info.elevation || 0}`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`  ✗ ${code} ${dateStr}: HTTP ${res.status}`)
        continue
      }
      const json = await res.json()
      if (json.code !== 200) {
        console.warn(`  ✗ ${code} ${dateStr}: API code ${json.code}`)
        continue
      }
      const t = json.data.timings
      // Aladhan default returns "HH:MM (+TZ)" — strip the suffix.
      const stripTz = (s) => s ? s.replace(/\s*\(.*\)\s*/, '').trim() : null
      dayData.push({
        date: dateStr,
        fajr: stripTz(t.Fajr),
        sunrise: stripTz(t.Sunrise),
        dhuhr: stripTz(t.Dhuhr),
        asr: stripTz(t.Asr),
        maghrib: stripTz(t.Maghrib),
        isha: stripTz(t.Isha),
      })
      await sleep(RATE_LIMIT_MS)
    } catch (err) {
      console.warn(`  ✗ ${code} ${dateStr}: ${err.message}`)
      await sleep(RATE_LIMIT_MS)
    }
  }

  if (dayData.length === 0) {
    console.log(`  ⊘ ${code} ${info.country}: no data fetched`)
    return null
  }

  const out = [{
    city: info.capital,
    country: info.country,
    iso: code,
    latitude: info.latitude,
    longitude: info.longitude,
    elevation: info.elevation,
    timezone: info.timezone,
    method: String(info.aladhanMethod).toLowerCase(),
    methodLabel: info.methodLabel,
    source: `Aladhan API (api.aladhan.com) — ${info.methodLabel} (Aladhan method ${info.aladhanMethod})`,
    sourceFetched: new Date().toISOString(),
    dates: dayData,
  }]

  const outFile = join(OUT_DIR, `world-${code}.json`)
  writeFileSync(outFile, JSON.stringify(out, null, 2) + '\n')
  console.log(`  ✓ ${code} ${info.country.padEnd(28)} ${info.capital.padEnd(20)} ${dayData.length}/${DAYS_PER_FETCH} days`)
  return out
}

let success = 0
let failed = 0
const failedCodes = []

for (const code of codes) {
  const info = toFetch[code]
  const result = await fetchCountry(code, info)
  if (result) success++
  else { failed++; failedCodes.push(code) }
}

console.log()
console.log('═'.repeat(72))
console.log(`Done. ${success}/${codes.length} succeeded${failed > 0 ? `, ${failed} failed: ${failedCodes.join(', ')}` : ''}`)
console.log(`Output: ${OUT_DIR}`)
