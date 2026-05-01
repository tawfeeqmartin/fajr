// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Validate src/lunar.js (Meeus truncated Brown's lunar theory) against
 * NASA JPL Horizons astrometric ephemeris.
 *
 * Why: src/hilal.js uses lunar.js to compute ARCV / W / lag for the Odeh,
 * Yallop, and Shaukat criteria. The truncated theory's accuracy is
 * theoretically ≤ 0.05° in RA/Dec but the actual achieved accuracy on a
 * sample of dates wasn't quantified. This script does that one check.
 *
 * Method:
 *   1. Fetch JPL Horizons OBSERVER ephemeris for the Moon (target=301)
 *      with CENTER=500@399 (Earth geocenter), QUANTITIES=1+20 (astrometric
 *      RA/Dec + range), one entry per day at 12:00 UT for April 2026.
 *   2. For each JPL row, compute lunar.js position at the same JD.
 *   3. Compute residuals: ΔRA, ΔDec (arcsec) and Δdistance (km, %).
 *   4. Report max / mean / RMS in a markdown file.
 *
 * Run-once. Re-run only if lunar.js changes.
 *
 * Usage: node scripts/validate-lunar-against-jpl.js
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { lunarPosition, jdFromDate } from '../src/lunar.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '..', 'docs', 'lunar-jpl-validation.md')

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─────────────────────────────────────────────────────────────────────────────
// Fetch + parse JPL Horizons response
// ─────────────────────────────────────────────────────────────────────────────

const AU_KM = 149597870.7

