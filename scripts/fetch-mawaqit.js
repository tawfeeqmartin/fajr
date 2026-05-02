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

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// The mosque list is sourced from scripts/data/mawaqit-mosques.json — a curated
// JSON registry of real, active mosque slugs on mawaqit.net annotated with
// city/country/timezone, exclusion records, and an iconic-mosque wishlist for
// the scholarly-corpus expansion pass. Editing the registry instead of this
// file lets non-engineers contribute slugs without touching code, and lets
// future tooling (validators, cross-references against scholarly sources)
// consume the same data.
const REGISTRY_PATH = join(__dirname, 'data', 'mawaqit-mosques.json')
const REGISTRY = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
const MOSQUES = REGISTRY.active

const SOURCE_INSTITUTION = 'Mawaqit (mosque-published)'

// Today's local date in the mosque's timezone, formatted YYYY-MM-DD.
// Each mosque's `times` array is for its own local "today" — there can be
// minor cross-timezone drift but for our purposes we tag with the mosque's
// local date.
function todayLocal(utcOffsetHours) {
  const now = new Date(Date.now() + utcOffsetHours * 3600 * 1000)
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')}`
}

async function searchAndPick(slug, keyword) {
  // Search the keyword (city name, or registry-supplied searchKeyword override)
  // and filter by exact slug. Mawaqit's search ranks by name fuzzy-match across
  // the global mosque list, so for cities whose name partially matches French
  // mosque names (e.g. "Fes" → "frais"/"compagnons") the registry should
  // supply a more specific searchKeyword (e.g. "fez", "fes 30000").
  const url = `https://mawaqit.net/api/2.0/mosque/search?word=${encodeURIComponent(keyword.toLowerCase())}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} searching for ${keyword}`)
  const list = await res.json()
  const found = list.find(m => m.slug === slug)
  if (!found) {
    const sample = list.slice(0, 3).map(m => m.slug).join(', ')
    throw new Error(`slug "${slug}" not in first ${list.length} results for "${keyword}". Got: ${sample}…`)
  }
  return found
}

// Filter out entries whose Fajr is implausibly early or whose times look
// like a tz misconfig. The original Moroccan-only floor of 03:30 was
// inappropriate for higher-latitude / higher-UTC-offset cells (Moscow May
// Fajr 02:10 is correct; Tokyo 03:13 is correct). Accept any Fajr from
// 01:30 to 06:30 — captures every legitimate latitude/season we care about.
// Also require the prayer-array shape to be sane (sunrise after fajr,
// dhuhr after sunrise, etc.) to catch the Türkiye-style "dhuhr 05:54"
// data corruption we excluded in PR #5.
function looksReasonable(times, expectedFajrHour = 5) {
  if (!times || times.length < 6) return false
  const [fajr, sunrise, dhuhr, asr, maghrib, isha] = times
  function toMin(s) {
    if (!s || typeof s !== 'string') return NaN
    const [h, m] = s.split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return NaN
    return h * 60 + m
  }
  const [fM, sM, dM, aM, mM, iM] = [fajr, sunrise, dhuhr, asr, maghrib, isha].map(toMin)
  if ([fM, sM, dM, aM, mM, iM].some(Number.isNaN)) return false
  // Fajr in 01:30..06:30. Maghrib later than sunrise. Dhuhr later than sunrise.
  // Maghrib later than dhuhr. (We tolerate Isha < Maghrib for high-lat
  // cases where Isha rolls past midnight — those need separate handling
  // but aren't a tz-misconfig signature.)
  if (fM < 90 || fM > 6 * 60 + 30) return false
  if (sM <= fM) return false
  if (dM <= sM) return false
  if (mM <= dM) return false
  return true
}

async function fetchMosque(m) {
  console.log(`Fetching ${m.slug}…`)
  const keyword = m.searchKeyword || m.city
  const found = await searchAndPick(m.slug, keyword)
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

  // Split fixtures by registry-tagged corpus partition:
  //   • corpus=train          → eval/data/train/mawaqit-morocco.json
  //                             (the v1.5.0 Path A calibration anchor — 25
  //                             original Moroccan mosques calibrated against
  //                             when the +5min Maghrib offset was shipped)
  //   • corpus=test_extended  → eval/data/test/mawaqit-morocco-extended.json
  //                             (Moroccan mosques added post-v1.5.0 — kept
  //                             in holdout so the train ratchet stays clean
  //                             against the calibrated baseline; future
  //                             calibrations targeting these regions can
  //                             promote them to train)
  //   • corpus=test (default) → eval/data/test/mawaqit.json
  //                             (non-Moroccan Mawaqit mosques — pure
  //                             holdout coverage)
  const fxBySlug = new Map()
  for (const f of fixtures) {
    const m = (f.source || '').match(/Mawaqit mosque (\S+)/)
    if (m) fxBySlug.set(m[1], f)
  }
  const train = [], ext = [], test = []
  for (const m of MOSQUES) {
    const f = fxBySlug.get(m.slug)
    if (!f) continue
    const corpus = m.corpus || 'test'
    if (corpus === 'train')              train.push(f)
    else if (corpus === 'test_extended') ext.push(f)
    else                                  test.push(f)
  }

  const trainPath = join(__dirname, '..', 'eval', 'data', 'train', 'mawaqit-morocco.json')
  const extPath   = join(__dirname, '..', 'eval', 'data', 'test',  'mawaqit-morocco-extended.json')
  const testPath  = join(__dirname, '..', 'eval', 'data', 'test',  'mawaqit.json')
  mkdirSync(dirname(trainPath), { recursive: true })
  mkdirSync(dirname(testPath),  { recursive: true })

  if (train.length > 0) {
    writeFileSync(trainPath, JSON.stringify(train, null, 2))
    console.log(`→ wrote ${trainPath} (${train.length} Moroccan mosques — train v1.5.0 Path A anchor)`)
  }
  if (ext.length > 0) {
    writeFileSync(extPath, JSON.stringify(ext, null, 2))
    console.log(`→ wrote ${extPath} (${ext.length} Moroccan mosques — extended holdout)`)
  }
  writeFileSync(testPath, JSON.stringify(test, null, 2))
  console.log(`→ wrote ${testPath} (${test.length} non-Morocco mosques — holdout)`)
  console.log('Note: Mawaqit fixtures are single-day snapshots. Re-run daily to refresh.')
}

main()
