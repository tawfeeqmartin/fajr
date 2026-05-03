// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * scripts/build-city-registry.js — emits src/data/cities.json
 *
 * v1.7.0 phase 1 (city-aware location resolver). Reads three input sources
 * and merges them into a single registry of ~300 cities used by
 * detectLocation():
 *
 *   • scripts/data/world-cities.json       — 145 national capitals with
 *                                              lat/lon/elevation/timezone/
 *                                              aladhanMethod/methodLabel
 *   • scripts/data/mawaqit-mosques.json    — 191 active Mawaqit mosques
 *                                              across ~157 unique cities,
 *                                              with country and timezone
 *   • scripts/data/city-method-overrides.json — 12 hand-curated city-level
 *                                                method overrides with
 *                                                institutional citations
 *
 * Plus a hard-coded MUSLIM_POPULATION_CENTERS array of high-Muslim-population
 * non-capital cities (Casablanca, Mecca, Medina, Karachi, Lahore, Mumbai,
 * Lagos, Bradford, Marseille, etc.) that are NOT capitals and NOT in the
 * Mawaqit corpus but matter for the city-detection target.
 *
 * Output schema is documented in src/index.d.ts (City interface). Per-city
 * bbox is computed from a population-weighted radius:
 *
 *   pop ≥ 5,000,000  → 0.40°
 *   pop ≥ 1,000,000  → 0.30°
 *   pop ≥   500,000  → 0.20°
 *   pop ≥   100,000  → 0.15°
 *   pop <    100,000 → 0.10°
 *
 * Cities are sorted by bbox area ascending so the linear scan in
 * detectLocation() returns the smallest (most specific) match first.
 *
 * Per CLAUDE.md: Wikipedia is not authoritative for fiqh. The city-level
 * method overrides come from scripts/data/city-method-overrides.json which
 * cites institutional publishers per row. This script does not derive any
 * new override decisions — it only merges the curated input.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const ROOT       = path.resolve(__dirname, '..')

// ─────────────────────────────────────────────────────────────────────────────
// Load inputs
// ─────────────────────────────────────────────────────────────────────────────

