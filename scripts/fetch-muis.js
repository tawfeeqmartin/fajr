// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch official MUIS (Majlis Ugama Islam Singapura — Islamic Religious
 * Council of Singapore) Imsakiyya for the current year.
 *
 * MUIS publishes their annual prayer-time table to data.gov.sg under the
 * Singapore Open Data Licence v1.0. This is the cleanest licensed
 * institutional channel fajr integrates: official, no auth, commercial
 * redistribution explicitly permitted with attribution.
 *
 * Endpoint: data.gov.sg poll-download API returns a presigned S3 URL for
 * the year's CSV. CSV format: Date,Day,Subuh,Syuruk,Zohor,Asar,Maghrib,Isyak.
 * Note Malay column names (Subuh/Syuruk/Zohor/Asar/Maghrib/Isyak — not
 * Fajr/Sunrise/Dhuhr/Asr/Maghrib/Isha).
 *
 * Coverage: single timezone, single location (all of Singapore — MUIS
 * publishes one table for the entire city-state). One fixture, full year
 * (~365 daily entries).
 *
 * Output: eval/data/test/muis.json — holdout (single-region, doesn't gate).
 *
 * Usage: node scripts/fetch-muis.js
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SOURCE_INSTITUTION = 'MUIS (Majlis Ugama Islam Singapura)'

// Per-year resource IDs from data.gov.sg — update annually as MUIS publishes
// each new year (typically Nov/Dec for the following year).
const RESOURCE_IDS = {
  2026: 'd_d441e7242e78efc566024dd5b0d9829c',
  2025: 'd_e81ea2337599b674c4f645c1af93e0dc',
  2024: 'd_dddc19f6c90edd7cff6b57494630ad29',
}

const SINGAPORE = {
  city: 'Singapore',
  country: 'Singapore',
  // Sultan Mosque coordinates — central reference point used by MUIS
  latitude: 1.3024,
  longitude: 103.8590,
  elevation: 0,
  timezone: 'Asia/Singapore',
}

async function pollDownload(resourceId) {
  const url = `https://api-open.data.gov.sg/v1/public/api/datasets/${resourceId}/poll-download`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} polling ${resourceId}`)
  const obj = await res.json()
  if (obj.code !== 0 || obj?.data?.status !== 'DOWNLOAD_SUCCESS') {
    throw new Error(`poll-download not ready: ${JSON.stringify(obj).slice(0,200)}`)
  }
  return obj.data.url
}

async function fetchCsv(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching CSV`)
  return res.text()
}

function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  const header = lines.shift().split(',').map(s => s.trim())
  // Map MUIS Malay column names to fajr-internal field names.
  const idx = {
    date:    header.findIndex(h => /^date$/i.test(h)),
    fajr:    header.findIndex(h => /^subuh$/i.test(h)),
    sunrise: header.findIndex(h => /^syuruk$/i.test(h)),
    dhuhr:   header.findIndex(h => /^zohor$/i.test(h)),
    asr:     header.findIndex(h => /^asar$/i.test(h)),
    maghrib: header.findIndex(h => /^maghrib$/i.test(h)),
    isha:    header.findIndex(h => /^isyak$/i.test(h)),
  }
  for (const [k, v] of Object.entries(idx)) {
    if (v < 0) throw new Error(`CSV missing column for ${k}; got header: ${header.join(',')}`)
  }
  const dates = []
  for (const line of lines) {
    const cells = line.split(',').map(s => s.trim())
    if (cells.length < 8) continue
    const date = cells[idx.date]
    if (!date) continue
    dates.push({
      date,
      fajr:    cells[idx.fajr],
      sunrise: cells[idx.sunrise],
      dhuhr:   cells[idx.dhuhr],
      asr:     cells[idx.asr],
      maghrib: cells[idx.maghrib],
      isha:    cells[idx.isha],
    })
  }
  return dates
}

async function main() {
  const year = new Date().getUTCFullYear()
  const resourceId = RESOURCE_IDS[year] || RESOURCE_IDS[year - 1]
  if (!resourceId) {
    console.error(`No MUIS resource ID for year ${year} or ${year - 1}. Update RESOURCE_IDS in this script.`)
    process.exit(1)
  }
  console.log(`Polling data.gov.sg for resource ${resourceId} (year ${year})…`)
  const presignedUrl = await pollDownload(resourceId)
  console.log(`Got presigned URL; downloading CSV…`)
  const csvText = await fetchCsv(presignedUrl)
  const dates = parseCsv(csvText)
  console.log(`Parsed ${dates.length} daily entries.`)

  const fixture = {
    ...SINGAPORE,
    method: 'muis',
    source: 'MUIS via data.gov.sg poll-download API',
    source_institution: SOURCE_INSTITUTION,
    source_method: `MUIS official Imsakiyya ${year}`,
    source_url: `https://data.gov.sg/datasets/${resourceId}/view`,
    source_license: 'Singapore Open Data Licence v1.0 (commercial use permitted with attribution)',
    source_fetched: new Date().toISOString(),
    dates,
  }

  const outPath = join(__dirname, '..', 'eval', 'data', 'test', 'muis.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify([fixture], null, 2))
  console.log(`→ wrote ${outPath} (1 fixture, ${dates.length} daily entries)`)
}

main()
