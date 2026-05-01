// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Validate the Odeh-criterion hilal visibility implementation against
 * published historical month-onset decisions from official Islamic
 * authorities.
 *
 * For each test case, we compute fajr.hilalVisibility for the canonical
 * sighting evening (day 29 of the prior Hijri month) at the relevant
 * national observatory location, and report:
 *   - V value (Odeh's parameter)
 *   - Classification (A / B / C / D)
 *   - ARCV, W, lag time, moon age
 *   - Whether the prediction is consistent with the documented decision
 *
 * Usage: node scripts/validate-hilal.js
 */

import { hilalVisibility } from '../src/hilal.js'

// Each case: known Hijri (year, month) start, observer location, the
// astronomically-defensible expectation (based on moon age, lag, Danjon
// limit), and the documented committee decision. The two can differ —
// some committees accept witness testimony for astronomically-impossible
// crescents; fajr aims for the astronomically defensible answer.
const CASES = [
  {
    label:    'Ramadan 1444 (Saudi Arabia, Riyadh)',
    year: 1444, month: 9,
    latitude: 24.7136, longitude: 46.6753,
    astronomicallyExpected: true,
    committeeDecision:      true,
    note: "Saudi: sighting confirmed 22 March 2023; Ramadan 1444 began 23 March. Moon age ~22 h at best time; well above Danjon limit (~18 h). Easy case.",
  },
  {
    label:    'Shawwal 1444 (Saudi Arabia, Riyadh)',
    year: 1444, month: 10,
    latitude: 24.7136, longitude: 46.6753,
    astronomicallyExpected: false,
    committeeDecision:      false,
    note: "No sighting on 20 April 2023; Ramadan 1444 completed to 30 days; Eid al-Fitr was 21 April. Moon age ~11 h, below Danjon. Easy case.",
  },
  {
    label:    'Ramadan 1445 (UAE, Dubai) — controversial',
    year: 1445, month: 9,
    latitude: 25.2048, longitude: 55.2708,
    astronomicallyExpected: false,
    committeeDecision:      true,
    note: "UAE accepted witness testimony on 10 March 2024 with moon age only ~5.5 h — well below Danjon (~18 h). Pakistan, Morocco, Iran, India rejected and started Ramadan on 12 March based on astronomical impossibility. fajr (astronomically rigorous) should report NOT visible.",
  },
  {
    label:    'Ramadan 1446 (Egypt, Cairo) — borderline',
    year: 1446, month: 9,
    latitude: 30.0444, longitude: 31.2357,
    astronomicallyExpected: false,
    committeeDecision:      true,
    note: "Egypt Dar al-Iftaa announced sighting 28 February 2025. Moon age ~15 h, below Danjon. Many astronomers disputed. fajr should report borderline (Odeh class C — optical aid only).",
  },
  {
    label:    'Shawwal 1446 (Morocco, Rabat)',
    year: 1446, month: 10,
    latitude: 34.0209, longitude: -6.8416,
    astronomicallyExpected: false,
    committeeDecision:      false,
    note: "Morocco announced no sighting on 29 March 2025; Eid al-Fitr was 31 March. Moon age ~8 h, well below Danjon. Easy case.",
  },
]

function pad(s, n) {
  return String(s).padEnd(n)
}

function fmt(n, digits = 2) {
  if (n === null || Number.isNaN(n)) return '   —   '
  return Number(n).toFixed(digits)
}

function main() {
  console.log()
  console.log('Hilal visibility validation — Odeh (2004)')
  console.log('==========================================')
  console.log()

  let astroPass = 0, astroFail = 0
  let committeeAgree = 0, committeeDisagree = 0

  for (const c of CASES) {
    console.log(`▸ ${c.label}`)
    console.log(`  Hijri ${c.year}-${c.month}, observer ${c.latitude.toFixed(2)}°, ${c.longitude.toFixed(2)}°`)
    console.log(`  ${c.note}`)

    let result
    try {
      result = hilalVisibility(c)
    } catch (err) {
      console.log(`  ERROR: ${err.message}\n`)
      continue
    }

    console.log(`    Odeh    ${result.code} (V = ${fmt(result.V, 2)}) — ${result.label}`)
    console.log(`    Yallop  ${result.yallop.code} (q = ${fmt(result.yallop.q, 4)}) — ${result.yallop.label}`)
    console.log(`    Shaukat ${result.shaukat.code} (elong=${fmt(result.shaukat.elongationDeg, 1)}°, alt=${fmt(result.shaukat.moonAltAtSunsetDeg, 1)}°, lag=${fmt(result.shaukat.lagMinutes, 0)}m, age=${fmt(result.shaukat.moonAgeHours, 1)}h) — ${result.shaukat.label}`)
    if (!result.criteriaAgree) {
      console.log(`    ◆ criteria disagree — this is a borderline / ikhtilaf case`)
    }
    console.log(`    ARCV = ${fmt(result.arcvDeg, 2)}°, W = ${fmt(result.widthArcmin, 2)}'`)
    console.log(`    sunset / moonset / best time (UTC): ${result.sunsetUTC?.slice(11,16) ?? '—'} / ${result.moonsetUTC?.slice(11,16) ?? '—'} / ${result.bestTimeUTC?.slice(11,16) ?? '—'}`)
    console.log(`    conjunction (UTC): ${result.conjunctionUTC ?? '—'}`)

    if (result.visible === c.astronomicallyExpected) {
      console.log(`    ✓ Odeh astronomically defensible (matches expected ${c.astronomicallyExpected ? 'visible' : 'not visible'})`)
      astroPass++
    } else {
      console.log(`    ✗ Odeh ASTRONOMICALLY INCONSISTENT — predicted ${result.visible ? 'visible' : 'not visible'}, expected ${c.astronomicallyExpected ? 'visible' : 'not visible'}`)
      astroFail++
    }
    if (result.visible === c.committeeDecision) {
      committeeAgree++
    } else {
      committeeDisagree++
      console.log(`    ◇ Odeh disagrees with committee decision (committee said ${c.committeeDecision ? 'visible' : 'not visible'}; expected for controversial / astronomically-impossible sightings)`)
    }
    console.log()
  }

  console.log('---------------------------------------------------')
  console.log(`Astronomical accuracy:  ${astroPass}/${astroPass + astroFail}  (does fajr give the astronomically defensible answer?)`)
  console.log(`Committee agreement:    ${committeeAgree}/${committeeAgree + committeeDisagree}  (does fajr happen to match the announced decision?)`)
  console.log()
  console.log('Astronomical accuracy is the contract fajr aims for. Committee')
  console.log('decisions can accept astronomically-impossible witness testimony')
  console.log('— a legitimate scholarly position, but one this library does not')
  console.log('attempt to predict. fajr is wasail (means); the decision to begin')
  console.log('a Hijri month is ibadat (worship) and rests with Islamic authorities.')
}

main()
