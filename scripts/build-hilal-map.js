// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Generate a world map of hilal (lunar crescent) visibility for a given
 * Hijri month, evaluated independently at every cell of a latitude /
 * longitude grid.
 *
 * Each cell is colour-coded by the verdict of fajr's three criteria
 * (Odeh / Yallop / Shaukat) at that location:
 *
 *   - all three say VISIBLE          → green
 *   - all three say NOT VISIBLE      → grey
 *   - all three say borderline-but-no (Odeh C optical-aid; rest D/F)
 *                                    → amber (a category boundary disagreement,
 *                                       still a single "not naked-eye" verdict)
 *   - criteria disagree on visible/not-visible
 *                                    → red — the actual ikhtilaf zones
 *
 * The intent is to surface for a given Hijri month transition exactly which
 * regions of the world face a contested sighting decision and which face an
 * astronomically-clear one. This is the kind of map ICOP publishes monthly;
 * fajr can now produce it from `node scripts/build-hilal-map.js`.
 *
 * Hand-rolled SVG (equirectangular projection, 360° wide × 180° tall, scaled).
 * Major Muslim-population cities are overlaid as dots with labels so the
 * geographic context is readable without an embedded coastline.
 *
 * Usage:
 *   node scripts/build-hilal-map.js [--year HIJRI_YEAR] [--month HIJRI_MONTH] [--step DEG] [--out PATH]
 *
 * Default: Hijri (1446, 9) = Ramadan 1446 = February-March 2025.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { hilalVisibility } from '../src/hilal.js'
import { STYLE } from './lib/chart-style.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULT_OBSERVATIONS = join(__dirname, '..', 'eval', 'data', 'hilal-observations.json')

// ─────────────────────────────────────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────────────────────────────────────

function arg(name, fallback) {
  const idx = process.argv.indexOf(`--${name}`)
  return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback
}

const YEAR  = parseInt(arg('year',  '1446'), 10)
const MONTH = parseInt(arg('month', '9'),    10)
const STEP  = parseFloat(arg('step', '10'))         // grid spacing (deg)
const OBSERVATIONS_PATH = arg('observations', DEFAULT_OBSERVATIONS)
const NO_OVERLAY = process.argv.includes('--no-observations')
const OUT_PATH = arg(
  'out',
  join(__dirname, '..', 'docs', 'charts', `hilal-${YEAR}-${String(MONTH).padStart(2,'0')}.svg`),
)

function loadObservations(year, month) {
  if (NO_OVERLAY) return []
  if (!existsSync(OBSERVATIONS_PATH)) return []
  try {
    const data = JSON.parse(readFileSync(OBSERVATIONS_PATH, 'utf8'))
    const record = (data.observations ?? []).find(
      o => o.hijri?.year === year && o.hijri?.month === month
    )
    return record?.decisions ?? []
  } catch {
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cells, classification, palette
// ─────────────────────────────────────────────────────────────────────────────

// We walk lat from +60 to −60 and lng from −180 to +180 in `STEP` increments.
// (Above ±60° hilal sighting is moot — astronomy near the poles is its own
// concern, see knowledge/wiki/regions/high-latitude.md.)
const LAT_MIN = -60
const LAT_MAX = +60

function classifyCell(result) {
  if (!result || result.visible === null) return 'unknown'
  const o = result.visible
  const y = result.yallop?.visible
  const s = result.shaukat?.visible
  if (o === true && y === true && s === true) return 'visible'
  if (o === false && y === false && s === false) {
    // All three say not visible. But there's a meaningful sub-distinction:
    // if Odeh's verdict is class C (optical aid only) then the polynomial is
    // saying "marginal / aided," not "impossible." Surface that as amber.
    if (result.code === 'C') return 'borderline'
    return 'not-visible'
  }
  return 'disagree'
}

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
  // Major Muslim-population cities — chosen for readability across the map,
  // not exhaustive coverage.
  { name: 'Mecca',        lat: 21.39,  lng:  39.86 },
  { name: 'Madinah',      lat: 24.47,  lng:  39.61 },
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
  { name: 'Paris',        lat: 48.86,  lng:   2.35 },
  { name: 'New York',     lat: 40.71,  lng: -74.01 },
  { name: 'Los Angeles',  lat: 34.05,  lng:-118.24 },
  { name: 'Toronto',      lat: 43.65,  lng: -79.38 },
  { name: 'Dubai',        lat: 25.20,  lng:  55.27 },
  { name: 'Riyadh',       lat: 24.71,  lng:  46.68 },
  { name: 'Cape Town',    lat:-33.92,  lng:  18.42 },
  { name: 'São Paulo',    lat:-23.55,  lng: -46.63 },
  { name: 'Bogotá',       lat:  4.71,  lng: -74.07 },
]

// ─────────────────────────────────────────────────────────────────────────────
// SVG rendering
// ─────────────────────────────────────────────────────────────────────────────

function escape(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))
}

