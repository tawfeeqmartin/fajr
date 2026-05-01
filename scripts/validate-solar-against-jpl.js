// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Validate src/lunar.js's solarPosition() (Meeus chapter 25 simplified)
 * against NASA JPL Horizons astrometric ephemeris.
 *
 * Why: hilal classification depends on the sun-moon arc of vision (ARCV),
 * which uses both lunar AND solar position. validate-lunar-against-jpl.js
 * already covers the lunar primitive; this script closes the matching gap
 * for the solar primitive.
 *
 * Method: identical to the lunar version but with target=10 (Sun) and
 * distance in AU.
 *
 * Run-once. Re-run only if solarPosition() in lunar.js changes.
 *
 * Usage: node scripts/validate-solar-against-jpl.js
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { solarPosition, jdFromDate } from '../src/lunar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'docs', 'solar-jpl-validation.md')

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

async function fetchJplSolar() {
  const url = new URL('https://ssd.jpl.nasa.gov/api/horizons.api')
  const params = {
    format:      'json',
    MAKE_EPHEM:  'YES',
    COMMAND:     "'10'",                        // Sun
    EPHEM_TYPE:  'OBSERVER',
    CENTER:      "'500@399'",                   // Earth geocenter
    START_TIME:  "'2026-04-01'",
    STOP_TIME:   "'2026-04-30'",
    STEP_SIZE:   "'1 d'",
    QUANTITIES:  "'1,20'",                      // astrometric RA/Dec + range
    ANG_FORMAT:  'HMS',
    CSV_FORMAT:  'NO',
  }
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} from JPL Horizons`)
  const json = await res.json()
  if (!json.result) throw new Error('JPL response missing `result` field')
  return parseEphemeris(json.result)
}

function parseEphemeris(text) {
  const startIdx = text.indexOf('$$SOE')
  const endIdx   = text.indexOf('$$EOE')
  if (startIdx < 0 || endIdx < 0) throw new Error('JPL response missing $$SOE / $$EOE markers')
  const block = text.slice(startIdx + 5, endIdx).trim()
  const rows = []
  const rowRegex = /^\s*(\d{4})-(\w{3})-(\d{2})\s+(\d{2}):(\d{2})\s+(\d{2})\s+(\d{2})\s+([\d.]+)\s+([+\-])(\d{2})\s+(\d{2})\s+([\d.]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/

  for (const line of block.split('\n')) {
    const m = line.match(rowRegex)
    if (!m) continue
    const [, yyyy, monStr, dd, hh, mm,
           raH, raM, raS,
           decSignStr, decD, decM, decS,
           rangeAU] = m
    const monthIdx = MONTHS.indexOf(monStr)
    if (monthIdx < 0) continue
    const date = new Date(Date.UTC(+yyyy, monthIdx, +dd, +hh, +mm))
    const ra = (parseInt(raH) + parseInt(raM)/60 + parseFloat(raS)/3600) * 15
    const decSign = decSignStr === '-' ? -1 : 1
    const dec = decSign * (parseInt(decD) + parseInt(decM)/60 + parseFloat(decS)/3600)
    rows.push({ date, ra, dec, distanceAU: parseFloat(rangeAU) })
  }
  return rows
}

// Precess mean-of-date RA/Dec back to ICRF/J2000 (Meeus 21.3) — same routine
// as in the lunar validator, since solarPosition() also outputs in mean-of-date.
function precessToJ2000(raDeg, decDeg, jd) {
  const T = (jd - 2451545.0) / 36525
  const arcSecToRad = Math.PI / (180 * 3600)
  const zeta  = (2306.2181 * T + 0.30188 * T*T + 0.017998 * T*T*T) * arcSecToRad
  const z     = (2306.2181 * T + 1.09468 * T*T + 0.018203 * T*T*T) * arcSecToRad
  const theta = (2004.3109 * T - 0.42665 * T*T - 0.041833 * T*T*T) * arcSecToRad

  const ra  = raDeg  * Math.PI / 180
  const dec = decDeg * Math.PI / 180

  const x = Math.cos(dec) * Math.cos(ra)
  const y = Math.cos(dec) * Math.sin(ra)
  const z3 = Math.sin(dec)

  const cZ = Math.cos(zeta),  sZ = Math.sin(zeta)
  const cZ2 = Math.cos(z),    sZ2 = Math.sin(z)
  const cT = Math.cos(theta), sT = Math.sin(theta)
  const M = [
    [cZ*cT*cZ2 - sZ*sZ2,    sZ*cT*cZ2 + cZ*sZ2,    sT*cZ2],
    [-(cZ*cT*sZ2 + sZ*cZ2), -(sZ*cT*sZ2 - cZ*cZ2), -sT*sZ2],
    [-cZ*sT,                -sZ*sT,                 cT     ],
  ]
  const x0 = M[0][0]*x + M[0][1]*y + M[0][2]*z3
  const y0 = M[1][0]*x + M[1][1]*y + M[1][2]*z3
  const z0 = M[2][0]*x + M[2][1]*y + M[2][2]*z3

  let raJ = Math.atan2(y0, x0) * 180 / Math.PI
  if (raJ < 0) raJ += 360
  return { ra: raJ, dec: Math.asin(z0) * 180 / Math.PI }
}

function computeResiduals(jplRows) {
  const residuals = []
  for (const row of jplRows) {
    const jd = jdFromDate(row.date)
    const oursDate  = solarPosition(jd)
    const oursJ2000 = precessToJ2000(oursDate.ra, oursDate.dec, jd)
    let dRa = oursJ2000.ra - row.ra
    if (dRa >  180) dRa -= 360
    if (dRa < -180) dRa += 360
    const dDec = oursJ2000.dec - row.dec
    const dDistAU = oursDate.distance - row.distanceAU
    residuals.push({
      date: row.date, jd,
      jpl: { ra: row.ra, dec: row.dec, distanceAU: row.distanceAU },
      ours: { ra: oursJ2000.ra, dec: oursJ2000.dec, distanceAU: oursDate.distance },
      dRaArcsec:  dRa * 3600,
      dDecArcsec: dDec * 3600,
      dDistanceAU: dDistAU,
      dDistancePct: (dDistAU / row.distanceAU) * 100,
    })
  }
  return residuals
}

function stats(values) {
  const n = values.length
  if (n === 0) return { n: 0, mean: 0, max: 0, rms: 0 }
  let sum = 0, sumSq = 0, max = 0
  for (const v of values) {
    sum += v; sumSq += v * v
    if (Math.abs(v) > Math.abs(max)) max = v
  }
  return { n, mean: sum / n, max, rms: Math.sqrt(sumSq / n) }
}

function writeReport(residuals) {
  const fmt = (n, d=2) => Number(n).toFixed(d)
  const fmtSigned = n => (n >= 0 ? '+' : '') + fmt(n, 2)

  const sRa  = stats(residuals.map(r => r.dRaArcsec))
  const sDec = stats(residuals.map(r => r.dDecArcsec))
  const sDistPct = stats(residuals.map(r => r.dDistancePct))

  let md = ''
  md += `# Solar position validation against JPL Horizons\n\n`
  md += `_Auto-generated by \`node scripts/validate-solar-against-jpl.js\`._\n\n`
  md += `**Sample:** ${residuals.length} daily geocentric astrometric positions for the Sun at 00:00 UT throughout April 2026, from NASA JPL Horizons (target 10, center 500@399, quantities 1 + 20).\n\n`
  md += `**Comparison:** \`solarPosition()\` from \`src/lunar.js\` (Meeus chapter 25 simplified series) at the same JD, precessed from mean equator of date to ICRF/J2000 (Meeus 21.3) before comparison so frame matches JPL.\n\n`

  md += `## Summary\n\n`
  md += `| Quantity | Mean | RMS | Max abs |\n`
  md += `|---|---:|---:|---:|\n`
  md += `| ΔRA  (arcsec) | ${fmtSigned(sRa.mean)} | ${fmt(sRa.rms)} | ${fmt(Math.abs(sRa.max))} |\n`
  md += `| ΔDec (arcsec) | ${fmtSigned(sDec.mean)} | ${fmt(sDec.rms)} | ${fmt(Math.abs(sDec.max))} |\n`
  md += `| Δdistance (%) | ${fmtSigned(sDistPct.mean, 4)}% | ${fmt(sDistPct.rms, 4)}% | ${fmt(Math.abs(sDistPct.max), 4)}% |\n\n`

  md += `## Interpretation\n\n`
  // Meeus chapter 25 simplified series is published with ~1' (60″) accuracy in
  // longitude for ±2000 years from J2000 — a deliberately compact alternative
  // to VSOP87. Distance accuracy is similar.
  const TARGET_RA  = 60            // arcsec — Meeus 25 simplified published claim
  const TARGET_DIST = 0.01         // %
  const ok = (v, t) => Math.abs(v) < t ? '✅ within target' : '⚠️ exceeds target'
  md += `The simplified Meeus chapter 25 solar series is published with ~1' (60″) longitude accuracy for modern dates. Targets here reflect that: ≤${TARGET_RA}″ in RA/Dec and ≤${TARGET_DIST}% in distance.\n\n`
  md += `Solar position is the second primitive (alongside lunar) feeding hilal classification — this validation closes the primitives-validation half of the hilal accuracy chain. For hilal specifically only RA/Dec matter (used to compute the geocentric elongation arc with the Moon); solar distance does not enter the calculation.\n\n`
  md += `- RA  max-abs: ${fmt(Math.abs(sRa.max))}″ — ${ok(sRa.max, TARGET_RA)}\n`
  md += `- Dec max-abs: ${fmt(Math.abs(sDec.max))}″ — ${ok(sDec.max, TARGET_RA)}\n`
  md += `- Distance max-abs: ${fmt(Math.abs(sDistPct.max), 4)}% — ${ok(sDistPct.max, TARGET_DIST)}\n\n`
  md += `Light-time correction (~8 min for the Sun at 1 AU ≈ 0.005° apparent shift) is applied by JPL's astrometric quantity but not by \`solarPosition()\`. Negligible at this scale.\n\n`

  md += `## Per-date residuals\n\n`
  md += `| Date (UTC) | ΔRA (″) | ΔDec (″) | Δdistance (%) |\n`
  md += `|---|---:|---:|---:|\n`
  for (const r of residuals) {
    md += `| ${r.date.toISOString().slice(0, 16).replace('T',' ')} | ${fmtSigned(r.dRaArcsec)} | ${fmtSigned(r.dDecArcsec)} | ${fmtSigned(r.dDistancePct, 4)}% |\n`
  }
  md += `\n## Source\n\n`
  md += `- JPL Horizons API: \`https://ssd.jpl.nasa.gov/api/horizons.api\`\n`
  md += `- Sun target id: 10 — geocentric reference frame: Earth body-fixed (500@399)\n`
  md += `- DE441 ephemeris is the NASA/JPL planetary ephemeris used by Horizons since 2020\n`
  md += `- \`solarPosition()\` implementation: Meeus, J. (1998) *Astronomical Algorithms* (2nd ed.) Chapter 25\n`

  writeFileSync(OUT_PATH, md)
  console.log(`→ wrote ${OUT_PATH}`)
}

async function main() {
  console.log('Fetching JPL Horizons solar ephemeris (April 2026)…')
  const t0 = Date.now()
  const jplRows = await fetchJplSolar()
  console.log(`  ${jplRows.length} daily entries fetched in ${(((Date.now()-t0)/1000).toFixed(1))} s`)
  const residuals = computeResiduals(jplRows)
  writeReport(residuals)
  const max = arr => arr.reduce((a,b) => Math.max(a, Math.abs(b)), 0)
  console.log(`Max abs ΔRA:  ${max(residuals.map(r => r.dRaArcsec)).toFixed(2)}″`)
  console.log(`Max abs ΔDec: ${max(residuals.map(r => r.dDecArcsec)).toFixed(2)}″`)
  console.log(`Max abs Δdistance: ${max(residuals.map(r => r.dDistancePct)).toFixed(4)}%`)
}

main().catch(err => {
  console.error('Validation failed:', err)
  process.exit(1)
})