const worldCities = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'scripts/data/world-cities.json'), 'utf-8'))
const mawaqit = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'scripts/data/mawaqit-mosques.json'), 'utf-8'))
const overrides = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'scripts/data/city-method-overrides.json'), 'utf-8'))

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ISO-2 lookup from country name (used for Mawaqit entries which
// only have country names, and for the manual MUSLIM_POPULATION_CENTERS).
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRY_NAME_TO_ISO = {}
for (const bucket of ['OIC_member_states', 'diaspora_significant']) {
  for (const [iso, row] of Object.entries(worldCities[bucket] || {})) {
    if (typeof row === 'object' && row !== null) {
      COUNTRY_NAME_TO_ISO[row.country] = iso
    }
  }
}
// Common alternates that appear in the Mawaqit corpus:
COUNTRY_NAME_TO_ISO['United Kingdom'] = 'GB'
COUNTRY_NAME_TO_ISO['United States']  = 'US'
COUNTRY_NAME_TO_ISO['South Korea']    = 'KR'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ISO-2 → engine country key (the string returned by detectCountry)
// — used so altMethods source notes can refer to the engine's country key.
// ─────────────────────────────────────────────────────────────────────────────

const ISO_TO_ENGINE_COUNTRY = {
  'MA': 'Morocco',  'TN': 'Tunisia',  'DZ': 'Algeria',  'LY': 'Libya',
  'BH': 'Bahrain',  'QA': 'Qatar',    'KW': 'Kuwait',   'AE': 'UAE',
  'OM': 'Oman',     'YE': 'Yemen',    'PS': 'Palestine','IL': 'Israel',
  'LB': 'Lebanon',  'JO': 'Jordan',   'SY': 'Syria',    'IQ': 'Iraq',
  'GE': 'Georgia',  'AZ': 'Azerbaijan','AM': 'Armenia', 'IR': 'Iran',
  'TJ': 'Tajikistan','TM': 'Turkmenistan','KG': 'Kyrgyzstan',
  'UZ': 'Uzbekistan','KZ': 'Kazakhstan','SA': 'SaudiArabia','TR': 'Turkey',
  'XK': 'Kosovo',   'AL': 'Albania',  'ME': 'Montenegro','MK': 'NorthMacedonia',
  'BA': 'Bosnia',   'RS': 'Serbia',   'SI': 'Slovenia','HR': 'Croatia',
  'BG': 'Bulgaria', 'GR': 'Greece',   'RO': 'Romania', 'MD': 'Moldova',
  'UA': 'Ukraine',  'BY': 'Belarus',  'SK': 'Slovakia','HU': 'Hungary',
  'CZ': 'Czechia',  'PL': 'Poland',   'LT': 'Lithuania','LV': 'Latvia',
  'EE': 'Estonia',  'AT': 'Austria',  'CH': 'Switzerland','DE': 'Germany',
  'BE': 'Belgium',  'NL': 'Netherlands','DK': 'Denmark','SE': 'Sweden',
  'EG': 'Egypt',    'DJ': 'Djibouti', 'ER': 'Eritrea', 'SO': 'Somalia',
  'SS': 'SouthSudan','ET': 'Ethiopia','SD': 'Sudan',
  'CV': 'CapeVerde','GM': 'Gambia',   'GW': 'GuineaBissau','SN': 'Senegal',
  'MR': 'Mauritania','SL': 'SierraLeone','LR': 'Liberia','GN': 'Guinea',
  'CI': 'CoteDIvoire','TG': 'Togo',   'GH': 'Ghana',   'BJ': 'Benin',
  'BF': 'BurkinaFaso','ML': 'Mali',   'NE': 'Niger',   'NG': 'Nigeria',
  'TD': 'Chad',     'CM': 'Cameroon',
  'ST': 'SaoTomeAndPrincipe','GQ': 'EquatorialGuinea','GA': 'Gabon',
  'CG': 'RepublicOfTheCongo','CF': 'CentralAfricanRepublic','CD': 'DRCongo',
  'GB': 'UK',       'BN': 'Brunei',   'SG': 'Singapore','MY': 'Malaysia',
  'KH': 'Cambodia', 'TH': 'Thailand', 'MM': 'Myanmar', 'PH': 'Philippines',
  'US': 'USA',      'BO': 'Bolivia',  'CO': 'Colombia','EC': 'Ecuador',
  'ID': 'Indonesia',
  'MV': 'Maldives', 'LK': 'SriLanka', 'PK': 'Pakistan','AF': 'Afghanistan',
  'BD': 'Bangladesh','IN': 'India',
  'MU': 'Mauritius','SC': 'Seychelles','KM': 'Comoros','MG': 'Madagascar',
  'BI': 'Burundi',  'RW': 'Rwanda',   'UG': 'Uganda',  'MW': 'Malawi',
  'KE': 'Kenya',    'TZ': 'Tanzania', 'MZ': 'Mozambique','SZ': 'Eswatini',
  'LS': 'Lesotho',  'NA': 'Namibia',  'BW': 'Botswana','ZW': 'Zimbabwe',
  'ZM': 'Zambia',   'AO': 'Angola',   'ZA': 'SouthAfrica',
  'FR': 'France',   'CA': 'Canada',   'FI': 'Finland', 'IS': 'Iceland',
  'NO': 'Norway',
  // v1.7.8 (#54) Tier 2: new country additions
  'HK': 'HongKong', 'CY': 'Cyprus',   'YT': 'Mayotte', 'EH': 'WesternSahara',
  'RE': 'Reunion',
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: country name → engine country key (used when constructing country
// fallbacks for Mawaqit-derived rows).
// ─────────────────────────────────────────────────────────────────────────────

function isoToEngineCountry(iso) {
  return ISO_TO_ENGINE_COUNTRY[iso] || null
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: country → method-name string (mirrors selectMethod() switch cases
// without depending on adhan.js — returns just the method NAME a downstream
// caller can use as the prayerTimes `method` override, or as a hint).
// Mirrors src/engine.js selectMethod() string keys; updated in lockstep.
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRY_DEFAULT_METHOD = {
  'Morocco':       'Morocco',
  'SaudiArabia':   'UmmAlQura',
  'Turkey':        'Diyanet',
  'Egypt':         'Egyptian',
  'UK':            'MoonsightingCommittee',
  'Malaysia':      'JAKIM',
  'USA':           'ISNA',
  'Bolivia':       'MWL',
  'Colombia':      'MWL',
  'Ecuador':       'MWL',
  'Indonesia':     'JAKIM',  // adhan Singapore() shape
  'Pakistan':      'Karachi',
  'UAE':           'UmmAlQura',
  'Qatar':         'Qatar',
  'Kuwait':        'Kuwait',
  'Bahrain':       'Kuwait',
  'Oman':          'Kuwait',
  'Yemen':         'Kuwait',
  'Iran':          'Tehran',
  'SouthAfrica':   'MWL',
  'Brunei':        'JAKIM',
  'Singapore':     'MUIS',
  'France':        'UOIF',
  'Canada':        'ISNA',
  'Norway':        'MWL',     // + MiddleOfTheNight high-lat rule
  'Iceland':       'MWL',     // + MiddleOfTheNight
  'Finland':       'MWL',     // + TwilightAngle
  'Tunisia':       'Tunisia',
  'Algeria':       'Algeria',
  'Libya':         'Egyptian',
  'Mauritania':    'MWL',
  'Palestine':     'Egyptian',
  'Lebanon':       'Egyptian',
  'Jordan':        'Jordan',
  'Syria':         'Egyptian',
  'Iraq':          'Egyptian',
  'Georgia':       'Diyanet',
  'Azerbaijan':    'Tehran',
  'Tajikistan':    'MWL',
  'Turkmenistan':  'MWL',
  'Kyrgyzstan':    'MWL',
  'Uzbekistan':    'MWL',
  'Kazakhstan':    'MWL',
  'Albania':       'Diyanet',
  'Kosovo':        'Diyanet',
  'Bosnia':        'Diyanet',
  'Djibouti':      'MWL',
  'Eritrea':       'MWL',
  'Somalia':       'MWL',
  'SouthSudan':    'MWL',
  'Ethiopia':      'MWL',
  'Sudan':         'Egyptian',
  'Gambia':        'MWL',
  'Senegal':       'MWL',
  'SierraLeone':   'MWL',
  'Guinea':        'MWL',
  'CoteDIvoire':   'MWL',
  'Ghana':         'MWL',
  'BurkinaFaso':   'MWL',
  'Mali':          'MWL',
  'Niger':         'MWL',
  'Nigeria':       'MWL',
  'Chad':          'MWL',
  'Cameroon':      'MWL',
  'Comoros':       'MWL',
  'Madagascar':    'MWL',
  'Kenya':         'MWL',
  'Tanzania':      'MWL',
  'Mozambique':    'MWL',
  'Maldives':      'Karachi',
  'SriLanka':      'Karachi',
  'Bangladesh':    'Karachi',
  'Afghanistan':   'Karachi',
  'India':         'Karachi',
  'Cambodia':      'MUIS',
  'Thailand':      'MWL',
  'Myanmar':       'MWL',
  'Philippines':   'MWL',
  // v1.7.8 (#54) Tier 2 — new countries
  'HongKong':      'Karachi',
  'Cyprus':        'Diyanet',
  'Mayotte':       'Egyptian',
  'WesternSahara': 'Morocco',
  'Reunion':       'UOIF',
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSLIM_POPULATION_CENTERS — high-Muslim-population non-capital cities that
// are NOT in worldCities.OIC_member_states / diaspora_significant AND are
// either absent from the Mawaqit corpus or need supplementary lat/lon/elevation.
//
// Each row: { name, countryISO, lat, lon, elevation, timezone, population,
// adminRegion, nameLocal? }. Population figures are city-proper or
// metropolitan-area latest-reasonably-sourced figures (UN World Cities, World
// Population Review 2024–2025). Elevation in metres. Timezone is IANA.
// ─────────────────────────────────────────────────────────────────────────────

const MUSLIM_POPULATION_CENTERS = [
  // ─── Saudi Arabia non-capital ─────────────────────────────────────────────
  { name: 'Mecca',      nameLocal: 'مكة المكرمة', countryISO: 'SA', adminRegion: 'Makkah', lat: 21.4225, lon: 39.8262, elevation: 277, timezone: 'Asia/Riyadh', population: 2042000 },
  { name: 'Medina',     nameLocal: 'المدينة المنورة', countryISO: 'SA', adminRegion: 'Madinah', lat: 24.4686, lon: 39.6142, elevation: 608, timezone: 'Asia/Riyadh', population: 1488000 },
  { name: 'Jeddah',     nameLocal: 'جدة', countryISO: 'SA', adminRegion: 'Makkah', lat: 21.4858, lon: 39.1925, elevation: 12, timezone: 'Asia/Riyadh', population: 4781000 },
  { name: 'Dammam',     nameLocal: 'الدمام', countryISO: 'SA', adminRegion: 'Eastern Province', lat: 26.3927, lon: 49.9777, elevation: 10, timezone: 'Asia/Riyadh', population: 1252000 },
  { name: 'Taif',       nameLocal: 'الطائف', countryISO: 'SA', adminRegion: 'Makkah', lat: 21.2703, lon: 40.4158, elevation: 1879, timezone: 'Asia/Riyadh', population: 688000 },

  // ─── UAE non-capital ──────────────────────────────────────────────────────
  { name: 'Dubai',      nameLocal: 'دبي', countryISO: 'AE', adminRegion: 'Dubai Emirate', lat: 25.2048, lon: 55.2708, elevation: 5, timezone: 'Asia/Dubai', population: 3604000 },
  { name: 'Sharjah',    nameLocal: 'الشارقة', countryISO: 'AE', adminRegion: 'Sharjah Emirate', lat: 25.3463, lon: 55.4209, elevation: 14, timezone: 'Asia/Dubai', population: 1684000 },

  // ─── Egypt ────────────────────────────────────────────────────────────────
  { name: 'Alexandria', nameLocal: 'الإسكندرية', countryISO: 'EG', adminRegion: 'Alexandria', lat: 31.2001, lon: 29.9187, elevation: 5, timezone: 'Africa/Cairo', population: 5380000 },
  { name: 'Giza',       nameLocal: 'الجيزة', countryISO: 'EG', adminRegion: 'Giza', lat: 30.0131, lon: 31.2089, elevation: 30, timezone: 'Africa/Cairo', population: 9200000 },

  // ─── Iraq (Mosul/Najaf/Karbala/Basra are in city-method-overrides; here add Erbil/Sulaymaniyah/Kirkuk) ─
  { name: 'Erbil',      nameLocal: 'أربيل', countryISO: 'IQ', adminRegion: 'Erbil Governorate', lat: 36.1911, lon: 44.0094, elevation: 415, timezone: 'Asia/Baghdad', population: 1612000 },
  { name: 'Sulaymaniyah', nameLocal: 'السليمانية', countryISO: 'IQ', adminRegion: 'Sulaymaniyah Governorate', lat: 35.5556, lon: 45.4329, elevation: 882, timezone: 'Asia/Baghdad', population: 878000 },

  // ─── Levant ───────────────────────────────────────────────────────────────
  { name: 'Aleppo',     nameLocal: 'حلب', countryISO: 'SY', adminRegion: 'Aleppo', lat: 36.2021, lon: 37.1343, elevation: 379, timezone: 'Asia/Damascus', population: 1834000 },
  { name: 'Homs',       nameLocal: 'حمص', countryISO: 'SY', adminRegion: 'Homs', lat: 34.7269, lon: 36.7234, elevation: 501, timezone: 'Asia/Damascus', population: 775000 },
  { name: 'Tripoli',    nameLocal: 'طرابلس', countryISO: 'LB', adminRegion: 'North Governorate', lat: 34.4332, lon: 35.8441, elevation: 5, timezone: 'Asia/Beirut', population: 730000 },
  { name: 'Sidon',      nameLocal: 'صيدا', countryISO: 'LB', adminRegion: 'South Governorate', lat: 33.5631, lon: 35.3689, elevation: 8, timezone: 'Asia/Beirut', population: 215000 },
  { name: 'Zarqa',      nameLocal: 'الزرقاء', countryISO: 'JO', adminRegion: 'Zarqa', lat: 32.0728, lon: 36.0876, elevation: 619, timezone: 'Asia/Amman', population: 635000 },
  { name: 'Irbid',      nameLocal: 'إربد', countryISO: 'JO', adminRegion: 'Irbid', lat: 32.5556, lon: 35.8500, elevation: 620, timezone: 'Asia/Amman', population: 569000 },
  { name: 'Aden',       nameLocal: 'عدن', countryISO: 'YE', adminRegion: 'Aden', lat: 12.7855, lon: 45.0187, elevation: 6, timezone: 'Asia/Aden', population: 855000 },

  // ─── Pakistan non-capital (Karachi etc.) ──────────────────────────────────
  { name: 'Karachi',    nameLocal: 'کراچی', countryISO: 'PK', adminRegion: 'Sindh', lat: 24.8607, lon: 67.0011, elevation: 8, timezone: 'Asia/Karachi', population: 16459000 },
  { name: 'Lahore',     nameLocal: 'لاہور', countryISO: 'PK', adminRegion: 'Punjab', lat: 31.5497, lon: 74.3436, elevation: 217, timezone: 'Asia/Karachi', population: 13096000 },
  { name: 'Faisalabad', nameLocal: 'فیصل آباد', countryISO: 'PK', adminRegion: 'Punjab', lat: 31.4187, lon: 73.0791, elevation: 184, timezone: 'Asia/Karachi', population: 3630000 },
  { name: 'Rawalpindi', nameLocal: 'راولپنڈی', countryISO: 'PK', adminRegion: 'Punjab', lat: 33.5651, lon: 73.0169, elevation: 508, timezone: 'Asia/Karachi', population: 2099000 },
  { name: 'Multan',     nameLocal: 'ملتان', countryISO: 'PK', adminRegion: 'Punjab', lat: 30.1575, lon: 71.5249, elevation: 122, timezone: 'Asia/Karachi', population: 1872000 },
  { name: 'Peshawar',   nameLocal: 'پشاور', countryISO: 'PK', adminRegion: 'Khyber Pakhtunkhwa', lat: 34.0151, lon: 71.5249, elevation: 359, timezone: 'Asia/Karachi', population: 1970000 },
  { name: 'Quetta',     nameLocal: 'کوئٹہ', countryISO: 'PK', adminRegion: 'Balochistan', lat: 30.1798, lon: 66.9750, elevation: 1654, timezone: 'Asia/Karachi', population: 1001000 },

  // ─── India non-capital ────────────────────────────────────────────────────
  { name: 'Mumbai',     nameLocal: 'मुंबई', countryISO: 'IN', adminRegion: 'Maharashtra', lat: 19.0760, lon: 72.8777, elevation: 14, timezone: 'Asia/Kolkata', population: 12478000 },
  { name: 'Bangalore',  nameLocal: 'ಬೆಂಗಳೂರು', countryISO: 'IN', adminRegion: 'Karnataka', lat: 12.9716, lon: 77.5946, elevation: 920, timezone: 'Asia/Kolkata', population: 8443000 },
  { name: 'Hyderabad',  nameLocal: 'حیدرآباد', countryISO: 'IN', adminRegion: 'Telangana', lat: 17.3850, lon: 78.4867, elevation: 542, timezone: 'Asia/Kolkata', population: 6993000 },
  { name: 'Chennai',    nameLocal: 'சென்னை', countryISO: 'IN', adminRegion: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, elevation: 7, timezone: 'Asia/Kolkata', population: 7088000 },
  { name: 'Kolkata',    nameLocal: 'কলকাতা', countryISO: 'IN', adminRegion: 'West Bengal', lat: 22.5726, lon: 88.3639, elevation: 9, timezone: 'Asia/Kolkata', population: 4496000 },
  { name: 'Lucknow',    nameLocal: 'لکھنؤ', countryISO: 'IN', adminRegion: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, elevation: 123, timezone: 'Asia/Kolkata', population: 2817000 },
  { name: 'Ahmedabad',  nameLocal: 'અમદાવાદ', countryISO: 'IN', adminRegion: 'Gujarat', lat: 23.0225, lon: 72.5714, elevation: 53, timezone: 'Asia/Kolkata', population: 5570000 },
  { name: 'Pune',       countryISO: 'IN', adminRegion: 'Maharashtra', lat: 18.5204, lon: 73.8567, elevation: 560, timezone: 'Asia/Kolkata', population: 3115000 },
  { name: 'Jaipur',     nameLocal: 'जयपुर', countryISO: 'IN', adminRegion: 'Rajasthan', lat: 26.9124, lon: 75.7873, elevation: 431, timezone: 'Asia/Kolkata', population: 3046000 },
  { name: 'Bhopal',     nameLocal: 'भोपाल', countryISO: 'IN', adminRegion: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, elevation: 527, timezone: 'Asia/Kolkata', population: 1798000 },
  { name: 'Srinagar',   nameLocal: 'سِرینَگَر', countryISO: 'IN', adminRegion: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973, elevation: 1585, timezone: 'Asia/Kolkata', population: 1180000 },
  { name: 'Kochi',      nameLocal: 'കൊച്ചി', countryISO: 'IN', adminRegion: 'Kerala', lat: 9.9312, lon: 76.2673, elevation: 7, timezone: 'Asia/Kolkata', population: 677000 },
  { name: 'Kanpur',     countryISO: 'IN', adminRegion: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, elevation: 126, timezone: 'Asia/Kolkata', population: 2767000 },

  // ─── Bangladesh non-capital ───────────────────────────────────────────────
  { name: 'Chittagong', nameLocal: 'চট্টগ্রাম', countryISO: 'BD', adminRegion: 'Chittagong Division', lat: 22.3569, lon: 91.7832, elevation: 5, timezone: 'Asia/Dhaka', population: 2592000 },
  { name: 'Khulna',     nameLocal: 'খুলনা', countryISO: 'BD', adminRegion: 'Khulna Division', lat: 22.8456, lon: 89.5403, elevation: 9, timezone: 'Asia/Dhaka', population: 663000 },
  { name: 'Sylhet',     nameLocal: 'সিলেট', countryISO: 'BD', adminRegion: 'Sylhet Division', lat: 24.8949, lon: 91.8687, elevation: 35, timezone: 'Asia/Dhaka', population: 526000 },
  { name: 'Rajshahi',   nameLocal: 'রাজশাহী', countryISO: 'BD', adminRegion: 'Rajshahi Division', lat: 24.3636, lon: 88.6241, elevation: 18, timezone: 'Asia/Dhaka', population: 760000 },

  // ─── Indonesia non-capital ────────────────────────────────────────────────
  { name: 'Surabaya',   countryISO: 'ID', adminRegion: 'East Java', lat: -7.2575, lon: 112.7521, elevation: 5, timezone: 'Asia/Jakarta', population: 2874000 },
  { name: 'Bandung',    countryISO: 'ID', adminRegion: 'West Java', lat: -6.9175, lon: 107.6191, elevation: 768, timezone: 'Asia/Jakarta', population: 2444000 },
  { name: 'Medan',      countryISO: 'ID', adminRegion: 'North Sumatra', lat: 3.5952, lon: 98.6722, elevation: 25, timezone: 'Asia/Jakarta', population: 2435000 },
  { name: 'Semarang',   countryISO: 'ID', adminRegion: 'Central Java', lat: -6.9667, lon: 110.4167, elevation: 2, timezone: 'Asia/Jakarta', population: 1654000 },
  { name: 'Makassar',   countryISO: 'ID', adminRegion: 'South Sulawesi', lat: -5.1477, lon: 119.4327, elevation: 8, timezone: 'Asia/Makassar', population: 1423000 },
  { name: 'Palembang',  countryISO: 'ID', adminRegion: 'South Sumatra', lat: -2.9909, lon: 104.7565, elevation: 3, timezone: 'Asia/Jakarta', population: 1668000 },

  // ─── Malaysia non-capital ─────────────────────────────────────────────────
  { name: 'Shah Alam',  countryISO: 'MY', adminRegion: 'Selangor', lat: 3.0731, lon: 101.5183, elevation: 28, timezone: 'Asia/Kuala_Lumpur', population: 740000 },
  { name: 'George Town', countryISO: 'MY', adminRegion: 'Penang', lat: 5.4141, lon: 100.3288, elevation: 4, timezone: 'Asia/Kuala_Lumpur', population: 708000 },
  { name: 'Johor Bahru', countryISO: 'MY', adminRegion: 'Johor', lat: 1.4927, lon: 103.7414, elevation: 26, timezone: 'Asia/Kuala_Lumpur', population: 858000 },
  { name: 'Kuching',    countryISO: 'MY', adminRegion: 'Sarawak', lat: 1.5533, lon: 110.3592, elevation: 27, timezone: 'Asia/Kuching', population: 325000 },
  { name: 'Kota Kinabalu', countryISO: 'MY', adminRegion: 'Sabah', lat: 5.9804, lon: 116.0735, elevation: 3, timezone: 'Asia/Kuching', population: 458000 },
  { name: 'Kota Bharu', countryISO: 'MY', adminRegion: 'Kelantan', lat: 6.1254, lon: 102.2386, elevation: 8, timezone: 'Asia/Kuala_Lumpur', population: 314000 },

  // ─── Africa: Morocco non-capital ──────────────────────────────────────────
  { name: 'Casablanca', nameLocal: 'الدار البيضاء', countryISO: 'MA', adminRegion: 'Casablanca-Settat', lat: 33.5731, lon: -7.5898, elevation: 27, timezone: 'Africa/Casablanca', population: 3460000 },
  { name: 'Marrakech',  nameLocal: 'مراكش', countryISO: 'MA', adminRegion: 'Marrakech-Safi', lat: 31.6295, lon: -7.9811, elevation: 466, timezone: 'Africa/Casablanca', population: 928000 },
  { name: 'Fes',        nameLocal: 'فاس', countryISO: 'MA', adminRegion: 'Fès-Meknès', lat: 34.0331, lon: -5.0003, elevation: 408, timezone: 'Africa/Casablanca', population: 1112000 },
  { name: 'Tangier',    nameLocal: 'طنجة', countryISO: 'MA', adminRegion: 'Tanger-Tétouan-Al Hoceima', lat: 35.7595, lon: -5.8340, elevation: 18, timezone: 'Africa/Casablanca', population: 947000 },
  { name: 'Agadir',     nameLocal: 'أكادير', countryISO: 'MA', adminRegion: 'Souss-Massa', lat: 30.4278, lon: -9.5981, elevation: 74, timezone: 'Africa/Casablanca', population: 421000 },
  { name: 'Meknes',     nameLocal: 'مكناس', countryISO: 'MA', adminRegion: 'Fès-Meknès', lat: 33.8935, lon: -5.5473, elevation: 552, timezone: 'Africa/Casablanca', population: 632000 },
  { name: 'Oujda',      nameLocal: 'وجدة', countryISO: 'MA', adminRegion: 'Oriental', lat: 34.6814, lon: -1.9086, elevation: 470, timezone: 'Africa/Casablanca', population: 494000 },
  { name: 'Kenitra',    nameLocal: 'القنيطرة', countryISO: 'MA', adminRegion: 'Rabat-Salé-Kénitra', lat: 34.2610, lon: -6.5802, elevation: 15, timezone: 'Africa/Casablanca', population: 431000 },
  { name: 'Sale',       nameLocal: 'سلا', countryISO: 'MA', adminRegion: 'Rabat-Salé-Kénitra', lat: 34.0531, lon: -6.7985, elevation: 47, timezone: 'Africa/Casablanca', population: 890000 },
  { name: 'Tetouan',    nameLocal: 'تطوان', countryISO: 'MA', adminRegion: 'Tanger-Tétouan-Al Hoceima', lat: 35.5712, lon: -5.3727, elevation: 8, timezone: 'Africa/Casablanca', population: 380000 },

  // ─── Africa: Algeria/Tunisia/Libya non-capital ───────────────────────────
  { name: 'Oran',       nameLocal: 'وهران', countryISO: 'DZ', adminRegion: 'Oran Province', lat: 35.6976, lon: -0.6337, elevation: 0, timezone: 'Africa/Algiers', population: 1454000 },
  { name: 'Constantine', nameLocal: 'قسنطينة', countryISO: 'DZ', adminRegion: 'Constantine Province', lat: 36.3650, lon: 6.6147, elevation: 640, timezone: 'Africa/Algiers', population: 938000 },
  { name: 'Sfax',       nameLocal: 'صفاقس', countryISO: 'TN', adminRegion: 'Sfax Governorate', lat: 34.7406, lon: 10.7603, elevation: 21, timezone: 'Africa/Tunis', population: 955000 },
  { name: 'Sousse',     nameLocal: 'سوسة', countryISO: 'TN', adminRegion: 'Sousse Governorate', lat: 35.8256, lon: 10.6411, elevation: 6, timezone: 'Africa/Tunis', population: 271000 },
  { name: 'Benghazi',   nameLocal: 'بنغازي', countryISO: 'LY', adminRegion: 'Benghazi District', lat: 32.1175, lon: 20.0680, elevation: 25, timezone: 'Africa/Tripoli', population: 807000 },

  // ─── Africa: Sudan/Ethiopia/Somalia non-capital ──────────────────────────
  { name: 'Omdurman',   nameLocal: 'أم درمان', countryISO: 'SD', adminRegion: 'Khartoum State', lat: 15.6446, lon: 32.4778, elevation: 381, timezone: 'Africa/Khartoum', population: 2805000 },

  // ─── Africa: Nigeria non-capital ──────────────────────────────────────────
  { name: 'Lagos',      countryISO: 'NG', adminRegion: 'Lagos State', lat: 6.5244, lon: 3.3792, elevation: 14, timezone: 'Africa/Lagos', population: 15388000 },
  { name: 'Kano',       countryISO: 'NG', adminRegion: 'Kano State', lat: 12.0022, lon: 8.5920, elevation: 481, timezone: 'Africa/Lagos', population: 4103000 },
  { name: 'Sokoto',     countryISO: 'NG', adminRegion: 'Sokoto State', lat: 13.0059, lon: 5.2476, elevation: 305, timezone: 'Africa/Lagos', population: 638000 },
  { name: 'Kaduna',     countryISO: 'NG', adminRegion: 'Kaduna State', lat: 10.5222, lon: 7.4383, elevation: 632, timezone: 'Africa/Lagos', population: 1582000 },
  { name: 'Ibadan',     countryISO: 'NG', adminRegion: 'Oyo State', lat: 7.3775, lon: 3.9470, elevation: 234, timezone: 'Africa/Lagos', population: 3552000 },

  // ─── Africa: East Africa non-capital ──────────────────────────────────────
  { name: 'Mombasa',    countryISO: 'KE', adminRegion: 'Mombasa County', lat: -4.0435, lon: 39.6682, elevation: 50, timezone: 'Africa/Nairobi', population: 1208000 },
  { name: 'Zanzibar',   nameLocal: 'زنجبار', countryISO: 'TZ', adminRegion: 'Zanzibar Urban/West', lat: -6.1659, lon: 39.2026, elevation: 6, timezone: 'Africa/Dar_es_Salaam', population: 593000 },

  // ─── Africa: Southern Africa non-capital ─────────────────────────────────
  { name: 'Cape Town',  countryISO: 'ZA', adminRegion: 'Western Cape', lat: -33.9249, lon: 18.4241, elevation: 25, timezone: 'Africa/Johannesburg', population: 4710000 },
  { name: 'Johannesburg', countryISO: 'ZA', adminRegion: 'Gauteng', lat: -26.2041, lon: 28.0473, elevation: 1753, timezone: 'Africa/Johannesburg', population: 5783000 },
  { name: 'Durban',     countryISO: 'ZA', adminRegion: 'KwaZulu-Natal', lat: -29.8587, lon: 31.0218, elevation: 36, timezone: 'Africa/Johannesburg', population: 3729000 },

  // ─── Iran non-capital ─────────────────────────────────────────────────────
  { name: 'Mashhad',    nameLocal: 'مشهد', countryISO: 'IR', adminRegion: 'Razavi Khorasan', lat: 36.2974, lon: 59.6067, elevation: 985, timezone: 'Asia/Tehran', population: 3372000 },
  { name: 'Isfahan',    nameLocal: 'اصفهان', countryISO: 'IR', adminRegion: 'Isfahan', lat: 32.6539, lon: 51.6660, elevation: 1574, timezone: 'Asia/Tehran', population: 2220000 },
  { name: 'Shiraz',     nameLocal: 'شیراز', countryISO: 'IR', adminRegion: 'Fars', lat: 29.5918, lon: 52.5836, elevation: 1500, timezone: 'Asia/Tehran', population: 1869000 },
  { name: 'Qom',        nameLocal: 'قم', countryISO: 'IR', adminRegion: 'Qom', lat: 34.6416, lon: 50.8746, elevation: 928, timezone: 'Asia/Tehran', population: 1292000 },

  // ─── Turkey non-capital ───────────────────────────────────────────────────
  { name: 'Istanbul',   nameLocal: 'İstanbul', countryISO: 'TR', adminRegion: 'Istanbul Province', lat: 41.0082, lon: 28.9784, elevation: 39, timezone: 'Europe/Istanbul', population: 15462000 },
  { name: 'Izmir',      countryISO: 'TR', adminRegion: 'Izmir Province', lat: 38.4237, lon: 27.1428, elevation: 25, timezone: 'Europe/Istanbul', population: 4367000 },
  { name: 'Bursa',      countryISO: 'TR', adminRegion: 'Bursa Province', lat: 40.1885, lon: 29.0610, elevation: 100, timezone: 'Europe/Istanbul', population: 3139000 },
  { name: 'Adana',      countryISO: 'TR', adminRegion: 'Adana Province', lat: 37.0000, lon: 35.3213, elevation: 23, timezone: 'Europe/Istanbul', population: 1769000 },
  { name: 'Konya',      countryISO: 'TR', adminRegion: 'Konya Province', lat: 37.8746, lon: 32.4932, elevation: 1016, timezone: 'Europe/Istanbul', population: 2296000 },

  // ─── Europe diaspora non-capital ──────────────────────────────────────────
  { name: 'Birmingham', countryISO: 'GB', adminRegion: 'West Midlands', lat: 52.4862, lon: -1.8904, elevation: 140, timezone: 'Europe/London', population: 1145000 },
  { name: 'Manchester', countryISO: 'GB', adminRegion: 'Greater Manchester', lat: 53.4808, lon: -2.2426, elevation: 38, timezone: 'Europe/London', population: 553000 },
  { name: 'Leicester',  countryISO: 'GB', adminRegion: 'East Midlands', lat: 52.6369, lon: -1.1398, elevation: 67, timezone: 'Europe/London', population: 368000 },
  { name: 'Glasgow',    countryISO: 'GB', adminRegion: 'Scotland', lat: 55.8642, lon: -4.2518, elevation: 39, timezone: 'Europe/London', population: 633000 },
  { name: 'Marseille',  countryISO: 'FR', adminRegion: "Provence-Alpes-Côte d'Azur", lat: 43.2965, lon: 5.3698, elevation: 12, timezone: 'Europe/Paris', population: 870000 },
  { name: 'Lyon',       countryISO: 'FR', adminRegion: 'Auvergne-Rhône-Alpes', lat: 45.7640, lon: 4.8357, elevation: 173, timezone: 'Europe/Paris', population: 522000 },
  { name: 'Lille',      countryISO: 'FR', adminRegion: 'Hauts-de-France', lat: 50.6292, lon: 3.0573, elevation: 21, timezone: 'Europe/Paris', population: 233000 },
  { name: 'Bordeaux',   countryISO: 'FR', adminRegion: 'Nouvelle-Aquitaine', lat: 44.8378, lon: -0.5792, elevation: 22, timezone: 'Europe/Paris', population: 260000 },
  { name: 'Strasbourg', countryISO: 'FR', adminRegion: 'Grand Est', lat: 48.5734, lon: 7.7521, elevation: 142, timezone: 'Europe/Paris', population: 287000 },
  { name: 'Hamburg',    countryISO: 'DE', adminRegion: 'Hamburg', lat: 53.5511, lon: 9.9937, elevation: 6, timezone: 'Europe/Berlin', population: 1899000 },
  { name: 'Munich',     countryISO: 'DE', adminRegion: 'Bavaria', lat: 48.1351, lon: 11.5820, elevation: 520, timezone: 'Europe/Berlin', population: 1488000 },
  { name: 'Frankfurt',  countryISO: 'DE', adminRegion: 'Hesse', lat: 50.1109, lon: 8.6821, elevation: 112, timezone: 'Europe/Berlin', population: 763000 },
  { name: 'Cologne',    countryISO: 'DE', adminRegion: 'North Rhine-Westphalia', lat: 50.9375, lon: 6.9603, elevation: 53, timezone: 'Europe/Berlin', population: 1086000 },
  { name: 'Antwerp',    countryISO: 'BE', adminRegion: 'Antwerp Province', lat: 51.2194, lon: 4.4025, elevation: 8, timezone: 'Europe/Brussels', population: 530000 },
  { name: 'Rotterdam',  countryISO: 'NL', adminRegion: 'South Holland', lat: 51.9244, lon: 4.4777, elevation: 0, timezone: 'Europe/Amsterdam', population: 651000 },
  { name: 'The Hague',  countryISO: 'NL', adminRegion: 'South Holland', lat: 52.0705, lon: 4.3007, elevation: 1, timezone: 'Europe/Amsterdam', population: 552000 },
  { name: 'Malmö',      countryISO: 'SE', adminRegion: 'Skåne County', lat: 55.6050, lon: 13.0038, elevation: 12, timezone: 'Europe/Stockholm', population: 351000 },
  { name: 'Gothenburg', countryISO: 'SE', adminRegion: 'Västra Götaland County', lat: 57.7089, lon: 11.9746, elevation: 12, timezone: 'Europe/Stockholm', population: 583000 },
  { name: 'Zurich',     countryISO: 'CH', adminRegion: 'Zurich Canton', lat: 47.3769, lon: 8.5417, elevation: 408, timezone: 'Europe/Zurich', population: 421000 },
  { name: 'Geneva',     countryISO: 'CH', adminRegion: 'Geneva Canton', lat: 46.2044, lon: 6.1432, elevation: 375, timezone: 'Europe/Zurich', population: 203000 },
  { name: 'Barcelona',  countryISO: 'ES', adminRegion: 'Catalonia', lat: 41.3851, lon: 2.1734, elevation: 12, timezone: 'Europe/Madrid', population: 1620000 },
  { name: 'Milan',      countryISO: 'IT', adminRegion: 'Lombardy', lat: 45.4642, lon: 9.1900, elevation: 120, timezone: 'Europe/Rome', population: 1396000 },

  // ─── Russia (significant Muslim populations in Volga, Caucasus) ──────────
  { name: 'Kazan',      nameLocal: 'Казань', countryISO: 'RU', adminRegion: 'Tatarstan', lat: 55.8304, lon: 49.0661, elevation: 75, timezone: 'Europe/Moscow', population: 1257000 },
  { name: 'Ufa',        nameLocal: 'Уфа', countryISO: 'RU', adminRegion: 'Bashkortostan', lat: 54.7388, lon: 55.9721, elevation: 138, timezone: 'Asia/Yekaterinburg', population: 1148000 },
  { name: 'Makhachkala', nameLocal: 'Махачкала', countryISO: 'RU', adminRegion: 'Dagestan', lat: 42.9849, lon: 47.5047, elevation: 17, timezone: 'Europe/Moscow', population: 624000 },

  // ─── Uzbekistan / Central Asia ───────────────────────────────────────────
  { name: 'Tashkent',   nameLocal: 'Toshkent', countryISO: 'UZ', adminRegion: 'Tashkent', lat: 41.2995, lon: 69.2401, elevation: 455, timezone: 'Asia/Tashkent', population: 2571000 },
  { name: 'Samarkand',  nameLocal: 'Samarqand', countryISO: 'UZ', adminRegion: 'Samarqand Region', lat: 39.6542, lon: 66.9597, elevation: 705, timezone: 'Asia/Samarkand', population: 546000 },

  // ─── North America non-capital ───────────────────────────────────────────
  { name: 'New York',   countryISO: 'US', adminRegion: 'New York', lat: 40.7128, lon: -74.0060, elevation: 10, timezone: 'America/New_York', population: 8336000 },
  { name: 'Chicago',    countryISO: 'US', adminRegion: 'Illinois', lat: 41.8781, lon: -87.6298, elevation: 181, timezone: 'America/Chicago', population: 2746000 },
  { name: 'Los Angeles', countryISO: 'US', adminRegion: 'California', lat: 34.0522, lon: -118.2437, elevation: 71, timezone: 'America/Los_Angeles', population: 3898000 },
  { name: 'Houston',    countryISO: 'US', adminRegion: 'Texas', lat: 29.7604, lon: -95.3698, elevation: 13, timezone: 'America/Chicago', population: 2304000 },
  { name: 'Detroit',    countryISO: 'US', adminRegion: 'Michigan', lat: 42.3314, lon: -83.0458, elevation: 183, timezone: 'America/Detroit', population: 632000 },
  { name: 'Toronto',    countryISO: 'CA', adminRegion: 'Ontario', lat: 43.6532, lon: -79.3832, elevation: 76, timezone: 'America/Toronto', population: 2794000 },
  { name: 'Mississauga', countryISO: 'CA', adminRegion: 'Ontario', lat: 43.5890, lon: -79.6441, elevation: 156, timezone: 'America/Toronto', population: 717000 },
  { name: 'Montreal',   countryISO: 'CA', adminRegion: 'Quebec', lat: 45.5017, lon: -73.5673, elevation: 36, timezone: 'America/Toronto', population: 1762000 },

  // ─── Latin America ────────────────────────────────────────────────────────
  { name: 'São Paulo',  countryISO: 'BR', adminRegion: 'São Paulo State', lat: -23.5505, lon: -46.6333, elevation: 760, timezone: 'America/Sao_Paulo', population: 12325000 },

  // ─── Australia non-capital ────────────────────────────────────────────────
  { name: 'Sydney',     countryISO: 'AU', adminRegion: 'New South Wales', lat: -33.8688, lon: 151.2093, elevation: 3, timezone: 'Australia/Sydney', population: 5312000 },
  { name: 'Melbourne',  countryISO: 'AU', adminRegion: 'Victoria', lat: -37.8136, lon: 144.9631, elevation: 31, timezone: 'Australia/Melbourne', population: 5078000 },
  { name: 'Perth',      countryISO: 'AU', adminRegion: 'Western Australia', lat: -31.9505, lon: 115.8605, elevation: 31, timezone: 'Australia/Perth', population: 2125000 },
  { name: 'Brisbane',   countryISO: 'AU', adminRegion: 'Queensland', lat: -27.4698, lon: 153.0251, elevation: 28, timezone: 'Australia/Brisbane', population: 2462000 },

  // ─── Multi-method-split / minority-fiqh stress cases ──────────────────────
  { name: 'Pattani',    nameLocal: 'ปัตตานี', countryISO: 'TH', adminRegion: 'Pattani Province', lat: 6.8682, lon: 101.2497, elevation: 4, timezone: 'Asia/Bangkok', population: 144000 },
  { name: 'Cotabato',   countryISO: 'PH', adminRegion: 'Maguindanao del Norte / BARMM', lat: 7.2178, lon: 124.2451, elevation: 9, timezone: 'Asia/Manila', population: 325000 },
  { name: 'Marawi',     countryISO: 'PH', adminRegion: 'Lanao del Sur / BARMM', lat: 7.9988, lon: 124.2937, elevation: 730, timezone: 'Asia/Manila', population: 201000 },
  { name: 'Bradford',   countryISO: 'GB', adminRegion: 'West Yorkshire', lat: 53.7960, lon: -1.7594, elevation: 110, timezone: 'Europe/London', population: 358000 },
  { name: 'Mosul',      nameLocal: 'الموصل', countryISO: 'IQ', adminRegion: 'Nineveh Governorate', lat: 36.3489, lon: 43.1577, elevation: 223, timezone: 'Asia/Baghdad', population: 1683000 },
  { name: 'Najaf',      nameLocal: 'النجف', countryISO: 'IQ', adminRegion: 'Najaf Governorate', lat: 31.9956, lon: 44.3308, elevation: 70, timezone: 'Asia/Baghdad', population: 1389000 },
  { name: 'Karbala',    nameLocal: 'كربلاء', countryISO: 'IQ', adminRegion: 'Karbala Governorate', lat: 32.6149, lon: 44.0241, elevation: 28, timezone: 'Asia/Baghdad', population: 690000 },
  { name: 'Basra',      nameLocal: 'البصرة', countryISO: 'IQ', adminRegion: 'Basra Governorate', lat: 30.5081, lon: 47.7836, elevation: 4, timezone: 'Asia/Baghdad', population: 2600000 },
  { name: 'Sarajevo',   nameLocal: 'Сарајево', countryISO: 'BA', adminRegion: 'Federation of Bosnia and Herzegovina', lat: 43.8563, lon: 18.4131, elevation: 518, timezone: 'Europe/Sarajevo', population: 343000 },
  { name: 'Mostar',     nameLocal: 'Мостар', countryISO: 'BA', adminRegion: 'Herzegovina-Neretva Canton', lat: 43.3438, lon: 17.8078, elevation: 60, timezone: 'Europe/Sarajevo', population: 105000 },
  { name: 'Banja Luka', nameLocal: 'Бања Лука', countryISO: 'BA', adminRegion: 'Republika Srpska', lat: 44.7722, lon: 17.1910, elevation: 163, timezone: 'Europe/Sarajevo', population: 138000 },
  { name: 'Tabriz',     nameLocal: 'تبریز', countryISO: 'IR', adminRegion: 'East Azerbaijan', lat: 38.0667, lon: 46.2993, elevation: 1351, timezone: 'Asia/Tehran', population: 1559000 },

  // ─── Dearborn (Detroit-adjacent) — for the DearbornDetroit override pinpoint ─
  { name: 'Dearborn',   countryISO: 'US', adminRegion: 'Michigan', lat: 42.3223, lon: -83.1763, elevation: 184, timezone: 'America/Detroit', population: 109000 },

  // ─── High-elevation stress cases ──────────────────────────────────────────
  { name: 'Sanaa',      nameLocal: 'صنعاء', countryISO: 'YE', adminRegion: "Amanat Al Asimah", lat: 15.3694, lon: 44.1910, elevation: 2253, timezone: 'Asia/Aden', population: 3293000 },
  { name: 'Addis Ababa', countryISO: 'ET', adminRegion: 'Addis Ababa', lat: 9.0302, lon: 38.7407, elevation: 2355, timezone: 'Africa/Addis_Ababa', population: 3860000 },

  // ─── New Zealand non-capital ──────────────────────────────────────────────
  { name: 'Auckland',   countryISO: 'NZ', adminRegion: 'Auckland Region', lat: -36.8485, lon: 174.7633, elevation: 14, timezone: 'Pacific/Auckland', population: 1657000 },

  // ─── v1.7.8 (#54) Tier 2: new country anchors — primary city per country ─
  { name: 'Hong Kong',  countryISO: 'HK', lat: 22.3193, lon: 114.1694, elevation: 50, timezone: 'Asia/Hong_Kong', population: 7482000 },
  { name: 'Nicosia',    countryISO: 'CY', lat: 35.1856, lon: 33.3823, elevation: 220, timezone: 'Asia/Nicosia', population: 326000 },
  { name: 'Mamoudzou',  countryISO: 'YT', lat: -12.7806, lon: 45.2278, elevation: 14, timezone: 'Indian/Mayotte', population: 71000 },
  { name: 'Laayoune',   countryISO: 'EH', adminRegion: 'Laâyoune-Sakia El Hamra', lat: 27.1418, lon: -13.1875, elevation: 64, timezone: 'Africa/El_Aaiun', population: 217000, nameLocal: 'العيون' },
  { name: 'Saint-Denis', countryISO: 'RE', adminRegion: 'Réunion', lat: -20.8823, lon: 55.4504, elevation: 20, timezone: 'Indian/Reunion', population: 153000 },

  // ─── v1.7.8 (#54) Tier 4: highest-priority city adds ─────────────────────
  { name: 'Osaka',      countryISO: 'JP', adminRegion: 'Osaka Prefecture', lat: 34.6937, lon: 135.5023, elevation: 24, timezone: 'Asia/Tokyo', population: 2691000 },
  { name: 'Shanghai',   countryISO: 'CN', adminRegion: 'Shanghai', lat: 31.2304, lon: 121.4737, elevation: 4, timezone: 'Asia/Shanghai', population: 26320000 },
  { name: 'Bilbao',     countryISO: 'ES', adminRegion: 'Basque Country', lat: 43.2630, lon: -2.9350, elevation: 19, timezone: 'Europe/Madrid', population: 346000 },
  { name: 'Sharm el-Sheikh', countryISO: 'EG', adminRegion: 'South Sinai Governorate', lat: 27.9158, lon: 34.3299, elevation: 4, timezone: 'Africa/Cairo', population: 73000, nameLocal: 'شرم الشيخ' },
  { name: 'Hafar Al-Batin', countryISO: 'SA', adminRegion: 'Eastern Province', lat: 28.4337, lon: 45.9601, elevation: 380, timezone: 'Asia/Riyadh', population: 391000, nameLocal: 'حفر الباطن' },
  { name: 'Hebron',     countryISO: 'PS', adminRegion: 'Hebron Governorate', lat: 31.5326, lon: 35.0998, elevation: 930, timezone: 'Asia/Hebron', population: 215000, nameLocal: 'الخليل' },
  { name: 'Gaza',       countryISO: 'PS', adminRegion: 'Gaza Strip', lat: 31.5017, lon: 34.4668, elevation: 14, timezone: 'Asia/Hebron', population: 590000, nameLocal: 'غزة' },
  { name: 'Belfast',    countryISO: 'GB', adminRegion: 'Northern Ireland', lat: 54.5973, lon: -5.9301, elevation: 6, timezone: 'Europe/London', population: 345000 },
  { name: 'Niagara Falls', countryISO: 'CA', adminRegion: 'Ontario', lat: 43.0896, lon: -79.0849, elevation: 167, timezone: 'America/Toronto', population: 88000 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Mawaqit cities → fill from a hand-curated supplement table for the
// approximate lat/lon/elevation/population the Mawaqit JSON does not carry.
// Only the cities NOT already in MUSLIM_POPULATION_CENTERS / world-cities
// need a row here.
// ─────────────────────────────────────────────────────────────────────────────

const MAWAQIT_SUPPLEMENT = {
  // City|Country → { lat, lon, elevation, timezone, population, countryISO, adminRegion?, nameLocal? }
  'Akkar|Lebanon':           { lat: 34.5391, lon: 36.1233, elevation: 35,   timezone: 'Asia/Beirut',  population: 109000, countryISO: 'LB', adminRegion: 'Akkar Governorate' },
  'Alburikent (Dagestan)|Russia': { lat: 42.9234, lon: 47.5089, elevation: 50, timezone: 'Europe/Moscow', population: 11000, countryISO: 'RU', adminRegion: 'Dagestan' },
  'Aleppo|Syria':            { lat: 36.2021, lon: 37.1343, elevation: 379, timezone: 'Asia/Damascus', population: 1834000, countryISO: 'SY', nameLocal: 'حلب' },
  'Amsterdam|Netherlands':   { lat: 52.3676, lon: 4.9041,  elevation: 2,   timezone: 'Europe/Amsterdam', population: 905000, countryISO: 'NL' },
  'Antwerp|Belgium':         { lat: 51.2194, lon: 4.4025,  elevation: 8,   timezone: 'Europe/Brussels', population: 530000, countryISO: 'BE' },
  'Ar Rass|Saudi Arabia':    { lat: 25.8709, lon: 43.4997, elevation: 705, timezone: 'Asia/Riyadh', population: 133000, countryISO: 'SA', adminRegion: 'Qassim' },
  'Baalbek|Lebanon':         { lat: 34.0058, lon: 36.2181, elevation: 1170, timezone: 'Asia/Beirut', population: 105000, countryISO: 'LB', adminRegion: 'Baalbek-Hermel' },
  'Baghdad|Iraq':            { lat: 33.3152, lon: 44.3661, elevation: 34,  timezone: 'Asia/Baghdad', population: 7144000, countryISO: 'IQ', nameLocal: 'بغداد' },
  'Bajil|Yemen':             { lat: 15.0589, lon: 43.2787, elevation: 105, timezone: 'Asia/Aden', population: 70000, countryISO: 'YE' },
  'Bamako|Mali':             { lat: 12.6392, lon: -8.0029, elevation: 350, timezone: 'Africa/Bamako', population: 2447000, countryISO: 'ML' },
  'Bangalore|India':         { lat: 12.9716, lon: 77.5946, elevation: 920, timezone: 'Asia/Kolkata', population: 8443000, countryISO: 'IN', adminRegion: 'Karnataka' },
  'Barcelona|Spain':         { lat: 41.3851, lon: 2.1734,  elevation: 12,  timezone: 'Europe/Madrid', population: 1620000, countryISO: 'ES' },
  'Basel|Switzerland':       { lat: 47.5596, lon: 7.5886,  elevation: 260, timezone: 'Europe/Zurich', population: 173000, countryISO: 'CH' },
  'Beau Bassin-Rose Hill|Mauritius': { lat: -20.2289, lon: 57.4683, elevation: 130, timezone: 'Indian/Mauritius', population: 102000, countryISO: 'MU' },
  'Ben Gardane|Tunisia':     { lat: 33.1405, lon: 11.2200, elevation: 26, timezone: 'Africa/Tunis', population: 79000, countryISO: 'TN' },
  'Berlin|Germany':          { lat: 52.5200, lon: 13.4050, elevation: 34, timezone: 'Europe/Berlin', population: 3700000, countryISO: 'DE' },
  'Berrechid|Morocco':       { lat: 33.2659, lon: -7.5867, elevation: 175, timezone: 'Africa/Casablanca', population: 136000, countryISO: 'MA' },
  'Birmingham|United Kingdom': { lat: 52.4862, lon: -1.8904, elevation: 140, timezone: 'Europe/London', population: 1145000, countryISO: 'GB' },
  'Brisbane|Australia':      { lat: -27.4698, lon: 153.0251, elevation: 28, timezone: 'Australia/Brisbane', population: 2462000, countryISO: 'AU' },
  'Brussels|Belgium':        { lat: 50.8503, lon: 4.3517,  elevation: 13, timezone: 'Europe/Brussels', population: 1208000, countryISO: 'BE' },
  'Cairo|Egypt':             { lat: 30.0444, lon: 31.2357, elevation: 23, timezone: 'Africa/Cairo', population: 10100000, countryISO: 'EG', nameLocal: 'القاهرة' },
  'Cape Town|South Africa':  { lat: -33.9249, lon: 18.4241, elevation: 25, timezone: 'Africa/Johannesburg', population: 4710000, countryISO: 'ZA' },
  'Casablanca|Morocco':      { lat: 33.5731, lon: -7.5898, elevation: 27, timezone: 'Africa/Casablanca', population: 3460000, countryISO: 'MA', nameLocal: 'الدار البيضاء' },
  'Colombo|Sri Lanka':       { lat: 6.9271, lon: 79.8612,  elevation: 1, timezone: 'Asia/Colombo', population: 752000, countryISO: 'LK' },
  'Constantine|Algeria':     { lat: 36.3650, lon: 6.6147,  elevation: 640, timezone: 'Africa/Algiers', population: 938000, countryISO: 'DZ' },
  'Córdoba|Argentina':       { lat: -31.4201, lon: -64.1888, elevation: 391, timezone: 'America/Argentina/Cordoba', population: 1454000, countryISO: 'AR' },
  'Dakar|Senegal':           { lat: 14.7167, lon: -17.4677, elevation: 22, timezone: 'Africa/Dakar', population: 1146000, countryISO: 'SN' },
  'Damascus|Syria':          { lat: 33.5138, lon: 36.2765, elevation: 680, timezone: 'Asia/Damascus', population: 1711000, countryISO: 'SY', nameLocal: 'دمشق' },
  'Dammam|Saudi Arabia':     { lat: 26.3927, lon: 49.9777, elevation: 10, timezone: 'Asia/Riyadh', population: 1252000, countryISO: 'SA' },
  'Dar es Salaam|Tanzania':  { lat: -6.7924, lon: 39.2083, elevation: 24, timezone: 'Africa/Dar_es_Salaam', population: 4364000, countryISO: 'TZ' },
  'Dhaka|Bangladesh':        { lat: 23.8103, lon: 90.4125, elevation: 4, timezone: 'Asia/Dhaka', population: 8906000, countryISO: 'BD' },
  'Doha|Qatar':              { lat: 25.2854, lon: 51.5310, elevation: 10, timezone: 'Asia/Qatar', population: 2382000, countryISO: 'QA' },
  'Edmonton|Canada':         { lat: 53.5461, lon: -113.4938, elevation: 645, timezone: 'America/Edmonton', population: 1010000, countryISO: 'CA' },
  'Erbil|Iraq':              { lat: 36.1911, lon: 44.0094, elevation: 415, timezone: 'Asia/Baghdad', population: 1612000, countryISO: 'IQ' },
  'Erfoud|Morocco':          { lat: 31.4326, lon: -4.2369, elevation: 813, timezone: 'Africa/Casablanca', population: 24000, countryISO: 'MA' },
  'Errachidia|Morocco':      { lat: 31.9314, lon: -4.4248, elevation: 1037, timezone: 'Africa/Casablanca', population: 92000, countryISO: 'MA' },
  'Essaouira|Morocco':       { lat: 31.5085, lon: -9.7595, elevation: 8, timezone: 'Africa/Casablanca', population: 77000, countryISO: 'MA' },
  'Fes|Morocco':             { lat: 34.0331, lon: -5.0003, elevation: 408, timezone: 'Africa/Casablanca', population: 1112000, countryISO: 'MA', nameLocal: 'فاس' },
  'Fquih Ben Salah|Morocco': { lat: 32.5021, lon: -6.8989, elevation: 419, timezone: 'Africa/Casablanca', population: 102000, countryISO: 'MA' },
  'Frankfurt|Germany':       { lat: 50.1109, lon: 8.6821,  elevation: 112, timezone: 'Europe/Berlin', population: 763000, countryISO: 'DE' },
  'Geneva|Switzerland':      { lat: 46.2044, lon: 6.1432,  elevation: 375, timezone: 'Europe/Zurich', population: 203000, countryISO: 'CH' },
  'Graz|Austria':            { lat: 47.0707, lon: 15.4395, elevation: 353, timezone: 'Europe/Vienna', population: 295000, countryISO: 'AT' },
  'Guelmim|Morocco':         { lat: 28.9870, lon: -10.0574, elevation: 305, timezone: 'Africa/Casablanca', population: 188000, countryISO: 'MA' },
  'Hamburg|Germany':         { lat: 53.5511, lon: 9.9937,  elevation: 6, timezone: 'Europe/Berlin', population: 1899000, countryISO: 'DE' },
  'Hargeisa|Somalia':        { lat: 9.5616, lon: 44.0650,  elevation: 1334, timezone: 'Africa/Mogadishu', population: 1200000, countryISO: 'SO' },
  'Horsens|Denmark':         { lat: 55.8607, lon: 9.8503,  elevation: 22, timezone: 'Europe/Copenhagen', population: 60000, countryISO: 'DK' },
  'Houston|United States':   { lat: 29.7604, lon: -95.3698, elevation: 13, timezone: 'America/Chicago', population: 2304000, countryISO: 'US' },
  'Idlib|Syria':             { lat: 35.9306, lon: 36.6339, elevation: 500, timezone: 'Asia/Damascus', population: 165000, countryISO: 'SY' },
  'Ifrane|Morocco':          { lat: 33.5228, lon: -5.1106, elevation: 1664, timezone: 'Africa/Casablanca', population: 14000, countryISO: 'MA' },
  'Inezgane|Morocco':        { lat: 30.3552, lon: -9.5378, elevation: 33, timezone: 'Africa/Casablanca', population: 130000, countryISO: 'MA' },
  'Isa Town|Bahrain':        { lat: 26.1762, lon: 50.5495, elevation: 21, timezone: 'Asia/Bahrain', population: 38000, countryISO: 'BH' },
  'Islamabad|Pakistan':      { lat: 33.6844, lon: 73.0479, elevation: 540, timezone: 'Asia/Karachi', population: 1015000, countryISO: 'PK' },
  'Jaamuuq|Ethiopia':        { lat: 9.7833, lon: 41.6500, elevation: 1145, timezone: 'Africa/Addis_Ababa', population: 35000, countryISO: 'ET' },
  'Jakarta|Indonesia':       { lat: -6.2088, lon: 106.8456, elevation: 8, timezone: 'Asia/Jakarta', population: 10770000, countryISO: 'ID' },
  'Jeddah|Saudi Arabia':     { lat: 21.4858, lon: 39.1925, elevation: 12, timezone: 'Asia/Riyadh', population: 4781000, countryISO: 'SA' },
  'Jerusalem|Palestine':     { lat: 31.7683, lon: 35.2137, elevation: 754, timezone: 'Asia/Hebron', population: 936000, countryISO: 'PS' },
  'Kabul|Afghanistan':       { lat: 34.5553, lon: 69.2075, elevation: 1791, timezone: 'Asia/Kabul', population: 4434000, countryISO: 'AF' },
  // v1.7.8 Tier 5 (Reviewer A geometry): Kaédi center moved ~600m east into
  // Mauritanian bank of the Senegal River. Original (-13.5042) sat on the
  // Senegalese side; corrected to -13.4980.
  'Kaedi|Mauritania':        { lat: 16.1500, lon: -13.4980, elevation: 12, timezone: 'Africa/Nouakchott', population: 55000, countryISO: 'MR' },
  'Kandy|Sri Lanka':         { lat: 7.2906, lon: 80.6337,  elevation: 500, timezone: 'Asia/Colombo', population: 152000, countryISO: 'LK' },
  'Kenitra|Morocco':         { lat: 34.2610, lon: -6.5802, elevation: 15, timezone: 'Africa/Casablanca', population: 431000, countryISO: 'MA' },
  'Khartoum Bahri|Sudan':    { lat: 15.6333, lon: 32.5333, elevation: 380, timezone: 'Africa/Khartoum', population: 700000, countryISO: 'SD' },
  'Khouribga|Morocco':       { lat: 32.8810, lon: -6.9063, elevation: 786, timezone: 'Africa/Casablanca', population: 196000, countryISO: 'MA' },
  'Kirkuk|Iraq':             { lat: 35.4681, lon: 44.3922, elevation: 348, timezone: 'Asia/Baghdad', population: 850000, countryISO: 'IQ' },
  'Kuala Lumpur|Malaysia':   { lat: 3.1390, lon: 101.6869, elevation: 22, timezone: 'Asia/Kuala_Lumpur', population: 1809000, countryISO: 'MY' },
  // v1.7.8: Kuwait Mawaqit-supplement removed — duplicate of Kuwait City
  // (capitals row from world-cities.json).
  'Lahore|Pakistan':         { lat: 31.5497, lon: 74.3436, elevation: 217, timezone: 'Asia/Karachi', population: 13096000, countryISO: 'PK' },
  'Laval|Canada':            { lat: 45.6066, lon: -73.7124, elevation: 39, timezone: 'America/Toronto', population: 438000, countryISO: 'CA' },
  'Leicester|United Kingdom': { lat: 52.6369, lon: -1.1398, elevation: 67, timezone: 'Europe/London', population: 368000, countryISO: 'GB' },
  'Lille|France':            { lat: 50.6292, lon: 3.0573, elevation: 21, timezone: 'Europe/Paris', population: 233000, countryISO: 'FR' },
  'Limoges|France':          { lat: 45.8336, lon: 1.2611, elevation: 240, timezone: 'Europe/Paris', population: 130000, countryISO: 'FR' },
  'London|United Kingdom':   { lat: 51.5074, lon: -0.1278, elevation: 11, timezone: 'Europe/London', population: 9648000, countryISO: 'GB' },
  'Lucknow|India':           { lat: 26.8467, lon: 80.9462, elevation: 123, timezone: 'Asia/Kolkata', population: 2817000, countryISO: 'IN' },
  'Lyon|France':             { lat: 45.7640, lon: 4.8357, elevation: 173, timezone: 'Europe/Paris', population: 522000, countryISO: 'FR' },
  'Madrid|Spain':            { lat: 40.4168, lon: -3.7038, elevation: 667, timezone: 'Europe/Madrid', population: 3266000, countryISO: 'ES' },
  'Mahajanga|Madagascar':    { lat: -15.7167, lon: 46.3167, elevation: 26, timezone: 'Indian/Antananarivo', population: 250000, countryISO: 'MG' },
  'Malmö|Sweden':            { lat: 55.6050, lon: 13.0038, elevation: 12, timezone: 'Europe/Stockholm', population: 351000, countryISO: 'SE' },
  'Manama|Bahrain':          { lat: 26.2285, lon: 50.5860, elevation: 5, timezone: 'Asia/Bahrain', population: 158000, countryISO: 'BH' },
  'Manchester|United Kingdom': { lat: 53.4808, lon: -2.2426, elevation: 38, timezone: 'Europe/London', population: 553000, countryISO: 'GB' },
  'Mar del Plata|Argentina': { lat: -38.0023, lon: -57.5575, elevation: 21, timezone: 'America/Argentina/Buenos_Aires', population: 681000, countryISO: 'AR' },
  'Marrakech|Morocco':       { lat: 31.6295, lon: -7.9811, elevation: 466, timezone: 'Africa/Casablanca', population: 928000, countryISO: 'MA' },
  'Marseille|France':        { lat: 43.2965, lon: 5.3698, elevation: 12, timezone: 'Europe/Paris', population: 870000, countryISO: 'FR' },
  'Mbour|Senegal':           { lat: 14.4198, lon: -16.9663, elevation: 6, timezone: 'Africa/Dakar', population: 232000, countryISO: 'SN' },
  'Mecca|Saudi Arabia':      { lat: 21.4225, lon: 39.8262, elevation: 277, timezone: 'Asia/Riyadh', population: 2042000, countryISO: 'SA' },
  'Meknes|Morocco':          { lat: 33.8935, lon: -5.5473, elevation: 552, timezone: 'Africa/Casablanca', population: 632000, countryISO: 'MA' },
  'Melbourne|Australia':     { lat: -37.8136, lon: 144.9631, elevation: 31, timezone: 'Australia/Melbourne', population: 5078000, countryISO: 'AU' },
  'Midelt|Morocco':          { lat: 32.6852, lon: -4.7448, elevation: 1488, timezone: 'Africa/Casablanca', population: 55000, countryISO: 'MA' },
  'Milan|Italy':             { lat: 45.4642, lon: 9.1900, elevation: 120, timezone: 'Europe/Rome', population: 1396000, countryISO: 'IT' },
  'Mogadishu|Somalia':       { lat: 2.0469, lon: 45.3182, elevation: 9, timezone: 'Africa/Mogadishu', population: 2587000, countryISO: 'SO' },
  'Moscow|Russia':           { lat: 55.7558, lon: 37.6173, elevation: 156, timezone: 'Europe/Moscow', population: 12506000, countryISO: 'RU' },
  'Mosul|Iraq':              { lat: 36.3489, lon: 43.1577, elevation: 223, timezone: 'Asia/Baghdad', population: 1683000, countryISO: 'IQ' },
  'Muhayil Asir|Saudi Arabia': { lat: 18.5444, lon: 42.0500, elevation: 463, timezone: 'Asia/Riyadh', population: 80000, countryISO: 'SA' },
  'Mulhouse|France':         { lat: 47.7508, lon: 7.3359, elevation: 240, timezone: 'Europe/Paris', population: 109000, countryISO: 'FR' },
  'Munich|Germany':          { lat: 48.1351, lon: 11.5820, elevation: 520, timezone: 'Europe/Berlin', population: 1488000, countryISO: 'DE' },
  'Muscat|Oman':             { lat: 23.5859, lon: 58.4059, elevation: 6, timezone: 'Asia/Muscat', population: 1560000, countryISO: 'OM' },
  "N'Djamena|Chad":          { lat: 12.1348, lon: 15.0557, elevation: 295, timezone: 'Africa/Ndjamena', population: 993000, countryISO: 'TD' },
  'Nabeul|Tunisia':          { lat: 36.4561, lon: 10.7376, elevation: 26, timezone: 'Africa/Tunis', population: 73000, countryISO: 'TN' },
  'Nador|Morocco':           { lat: 35.1741, lon: -2.9287, elevation: 6, timezone: 'Africa/Casablanca', population: 188000, countryISO: 'MA' },
  'Nampula|Mozambique':      { lat: -15.1167, lon: 39.2667, elevation: 441, timezone: 'Africa/Maputo', population: 743000, countryISO: 'MZ' },
  'Narathiwat|Thailand':     { lat: 6.4254, lon: 101.8237, elevation: 5, timezone: 'Asia/Bangkok', population: 41000, countryISO: 'TH' },
  'Nazran (Ingushetia)|Russia': { lat: 43.2247, lon: 44.7727, elevation: 380, timezone: 'Europe/Moscow', population: 122000, countryISO: 'RU' },
  'New York|United States':  { lat: 40.7128, lon: -74.0060, elevation: 10, timezone: 'America/New_York', population: 8336000, countryISO: 'US' },
  'Nouakchott|Mauritania':   { lat: 18.0735, lon: -15.9582, elevation: 8, timezone: 'Africa/Nouakchott', population: 1077000, countryISO: 'MR' },
  'Odense|Denmark':          { lat: 55.4038, lon: 10.4024, elevation: 13, timezone: 'Europe/Copenhagen', population: 180000, countryISO: 'DK' },
  'Oran|Algeria':            { lat: 35.6976, lon: -0.6337, elevation: 0, timezone: 'Africa/Algiers', population: 1454000, countryISO: 'DZ' },
  'Oslo|Norway':             { lat: 59.9139, lon: 10.7522, elevation: 23, timezone: 'Europe/Oslo', population: 697000, countryISO: 'NO' },
  'Ottawa|Canada':           { lat: 45.4215, lon: -75.6972, elevation: 70, timezone: 'America/Toronto', population: 1017000, countryISO: 'CA' },
  'Ouarzazate|Morocco':      { lat: 30.9335, lon: -6.9370, elevation: 1135, timezone: 'Africa/Casablanca', population: 71000, countryISO: 'MA' },
  'Oujda|Morocco':           { lat: 34.6814, lon: -1.9086, elevation: 470, timezone: 'Africa/Casablanca', population: 494000, countryISO: 'MA' },
  'Paris|France':            { lat: 48.8566, lon: 2.3522, elevation: 35, timezone: 'Europe/Paris', population: 2161000, countryISO: 'FR' },
  'Philadelphia|United States': { lat: 39.9526, lon: -75.1652, elevation: 12, timezone: 'America/New_York', population: 1603000, countryISO: 'US' },
  'Port Louis|Mauritius':    { lat: -20.1609, lon: 57.5012, elevation: 6, timezone: 'Indian/Mauritius', population: 149000, countryISO: 'MU' },
  'Rabat|Morocco':           { lat: 34.0209, lon: -6.8416, elevation: 75, timezone: 'Africa/Casablanca', population: 580000, countryISO: 'MA' },
  'Rome|Italy':              { lat: 41.9028, lon: 12.4964, elevation: 21, timezone: 'Europe/Rome', population: 2872000, countryISO: 'IT' },
  'Rotterdam|Netherlands':   { lat: 51.9244, lon: 4.4777, elevation: 0, timezone: 'Europe/Amsterdam', population: 651000, countryISO: 'NL' },
  'Sabratha|Libya':          { lat: 32.7938, lon: 12.4885, elevation: 13, timezone: 'Africa/Tripoli', population: 102000, countryISO: 'LY' },
  'Safi|Morocco':            { lat: 32.2994, lon: -9.2372, elevation: 13, timezone: 'Africa/Casablanca', population: 308000, countryISO: 'MA' },
  'Sale|Morocco':            { lat: 34.0531, lon: -6.7985, elevation: 47, timezone: 'Africa/Casablanca', population: 890000, countryISO: 'MA' },
  'Sefrou|Morocco':          { lat: 33.8311, lon: -4.8294, elevation: 850, timezone: 'Africa/Casablanca', population: 79000, countryISO: 'MA' },
  'Segou|Mali':              { lat: 13.4317, lon: -6.2157, elevation: 288, timezone: 'Africa/Bamako', population: 134000, countryISO: 'ML' },
  'Seoul|South Korea':       { lat: 37.5665, lon: 126.9780, elevation: 38, timezone: 'Asia/Seoul', population: 9776000, countryISO: 'KR' },
  'Setif|Algeria':           { lat: 36.1898, lon: 5.4108, elevation: 1100, timezone: 'Africa/Algiers', population: 288000, countryISO: 'DZ' },
  'Settat|Morocco':          { lat: 33.0017, lon: -7.6166, elevation: 369, timezone: 'Africa/Casablanca', population: 142000, countryISO: 'MA' },
  'Sfax|Tunisia':            { lat: 34.7406, lon: 10.7603, elevation: 21, timezone: 'Africa/Tunis', population: 955000, countryISO: 'TN' },
  'Sidi Kacem|Morocco':      { lat: 34.2208, lon: -5.7081, elevation: 100, timezone: 'Africa/Casablanca', population: 75000, countryISO: 'MA' },
  'Singapore|Singapore':     { lat: 1.3521, lon: 103.8198, elevation: 15, timezone: 'Asia/Singapore', population: 5454000, countryISO: 'SG' },
  'Sirte|Libya':             { lat: 31.2089, lon: 16.5889, elevation: 14, timezone: 'Africa/Tripoli', population: 80000, countryISO: 'LY' },
  'Strasbourg|France':       { lat: 48.5734, lon: 7.7521, elevation: 142, timezone: 'Europe/Paris', population: 287000, countryISO: 'FR' },
  'Sydney|Australia':        { lat: -33.8688, lon: 151.2093, elevation: 3, timezone: 'Australia/Sydney', population: 5312000, countryISO: 'AU' },
  'São Paulo|Brazil':        { lat: -23.5505, lon: -46.6333, elevation: 760, timezone: 'America/Sao_Paulo', population: 12325000, countryISO: 'BR' },
  'Taif|Saudi Arabia':       { lat: 21.2703, lon: 40.4158, elevation: 1879, timezone: 'Asia/Riyadh', population: 688000, countryISO: 'SA' },
  // v1.7.8: Tanger Mawaqit-supplement removed — Mawaqit "Tanger" entries
  // route via the canonical Tangier row in MUSLIM_POPULATION_CENTERS.
  // Removing this supplement causes a benign warning at build time.
  'Taourirt|Morocco':        { lat: 34.4115, lon: -2.8975, elevation: 425, timezone: 'Africa/Casablanca', population: 80000, countryISO: 'MA' },
  'Taroudant|Morocco':       { lat: 30.4727, lon: -8.8769, elevation: 250, timezone: 'Africa/Casablanca', population: 80000, countryISO: 'MA' },
  'Taza|Morocco':            { lat: 34.2138, lon: -4.0099, elevation: 525, timezone: 'Africa/Casablanca', population: 149000, countryISO: 'MA' },
  'Temara|Morocco':          { lat: 33.9281, lon: -6.9067, elevation: 75, timezone: 'Africa/Casablanca', population: 313000, countryISO: 'MA' },
  'Thies|Senegal':           { lat: 14.7886, lon: -16.9359, elevation: 78, timezone: 'Africa/Dakar', population: 320000, countryISO: 'SN' },
  'Tinghir|Morocco':         { lat: 31.5141, lon: -5.5328, elevation: 1342, timezone: 'Africa/Casablanca', population: 42000, countryISO: 'MA' },
  'Tlemcen|Algeria':         { lat: 34.8869, lon: -1.3197, elevation: 837, timezone: 'Africa/Algiers', population: 173000, countryISO: 'DZ' },
  'Tokyo|Japan':             { lat: 35.6762, lon: 139.6503, elevation: 40, timezone: 'Asia/Tokyo', population: 13929000, countryISO: 'JP' },
  'Toronto|Canada':          { lat: 43.6532, lon: -79.3832, elevation: 76, timezone: 'America/Toronto', population: 2794000, countryISO: 'CA' },
  'Toulouse|France':         { lat: 43.6047, lon: 1.4442, elevation: 146, timezone: 'Europe/Paris', population: 493000, countryISO: 'FR' },
  'Tripoli|Lebanon':         { lat: 34.4332, lon: 35.8441, elevation: 5, timezone: 'Asia/Beirut', population: 730000, countryISO: 'LB' },
  'Tunis|Tunisia':           { lat: 36.8065, lon: 10.1815, elevation: 4, timezone: 'Africa/Tunis', population: 1056000, countryISO: 'TN' },
  'Uppsala|Sweden':          { lat: 59.8586, lon: 17.6389, elevation: 14, timezone: 'Europe/Stockholm', population: 178000, countryISO: 'SE' },
  'Utrecht|Netherlands':     { lat: 52.0907, lon: 5.1214, elevation: 5, timezone: 'Europe/Amsterdam', population: 359000, countryISO: 'NL' },
  'Valencia|Spain':          { lat: 39.4699, lon: -0.3763, elevation: 15, timezone: 'Europe/Madrid', population: 791000, countryISO: 'ES' },
  'Vienna|Austria':          { lat: 48.2082, lon: 16.3738, elevation: 171, timezone: 'Europe/Vienna', population: 1900000, countryISO: 'AT' },
  'Zagora|Morocco':          { lat: 30.3320, lon: -5.8377, elevation: 720, timezone: 'Africa/Casablanca', population: 40000, countryISO: 'MA' },
  'Zarqa|Jordan':            { lat: 32.0728, lon: 36.0876, elevation: 619, timezone: 'Asia/Amman', population: 635000, countryISO: 'JO' },
  'Zliten|Libya':            { lat: 32.4674, lon: 14.5687, elevation: 8, timezone: 'Africa/Tripoli', population: 165000, countryISO: 'LY' },
  'Zurich|Switzerland':      { lat: 47.3769, lon: 8.5417, elevation: 408, timezone: 'Europe/Zurich', population: 421000, countryISO: 'CH' },
  '6th of October|Egypt':    { lat: 29.9361, lon: 30.9269, elevation: 168, timezone: 'Africa/Cairo', population: 500000, countryISO: 'EG', adminRegion: 'Giza' },
  'Abuja|Nigeria':           { lat: 9.0765, lon: 7.3986, elevation: 360, timezone: 'Africa/Lagos', population: 776000, countryISO: 'NG' },
  'Agadir|Morocco':          { lat: 30.4278, lon: -9.5981, elevation: 74, timezone: 'Africa/Casablanca', population: 421000, countryISO: 'MA' },
  'Algiers|Algeria':         { lat: 36.7538, lon: 3.0588, elevation: 25, timezone: 'Africa/Algiers', population: 3416000, countryISO: 'DZ' },
  'Bradford|United Kingdom': { lat: 53.7960, lon: -1.7594, elevation: 110, timezone: 'Europe/London', population: 358000, countryISO: 'GB' },
  'Benghazi|Libya':          { lat: 32.1175, lon: 20.0680, elevation: 25, timezone: 'Africa/Tripoli', population: 807000, countryISO: 'LY' },
}

// ─────────────────────────────────────────────────────────────────────────────
// BBOX_OVERRIDES — explicit per-city bbox replacing the population-radius
// formula. Use ONLY when the formulaic bbox demonstrably overlaps a
// neighbouring city of the same metro/country in a way that breaks
// disambiguation. v1.7.5 (issue #47): Cairo/Giza, KL/Shah Alam, Singapore/
// Johor Bahru, Sharjah/Dubai. Each entry should cite the conflict it
// resolves so future maintainers know the constraint.
// ─────────────────────────────────────────────────────────────────────────────

const BBOX_OVERRIDES = {
  // v1.7.5 #47: Cairo (10.1M) and Giza (9.2M) had identical-radius 0.4° bboxes
  // that fully overlapped at central Cairo. Tighten Giza WEST of Cairo's
  // central core so downtown Cairo (Tahrir Square ~30.04, 31.24) resolves
  // to Cairo. Giza city centre 30.01, 31.21 stays well inside; eastern lon
  // was 31.61, tightened to 31.22 (just east of Giza city centre, west of
  // Cairo CBD). Northern lat tightened from 30.41 to 30.10 (Giza proper is
  // south of central Cairo).
  'Giza|EG':            [29.6131, 30.10, 30.8089, 31.22],
  // v1.7.5 #47: Shah Alam (740K) is ~25 km west of KL (1.8M). Same-radius
  // 0.15° bbox put Shah Alam at lon 101.32-101.72, KL at 101.39-101.99.
  // KL CBD (3.14, 101.69) sat in both. Shrink Shah Alam's eastern lon to
  // 101.55 (Shah Alam city centre 101.52 stays inside; KL CBD excluded).
  'Shah Alam|MY':       [2.8731, 3.2731, 101.3183, 101.55],
  // v1.7.5 #47: Johor Bahru (858K) sits across the Causeway from Singapore.
  // Same-radius 0.15° bbox extended south to lat 1.29 — well inside
  // Singapore's island. Trim southern lat to 1.43 (just north of Singapore's
  // northernmost point ~1.47 on Woodlands; JB centre 1.49 still inside).
  'Johor Bahru|MY':     [1.43, 1.6927, 103.5414, 103.9414],
  // v1.7.5 #47: Singapore is an island bounded by lat 1.16-1.47 lon 103.6-
  // 104.0. Population-radius 0.4° bbox extended to lat 0.95-1.75 (covers
  // southern Johor + northern Riau). Tighten to actual island.
  'Singapore|SG':       [1.16, 1.47, 103.6, 104.05],
  // v1.7.5 Reviewer C: Sharjah (1.68M) directly NE of Dubai (3.6M). Same-
  // radius 0.3° bboxes overlapped over central Sharjah. Tighten Sharjah's
  // southern lat to 25.25 (above Dubai centre's bbox max 25.5 still
  // overlaps but Sharjah CBD 25.35 is inside both — give Sharjah priority
  // by tightening Dubai's NORTHERN lat instead). Sharjah override only;
  // Dubai stays formulaic.
  'Sharjah|AE':         [25.25, 25.65, 55.20, 55.72],
  // v1.7.5 Reviewer C: Dearborn (Detroit suburb) bbox extended N of the
  // Detroit River into Windsor, Canada. Tighten northern lat to 42.40 —
  // Dearborn city centre 42.32 stays inside; Windsor 42.31 also inside but
  // engine-level countryISO check (added in v1.7.5) prevents Dearborn from
  // matching when detectCountry(Windsor)=Canada.
  'Dearborn|US':        [42.22, 42.40, -83.28, -83.08],

  // ─── v1.7.8 (#54): systematic registry bbox-shrink ─────────────────────
  // Each entry resolves a specific bbox-internal failure documented in
  // autoresearch/proposals/v1.7.8-146-fail-deep-dive.md.
  '6th of October|EG':  [29.90, 30.00, 30.88, 30.97],
  'Cairo|EG':           [29.84, 30.24, 31.22, 31.56],
  'Beau Bassin-Rose Hill|MU': [-20.30, -20.20, 57.42, 57.55],
  'Port Louis|MU':      [-20.20, -20.06, 57.40, 57.60],
  'Islamabad|PK':       [33.60, 33.85, 72.85, 73.20],
  'Rawalpindi|PK':      [33.30, 33.60, 72.80, 73.20],
  'Lahore|PK':          [31.25, 31.85, 74.04, 74.50],
  'Temara|MA':          [33.85, 33.99, -7.00, -6.86],
  'Sale|MA':            [34.04, 34.14, -6.90, -6.78],
  'Rabat|MA':           [33.97, 34.04, -6.90, -6.78],
  'Khartoum Bahri|SD':  [15.61, 15.72, 32.50, 32.62],
  'Khartoum|SD':        [15.40, 15.60, 32.50, 32.66],
  'Omdurman|SD':        [15.50, 15.78, 32.30, 32.50],
  'Sharjah|AE':         [25.35, 25.65, 55.42, 55.72],
  'Dubai|AE':           [24.90, 25.35, 55.05, 55.50],
  'Inezgane|MA':        [30.32, 30.39, -9.58, -9.49],
  'Agadir|MA':          [30.40, 30.58, -9.75, -9.45],
  'Zarqa|JO':           [32.05, 32.27, 35.94, 36.24],
  'Amman|JO':           [31.85, 32.00, 35.83, 36.00],
  'Berrechid|MA':       [33.20, 33.34, -7.65, -7.49],
  'Casablanca|MA':      [33.40, 33.78, -7.78, -7.39],
  'Brussels|BE':        [50.65, 51.05, 4.15, 4.55],
  'Antwerp|BE':         [51.06, 51.42, 4.20, 4.60],
  'Brazzaville|CG':     [-4.36, -4.16, 15.14, 15.25],
  'Akkar|LB':           [34.53, 34.69, 36.05, 36.30],
  'Utrecht|NL':         [51.94, 52.16, 4.97, 5.27],
  'Rotterdam|NL':       [51.72, 52.00, 4.28, 4.68],
  'The Hague|NL':       [52.00, 52.18, 4.20, 4.40],
  'Mississauga|CA':     [43.43, 43.74, -79.79, -79.55],
  'Toronto|CA':         [43.45, 43.85, -79.55, -79.18],
  'Montreal|CA':        [45.40, 45.70, -73.95, -73.50],
  'Laval|CA':           [45.55, 45.75, -73.86, -73.59],
  'Alburikent (Dagestan)|RU': [42.92, 42.94, 47.50, 47.52],
  'Isa Town|BH':        [26.16, 26.19, 50.53, 50.56],
  'Jerusalem|IL':       [31.6683, 31.80, 35.1137, 35.3137],
  'Jerusalem|PS':       [31.65, 31.80, 35.0137, 35.4137],
  'Doha|QA':            [25.05, 25.50, 51.40, 51.65],
  'Lomé|TG':            [6.10, 6.30, 1.10, 1.40],
  'Freetown|SL':        [8.39, 8.55, -13.27, -13.13],
  'Podgorica|ME':       [42.40, 42.50, 19.20, 19.40],
  'Detroit|US':         [42.18, 42.46, -83.08, -82.92],
  'Fes|MA':             [33.94, 34.28, -5.30, -4.85],
  'Shah Alam|MY':       [2.8731, 3.2731, 101.3183, 101.45],
  'Singapore|SG':       [1.16, 1.44, 103.6, 104.05],
  'Johor Bahru|MY':     [1.45, 1.6927, 103.5414, 103.9414],
  'Kuala Lumpur|MY':    [2.939, 3.339, 101.50, 101.99],
  'Basel|CH':           [47.41, 47.65, 7.44, 7.74],
  'Mulhouse|FR':        [47.65, 47.90, 7.19, 7.49],

  // v1.7.8 Tier 2: tighten new-country anchor bboxes to fit within their
  // own COUNTRY_BBOX_TABLE entries (avoid cross-border samples).
  'Hong Kong|HK':       [22.16, 22.55, 113.85, 114.43],
  'Saint-Denis|RE':     [-20.95, -20.85, 55.40, 55.55],
  'Mamoudzou|YT':       [-12.81, -12.74, 45.20, 45.27],
  'Laayoune|EH':        [27.10, 27.20, -13.25, -13.13],
  'Nicosia|CY':         [35.13, 35.24, 33.32, 33.45],

  // v1.7.8 Tier 4: tighten new-city bboxes to avoid sibling overlaps.
  'Hebron|PS':          [31.50, 31.60, 35.05, 35.16],

  // Montreal (CA) — formulaic 0.30 bbox extends north into Laval.
  'Montreal|CA':        [45.40, 45.55, -73.95, -73.40],

  // Johannesburg (ZA) — formulaic 0.40 bbox extends north into Pretoria.
  'Johannesburg|ZA':    [-26.40, -25.95, 27.95, 28.20],
  'Pretoria|ZA':        [-25.85, -25.65, 28.10, 28.30],

  // Niagara Falls — small city, tight bbox.
  'Niagara Falls|CA':   [43.05, 43.13, -79.13, -79.04],

  // v1.7.8 polish: Temara bbox vs Rabat — push Temara north below Rabat south.
  'Temara|MA':          [33.85, 33.96, -7.00, -6.86],

  // Geneva — formulaic 0.20 bbox extends west of Switzerland's lon 6.0.
  'Geneva|CH':          [46.10, 46.30, 6.05, 6.25],

  // Montevideo — formulaic 0.20 bbox extends south of Uruguay's lat-min.
  'Montevideo|UY':      [-34.95, -34.85, -56.27, -56.05],

  // Kinshasa — push west lon east so Brazzaville's bbox doesn't shadow.
  'Kinshasa|CD':        [-4.55, -4.30, 15.20, 15.45],

  // v1.7.8 Tier 5 polish — Kaédi MR center moved ~600m east into Mauritanian
  // bank (correction from Reviewer A geometry report). Population-radius
  // formulaic bbox is reasonable; we override only to shift the lat/lon
  // baseline implicitly via the supplement entry update further down.
}

function bboxOverrideFor(name, iso) {
  const key = `${name}|${iso}`
  return BBOX_OVERRIDES[key] || null
}

// ─────────────────────────────────────────────────────────────────────────────
// Build helpers
// ─────────────────────────────────────────────────────────────────────────────

function radiusForPopulation(pop) {
  if (!pop)             return 0.10
  if (pop >= 5_000_000) return 0.40
  if (pop >= 1_000_000) return 0.30
  if (pop >=   500_000) return 0.20
  if (pop >=   100_000) return 0.15
  return 0.10
}

function bboxFor(lat, lon, pop, name, iso) {
  // Per-city override wins over population-radius formula.
  const override = bboxOverrideFor(name, iso)
  if (override) return override.slice()
  const r = radiusForPopulation(pop)
  return [
    +(lat - r).toFixed(4),
    +(lat + r).toFixed(4),
    +(lon - r).toFixed(4),
    +(lon + r).toFixed(4),
  ]
}

function bboxArea(bbox) {
  return (bbox[1] - bbox[0]) * (bbox[3] - bbox[2])
}

// Aladhan methodLabel → engine method-name string. Used for capital rows whose
// methodLabel comes from world-cities.json.
function methodLabelToEngineName(label) {
  if (!label) return null
  const m = label
  if (m === 'Karachi') return 'Karachi'
  if (m === 'ISNA') return 'ISNA'
  if (m === 'MWL') return 'MWL'
  if (m === 'Umm al-Qura') return 'UmmAlQura'
  if (m === 'Egyptian') return 'Egyptian'
  if (m === 'Tehran (Institute of Geophysics)') return 'Tehran'
  if (m === 'Kuwait') return 'Kuwait'
  if (m === 'Qatar') return 'Qatar'
  if (m === 'Singapore (MUIS)') return 'MUIS'
  if (m === 'UOIF') return 'UOIF'
  if (m === 'Diyanet') return 'Diyanet'
  if (m === 'Russia') return 'MWL'
  if (m === 'Moonsighting Committee') return 'MoonsightingCommittee'
  if (m === 'Dubai') return 'UmmAlQura'
  if (m === 'JAKIM') return 'JAKIM'
  if (m === 'Tunisia') return 'Tunisia'
  if (m === 'Algeria') return 'Algeria'
  if (m === 'KEMENAG Indonesia') return 'JAKIM'  // KEMENAG is shape-equivalent to JAKIM/MUIS
  if (m === 'Morocco') return 'Morocco'
  if (m === 'Lisboa') return 'MWL'
  if (m === 'Jordan (Awqaf)') return 'Jordan'
  return null
}

function institutionForMethod(method) {
  switch (method) {
    case 'Diyanet': return 'Diyanet İşleri Başkanlığı'
    case 'JAKIM':   return 'JAKIM (Jabatan Kemajuan Islam Malaysia)'
    case 'MUIS':    return 'MUIS (Majlis Ugama Islam Singapura)'
    case 'Morocco': return 'Ministry of Habous and Islamic Affairs'
    case 'UmmAlQura':return 'Umm al-Qura University'
    case 'Tehran':  return 'Tehran Institute of Geophysics'
    case 'Egyptian':return 'Egyptian General Authority of Survey'
    case 'Jordan':  return 'Jordan Ministry of Awqaf, Islamic Affairs and Holy Places'
    case 'Tunisia': return 'Tunisian Ministry of Religious Affairs'
    case 'Algeria': return 'Algerian Ministry of Religious Affairs and Wakfs'
    case 'Kuwait':  return 'Kuwait Ministry of Awqaf'
    case 'Qatar':   return 'Qatar Calendar House'
    case 'MoonsightingCommittee': return 'Moonsighting Committee Worldwide'
    case 'Karachi': return 'University of Islamic Sciences, Karachi'
    case 'KarachiShafi': return 'University of Islamic Sciences, Karachi (Shafi Asr)'
    case 'MWL':     return 'Muslim World League'
    case 'ISNA':    return 'Islamic Society of North America'
    case 'UOIF':    return 'Union des organisations islamiques de France'
    default: return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build phase 1: assemble cities map keyed by `Name|countryISO` to dedupe.
// ─────────────────────────────────────────────────────────────────────────────

const citiesByKey = new Map()  // key = `${name}|${countryISO}`

function upsertCity(row, sourceTag) {
  const key = `${row.name}|${row.countryISO}`
  const existing = citiesByKey.get(key)
  if (!existing) {
    citiesByKey.set(key, { ...row, _sources: [sourceTag] })
  } else {
    // Merge: keep existing values, add missing from row, track sources.
    for (const [k, v] of Object.entries(row)) {
      if (existing[k] == null && v != null) existing[k] = v
    }
    existing._sources.push(sourceTag)
  }
}

// ── Pass A: capitals ────────────────────────────────────────────────────────
for (const bucket of ['OIC_member_states', 'diaspora_significant']) {
  for (const [iso, data] of Object.entries(worldCities[bucket] || {})) {
    if (typeof data !== 'object' || data === null) continue
    const country = isoToEngineCountry(iso)
    upsertCity({
      name:        data.capital,
      countryISO:  iso,
      lat:         data.latitude,
      lon:         data.longitude,
      elevation:   data.elevation,
      timezone:    data.timezone,
      population:  data.population || null,
      _engineCountry: country,
      _isCapital:  true,
      _aladhanMethodLabel: data.methodLabel,
    }, 'capital')
  }
}

// ── Pass B: MUSLIM_POPULATION_CENTERS ──────────────────────────────────────
for (const row of MUSLIM_POPULATION_CENTERS) {
  upsertCity({
    name:        row.name,
    nameLocal:   row.nameLocal,
    countryISO:  row.countryISO,
    adminRegion: row.adminRegion,
    lat:         row.lat,
    lon:         row.lon,
    elevation:   row.elevation,
    timezone:    row.timezone,
    population:  row.population,
    _engineCountry: isoToEngineCountry(row.countryISO),
  }, 'population-center')
}

// ── Pass C: Mawaqit-registered cities ──────────────────────────────────────
const mawaqitByCity = new Map()
for (const m of mawaqit.active || []) {
  const key = `${m.city}|${m.country}`
  if (!mawaqitByCity.has(key)) mawaqitByCity.set(key, [])
  mawaqitByCity.get(key).push(m)
}
for (const [key, mosques] of mawaqitByCity.entries()) {
  const supplement = MAWAQIT_SUPPLEMENT[key]
  if (!supplement) {
    // Skip if we don't have lat/lon for this Mawaqit city — log for follow-up.
    console.warn(`[build-city-registry] no supplement for Mawaqit city: ${key}`)
    continue
  }
  upsertCity({
    name:        mosques[0].city,
    nameLocal:   supplement.nameLocal,
    countryISO:  supplement.countryISO,
    adminRegion: supplement.adminRegion,
    lat:         supplement.lat,
    lon:         supplement.lon,
    elevation:   supplement.elevation,
    timezone:    supplement.timezone || mosques[0].timezone,
    population:  supplement.population,
    _engineCountry: isoToEngineCountry(supplement.countryISO),
    _mawaqitSlug:    mosques[0].slug,
    _mawaqitCount:   mosques.length,
  }, 'mawaqit')
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: apply city-method-overrides.
// ─────────────────────────────────────────────────────────────────────────────

for (const [overrideKey, ov] of Object.entries(overrides)) {
  if (overrideKey.startsWith('_')) continue
  // Find the matching city by name proximity to the override's lat/lon.
  // Try exact name match first, then nearest city within 0.5° of the override
  // coordinates with the same engine country.
  const expectedEngineCountry = ov.country
  let target = null

  // Exact-name pass first (case-insensitive, handles 'BanjaLuka' override key
  // for 'Banja Luka' city, 'DearbornDetroit' override key for 'Dearborn'
  // city). Map the override key to a canonical city name.
  const overrideKeyToCityName = {
    'BanjaLuka': 'Banja Luka',
    'DearbornDetroit': 'Dearborn',
  }
  const expectedCityName = overrideKeyToCityName[overrideKey] || overrideKey

  for (const c of citiesByKey.values()) {
    if (c.name === expectedCityName && c._engineCountry === expectedEngineCountry) {
      target = c
      break
    }
  }

  if (!target) {
    console.warn(`[build-city-registry] no matching city for override "${overrideKey}" — adding from override coordinates`)
    upsertCity({
      name:        expectedCityName,
      countryISO:  COUNTRY_NAME_TO_ISO[expectedEngineCountry] || null,
      lat:         ov.lat,
      lon:         ov.lon,
      elevation:   0,
      timezone:    'UTC',
      _engineCountry: expectedEngineCountry,
    }, 'override-only')
    target = citiesByKey.get(`${expectedCityName}|${COUNTRY_NAME_TO_ISO[expectedEngineCountry] || null}`)
  }

  // Apply the override fields.
  target._methodOverride = ov.methodOverride
  target._altMethods = (ov.altMethods || []).slice()
  target._sourceCitation = ov.citation
  target._overrideReasoning = ov.reasoning
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3: synthesize the final output rows.
// ─────────────────────────────────────────────────────────────────────────────

const cities = []
for (const c of citiesByKey.values()) {
  if (c.lat == null || c.lon == null) {
    console.warn(`[build-city-registry] dropping ${c.name}|${c.countryISO} — missing lat/lon`)
    continue
  }

  const bbox = bboxFor(c.lat, c.lon, c.population, c.name, c.countryISO)

  // Source resolution.
  let source
  if (c._mawaqitSlug) {
    source = { type: 'mawaqit', slug: c._mawaqitSlug }
  } else if (c._methodOverride) {
    // Override has explicit institutional citation.
    source = { type: 'national-authority', institution: institutionForMethod(c._methodOverride) || 'See citation' }
  } else if (c._isCapital) {
    // Capital — institutional national authority owns the timetable.
    const country = c._engineCountry
    const inst = institutionForMethod(COUNTRY_DEFAULT_METHOD[country])
    if (inst) {
      source = { type: 'national-authority', institution: inst }
    } else {
      source = { type: 'inherited', from: country || c.countryISO }
    }
  } else {
    source = { type: 'inherited', from: c._engineCountry || c.countryISO }
  }

  const out = {
    name:        c.name,
    countryISO:  c.countryISO,
    lat:         +c.lat.toFixed(4),
    lon:         +c.lon.toFixed(4),
    bbox,
    timezone:    c.timezone || 'UTC',
  }
  if (c.nameLocal) out.nameLocal = c.nameLocal
  if (c.adminRegion) out.adminRegion = c.adminRegion
  if (c.population) out.population = c.population
  if (c.elevation != null) out.elevation = c.elevation
  if (c._methodOverride) out.methodOverride = c._methodOverride
  if (c._altMethods && c._altMethods.length) out.altMethods = c._altMethods
  out.source = source

  cities.push(out)
}

// Sort by bbox area ascending so the linear scan in detectLocation matches
// the smallest (most specific) bbox first.
cities.sort((a, b) => bboxArea(a.bbox) - bboxArea(b.bbox))

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4: validation.
// ─────────────────────────────────────────────────────────────────────────────

let warnCount = 0
for (const c of cities) {
  if (!c.timezone || c.timezone === 'UTC') {
    console.warn(`[validate] ${c.name}|${c.countryISO} has no IANA timezone (got '${c.timezone}')`)
    warnCount++
  }
  if (c.methodOverride && !institutionForMethod(c.methodOverride) && c.methodOverride !== 'MoonsightingCommittee' && c.methodOverride !== 'ISNA') {
    console.warn(`[validate] ${c.name} has methodOverride='${c.methodOverride}' but no known institution`)
    warnCount++
  }
}
console.log(`[validate] ${warnCount} warnings`)

// Ensure prior sort is stable: confirm bbox areas are monotonically non-decreasing.
let prevArea = -1
for (const c of cities) {
  const a = bboxArea(c.bbox)
  if (a < prevArea - 1e-9) {
    throw new Error(`Sort invariant violated at city ${c.name}: area ${a} < previous ${prevArea}`)
  }
  prevArea = a
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5: emit src/data/cities.json
// ─────────────────────────────────────────────────────────────────────────────

const outputDir = path.join(ROOT, 'src/data')
fs.mkdirSync(outputDir, { recursive: true })

const output = {
  version:   '1.7.0-alpha.0',
  generated: new Date().toISOString(),
  license: {
    'world-cities':           'Capital data from UN Statistics Division and Wikipedia (public-domain reference, MIT-aligned)',
    'mawaqit-slugs':          'Curated metadata derived from public Mawaqit profile pages (slugs only)',
    'city-method-overrides':  'Manual, cited per row in scripts/data/city-method-overrides.json',
    'population-centers':     'Manual, sourced from UN World Cities + World Population Review 2024-2025',
  },
  notes: 'Cities sorted by bbox area ascending. detectLocation() linear-scans this array and returns the first bbox that contains (lat, lon) — smallest match wins. Each city carries an institutional `source` (mawaqit | national-authority | inherited) so apps can attribute timetable provenance to users. Method overrides are city-level institutional decisions documented in scripts/data/city-method-overrides.json with citation strings.',
  total: cities.length,
  cities,
}

// Serialise: one city per line for diff-friendliness without the ~50%
// whitespace overhead of full pretty-printing. Top-level metadata uses
// indented JSON; the cities[] array uses one-line-per-city.
const headerObj = { ...output, cities: '__CITIES_PLACEHOLDER__' }
let serialised = JSON.stringify(headerObj, null, 2)
const cityLines = cities.map(c => '    ' + JSON.stringify(c)).join(',\n')
serialised = serialised.replace('"__CITIES_PLACEHOLDER__"', `[\n${cityLines}\n  ]`)

const outputPath = path.join(outputDir, 'cities.json')
fs.writeFileSync(outputPath, serialised)
const stats = fs.statSync(outputPath)
console.log(`Wrote ${cities.length} cities to ${path.relative(ROOT, outputPath)} (${stats.size} bytes, ${(stats.size / 1024).toFixed(1)} KB)`)
