// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch institutional Imsakiyya from KEMENAG (Kementerian Agama Republik
 * Indonesia, the Indonesian Ministry of Religious Affairs) — the canonical
 * Indonesian state authority for prayer times.
 *
 * KEMENAG publishes per-kabupaten/kota Imsakiyya at bimasislam.kemenag.go.id.
 * The site uses an undocumented `md5(N)` ID convention for provinces and
 * kabupaten — verified via aproxtimedev/api-jadwal-sholat (TS) and
 * muava12/api-jadwal-shalat-kemenag (PHP) reference implementations, and
 * confirmed live on 2026-05-02 against the production endpoint.
 *
 * Coverage: Indonesia has 34 administrative provinces (KEMENAG's internal
 * list, pre-2022 Papua subdivision). For each province, KEMENAG returns
 * 5–30+ kabupaten/kota. v1 of this script fetches ONE representative
 * kabupaten per province (the provincial capital, identified by a hardcoded
 * city → KEMENAG-kabupaten-name mapping) so the eval-corpus expansion is
 * focused on geographically-spread reference cells without needing per-
 * kabupaten geocoding. A future iteration can expand to all kabupaten via
 * Nominatim geocoding once we determine the value of finer granularity.
 *
 * Output: eval/data/test/kemenag.json — single fixture per province (34
 * fixtures), each containing a full month of daily entries.
 *
 * Usage: node scripts/fetch-kemenag.js
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PROVINCES_PATH = join(__dirname, 'data', 'kemenag-provinces.json')
const PROVINCES = JSON.parse(readFileSync(PROVINCES_PATH, 'utf8')).provinces

const SOURCE_INSTITUTION = 'KEMENAG (Kementerian Agama Republik Indonesia)'
const ORIGIN = 'https://bimasislam.kemenag.go.id'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'

function md5Hex(str) {
  return createHash('md5').update(String(str)).digest('hex')
}

// One PHPSESSID for the whole run. Captured from the initial GET to
// /jadwalshalat. Stored module-globally because every subsequent ajax call
// needs to send the same session cookie.
let phpSessionId = null

async function establishSession() {
  const res = await fetch(`${ORIGIN}/jadwalshalat`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'id,en;q=0.9' },
  })
  if (!res.ok) throw new Error(`session bootstrap failed: HTTP ${res.status}`)
  // node fetch exposes set-cookie via headers.getSetCookie() (node 22+) or
  // headers.raw()['set-cookie'] (older). Try both.
  const setCookies = (res.headers.getSetCookie?.() || []).concat(
    typeof res.headers.raw === 'function' ? (res.headers.raw()['set-cookie'] || []) : []
  )
  for (const c of setCookies) {
    const match = c.match(/PHPSESSID=([^;]+)/)
    if (match) { phpSessionId = match[1]; return }
  }
  // Fallback: parse the single combined cookie header (some node versions).
  const single = res.headers.get('set-cookie')
  if (single) {
    const match = single.match(/PHPSESSID=([^;]+)/)
    if (match) { phpSessionId = match[1]; return }
  }
  throw new Error('PHPSESSID cookie not found in /jadwalshalat response')
}

async function ajaxPost(path, params) {
  if (!phpSessionId) throw new Error('session not established')
  const body = new URLSearchParams(params).toString()
  const res = await fetch(`${ORIGIN}/ajax/${path}`, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Cookie': `PHPSESSID=${phpSessionId}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`)
  return res.text()
}

// `getKabkoshalat` returns an HTML fragment of <option value="<md5>">NAME</option>
// tags. Parse via regex — KEMENAG's response is consistent and small.
function parseOptions(html) {
  const out = []
  const re = /<option\s+value="([^"]+)"[^>]*>\s*([^<]+?)\s*<\/option>/g
  let m
  while ((m = re.exec(html)) !== null) {
    if (m[1] && m[2] && !m[1].startsWith('disabled')) {
      out.push({ id: m[1], name: m[2].trim() })
    }
  }
  return out
}

