// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * scripts/validate-city-registry.js — systematic validation of the
 * src/data/cities.json registry + the detectCountry bbox table in
 * src/engine.js.
 *
 * v1.7.5 — added in response to issue #47 (agiftoftime-agent surfaced four
 * false positives during a 52-coord sample worldwide; user asked for full
 * registry validation rather than whack-a-mole patching).
 *
 * The script enforces five invariants across every row in the registry:
 *
 *   1. bbox-internal:    For each city, sample N points uniformly inside the
 *                        declared bbox. Each MUST resolve via detectLocation
 *                        to that city's name AND its claimed country.
 *
 *   2. bbox-leak:        For each city, sample N points just OUTSIDE the
 *                        declared bbox (1 km buffer). None may resolve to
 *                        that city.
 *
 *   3. country-claim:    For each city, detectCountry(centerLat, centerLon)
 *                        must match the city's claimed countryISO (mapped to
 *                        the engine's country-key vocabulary).
 *
 *   4. cross-border:     For each city, every internal sample point must
 *                        resolve to the SAME country as the city's claimed
 *                        country. A bbox extending across an international
 *                        border is a fail.
 *
 *   5. bbox-overlap:     Pairs of cities whose bboxes intersect are flagged
 *                        as WARN (not fail) — some overlaps are intentional
 *                        (metro + satellite city, where the smaller-bbox sort
 *                        order disambiguates correctly). The list is for
 *                        human review.
 *
 * Run via: `node scripts/validate-city-registry.js`
 *
 * Exits 0 if no FAIL-class issues; exits 1 otherwise. Used by CI to gate
 * releases. Also runnable locally; the smoke-test in
 * test/cityRegistryValidation.test.js asserts zero FAILs as part of `npm
 * test`.
 *
 * Determinism: a seeded PRNG drives all sampling so reruns produce identical
 * issue lists. Seed is fixed at SEED below.
 */

import { detectLocation } from '../src/engine.js'
import cityModule from '../src/data/cities.json' with { type: 'json' }

// detectCountry is not exported by src/engine.js. Re-export via a lightweight
// local probe: detectLocation always calls detectCountry internally and
// surfaces the result on `loc.country`. We use that as the canonical
// detectCountry value for cross-check purposes (this is exactly what apps
// will see — there is no separate "true" detectCountry that bypasses
// detectLocation).
function detectCountryViaLocation(lat, lon) {
  return detectLocation(lat, lon).country
}

// ─────────────────────────────────────────────────────────────────────────────
// ISO-2 → engine country key (the string detectCountry returns).
// Mirrors scripts/build-city-registry.js ISO_TO_ENGINE_COUNTRY plus a few
// extras that may appear in cities.json but not in the build script's table
// (we route every observed countryISO so the cross-check is honest).
// ─────────────────────────────────────────────────────────────────────────────

