// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Fetch prayer time calendar from Aladhan API for a list of cities.
 * Outputs JSON files in the eval/data/train/ format.
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
]

function buildUrl(city) {
  const base = `https://api.aladhan.com/v1/calendar/2026/4?latitude=${city.latitude}&longitude=${city.longitude}&method=${city.method}`
  return city.methodSettings ? `${base}&methodSettings=${city.methodSettings}` : base
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
      const outPath = join(__dirname, '..', 'eval', 'data', 'train', city.outFile)
      writeFileSync(outPath, JSON.stringify(data, null, 2))
      console.log(`  → wrote ${outPath} (${data[0].dates.length} days)`)
    } catch (err) {
      console.error(`  ERROR: ${err.message}`)
    }
  }
}

main()
