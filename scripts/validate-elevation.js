// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Experiment 7: Elevation correction validation against USNO API.
 *
 * Fetches sunrise/sunset from USNO at actual elevation AND at sea level for
 * the same coordinates. Compares the observed USNO difference against our
 * geometric horizon dip formula.
 *
 * Hypothesis: at elevation h, observed sunrise is earlier and sunset is later
 * than at sea level by ≈ arccos(R/(R+h)) × 4/cos(φ) minutes.
 *
 * Usage: node scripts/validate-elevation.js
 */

const EARTH_RADIUS_M = 6_371_000

const CITIES = [
  { name: 'La Paz',        lat: -16.5,  lon: -68.15, tz: -4, h: 3640 },
  { name: 'Denver',        lat:  39.74, lon: -104.99, tz: -6, h: 1609 },
  { name: 'Bogota',        lat:   4.71, lon:  -74.07, tz: -5, h: 2640 },
  { name: 'Burj Khalifa',  lat:  25.20, lon:   55.27, tz:  4, h:  828 },
]

const DATES = ['2026-04-01', '2026-04-02', '2026-04-03']

function predictedCorrectionMin(h, latDeg) {
  const dipDeg = Math.acos(EARTH_RADIUS_M / (EARTH_RADIUS_M + h)) * (180 / Math.PI)
  return dipDeg * 4 / Math.cos(latDeg * Math.PI / 180)
}

function toMinutes(hhMM) {
  if (!hhMM) return null
  const [h, m] = hhMM.split(':').map(Number)
  return h * 60 + m
}

async function fetchSunData(lat, lon, tz, height, date) {
  const url = `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${lat},${lon}&tz=${tz}&height=${height}`
  const r = await fetch(url)
  const j = await r.json()
  const sun = j.properties.data.sundata
  const get = phen => sun.find(x => x.phen === phen)?.time
  return { rise: get('Rise'), set: get('Set') }
}

async function main() {
  console.log('\nExperiment 7: Elevation correction validation vs USNO')
  console.log('=====================================================')
  console.log('Formula: correction = arccos(R/(R+h)) × 4/cos(φ) minutes')
  console.log('Prediction: rise is EARLIER by correction, set is LATER by correction\n')

  console.log(
    'City'.padEnd(14),
    'h(m)'.padStart(6),
    'Pred(min)'.padStart(10),
    'USNO Δrise(min)'.padStart(16),
    'USNO Δset(min)'.padStart(15),
    'Match?'.padStart(8),
  )
  console.log('-'.repeat(72))

  const allDeltas = []

  for (const city of CITIES) {
    const pred = predictedCorrectionMin(city.h, city.lat)
    const deltaRises = []
    const deltaSets  = []

    for (const date of DATES) {
      const [elev, sl] = await Promise.all([
        fetchSunData(city.lat, city.lon, city.tz, city.h, date),
        fetchSunData(city.lat, city.lon, city.tz, 0,       date),
      ])

      const riseEl = toMinutes(elev.rise)
      const riseSl = toMinutes(sl.rise)
      const setEl  = toMinutes(elev.set)
      const setSl  = toMinutes(sl.set)

      if (riseEl !== null && riseSl !== null) deltaRises.push(riseSl - riseEl) // positive = rise earlier at elevation
      if (setEl  !== null && setSl  !== null) deltaSets.push(setEl  - setSl)   // positive = set later at elevation
    }

    const avgRise = deltaRises.length ? deltaRises.reduce((a,b)=>a+b,0)/deltaRises.length : null
    const avgSet  = deltaSets.length  ? deltaSets.reduce((a,b)=>a+b,0)/deltaSets.length   : null

    const riseStr = avgRise !== null ? avgRise.toFixed(1) : 'N/A'
    const setStr  = avgSet  !== null ? avgSet.toFixed(1)  : 'N/A'

    // "Match" if USNO observed difference is within 1 min of our prediction
    const riseClose = avgRise !== null && Math.abs(avgRise - pred) < 1.0
    const setClose  = avgSet  !== null && Math.abs(avgSet  - pred) < 1.0
    const match = riseClose && setClose ? '✓' : avgRise === 0 && avgSet === 0 ? 'NO (0 diff)' : '~'

    console.log(
      city.name.padEnd(14),
      String(city.h).padStart(6),
      pred.toFixed(2).padStart(10),
      riseStr.padStart(16),
      setStr.padStart(15),
      match.padStart(8),
    )

    allDeltas.push({ city: city.name, h: city.h, predicted: pred, obsRise: avgRise, obsSet: avgSet })
  }

  console.log()
  console.log('FINDING:')
  const allZero = allDeltas.every(d => d.obsRise === 0 && d.obsSet === 0)
  if (allZero) {
    console.log('  USNO returns IDENTICAL times at all elevations (Δrise = 0, Δset = 0 for all cities).')
    console.log('  The USNO API does NOT apply geometric horizon dip correction.')
    console.log('  Standard astronomical rise/set is defined relative to the sea-level horizon,')
    console.log('  regardless of observer elevation.')
    console.log()
    console.log('  Our geometric formula predicts:')
    for (const d of allDeltas) {
      console.log(`    ${d.city.padEnd(14)} h=${d.h}m  predicted correction = ${d.predicted.toFixed(2)} min`)
    }
    console.log()
    console.log('  CONCLUSION: Elevation correction cannot be validated against USNO.')
    console.log('  Both USNO and Aladhan use sea-level definitions.')
    console.log('  Geometric correction is physically correct for the elevated observer,')
    console.log('  but is not a standard practice in Islamic prayer time calculation.')
    console.log('  Classification remains: 🟡 Limited precedent.')
    console.log('  Elevation correction stays DISABLED in engine.js.')
  } else {
    console.log('  USNO shows non-zero elevation effect — formula can be validated.')
  }
  console.log()
}

main().catch(console.error)