async function fetchJplLunar() {
  // Correct API host is ssd.jpl.nasa.gov/api (not ssd-api.jpl.nasa.gov, which
  // is referenced in some docs but currently 404s).
  const url = new URL('https://ssd.jpl.nasa.gov/api/horizons.api')
  const params = {
    format:      'json',
    MAKE_EPHEM:  'YES',
    COMMAND:     "'301'",                       // Moon
    EPHEM_TYPE:  'OBSERVER',
    CENTER:      "'500@399'",                   // Geocenter, Earth body-fixed
    START_TIME:  "'2026-04-01'",
    STOP_TIME:   "'2026-04-30'",
    STEP_SIZE:   "'1 d'",
    QUANTITIES:  "'1,20'",                      // astrometric RA/DEC + range
    ANG_FORMAT:  'HMS',
    CSV_FORMAT:  'NO',
  }
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} from JPL Horizons`)
  const json = await res.json()
  if (!json.result) throw new Error('JPL response missing `result` field: ' + JSON.stringify(json).slice(0, 400))
  return parseEphemeris(json.result)
}

function parseEphemeris(text) {
  const startIdx = text.indexOf('$$SOE')
  const endIdx   = text.indexOf('$$EOE')
  if (startIdx < 0 || endIdx < 0) {
    throw new Error('JPL response missing $$SOE / $$EOE markers — check response format.\n\n' + text.slice(0, 1500))
  }
  const block = text.slice(startIdx + 5, endIdx).trim()
  const rows = []

  // Each row looks like:
  //   2026-Apr-01 00:00     11 50 15.68 -00 51 35.3  0.00260615559174   0.0395579
  //   ↑date       ↑time     ↑RA hms     ↑Dec ±d m s ↑range_AU         ↑range-rate kmps
  // The dec sign is attached to the degree number (no space).
  const rowRegex = /^\s*(\d{4})-(\w{3})-(\d{2})\s+(\d{2}):(\d{2})\s+(\d{2})\s+(\d{2})\s+([\d.]+)\s+([+\-])(\d{2})\s+(\d{2})\s+([\d.]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/

  for (const line of block.split('\n')) {
    const m = line.match(rowRegex)
    if (!m) continue
    const [, yyyy, monStr, dd, hh, mm,
           raH, raM, raS,
           decSignStr, decD, decM, decS,
           rangeAU /*, rangeRate*/] = m

    const monthIdx = MONTHS.indexOf(monStr)
    if (monthIdx < 0) continue
    const date = new Date(Date.UTC(+yyyy, monthIdx, +dd, +hh, +mm))

    const ra = (parseInt(raH) + parseInt(raM)/60 + parseFloat(raS)/3600) * 15  // hours → degrees
    const decSign = decSignStr === '-' ? -1 : 1
    const dec = decSign * (parseInt(decD) + parseInt(decM)/60 + parseFloat(decS)/3600)

    rows.push({ date, ra, dec, distanceKm: parseFloat(rangeAU) * AU_KM })
  }
  return rows
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare + report
// ─────────────────────────────────────────────────────────────────────────────

// Precession from mean equator of date back to ICRF/J2000 (Meeus 21.3).
// lunar.js outputs in mean-of-date; JPL Horizons reports in ICRF. To compare
// raw RA/Dec we must rotate one frame to the other.
function precessToJ2000(raDeg, decDeg, jd) {
  const T = (jd - 2451545.0) / 36525
  const arcSecToRad = Math.PI / (180 * 3600)
  const zeta  = (2306.2181 * T + 0.30188 * T*T + 0.017998 * T*T*T) * arcSecToRad
  const z     = (2306.2181 * T + 1.09468 * T*T + 0.018203 * T*T*T) * arcSecToRad
  const theta = (2004.3109 * T - 0.42665 * T*T - 0.041833 * T*T*T) * arcSecToRad

  const ra  = raDeg  * Math.PI / 180
  const dec = decDeg * Math.PI / 180

  // Direction cosines in mean-of-date.
  const x = Math.cos(dec) * Math.cos(ra)
  const y = Math.cos(dec) * Math.sin(ra)
  const z3 = Math.sin(dec)

  // Inverse precession matrix R^T(zeta, z, theta) takes mean-of-date → J2000.
  // (Meeus 21.4 forward = J2000 → date; we apply the transpose.)
  const cZ = Math.cos(zeta),  sZ = Math.sin(zeta)
  const cZ2 = Math.cos(z),     sZ2 = Math.sin(z)
  const cT = Math.cos(theta), sT = Math.sin(theta)

  // Forward rotation matrix elements (J2000 → date), Meeus 21.4:
  //   xd = (cZ·cT·cZ2 - sZ·sZ2) x0 - (cZ·cT·sZ2 + sZ·cZ2) y0 - cZ·sT z0
  //   yd = (sZ·cT·cZ2 + cZ·sZ2) x0 - (sZ·cT·sZ2 - cZ·cZ2) y0 - sZ·sT z0
  //   zd = sT·cZ2  x0           - sT·sZ2 y0           + cT z0
  // We have (xd, yd, zd) = mean-of-date and want (x0, y0, z0) = J2000.
  // Inverse = transpose of an orthogonal rotation.
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
  const decJ = Math.asin(z0) * 180 / Math.PI
  return { ra: raJ, dec: decJ }
}

function computeResiduals(jplRows) {
  const residuals = []
  for (const row of jplRows) {
    const jd = jdFromDate(row.date)
    const oursDate = lunarPosition(jd)
    const oursJ2000 = precessToJ2000(oursDate.ra, oursDate.dec, jd)

    let dRa = oursJ2000.ra - row.ra
    if (dRa >  180) dRa -= 360
    if (dRa < -180) dRa += 360
    const dDec = oursJ2000.dec - row.dec
    const dDist = oursDate.distance - row.distanceKm
    residuals.push({
      date: row.date,
      jd,
      jpl: { ra: row.ra, dec: row.dec, distanceKm: row.distanceKm },
      ours: { ra: oursJ2000.ra, dec: oursJ2000.dec, distanceKm: oursDate.distance },
      dRaArcsec:  dRa  * 3600,
      dDecArcsec: dDec * 3600,
      dDistanceKm: dDist,
      dDistancePct: (dDist / row.distanceKm) * 100,
    })
  }
  return residuals
}

function stats(values) {
  const n = values.length
  if (n === 0) return { n: 0, mean: 0, max: 0, rms: 0 }
  let sum = 0, sumSq = 0, max = 0
  for (const v of values) {
    sum   += v
    sumSq += v * v
    if (Math.abs(v) > Math.abs(max)) max = v
  }
  return { n, mean: sum / n, max, rms: Math.sqrt(sumSq / n) }
}

function writeReport(residuals) {
  const dRa  = residuals.map(r => r.dRaArcsec)
  const dDec = residuals.map(r => r.dDecArcsec)
  const dDistKm  = residuals.map(r => r.dDistanceKm)
  const dDistPct = residuals.map(r => r.dDistancePct)

  const sRa  = stats(dRa)
  const sDec = stats(dDec)
  const sDistKm  = stats(dDistKm)
  const sDistPct = stats(dDistPct)

  const fmt = (n, d=2) => Number(n).toFixed(d)
  const fmtSigned = n => (n >= 0 ? '+' : '') + fmt(n, 2)

  let md = ''
  md += `# Lunar position validation against JPL Horizons\n\n`
  md += `_Auto-generated by \`node scripts/validate-lunar-against-jpl.js\`._\n\n`
  md += `**Sample:** ${residuals.length} daily geocentric astrometric positions for the Moon at 00:00 UT throughout April 2026, from NASA JPL Horizons (target 301, center 500@399, quantities 1 + 20).\n\n`
  md += `**Comparison:** \`src/lunar.js\` geocentric output (Meeus chapter 47 truncated Brown's lunar theory: 14 longitude/distance terms, 10 latitude terms) at the same JD, precessed from mean equator of date to ICRF/J2000 (Meeus 21.3) before comparison so frame matches JPL.\n\n`

  md += `## Summary\n\n`
  md += `| Quantity | Mean | RMS | Max abs |\n`
  md += `|---|---:|---:|---:|\n`
  md += `| ΔRA  (arcsec) | ${fmtSigned(sRa.mean)} | ${fmt(sRa.rms)} | ${fmt(Math.abs(sRa.max))} |\n`
  md += `| ΔDec (arcsec) | ${fmtSigned(sDec.mean)} | ${fmt(sDec.rms)} | ${fmt(Math.abs(sDec.max))} |\n`
  md += `| Δdistance (km) | ${fmtSigned(sDistKm.mean)} | ${fmt(sDistKm.rms)} | ${fmt(Math.abs(sDistKm.max))} |\n`
  md += `| Δdistance (%)  | ${fmtSigned(sDistPct.mean, 4)}% | ${fmt(sDistPct.rms, 4)}% | ${fmt(Math.abs(sDistPct.max), 4)}% |\n\n`

  md += `## Interpretation\n\n`
  const targetRa = 0.05 * 3600   // 0.05° in arcsec
  const targetDist = 0.5         // 0.5%
  const meetsRa  = Math.abs(sRa.max)  < targetRa
  const meetsDec = Math.abs(sDec.max) < targetRa
  const meetsDist = Math.abs(sDistPct.max) < targetDist
  md += `\`src/lunar.js\` targets ≤ 0.05° (= ${targetRa}″) in RA/Dec and ≤ ${targetDist}% in distance for the dates above to be sufficient for crescent-visibility classification (where the dominant uncertainty is atmospheric extinction at the ~1° level).\n\n`
  md += `- RA  max-abs: ${fmt(Math.abs(sRa.max))}″ — ${meetsRa  ? '✅ within target' : '⚠️ exceeds target'}\n`
  md += `- Dec max-abs: ${fmt(Math.abs(sDec.max))}″ — ${meetsDec ? '✅ within target' : '⚠️ exceeds target'}\n`
  md += `- Distance max-abs: ${fmt(Math.abs(sDistPct.max), 4)}% — ${meetsDist ? '✅ within target' : '⚠️ exceeds target'}\n\n`

  md += `The light-time correction (~1.3 s for the Moon, displacing apparent position by ~0.7″) is included in JPL's astrometric quantity but not in lunar.js output. That contributes a constant ~0.7″ floor to the RA residuals and is part of the reported numbers.\n\n`

  md += `## Per-date residuals\n\n`
  md += `| Date (UTC) | ΔRA (″) | ΔDec (″) | Δdistance (km) | Δdistance (%) |\n`
  md += `|---|---:|---:|---:|---:|\n`
  for (const r of residuals) {
    md += `| ${r.date.toISOString().slice(0, 16).replace('T',' ')} | ${fmtSigned(r.dRaArcsec)} | ${fmtSigned(r.dDecArcsec)} | ${fmtSigned(r.dDistanceKm, 1)} | ${fmtSigned(r.dDistancePct, 4)}% |\n`
  }
  md += `\n## Source\n\n`
  md += `- JPL Horizons API: \`https://ssd-api.jpl.nasa.gov/horizons.api\`\n`
  md += `- Moon target id: 301 — geocentric reference frame: Earth body-fixed (500@399)\n`
  md += `- DE441 ephemeris is the NASA/JPL planetary/lunar ephemeris used by Horizons since 2020\n`
  md += `- \`src/lunar.js\` implementation: Meeus, J. (1998) *Astronomical Algorithms* (2nd ed.) Chapter 47\n`

  writeFileSync(OUT_PATH, md)
  console.log(`→ wrote ${OUT_PATH}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching JPL Horizons lunar ephemeris (April 2026)…')
  const t0 = Date.now()
  const jplRows = await fetchJplLunar()
  console.log(`  ${jplRows.length} daily entries fetched in ${(((Date.now()-t0)/1000).toFixed(1))} s`)

  const residuals = computeResiduals(jplRows)
  writeReport(residuals)

  // Also print summary to stdout for the run log.
  const dRa  = residuals.map(r => Math.abs(r.dRaArcsec))
  const dDec = residuals.map(r => Math.abs(r.dDecArcsec))
  const dDistPct = residuals.map(r => Math.abs(r.dDistancePct))
  const max = arr => arr.reduce((a,b) => Math.max(a,b), 0)
  console.log(`Max abs ΔRA:  ${max(dRa).toFixed(1)}″`)
  console.log(`Max abs ΔDec: ${max(dDec).toFixed(1)}″`)
  console.log(`Max abs Δdistance: ${max(dDistPct).toFixed(4)}%`)
}

main().catch(err => {
  console.error('Validation failed:', err)
  process.exit(1)
})
