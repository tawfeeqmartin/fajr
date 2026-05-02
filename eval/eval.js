// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr eval harness
 *
 * Reports two WMAE numbers:
 *   - Train WMAE: the ratchet number. Accept/reject is judged against this.
 *   - Test WMAE:  a holdout, reported but NEVER optimized against. If it
 *                 diverges from train WMAE, the engine is overfitting to
 *                 whichever timetables happened to be digitized first.
 *
 * Three aggregation dimensions:
 *   - per-region   (grouped by city)
 *   - per-source   (grouped by source_institution)
 *   - per-cell     (grouped by city + source — the granular ratchet unit)
 *
 * Per-prayer signed bias (calc − ground truth, in minutes) is tracked
 * alongside MAE because ihtiyat (precaution) requires asymmetric error: Fajr
 * drifting earlier or Maghrib drifting earlier is far worse than the same
 * absolute error the other way, even though MAE treats them as equivalent.
 *
 * READ-ONLY for the autoresearch agent — see CLAUDE.md.
 *
 * Usage:
 *   node eval/eval.js
 *   node eval/eval.js --verbose
 *   node eval/eval.js --prayer fajr
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

// Hardcoded fallback offsets for the legacy fixture set. These are used
// only if the dynamic Intl-based resolution below fails (e.g. running on
// a stripped-down Node without ICU data). All values are non-DST baseline
// offsets — the dynamic resolver below correctly handles DST and fractional-
// hour zones (Tehran +3:30, Kabul +4:30, Mumbai +5:30, etc.) that this
// table cannot represent.
const UTC_OFFSETS = {
  'Africa/Casablanca':    1,
  'Africa/Cairo':         2,
  'Asia/Riyadh':          3,
  'Europe/Istanbul':      3,
  'Europe/London':        1,
  'Asia/Kuala_Lumpur':    8,
  'America/New_York':    -4,
  'America/Chicago':     -5,
  'America/Los_Angeles': -7,
  'America/Denver':      -6,
  'America/Anchorage':   -8,
  'America/La_Paz':      -4,
  'America/Bogota':      -5,
  'America/Guayaquil':   -5,
  'Europe/Oslo':          2,
  'Atlantic/Reykjavik':   0,
  'Europe/Helsinki':      3,
  'Asia/Jakarta':         7,
  'Asia/Karachi':         5,
  'Asia/Dubai':           4,
  'Europe/Paris':         2,
  'America/Toronto':     -4,
  'Arctic/Longyearbyen':  2,
  'Asia/Singapore':       8,
}

/**
 * Compute the UTC offset (in hours, possibly fractional) for a given IANA
 * timezone on a given date. Handles DST correctly via Intl.DateTimeFormat.
 * Falls back to the static UTC_OFFSETS table on error.
 *
 * Why this exists: the original eval was written when the corpus only
 * covered ~24 cities, all in integer-offset zones during non-DST months,
 * so a hardcoded table sufficed. The world-coverage expansion (145
 * countries) brought in fractional zones (Tehran +3:30, Kabul +4:30,
 * Mumbai +5:30, Caracas −4:30 historically) and DST-active zones not in
 * the table, causing systematic 100-min biases. This function makes the
 * eval correct for any IANA timezone.
 *
 * @param {string} tzName  IANA timezone name (e.g. 'Asia/Tehran')
 * @param {string} dateStr ISO date 'YYYY-MM-DD' for the day to compute
 * @returns {number} hours offset from UTC, e.g. 3.5 for Tehran on a non-DST day
 */
function computeUtcOffsetHours(tzName, dateStr) {
  if (!tzName) return 0
  try {
    const sample = new Date(dateStr + 'T12:00:00Z')
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tzName,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
    const parts = fmt.formatToParts(sample).reduce(
      (o, p) => { o[p.type] = p.value; return o }, {}
    )
    // The "local" wall-clock time in the target zone, expressed as if it
    // were UTC. Subtract the sample's true UTC ms to get the offset.
    const localAsUtc = Date.UTC(
      parseInt(parts.year),
      parseInt(parts.month) - 1,
      parseInt(parts.day),
      parseInt(parts.hour) % 24,
      parseInt(parts.minute),
      0,
    )
    const offsetHours = (localAsUtc - sample.getTime()) / 3600000
    return offsetHours
  } catch (_e) {
    return UTC_OFFSETS[tzName] ?? 0
  }
}