const ISO_TO_ENGINE_COUNTRY = {
  MA: 'Morocco', TN: 'Tunisia', DZ: 'Algeria', LY: 'Libya',
  BH: 'Bahrain', QA: 'Qatar', KW: 'Kuwait', AE: 'UAE', OM: 'Oman', YE: 'Yemen',
  PS: 'Palestine', IL: 'Israel', LB: 'Lebanon', JO: 'Jordan', SY: 'Syria', IQ: 'Iraq',
  GE: 'Georgia', AZ: 'Azerbaijan', AM: 'Armenia', IR: 'Iran',
  TJ: 'Tajikistan', TM: 'Turkmenistan', KG: 'Kyrgyzstan',
  UZ: 'Uzbekistan', KZ: 'Kazakhstan', SA: 'SaudiArabia', TR: 'Turkey',
  XK: 'Kosovo', AL: 'Albania', ME: 'Montenegro', MK: 'NorthMacedonia',
  BA: 'Bosnia', RS: 'Serbia', SI: 'Slovenia', HR: 'Croatia',
  BG: 'Bulgaria', GR: 'Greece', RO: 'Romania', MD: 'Moldova',
  UA: 'Ukraine', BY: 'Belarus', SK: 'Slovakia', HU: 'Hungary',
  CZ: 'Czechia', PL: 'Poland', LT: 'Lithuania', LV: 'Latvia',
  EE: 'Estonia', AT: 'Austria', CH: 'Switzerland', DE: 'Germany',
  BE: 'Belgium', NL: 'Netherlands', DK: 'Denmark', SE: 'Sweden',
  EG: 'Egypt', DJ: 'Djibouti', ER: 'Eritrea', SO: 'Somalia',
  SS: 'SouthSudan', ET: 'Ethiopia', SD: 'Sudan',
  CV: 'CapeVerde', GM: 'Gambia', GW: 'GuineaBissau', SN: 'Senegal',
  MR: 'Mauritania', SL: 'SierraLeone', LR: 'Liberia', GN: 'Guinea',
  CI: 'CoteDIvoire', TG: 'Togo', GH: 'Ghana', BJ: 'Benin',
  BF: 'BurkinaFaso', ML: 'Mali', NE: 'Niger', NG: 'Nigeria',
  TD: 'Chad', CM: 'Cameroon',
  ST: 'SaoTomeAndPrincipe', GQ: 'EquatorialGuinea', GA: 'Gabon',
  CG: 'RepublicOfTheCongo', CF: 'CentralAfricanRepublic', CD: 'DRCongo',
  GB: 'UK', BN: 'Brunei', SG: 'Singapore', MY: 'Malaysia',
  KH: 'Cambodia', TH: 'Thailand', MM: 'Myanmar', PH: 'Philippines',
  US: 'USA', BO: 'Bolivia', CO: 'Colombia', EC: 'Ecuador',
  ID: 'Indonesia', VN: 'Vietnam', LA: 'Laos',
  MV: 'Maldives', LK: 'SriLanka', PK: 'Pakistan', AF: 'Afghanistan',
  BD: 'Bangladesh', IN: 'India', BT: 'Bhutan', NP: 'Nepal',
  MU: 'Mauritius', SC: 'Seychelles', KM: 'Comoros', MG: 'Madagascar',
  BI: 'Burundi', RW: 'Rwanda', UG: 'Uganda', MW: 'Malawi',
  KE: 'Kenya', TZ: 'Tanzania', MZ: 'Mozambique', SZ: 'Eswatini',
  LS: 'Lesotho', NA: 'Namibia', BW: 'Botswana', ZW: 'Zimbabwe',
  ZM: 'Zambia', AO: 'Angola', ZA: 'SouthAfrica',
  FR: 'France', CA: 'Canada', FI: 'Finland', IS: 'Iceland', NO: 'Norway',
  IT: 'Italy', PT: 'Portugal', ES: 'Spain', IE: 'Ireland',
  CN: 'China', MN: 'Mongolia', JP: 'Japan', KR: 'SouthKorea', KP: 'NorthKorea',
  TW: 'Taiwan', RU: 'Russia',
  MX: 'Mexico', GT: 'Guatemala', CU: 'Cuba', JM: 'Jamaica', DO: 'DominicanRepublic',
  TT: 'TrinidadAndTobago', VE: 'Venezuela', GY: 'Guyana', SR: 'Suriname',
  PE: 'Peru', BR: 'Brazil', PY: 'Paraguay', UY: 'Uruguay', AR: 'Argentina', CL: 'Chile',
  AU: 'Australia', NZ: 'NewZealand', FJ: 'Fiji', PG: 'PapuaNewGuinea',
}