function render(cells, hijriLabel, gregorianLabel, summary, decisions) {
  // Equirectangular: x = (lng + 180) / 360 × width, y = (90 − lat) / 180 × height
  const W = 1100
  const H = 600
  const ML = 60, MR = 30, MT = 70, MB = 90
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

  const cellPx = STEP / 360 * plotW   // approx — width and height are different scales
  const cellPxH = STEP / 180 * plotH

  let body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="-apple-system, system-ui, sans-serif" font-size="11">`
  body += `<rect width="${W}" height="${H}" fill="${PALETTE.bg}" />`

  // Plot frame
  body += `<rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}" fill="${PALETTE.ocean}" />`

  // Title
  body += `<text x="${W/2}" y="30" text-anchor="middle" fill="${PALETTE.fg}" font-size="17" font-weight="600">Hilal visibility map — ${escape(hijriLabel)} (${escape(gregorianLabel)})</text>`
  body += `<text x="${W/2}" y="50" text-anchor="middle" fill="${PALETTE.fg}" font-size="11" opacity="0.8">Three-criterion classification at sunset on day 29 of the prior Hijri month — Odeh + Yallop + Shaukat</text>`

  // Lat/lng grid lines
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

  // Cells (drawn first so cities and labels overlay)
  for (const cell of cells) {
    const [x, y] = project(cell.lat + STEP/2, cell.lng - STEP/2)
    body += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cellPx).toFixed(1)}" height="${(cellPxH).toFixed(1)}" fill="${PALETTE[cell.classification]}" opacity="0.85" />`
  }

  // City anchors (skip cities that overlap with an overlay marker — the
  // marker carries the same geography, so doubling up adds noise).
  const overlayKey = (lat, lng) => `${lat.toFixed(1)},${lng.toFixed(1)}`
  const overlaySet = new Set((decisions ?? []).map(d => overlayKey(d.lat, d.lng)))
  for (const c of CITY_ANCHORS) {
    if (overlaySet.has(overlayKey(c.lat, c.lng))) continue
    const [x, y] = projectClipped(c.lat, c.lng)
    body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="${PALETTE.city}" stroke="${PALETTE.cityHalo}" stroke-width="0.8" />`
    body += `<text x="${(x+4).toFixed(1)}" y="${(y-4).toFixed(1)}" fill="${PALETTE.city}" font-size="9" stroke="${PALETTE.cityHalo}" stroke-width="2" paint-order="stroke" opacity="0.95">${escape(c.name)}</text>`
  }

  // Observation overlays — diamond markers for documented committee decisions.
  for (const d of decisions ?? []) {
    const [x, y] = projectClipped(d.lat, d.lng)
    const fill = d.decision === 'sighted' ? STYLE.sighted : STYLE.notSighted
    const r = 6
    // Diamond (rotated square)
    body += `<polygon points="${x},${y-r} ${x+r},${y} ${x},${y+r} ${x-r},${y}" fill="${fill}" stroke="${PALETTE.cityHalo}" stroke-width="1.4" />`
    body += `<text x="${(x+9).toFixed(1)}" y="${(y+3).toFixed(1)}" fill="${PALETTE.fg}" font-size="10" font-weight="600" stroke="${PALETTE.cityHalo}" stroke-width="2.5" paint-order="stroke">${escape(d.country)}</text>`
  }

  // Legend (cell colors)
  const lx = ML
  const ly = H - MB + 30
  const items = [
    ['visible',     'all three criteria say visible'],
    ['borderline',  'optical-aid only (Odeh C, others D/F)'],
    ['not-visible', 'all three say not visible'],
    ['disagree',    'criteria disagree (ikhtilaf zone)'],
  ]
  let lxi = lx
  for (const [key, label] of items) {
    body += `<rect x="${lxi}" y="${ly-8}" width="14" height="10" fill="${PALETTE[key]}" />`
    body += `<text x="${lxi + 18}" y="${ly}" fill="${PALETTE.fg}" font-size="10">${escape(label)}</text>`
    lxi += 18 + label.length * 6 + 18
  }

  // Legend (overlays, second row, only if decisions present)
  if (decisions && decisions.length > 0) {
    const ly2 = ly + 22
    const r = 6
    body += `<polygon points="${lx+7},${ly2-8} ${lx+13},${ly2-2} ${lx+7},${ly2+4} ${lx+1},${ly2-2}" fill="${STYLE.sighted}" stroke="${PALETTE.cityHalo}" stroke-width="1.2" />`
    body += `<text x="${lx + 22}" y="${ly2}" fill="${PALETTE.fg}" font-size="10">committee declared SIGHTED</text>`
    const lx3 = lx + 230
    body += `<polygon points="${lx3+7},${ly2-8} ${lx3+13},${ly2-2} ${lx3+7},${ly2+4} ${lx3+1},${ly2-2}" fill="${STYLE.notSighted}" stroke="${PALETTE.cityHalo}" stroke-width="1.2" />`
    body += `<text x="${lx3 + 22}" y="${ly2}" fill="${PALETTE.fg}" font-size="10">committee declared NOT SIGHTED</text>`
  }

  // Summary count
  const summaryText = `${summary.visible} cells visible · ${summary.borderline} borderline · ${summary['not-visible']} not visible · ${summary.disagree} disagree`
  body += `<text x="${W - MR}" y="${H - MB + 50}" text-anchor="end" fill="${PALETTE.fg}" font-size="10" opacity="0.85">${escape(summaryText)}</text>`

  body += `</svg>`
  return body
}

// ─────────────────────────────────────────────────────────────────────────────
// Compute grid + render
// ─────────────────────────────────────────────────────────────────────────────

function gregorianRangeForHijri(year, month, anyResult) {
  // anyResult.evaluatedHijriDate.day = 29 of month-1; the new month is the
  // following Gregorian day. We grab the Gregorian date strings from any
  // valid result.
  const sunsetUTC = anyResult?.sunsetUTC ?? null
  if (!sunsetUTC) return `Hijri ${year}-${month}`
  const d = new Date(sunsetUTC)
  // The new month begins the following local day; for label purposes use
  // sighting evening's UTC date.
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `sighting ${yyyy}-${mm}-${dd} UTC`
}

function main() {
  const cells = []
  const summary = { visible: 0, borderline: 0, 'not-visible': 0, disagree: 0, unknown: 0 }
  let firstResult = null

  console.log(`Computing hilal visibility on a ${STEP}° grid for Hijri ${YEAR}-${MONTH}…`)
  const t0 = Date.now()

  for (let lat = LAT_MAX; lat > LAT_MIN; lat -= STEP) {
    for (let lng = -180; lng < 180; lng += STEP) {
      // Sample at the cell centre.
      const cLat = lat - STEP / 2
      const cLng = lng + STEP / 2
      let result = null
      try {
        result = hilalVisibility({ year: YEAR, month: MONTH, latitude: cLat, longitude: cLng })
      } catch (err) {
        // skip cell on error
      }
      if (!firstResult && result?.sunsetUTC) firstResult = result
      const cls = classifyCell(result)
      summary[cls]++
      cells.push({ lat: cLat, lng: cLng, classification: cls })
    }
  }

  const dt = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`  ${cells.length} cells computed in ${dt}s`)
  console.log(`  Summary:`)
  for (const [key, n] of Object.entries(summary)) {
    if (n > 0) console.log(`    ${key.padEnd(12)} ${n}`)
  }

  const hijriLabel = `Hijri ${YEAR}-${String(MONTH).padStart(2, '0')}`
  const gregorianLabel = gregorianRangeForHijri(YEAR, MONTH, firstResult)

  const decisions = loadObservations(YEAR, MONTH)
  if (decisions.length > 0) {
    console.log(`  overlay: ${decisions.length} committee decisions for Hijri ${YEAR}-${MONTH}`)
  }

  const svg = render(cells, hijriLabel, gregorianLabel, summary, decisions)

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, svg)
  console.log(`→ wrote ${OUT_PATH}`)
}

main()
