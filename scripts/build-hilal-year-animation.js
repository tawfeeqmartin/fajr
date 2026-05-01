// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Build a self-contained animated SVG that cycles through hilal-visibility
 * disagreement maps for all 12 months of a Hijri year.
 *
 * Each cell of a 10° lat/lng grid has its own SMIL <animate> element with
 * 12 discrete fill values, one per month. A small label in the upper-left
 * cycles through the Hijri month names in lockstep. The animation runs
 * forever at 1 month per second.
 *
 * SMIL animation works in Firefox, Safari, and (for now) Chrome. Browsers
 * that don't animate the SVG show the first frame (Muharram), which is
 * still useful as a static map.
 *
 * Usage:
 *   node scripts/build-hilal-year-animation.js [--year HIJRI_YEAR] [--step DEG] [--out PATH]
 *
 * Default: Hijri year 1446 (Gregorian ~July 2024 – June 2025).
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { hilalVisibility } from '../src/hilal.js'
import { STYLE } from './lib/chart-style.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`)
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback
}

const YEAR = parseInt(arg('year', '1446'), 10)
const STEP = parseFloat(arg('step', '10'))
const FRAME_SECONDS = parseFloat(arg('frame', '1.0'))   // seconds per month
const OUT_PATH = arg(
  'out',
  join(__dirname, '..', 'docs', 'charts', `hilal-year-${YEAR}.svg`),
)
const DUR_S = (FRAME_SECONDS * 12).toFixed(2)

const MONTH_NAMES = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
]

const PALETTE = {
  bg:           STYLE.bg,
  ocean:        STYLE.panel,
  visible:      STYLE.visible,
  borderline:   STYLE.borderline,
  'not-visible':STYLE.notVisible,
  disagree:     STYLE.unsafe,
  unknown:      '#cccccc',
  fg:           STYLE.fg,
  city:         STYLE.city,
  cityHalo:     STYLE.cityHalo,
  grid:         STYLE.grid,
}

const CITY_ANCHORS = [
  { name: 'Mecca',        lat: 21.39,  lng:  39.86 },
  { name: 'Cairo',        lat: 30.04,  lng:  31.24 },
  { name: 'Istanbul',     lat: 41.01,  lng:  28.97 },
  { name: 'Tehran',       lat: 35.69,  lng:  51.39 },
  { name: 'Karachi',      lat: 24.86,  lng:  67.00 },
  { name: 'Dhaka',        lat: 23.81,  lng:  90.41 },
  { name: 'Jakarta',      lat: -6.21,  lng: 106.85 },
  { name: 'Kuala Lumpur', lat:  3.14,  lng: 101.69 },
  { name: 'Lagos',        lat:  6.45,  lng:   3.41 },
  { name: 'Casablanca',   lat: 33.57,  lng:  -7.59 },
  { name: 'London',       lat: 51.51,  lng:  -0.13 },
  { name: 'New York',     lat: 40.71,  lng: -74.01 },
  { name: 'Cape Town',    lat:-33.92,  lng:  18.42 },
  { name: 'São Paulo',    lat:-23.55,  lng: -46.63 },
]

const LAT_MIN = -60
const LAT_MAX = +60

function classifyCell(result) {
  if (!result || result.visible === null) return 'unknown'
  const o = result.visible
  const y = result.yallop?.visible
  const s = result.shaukat?.visible
  if (o === true && y === true && s === true) return 'visible'
  if (o === false && y === false && s === false) {
    if (result.code === 'C') return 'borderline'
    return 'not-visible'
  }
  return 'disagree'
}

function escape(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))
}