// If a fixture lacks the structured source_institution field, try to derive a
// short label from the legacy free-text `source` field, so older fixtures still
// stratify cleanly in per-source tables.
function deriveInstitution(rawSource) {
  if (!rawSource) return 'unknown'
  const s = rawSource.toLowerCase()
  if (s.includes('aladhan'))      return 'Aladhan API'
  if (s.includes('diyanet'))      return 'Diyanet'
  if (s.includes('jakim') || s.includes('waktusolat')) return 'JAKIM (waktusolat)'
  if (s.includes('muslimsalat'))  return 'muslimsalat.com'
  if (s.includes('praytimes'))    return 'praytimes.org'
  if (s.includes('iacad'))        return 'IACAD Dubai'
  if (s.includes('muis'))         return 'MUIS Singapore'
  return rawSource.split(' ')[0]
}

function normalizeEntries(raw) {
  const flat = []

  for (const item of raw) {
    const sourceInstitution = item.source_institution ?? deriveInstitution(item.source)
    const sourceMethod      = item.source_method      ?? item.method ?? null
    const sourceUrl         = item.source_url         ?? null
    const sourceFetched     = item.source_fetched     ?? null

    if (!item.dates) {
      const times = { ...item.times }
      if (!times.shuruq && times.sunrise) times.shuruq = times.sunrise
      flat.push({
        ...item,
        source_institution: sourceInstitution,
        source_method:      sourceMethod,
        source_url:         sourceUrl,
        source_fetched:     sourceFetched,
        times,
      })
      continue
    }

    for (const day of item.dates) {
      // Compute offset per-date so DST transitions on a multi-day fixture
      // resolve correctly (the offset for Anchorage on 2026-03-09 differs
      // from 2026-03-08 by 1 hour).
      const utcOffset = computeUtcOffsetHours(item.timezone, day.date)
      flat.push({
        source:             item.source,
        source_institution: sourceInstitution,
        source_method:      sourceMethod,
        source_url:         sourceUrl,
        source_fetched:     sourceFetched,
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

function parseTimeHHMM(hhmmStr, dateStr, utcOffset = 0) {
  const [h, m] = hhmmStr.split(':').map(Number)
  const d = new Date(dateStr + 'T00:00:00Z')
  // Use total minutes so fractional-hour offsets (Tehran +3:30,
  // Mumbai +5:30, Kabul +4:30, Caracas −4:30, etc.) resolve correctly.
  // setUTCHours(h, ...) with fractional h would truncate, losing the
  // 30-min component for these zones.
  const totalMin = h * 60 + m - utcOffset * 60
  d.setUTCMinutes(totalMin)
  return d
}

function absMinutesDiff(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / 60000
}

// Signed: positive = `calc` is LATER than `gt`. For Fajr/Maghrib/Isha, positive
// is the cautious direction. For Shuruq (end of Fajr), negative is cautious.
function signedMinutesDiff(calc, gt) {
  return (calc.getTime() - gt.getTime()) / 60000
}

function evaluateEntry(entry) {
  const date = new Date(entry.date + 'T12:00:00Z')
  // Pass elevation only when the fixture's institutional source publishes
  // elevation-corrected times. We detect this from existing fixture
  // metadata — the source_method string mentioning "topographic" or
  // "elevation" — rather than requiring a separate flag, so no fixture
  // file edits are needed. Most institutional publishers (Aladhan
  // default, Diyanet, Egyptian, Umm al-Qura, ISNA, praytimes.org)
  // publish sea-level times and don't carry the marker; JAKIM via
  // waktusolat.app does ("JAKIM (Fajr 20°, Isha 18°, topographic
  // elevation)" — see Razali & Hisham 2021 documenting JAKIM's
  // systematic topographic correction).
  //
  // Why this matters: applying elevation correction in the eval
  // against sea-level ground truth produced a phantom +3.93-min Maghrib
  // bias for Ankara (938m) under Diyanet in v1.4.1, inflating the
  // Diyanet Maghrib aggregate to +2.82 when the real calibration drift
  // was ~+1 min. Production consumers retain the public prayerTimes()
  // wrapper's elevation behaviour unchanged; this scope is ONLY the
  // eval's measurement convention against institutional ground truth.
  const sourceMethodStr = String(entry.source_method ?? entry.source ?? '').toLowerCase()
  const sourcePublishesElevationCorrected =
    sourceMethodStr.includes('topographic') ||
    sourceMethodStr.includes('topographical') ||
    /elevation[\s-]?correct/.test(sourceMethodStr)
  const passElevation = sourcePublishesElevationCorrected ? (entry.elevation || 0) : 0
  const calculated = prayerTimes({
    latitude: entry.latitude,
    longitude: entry.longitude,
    date,
    elevation: passElevation,
  })

  const errors = {}
  const signed = {}
  const prayers = PRAYER_FILTER ? [PRAYER_FILTER] : PRAYERS

  for (const prayer of prayers) {
    if (!entry.times[prayer] || !calculated[prayer]) continue
    let gt = parseTimeHHMM(entry.times[prayer], entry.date, entry.utcOffset || 0)
    const calc = calculated[prayer]
    // Day-rollover fix for post-midnight Isha at high latitude.
    if (prayer === 'isha' && calc.getTime() - gt.getTime() > 12 * 60 * 60 * 1000) {
      gt = new Date(gt.getTime() + 24 * 60 * 60 * 1000)
    }
    errors[prayer] = absMinutesDiff(gt, calc)
    signed[prayer] = signedMinutesDiff(calc, gt)
  }

  return { errors, signed }
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregation
// ─────────────────────────────────────────────────────────────────────────────

function emptyBucket(meta = {}) {
  return {
    ...meta,
    count: 0,
    totals:        Object.fromEntries(PRAYERS.map(p => [p, 0])),
    counts:        Object.fromEntries(PRAYERS.map(p => [p, 0])),
    signedTotals:  Object.fromEntries(PRAYERS.map(p => [p, 0])),
  }
}

function finalizeBucket(b) {
  const perPrayer = {}, perPrayerSigned = {}
  let wSum = 0, wTot = 0
  for (const p of PRAYERS) {
    if (b.counts[p] === 0) continue
    perPrayer[p]       = b.totals[p]       / b.counts[p]
    perPrayerSigned[p] = b.signedTotals[p] / b.counts[p]
    wSum += perPrayer[p] * WEIGHTS[p]
    wTot += WEIGHTS[p]
  }
  return {
    ...b,
    wmae: wTot > 0 ? wSum / wTot : 0,
    perPrayer,
    perPrayerSigned,
    // strip raw totals from the public shape to keep runs.jsonl tidy
    totals: undefined,
    counts: undefined,
    signedTotals: undefined,
  }
}

function aggregate(entries) {
  const overall = emptyBucket()
  const perRegion = {}                        // keyed by city
  const perSource = {}                        // keyed by source_institution
  const perCell   = {}                        // keyed by `${city} / ${source_institution}`

  for (const entry of entries) {
    const { errors, signed } = evaluateEntry(entry)
    const region = entry.city || 'unknown'
    const source = entry.source_institution || 'unknown'
    const cell   = `${region} / ${source}`

    if (!perRegion[region]) perRegion[region] = emptyBucket({
      country: entry.country ?? null,
      latitude: entry.latitude,
      longitude: entry.longitude,
      elevation: entry.elevation ?? 0,
    })
    if (!perSource[source]) perSource[source] = emptyBucket({
      sourceMethod: entry.source_method ?? null,
    })
    if (!perCell[cell]) perCell[cell] = emptyBucket({
      city: region,
      sourceInstitution: source,
      country: entry.country ?? null,
      latitude: entry.latitude,
      elevation: entry.elevation ?? 0,
    })

    overall.count++
    perRegion[region].count++
    perSource[source].count++
    perCell[cell].count++

    for (const prayer of Object.keys(errors)) {
      for (const b of [overall, perRegion[region], perSource[source], perCell[cell]]) {
        b.totals[prayer]       += errors[prayer]
        b.counts[prayer]       += 1
        b.signedTotals[prayer] += signed[prayer]
      }
    }
  }

  const final = finalizeBucket(overall)
  const fRegion = Object.fromEntries(Object.entries(perRegion).map(([k, v]) => [k, finalizeBucket(v)]))
  const fSource = Object.fromEntries(Object.entries(perSource).map(([k, v]) => [k, finalizeBucket(v)]))
  const fCell   = Object.fromEntries(Object.entries(perCell)  .map(([k, v]) => [k, finalizeBucket(v)]))

  return {
    wmae:            final.wmae,
    perPrayer:       final.perPrayer,
    perPrayerSigned: final.perPrayerSigned,
    perRegion:       fRegion,
    perSource:       fSource,
    perCell:         fCell,
    entries:         entries.length,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────────────────────

function fmtSigned(n) {
  if (n === undefined || Number.isNaN(n)) return '   —   '
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)
}

function printSplit(label, stats) {
  console.log(label)
  console.log('─'.repeat(label.length))
  console.log(`Entries: ${stats.entries}`)
  if (stats.entries === 0) { console.log('(no data)'); console.log(); return }
  console.log()
  console.log('Prayer   | MAE (min) |   Bias    | Weight | Weighted |')
  console.log('---------|-----------|-----------|--------|----------|')
  for (const prayer of PRAYERS) {
    const mae = stats.perPrayer[prayer]
    if (mae === undefined) continue
    const bias = stats.perPrayerSigned[prayer]
    const weight = WEIGHTS[prayer]
    const weighted = mae * weight
    console.log(
      `${prayer.padEnd(8)} | ${mae.toFixed(2).padStart(9)} | ${fmtSigned(bias).padStart(9)} | ${weight.toFixed(1).padStart(6)} | ${weighted.toFixed(2).padStart(8)} |`
    )
  }
  console.log('---------|-----------|-----------|--------|----------|')
  console.log(`WMAE     |           |           |        | ${stats.wmae.toFixed(2).padStart(8)} |`)
  console.log()
}

function printPerSource(label, stats) {
  if (stats.entries === 0) return
  console.log(label)
  console.log('─'.repeat(label.length))
  const rows = Object.entries(stats.perSource).sort(([, a], [, b]) => b.wmae - a.wmae)
  console.log('Source                              |  n  | WMAE  | Fajr bias | Maghrib bias | Isha bias |')
  console.log('------------------------------------|-----|-------|-----------|--------------|-----------|')
  for (const [src, r] of rows) {
    const fb = fmtSigned(r.perPrayerSigned.fajr)
    const mb = fmtSigned(r.perPrayerSigned.maghrib)
    const ib = fmtSigned(r.perPrayerSigned.isha)
    console.log(
      `${src.padEnd(35).slice(0, 35)} | ${r.count.toString().padStart(3)} | ${r.wmae.toFixed(2).padStart(5)} | ${fb.padStart(9)} | ${mb.padStart(12)} | ${ib.padStart(9)} |`
    )
  }
  console.log()
}

function printPerCell(label, stats) {
  if (stats.entries === 0) return
  console.log(label)
  console.log('─'.repeat(label.length))
  const rows = Object.entries(stats.perCell).sort(([, a], [, b]) => b.wmae - a.wmae)
  console.log('Cell (city / source)                              |  n  | WMAE  | Fajr bias | Maghrib | Isha   |')
  console.log('--------------------------------------------------|-----|-------|-----------|---------|--------|')
  for (const [cell, r] of rows) {
    const fb = fmtSigned(r.perPrayerSigned.fajr)
    const mb = fmtSigned(r.perPrayerSigned.maghrib)
    const ib = fmtSigned(r.perPrayerSigned.isha)
    console.log(
      `${cell.padEnd(49).slice(0, 49)} | ${r.count.toString().padStart(3)} | ${r.wmae.toFixed(2).padStart(5)} | ${fb.padStart(9)} | ${mb.padStart(7)} | ${ib.padStart(6)} |`
    )
  }
  console.log()
}

function stripBucketsForLog(map) {
  const out = {}
  for (const [k, v] of Object.entries(map)) {
    out[k] = {
      count: v.count,
      wmae: v.wmae,
      perPrayer: v.perPrayer,
      perPrayerSigned: v.perPrayerSigned,
      ...(v.latitude  !== undefined ? { latitude:  v.latitude  } : {}),
      ...(v.elevation !== undefined ? { elevation: v.elevation } : {}),
      ...(v.country   !== undefined ? { country:   v.country   } : {}),
      ...(v.sourceInstitution !== undefined ? { sourceInstitution: v.sourceInstitution } : {}),
      ...(v.sourceMethod      !== undefined ? { sourceMethod:      v.sourceMethod      } : {}),
      ...(v.city              !== undefined ? { city:              v.city              } : {}),
    }
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function run() {
  const trainDir = join(__dirname, 'data', 'train')
  const testDir  = join(__dirname, 'data', 'test')

  const trainData = loadGroundTruth(trainDir)
  const testData  = loadGroundTruth(testDir)

  if (trainData.length === 0 && testData.length === 0) {
    console.log('No ground truth data found.')
    console.log('Add .json files to eval/data/train/ or eval/data/test/')
    process.exit(0)
  }

  const trainStats = aggregate(trainData)
  const testStats  = aggregate(testData)

  console.log()
  console.log('WMAE Report')
  console.log('===========')
  console.log()

  printSplit('Train (ratchet)', trainStats)
  if (testData.length > 0) {
    printSplit('Test (holdout — diagnostic only, do NOT optimize against)', testStats)
    if (trainStats.wmae > 0) {
      const ratio = testStats.wmae / trainStats.wmae
      if (ratio > 1.5) {
        console.log(`⚠  Holdout WMAE is ${ratio.toFixed(2)}× train WMAE — possible overfitting to train regions.`)
        console.log()
      }
    }
  }

  printPerSource('Per-source agreement (train)', trainStats)
  if (testData.length > 0) printPerSource('Per-source agreement (test holdout)', testStats)

  if (VERBOSE) {
    printPerCell('Per-cell (train) — granular ratchet unit', trainStats)
    if (testData.length > 0) printPerCell('Per-cell (test holdout)', testStats)
  } else {
    console.log('(use --verbose for the per-cell breakdown)')
    console.log()
  }

  console.log(`Ratchet WMAE (train): ${trainStats.wmae.toFixed(4)}`)
  if (testData.length > 0) console.log(`Holdout WMAE (test):  ${testStats.wmae.toFixed(4)}`)

  // Auto-log every run to eval/results/runs.jsonl (schema 3 — adds perSource, perCell)
  const result = {
    schema: 3,
    timestamp: new Date().toISOString(),
    train: {
      wmae: trainStats.wmae,
      entries: trainStats.entries,
      perPrayer: trainStats.perPrayer,
      perPrayerSigned: trainStats.perPrayerSigned,
      perRegion: stripBucketsForLog(trainStats.perRegion),
      perSource: stripBucketsForLog(trainStats.perSource),
      perCell:   stripBucketsForLog(trainStats.perCell),
    },
    test: {
      wmae: testStats.wmae,
      entries: testStats.entries,
      perPrayer: testStats.perPrayer,
      perPrayerSigned: testStats.perPrayerSigned,
      perRegion: stripBucketsForLog(testStats.perRegion),
      perSource: stripBucketsForLog(testStats.perSource),
      perCell:   stripBucketsForLog(testStats.perCell),
    },
  }
  const resultsDir = join(__dirname, 'results')
  mkdirSync(resultsDir, { recursive: true })
  appendFileSync(join(resultsDir, 'runs.jsonl'), JSON.stringify(result) + '\n')
}

run()
