// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr eval harness
 *
 * Measures Weighted Mean Absolute Error (WMAE) against ground truth timetables.
 *
 * READ-ONLY for the autoresearch agent — see CLAUDE.md.
 * Modifying this file to make tests pass is cheating.
 *
 * Usage:
 *   node eval/eval.js
 *   node eval/eval.js --verbose
 *   node eval/eval.js --prayer fajr    (focus on one prayer)
 */

import { readFileSync, readdirSync, existsSync, appendFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { prayerTimes } from '../src/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const VERBOSE = process.argv.includes('--verbose')
const PRAYER_FILTER = process.argv.includes('--prayer')
  ? process.argv[process.argv.indexOf('--prayer') + 1]
  : null

// Prayer weights for WMAE (Fajr and Isha are most affected by twilight uncertainty)
const WEIGHTS = {
  fajr:    1.5,
  shuruq:  1.0,
  dhuhr:   1.0,
  asr:     1.0,
  maghrib: 1.0,
  isha:    1.5,
}

const PRAYERS = Object.keys(WEIGHTS)

// ─────────────────────────────────────────────────────────────────────────────
// Data loading + normalization
// ─────────────────────────────────────────────────────────────────────────────

// UTC offsets for April 2026 (DST-aware).
// Add new entries here as new timezones appear in ground truth files.
const UTC_OFFSETS = {
  'Africa/Casablanca':    1,   // Morocco UTC+1 year-round
  'Africa/Cairo':         2,   // Egypt UTC+2
  'Asia/Riyadh':          3,   // Saudi Arabia UTC+3
  'Europe/Istanbul':      3,   // Turkey UTC+3 (no DST since 2016)
  'Europe/London':        1,   // UK BST in April (UTC+1)
  'Asia/Kuala_Lumpur':    8,   // Malaysia UTC+8
  'America/New_York':    -4,   // US EDT in April
  'America/Chicago':     -5,   // US CDT in April
  'America/Los_Angeles': -7,   // US PDT in April
  'America/Denver':      -6,   // US MDT in April
  'America/La_Paz':      -4,   // Bolivia UTC-4 (no DST)
  'America/Bogota':      -5,   // Colombia UTC-5 (no DST)
  'America/Guayaquil':   -5,   // Ecuador UTC-5 (no DST)
  'Europe/Oslo':          2,   // Norway CEST in April
  'Atlantic/Reykjavik':   0,   // Iceland UTC+0 (no DST)
  'Europe/Helsinki':      3,   // Finland EEST in April
}

// Supported flat-entry format:
// { source, city, latitude, longitude, elevation, timezone, method,
//   date, utcOffset, times: { fajr, shuruq, dhuhr, asr, maghrib, isha } }
//
// Also supports grouped format from ground truth files:
// { city, latitude, longitude, elevation, timezone, method, source,
//   dates: [ { date, fajr, sunrise, dhuhr, asr, maghrib, isha }, … ] }
//
// "sunrise" is accepted as an alias for "shuruq".

function normalizeEntries(raw) {
  const flat = []

  for (const item of raw) {
    if (!item.dates) {
      // Already flat format — ensure times object and shuruq alias
      const times = { ...item.times }
      if (!times.shuruq && times.sunrise) times.shuruq = times.sunrise
      flat.push({ ...item, times })
      continue
    }

    // Grouped format: expand dates array into individual entries
    const utcOffset = UTC_OFFSETS[item.timezone] ?? 0
    for (const day of item.dates) {
      flat.push({
        source:    item.source,
        city:      item.city,
        country:   item.country,
        latitude:  item.latitude,
        longitude: item.longitude,
        elevation: item.elevation || 0,
        timezone:  item.timezone,
        method:    item.method,
        date:      day.date,
        utcOffset,
        times: {
          fajr:    day.fajr,
          shuruq:  day.shuruq ?? day.sunrise,
          dhuhr:   day.dhuhr,
          asr:     day.asr,
          maghrib: day.maghrib,
          isha:    day.isha,
        },
      })
    }
  }

  return flat
}

function loadGroundTruth(dir) {
  const entries = []
  if (!existsSync(dir)) return entries

  const files = readdirSync(dir).filter(f => f.endsWith('.json'))
  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf8')
    const data = JSON.parse(raw)
    entries.push(...normalizeEntries(data))
  }
  return entries
}

// ─────────────────────────────────────────────────────────────────────────────
// Error calculation
// ─────────────────────────────────────────────────────────────────────────────

