// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Generate SVG charts and a progress.md table from eval/results/runs.jsonl.
 *
 * Reads all schema-3 records and emits:
 *   docs/charts/wmae-trend.svg        — train + holdout WMAE over time
 *   docs/charts/wmae-per-source.svg   — bar chart, latest run, per source
 *   docs/charts/wmae-per-region.svg   — bar chart, latest run, per region
 *   docs/charts/bias-by-prayer.svg    — signed bias per prayer (latest run)
 *   docs/progress.md                  — latest run summary in markdown
 *
 * Hand-rolled SVG, no chart-lib dependencies.
 *
 * Usage: node scripts/build-readme-charts.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { STYLE, svgOpen, svgClose, title, subtitle, escapeXml as escape, scale, niceCeil } from './lib/chart-style.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RUNS_PATH = join(__dirname, '..', 'eval', 'results', 'runs.jsonl')
const CHARTS_DIR = join(__dirname, '..', 'docs', 'charts')
const PROGRESS_PATH = join(__dirname, '..', 'docs', 'progress.md')

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

function loadRuns() {
  if (!existsSync(RUNS_PATH)) {
    console.error(`No runs at ${RUNS_PATH}. Run \`node eval/eval.js\` first.`)
    process.exit(1)
  }
  const lines = readFileSync(RUNS_PATH, 'utf8').trim().split('\n').filter(Boolean)
  const recs = []
  for (const line of lines) {
    try {
      const r = JSON.parse(line)
      if (r.schema === 3) recs.push(r)
    } catch {}
  }
  if (recs.length === 0) {
    console.error('No schema-3 runs found. Run the current eval to generate one.')
    process.exit(1)
  }
  return recs
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG helpers — uses shared palette from scripts/lib/chart-style.js
// ─────────────────────────────────────────────────────────────────────────────

// Local alias for the shared palette so the existing chart code reads naturally.
const PALETTE = {
  bg:      STYLE.bg,
  fg:      STYLE.fg,
  fgDim:   STYLE.fgDim,
  grid:    STYLE.grid,
  panel:   STYLE.panel,
  train:   STYLE.train,
  trainBg: STYLE.trainBg,
  test:    STYLE.test,
  testBg:  STYLE.testBg,
  zero:    STYLE.zero,
  warn:    STYLE.unsafe,
}

function svgHeader(w, h, t) {
  return svgOpen(w, h)
       + title(w, 26, t, { size: STYLE.titleSize })
}

function svgFooter() { return svgClose() }

// ─────────────────────────────────────────────────────────────────────────────
// Charts
// ─────────────────────────────────────────────────────────────────────────────

function chartTrend(runs) {
  const W = 880, H = 360
  const ML = 60, MR = 130, MT = 50, MB = 50
  const trainSeries = runs.map(r => r.train.wmae)
  const testSeries  = runs.map(r => r.test?.wmae ?? 0)
  const yMax = niceCeil(Math.max(...trainSeries, ...testSeries))
  const xMin = 0, xMax = Math.max(1, runs.length - 1)
  const x = scale(xMin, xMax, ML, W - MR)
  const y = scale(0, yMax, H - MB, MT)

  let body = svgHeader(W, H, 'WMAE over time — train (ratchet) vs. holdout')

  // Y grid + labels
  const yTicks = 5
  for (let i = 0; i <= yTicks; i++) {
    const v = (yMax * i) / yTicks
    const yp = y(v)
    body += `<line x1="${ML}" y1="${yp}" x2="${W-MR}" y2="${yp}" stroke="${PALETTE.grid}" stroke-width="0.5" />`
    body += `<text x="${ML-6}" y="${yp+3}" text-anchor="end" fill="${PALETTE.fg}">${v.toFixed(2)}</text>`
  }

  // X labels (run index, every Nth)
  const step = Math.max(1, Math.ceil(runs.length / 10))
  for (let i = 0; i < runs.length; i += step) {
    const xp = x(i)
    body += `<line x1="${xp}" y1="${H-MB}" x2="${xp}" y2="${H-MB+4}" stroke="${PALETTE.fg}" />`
    const ts = runs[i].timestamp.slice(5, 16).replace('T', ' ')
    body += `<text x="${xp}" y="${H-MB+18}" text-anchor="middle" fill="${PALETTE.fg}" font-size="9">${ts}</text>`
  }

  // Axis labels
  body += `<text x="${ML/2 - 8}" y="${(MT+H-MB)/2}" transform="rotate(-90 ${ML/2 - 8} ${(MT+H-MB)/2})" text-anchor="middle" fill="${PALETTE.fg}">WMAE (min)</text>`

  // Train line
  const trainPath = trainSeries.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  body += `<path d="${trainPath}" fill="none" stroke="${PALETTE.train}" stroke-width="2" />`
  for (let i = 0; i < trainSeries.length; i++) {
    body += `<circle cx="${x(i)}" cy="${y(trainSeries[i])}" r="2.5" fill="${PALETTE.train}" />`
  }

  // Test line
  const testPath = testSeries.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  body += `<path d="${testPath}" fill="none" stroke="${PALETTE.test}" stroke-width="2" stroke-dasharray="4,3" />`
  for (let i = 0; i < testSeries.length; i++) {
    body += `<circle cx="${x(i)}" cy="${y(testSeries[i])}" r="2.5" fill="${PALETTE.test}" />`
  }

  // Legend
  const lx = W - MR + 10, ly = MT + 10
  body += `<line x1="${lx}" y1="${ly}" x2="${lx+24}" y2="${ly}" stroke="${PALETTE.train}" stroke-width="2" />`
  body += `<text x="${lx+30}" y="${ly+3}" fill="${PALETTE.fg}">train (ratchet)</text>`
  body += `<line x1="${lx}" y1="${ly+18}" x2="${lx+24}" y2="${ly+18}" stroke="${PALETTE.test}" stroke-width="2" stroke-dasharray="4,3" />`
  body += `<text x="${lx+30}" y="${ly+21}" fill="${PALETTE.fg}">holdout</text>`

  body += svgFooter()
  return body
}

function chartBars(latest, key, title, opts = {}) {
  const trainMap = latest.train[key] ?? {}
  const testMap  = latest.test?.[key] ?? {}
  const allKeys  = [...new Set([...Object.keys(trainMap), ...Object.keys(testMap)])]
  if (allKeys.length === 0) return null

  // Sort by combined WMAE descending
  allKeys.sort((a, b) => {
    const aV = trainMap[a]?.wmae ?? testMap[a]?.wmae ?? 0
    const bV = trainMap[b]?.wmae ?? testMap[b]?.wmae ?? 0
    return bV - aV
  })

  const W = Math.max(720, 280 + allKeys.length * 60)
  const H = 380
  const ML = 60, MR = 140, MT = 50, MB = 130
  const yMax = niceCeil(Math.max(
    ...allKeys.map(k => trainMap[k]?.wmae ?? 0),
    ...allKeys.map(k => testMap[k]?.wmae ?? 0),
  ))
  const xBand = (W - ML - MR) / allKeys.length
  const barW = Math.min(28, xBand * 0.4)
  const y = scale(0, yMax, H - MB, MT)

  let body = svgHeader(W, H, title)

  // Y grid
  for (let i = 0; i <= 5; i++) {
    const v = (yMax * i) / 5
    const yp = y(v)
    body += `<line x1="${ML}" y1="${yp}" x2="${W-MR}" y2="${yp}" stroke="${PALETTE.grid}" stroke-width="0.5" />`
    body += `<text x="${ML-6}" y="${yp+3}" text-anchor="end" fill="${PALETTE.fg}">${v.toFixed(2)}</text>`
  }
  body += `<text x="${ML/2 - 8}" y="${(MT+H-MB)/2}" transform="rotate(-90 ${ML/2 - 8} ${(MT+H-MB)/2})" text-anchor="middle" fill="${PALETTE.fg}">WMAE (min)</text>`

  for (let i = 0; i < allKeys.length; i++) {
    const k = allKeys[i]
    const cx = ML + xBand * (i + 0.5)
    const tV = trainMap[k]?.wmae
    const hV = testMap[k]?.wmae
    if (tV !== undefined) {
      const bx = cx - barW - 1
      body += `<rect x="${bx}" y="${y(tV)}" width="${barW}" height="${H - MB - y(tV)}" fill="${PALETTE.train}" />`
      body += `<text x="${bx + barW/2}" y="${y(tV)-3}" text-anchor="middle" fill="${PALETTE.fg}" font-size="9">${tV.toFixed(2)}</text>`
    }
    if (hV !== undefined) {
      const bx = cx + 1
      body += `<rect x="${bx}" y="${y(hV)}" width="${barW}" height="${H - MB - y(hV)}" fill="${PALETTE.test}" />`
      body += `<text x="${bx + barW/2}" y="${y(hV)-3}" text-anchor="middle" fill="${PALETTE.fg}" font-size="9">${hV.toFixed(2)}</text>`
    }
    // X label (rotated)
    const labelY = H - MB + 12
    body += `<text x="${cx}" y="${labelY}" transform="rotate(-35 ${cx} ${labelY})" text-anchor="end" fill="${PALETTE.fg}" font-size="10">${escape(k.slice(0, 30))}</text>`
  }

  // Legend
  body += `<rect x="${W - 180}" y="${MT}" width="12" height="10" fill="${PALETTE.train}" />`
  body += `<text x="${W - 164}" y="${MT + 9}" fill="${PALETTE.fg}">train (ratchet)</text>`
  body += `<rect x="${W - 180}" y="${MT + 16}" width="12" height="10" fill="${PALETTE.test}" />`
  body += `<text x="${W - 164}" y="${MT + 25}" fill="${PALETTE.fg}">holdout</text>`

  body += svgFooter()
  return body
}

function chartBiasByPrayer(latest) {
  const PRAYERS = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']
  const train = latest.train.perPrayerSigned ?? {}
  const test  = latest.test?.perPrayerSigned ?? {}
  // Unsafe directions per prayer (matches compare.js)
  const UNSAFE = { fajr: 'down', maghrib: 'down', isha: 'down', shuruq: 'up' }

  const W = 720, H = 360
  const ML = 70, MR = 130, MT = 50, MB = 60
  const all = PRAYERS.flatMap(p => [train[p] ?? 0, test[p] ?? 0])
  const yAbs = niceCeil(Math.max(1, ...all.map(Math.abs)))
  const yMin = -yAbs, yMax = yAbs
  const xBand = (W - ML - MR) / PRAYERS.length
  const barW = Math.min(28, xBand * 0.35)
  const y = scale(yMin, yMax, H - MB, MT)
  const yZero = y(0)

  let body = svgHeader(W, H, 'Signed bias per prayer (calc − ground truth, minutes)')

  // Y grid (every yMax/4)
  for (let v = -yAbs; v <= yAbs; v += yAbs / 4) {
    if (Math.abs(v) < 0.001) continue
    const yp = y(v)
    body += `<line x1="${ML}" y1="${yp}" x2="${W-MR}" y2="${yp}" stroke="${PALETTE.grid}" stroke-width="0.5" />`
    body += `<text x="${ML-6}" y="${yp+3}" text-anchor="end" fill="${PALETTE.fg}">${v >= 0 ? '+' : ''}${v.toFixed(1)}</text>`
  }
  // Zero line, prominent
  body += `<line x1="${ML}" y1="${yZero}" x2="${W-MR}" y2="${yZero}" stroke="${PALETTE.zero}" stroke-width="1.2" />`
  body += `<text x="${ML-6}" y="${yZero+3}" text-anchor="end" fill="${PALETTE.fg}">0</text>`

  for (let i = 0; i < PRAYERS.length; i++) {
    const p = PRAYERS[i]
    const cx = ML + xBand * (i + 0.5)
    const tV = train[p]
    const hV = test[p]
    const drawBar = (v, x0, color) => {
      if (v === undefined) return ''
      const yV = y(v)
      const yTop = Math.min(yV, yZero), yBot = Math.max(yV, yZero)
      let s = `<rect x="${x0}" y="${yTop}" width="${barW}" height="${yBot - yTop}" fill="${color}" />`
      const labelY = v >= 0 ? yTop - 3 : yBot + 11
      const sign = v >= 0 ? '+' : ''
      s += `<text x="${x0 + barW/2}" y="${labelY}" text-anchor="middle" fill="${PALETTE.fg}" font-size="9">${sign}${v.toFixed(2)}</text>`
      // Unsafe direction marker
      const isUnsafe = (UNSAFE[p] === 'down' && v < 0) || (UNSAFE[p] === 'up' && v > 0)
      if (isUnsafe && Math.abs(v) > 1) {
        s += `<text x="${x0 + barW/2}" y="${labelY + (v >= 0 ? -10 : 10)}" text-anchor="middle" fill="${PALETTE.warn}" font-size="11">⚠</text>`
      }
      return s
    }
    body += drawBar(tV, cx - barW - 1, PALETTE.train)
    body += drawBar(hV, cx + 1, PALETTE.test)
    // X label
    body += `<text x="${cx}" y="${H - MB + 18}" text-anchor="middle" fill="${PALETTE.fg}" font-size="11">${p}</text>`
    // ihtiyat-unsafe direction marker on x-axis label
    body += `<text x="${cx}" y="${H - MB + 32}" text-anchor="middle" fill="${PALETTE.zero}" font-size="9">unsafe ${UNSAFE[p] === 'down' ? '↓' : '↑'}</text>`
  }

  // Legend
  const lx = W - MR + 10, ly = MT + 10
  body += `<rect x="${lx}" y="${ly}" width="12" height="10" fill="${PALETTE.train}" />`
  body += `<text x="${lx+16}" y="${ly+9}" fill="${PALETTE.fg}">train</text>`
  body += `<rect x="${lx}" y="${ly+16}" width="12" height="10" fill="${PALETTE.test}" />`
  body += `<text x="${lx+16}" y="${ly+25}" fill="${PALETTE.fg}">holdout</text>`
  body += `<text x="${lx}" y="${ly+50}" fill="${PALETTE.zero}" font-size="10">↑↓ = direction</text>`
  body += `<text x="${lx}" y="${ly+62}" fill="${PALETTE.zero}" font-size="10">that violates</text>`
  body += `<text x="${lx}" y="${ly+74}" fill="${PALETTE.zero}" font-size="10">ihtiyat</text>`
  body += `<text x="${lx}" y="${ly+92}" fill="${PALETTE.warn}" font-size="11">⚠ = unsafe drift</text>`

  body += svgFooter()
  return body
}

// ─────────────────────────────────────────────────────────────────────────────
// Historical trajectory — Experiment 1–7 narrative (Aladhan-only baseline)
// ─────────────────────────────────────────────────────────────────────────────

// Static data: the original autoresearch experiment milestones. These predate
// today's multi-source eval framework; numbers are from the Experiment 7
// README baseline (Aladhan-only, ~222 ground-truth points, 18 cities).
const HISTORICAL_EXPERIMENTS = [
  { label: 'Baseline',           wmae: 24.17, note: 'ISNA hardcoded for all regions' },
  { label: 'Exp 1',              wmae: 21.39, note: 'Regional method auto-selection' },
  { label: 'Exp 3',              wmae:  2.31, note: 'High-lat Isha + eval-bug fix (most of the gain)' },
  { label: 'Exp 5',              wmae:  1.83, note: 'Reykjavik MiddleOfTheNight refinement' },
  { label: 'Exp 6',              wmae:  1.55, note: '+5 cities: Jakarta, Karachi, Dubai, Paris, Toronto' },
]

function chartHistoricalTrajectory() {
  const W = 880, H = 380
  const ML = 70, MR = 50, MT = 60, MB = 100
  const yMax = niceCeil(Math.max(...HISTORICAL_EXPERIMENTS.map(e => e.wmae)))
  const xMin = 0, xMax = HISTORICAL_EXPERIMENTS.length - 1
  const x = scale(xMin, xMax, ML, W - MR)
  const y = scale(0, yMax, H - MB, MT)

  let body = svgOpen(W, H)
  body += title(W, 28, 'Historical accuracy trajectory — Experiments 1–7 (Aladhan-only baseline)', { size: STYLE.titleSize })
  body += subtitle(W, 48, '24.17 → 1.55 min headline gain — but 89% of that came from Exp 3 fixing an evaluator bug, not engine work')

  // Plot panel
  body += `<rect x="${ML}" y="${MT}" width="${W - ML - MR}" height="${H - MT - MB}" fill="${STYLE.panel}" />`

  // Y grid + labels
  for (let i = 0; i <= 5; i++) {
    const v = (yMax * i) / 5
    const yp = y(v)
    body += `<line x1="${ML}" y1="${yp}" x2="${W-MR}" y2="${yp}" stroke="${STYLE.grid}" stroke-width="0.5" stroke-dasharray="2,3" />`
    body += `<text x="${ML-6}" y="${yp+3}" text-anchor="end" fill="${STYLE.fgDim}" font-size="${STYLE.tickSize}">${v.toFixed(1)}</text>`
  }
  body += `<text x="${ML/2 - 4}" y="${(MT+H-MB)/2}" transform="rotate(-90 ${ML/2 - 4} ${(MT+H-MB)/2})" text-anchor="middle" fill="${STYLE.fgDim}" font-size="${STYLE.axisSize}">WMAE (minutes)</text>`

  // Reference line: ~2-min atmospheric refraction floor (Young 2006)
  const yFloor = y(2)
  body += `<line x1="${ML}" y1="${yFloor}" x2="${W-MR}" y2="${yFloor}" stroke="${STYLE.borderline}" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" />`
  body += `<text x="${W-MR-8}" y="${yFloor-6}" text-anchor="end" fill="${STYLE.borderline}" font-size="${STYLE.tickSize}" opacity="0.85">~2 min atmospheric refraction floor (Young 2006)</text>`

  // Trajectory line
  const points = HISTORICAL_EXPERIMENTS.map((e, i) => `${x(i).toFixed(1)},${y(e.wmae).toFixed(1)}`).join(' ')
  body += `<polyline points="${points}" fill="none" stroke="${STYLE.train}" stroke-width="2.5" />`

  // Mark the "honest baseline" — Exp 3 onward is real engine work; before that
  // the high WMAE was partially an eval-counting bug.
  const xExp3 = x(2)
  body += `<line x1="${xExp3}" y1="${MT+10}" x2="${xExp3}" y2="${H-MB}" stroke="${STYLE.unsafe}" stroke-width="1" stroke-dasharray="3,4" opacity="0.6" />`
  body += `<text x="${xExp3 + 6}" y="${MT+22}" fill="${STYLE.unsafe}" font-size="${STYLE.axisSize}" opacity="0.95">eval-bug fix landed here</text>`
  body += `<text x="${xExp3 + 6}" y="${MT+36}" fill="${STYLE.unsafe}" font-size="${STYLE.tickSize}" opacity="0.8">— real engine progress is 2.31 → 1.55 ≈ 33%, not the 93.6% headline</text>`

  // Markers + labels
  for (let i = 0; i < HISTORICAL_EXPERIMENTS.length; i++) {
    const e = HISTORICAL_EXPERIMENTS[i]
    const xp = x(i), yp = y(e.wmae)
    body += `<circle cx="${xp.toFixed(1)}" cy="${yp.toFixed(1)}" r="4.5" fill="${STYLE.train}" stroke="${STYLE.bg}" stroke-width="2" />`
    body += `<text x="${xp.toFixed(1)}" y="${(yp - 12).toFixed(1)}" text-anchor="middle" fill="${STYLE.fg}" font-size="${STYLE.axisSize}" font-weight="600">${e.wmae.toFixed(2)}</text>`
    // X-axis label (two lines: name + brief note)
    body += `<text x="${xp.toFixed(1)}" y="${H-MB+18}" text-anchor="middle" fill="${STYLE.fg}" font-size="${STYLE.axisSize}" font-weight="600">${escape(e.label)}</text>`
    body += `<text x="${xp.toFixed(1)}" y="${H-MB+34}" text-anchor="middle" fill="${STYLE.fgDim}" font-size="${STYLE.tickSize}">${escape(e.note)}</text>`
  }

  body += svgClose()
  return body
}

// ─────────────────────────────────────────────────────────────────────────────
// progress.md
// ─────────────────────────────────────────────────────────────────────────────

function fmt(n, digits = 2) {
  if (n === undefined || Number.isNaN(n)) return '—'
  return Number(n).toFixed(digits)
}
function fmtSigned(n) {
  if (n === undefined || Number.isNaN(n)) return '—'
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2)
}

