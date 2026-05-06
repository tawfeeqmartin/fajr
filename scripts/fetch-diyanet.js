// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch official Diyanet İşleri Başkanlığı (Republic of Türkiye) prayer times
 * via the ezanvakti.emushaf.net proxy (which mirrors namazvakti.diyanet.gov.tr).
 *
 * Endpoint chain:
 *   /sehirler/2          — list of Turkish cities (id "2" = country Türkiye)
 *   /ilceler/{cityID}    — list of districts in a city
 *   /vakitler/{districtID} — 30 days of prayer times for a district
 *
 * City/district IDs are read from scripts/data/diyanet-ezanvakti-cities.json.
 * Do not guess numeric IDs; see fajr#102.
 *
 * Output: eval/data/train/diyanet.json — 3 Turkish cities tagged with
 * source_institution = "Diyanet İşleri Başkanlığı (Türkiye)".
 *
 * Usage:
 *   node scripts/fetch-diyanet.js
 *   node scripts/fetch-diyanet.js --verify-mapping
 *   node scripts/fetch-diyanet.js --all-registry-cities --out /private/tmp/diyanet-tr.json
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import cityModule from '../src/data/cities.json' with { type: 'json' }
import diyanetMap from './data/diyanet-ezanvakti-cities.json' with { type: 'json' }

const __dirname = dirname(fileURLToPath(import.meta.url))

const SOURCE_INSTITUTION = 'Diyanet İşleri Başkanlığı (Türkiye)'
const SOURCE_METHOD      = 'Diyanet (18°/17° + minute adjustments)'
const DEFAULT_TRAIN_CITIES = new Set(['Istanbul', 'Ankara', 'Izmir'])
const DEFAULT_OUT_PATH = join(__dirname, '..', 'eval', 'data', 'train', 'diyanet.json')

const args = new Map()
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i]
  if (!arg.startsWith('--')) continue
  const key = arg.slice(2)
  const next = process.argv[i + 1]
  if (!next || next.startsWith('--')) {
    args.set(key, true)
  } else {
    args.set(key, next)
    i++
  }
}

const allRegistryCities = args.has('all-registry-cities')
const cityFilter = args.get('city')
const daysLimit = args.has('days') ? Number(args.get('days')) : 10
const outPath = args.get('out') || DEFAULT_OUT_PATH
const writeStdout = args.has('stdout')
const verifyMapping = args.has('verify-mapping') || allRegistryCities

if (!Number.isInteger(daysLimit) || daysLimit <= 0) {
  console.error('Usage error: --days must be a positive integer.')
  process.exit(2)
}

if (allRegistryCities && !args.has('out') && !writeStdout) {
  console.error('Usage error: --all-registry-cities requires --out or --stdout so eval/data/train is not accidentally widened.')
  process.exit(2)
}

const registryCities = cityModule.cities || cityModule.default?.cities || []
const cityByKey = new Map(registryCities.map(city => [`${city.name}|${city.countryISO}`, city]))
let selectedMappings = diyanetMap.cities.filter(row =>
  allRegistryCities || DEFAULT_TRAIN_CITIES.has(row.fajrCity)
)

if (cityFilter) {
  const needle = normalizeName(cityFilter)
  selectedMappings = selectedMappings.filter(row =>
    normalizeName(row.fajrCity).includes(needle) ||
    normalizeName(row.sehirAdiEn).includes(needle) ||
    normalizeName(row.sehirAdi).includes(needle)
  )
}

if (!selectedMappings.length) {
  console.error(`No Diyanet mapping matched${cityFilter ? ` city=${cityFilter}` : ''}.`)
  process.exit(2)
}

// Convert MiladiTarihKisa "DD.MM.YYYY" → ISO "YYYY-MM-DD"
function ddmmyyyyToIso(s) {
  const [dd, mm, yyyy] = s.split('.')
  return `${yyyy}-${mm}-${dd}`
}

async function getJson(url) {
  let lastError
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.ok) return res.json()
      lastError = new Error(`HTTP ${res.status} for ${url}`)
      if (res.status !== 429 && res.status < 500) throw lastError
      const retryAfter = Number(res.headers.get('retry-after'))
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000 * (attempt + 1))
    } catch (err) {
      lastError = err
      if (attempt < 3) await sleep(1000 * (attempt + 1))
    }
  }
  throw lastError
}

