// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch JAKIM (Jabatan Kemajuan Islam Malaysia) prayer times via the
 * waktusolat.app community proxy. JAKIM's own e-solat.gov.my API is
 * unreachable from non-Malaysian IPs; waktusolat mirrors the same data
 * with a stable JSON API.
 *
 * Endpoint:
 *   /v2/solat/{zoneCode}
 * Returns Unix-seconds timestamps (UTC) for fajr, syuruk, dhuhr, asr,
 * maghrib, isha for each day of the current month.
 *
 * Output: eval/data/train/waktusolat.json — 3 Malaysian zones tagged with
 * source_institution = "JAKIM (via waktusolat.app)".
 *
 * Usage: node scripts/fetch-waktusolat.js
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ZONES = [
  {
    city: 'Kuala Lumpur', country: 'Malaysia',
    latitude: 3.139, longitude: 101.6869, elevation: 22,
    timezone: 'Asia/Kuala_Lumpur',
    zone: 'WLY01',     // Wilayah Persekutuan KL, Putrajaya
  },
  {
    city: 'Shah Alam',   country: 'Malaysia',
    latitude: 3.0738, longitude: 101.5183, elevation: 26,
    timezone: 'Asia/Kuala_Lumpur',
    zone: 'SGR01',     // Selangor (Gombak, Hulu Selangor, Petaling, Shah Alam)
  },
  {
    city: 'George Town', country: 'Malaysia',
    latitude: 5.4141, longitude: 100.3288, elevation: 3,
    timezone: 'Asia/Kuala_Lumpur',
    zone: 'PNG01',     // Pulau Pinang (entire state)
  },
]

const SOURCE_INSTITUTION = 'JAKIM (via waktusolat.app)'
const SOURCE_METHOD      = 'JAKIM (Fajr 20°, Isha 18°, topographic elevation)'
const TZ_OFFSET_HOURS    = 8   // Malaysia Standard Time, no DST

function tsToLocalHHMM(unixSeconds, tzOffsetHours) {
  // Shift to local then read with UTC accessors so we don't double-apply offset
  const local = new Date((unixSeconds + tzOffsetHours * 3600) * 1000)
  return `${String(local.getUTCHours()).padStart(2, '0')}:${String(local.getUTCMinutes()).padStart(2, '0')}`
}

function tsToIsoDate(unixSeconds, tzOffsetHours) {
  const local = new Date((unixSeconds + tzOffsetHours * 3600) * 1000)
  const y = local.getUTCFullYear()
  const m = String(local.getUTCMonth() + 1).padStart(2, '0')
  const d = String(local.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function fetchZone(z) {
  const url = `https://api.waktusolat.app/v2/solat/${z.zone.toLowerCase()}`
  console.log(`Fetching ${z.city} (zone ${z.zone}): ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const data = await res.json()
  // The zone endpoint returns the current month. We want April 2026 entries.
  if (data.year !== 2026 || data.month_number !== 4) {
    console.warn(`  ⚠  ${z.city}: API returned ${data.month} ${data.year}, not April 2026. Using whatever was returned.`)
  }
  const dates = data.prayers.slice(0, 10).map(p => ({
    date:    tsToIsoDate(p.fajr, TZ_OFFSET_HOURS),
    fajr:    tsToLocalHHMM(p.fajr,    TZ_OFFSET_HOURS),
    sunrise: tsToLocalHHMM(p.syuruk,  TZ_OFFSET_HOURS),
    dhuhr:   tsToLocalHHMM(p.dhuhr,   TZ_OFFSET_HOURS),
    asr:     tsToLocalHHMM(p.asr,     TZ_OFFSET_HOURS),
    maghrib: tsToLocalHHMM(p.maghrib, TZ_OFFSET_HOURS),
    isha:    tsToLocalHHMM(p.isha,    TZ_OFFSET_HOURS),
  }))
  return {
    city: z.city,
    country: z.country,
    latitude: z.latitude,
    longitude: z.longitude,
    elevation: z.elevation,
    timezone: z.timezone,
    method: 'jakim',
    source: `JAKIM via waktusolat.app zone ${z.zone}`,
    source_institution: SOURCE_INSTITUTION,
    source_method:      SOURCE_METHOD,
    source_url:         url,
    source_fetched:     new Date().toISOString(),
    dates,
  }
}

async function main() {
  const fixtures = []
  for (const z of ZONES) {
    try {
      fixtures.push(await fetchZone(z))
    } catch (err) {
      console.error(`  ERROR for ${z.city}: ${err.message}`)
    }
  }
  if (fixtures.length === 0) {
    console.error('No fixtures fetched. Aborting.')
    process.exit(1)
  }
  const outPath = join(__dirname, '..', 'eval', 'data', 'train', 'waktusolat.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2))
  console.log(`→ wrote ${outPath} (${fixtures.length} zones, ${fixtures.reduce((n,f)=>n+f.dates.length,0)} day-entries)`)
}

main()