// Build the per-month grid for all 12 months.
function computeYear() {
  console.log(`Computing 12 monthly hilal maps for Hijri year ${YEAR} on a ${STEP}° grid…`)
  const t0 = Date.now()

  // Indexed by [month-1][cellIndex] → classification key
  const monthCells = []
  // Static cell positions are the same every month — build them once.
  const cellList = []
  for (let lat = LAT_MAX; lat > LAT_MIN; lat -= STEP) {
    for (let lng = -180; lng < 180; lng += STEP) {
      cellList.push({ cLat: lat - STEP / 2, cLng: lng + STEP / 2 })
    }
  }

  // Per-month summaries (counts).
  const monthSummaries = []

  for (let m = 1; m <= 12; m++) {
    const summary = { visible: 0, borderline: 0, 'not-visible': 0, disagree: 0, unknown: 0 }
    const cells = []
    for (const { cLat, cLng } of cellList) {
      let result = null
      try {
        result = hilalVisibility({ year: YEAR, month: m, latitude: cLat, longitude: cLng })
      } catch {}
      const cls = classifyCell(result)
      summary[cls]++
      cells.push(cls)
    }
    monthCells.push(cells)
    monthSummaries.push(summary)
    process.stdout.write(`  ${MONTH_NAMES[m-1]}: ${cells.length} cells (visible=${summary.visible}, borderline=${summary.borderline}, not-visible=${summary['not-visible']}, disagree=${summary.disagree})\n`)
  }

  console.log(`  total: ${(((Date.now() - t0) / 1000).toFixed(1))}s for ${12 * cellList.length} cell evaluations`)
  return { cellList, monthCells, monthSummaries }
}