function isoToEngineCountry(iso) {
  return ISO_TO_ENGINE_COUNTRY[iso] || null
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic PRNG (Mulberry32). Seeded so the issue list is reproducible
// across runs — CI failure on one machine reproduces locally.
// ─────────────────────────────────────────────────────────────────────────────

const SEED = 0x66616a72  // 'fajr'
function makePrng(seed) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sampling helpers
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLES_PER_CATEGORY = 10
const OUTSIDE_BUFFER_DEG  = 0.01  // ~1.1 km at the equator; smaller near poles.

function randomInsideBbox(rng, bbox) {
  const [latMin, latMax, lonMin, lonMax] = bbox
  const lat = latMin + rng() * (latMax - latMin)
  const lon = lonMin + rng() * (lonMax - lonMin)
  return [lat, lon]
}

function randomJustOutsideBbox(rng, bbox, bufferDeg = OUTSIDE_BUFFER_DEG) {
  const [latMin, latMax, lonMin, lonMax] = bbox
  // Pick a side at random, then a uniform point along that side, OFFSET by
  // the buffer outward.
  const side = Math.floor(rng() * 4)
  switch (side) {
    case 0: return [latMin - bufferDeg, lonMin + rng() * (lonMax - lonMin)]  // south
    case 1: return [latMax + bufferDeg, lonMin + rng() * (lonMax - lonMin)]  // north
    case 2: return [latMin + rng() * (latMax - latMin), lonMin - bufferDeg]  // west
    case 3: return [latMin + rng() * (latMax - latMin), lonMax + bufferDeg]  // east
  }
}

function bboxesIntersect(a, b) {
  // a, b are [latMin, latMax, lonMin, lonMax]. Strict overlap (touching
  // edges only is NOT counted — we use a small epsilon).
  const eps = 1e-9
  return !(a[1] < b[0] - eps || a[0] > b[1] + eps ||
           a[3] < b[2] - eps || a[2] > b[3] + eps)
}

function bboxArea(bbox) {
  return (bbox[1] - bbox[0]) * (bbox[3] - bbox[2])
}

// ─────────────────────────────────────────────────────────────────────────────
// Issue collection
// ─────────────────────────────────────────────────────────────────────────────

const issues = []
function fail(kind, msg, extra = {}) {
  issues.push({ severity: 'FAIL', kind, msg, ...extra })
}
function warn(kind, msg, extra = {}) {
  issues.push({ severity: 'WARN', kind, msg, ...extra })
}

// ─────────────────────────────────────────────────────────────────────────────
// Run validation
// ─────────────────────────────────────────────────────────────────────────────

const cities = (cityModule.cities || cityModule.default?.cities || [])
if (!cities.length) {
  console.error('FATAL: no cities found in src/data/cities.json — cannot validate')
  process.exit(2)
}

console.log(`[validate-city-registry] checking ${cities.length} cities (seed=${SEED.toString(16)})`)

const rng = makePrng(SEED)

// Track how many internal samples each city actually "wins" — useful for
// diagnosing unreachable cities (a city whose bbox is fully shadowed by a
// smaller-bbox sibling will fail every internal sample).
const internalWinByName = new Map()

// 1 + 2 + 3 + 4: per-city checks
for (const city of cities) {
  const cityName = city.name
  const claimedISO = city.countryISO
  const claimedEngineCountry = isoToEngineCountry(claimedISO)
  const bbox = city.bbox
  const [latMin, latMax, lonMin, lonMax] = bbox
  const centerLat = (latMin + latMax) / 2
  const centerLon = (lonMin + lonMax) / 2

  if (!claimedEngineCountry) {
    warn('country-iso-unmapped',
      `${cityName} claims ISO=${claimedISO} which has no engine-country mapping`,
      { city: cityName, iso: claimedISO })
  }

  // 3. Cross-check claimed countryISO against detectCountry(center).
  const centerCountry = detectCountryViaLocation(centerLat, centerLon)
  if (claimedEngineCountry && centerCountry !== claimedEngineCountry) {
    fail('country-claim',
      `${cityName} center (${centerLat.toFixed(4)}, ${centerLon.toFixed(4)}) — claimed countryISO=${claimedISO} (=${claimedEngineCountry}) but detectCountry returned ${centerCountry}`,
      { city: cityName, claimed: claimedEngineCountry, detected: centerCountry, center: [centerLat, centerLon] })
  }

  // 1. bbox-internal: N samples inside the bbox.
  let internalWin = 0
  for (let i = 0; i < SAMPLES_PER_CATEGORY; i++) {
    const [lat, lon] = randomInsideBbox(rng, bbox)
    const got = detectLocation(lat, lon)
    if (!got.city) {
      fail('bbox-internal',
        `${cityName} (${lat.toFixed(4)}, ${lon.toFixed(4)}) inside its own bbox returned city=null`,
        { city: cityName, point: [lat, lon] })
      continue
    }
    if (got.city.name !== cityName) {
      // The sampled point fell inside this city's bbox but resolved to a
      // DIFFERENT city. This is the bbox-overlap failure mode (one city's
      // smaller-bbox sibling shadowed it on this point). For pairs that are
      // intentionally overlapping (metro + satellite where the satellite is
      // sorted-first) this WILL fire — but it indicates this city's bbox
      // is partially unreachable, which IS a problem.
      fail('bbox-internal',
        `${cityName} (${lat.toFixed(4)}, ${lon.toFixed(4)}) inside its own bbox resolved to ${got.city.name} instead`,
        { city: cityName, resolvedTo: got.city.name, point: [lat, lon] })
      continue
    }
    internalWin++
    // 4. cross-border: the country at this internal point must match the
    // city's claimed country.
    if (claimedEngineCountry && got.country !== claimedEngineCountry) {
      fail('cross-border',
        `${cityName} bbox extends across border: point (${lat.toFixed(4)}, ${lon.toFixed(4)}) inside bbox is in country=${got.country}, but city claims ${claimedEngineCountry}`,
        { city: cityName, claimed: claimedEngineCountry, detected: got.country, point: [lat, lon] })
    }
  }
  internalWinByName.set(cityName, internalWin)

  // 2. bbox-leak: N samples just outside the bbox.
  for (let i = 0; i < SAMPLES_PER_CATEGORY; i++) {
    const [lat, lon] = randomJustOutsideBbox(rng, bbox)
    const got = detectLocation(lat, lon)
    if (got.city && got.city.name === cityName) {
      // Only flag if this is the SAME row (same countryISO) — otherwise it's
      // a same-name collision (e.g. Tripoli|LY vs Tripoli|LB) that's a
      // separate concern.
      if (got.city.countryISO === claimedISO) {
        fail('bbox-leak',
          `${cityName} resolves OUTSIDE its declared bbox at (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          { city: cityName, point: [lat, lon], bbox })
      }
    }
  }
}

// 5. bbox-overlap detection across all pairs. WARN-class — many overlaps are
// intentional (metro + satellite where smaller-bbox-first wins). The list
// is informational. We omit pairs that are far apart (different countries
// with no shared land border) since the only same-country overlaps are
// suspicious.
let overlapPairs = 0
for (let i = 0; i < cities.length; i++) {
  for (let j = i + 1; j < cities.length; j++) {
    if (bboxesIntersect(cities[i].bbox, cities[j].bbox)) {
      overlapPairs++
      // Only warn for cross-country overlaps; same-country overlaps are
      // expected (metro + satellite). Cross-country overlaps are the
      // dangerous case.
      if (cities[i].countryISO !== cities[j].countryISO) {
        warn('bbox-overlap-cross-country',
          `${cities[i].name}|${cities[i].countryISO} ∩ ${cities[j].name}|${cities[j].countryISO}`,
          { a: cities[i].name, b: cities[j].name, isoA: cities[i].countryISO, isoB: cities[j].countryISO })
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────

const fails = issues.filter(x => x.severity === 'FAIL')
const warns = issues.filter(x => x.severity === 'WARN')
const failByKind = new Map()
const warnByKind = new Map()
for (const x of fails) failByKind.set(x.kind, (failByKind.get(x.kind) || 0) + 1)
for (const x of warns) warnByKind.set(x.kind, (warnByKind.get(x.kind) || 0) + 1)

console.log('')
console.log(`========================================`)
console.log(`Validation report (seed=${SEED.toString(16)})`)
console.log(`========================================`)
console.log(`Cities checked:        ${cities.length}`)
console.log(`Internal samples:      ${cities.length * SAMPLES_PER_CATEGORY}`)
console.log(`External samples:      ${cities.length * SAMPLES_PER_CATEGORY}`)
console.log(`Country-claim checks:  ${cities.length}`)
console.log(`bbox-overlap pairs:    ${overlapPairs} (warn-class)`)
console.log('')
console.log(`FAIL-class issues:     ${fails.length}`)
for (const [k, n] of failByKind) console.log(`  ${k.padEnd(20)} ${n}`)
console.log(`WARN-class issues:     ${warns.length}`)
for (const [k, n] of warnByKind) console.log(`  ${k.padEnd(28)} ${n}`)
console.log('')

const SHOW_LIMIT = process.env.FULL_FAILS ? Number.MAX_SAFE_INTEGER : 100
if (fails.length) {
  console.log(`First ${Math.min(fails.length, SHOW_LIMIT)} FAIL details${process.env.FULL_FAILS ? ' (FULL_FAILS=1)' : ''}:`)
  for (let i = 0; i < Math.min(fails.length, SHOW_LIMIT); i++) {
    console.log(`  [FAIL/${fails[i].kind}] ${fails[i].msg}`)
  }
  if (fails.length > SHOW_LIMIT) {
    console.log(`  ... and ${fails.length - SHOW_LIMIT} more (set FULL_FAILS=1 to see all)`)
  }
  console.log('')
}

if (warns.length && process.env.SHOW_WARNS) {
  console.log(`WARN details (set SHOW_WARNS=1 to see all; printing all here):`)
  for (const w of warns) {
    console.log(`  [WARN/${w.kind}] ${w.msg}`)
  }
}

if (fails.length) {
  console.error(`\nValidation FAILED: ${fails.length} fail-class issue(s) — registry must be fixed.`)
  process.exit(1)
}
console.log(`Validation PASSED: 0 fail-class issues.`)
process.exit(0)