async function fetchProvinceMonth(prov, opts = {}) {
  const provId = md5Hex(prov.n)
  const kabHtml = await ajaxPost('getKabkoshalat', { x: provId })
  const kabs = parseOptions(kabHtml)
  if (kabs.length === 0) {
    throw new Error(`no kabupaten returned for province n=${prov.n} (${prov.name}); md5 trick may have changed`)
  }

  // Pick the kabupaten by exact name from the registry — pre-verified live to
  // avoid alphabetic-fallback aliasing across provinces.
  const kab = kabs.find(k => k.name === prov.kabupaten)
  if (!kab) {
    const sample = kabs.slice(0, 4).map(k => k.name).join(', ')
    throw new Error(`registry kabupaten "${prov.kabupaten}" not in ${prov.name} kab list (got: ${sample}…)`)
  }

  const now = new Date()
  // Fetch the current local-Indonesia month (UTC offset doesn't change month
  // boundaries enough to matter for any province in May).
  const bln = now.getUTCMonth() + 1
  const thn = now.getUTCFullYear()
  const monthHtml = await ajaxPost('getShalatbln', {
    x: provId, y: kab.id, bln: String(bln), thn: String(thn),
  })

  let parsed
  try {
    parsed = JSON.parse(monthHtml)
  } catch (e) {
    throw new Error(`getShalatbln did not return JSON for ${prov.name}/${kab.name}: ${monthHtml.slice(0, 100)}`)
  }
  if (parsed.status !== 1 || !parsed.data) {
    throw new Error(`getShalatbln status=${parsed.status} for ${prov.name}/${kab.name}: ${parsed.message || ''}`)
  }

  const dates = []
  for (const [date, t] of Object.entries(parsed.data)) {
    // KEMENAG fields: imsak, subuh, terbit, dhuha, dzuhur, ashar, maghrib, isya
    // fajr-internal fields: date, fajr, sunrise, dhuhr, asr, maghrib, isha
    if (!t.subuh || !t.terbit || !t.dzuhur || !t.ashar || !t.maghrib || !t.isya) continue
    dates.push({
      date,
      fajr:    t.subuh,
      sunrise: t.terbit,
      dhuhr:   t.dzuhur,
      asr:     t.ashar,
      maghrib: t.maghrib,
      isha:    t.isya,
    })
  }
  if (dates.length === 0) {
    throw new Error(`no usable date entries returned for ${prov.name}/${kab.name}`)
  }

  return {
    city: prov.capital,
    country: 'Indonesia',
    latitude: prov.lat,
    longitude: prov.lon,
    elevation: 0,
    timezone: prov.tz,
    method: 'kemenag',
    source: `KEMENAG ${prov.name} / ${kab.name}`,
    source_institution: SOURCE_INSTITUTION,
    source_method: `Bimas Islam Imsakiyya — ${prov.name} — ${kab.name}`,
    source_url: `${ORIGIN}/jadwalshalat`,
    source_fetched: new Date().toISOString(),
    dates,
  }
}

async function main() {
  console.log(`Establishing session at ${ORIGIN}/jadwalshalat…`)
  await establishSession()
  console.log(`PHPSESSID=${phpSessionId.slice(0, 8)}…`)

  const fixtures = []
  for (const prov of PROVINCES) {
    console.log(`Fetching n=${prov.n} ${prov.name} (${prov.capital})…`)
    try {
      const f = await fetchProvinceMonth(prov)
      fixtures.push(f)
      console.log(`  → ${f.dates.length} daily entries from ${f.source}`)
    } catch (err) {
      console.error(`  ERROR for ${prov.name}: ${err.message}`)
    }
    // Polite rate limit — KEMENAG is a government site, no published TOS.
    await new Promise(r => setTimeout(r, 1000))
  }

  if (fixtures.length === 0) {
    console.error('No fixtures fetched. Aborting.')
    process.exit(1)
  }

  const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'kemenag.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(fixtures, null, 2))
  const totalDays = fixtures.reduce((s, f) => s + f.dates.length, 0)
  console.log(`→ wrote ${outPath} (${fixtures.length} provinces, ${totalDays} day-entries)`)
}

main()