function render({ cellList, monthCells, monthSummaries }) {
  const W = 1100
  const H = 640
  const ML = 60, MR = 30, MT = 90, MB = 110
  const plotW = W - ML - MR
  const plotH = H - MT - MB

  function project(lat, lng) {
    const x = ML + ((lng + 180) / 360) * plotW
    const y = MT + ((90 - lat) / 180) * plotH
    return [x, y]
  }
  function projectClipped(lat, lng) {
    const latC = Math.max(-90, Math.min(90, lat))
    const lngC = ((lng + 180) % 360 + 360) % 360 - 180
    return project(latC, lngC)
  }

  const cellPx  = (STEP / 360) * plotW
  const cellPxH = (STEP / 180) * plotH

  let body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="-apple-system, system-ui, sans-serif" font-size="11">`
  body += `<rect width="${W}" height="${H}" fill="${PALETTE.bg}" />`

  // Static plot frame
  body += `<rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}" fill="${PALETTE.ocean}" />`

  // Title
  body += `<text x="${W/2}" y="32" text-anchor="middle" fill="${PALETTE.fg}" font-size="18" font-weight="600">Hilal year ${YEAR} — three-criterion visibility map (animated)</text>`
  body += `<text x="${W/2}" y="52" text-anchor="middle" fill="${PALETTE.fg}" font-size="11" opacity="0.8">Cycles 12 Hijri months at ${FRAME_SECONDS}s/month — green: all 3 visible · amber: optical aid only · grey: not visible · red: ikhtilaf</text>`

  // Animated month name in upper left of plot
  // Use 12 stacked text elements, each visible during its second only.
  const labelX = ML + 8
  const labelY = MT + 18
  body += `<rect x="${ML+4}" y="${MT+4}" width="220" height="22" fill="#fff" opacity="0.7" rx="3" />`
  for (let m = 0; m < 12; m++) {
    // Each month label: opacity 1 only during its 1-second slot, else 0.
    // calcMode="discrete" with 13 keyTimes (12 frames + the final wrap).
    const opacityVals = []
    for (let k = 0; k < 12; k++) opacityVals.push(k === m ? '1' : '0')
    body += `<text x="${labelX}" y="${labelY}" fill="${PALETTE.fg}" font-size="14" font-weight="600" opacity="${m === 0 ? '1' : '0'}">${YEAR}-${String(m+1).padStart(2, '0')} ${escape(MONTH_NAMES[m])}<animate attributeName="opacity" values="${opacityVals.join(';')}" dur="${DUR_S}s" calcMode="discrete" repeatCount="indefinite" /></text>`
  }

  // Animated summary in upper right
  const summaryX = W - MR - 4
  const summaryY = MT + 18
  body += `<rect x="${summaryX - 326}" y="${MT+4}" width="326" height="22" fill="#fff" opacity="0.7" rx="3" />`
  for (let m = 0; m < 12; m++) {
    const opacityVals = []
    for (let k = 0; k < 12; k++) opacityVals.push(k === m ? '1' : '0')
    const s = monthSummaries[m]
    const label = `visible ${s.visible}  ·  borderline ${s.borderline}  ·  not visible ${s['not-visible']}  ·  disagree ${s.disagree}`
    body += `<text x="${summaryX}" y="${summaryY}" text-anchor="end" fill="${PALETTE.fg}" font-size="11" opacity="${m === 0 ? '1' : '0'}">${escape(label)}<animate attributeName="opacity" values="${opacityVals.join(';')}" dur="${DUR_S}s" calcMode="discrete" repeatCount="indefinite" /></text>`
  }

  // Lat/lng grid lines (static)
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = project(lat, 0)
    body += `<line x1="${ML}" y1="${y}" x2="${W-MR}" y2="${y}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="2,3" />`
    body += `<text x="${ML-6}" y="${y+3}" text-anchor="end" fill="${PALETTE.fg}" font-size="9" opacity="0.6">${lat >= 0 ? '+' : ''}${lat}°</text>`
  }
  for (let lng = -180; lng <= 180; lng += 60) {
    const [x] = project(0, lng)
    body += `<line x1="${x}" y1="${MT}" x2="${x}" y2="${H-MB}" stroke="${PALETTE.grid}" stroke-width="0.5" stroke-dasharray="2,3" />`
    body += `<text x="${x}" y="${H-MB+14}" text-anchor="middle" fill="${PALETTE.fg}" font-size="9" opacity="0.6">${lng}°</text>`
  }

  // Animated cells. Each <rect> has a single <animate> child cycling through
  // 12 fill colours (one per month) at calcMode="discrete".
  for (let i = 0; i < cellList.length; i++) {
    const c = cellList[i]
    const [x, y] = project(c.cLat + STEP / 2, c.cLng - STEP / 2)
    const fills = monthCells.map(m => PALETTE[m[i]] || PALETTE.unknown)
    body += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellPx.toFixed(1)}" height="${cellPxH.toFixed(1)}" fill="${fills[0]}" opacity="0.85"><animate attributeName="fill" values="${fills.join(';')}" dur="${DUR_S}s" calcMode="discrete" repeatCount="indefinite" /></rect>`
  }

  // Static city anchors
  for (const c of CITY_ANCHORS) {
    const [x, y] = projectClipped(c.lat, c.lng)
    body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${PALETTE.city}" stroke="${PALETTE.cityHalo}" stroke-width="0.8" />`
    body += `<text x="${(x+4).toFixed(1)}" y="${(y-4).toFixed(1)}" fill="${PALETTE.city}" font-size="9" stroke="${PALETTE.cityHalo}" stroke-width="2" paint-order="stroke" opacity="0.95">${escape(c.name)}</text>`
  }

  // Static legend
  const lx = ML
  const ly = H - MB + 30
  const items = [
    ['visible',     'all three say visible'],
    ['borderline',  'Odeh class C (optical aid only)'],
    ['not-visible', 'all three say not visible'],
    ['disagree',    'criteria disagree (ikhtilaf)'],
  ]
  let lxi = lx
  for (const [key, label] of items) {
    body += `<rect x="${lxi}" y="${ly-8}" width="14" height="10" fill="${PALETTE[key]}" />`
    body += `<text x="${lxi + 18}" y="${ly}" fill="${PALETTE.fg}" font-size="10">${escape(label)}</text>`
    lxi += 18 + label.length * 6 + 18
  }

  body += `<text x="${ML}" y="${H - MB + 50}" fill="${PALETTE.fg}" font-size="10" opacity="0.7">If your viewer doesn't animate (some Chromium-based environments suppress SMIL), the first frame (Muharram) is shown statically.</text>`

  body += `</svg>`
  return body
}

function main() {
  const data = computeYear()
  const svg = render(data)
  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, svg)
  console.log(`→ wrote ${OUT_PATH} (${(svg.length/1024).toFixed(1)} KB)`)
}

main()
