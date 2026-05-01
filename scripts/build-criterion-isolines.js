// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Build a 2D plot of Odeh's and Yallop's visibility-classification isolines on
 * the (ARCV, W) plane, overlaid with the observed historical cases from
 * eval/data/hilal-observations.json.
 *
 * The plot makes visible a structural feature of the two criteria that is
 * not obvious from their published forms: their A/B and B/C thresholds
 * differ only by a *constant additive offset* in V-vs-q space. The
 * "Odeh-visible-but-Yallop-not" band is therefore a constant-width strip
 * across the entire (ARCV, W) plane.
 *
 * Each historical case is plotted as a marker:
 *   - colour by which committees declared sighted vs not (split = ikhtilaf)
 *   - position (ARCV, W) at fajr's computed best time at the location of the
 *     first decision in that event (cases with the same astronomy across
 *     committees collapse onto a single marker)
 *
 * Output: docs/charts/criterion-isolines.svg
 *
 * Usage: node scripts/build-criterion-isolines.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { hilalVisibility } from '../src/hilal.js'
import { STYLE, svgOpen, svgClose, title, subtitle, escapeXml as escape, scale } from './lib/chart-style.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH  = join(__dirname, '..', 'docs', 'charts', 'criterion-isolines.svg')
const DATASET   = JSON.parse(readFileSync(join(__dirname, '..', 'eval', 'data', 'hilal-observations.json'), 'utf8'))

// ─────────────────────────────────────────────────────────────────────────────
// Isoline math (from Odeh 2004 eq. 6 and Yallop 1997 q definition)
// ─────────────────────────────────────────────────────────────────────────────
//
//   Odeh:    V = ARCV − (−0.1018 W³ + 0.7319 W² − 6.3226 W + 7.1651)
//   Yallop:  q = (ARCV − (11.8371 − 6.3226 W + 0.7319 W² − 0.1018 W³)) / 10
//
// Setting V = constant or q = constant and solving for ARCV gives a curve in
// (W, ARCV) space. The polynomial part (−6.3226W + 0.7319W² − 0.1018W³) is
// shared between Odeh and Yallop — the two differ only in the constant
// offset (7.1651 vs 11.8371) and Yallop's overall /10. So Odeh's V=2 and
// Yallop's q=−0.014 lines are *parallel* in (W, ARCV) space, separated by a
// constant 2.53° in ARCV at every W.

const polyShared = W => -6.3226*W + 0.7319*W*W - 0.1018*W*W*W

// Odeh V = c → ARCV = c + 7.1651 + polyShared(W) ... wait, actually
// V = ARCV − (correction) where correction = −0.1018W³ + 0.7319W² − 6.3226W + 7.1651
//                                          = polyShared(W) + 7.1651
// So ARCV at Odeh-V=c is: c + polyShared(W) + 7.1651
function arcvAtOdehV(W, V) { return V + polyShared(W) + 7.1651 }

// Yallop q = c → 10c = ARCV − (polyShared_neg(W) + 11.8371)
// Note Yallop's polynomial sign convention: f(W) = 11.8371 − 6.3226W + 0.7319W² − 0.1018W³
//                                                 = 11.8371 + polyShared(W)
// q = (ARCV − f(W))/10 = c → ARCV = 10c + 11.8371 + polyShared(W)
function arcvAtYallopQ(W, q) { return 10*q + polyShared(W) + 11.8371 }

// ─────────────────────────────────────────────────────────────────────────────
// Compute observed cases — pick the lat/lng of the first decision in each event
// ─────────────────────────────────────────────────────────────────────────────