// utcOffset: hours east of UTC (e.g. +1 for Morocco, -5 for US/CDT)
// Times in the JSON are LOCAL time; subtract utcOffset to get UTC.
function parseTimeHHMM(hhmmStr, dateStr, utcOffset = 0) {
  const [h, m] = hhmmStr.split(':').map(Number)
  const d = new Date(dateStr + 'T00:00:00Z')
  // Store as UTC: local HH:MM minus UTC offset
  d.setUTCHours(h - utcOffset, m, 0, 0)
  return d
}

function absMinutesDiff(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / 60000
}

function evaluateEntry(entry) {
  const date = new Date(entry.date + 'T12:00:00Z')
  const calculated = prayerTimes({
    latitude: entry.latitude,
    longitude: entry.longitude,
    date,
    elevation: entry.elevation || 0,
  })

  const errors = {}
  const prayers = PRAYER_FILTER ? [PRAYER_FILTER] : PRAYERS

  for (const prayer of prayers) {
    if (!entry.times[prayer] || !calculated[prayer]) continue
    let gt = parseTimeHHMM(entry.times[prayer], entry.date, entry.utcOffset || 0)
    const calc = calculated[prayer]
    // Day-rollover fix for post-midnight Isha in high-latitude cities.
    // Aladhan stores Isha under the date the night *begins*, so "00:48" on
    // "2026-04-01" means the Isha of the April 1 night — which in clock time
    // is early April 2. parseTimeHHMM puts it on March 31 (utcOffset drift),
    // making the GT ~24 h behind calc. If calc is >12 h later than GT, the
    // ground-truth day boundary has wrapped and we shift GT forward by 24 h.
    if (prayer === 'isha' && calc.getTime() - gt.getTime() > 12 * 60 * 60 * 1000) {
      gt = new Date(gt.getTime() + 24 * 60 * 60 * 1000)
    }
    errors[prayer] = absMinutesDiff(gt, calc)
  }

  return errors
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function run() {
  const trainDir = join(__dirname, 'data', 'train')
  const testDir  = join(__dirname, 'data', 'test')

  const trainData = loadGroundTruth(trainDir)
  const testData  = loadGroundTruth(testDir)
  const allData   = [...trainData, ...testData]

  if (allData.length === 0) {
    console.log('No ground truth data found.')
    console.log('Add .json files to eval/data/train/ or eval/data/test/')
    console.log('See CLAUDE.md for the expected format.')
    console.log()
    console.log('WMAE: N/A (no data)')
    process.exit(0)
  }

  // Accumulate per-prayer errors across all entries
  const totals = {}
  const counts = {}
  for (const p of PRAYERS) { totals[p] = 0; counts[p] = 0 }

  for (const entry of allData) {
    const errors = evaluateEntry(entry)
    for (const [prayer, err] of Object.entries(errors)) {
      totals[prayer] += err
      counts[prayer]++
    }
  }

  // Print report
  console.log()
  console.log('WMAE Report')
  console.log('===========')
  console.log(`Ground truth entries: ${allData.length} (train: ${trainData.length}, test: ${testData.length})`)
  console.log()

  let weightedSum = 0
  let weightTotal = 0

  console.log('Prayer   | MAE (min) | Weight | Weighted |')
  console.log('---------|-----------|--------|----------|')

  for (const prayer of PRAYERS) {
    if (counts[prayer] === 0) continue
    const mae = totals[prayer] / counts[prayer]
    const weight = WEIGHTS[prayer]
    const weighted = mae * weight
    weightedSum += weighted
    weightTotal += weight

    const prayerPad  = prayer.padEnd(8)
    const maePad     = mae.toFixed(2).padStart(9)
    const weightPad  = weight.toFixed(1).padStart(6)
    const wPad       = weighted.toFixed(2).padStart(8)
    console.log(`${prayerPad} | ${maePad} | ${weightPad} | ${wPad} |`)
  }

  const wmae = weightTotal > 0 ? weightedSum / weightTotal : 0
  console.log('---------|-----------|--------|----------|')
  console.log(`WMAE     |           |        | ${wmae.toFixed(2).padStart(8)} |`)
  console.log()
  console.log(`WMAE: ${wmae.toFixed(4)}`)

  // Auto-log every run to eval/results/runs.jsonl
  const perPrayer = {}
  for (const p of PRAYERS) {
    if (counts[p] > 0) perPrayer[p] = totals[p] / counts[p]
  }
  const result = {
    timestamp: new Date().toISOString(),
    wmae,
    perPrayer,
    totalEntries: allData.length,
    trainEntries: trainData.length,
    testEntries: testData.length,
  }
  const resultsDir = join(__dirname, 'results')
  mkdirSync(resultsDir, { recursive: true })
  appendFileSync(join(resultsDir, 'runs.jsonl'), JSON.stringify(result) + '\n')
}

run()
