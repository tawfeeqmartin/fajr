// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch today's official Egypt ESA (General Authority for Survey) prayer
 * times for all 77 Egyptian cities, per fajr#133 / agot#114.
 *
 * Earlier diagnosis (fajr#109 research, 2026-05-05): "ESA portal is JS-
 * rendered ASP.NET VIEWSTATE form, raw HTTP scrape fails." That diagnosis
 * is now WRONG (or no longer accurate as of 2026-05-13): hitting
 * `esa.gov.eg/praytimes.aspx` (with HTTPS redirect-following + a normal
 * browser User-Agent) returns a SERVER-SIDE-RENDERED table of today's
 * prayer times for all 77 cities. No VIEWSTATE form-post needed for
 * the current-day snapshot.
 *
 * The form-post path IS needed for past/future dates (city + date
 * selection). That's a separate effort (Puppeteer or VIEWSTATE-simulation)
 * — this fetcher captures today's data and is designed to run daily,
 * same shape as scripts/fetch-morocco-habous.js.
 *
 * Output schema matches existing eval/data/test fixtures (flat array of
 * city records with top-level lat/lon/timezone + `dates: [...]`).
 *
 * Output: eval/data/test/egypt-esa.json (overwrites — previous content was
 * a stub documenting the JS-rendering blocker, which we now know is wrong).
 *
 * Usage:
 *   node scripts/fetch-egypt-esa.js
 *
 * Classification: 🟢 Established — pure data fetch + parse; no shar'i
 * judgment involved.
 */

import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const TARGET_URL = 'https://www.esa.gov.eg/praytimes.aspx'
const OUT_PATH = new URL('../eval/data/test/egypt-esa.json', import.meta.url).pathname

// Coordinate + timezone lookup for the major Egyptian cities ESA publishes.
// ESA serves 77 cities total; this map covers ~14 high-Muslim-population
// ones for fajr's eval purposes. Rows without coords are skipped (eval
// requires lat/lon for the per-city signed-bias check).
const CITY_META = {
  'القـاهـرة':       { english: 'Cairo',        lat: 30.0444, lon: 31.2357 },
  'القاهرة':         { english: 'Cairo',        lat: 30.0444, lon: 31.2357 },
  'الأسكندرية':      { english: 'Alexandria',   lat: 31.2001, lon: 29.9187 },
  'طنطا':            { english: 'Tanta',        lat: 30.7865, lon: 31.0004 },
  'طنطــا':          { english: 'Tanta',        lat: 30.7865, lon: 31.0004 },
  'المنصورة':        { english: 'Mansoura',     lat: 31.0364, lon: 31.3807 },
  'الزقازيق':        { english: 'Zagazig',      lat: 30.5877, lon: 31.5022 },
  'الزقـازيق':       { english: 'Zagazig',      lat: 30.5877, lon: 31.5022 },
  'أسيوط':           { english: 'Asyut',        lat: 27.1809, lon: 31.1837 },
  'أسيــوط':         { english: 'Asyut',        lat: 27.1809, lon: 31.1837 },
  'سوهاج':           { english: 'Sohag',        lat: 26.5569, lon: 31.6948 },
  'سـوهاج':          { english: 'Sohag',        lat: 26.5569, lon: 31.6948 },
  'بنى سويف':        { english: 'Beni Suef',    lat: 29.0661, lon: 31.0994 },
  'المنيا':          { english: 'Minya',        lat: 28.0871, lon: 30.7618 },
  'المنـيـا':        { english: 'Minya',        lat: 28.0871, lon: 30.7618 },
  'قنا':             { english: 'Qena',         lat: 26.1551, lon: 32.7160 },
  'قـــنا':          { english: 'Qena',         lat: 26.1551, lon: 32.7160 },
  'أسوان':           { english: 'Aswan',        lat: 24.0889, lon: 32.8998 },
  'أســوان':         { english: 'Aswan',        lat: 24.0889, lon: 32.8998 },
  'الإسماعيلية':     { english: 'Ismailia',     lat: 30.5965, lon: 32.2715 },
  'الغردقة':         { english: 'Hurghada',     lat: 27.2579, lon: 33.8116 },
  'الغردقـة':        { english: 'Hurghada',     lat: 27.2579, lon: 33.8116 },
  'دمياط':           { english: 'Damietta',     lat: 31.4165, lon: 31.8133 },
  'دميـاط':          { english: 'Damietta',     lat: 31.4165, lon: 31.8133 },
  'مطروح':           { english: 'Marsa Matruh', lat: 31.3543, lon: 27.2373 },
  'مطـروح':          { english: 'Marsa Matruh', lat: 31.3543, lon: 27.2373 },
  'الخارجة':         { english: 'Kharga Oasis', lat: 25.4513, lon: 30.5429 },
  'الخارجـة':        { english: 'Kharga Oasis', lat: 25.4513, lon: 30.5429 },
}

main().catch(err => { console.error(err); process.exit(1) })

async function main() {
  console.log(`[esa-egypt] fetching ${TARGET_URL}`)
  const res = await fetch(TARGET_URL, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  console.log(`[esa-egypt] received ${html.length} bytes`)

  const tableMatch = html.match(/<th[^>]*>المدينة<\/th>[\s\S]*?<\/table>/)
  if (!tableMatch) throw new Error('Could not locate prayer-times table in response')

  const rowRe = /<tr[^>]*>[\s\S]*?<\/tr>/g
  const rows = tableMatch[0].match(rowRe) || []
  const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g

  const records = []
  let skipped = 0
  for (const r of rows.slice(1)) {
    const cells = []
    let m
    while ((m = cellRe.exec(r)) !== null) cells.push(m[1].replace(/<[^>]+>/g, '').trim())
    if (cells.length < 9) continue

    const [cityAr, dateGreg, /*hijri*/, fajrAr, sunriseAr, dhuhrAr, asrAr, maghribAr, ishaAr] = cells
    const meta = CITY_META[cityAr]
    if (!meta) { skipped++; continue }

    const fajr = arabicTime24(fajrAr)
    const sunrise = arabicTime24(sunriseAr)
    const dhuhr = arabicTime24(dhuhrAr)
    const asr = arabicTime24(asrAr)
    const maghrib = arabicTime24(maghribAr)
    const isha = arabicTime24(ishaAr)
    if ([fajr, sunrise, dhuhr, asr, maghrib, isha].some(t => t == null)) { skipped++; continue }

    records.push({
      city: meta.english,
      city_local: cityAr,
      country: 'Egypt',
      latitude: meta.lat,
      longitude: meta.lon,
      elevation: 0,
      timezone: 'Africa/Cairo',
      method: 'Egyptian (ESA — General Authority for Survey)',
      source: 'Egyptian General Authority for Survey (esa.gov.eg/praytimes.aspx)',
      source_institution: 'Egyptian General Authority for Survey (ESA)',
      source_method: 'Egyptian (19.5°/17.5°) per ESA',
      source_url: TARGET_URL,
      source_fetched: new Date().toISOString(),
      dates: [{ date: dateGreg, fajr, sunrise, dhuhr, asr, maghrib, isha }],
    })
  }

  console.log(`[esa-egypt] parsed ${records.length} cities (skipped ${skipped} unmapped/malformed)`)

  // Verify-published-reference spot-check: Cairo Maghrib should be within
  // a plausible window for any calendar date in Egypt (conservative
  // [17:00, 20:00] covers all of Egypt's seasonal sunset range).
  const cairo = records.find(r => r.city === 'Cairo')
  if (cairo) {
    const [h, mn] = cairo.dates[0].maghrib.split(':').map(Number)
    const min = h * 60 + mn
    if (min < 17 * 60 || min > 20 * 60) {
      console.warn(`[verify-published-reference] WARN: Cairo Maghrib ${cairo.dates[0].maghrib} outside [17:00, 20:00] envelope`)
    } else {
      console.log(`[verify-published-reference] Cairo Maghrib ${cairo.dates[0].maghrib} ✓`)
    }
  }

  if (!existsSync(dirname(OUT_PATH))) mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, JSON.stringify(records, null, 2))
  console.log(`[esa-egypt] wrote ${records.length} city records to ${OUT_PATH}`)
}

/**
 * Convert Arabic 12-hour-with-meridiem time strings to 24-hour "HH:MM".
 *   "4:24 ص"  → "04:24"    (AM = ص = صباحاً)
 *   "7:40 م"  → "19:40"    (PM = م = مساءً)
 *   "12:51 م" → "12:51"    (noon stays 12)
 *   "12:5 ص"  → "00:05"    (midnight goes to 00)
 */
function arabicTime24(s) {
  const m = s.match(/^(\d{1,2}):(\d{1,2})\s*([صم])/)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const mn = parseInt(m[2], 10)
  const ap = m[3]
  if (ap === 'م' && h !== 12) h += 12
  if (ap === 'ص' && h === 12) h = 0
  if (h < 0 || h > 23 || mn < 0 || mn > 59) return null
  return `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`
}
