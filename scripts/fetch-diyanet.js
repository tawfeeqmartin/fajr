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
 * Output: eval/data/train/diyanet.json — 3 Turkish cities tagged with
 * source_institution = "Diyanet İşleri Başkanlığı (Türkiye)".
 *
 * Usage: node scripts/fetch-diyanet.js
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CITIES = [
  // SehirID + IlceID looked up from /sehirler/2 and /ilceler/{SehirID}
  {
    city: 'Istanbul', country: 'Turkey',
    latitude: 41.0082, longitude: 28.9784, elevation: 100,
    timezone: 'Europe/Istanbul',
    sehirID: '539', ilceID: '9541',          // İstanbul / İSTANBUL district
  },
  {
    city: 'Ankara',   country: 'Turkey',
    latitude: 39.9334, longitude: 32.8597, elevation: 938,
    timezone: 'Europe/Istanbul',
    sehirID: '506', ilceID: null,            // resolved at runtime
  },
  {
    city: 'Izmir',    country: 'Turkey',
    latitude: 38.4192, longitude: 27.1287, elevation: 25,
    timezone: 'Europe/Istanbul',
    sehirID: '540', ilceID: null,            // resolved at runtime
  },
]

const SOURCE_INSTITUTION = 'Diyanet İşleri Başkanlığı (Türkiye)'
const SOURCE_METHOD      = 'Diyanet (18°/17° + minute adjustments)'

// Convert MiladiTarihKisa "DD.MM.YYYY" → ISO "YYYY-MM-DD"
function ddmmyyyyToIso(s) {
  const [dd, mm, yyyy] = s.split('.')
  return `${yyyy}-${mm}-${dd}`
}

async function getJson(url) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function resolveDistrict(city) {
  if (city.ilceID) return city.ilceID
  const districts = await getJson(`https://ezanvakti.emushaf.net/ilceler/${city.sehirID}`)
  // Prefer a district whose English name matches the city name (e.g. "ANKARA")
  const target = city.city.toUpperCase()
  const match = districts.find(d => (d.IlceAdiEn || '').toUpperCase() === target)
              ?? districts[0]
  return match.IlceID
}

async function fetchCity(city) {
  const ilceID = await resolveDistrict(city)
  const url = `https://ezanvakti.emushaf.net/vakitler/${ilceID}`
  console.log(`Fetching ${city.city} (district ${ilceID}): ${url}`)
  const days = await getJson(url)

  // Diyanet returns ~30 days forward from today, so we just take the first 10.
  // The eval handles dates independently — no need to align to April.
  const aprilDays = days.slice(0, 10).map(d => ({
    date:    ddmmyyyyToIso(d.MiladiTarihKisa),
    fajr:    d.Imsak,
    sunrise: d.Gunes,
    dhuhr:   d.Ogle,
    asr:     d.Ikindi,
    maghrib: d.Aksam,
    isha:    d.Yatsi,
  }))

  return {
    city: city.city,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
    elevation: city.elevation,
    timezone: city.timezone,
    method: 'diyanet',
    source: `Diyanet İşleri Başkanlığı (Türkiye) via ezanvakti.emushaf.net/vakitler/${ilceID}`,
    source_institution: SOURCE_INSTITUTION,
    source_method:      SOURCE_METHOD,
    source_url:         `https://ezanvakti.emushaf.net/vakitler/${ilceID}`,
    source_fetched:     new Date().toISOString(),
    dates: aprilDays,
  }
}

async function main() {
  const fixtures = []
  for (const city of CITIES) {
    try {
      fixtures.push(await fetchCity(city))
    } catch (err) {
      console.error(`  ERROR for ${city.city}: ${err.message}`)
    }
  }
  if (fixtures.length === 0) {
    console.error('No fixtures fetched. Aborting.')
    process.exit(1)
  }
  const outPath = join(__dirname, '..', 'eval', 'data', 'train', 'diyanet.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2))
  console.log(`→ wrote ${outPath} (${fixtures.length} cities, ${fixtures.reduce((n,f)=>n+f.dates.length,0)} day-entries)`)
}

main()
