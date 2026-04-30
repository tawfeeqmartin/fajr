// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch mosque-published prayer times via Mawaqit (mawaqit.net) — a community
 * platform used by 6000+ mosques across France, Morocco, UK, Belgium, etc.
 *
 * Mawaqit's per-mosque calendar API is auth-gated (UUID lookup returns 401),
 * but the public search endpoint returns each mosque's CURRENT-DAY prayer
 * times in the `times` array. We use that as a single-day cross-validation
 * snapshot — particularly valuable for Morocco coverage, where the formal
 * Habous Ministry has no public API and mosque-published times are the
 * de-facto reality Moroccan Muslims pray to.
 *
 * The `times` array layout is [fajr, sunrise, dhuhr, asr, maghrib, isha].
 *
 * Output: eval/data/test/mawaqit.json — single-day fixtures, holdout.
 *
 * Usage: node scripts/fetch-mawaqit.js
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Curated mosque slugs — each is a real, active mosque on mawaqit.net.
// Coverage focus: (a) Morocco — addresses the Habous gap, (b) French/UK
// community mosques — the Mawaqit network's primary user base.
const MOSQUES = [
  // ── Morocco — addresses the Habous coverage gap ──────────────────────────
  { slug: 'moulay-ismail-casablanca-20400-morocco',           city: 'Casablanca', country: 'Morocco', timezone: 'Africa/Casablanca', utcOffset: 1 },
  { slug: 'msjd-qm-lslm-casablanca-20320-morocco',            city: 'Casablanca', country: 'Morocco', timezone: 'Africa/Casablanca', utcOffset: 1 },
  { slug: 'mosquee-bab-arrahmane-casablanca-20050-morocco',   city: 'Casablanca', country: 'Morocco', timezone: 'Africa/Casablanca', utcOffset: 1 },
  { slug: 'msjd-lm-masjid-ummah-rabat-10130-morocco',         city: 'Rabat',      country: 'Morocco', timezone: 'Africa/Casablanca', utcOffset: 1 },
  { slug: 'msjd-lthr-marrakech-40170-morocco',                city: 'Marrakech',  country: 'Morocco', timezone: 'Africa/Casablanca', utcOffset: 1 },
  // ── France / UK — Mawaqit's home turf ────────────────────────────────────
  { slug: 'mosquee-acra-marseille-13014-france',              city: 'Marseille',  country: 'France',  timezone: 'Europe/Paris',      utcOffset: 2 },
  { slug: 'les-compagnons-limoges-87000-france-1',            city: 'Limoges',    country: 'France',  timezone: 'Europe/Paris',      utcOffset: 2 },
  { slug: 'association-des-musulmans-des-coteaux-mulhouse',   city: 'Mulhouse',   country: 'France',  timezone: 'Europe/Paris',      utcOffset: 2 },
]

const SOURCE_INSTITUTION = 'Mawaqit (mosque-published)'

// Today's local date in the mosque's timezone, formatted YYYY-MM-DD.
// Each mosque's `times` array is for its own local "today" — there can be
// minor cross-timezone drift but for our purposes we tag with the mosque's
// local date.
function todayLocal(utcOffsetHours) {
  const now = new Date(Date.now() + utcOffsetHours * 3600 * 1000)
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')}`
}

async function searchAndPick(slug, city) {
  // Search the city name (returns up to ~20 mosques) then filter by exact slug.
  const url = `https://mawaqit.net/api/2.0/mosque/search?word=${encodeURIComponent(city.toLowerCase())}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} searching for ${city}`)
  const list = await res.json()
  const found = list.find(m => m.slug === slug)
  if (!found) {
    const sample = list.slice(0, 3).map(m => m.slug).join(', ')
    throw new Error(`slug "${slug}" not in first ${list.length} results for "${city}". Got: ${sample}…`)
  }
  return found
}

// Filter out entries whose Fajr is implausibly early (<03:30) — these are
// usually mosques with a misconfigured timezone (e.g. UTC+0 instead of UTC+1
// during Moroccan summer). They mislead the eval if blindly included.
function looksReasonable(times, expectedFajrHour = 5) {
  if (!times || times.length < 6) return false
  const [fajr] = times
  const [h, m] = fajr.split(':').map(Number)
  if (Number.isNaN(h)) return false
  // Accept Fajr between 03:30 and 06:30
  return h >= 3 && h <= 6 && (h !== 3 || m >= 30)
}

async function fetchMosque(m) {
  console.log(`Fetching ${m.slug}…`)
  const found = await searchAndPick(m.slug, m.city)
  const times = found.times
  if (!looksReasonable(times)) {
    throw new Error(`Times array looks misconfigured for ${m.slug}: ${JSON.stringify(times)}`)
  }
  const [fajr, sunrise, dhuhr, asr, maghrib, isha] = times
  const date = todayLocal(m.utcOffset)
  return {
    city: m.city,
    country: m.country,
    latitude: found.latitude,
    longitude: found.longitude,
    elevation: 0,                     // Mawaqit search doesn't expose elevation; coastal mosques are near sea level
    timezone: m.timezone,
    method: 'mosque-published',
    source: `Mawaqit mosque ${m.slug} (${found.name})`,
    source_institution: SOURCE_INSTITUTION,
    source_method:      `Mosque-published (${found.name})`,
    source_url:         `https://mawaqit.net/en/m/${m.slug}`,
    source_fetched:     new Date().toISOString(),
    dates: [{ date, fajr, sunrise, dhuhr, asr, maghrib, isha }],
  }
}

async function main() {
  const fixtures = []
  for (const m of MOSQUES) {
    try {
      fixtures.push(await fetchMosque(m))
    } catch (err) {
      console.error(`  ERROR for ${m.slug}: ${err.message}`)
    }
  }
  if (fixtures.length === 0) {
    console.error('No fixtures fetched. Aborting.')
    process.exit(1)
  }
  const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'mawaqit.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2))
  console.log(`→ wrote ${outPath} (${fixtures.length} mosques, ${fixtures.length} day-entries)`)
  console.log('Note: Mawaqit fixtures are single-day snapshots. Re-run daily to refresh.')
}

main()
