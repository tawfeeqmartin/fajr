// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Generate docs/charts/wmae-journey.svg — train + holdout WMAE trajectory
 * across all schema-3 runs in eval/results/runs.jsonl, annotated with the
 * specific release/change that drove each major delta.
 *
 * Differs from wmae-trend.svg (which just plots all runs by timestamp) in
 * that this chart calls out the release-tagged inflection points with
 * inline labels — the visual analog of the calibration-recipe document.
 *
 * The release→change mapping is maintained inline below. Each entry should
 * match a real tag in `git tag -l 'v*'`; if a future release isn't here yet,
 * update the MILESTONES array and re-run `npm run build:charts`.
 *
 * Hand-rolled SVG, no chart-lib dependency. Matches the cream-themed style
 * of the other docs/charts SVGs via scripts/lib/chart-style.js.
 *
 * Usage: node scripts/build-journey-chart.js
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { STYLE, svgOpen, svgClose, escapeXml as escape } from './lib/chart-style.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RUNS_PATH = join(__dirname, '..', 'eval', 'results', 'runs.jsonl')
const OUT_PATH = join(__dirname, '..', 'docs', 'charts', 'wmae-journey.svg')

// Each milestone is anchored by its FIRST run-index after the release was
// shipped. The chart annotates that run with the version label + change
// description. Add new entries here when new releases ship.
const MILESTONES = [
  { tag: 'v1.0',   tsPrefix: '2026-04-30T20:4', label: 'v1.0',   change: 'baseline (corpus + ratchet established)' },
  { tag: 'v1.1.1', tsPrefix: '2026-05-01T05',   label: 'v1.1.1', change: 'dayTimes elevation fix + npm publish CI' },
  { tag: 'v1.2.0', tsPrefix: '2026-05-01T22',   label: 'v1.2',   change: 'notes field + scholarly grounding (13 papers)' },
  { tag: 'v1.3.0', tsPrefix: '2026-05-01T23',   label: 'v1.3',   change: 'applyTayakkunBuffer + tarabishyTimes (Aabed/Tarabishy)' },
  { tag: 'v1.4.0', tsPrefix: '2026-05-02T01:0', label: 'v1.4',   change: 'world-coverage eval (163 countries) + 9 engine bboxes' },
  { tag: 'v1.4.1', tsPrefix: '2026-05-02T01:5', label: 'v1.4.1', change: 'JAKIM Path A ihtiyati offset (train −16.6%)' },
  { tag: 'v1.4.3', tsPrefix: '2026-05-02T09:4', label: 'v1.4.3', change: 'eval elevation-policy fix (train −32% to 0.70)' },
  { tag: 'v1.4.4', tsPrefix: '2026-05-02T09:56', label: 'v1.4.4', change: 'JAKIM Isha +1min Path A (train 0.70 → 0.68)' },
  { tag: 'v1.4.5', tsPrefix: '2026-05-02T10:04', label: 'v1.4.5', change: 'Diyanet Maghrib/Isha −1min Path A + corpus curation (train 0.68 → 0.67)' },
]

function loadRuns() {
  if (!existsSync(RUNS_PATH)) {
    console.error(`No runs at ${RUNS_PATH}.`)
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
    console.error('No schema-3 runs found.')
    process.exit(1)
  }
  return recs
}

function annotateMilestones(runs) {
  const out = MILESTONES.map(m => {
    const idx = runs.findIndex(r => (r.timestamp || '').startsWith(m.tsPrefix))
    return { ...m, runIndex: idx, run: idx >= 0 ? runs[idx] : null }
  }).filter(m => m.runIndex >= 0)
  return out
}

const W = 980
const H = 540
const PAD_L = 70
const PAD_R = 40
const PAD_T = 90
const PAD_B = 200

