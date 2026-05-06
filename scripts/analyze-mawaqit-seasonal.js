// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Mawaqit seasonal Path A re-validation analyzer.
 *
 * Reads a yearly Mawaqit fixture (produced by `fetch-mawaqit-yearly.js`),
 * computes per-prayer per-month signed bias vs fajr's current calc, and
 * surfaces any seasonal drift that would warrant per-month / per-region
 * Path A re-tuning.
 *
 * Specifically addresses the 2026-05-05 audit-gap disclosure (fajr#99):
 * the v1.5.0 Morocco Maghrib +5 and v1.7.16 Morocco Dhuhr +5 calibrations
 * were tuned to a single date. This script verifies whether they hold
 * across all 12 months.
 *
 * READ-ONLY analysis — does not modify engine.js or eval/. The script's
 * output is a markdown summary; any Path A adjustment surfaced is
 * advisory and must go through the standard ratchet (eval+compare) to
 * actually ship.
 *
 * Usage:
 *   node scripts/analyze-mawaqit-seasonal.js \
 *     --fixture eval/data/test/mawaqit-morocco-yearly.json \
 *     [--out autoresearch/proposals/<name>.md]
 *
 * Classification: 🟢 Established — pure analysis pipeline; no shar'i
 * judgment.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { prayerTimes } from '../src/index.js'

const PRAYERS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']

const args = parseArgs(process.argv.slice(2))
const fixturePath = args.fixture || 'eval/data/test/mawaqit-morocco-yearly.json'
const outPath = args.out || null

main().catch(err => { console.error(err); process.exit(1) })

async function main() {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))
  const records = Array.isArray(fixture) ? fixture : (fixture.cities || [])
  console.log(`[analyze] loaded ${records.length} mosques from ${fixturePath}`)

  // Per-prayer, per-month accumulator
  // key: month (1-12), prayer → array of bias values
  const byMonth = {}
  const byCity = {}
  let totalRows = 0

  let droppedRows = 0
  for (const r of records) {
    if (r.latitude == null || r.longitude == null) continue
    if (!byCity[r.city]) byCity[r.city] = init()
    for (const d of (r.dates || [])) {
      totalRows++
      // Sanity-filter: drop rows where Mawaqit-published times are
      // structurally implausible (12h/24h format leaks, stale-year data, etc).
      // Some Mawaqit mosque pages have corrupt embedded calendar entries while
      // their daily live page is correct. Discovered 2026-05-05 audit; e.g.
      // Sidi Kacem Sept Dhuhr=01:28 (should be 13:28); Jan Maghrib=20:00 (should be ~17:30).
      const fH = parseHM(d.fajr), shH = parseHM(d.sunrise), dhH = parseHM(d.dhuhr)
      const aH = parseHM(d.asr), mH = parseHM(d.maghrib), iH = parseHM(d.isha)
      const ok =
        fH != null && shH != null && dhH != null && aH != null && mH != null && iH != null &&
        fH < shH && shH < dhH && dhH < aH && aH < mH && mH < iH &&  // monotonic
        dhH > 9 && dhH < 16 &&                                       // Dhuhr in [09:00, 16:00] — solar noon range
        mH > 14 && mH < 23                                            // Maghrib in [14:00, 23:00] — covers high-lat winter to summer
      if (!ok) { droppedRows++; continue }

      const dt = new Date(d.date + 'T12:00:00Z')
      const month = Number(d.date.slice(5, 7))
      if (!byMonth[month]) byMonth[month] = init()

      // fajr's calc with city-registry path (auto-elevation if registry has it)
      const calc = prayerTimes({ latitude: r.latitude, longitude: r.longitude, date: dt })

      for (const p of PRAYERS) {
        if (d[p] == null) continue
        const calcLocal = calc[p].toLocaleString('en-GB', {
          timeZone: r.timezone || 'UTC', hour: '2-digit', minute: '2-digit', hour12: false,
        })
        const [hC, mC] = calcLocal.split(':').map(Number)
        const [hG, mG] = d[p].split(':').map(Number)
        const diff = (hC * 60 + mC) - (hG * 60 + mG)
        byMonth[month][p].push(diff)
        byCity[r.city][p].push(diff)
      }
    }
  }
  console.log(`[analyze] dropped ${droppedRows} rows as structurally implausible (corrupt mosque calendar entries)`)

  console.log(`[analyze] total rows: ${totalRows}`)

  // Render the report
  const lines = []
  lines.push(`# Mawaqit seasonal Path A re-validation — auto-generated\n`)
  lines.push(`Fixture: \`${fixturePath}\``)
  lines.push(`Records: ${records.length} mosques, ${totalRows} day-rows`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('')
  lines.push(`## Per-month signed bias (calc − Mawaqit, minutes)\n`)
  lines.push(`Bias positive = fajr's calc is LATER than mosque-published.`)
  lines.push(`A flat bias across months means the calibration is seasonally robust.`)
  lines.push(`Variance across months means the +N Path A constant is wrong for some season.\n`)
  lines.push('| Month | n | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |')
  lines.push('|---|---|---|---|---|---|---|---|')
  for (let m = 1; m <= 12; m++) {
    if (!byMonth[m]) continue
    const row = [`${String(m).padStart(2, '0')}`, byMonth[m].fajr.length]
    for (const p of PRAYERS) row.push(byMonth[m][p].length ? mean(byMonth[m][p]).toFixed(2) : '—')
    lines.push('| ' + row.join(' | ') + ' |')
  }

  // Per-prayer seasonal range (max - min across months)
  lines.push('')
  lines.push(`## Per-prayer seasonal variance (max month bias − min month bias)\n`)
  lines.push(`Larger range = more seasonal drift.`)
  lines.push('| Prayer | Min bias (month) | Max bias (month) | Range |')
  lines.push('|---|---|---|---|')
  for (const p of PRAYERS) {
    const monthMeans = []
    for (let m = 1; m <= 12; m++) {
      if (byMonth[m]?.[p]?.length) monthMeans.push({ m, mean: mean(byMonth[m][p]) })
    }
    if (!monthMeans.length) continue
    monthMeans.sort((a, b) => a.mean - b.mean)
    const lo = monthMeans[0]
    const hi = monthMeans[monthMeans.length - 1]
    const range = hi.mean - lo.mean
    lines.push(`| ${p} | ${lo.mean.toFixed(2)} (m=${lo.m}) | ${hi.mean.toFixed(2)} (m=${hi.m}) | ${range.toFixed(2)} |`)
  }

  // Per-city aggregate (top 10 by Maghrib |bias|)
  lines.push('')
  lines.push(`## Per-city Maghrib mean bias (top 15 by abs)\n`)
  const cityList = Object.entries(byCity).map(([c, p]) => ({
    city: c,
    n: p.maghrib.length,
    mag: p.maghrib.length ? mean(p.maghrib) : null,
  })).filter(x => x.mag != null)
  cityList.sort((a, b) => Math.abs(b.mag) - Math.abs(a.mag))
  lines.push('| City | n | Maghrib bias |')
  lines.push('|---|---|---|')
  for (const c of cityList.slice(0, 15)) {
    lines.push(`| ${c.city} | ${c.n} | ${c.mag.toFixed(2)} |`)
  }

  // Aggregate
  const allBias = {}
  for (const p of PRAYERS) {
    allBias[p] = []
    for (const m of Object.values(byMonth)) allBias[p].push(...m[p])
  }
  lines.push('')
  lines.push(`## Aggregate per-prayer bias (full year)\n`)
  lines.push('| Prayer | n | Mean bias | MAE |')
  lines.push('|---|---|---|---|')
  for (const p of PRAYERS) {
    if (!allBias[p].length) continue
    lines.push(`| ${p} | ${allBias[p].length} | ${mean(allBias[p]).toFixed(2)} | ${mae(allBias[p]).toFixed(2)} |`)
  }

  const report = lines.join('\n')
  if (outPath) {
    writeFileSync(outPath, report)
    console.log(`[analyze] wrote report to ${outPath}`)
  } else {
    console.log('\n' + report)
  }
}

function init() {
  const o = {}
  for (const p of PRAYERS) o[p] = []
  return o
}

function parseHM(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1]), mn = Number(m[2])
  if (h < 0 || h > 23 || mn < 0 || mn > 59) return null
  return h + mn / 60
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length }
function mae(arr) { return arr.reduce((a, b) => a + Math.abs(b), 0) / arr.length }

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const k = a.slice(2)
      const v = argv[i + 1]?.startsWith('--') ? true : argv[++i]
      out[k] = v ?? true
    }
  }
  return out
}
