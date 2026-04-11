// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Calculation method definitions and regional defaults.
 *
 * Each method entry includes:
 *   - fajrAngle: degrees below horizon for Fajr dawn
 *   - ishaAngle: degrees below horizon for Isha dusk
 *   - madhab: Hanafi or Shafi'i for Asr shadow length
 *   - regions: array of ISO 3166-1 alpha-2 codes where this method is dominant
 *   - source: the institution or scholarly basis
 *
 * See knowledge/wiki/methods/ for detailed documentation on each method.
 */

export const METHODS = {
  // 🟢 Established methods — published by authoritative institutions

  MWL: {
    name: 'Muslim World League',
    fajrAngle: 18,
    ishaAngle: 17,
    madhab: 'standard',
    regions: ['GB', 'DE', 'FR', 'BE', 'NL', 'AU', 'ZA'],
    source: 'Muslim World League',
  },

  ISNA: {
    name: 'Islamic Society of North America',
    fajrAngle: 15,
    ishaAngle: 15,
    madhab: 'standard',
    regions: ['US', 'CA'],
    source: 'ISNA',
  },

  Egypt: {
    name: 'Egyptian General Authority of Survey',
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    madhab: 'standard',
    regions: ['EG', 'SD', 'LY', 'IQ', 'LB', 'JO', 'PS', 'SY'],
    source: 'Egyptian General Authority of Survey',
  },

  UmmAlQura: {
    name: 'Umm al-Qura University, Makkah',
    fajrAngle: 18.5,
    ishaOffset: 90, // minutes after Maghrib
    madhab: 'standard',
    regions: ['SA'],
    source: 'Umm al-Qura University',
  },

  Kuwait: {
    name: 'Kuwait',
    fajrAngle: 18,
    ishaAngle: 17.5,
    madhab: 'standard',
    regions: ['KW', 'BH', 'QA', 'AE', 'OM', 'YE'],
    source: 'Kuwait Ministry of Awqaf',
  },

  Qatar: {
    name: 'Qatar',
    fajrAngle: 18,
    ishaOffset: 90,
    madhab: 'standard',
    regions: ['QA'],
    source: 'Qatar Ministry of Awqaf',
  },

  Morocco: {
    name: 'Morocco',
    fajrAngle: 18,
    ishaAngle: 17,
    madhab: 'standard',
    regions: ['MA', 'DZ', 'TN'],
    source: 'Moroccan Ministry of Habous and Islamic Affairs',
  },

  Turkey: {
    name: 'Diyanet İşleri Başkanlığı',
    fajrAngle: 18,
    ishaAngle: 17,
    madhab: 'hanafi',
    regions: ['TR', 'AZ', 'KZ', 'UZ', 'TM', 'KG', 'TJ'],
    source: 'Diyanet İşleri Başkanlığı (Turkey)',
  },

  Pakistan: {
    name: 'University of Islamic Sciences, Karachi',
    fajrAngle: 18,
    ishaAngle: 18,
    madhab: 'hanafi',
    regions: ['PK', 'AF', 'IN', 'BD'],
    source: 'University of Islamic Sciences, Karachi',
  },

  Malaysia: {
    name: 'JAKIM',
    fajrAngle: 20,
    ishaAngle: 18,
    madhab: 'standard',
    regions: ['MY', 'SG', 'BN', 'ID'],
    source: 'JAKIM (Malaysia)',
  },
}

/**
 * Get the recommended method for a country code.
 * Returns 'ISNA' as the safe fallback.
 *
 * @param {string} countryCode  ISO 3166-1 alpha-2
 * @returns {string} Method key
 */
export function methodForCountry(countryCode) {
  for (const [key, method] of Object.entries(METHODS)) {
    if (method.regions.includes(countryCode)) return key
  }
  return 'ISNA'
}
