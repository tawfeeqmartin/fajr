// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Tests for v1.7.22 #83/#88 — country→Asr-convention dispatch table.
 *
 * Fixes the v1.7.21 adhan-preset leak where every country reported
 * `madhab: 'shafii'` regardless of institutional convention. Now
 * Hanafi-majority countries return location.asrConvention='hanafi' as metadata,
 * while applied.asrSchool remains tied to the selected timetable method
 * unless an explicit calculation override is used.
 * Deprecated `madhab` aliases mirror `standard` / `hanafi` Asr values; they
 * must not emit `shafii` for Maliki/Hanbali/Jafari-standard regions.
 */

import { describe, it, expect } from 'vitest'
import { prayerTimes } from '../src/index.js'

describe('#83 — Hanafi-majority country dispatch', () => {
  const HANAFI_CITIES = [
    ['Karachi PK',   24.8607, 67.0011],
    ['Dhaka BD',     23.8103, 90.4125],
    ['Istanbul TR',  41.0082, 28.9784],
    ['Tirana AL',    41.3275, 19.8189],
    ['Tashkent UZ',  41.3111, 69.2401],
    ['Almaty KZ',    43.2220, 76.8512],
    ['Bishkek KG',   42.8746, 74.5698],
    ['Sarajevo BA',  43.8563, 18.4131],
    ['Pristina XK',  42.6629, 21.1655],
    ['Skopje MK',    41.9981, 21.4254],
    ['Kabul AF',     34.5553, 69.2075],
    ['Mumbai IN',    19.0760, 72.8777],
    ['Delhi IN',     28.6139, 77.2090],
  ]

  for (const [name, lat, lon] of HANAFI_CITIES) {
    it(`${name} → asrConvention='hanafi' / asrConventionSource='country-default'`, () => {
      const r = prayerTimes({ latitude: lat, longitude: lon, date: new Date('2026-05-04') })
      expect(r.location.asrConvention).toBe('hanafi')
      expect(r.location.asrConventionSource).toBe('country-default')
      // Deprecated aliases mirror Asr convention values for v1.7.21 consumers.
      expect(r.location.madhab).toBe('hanafi')
      expect(r.location.madhabSource).toBe('country-default')
      expect(r.applied.asrSchool).toBe('standard')
      expect(r.applied.madhab).toBe('standard')
    })
  }
})

describe('#83/#88 — standard-Asr country dispatch', () => {
  const STANDARD_CITIES = [
    ['Jakarta ID',   -6.2088, 106.8456],
    ['KL MY',         3.1390, 101.6869],
    ['Singapore',     1.3521, 103.8198],
    ['Malé MV',       4.1755,  73.5093],   // also explicit-Shafi composition
    ['Colombo LK',    6.9271,  79.8612],   // also explicit-Shafi composition
    ['Sanaa YE',     15.3694,  44.1910],
    ['Mogadishu SO',  2.0469,  45.3182],
    ['Bandar Seri Begawan BN', 4.9031, 114.9398],
  ]

  for (const [name, lat, lon] of STANDARD_CITIES) {
    it(`${name} → asrConvention='standard'`, () => {
      const r = prayerTimes({ latitude: lat, longitude: lon, date: new Date('2026-05-04') })
      expect(r.location.asrConvention).toBe('standard')
      // Deprecated alias mirrors standard 1× Asr, not Shafi legal madhhab.
      expect(r.location.madhab).toBe('standard')
      expect(r.applied.asrSchool).toBe('standard')
      expect(r.applied.madhab).toBe('standard')
    })
  }
})

