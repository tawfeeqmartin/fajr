// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr ratchet comparator
 *
 * Compares the last two runs in eval/results/runs.jsonl and decides whether
 * a candidate change passes the ratchet.
 *
 *   1. Run `node eval/eval.js`    ← baseline
 *   2. Make your change to src/engine.js
 *   3. Run `node eval/eval.js`    ← candidate
 *   4. Run `node eval/compare.js`
 *
 * Exits 0 (PASS) iff ALL of:
 *   - Train WMAE strictly decreased (a wash is a rejection)
 *   - No (city, source) cell in train set worsened by more than CELL_TOLERANCE_MIN
 *   - No (source) aggregate worsened by more than SOURCE_TOLERANCE_MIN
 *   - No per-prayer signed bias drifted in the ihtiyat-unsafe direction
 *     beyond BIAS_TOLERANCE_MIN, UNLESS the drift is cross-validated by an
 *     independent source whose per-source |bias| improved by the required
 *     margin (Path A — see CLAUDE.md ihtiyat section).
 *
 * The test-set (holdout) numbers are reported but never gate the decision.
 *
 * READ-ONLY for the autoresearch agent — see CLAUDE.md.
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RUNS = join(__dirname, 'results', 'runs.jsonl')

const CELL_TOLERANCE_MIN   = 0.10  // per (city, source) drift
const SOURCE_TOLERANCE_MIN = 0.10  // per source-institution aggregate drift
const BIAS_TOLERANCE_MIN   = 0.30  // signed bias drift in unsafe direction
const PRAYERS = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']

// Reviewed institutional identities in the current TRAIN corpus. Calculated
// references and unknown labels cannot justify an ihtiyat exception. Adding
// an institution requires source review, not a pattern/substring match.
const CORROBORATING_SOURCES = new Set([
  'Mawaqit (mosque-published)',
  'Diyanet İşleri Başkanlığı (Türkiye)',
  'JAKIM (via waktusolat.app)',
])

// Ihtiyat (precaution) demands errors be asymmetric. For these prayers the
// listed direction of bias drift is unsafe even when MAE happens to improve.
//   'down' = bias becoming more negative (calc shifting EARLIER vs ground truth)
//   'up'   = bias becoming more positive (calc shifting LATER vs ground truth)
const UNSAFE_DIRECTION = {
  fajr:    'down',
  maghrib: 'down',
  isha:    'down',
  shuruq:  'up',
}

function loadLastTwo(runsFile) {
  if (!existsSync(runsFile)) {
    console.error(`No runs file at ${runsFile}`)
    console.error(`Run \`node eval/eval.js\` at least twice before comparing.`)
    process.exit(2)
  }
  const lines = readFileSync(runsFile, 'utf8').trim().split('\n').filter(Boolean)
  const recs = []
  for (const line of lines) {
    try {
      const rec = JSON.parse(line)
      recs.push(rec)
    } catch {
      console.error('Malformed run record; refusing to compare an older pair silently.')
      process.exit(2)
    }
  }
  if (recs.length < 2 || recs.slice(-2).some(rec => rec?.schema !== 3)) {
    console.error(`Need two final schema-3 runs in ${runsFile}; refusing to skip incompatible records.`)
    console.error(`Run \`node eval/eval.js\` once before your change and once after.`)
    process.exit(2)
  }
  return [recs[recs.length - 2], recs[recs.length - 1]]
}

function fmtDelta(d) {
  if (d === 0) return ' 0.00'
  return d > 0 ? `+${d.toFixed(2)}` : d.toFixed(2)
}

function fmtBias(b) {
  if (b === undefined || Number.isNaN(b)) return '   —   '
  return b >= 0 ? `+${b.toFixed(2)}` : b.toFixed(2)
}

export function validateTrainingPair(prev, curr) {
  const errors = []
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  const metric = (value, path, countKey) => {
    if (!object(value)) { errors.push(`${path} missing`); return }
    if (!Number.isInteger(value[countKey]) || value[countKey] <= 0) errors.push(`${path}.${countKey} invalid`)
    if (!Number.isFinite(value.wmae) || value.wmae < 0) errors.push(`${path}.wmae invalid`)
    for (const prayer of PRAYERS) {
      if (!Number.isFinite(value.perPrayer?.[prayer]) || value.perPrayer[prayer] < 0) errors.push(`${path}.perPrayer.${prayer} invalid`)
      if (!Number.isFinite(value.perPrayerSigned?.[prayer])) errors.push(`${path}.perPrayerSigned.${prayer} invalid`)
    }
  }
  for (const [label, run] of [['previous', prev], ['current', curr]]) {
    if (run?.schema !== 3) errors.push(`${label} schema must be 3`)
    metric(run?.train, `${label}.train`, 'entries')
    for (const group of ['perSource', 'perCell', 'perRegion']) {
      const values = run?.train?.[group]
      if (!object(values) || !Object.keys(values).length) { errors.push(`${label}.train.${group} missing`); continue }
      for (const [key, value] of Object.entries(values)) metric(value, `${label}.${group}[${key}]`, 'count')
    }
  }
  if (errors.length) return errors
  if (prev.train.entries !== curr.train.entries) errors.push('Training entry count changed; compare the same corpus.')
  for (const group of ['perSource', 'perCell', 'perRegion']) {
    const keys = new Set([...Object.keys(prev.train[group]), ...Object.keys(curr.train[group])])
    for (const key of keys) {
      const p = prev.train[group][key], c = curr.train[group][key]
      if (!p || !c || p.count !== c.count) errors.push(`Training coverage changed: ${group}[${key}]`)
    }
  }
  return errors
}