let liveCitiesCache = null
async function verifyMappingRow(row) {
  liveCitiesCache ||= await getJson('https://ezanvakti.emushaf.net/sehirler/2')
  const liveCity = liveCitiesCache.find(city => city.SehirID === row.sehirID)
  if (!liveCity) throw new Error(`${row.fajrCity}: sehirID ${row.sehirID} not found in /sehirler/2`)
  if (normalizeName(liveCity.SehirAdiEn) !== normalizeName(row.sehirAdiEn)) {
    throw new Error(`${row.fajrCity}: sehirID ${row.sehirID} returned ${liveCity.SehirAdiEn}, expected ${row.sehirAdiEn}`)
  }

  const districts = await getJson(`https://ezanvakti.emushaf.net/ilceler/${row.sehirID}`)
  const liveDistrict = districts.find(district => district.IlceID === row.ilceID)
  if (!liveDistrict) throw new Error(`${row.fajrCity}: ilceID ${row.ilceID} not found under sehirID ${row.sehirID}`)
  if (normalizeName(liveDistrict.IlceAdiEn) !== normalizeName(row.ilceAdiEn)) {
    throw new Error(`${row.fajrCity}: ilceID ${row.ilceID} returned ${liveDistrict.IlceAdiEn}, expected ${row.ilceAdiEn}`)
  }
  console.error(`[diyanet] verified ${row.fajrCity}: sehirID=${row.sehirID}, ilceID=${row.ilceID}`)
}

async function fetchCity(row) {
  const city = cityByKey.get(`${row.fajrCity}|${row.countryISO}`)
  if (!city) throw new Error(`${row.fajrCity}: missing fajr city registry row`)
  if (verifyMapping) await verifyMappingRow(row)

  const url = `https://ezanvakti.emushaf.net/vakitler/${row.ilceID}`
  console.error(`[diyanet] fetching ${row.fajrCity} (sehir ${row.sehirID}, district ${row.ilceID}): ${url}`)
  const days = await getJson(url)

  // Diyanet returns ~30 days forward from today. The eval handles dates
  // independently, so callers choose the row count with --days.
  const dates = days.slice(0, daysLimit).map(d => ({
    date:    ddmmyyyyToIso(d.MiladiTarihKisa),
    fajr:    d.Imsak,
    sunrise: d.Gunes,
    dhuhr:   d.Ogle,
    asr:     d.Ikindi,
    maghrib: d.Aksam,
    isha:    d.Yatsi,
  }))

  return {
    city: city.name,
    country: 'Turkey',
    latitude: city.lat,
    longitude: city.lon,
    elevation: city.elevation,
    timezone: city.timezone,
    method: 'diyanet',
    source: `Diyanet İşleri Başkanlığı (Türkiye) via ezanvakti.emushaf.net/vakitler/${row.ilceID}`,
    source_institution: SOURCE_INSTITUTION,
    source_method:      SOURCE_METHOD,
    source_url:         `https://ezanvakti.emushaf.net/vakitler/${row.ilceID}`,
    source_fetched:     new Date().toISOString(),
    source_city_id:     row.sehirID,
    source_district_id: row.ilceID,
    source_district:    row.ilceAdiEn,
    dates,
  }
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

async function main() {
  const fixtures = []
  const failures = []
  for (const row of selectedMappings) {
    try {
      fixtures.push(await fetchCity(row))
      await sleep(350)
    } catch (err) {
      failures.push(`${row.fajrCity}: ${err.message}`)
      console.error(`  ERROR for ${row.fajrCity}: ${err.message}`)
    }
  }
  if (fixtures.length === 0) {
    console.error('No fixtures fetched. Aborting.')
    process.exit(1)
  }
  if (failures.length) {
    console.error(`[diyanet] ${failures.length} city fetch(es) failed:`)
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }
  const json = `${JSON.stringify(fixtures, null, 2)}\n`
  if (writeStdout) {
    process.stdout.write(json)
  } else {
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, json)
    console.error(`→ wrote ${outPath} (${fixtures.length} cities, ${fixtures.reduce((n,f)=>n+f.dates.length,0)} day-entries)`)
  }
}

main()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