function progressMd(runs) {
  const latest = runs[runs.length - 1]
  const prev = runs.length >= 2 ? runs[runs.length - 2] : null

  const lines = []
  lines.push('# Progress')
  lines.push('')
  lines.push('_This file is auto-generated by `npm run build:charts`. Do not edit by hand._')
  lines.push('')
  lines.push(`Latest run: \`${latest.timestamp}\``)
  if (prev) lines.push(`Previous:   \`${prev.timestamp}\``)
  lines.push('')

  lines.push('## Headline')
  lines.push('')
  const dT = prev ? latest.train.wmae - prev.train.wmae : null
  const dH = prev && prev.test?.entries ? latest.test.wmae - prev.test.wmae : null
  lines.push('| Metric | Value | Δ since previous |')
  lines.push('|---|---:|---:|')
  lines.push(`| Train WMAE (ratchet) | ${fmt(latest.train.wmae, 4)} | ${dT === null ? '—' : fmtSigned(dT)} |`)
  lines.push(`| Holdout WMAE (test)  | ${fmt(latest.test.wmae, 4)} | ${dH === null ? '—' : fmtSigned(dH)} |`)
  lines.push(`| Train entries        | ${latest.train.entries} | |`)
  lines.push(`| Holdout entries      | ${latest.test.entries} | |`)
  lines.push('')

  lines.push('## Per-prayer (train)')
  lines.push('')
  lines.push('| Prayer | MAE (min) | Signed bias | Notes |')
  lines.push('|---|---:|---:|---|')
  const UNSAFE = { fajr: 'down', maghrib: 'down', isha: 'down', shuruq: 'up' }
  for (const p of ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    const mae = latest.train.perPrayer?.[p]
    const bias = latest.train.perPrayerSigned?.[p]
    let note = ''
    if (UNSAFE[p] && bias !== undefined) {
      const isUnsafe = (UNSAFE[p] === 'down' && bias < -0.3) || (UNSAFE[p] === 'up' && bias > 0.3)
      note = isUnsafe ? '⚠ unsafe drift' : ''
    }
    lines.push(`| ${p} | ${fmt(mae)} | ${fmtSigned(bias)} | ${note} |`)
  }
  lines.push('')

  lines.push('## Per-source agreement')
  lines.push('')
  lines.push('Lower WMAE = better agreement with that institution\'s tables.')
  lines.push('')
  lines.push('### Train (ratchet)')
  lines.push('')
  lines.push('| Source | Entries | WMAE | Fajr bias | Maghrib bias | Isha bias |')
  lines.push('|---|---:|---:|---:|---:|---:|')
  const trainSrc = Object.entries(latest.train.perSource ?? {}).sort(([, a], [, b]) => a.wmae - b.wmae)
  for (const [src, r] of trainSrc) {
    lines.push(`| ${src} | ${r.count} | ${fmt(r.wmae)} | ${fmtSigned(r.perPrayerSigned?.fajr)} | ${fmtSigned(r.perPrayerSigned?.maghrib)} | ${fmtSigned(r.perPrayerSigned?.isha)} |`)
  }
  lines.push('')
  lines.push('### Holdout (test, diagnostic only)')
  lines.push('')
  lines.push('| Source | Entries | WMAE | Fajr bias | Maghrib bias | Isha bias |')
  lines.push('|---|---:|---:|---:|---:|---:|')
  const testSrc = Object.entries(latest.test?.perSource ?? {}).sort(([, a], [, b]) => a.wmae - b.wmae)
  for (const [src, r] of testSrc) {
    lines.push(`| ${src} | ${r.count} | ${fmt(r.wmae)} | ${fmtSigned(r.perPrayerSigned?.fajr)} | ${fmtSigned(r.perPrayerSigned?.maghrib)} | ${fmtSigned(r.perPrayerSigned?.isha)} |`)
  }
  lines.push('')

  lines.push('## Per-region (train)')
  lines.push('')
  lines.push('| Region | Entries | WMAE | Fajr bias | Maghrib bias | Isha bias |')
  lines.push('|---|---:|---:|---:|---:|---:|')
  const trainReg = Object.entries(latest.train.perRegion ?? {}).sort(([, a], [, b]) => a.wmae - b.wmae)
  for (const [reg, r] of trainReg) {
    lines.push(`| ${reg} | ${r.count} | ${fmt(r.wmae)} | ${fmtSigned(r.perPrayerSigned?.fajr)} | ${fmtSigned(r.perPrayerSigned?.maghrib)} | ${fmtSigned(r.perPrayerSigned?.isha)} |`)
  }
  lines.push('')

  lines.push('## Trend (last 10 runs)')
  lines.push('')
  lines.push('| Timestamp | Train WMAE | Holdout WMAE |')
  lines.push('|---|---:|---:|')
  const recent = runs.slice(-10)
  for (const r of recent) {
    lines.push(`| ${r.timestamp} | ${fmt(r.train.wmae, 4)} | ${fmt(r.test?.wmae, 4)} |`)
  }
  lines.push('')

  lines.push('## Charts')
  lines.push('')
  lines.push('![WMAE over time](charts/wmae-trend.svg)')
  lines.push('')
  lines.push('![WMAE per source](charts/wmae-per-source.svg)')
  lines.push('')
  lines.push('![WMAE per region](charts/wmae-per-region.svg)')
  lines.push('')
  lines.push('![Signed bias per prayer](charts/bias-by-prayer.svg)')
  lines.push('')

  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const runs = loadRuns()
  const latest = runs[runs.length - 1]

  mkdirSync(CHARTS_DIR, { recursive: true })

  const trend = chartTrend(runs)
  writeFileSync(join(CHARTS_DIR, 'wmae-trend.svg'), trend)
  console.log(`→ wrote ${join(CHARTS_DIR, 'wmae-trend.svg')}`)

  const perSource = chartBars(latest, 'perSource', 'WMAE per source — latest run')
  if (perSource) {
    writeFileSync(join(CHARTS_DIR, 'wmae-per-source.svg'), perSource)
    console.log(`→ wrote ${join(CHARTS_DIR, 'wmae-per-source.svg')}`)
  }

  const perRegion = chartBars(latest, 'perRegion', 'WMAE per region — latest run')
  if (perRegion) {
    writeFileSync(join(CHARTS_DIR, 'wmae-per-region.svg'), perRegion)
    console.log(`→ wrote ${join(CHARTS_DIR, 'wmae-per-region.svg')}`)
  }

  const bias = chartBiasByPrayer(latest)
  writeFileSync(join(CHARTS_DIR, 'bias-by-prayer.svg'), bias)
  console.log(`→ wrote ${join(CHARTS_DIR, 'bias-by-prayer.svg')}`)

  const historical = chartHistoricalTrajectory()
  writeFileSync(join(CHARTS_DIR, 'historical-trajectory.svg'), historical)
  console.log(`→ wrote ${join(CHARTS_DIR, 'historical-trajectory.svg')}`)

  writeFileSync(PROGRESS_PATH, progressMd(runs))
  console.log(`→ wrote ${PROGRESS_PATH}`)
}

main()