export function compare(prev, curr, { log = globalThis.console.log } = {}) {
  const console = { log }
  const invalid = validateTrainingPair(prev, curr)
  if (invalid.length) {
    console.log('FAIL — invalid or incomparable training metrics:')
    for (const error of invalid) console.log(`  • ${error}`)
    return 1
  }
  const issues = []

  console.log()
  console.log('Ratchet Compare')
  console.log('===============')
  console.log(`Previous: ${prev.timestamp}`)
  console.log(`Current:  ${curr.timestamp}`)
  console.log()

  // ── Headline ──
  const dT = curr.train.wmae - prev.train.wmae
  console.log(`Train WMAE:    ${prev.train.wmae.toFixed(4)} → ${curr.train.wmae.toFixed(4)}  (${fmtDelta(dT)})`)
  if (prev.test?.entries > 0 && curr.test?.entries > 0 && Number.isFinite(prev.test.wmae) && Number.isFinite(curr.test.wmae)) {
    const dH = curr.test.wmae - prev.test.wmae
    console.log(`Holdout WMAE:  ${prev.test.wmae.toFixed(4)} → ${curr.test.wmae.toFixed(4)}  (${fmtDelta(dH)})  [diagnostic only]`)
  }
  console.log()

  if (dT >= 0) {
    issues.push(`Train WMAE did not strictly decrease (Δ=${fmtDelta(dT)}). A wash is a rejection.`)
  }

  // ── Per-source (train) ──
  console.log('Per-source (train) deltas')
  console.log('-------------------------')
  console.log('Source                              | Prev WMAE | Curr WMAE |   Δ    |')
  console.log('------------------------------------|-----------|-----------|--------|')
  const sourceNames = new Set([
    ...Object.keys(prev.train.perSource ?? {}),
    ...Object.keys(curr.train.perSource ?? {}),
  ])
  for (const name of [...sourceNames].sort()) {
    const p = prev.train.perSource?.[name]?.wmae
    const c = curr.train.perSource?.[name]?.wmae
    if (p === undefined || c === undefined) continue
    const d = c - p
    console.log(`${name.padEnd(35).slice(0, 35)} | ${p.toFixed(2).padStart(9)} | ${c.toFixed(2).padStart(9)} | ${fmtDelta(d).padStart(6)} |`)
    if (d > SOURCE_TOLERANCE_MIN) {
      issues.push(`Source "${name}": WMAE worsened by ${fmtDelta(d)} min (>${SOURCE_TOLERANCE_MIN} min tolerance).`)
    }
  }
  console.log()

  // ── Per-cell (train) — granular ──
  console.log('Per-cell (train) deltas — granular ratchet unit')
  console.log('-----------------------------------------------')
  console.log('Cell (city / source)                              | Prev | Curr |   Δ    |')
  console.log('--------------------------------------------------|------|------|--------|')
  const cellNames = new Set([
    ...Object.keys(prev.train.perCell ?? {}),
    ...Object.keys(curr.train.perCell ?? {}),
  ])
  // Print only cells with non-trivial Δ to keep this readable.
  const cellRows = []
  for (const name of cellNames) {
    const p = prev.train.perCell?.[name]?.wmae
    const c = curr.train.perCell?.[name]?.wmae
    if (p === undefined || c === undefined) continue
    cellRows.push({ name, p, c, d: c - p })
  }
  cellRows.sort((a, b) => b.d - a.d)
  for (const r of cellRows.slice(0, 8)) {
    console.log(`${r.name.padEnd(49).slice(0, 49)} | ${r.p.toFixed(2).padStart(4)} | ${r.c.toFixed(2).padStart(4)} | ${fmtDelta(r.d).padStart(6)} |`)
  }
  if (cellRows.length > 8) console.log(`(showing top 8 by drift; ${cellRows.length} total cells)`)
  console.log()
  for (const r of cellRows) {
    if (r.d > CELL_TOLERANCE_MIN) {
      issues.push(`Cell "${r.name}": WMAE worsened by ${fmtDelta(r.d)} min (>${CELL_TOLERANCE_MIN} min tolerance).`)
    }
  }

  for (const name of Object.keys(prev.train.perRegion)) {
    const delta = curr.train.perRegion[name].wmae - prev.train.perRegion[name].wmae
    if (delta > CELL_TOLERANCE_MIN) issues.push(`Region "${name}": WMAE worsened by ${fmtDelta(delta)} min.`)
  }

  // ── Per-prayer signed-bias drift (train) — with Path A cross-source check ──
  // Path A: an aggregate signed-bias drift in the prayer-only-unsafe direction
  // is OK if at least one independent source's per-source |signed bias| for
  // the same prayer improves by ≥ max(2·|drift|, 1.0 min). This catches the
  // case where the engine is moving toward what mosques actually publish
  // (fasting-safe, reality-aligned) rather than drifting away from reality.
  // See CLAUDE.md "Ihtiyat" section and autoresearch/logs/2026-04-30-21-27.md.
  console.log('Per-prayer signed-bias drift (train) — ihtiyat check (Path A active)')
  console.log('---------------------------------------------------------------------')
  console.log('Prayer   | Prev bias | Curr bias |   Δ    | Direction       |')
  console.log('---------|-----------|-----------|--------|-----------------|')

  const allSourcesPrev = prev.train.perSource
  const allSourcesCurr = curr.train.perSource

  for (const prayer of Object.keys(UNSAFE_DIRECTION)) {
    const p = prev.train.perPrayerSigned?.[prayer]
    const c = curr.train.perPrayerSigned?.[prayer]
    if (p === undefined || c === undefined) continue
    const d = c - p
    const unsafeDir = UNSAFE_DIRECTION[prayer]
    const isUnsafeAggregate =
      (unsafeDir === 'down' && d < -BIAS_TOLERANCE_MIN) ||
      (unsafeDir === 'up'   && d >  BIAS_TOLERANCE_MIN)

    let corroborated = false
    let requiredImprovement = 0
    const corroboratingSources = []
    if (isUnsafeAggregate) {
      requiredImprovement = Math.max(2 * Math.abs(d), 1.0)
      for (const srcName of Object.keys(allSourcesPrev)) {
        if (!CORROBORATING_SOURCES.has(srcName)) continue
        const prevBias = allSourcesPrev[srcName]?.perPrayerSigned?.[prayer]
        const currBias = allSourcesCurr[srcName]?.perPrayerSigned?.[prayer]
        if (prevBias === undefined || currBias === undefined) continue
        const improvement = Math.abs(prevBias) - Math.abs(currBias)
        if (improvement >= requiredImprovement) {
          corroborated = true
          corroboratingSources.push({ srcName, prevBias, currBias, improvement })
        }
      }
    }

    const isUnsafe = isUnsafeAggregate && !corroborated
    let safety
    if (!isUnsafeAggregate) safety = '   ok'
    else if (corroborated)  safety = '✓ corroborated'
    else                    safety = '⚠ UNSAFE'

    console.log(
      `${prayer.padEnd(8)} | ${fmtBias(p).padStart(9)} | ${fmtBias(c).padStart(9)} | ${fmtDelta(d).padStart(6)} | ${safety.padStart(15)} |`
    )

    if (isUnsafeAggregate && corroborated) {
      for (const cs of corroboratingSources) {
        console.log(`           ↳ corroborated by ${cs.srcName}: ${fmtBias(cs.prevBias)} → ${fmtBias(cs.currBias)} (|bias| improved ${cs.improvement.toFixed(2)} min ≥ required ${requiredImprovement.toFixed(2)})`)
      }
    }

    if (isUnsafe) {
      const dir = unsafeDir === 'down'
        ? 'EARLIER (cuts into prayer time)'
        : 'LATER (extends Fajr past actual sunrise)'
      issues.push(`${prayer}: bias shifted ${fmtDelta(d)} min — calc moved ${dir}, violates ihtiyat. No source's |bias| improved by the required ${requiredImprovement.toFixed(2)} min for cross-validation.`)
    }
  }
  console.log()

  if (issues.length === 0) {
    console.log('PASS — train WMAE decreased; no per-source, per-cell, or unsafe-bias regressions.')
    return 0
  }
  console.log('FAIL — the following ratchet rules were violated:')
  for (const i of issues) console.log(`  • ${i}`)
  console.log()
  console.log('Revert the change. Log the attempt in autoresearch/logs/.')
  return 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length && (args.length !== 2 || args[0] !== '--runs')) {
    console.error('Usage: node eval/compare.js [--runs path/to/runs.jsonl]')
    process.exit(2)
  }
  const [prev, curr] = loadLastTwo(args[1] || RUNS)
  process.exit(compare(prev, curr))
}