function buildSvg(runs, milestones) {
  const n = runs.length
  const trainVals = runs.map(r => r.train.wmae)
  const testVals = runs.map(r => r.test?.wmae ?? 0)

  const all = [...trainVals, ...testVals.filter(v => v > 0)]
  const sorted = all.slice().sort((a, b) => a - b)
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 1
  const yMax = Math.min(p99 * 1.1, 25)
  const yMin = 0

  const xRange = n - 1 || 1
  const xPlotW = W - PAD_L - PAD_R
  const yPlotH = H - PAD_T - PAD_B
  const xAt = (i) => PAD_L + (i / xRange) * xPlotW
  const yAt = (v) => {
    const clipped = Math.min(v, yMax)
    return PAD_T + (1 - (clipped - yMin) / (yMax - yMin)) * yPlotH
  }

  let svg = svgOpen(W, H)

  svg += `<text x="${W / 2}" y="32" text-anchor="middle" fill="${STYLE.fg}" font-size="${STYLE.titleSize + 2}" font-weight="700">WMAE Journey — fajr v1.0 → ${MILESTONES[MILESTONES.length - 1].label}</text>`
  svg += `<text x="${W / 2}" y="54" text-anchor="middle" fill="${STYLE.fgDim}" font-size="${STYLE.subtitleSize + 1}">Train WMAE (ratchet) and Holdout WMAE across ${n} eval runs · annotations call out the release that drove each delta</text>`
  svg += `<text x="${W / 2}" y="72" text-anchor="middle" fill="${STYLE.fgFaint}" font-size="${STYLE.subtitleSize}">Lower is better · y-axis clipped at ${yMax.toFixed(0)} min for readability (early v1.4.0 holdout pre-tz-fix peaked at 151 min)</text>`

  svg += `<rect x="${PAD_L}" y="${PAD_T}" width="${xPlotW}" height="${yPlotH}" fill="${STYLE.panel}" />`

  const yTicks = [0, 5, 10, 15, 20, 25].filter(v => v <= yMax)
  for (const t of yTicks) {
    const y = yAt(t)
    svg += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="${STYLE.grid}" stroke-width="1" stroke-dasharray="2,3" />`
    svg += `<text x="${PAD_L - 8}" y="${y + 4}" text-anchor="end" fill="${STYLE.fgFaint}" font-size="${STYLE.tickSize}">${t}</text>`
  }
  svg += `<text x="${PAD_L - 50}" y="${PAD_T + yPlotH / 2}" text-anchor="middle" fill="${STYLE.fgDim}" font-size="${STYLE.axisSize}" transform="rotate(-90 ${PAD_L - 50} ${PAD_T + yPlotH / 2})">WMAE (minutes)</text>`

  svg += `<line x1="${PAD_L}" y1="${PAD_T + yPlotH}" x2="${W - PAD_R}" y2="${PAD_T + yPlotH}" stroke="${STYLE.axis}" stroke-width="1.5" />`
  svg += `<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + yPlotH}" stroke="${STYLE.axis}" stroke-width="1.5" />`

  let holdoutPath = ''
  testVals.forEach((v, i) => {
    if (v > 0) {
      const cmd = holdoutPath === '' ? 'M' : 'L'
      holdoutPath += `${cmd}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)} `
    }
  })
  svg += `<path d="${holdoutPath}" fill="none" stroke="${STYLE.test}" stroke-width="2" opacity="0.7" />`
  testVals.forEach((v, i) => {
    if (v > 0) {
      const isClipped = v > yMax
      svg += `<circle cx="${xAt(i)}" cy="${yAt(v)}" r="3.5" fill="${STYLE.bg}" stroke="${STYLE.test}" stroke-width="1.8" />`
      if (isClipped) {
        svg += `<text x="${xAt(i)}" y="${yAt(v) - 8}" text-anchor="middle" fill="${STYLE.test}" font-size="9" font-weight="bold">↑</text>`
      }
    }
  })

  let trainPath = ''
  trainVals.forEach((v, i) => {
    const cmd = trainPath === '' ? 'M' : 'L'
    trainPath += `${cmd}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)} `
  })
  svg += `<path d="${trainPath}" fill="none" stroke="${STYLE.train}" stroke-width="2.5" />`
  trainVals.forEach((v, i) => {
    svg += `<circle cx="${xAt(i)}" cy="${yAt(v)}" r="3.5" fill="${STYLE.train}" />`
  })

  const labelLanes = [0, 1, 0, 1, 0, 1]
  milestones.forEach((m, mi) => {
    const x = xAt(m.runIndex)
    const lane = labelLanes[mi % labelLanes.length]
    const labelY = PAD_T - 4 - (lane === 0 ? 0 : 14)
    svg += `<line x1="${x}" y1="${PAD_T}" x2="${x}" y2="${PAD_T + yPlotH}" stroke="${STYLE.unsafe}" stroke-width="1" stroke-dasharray="3,3" opacity="0.5" />`
    svg += `<rect x="${x - 22}" y="${labelY - 11}" width="44" height="14" rx="3" fill="${STYLE.unsafe}" opacity="0.9" />`
    svg += `<text x="${x}" y="${labelY}" text-anchor="middle" fill="white" font-size="${STYLE.tickSize}" font-weight="600">${escape(m.label)}</text>`
    const tw = m.run.train.wmae
    const hw = m.run.test?.wmae ?? null
    svg += `<text x="${x + 6}" y="${yAt(tw) - 8}" fill="${STYLE.train}" font-size="${STYLE.tickSize}" font-weight="600">${tw.toFixed(2)}</text>`
    if (hw && hw <= yMax) {
      svg += `<text x="${x + 6}" y="${yAt(hw) - 8}" fill="${STYLE.test}" font-size="${STYLE.tickSize}" font-weight="600">${hw.toFixed(1)}</text>`
    }
  })

  const blockY = PAD_T + yPlotH + 32
  svg += `<text x="${PAD_L}" y="${blockY}" fill="${STYLE.fg}" font-size="${STYLE.subtitleSize + 1}" font-weight="600">Release timeline</text>`
  milestones.forEach((m, mi) => {
    const ly = blockY + 18 + mi * 16
    const tw = m.run.train.wmae
    const hw = m.run.test?.wmae ?? null
    svg += `<text x="${PAD_L}" y="${ly}" fill="${STYLE.fg}" font-size="${STYLE.subtitleSize}">`
    svg += `<tspan font-weight="700" fill="${STYLE.unsafe}">${escape(m.label)}</tspan>`
    svg += `<tspan dx="8" fill="${STYLE.train}">train ${tw.toFixed(2)}</tspan>`
    if (hw) svg += `<tspan dx="6" fill="${STYLE.test}">holdout ${hw.toFixed(2)}</tspan>`
    svg += `<tspan dx="10" fill="${STYLE.fgDim}">${escape(m.change)}</tspan>`
    svg += `</text>`
  })

  const legX = W - PAD_R - 220
  const legY = PAD_T + 8
  svg += `<rect x="${legX - 6}" y="${legY - 12}" width="216" height="40" rx="3" fill="${STYLE.bg}" stroke="${STYLE.grid}" />`
  svg += `<circle cx="${legX + 8}" cy="${legY}" r="4" fill="${STYLE.train}" />`
  svg += `<text x="${legX + 18}" y="${legY + 3}" fill="${STYLE.fg}" font-size="${STYLE.tickSize + 1}">Train WMAE (ratchet)</text>`
  svg += `<circle cx="${legX + 8}" cy="${legY + 18}" r="4" fill="${STYLE.bg}" stroke="${STYLE.test}" stroke-width="1.5" />`
  svg += `<text x="${legX + 18}" y="${legY + 21}" fill="${STYLE.fg}" font-size="${STYLE.tickSize + 1}">Holdout WMAE (diagnostic)</text>`

  svg += svgClose()
  return svg
}

const runs = loadRuns()
const milestones = annotateMilestones(runs)
const svg = buildSvg(runs, milestones)
const outDir = dirname(OUT_PATH)
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
writeFileSync(OUT_PATH, svg)
console.log(`→ wrote ${OUT_PATH} (${runs.length} runs, ${milestones.length} milestones annotated)`)
