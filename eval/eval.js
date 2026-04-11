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

import { readFileSync, readdirSync, existsSync } from 'fs'
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
// Data loading
// ─────────────────────────────────────────────────────────────────────────────

function loadGroundTruth(dir) {
  const entries = []
  if (!existsSync(dir)) return entries

  const files = readdirSync(dir).filter(f => f.endsWith('.json'))
  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf8')
    const data = JSON.parse(raw)
    entries.push(...data)
  }
  return entries
}

// Ground truth format:
// [
//   {
//     "source": "Morocco-Rabat-2024",
//     "latitude": 33.9716,
//     "longitude": -6.8498,
//     "elevation": 75,
//     "date": "2024-03-15",
//     "times": {
//       "fajr": "04:47",
//       "shuruq": "06:14",
//       "dhuhr": "13:22",
//       "asr": "16:43",
//       "maghrib": "19:31",
//       "isha": "20:48"
//     }
//   }
// ]

// ─────────────────────────────────────────────────────────────────────────────
// Error calculation
// ─────────────────────────────────────────────────────────────────────────────

function parseTimeHHMM(hhmmStr, dateStr) {
  const [h, m] = hhmmStr.split(':').map(Number)
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCHours(h, m, 0, 0)
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
    const gt = parseTimeHHMM(entry.times[prayer], entry.date)
    const calc = calculated[prayer]
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
}

run()