const observed = []
for (const event of DATASET.observations) {
  if (!event.decisions?.length) continue
  const d0 = event.decisions[0]
  let r = null
  try {
    r = hilalVisibility({
      year:      event.hijri.year,
      month:     event.hijri.month,
      latitude:  d0.lat,
      longitude: d0.lng,
    })
  } catch {}
  if (!r || r.arcvDeg == null || r.widthArcmin == null) continue

  // Tally committee verdicts for the event
  const sighted = event.decisions.filter(d => d.decision === 'sighted').length
  const total = event.decisions.length
  observed.push({
    label:     event.label,
    arcv:      r.arcvDeg,
    width:     r.widthArcmin,
    moonAge:   r.moonAgeHours,
    odeh:      r.code,
    yallop:    r.yallop.code,
    shaukat:   r.shaukat.code,
    sightedFraction: sighted / total,
    sighted,
    total,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────────────────

const W = 880, H = 540
const ML = 70, MR = 200, MT = 70, MB = 80
const plotW = W - ML - MR
const plotH = H - MT - MB

const wMin = 0,    wMax = 1.0
const aMin = 0,    aMax = 14

const xScale = scale(wMin, wMax, ML, W - MR)
const yScale = scale(aMin, aMax, H - MB, MT)

let svg = svgOpen(W, H)
svg += title(W, 28, 'Cross-criterion isolines: where Odeh and Yallop structurally diverge')
svg += subtitle(W, 50, 'Both A/B and B/C visibility thresholds are parallel curves in the (ARCV, W) plane, offset by a constant ~2.5° in ARCV')

// Plot panel
svg += `<rect x="${ML}" y="${MT}" width="${plotW}" height="${plotH}" fill="${STYLE.panel}" />`

// Y grid + labels (ARCV, deg)
for (let a = aMin; a <= aMax; a += 2) {
  const y = yScale(a)
  svg += `<line x1="${ML}" y1="${y}" x2="${W-MR}" y2="${y}" stroke="${STYLE.grid}" stroke-width="0.5" stroke-dasharray="2,3" />`
  svg += `<text x="${ML-6}" y="${y+3}" text-anchor="end" fill="${STYLE.fgDim}" font-size="${STYLE.tickSize}">${a}°</text>`
}
svg += `<text x="${ML/2 - 4}" y="${(MT+H-MB)/2}" transform="rotate(-90 ${ML/2 - 4} ${(MT+H-MB)/2})" text-anchor="middle" fill="${STYLE.fgDim}" font-size="${STYLE.axisSize}">ARCV (degrees)</text>`

// X grid + labels (W, arcmin)
for (let w = 0; w <= 10; w++) {
  const wVal = w * 0.1
  const x = xScale(wVal)
  svg += `<line x1="${x}" y1="${MT}" x2="${x}" y2="${H-MB}" stroke="${STYLE.grid}" stroke-width="0.5" stroke-dasharray="2,3" />`
  svg += `<text x="${x}" y="${H-MB+14}" text-anchor="middle" fill="${STYLE.fgDim}" font-size="${STYLE.tickSize}">${wVal.toFixed(1)}</text>`
}
svg += `<text x="${(ML+W-MR)/2}" y="${H-MB+34}" text-anchor="middle" fill="${STYLE.fgDim}" font-size="${STYLE.axisSize}">crescent width W (arcminutes)</text>`

// Compute isoline curves as polylines
function curve(arcvFn) {
  const pts = []
  for (let w = wMin; w <= wMax; w += 0.01) {
    const a = arcvFn(w)
    if (a >= aMin && a <= aMax) {
      pts.push(`${xScale(w).toFixed(1)},${yScale(a).toFixed(1)}`)
    }
  }
  return pts.join(' ')
}

const odeh_AB    = curve(w => arcvAtOdehV(w, 5.65))    // Odeh A/B threshold
const odeh_BC    = curve(w => arcvAtOdehV(w, 2.0))     // Odeh B/C (visible / optical-aid) threshold
const odeh_CD    = curve(w => arcvAtOdehV(w, -0.96))   // Odeh C/D threshold

const yallop_AB  = curve(w => arcvAtYallopQ(w, 0.216))   // Yallop A/B
const yallop_BC  = curve(w => arcvAtYallopQ(w, -0.014))  // Yallop B/C  (visible / optical-aid)
const yallop_CD  = curve(w => arcvAtYallopQ(w, -0.160))  // Yallop C/D

// Shaded band: Odeh-visible-but-Yallop-not (between Odeh V=2 and Yallop q=-0.014)
// Build a closed polygon by going up Odeh's curve and back down Yallop's
function fillBand(curveLow, curveHigh) {
  const lowPts = curveLow.split(' ')
  const highPts = curveHigh.split(' ').reverse()
  return lowPts.concat(highPts).join(' ')
}
const ikhtilafBand = fillBand(odeh_BC, yallop_BC)
svg += `<polygon points="${ikhtilafBand}" fill="${STYLE.borderline}" opacity="0.18" />`

// Visibility regions labelling
svg += `<text x="${xScale(0.5)}" y="${yScale(13).toFixed(1)}" text-anchor="middle" fill="${STYLE.visible}" font-size="11" opacity="0.85" font-weight="600">naked-eye visible (both criteria)</text>`
svg += `<text x="${xScale(0.5)}" y="${yScale(7.5).toFixed(1)}" text-anchor="middle" fill="${STYLE.borderline}" font-size="10" opacity="0.85">ikhtilaf zone (Odeh visible, Yallop not)</text>`
svg += `<text x="${xScale(0.5)}" y="${yScale(2).toFixed(1)}" text-anchor="middle" fill="${STYLE.notVisible}" font-size="11" opacity="0.85" font-weight="600">not visible (both criteria)</text>`

// Draw isolines
const drawCurve = (pts, color, dasharray, label, labelW, labelArcv) => {
  let s = `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-dasharray="${dasharray}" opacity="0.9" />`
  if (label && labelW != null && labelArcv != null) {
    s += `<text x="${xScale(labelW)+4}" y="${yScale(labelArcv)-4}" fill="${color}" font-size="9" opacity="0.95">${escape(label)}</text>`
  }
  return s
}
svg += drawCurve(odeh_BC,   STYLE.train,  '0',     'Odeh V=2.0 (B/C)',           0.85, arcvAtOdehV(0.85, 2.0))
svg += drawCurve(yallop_BC, STYLE.test,   '4,3',   'Yallop q=−0.014 (B/C)',      0.85, arcvAtYallopQ(0.85, -0.014))
svg += drawCurve(odeh_AB,   STYLE.train,  '1,2',   'Odeh V=5.65 (A/B)',          0.85, arcvAtOdehV(0.85, 5.65))
svg += drawCurve(yallop_AB, STYLE.test,   '5,2,1,2', 'Yallop q=0.216 (A/B)',     0.85, arcvAtYallopQ(0.85, 0.216))

// Plot observed cases
for (const o of observed) {
  if (o.width > wMax || o.arcv > aMax) continue
  const x = xScale(o.width)
  const y = yScale(o.arcv)
  // Color by committee fragmentation: sighted vs not vs split
  let fill, stroke
  if (o.sightedFraction === 1) { fill = STYLE.visible; stroke = STYLE.bg }
  else if (o.sightedFraction === 0) { fill = STYLE.notVisible; stroke = STYLE.bg }
  else { fill = STYLE.unsafe; stroke = STYLE.bg }
  svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />`
  // Label with the event year/month
  const label = `${o.label.replace(/\s*\(.*$/, '').replace(/Ramadan/, 'R').replace(/Shawwal/, 'Sh').replace(/Dhu al-Hijjah/, 'DH')}`
  svg += `<text x="${(x+8).toFixed(1)}" y="${(y+3).toFixed(1)}" fill="${STYLE.fg}" font-size="9" opacity="0.85">${escape(label)} ${o.sighted}/${o.total}</text>`
}

// Legend (right side)
const lx = W - MR + 10
let ly = MT + 10
svg += `<text x="${lx}" y="${ly}" fill="${STYLE.fg}" font-size="11" font-weight="600">Isolines</text>`
ly += 18
svg += `<line x1="${lx}" y1="${ly}" x2="${lx+24}" y2="${ly}" stroke="${STYLE.train}" stroke-width="1.8" />`
svg += `<text x="${lx+30}" y="${ly+4}" fill="${STYLE.fg}" font-size="10">Odeh thresholds</text>`
ly += 16
svg += `<line x1="${lx}" y1="${ly}" x2="${lx+24}" y2="${ly}" stroke="${STYLE.test}" stroke-width="1.8" stroke-dasharray="4,3" />`
svg += `<text x="${lx+30}" y="${ly+4}" fill="${STYLE.fg}" font-size="10">Yallop thresholds</text>`
ly += 28

svg += `<text x="${lx}" y="${ly}" fill="${STYLE.fg}" font-size="11" font-weight="600">Historical cases</text>`
ly += 18
svg += `<circle cx="${lx+7}" cy="${ly}" r="5" fill="${STYLE.visible}" stroke="${STYLE.bg}" stroke-width="1.5" />`
svg += `<text x="${lx+22}" y="${ly+4}" fill="${STYLE.fg}" font-size="10">all committees sighted</text>`
ly += 18
svg += `<circle cx="${lx+7}" cy="${ly}" r="5" fill="${STYLE.notVisible}" stroke="${STYLE.bg}" stroke-width="1.5" />`
svg += `<text x="${lx+22}" y="${ly+4}" fill="${STYLE.fg}" font-size="10">none sighted</text>`
ly += 18
svg += `<circle cx="${lx+7}" cy="${ly}" r="5" fill="${STYLE.unsafe}" stroke="${STYLE.bg}" stroke-width="1.5" />`
svg += `<text x="${lx+22}" y="${ly+4}" fill="${STYLE.fg}" font-size="10">committees split</text>`
ly += 36

svg += `<text x="${lx}" y="${ly}" fill="${STYLE.fgDim}" font-size="9" opacity="0.85">Each marker is one Hijri</text>`
ly += 12
svg += `<text x="${lx}" y="${ly}" fill="${STYLE.fgDim}" font-size="9" opacity="0.85">month onset, plotted at</text>`
ly += 12
svg += `<text x="${lx}" y="${ly}" fill="${STYLE.fgDim}" font-size="9" opacity="0.85">fajr's computed (W, ARCV)</text>`
ly += 12
svg += `<text x="${lx}" y="${ly}" fill="${STYLE.fgDim}" font-size="9" opacity="0.85">at the first decision's location.</text>`

svg += svgClose()

mkdirSync(dirname(OUT_PATH), { recursive: true })
writeFileSync(OUT_PATH, svg)
console.log(`→ wrote ${OUT_PATH}`)
console.log(`  ${observed.length} historical cases plotted on (W, ARCV) plane`)
// Ikhtilaf band = (Yallop q=-0.014 line) - (Odeh V=2 line) in ARCV space
// = (10·(-0.014) + 11.8371) − (2.0 + 7.1651) = 11.6971 − 9.1651 = 2.53°
const bandWidth = (10 * -0.014 + 11.8371) - (2.0 + 7.1651)
console.log(`  Ikhtilaf-band width (constant in ARCV across all W): ${bandWidth.toFixed(2)}°`)