describe('#83 — mixed/leave-default countries fall through to method-implied', () => {
  // Mixed-madhab countries deliberately not in COUNTRY_ASR_CONVENTION because no
  // single label is right at the country level (Egypt institutional-Hanafi vs
  // scholarly-Shafi'i; Saudi Hanbali-legal + Eastern-Province-Shia minority;
  // Iraq multi-sect city-level overrides; Lebanon/Syria religiously plural;
  // Western diaspora heterogeneous). Audit confirms: 2026-05-05-madhab-asr-convention-grounding.md §2.3 + §5.
  const FALLTHROUGH_CITIES = [
    ['Cairo EG',      30.0626, 31.2497],
    ['Mecca SA',      21.4225, 39.8262],
    ['Beirut LB',     33.8938, 35.5018],
    ['Baghdad IQ',    33.3152, 44.3661],   // (Mosul/Najaf/Karbala have city overrides)
    ['London UK',     51.5074, -0.1278],
    ['New York US',   40.7128, -74.0060],
    ['Paris FR',      48.8566,  2.3522],
    ['Sydney AU',    -33.8688, 151.2093],
  ]

  for (const [name, lat, lon] of FALLTHROUGH_CITIES) {
    it(`${name} → asrConventionSource='method-implied' (no country override)`, () => {
      const r = prayerTimes({ latitude: lat, longitude: lon, date: new Date('2026-05-04') })
      expect(r.location.asrConventionSource).toBe('method-implied')
      expect(r.location.madhabSource).toBe('method-implied')
    })
  }
})

describe('#83 v1.7.23 — Maliki / Jafari / Cham countries report standard with country-default source', () => {
  // The v1.7.23 audit (Track C scholarly grounding) added 15 entries to
  // COUNTRY_ASR_CONVENTION for countries previously falling through to
  // method-implied. The 'standard' label captures Asr-shadow convention
  // ONLY — Morocco/Tunisia/Algeria/Libya/Mauritania/Senegal/Mali/Gambia/
  // Niger/BurkinaFaso/CoteDIvoire are MALIKI legal madhhab; Iran is
  // Twelver JAFARI; Cambodia/Thailand/Philippines (Bangsamoro/Cham) are
  // Sunni SHAFI'I. All converge on 1× shadow Asr.
  const STANDARD_COUNTRY_DEFAULT_CITIES = [
    ['Casablanca MA',  33.5731,  -7.5898],   // Maliki
    ['Tunis TN',       36.8065,  10.1815],   // Maliki
    ['Algiers DZ',     36.7538,   3.0588],   // Maliki
    ['Tripoli LY',     32.8872,  13.1913],   // Maliki
    ['Nouakchott MR',  18.0735, -15.9582],   // Maliki Trans-Saharan
    ['Dakar SN',       14.6928, -17.4467],   // Maliki + Tijaniyya
    ['Bamako ML',      12.6392,  -8.0029],   // Maliki
    ['Banjul GM',      13.4549, -16.5790],   // Maliki
    ['Niamey NE',      13.5117,   2.1098],   // Maliki Trans-Saharan
    ['Ouagadougou BF', 12.3714,  -1.5197],   // Maliki Trans-Saharan
    ['Abidjan CI',      5.3600,  -4.0083],   // Maliki Trans-Saharan
    ['Tehran IR',      35.6892,  51.3890],   // Twelver Jafari
    ['Phnom Penh KH',  11.5564, 104.9282],   // Cham Shafi'i
    ['Bangkok TH',     13.7563, 100.5018],   // Patani Malay Shafi'i
    ['Manila PH',      14.5995, 120.9842],   // BARMM / Bangsamoro Shafi'i
  ]

  for (const [name, lat, lon] of STANDARD_COUNTRY_DEFAULT_CITIES) {
    it(`${name} → asrConvention='standard' / asrConventionSource='country-default'`, () => {
      const r = prayerTimes({ latitude: lat, longitude: lon, date: new Date('2026-05-05') })
      expect(r.location.asrConvention).toBe('standard')
      expect(r.location.asrConventionSource).toBe('country-default')
      // Legacy alias mirrors asrConvention without legal-madhhab wording.
      expect(r.location.madhab).toBe('standard')
      expect(r.location.madhabSource).toBe('country-default')
    })
  }

  it('Morocco exposes standard Asr convention without claiming Shafi legal madhhab', () => {
    // The v1.7.23 audit closed the cautionary-example loop: Morocco is now
    // explicitly in COUNTRY_ASR_CONVENTION as 'standard' with a Maliki disclaimer.
    // The README + disclaimer copy explain that 'standard' is shadow-convention
    // metadata, NOT a claim about legal madhhab.
    const r = prayerTimes({ latitude: 33.5731, longitude: -7.5898, date: new Date('2026-05-05') })
    expect(r.location.country).toBe('Morocco')
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('country-default')
    expect(r.location.madhab).toBe('standard')
    expect(r.location.madhab).not.toBe('shafii')
    expect(r.applied.madhab).toBe('standard')
    expect(r.applied.madhab).not.toBe('shafii')
    expect(r.disclaimer).toContain('Asr convention')
    expect(r.disclaimer).not.toContain('madhab + elevation')
  })
})

