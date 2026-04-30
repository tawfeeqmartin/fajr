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
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RUNS = join(__dirname, 'results', 'runs.jsonl')

const CELL_TOLERANCE_MIN   = 0.10  // per (city, source) drift
const SOURCE_TOLERANCE_MIN = 0.10  // per source-institution aggregate drift
const BIAS_TOLERANCE_MIN   = 0.30  // signed bias drift in unsafe direction

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

function loadLastTwo() {
  if (!existsSync(RUNS)) {
    console.error(`No runs file at ${RUNS}`)
    console.error(`Run \`node eval/eval.js\` at least twice before comparing.`)
    process.exit(2)
  }
  const lines = readFileSync(RUNS, 'utf8').trim().split('\n').filter(Boolean)
  const recs = []
  for (const line of lines) {
    try {
      const rec = JSON.parse(line)
      // Accept schema 3 (current). Older schemas lack perSource/perCell.
      if (rec.schema === 3) recs.push(rec)
    } catch {
      // ignore malformed lines
    }
  }
  if (recs.length < 2) {
    console.error(`Need ≥2 schema-3 runs in ${RUNS}; found ${recs.length}.`)
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

function compare(prev, curr) {
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
  if (prev.test.entries > 0 && curr.test.entries > 0) {
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

  const allSourcesPrev = { ...(prev.train.perSource ?? {}), ...(prev.test.perSource ?? {}) }
  const allSourcesCurr = { ...(curr.train.perSource ?? {}), ...(curr.test.perSource ?? {}) }

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

const [prev, curr] = loadLastTwo()
process.exit(compare(prev, curr))
