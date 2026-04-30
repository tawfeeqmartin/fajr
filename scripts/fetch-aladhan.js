// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch prayer time calendar from Aladhan API for a list of cities.
 *
 * By default, output files land in eval/data/train/. A city may set
 *   outDir: 'test'
 * to route its output to eval/data/test/ instead — used for the holdout
 * stress-test set (extreme latitudes, extreme elevations). The holdout
 * is REPORTED but never optimized against. See CLAUDE.md ratchet rules.
 *
 * Usage: node scripts/fetch-aladhan.js
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CITIES = [
  {
    city: 'Jakarta',
    country: 'Indonesia',
    latitude: -6.2088,
    longitude: 106.8456,
    elevation: 8,
    timezone: 'Asia/Jakarta',
    method: 99,
    methodSettings: '20,null,18',
    methodLabel: 'JAKIM-style (20°/18°)',
    outFile: 'jakarta.json',
    days: 10,
  },
  {
    city: 'Karachi',
    country: 'Pakistan',
    latitude: 24.8607,
    longitude: 67.0011,
    elevation: 10,
    timezone: 'Asia/Karachi',
    method: 1,
    methodLabel: 'Karachi (18°/18°)',
    outFile: 'karachi.json',
    days: 10,
  },
  {
    city: 'Dubai',
    country: 'United Arab Emirates',
    latitude: 25.2048,
    longitude: 55.2708,
    elevation: 5,
    timezone: 'Asia/Dubai',
    method: 4,
    methodLabel: 'Umm al-Qura',
    outFile: 'dubai.json',
    days: 10,
  },
  {
    city: 'Paris',
    country: 'France',
    latitude: 48.8566,
    longitude: 2.3522,
    elevation: 35,
    timezone: 'Europe/Paris',
    method: 99,
    methodSettings: '12,null,12',
    methodLabel: 'UOIF (12°/12°)',
    outFile: 'paris.json',
    days: 10,
  },
  {
    city: 'Toronto',
    country: 'Canada',
    latitude: 43.6532,
    longitude: -79.3832,
    elevation: 76,
    timezone: 'America/Toronto',
    method: 2,
    methodLabel: 'ISNA (15°/15°)',
    outFile: 'toronto.json',
    days: 10,
  },

  // ── Holdout stress-test cities ────────────────────────────────────────────
  // These route to eval/data/test/. They are HOLDOUT — reported by eval.js
  // but not used by the ratchet. They exist to detect overfitting and silent
  // failures at extremes (very high latitude, very high elevation).
  // ─────────────────────────────────────────────────────────────────────────
  {
    city: 'Longyearbyen',
    country: 'Svalbard (Norway)',
    latitude: 78.2232,
    longitude: 15.6267,
    elevation: 5,
    timezone: 'Arctic/Longyearbyen',
    method: 3,                          // MWL
    latitudeAdjustmentMethod: 1,        // AngleBased
    methodLabel: 'MWL + AngleBased (extreme high-latitude)',
    outFile: 'svalbard.json',
    outDir: 'test',
    days: 10,
  },
  {
    city: 'Anchorage',
    country: 'United States',
    latitude: 61.2181,
    longitude: -149.9003,
    elevation: 31,
    timezone: 'America/Anchorage',
    method: 3,                          // MWL
    latitudeAdjustmentMethod: 1,
    methodLabel: 'MWL + AngleBased (Western Hemisphere high-lat)',
    outFile: 'anchorage.json',
    outDir: 'test',
    days: 10,
  },
  {
    city: 'Quito',
    country: 'Ecuador',
    latitude: -0.1807,
    longitude: -78.4678,
    elevation: 2850,
    timezone: 'America/Guayaquil',
    method: 3,                          // MWL
    methodLabel: 'MWL (equatorial high-elevation)',
    outFile: 'quito.json',
    outDir: 'test',
    days: 10,
  },
]

function buildUrl(city) {
  const params = new URLSearchParams({
    latitude:  city.latitude,
    longitude: city.longitude,
    method:    city.method,
  })
  if (city.methodSettings) params.set('methodSettings', city.methodSettings)
  if (city.latitudeAdjustmentMethod !== undefined) {
    params.set('latitudeAdjustmentMethod', city.latitudeAdjustmentMethod)
  }
  return `https://api.aladhan.com/v1/calendar/2026/4?${params}`
}

async function fetchCity(city) {
  const url = buildUrl(city)
  console.log(`Fetching ${city.city}: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${city.city}`)
  const json = await res.json()
  if (json.code !== 200) throw new Error(`API error for ${city.city}: ${JSON.stringify(json)}`)

  const days = json.data.slice(0, city.days).map(entry => {
    const t = entry.timings
    // Times come back with timezone suffix like "04:45 (+07)" — strip it
    const strip = s => s.replace(/\s*\(.*\)/, '').trim()
    // Date comes as "DD-MM-YYYY" from Aladhan
    const [dd, mm, yyyy] = entry.date.gregorian.date.split('-')
    return {
      date: `${yyyy}-${mm}-${dd}`,
      fajr:    strip(t.Fajr),
      sunrise: strip(t.Sunrise),
      dhuhr:   strip(t.Dhuhr),
      asr:     strip(t.Asr),
      maghrib: strip(t.Maghrib),
      isha:    strip(t.Isha),
    }
  })

  return [{
    city: city.city,
    country: city.country,
    latitude: city.latitude,
    longitude: city.longitude,
    elevation: city.elevation,
    timezone: city.timezone,
    method: city.methodLabel.toLowerCase().split(' ')[0],
    source: `Aladhan API (api.aladhan.com) - ${city.methodLabel} method ${city.method}${city.methodSettings ? ` methodSettings=${city.methodSettings}` : ''}`,
    dates: days,
  }]
}

async function main() {
  for (const city of CITIES) {
    try {
      const data = await fetchCity(city)
      const outDir = city.outDir === 'test' ? 'test' : 'train'
      const outPath = join(__dirname, '..', 'eval', 'data', outDir, city.outFile)
      writeFileSync(outPath, JSON.stringify(data, null, 2))
      console.log(`  → wrote ${outPath} (${data[0].dates.length} days)`)
    } catch (err) {
      console.error(`  ERROR: ${err.message}`)
    }
  }
}

main()