describe('#83 — explicit-Shafi composition (Maldives / Sri Lanka / KarachiShafi cities) preserved', () => {
  it('Malé MV preserves explicit Shafi composition; asrConventionSource=method-implied', () => {
    const r = prayerTimes({ latitude: 4.1755, longitude: 73.5093, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('standard')
    expect(r.location.madhabSource).toBe('method-implied')
    // methodName carries the '+ Shafi Asr' explicit-composition marker
    expect(r.method).toMatch(/\+ Shafi Asr/)
  })

  it('Colombo LK preserves explicit Shafi composition', () => {
    const r = prayerTimes({ latitude: 6.9271, longitude: 79.8612, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('standard')
    expect(r.location.madhabSource).toBe('method-implied')
    expect(r.method).toMatch(/\+ Shafi Asr/)
  })

  it('Kochi IN city-override (KarachiShafi) preserves Shafi despite India being Hanafi-default', () => {
    const r = prayerTimes({ latitude: 9.9312, longitude: 76.2673, date: new Date('2026-05-04') })
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhab).toBe('standard')
    expect(r.location.madhabSource).toBe('method-implied')
    expect(r.method).toMatch(/\+ Shafi Asr/)
  })
})

describe('#83/#85 — metadata does not silently shift Asr calculation', () => {
  it('Karachi PK reports Hanafi metadata but keeps method-implied standard Asr', () => {
    // Country-level Asr metadata is useful for UX, but #85 split it from
    // calculation-facing Asr because blanket 2× shadow mutation regressed
    // current institutional fixtures. Karachi and KarachiShafi should remain
    // effectively identical until a caller-explicit Asr override lands.
    const date = new Date('2026-06-21T00:00:00Z')  // summer solstice — biggest Asr gap
    const auto = prayerTimes({ latitude: 24.8607, longitude: 67.0011, date })
    const shafii = prayerTimes({ latitude: 24.8607, longitude: 67.0011, date, method: 'KarachiShafi' })
    const diffMin = (auto.asr.getTime() - shafii.asr.getTime()) / 60000
    expect(auto.location.asrConvention).toBe('hanafi')
    expect(auto.location.asrConventionSource).toBe('country-default')
    expect(auto.location.madhab).toBe('hanafi')
    expect(auto.location.madhabSource).toBe('country-default')
    expect(auto.applied.asrSchool).toBe('standard')
    expect(auto.applied.madhab).toBe('standard')
    expect(auto.notes.some(note => note.includes('Asr-convention advisory'))).toBe(true)
    expect(Math.abs(diffMin)).toBeLessThanOrEqual(1)
  })
})

describe('#83 — caller-explicit method bypasses COUNTRY_ASR_CONVENTION', () => {
  it('Pakistan + caller method=ISNA → asrConventionSource=method-implied (not country-default)', () => {
    const r = prayerTimes({ latitude: 24.8607, longitude: 67.0011, date: new Date('2026-05-04'), method: 'ISNA' })
    expect(r.location.asrConventionSource).toBe('method-implied')
    expect(r.location.madhabSource).toBe('method-implied')
    // ISNA preset uses Shafi (adhan default); caller-explicit path doesn't
    // consult COUNTRY_ASR_CONVENTION so Pakistan's Hanafi default doesn't fire.
    expect(r.location.asrConvention).toBe('standard')
    expect(r.location.madhab).toBe('standard')
  })
})
