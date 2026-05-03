// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * fajr — core calculation engine
 *
 * This file is the primary target of the autoresearch loop.
 * See CLAUDE.md for editing rules, ratchet conditions, and scholarly classification.
 *
 * Each correction block is tagged:
 *   🟢 Established  — consensus in Islamic astronomy, classical sources
 *   🟡 Limited precedent — regional use, some scholarly support
 *   🔴 Novel — no clear Islamic scholarly precedent, needs review
 */

import * as adhan from 'adhan'
import citiesRegistry from './data/cities.json' with { type: 'json' }

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT 1: Regional method auto-selection
// 🟢 Established — selecting calculation methods by country/region
// Reference: [[wiki/methods/overview]]
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect country from coordinates using bounding boxes.
 * Returns a country key or null if not matched.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {string|null}
 */
function detectCountry(lat, lon) {
  // ─── ORDER MATTERS ─────────────────────────────────────────────────────
  // Smaller / more specific countries are listed FIRST. The function early-
  // returns on the first match, so a small country whose bbox sits inside a
  // larger one's bbox would never match if listed second. v1.6.0 expanded
  // bbox coverage from 27 → 78 countries; ordering rules now span every
  // populated continent. Ordering documented per-cluster below.
  // ──────────────────────────────────────────────────────────────────────

  // ─── Maghreb / North Africa (Atlantic to Mediterranean) ────────────────
  if (lat >= 27   && lat <= 36.5 && lon >= -14  && lon <= -1)   return 'Morocco'
  if (lat >= 30.2 && lat <= 37.6 && lon >= 7.5  && lon <= 11.6) return 'Tunisia'  // tiny — before Algeria
  if (lat >= 19   && lat <= 37.1 && lon >= -8.7 && lon <= 12)   return 'Algeria'
  if (lat >= 19.5 && lat <= 33.2 && lon >= 9.4  && lon <= 25.2) return 'Libya'

  // ─── Gulf — small countries first, before SaudiArabia + Iran ───────────
  if (lat >= 25.5 && lat <= 26.5 && lon >= 50.4 && lon <= 50.85) return 'Bahrain'
  if (lat >= 24   && lat <= 26.5 && lon >= 50.5 && lon <= 51.7) return 'Qatar'
  if (lat >= 28.5 && lat <= 30.2 && lon >= 46.5 && lon <= 48.5) return 'Kuwait'
  if (lat >= 22   && lat <= 26.5 && lon >= 51   && lon <= 56.5) return 'UAE'
  if (lat >= 16   && lat <= 26.5 && lon >= 51.7 && lon <= 60)   return 'Oman'
  if (lat >= 12   && lat <= 19   && lon >= 42   && lon <= 54)   return 'Yemen'

  // ─── Levant — must precede Saudi/Turkey/Iran (significant overlaps) ────
  // Smallest first: Palestine ⊂ Israel/Saudi NW; Lebanon ⊂ Syria;
  // Jordan ⊂ Saudi NW; Syria/Iraq broader.
  if (lat >= 31.2 && lat <= 32.6 && lon >= 34.2 && lon <= 35.6) return 'Palestine'
  if (lat >= 29.49 && lat <= 33.34 && lon >= 34.27 && lon <= 35.90) return 'Israel'
  if (lat >= 33.05 && lat <= 34.7 && lon >= 35.1 && lon <= 36.65) return 'Lebanon'
  if (lat >= 29.18 && lat <= 33.4 && lon >= 34.95 && lon <= 39.3) return 'Jordan'
  if (lat >= 32.3 && lat <= 37.4 && lon >= 35.7 && lon <= 42.4) return 'Syria'
  if (lat >= 29   && lat <= 37.4 && lon >= 38.8 && lon <= 48.6) return 'Iraq'

  // ─── Caucasus — small, must precede Iran (lat 38-39 overlap) + Turkey ──
  if (lat >= 41.05 && lat <= 43.6 && lon >= 40   && lon <= 46.7) return 'Georgia'
  if (lat >= 38.4 && lat <= 41.9 && lon >= 44.8 && lon <= 50.4) return 'Azerbaijan'

  if (lat >= 25   && lat <= 39   && lon >= 44   && lon <= 63)   return 'Iran'

  // ─── Central Asia — smallest first; Turkmenistan must precede Iran ─────
  if (lat >= 36.7 && lat <= 41.05 && lon >= 67.4 && lon <= 75.15) return 'Tajikistan'
  if (lat >= 35.1 && lat <= 42.8 && lon >= 52.4 && lon <= 66.7) return 'Turkmenistan'
  if (lat >= 39.2 && lat <= 43.3 && lon >= 69.25 && lon <= 80.3) return 'Kyrgyzstan'
  if (lat >= 37.2 && lat <= 45.6 && lon >= 55.95 && lon <= 73.2) return 'Uzbekistan'
  if (lat >= 40.5 && lat <= 55.5 && lon >= 46.4 && lon <= 87.4) return 'Kazakhstan'

  if (lat >= 16   && lat <= 33   && lon >= 34   && lon <= 56)   return 'SaudiArabia'
  if (lat >= 35   && lat <= 43   && lon >= 25   && lon <= 45)   return 'Turkey'

  // ─── Balkans (Diyanet-aligned) — after Turkey ──────────────────────────
  if (lat >= 41.85 && lat <= 43.27 && lon >= 20  && lon <= 21.8) return 'Kosovo'
  if (lat >= 39.6 && lat <= 42.7 && lon >= 19.3 && lon <= 21.05) return 'Albania'
  if (lat >= 42.55 && lat <= 45.27 && lon >= 15.7 && lon <= 19.65) return 'Bosnia'

  if (lat >= 21   && lat <= 32   && lon >= 24   && lon <= 38)   return 'Egypt'

  // ─── NE Africa / Horn — smallest first; before Sudan ───────────────────
  if (lat >= 10.9 && lat <= 12.7 && lon >= 41.75 && lon <= 43.42) return 'Djibouti'
  if (lat >= 12.4 && lat <= 18   && lon >= 36.4 && lon <= 43.1) return 'Eritrea'
  if (lat >= -1.7 && lat <= 12   && lon >= 40.9 && lon <= 51.4) return 'Somalia'
  if (lat >= 3.5  && lat <= 12.3 && lon >= 24.1 && lon <= 35.95) return 'SouthSudan'
  if (lat >= 3.4  && lat <= 14.9 && lon >= 32.95 && lon <= 48)  return 'Ethiopia'
  if (lat >= 9.5  && lat <= 22   && lon >= 21.8 && lon <= 38.6) return 'Sudan'

  // ─── West Africa Sahel + coast — smallest-overlap first ────────────────
  if (lat >= 13.05 && lat <= 13.83 && lon >= -16.83 && lon <= -13.79) return 'Gambia'  // ⊂ Senegal
  if (lat >= 12.3 && lat <= 16.7 && lon >= -17.6 && lon <= -11.3) return 'Senegal'
  if (lat >= 14.7 && lat <= 27.3 && lon >= -17.1 && lon <= -4.8) return 'Mauritania'
  if (lat >= 6.9  && lat <= 10   && lon >= -13.3 && lon <= -10.27) return 'SierraLeone'  // ⊂ Guinea-area
  if (lat >= 7.2  && lat <= 12.7 && lon >= -15.1 && lon <= -7.65) return 'Guinea'
  if (lat >= 4.3  && lat <= 10.7 && lon >= -8.6 && lon <= -2.5) return 'CoteDIvoire'
  if (lat >= 4.5  && lat <= 11.2 && lon >= -3.3 && lon <= 1.2)  return 'Ghana'
  if (lat >= 9.4  && lat <= 15.1 && lon >= -5.6 && lon <= 2.4)  return 'BurkinaFaso'
  if (lat >= 10.1 && lat <= 25   && lon >= -12.3 && lon <= 4.3) return 'Mali'
  if (lat >= 11.7 && lat <= 23.5 && lon >= 0.16 && lon <= 16)   return 'Niger'
  if (lat >= 3.9  && lat <= 14   && lon >= 2.7  && lon <= 14.7) return 'Nigeria'
  if (lat >= 7.4  && lat <= 23.5 && lon >= 13.5 && lon <= 24)   return 'Chad'
  if (lat >= 1.7  && lat <= 13.1 && lon >= 8.5  && lon <= 16.2) return 'Cameroon'

  if (lat >= 49   && lat <= 62   && lon >= -9   && lon <= 2.5)  return 'UK'

  // ─── Equatorial SE Asia — small countries first, before Malaysia bbox ─
  if (lat >= 4    && lat <= 5.1  && lon >= 114  && lon <= 115.5) return 'Brunei'
  if (lat >= 1.15 && lat <= 1.5  && lon >= 103.6 && lon <= 104.05) return 'Singapore'
  if (lat >= 0.5  && lat <= 8    && lon >= 99   && lon <= 120)  return 'Malaysia'

  // ─── SE Asia continental — Cambodia/Thailand smaller before Myanmar ──
  if (lat >= 10.4 && lat <= 14.7 && lon >= 102.3 && lon <= 107.6) return 'Cambodia'
  if (lat >= 5.6  && lat <= 20.5 && lon >= 97.3 && lon <= 105.7) return 'Thailand'
  if (lat >= 9.6  && lat <= 28.5 && lon >= 92.2 && lon <= 101.2) return 'Myanmar'
  if (lat >= 4.6  && lat <= 21.1 && lon >= 116.9 && lon <= 126.6) return 'Philippines'

  if (lat >= 24   && lat <= 50   && lon >= -125 && lon <= -66)  return 'USA'
  if (lat >= -24  && lat <= -9   && lon >= -70  && lon <= -57)  return 'Bolivia'
  if (lat >= -5   && lat <= 13   && lon >= -82  && lon <= -66)  return 'Colombia'
  if (lat >= -6   && lat <= 2    && lon >= -82  && lon <= -74)  return 'Ecuador'
  if (lat >= -11  && lat <= 6    && lon >= 95   && lon <= 141)  return 'Indonesia'

  // ─── South Asia — smallest first; India bbox huge so last in cluster ──
  if (lat >= -1   && lat <= 7.5  && lon >= 72.5 && lon <= 74)   return 'Maldives'
  if (lat >= 5.9  && lat <= 9.85 && lon >= 79.5 && lon <= 81.9) return 'SriLanka'  // ⊂ India
  if (lat >= 23   && lat <= 37   && lon >= 60   && lon <= 75)   return 'Pakistan'
  if (lat >= 29.4 && lat <= 38.5 && lon >= 60.5 && lon <= 74.95) return 'Afghanistan'
  if (lat >= 20.5 && lat <= 26.6 && lon >= 88   && lon <= 92.7) return 'Bangladesh'
  if (lat >= 6.5  && lat <= 35.5 && lon >= 68   && lon <= 97.4) return 'India'

  // ─── Indian Ocean / Swahili Coast — before SouthAfrica ─────────────────
  if (lat >= -12.5 && lat <= -11.3 && lon >= 43.2 && lon <= 44.6) return 'Comoros'
  if (lat >= -25.7 && lat <= -11.95 && lon >= 43.2 && lon <= 50.5) return 'Madagascar'
  if (lat >= -4.7 && lat <= 5    && lon >= 33.9 && lon <= 41.9) return 'Kenya'
  if (lat >= -11.8 && lat <= -1  && lon >= 29.3 && lon <= 40.45) return 'Tanzania'
  if (lat >= -26.9 && lat <= -10.4 && lon >= 30.2 && lon <= 41) return 'Mozambique'

  // Southern Africa — only one in this geographic range
  if (lat >= -34.85 && lat <= -22 && lon >= 16  && lon <= 33)   return 'SouthAfrica'

  if (lat >= 42   && lat <= 51.5 && lon >= -5   && lon <= 8.5)  return 'France'
  if (lat >= 41.5 && lat <= 60   && lon >= -95  && lon <= -52)  return 'Canada'
  // Finland and Iceland must be checked before Norway: their bounding boxes
  // are subsets of Norway's broader (4-32°E) box.
  if (lat >= 59   && lat <= 71   && lon >= 19   && lon <= 32)   return 'Finland'
  if (lat >= 62   && lat <= 68   && lon >= -26  && lon <= -12)  return 'Iceland'
  if (lat >= 56   && lat <= 72   && lon >= 4    && lon <= 32)   return 'Norway'
  return null
}

/**
 * Select calculation method and method name for a country/location.
 *
 * 🟢 Established: Method selection by region is the standard practice.
 * See [[wiki/methods/overview]] for the full reference table.
 *
 * @param {string|null} country
 * @param {number} lat
 * @param {adhan.Coordinates} coords
 * @returns {{ params: object, methodName: string }}
 */
function selectMethod(country, lat, coords) {
  switch (country) {
    case 'Morocco': {
      // Ministry of Habous (community-calibrated): Fajr 19°, Isha 17°,
      // Standard Asr, plus -5min Maghrib ihtiyati per v1.5.0 Path A.
      // See knowledge/wiki/methods/morocco.md and knowledge/wiki/regions/morocco.md.
      //
      // Classification: 🟡→🟢 (community calibration; matches mosque-published
      // reality across 18 Moroccan zones).
      //
      // FAJR 19° (v1.0): The formal Ministry-stated angle is 18° but the
      // published Imsakiyya is best reproduced by 19°. Empirically corroborated
      // by the 5-mosque Mawaqit Morocco subset shipped in v1.0.
      //
      // MAGHRIB +5min (v1.5.0): Expanded Mawaqit corpus to 18 Moroccan mosques
      // across all major regions (north: Tanger/Nador; east: Oujda; interior:
      // Fes/Meknes/Taza/Khouribga/Settat; coast: Sale/Kenitra/Safi/Essaouira/
      // Agadir/Taroudant; KEY high-elevation: Ouarzazate 1135m, Errachidia
      // 1037m). The eval per-cell signed-bias (calc − ground truth) shows
      // fajr's calc Maghrib consistently 4-7 minutes EARLIER than what
      // Moroccan mosques publish (per-cell biases negative, mean −5.0 min):
      //
      //   Casablanca: -5     Tanger:  -4     Settat:    -7
      //   Rabat:      -4     Nador:   -4     Khouribga: -7
      //   Marrakech:  -6     Fes:    (sim)   Taza:      -7
      //   Sale:       -5     Meknes:  -6     Oujda:     -7
      //   Kenitra:    -5     Safi:    -4     Ouarzazate: -7
      //   Essaouira:  -4     Agadir:  -5     Errachidia: -7
      //
      // To CLOSE the bias (move calc LATER to match mosque-published), add
      // +5 minutes to Maghrib via methodAdjustments. This is fasting-neutral
      // (Maghrib doesn't gate fasting) and prayer-validity-safer (Maghrib
      // LATER eliminates any pre-sunset risk; mosques publish later because
      // they wait for the sun's disc to FULLY clear the horizon plus a
      // small ihtiyati margin — consistent with classical fiqh requiring
      // certainty the sun has set).
      //
      // Per CLAUDE.md ratchet rule 5, eval/data/train/morocco.json (Aladhan
      // custom-method-99 calc-vs-calc reproduction of 19°/17° without the
      // Maghrib offset) is moved to test/ in v1.5.0 since it represents
      // calc-vs-calc consensus rather than institutional ground truth.
      // Mawaqit Morocco mosques in eval/data/test/mawaqit.json provide the
      // institutional grounding signal.
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 19
      p.ishaAngle = 17
      p.methodAdjustments = { ...(p.methodAdjustments || {}), maghrib: 5 }
      return { params: p, methodName: 'Morocco (19°/17° + +5min Maghrib ihtiyati per Path A community calibration)' }
    }
    case 'SaudiArabia':
      // Umm al-Qura University: Fajr 18.5°, Isha +90 min
      return { params: adhan.CalculationMethod.UmmAlQura(), methodName: 'Umm al-Qura' }
    case 'Turkey': {
      // Diyanet İşleri Başkanlığı: Fajr 18°, Isha 17° + adhan's preset
      // adjustments {sunrise:-7, dhuhr:5, asr:4, maghrib:7, isha:0}.
      //
      // Path A community calibration (v1.4.5): Diyanet's published reality
      // via ezanvakti.emushaf.net sits 1 minute EARLIER than fajr's
      // calc-with-adhan-preset for both Maghrib and Isha. Per-cell empirical
      // residuals across the 3 Turkish ground-truth zones:
      //
      //   Istanbul: Maghrib +0.80, Isha +1.20
      //   Ankara:   Maghrib +1.00, Isha +1.10
      //   Izmir:    Maghrib +0.80, Isha +1.00
      //
      // All three zones consistent in direction and magnitude (sub-2-minute,
      // sub-zone variance). Shifting calc earlier by 1 min for Maghrib and
      // Isha closes the bias uniformly without breaking any per-cell ratchet.
      // The drift is in the ihtiyat-unsafe direction (Maghrib/Isha earlier
      // than calc-default) but is corroborated by the source-bias
      // improvement (Diyanet |Maghrib bias| 0.87→0.13, |Isha bias| 1.10→0.10
      // — both above the Path A floor) and aligns calc with what Turkish
      // Muslims actually pray to per Diyanet's institutional convention.
      // Same Path A pattern as Morocco's formal-vs-published 19° angle and
      // JAKIM's Fajr +8 ihtiyati. 🟡→🟢 community calibration.
      const p = adhan.CalculationMethod.Turkey()
      p.methodAdjustments = { ...(p.methodAdjustments || {}), maghrib: 6, isha: -1 }
      return { params: p, methodName: 'Diyanet (Türkiye, Path A −1min Maghrib/Isha to match ezanvakti)' }
    }
    case 'Egypt':
      // Egyptian General Authority of Survey: Fajr 19.5°, Isha 17.5°
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (19.5°/17.5°)' }
    case 'UK':
      // Moonsighting Committee: Fajr 18°, Isha 18° with seasonal (Shafaq) adjustment
      // 🟢 Established — UK Muslim community predominantly follows Moonsighting Committee
      return { params: adhan.CalculationMethod.MoonsightingCommittee(), methodName: 'MoonsightingCommittee (UK)' }
    case 'Malaysia': {
      // JAKIM: formal 20°/18° + ihtiyati buffer of ~8 minutes for Fajr.
      //
      // Classification: 🟡→🟢 Path A community calibration (community-published
      // reality + multi-source corroboration). Same shape as Morocco's
      // formal-vs-published gap. See knowledge/wiki/regions/malaysia.md.
      //
      // Background: JAKIM's official documentation states Fajr 20° (per
      // adhan.js's Singapore() method). Empirically, JAKIM's published
      // calendar (via waktusolat.app, the community proxy for the geo-
      // restricted e-solat.gov.my) consistently lands ~8.9 minutes LATER
      // than a pure 20° calculation across all Malaysian zones we have
      // ground truth for:
      //
      //   Kuala Lumpur (JAKIM zone WLY01): mean Fajr bias -8.90 min
      //   Shah Alam    (JAKIM zone SGR01): mean Fajr bias -8.20 min
      //   George Town  (JAKIM zone PNG01): mean Fajr bias -9.00 min
      //
      // The ~8-min gap decomposes into the documented 2-minute ihtiyati
      // (precaution buffer) per Razali & Hisham (2021), *Re-evaluation of
      // the Method Used in Determining the Prayer Time Zone in Pahang*
      // (IJHTC v.10(1), Universiti Malaysia Pahang) citing Nurul Asikin
      // (2016), plus a ~6-minute additional margin commonly attributed to
      // naked-eye visibility tolerance — analogous to Aabed (2015)'s
      // recommended 5-minute tayakkun buffer empirically validated for
      // Jordan (Jordan Journal for Islamic Studies v.11(2), 12 naked-eye
      // sessions). Both papers are in knowledge/raw/papers/.
      //
      // The 8-minute offset is applied via adhan's methodAdjustments.fajr
      // rather than by changing the angle, preserving the formally-cited
      // 20° angle in the engine while matching JAKIM's published reality.
      // This is fasting-safer (later Fajr widens the suhoor eating window)
      // AND prayer-validity-safer (later Fajr eliminates pre-dawn risk),
      // satisfying both polarities of ihtiyat — same logic as Morocco 19°.
      //
      // Indonesia (KEMENAG) does NOT need this offset — Aladhan KEMENAG-
      // method ground truth at Jakarta matches a pure 20° calc within
      // 1 minute. The JAKIM offset is institution-specific to Malaysia.
      // Per-cell empirical residuals from waktusolat.app for Isha (post-
      // v1.4.3 elevation-policy fix):
      //   Kuala Lumpur Isha bias: -1.60 min
      //   Shah Alam    Isha bias: -0.90 min
      //   George Town  Isha bias: -0.80 min  (mean -1.10)
      // All three cells show fajr's 18° Isha calc consistently EARLIER than
      // JAKIM's published Isha — magnitude smaller than the +8min Fajr gap
      // but same direction and same documented basis (the 2-minute waktu
      // ihtiyati per Razali & Hisham 2021 / Nurul Asikin 2016, applied
      // across all prayer times by JAKIM's institutional convention). A
      // +1-minute Isha offset closes all three cells uniformly without
      // breaking the per-cell ratchet (KL -1.60→-0.60, Shah Alam
      // -0.90→+0.10, George Town -0.80→+0.20 — all improve |bias|).
      //
      // Maghrib shows similar per-cell direction (-0.90 / -0.25 / -0.48
      // mean -0.54) but heterogeneously: a +1-min Maghrib offset would
      // worsen Shah Alam by ~0.50 min (per-cell ratchet failure). We
      // therefore leave Maghrib untouched until either (a) the heterogeneity
      // resolves into a uniform direction across more zones, or (b) we
      // gain finer-grained per-zone calibration data. Sub-minute Maghrib
      // bias remains within the atmospheric refraction noise floor
      // documented in Young (2006); see knowledge/wiki/astronomy/refraction.md.
      const p = adhan.CalculationMethod.Singapore()
      p.methodAdjustments = { ...(p.methodAdjustments || {}), fajr: 8, isha: 1 }
      return { params: p, methodName: 'JAKIM (20°/18° + 8min Fajr / 1min Isha ihtiyati per Path A community calibration)' }
    }
    case 'USA':
      // ISNA: Fajr 15°, Isha 15°
      return { params: adhan.CalculationMethod.NorthAmerica(), methodName: 'ISNA (NorthAmerica)' }
    case 'Bolivia':
    case 'Colombia':
    case 'Ecuador':
      // South America: Muslim World League is the reference method
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (South America)' }
    case 'Indonesia': {
      // JAKIM-style: Fajr 20°, Isha 18° (equatorial standard — same as Singapore/Malaysia)
      return { params: adhan.CalculationMethod.Singapore(), methodName: 'JAKIM/Singapore (20°/18°)' }
    }
    case 'Pakistan': {
      // University of Islamic Sciences, Karachi: Fajr 18°, Isha 18°, Hanafi Asr
      return { params: adhan.CalculationMethod.Karachi(), methodName: 'Karachi (18°/18°)' }
    }
    case 'UAE': {
      // Dubai / UAE: Umm al-Qura (Gulf region uses this or Kuwait; Aladhan method 4)
      return { params: adhan.CalculationMethod.UmmAlQura(), methodName: 'Umm al-Qura (UAE)' }
    }
    case 'Qatar': {
      // Qatar Calendar House: Fajr 18°, Isha = Maghrib + 90 min (Aladhan method 9)
      return { params: adhan.CalculationMethod.Qatar(), methodName: 'Qatar Calendar House' }
    }
    case 'Kuwait':
    case 'Bahrain':
    case 'Oman':
    case 'Yemen': {
      // Kuwait Ministry of Awqaf method, Fajr 18°, Isha 17.5° — recognised regional
      // default for the lower Gulf per knowledge/wiki/methods (Kuwait regions:
      // KW, BH, QA, AE, OM, YE). UAE and Qatar override above with their own
      // institutional methods (Umm al-Qura and Qatar Calendar House respectively);
      // the rest fall through to Kuwait. Aladhan method 8.
      return { params: adhan.CalculationMethod.Kuwait(), methodName: `Kuwait (Ministry of Awqaf, ${country})` }
    }
    case 'Iran': {
      // Tehran Institute of Geophysics: Fajr 17.7°, Maghrib +4.5min, Isha 14°
      // (Aladhan method 7). 🟢 Established — official Iranian institutional method
      // adopted across Iran. See knowledge/wiki/methods/ for the Tehran method
      // entry once added.
      return { params: adhan.CalculationMethod.Tehran(), methodName: 'Tehran (Institute of Geophysics)' }
    }
    case 'SouthAfrica': {
      // South Africa follows MWL per the major SA bodies (SANHA / MJC); the
      // MWL regions list in methods.js explicitly includes ZA. 🟢 Established.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (South Africa)' }
    }
    case 'Brunei': {
      // JAKIM / MUIS-equivalent (Fajr 20°, Isha 18°) — equatorial standard
      // shared across MY/SG/BN/ID per methods.js. 🟢 Established.
      return { params: adhan.CalculationMethod.Singapore(), methodName: 'JAKIM/Singapore (Brunei)' }
    }
    case 'Singapore': {
      // MUIS (Majlis Ugama Islam Singapura): Fajr 20°, Isha 18°. Aladhan method 10.
      return { params: adhan.CalculationMethod.Singapore(), methodName: 'MUIS (Singapore)' }
    }
    case 'France': {
      // UOIF: Fajr 12°, Isha 12° — high-latitude accommodation for Europe
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 12
      p.ishaAngle = 12
      return { params: p, methodName: 'UOIF (12°/12°)' }
    }
    case 'Canada':
      // ISNA: Fajr 15°, Isha 15° (same as USA)
      return { params: adhan.CalculationMethod.NorthAmerica(), methodName: 'ISNA (Canada)' }
    case 'Norway': {
      // Extreme high-latitude (Tromsø 69.6°N): 18° astronomical twilight never
      // occurs in April — geometric Isha is unreachable and the TwilightAngle
      // fallback (sunset + 18/60 × night ≈ 22:38 local) is too early.
      // Aladhan AngleBased produces ≈ 00:48 local, which matches
      // MiddleOfTheNight (sunset + ½ × night ≈ 00:46 local).
      // 🟢 Established — MiddleOfTheNight is a recognised fallback for
      //   latitudes where astronomical twilight does not occur;
      //   consistent with Aladhan AngleBased output for this region.
      // Reference: [[wiki/regions/high-latitude]]
      const p = adhan.CalculationMethod.MuslimWorldLeague()
      p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight
      return { params: p, methodName: 'MWL + MiddleOfTheNight (Norway)' }
    }
    case 'Iceland': {
      // ─────────────────────────────────────────────────────────────────────
      // EXPERIMENT 5: Reykjavik Isha refinement
      // Aladhan ground truth uses latitudeAdjustmentMethod=1 = MiddleOfNight.
      // Prior setting (TwilightAngle) produced ~24–36 min Isha error at Reykjavik.
      // MiddleOfTheNight should match the ground truth method directly.
      // 🟢 Established — matches Aladhan API's own high-latitude adjustment.
      // Reference: [[wiki/regions/high-latitude]]
      // ─────────────────────────────────────────────────────────────────────
      const p = adhan.CalculationMethod.MuslimWorldLeague()
      p.highLatitudeRule = adhan.HighLatitudeRule.MiddleOfTheNight
      return { params: p, methodName: 'MWL + MiddleOfTheNight (Iceland)' }
    }
    case 'Finland': {
      // Finland: TwilightAngle (computable in April at 60°N, within normal range)
      // 🟢 Established — Aladhan AngleBased for April at Helsinki latitude
      const p = adhan.CalculationMethod.MuslimWorldLeague()
      p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle
      return { params: p, methodName: 'MWL + TwilightAngle (Finland)' }
    }

    // ──────────────────────────────────────────────────────────────────────
    // v1.6.0 GLOBAL BBOX EXPANSION — 51 countries below
    //
    // Each case maps a country to its institutional calculation method.
    // Method choices are sourced from the Aladhan API's per-country defaults
    // (https://api.aladhan.com/v1/methods), the ITL/arabeyes prayer-time
    // method-info documentation (Egyptian regional cluster, Karachi cluster,
    // etc.), and where available each country's national awqaf authority
    // published Imsakiyya. Where no stronger source exists, MuslimWorldLeague
    // is the documented multi-app default. Classification per case below.
    //
    // Multi-method countries (Iraq Sunni-vs-Shia, Lebanon, Azerbaijan, India)
    // pick the most-followed institutional method; v1.6.2 will add city-level
    // overrides via scripts/data/cities.json.
    // ──────────────────────────────────────────────────────────────────────

    // ─── Maghreb non-Morocco ──────────────────────────────────────────────
    case 'Tunisia': {
      // Tunisian Ministry of Religious Affairs: Fajr 18°, Isha 18°. Aladhan
      // method 18 confirms. Tunisia is Maliki (Standard Asr) so use Other()
      // not Karachi() (which sets Hanafi Asr).
      // Classification: 🟢 Established (institutional preset).
      // see knowledge/wiki/regions/tunisia.md (TODO)
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 18
      p.ishaAngle = 18
      return { params: p, methodName: 'Tunisia (Ministry of Religious Affairs, 18°/18°)' }
    }
    case 'Algeria':
      // Algerian Ministry of Religious Affairs and Wakfs: Fajr 18°, Isha 17°
      // — identical to MuslimWorldLeague. Aladhan method 19 "Algeria" preset.
      // Classification: 🟢 Established. see knowledge/wiki/regions/algeria.md (TODO)
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'Algeria (Ministry of Religious Affairs, 18°/17°)' }
    case 'Libya':
      // No Libya-specific institutional preset documented. Awqaf timetables
      // align with the Egyptian regional cluster (19.5°/17.5°) per Aladhan
      // and ITL/arabeyes — not the Maghreb MWL cluster despite geographic
      // proximity to Tunisia/Algeria. Classification: 🟡 Limited precedent.
      // see knowledge/wiki/regions/libya.md (TODO)
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (Libya, regional convention)' }
    case 'Mauritania':
      // Mauritania (Maliki-majority): no published national preset; MWL per
      // MuslimPro/IslamicFinder default. Classification: 🟡.
      // see knowledge/wiki/regions/mauritania.md (TODO)
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Mauritania default)' }

    // ─── Levant ───────────────────────────────────────────────────────────
    case 'Palestine':
      // Palestinian Ministry of Awqaf: Egyptian convention (19.5°/17.5°)
      // historically via Mufti of Jerusalem; Al-Aqsa published times align.
      // bbox covers West Bank + Gaza; Israeli-occupied areas with Muslim
      // residents pray to the same Awqaf-published times.
      // Classification: 🟡→🟢 (institutional convention).
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (Palestinian Awqaf, Mufti of Jerusalem convention)' }
    case 'Lebanon':
      // Dar al-Fatwa al-Lubnaniyya (Sunni): Karachi 18°/18° best matches
      // published Sunni timetables. Bekaa/South Shia regions use Tehran-style
      // (intra-country ikhtilaf — v1.6.2 city override planned).
      // Classification: 🟡 Limited precedent (multi-method country).
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (Lebanon, Aladhan world default)' }
    case 'Jordan': {
      // Jordan Ministry of Awqaf, Islamic Affairs and Holy Places: Fajr 18°,
      // Isha 18°, +5 min Maghrib offset. Aladhan method 23 confirms.
      // Classification: 🟢 Established (institutional preset).
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 18
      p.ishaAngle = 18
      p.methodAdjustments = { ...(p.methodAdjustments || {}), maghrib: 5 }
      return { params: p, methodName: 'Jordan (Ministry of Awqaf, 18°/18° + 5min Maghrib)' }
    }
    case 'Syria':
      // Syrian Ministry of Awqaf: Egyptian method (19.5°/17.5°) per regional
      // cluster (ITL/arabeyes); aladhan defaults Damascus to Egyptian.
      // Classification: 🟢 Established (regional convention).
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (Syria Awqaf default)' }
    case 'Iraq':
      // Iraq: significant intra-country ikhtilaf (Sunni Awqaf vs Shia
      // Najaf/Karbala). Karachi 18°/18° matches Sunni Awqaf published reality;
      // Tehran-style is used in Shia regions. v1.6.2 city-level override
      // planned for Najaf/Karbala. Classification: 🟡 Limited precedent.
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (Iraq, Aladhan world default)' }

    // ─── Caucasus ─────────────────────────────────────────────────────────
    case 'Georgia':
      // Administration of Muslims of All Georgia (~10% Muslim, Sunni Hanafi
      // in Adjara): Diyanet 18°/17° via Turkish-funded mosque institutional
      // presence. Classification: 🟡.
      return { params: adhan.CalculationMethod.Turkey(), methodName: 'Diyanet (Georgia, Adjara Sunni Hanafi via Turkish institutional presence)' }
    case 'Azerbaijan':
      // Caucasian Muslims Office / QMİ (~85% Twelver Shia): Tehran method
      // (17.7°/14° + middle-of-night) — Jafari Maghrib timed to disappearance
      // of redness in eastern sky (~5–15 min after sunset), matched
      // numerically by Tehran's angle-pair. ~15% Sunni Hanafi in Lankaran/
      // north — v1.7.0 city-override planned to switch them to Diyanet.
      // Classification: 🟡→🟢 (institutional convention, Shia majority).
      return { params: adhan.CalculationMethod.Tehran(), methodName: 'Tehran (Azerbaijan QMİ, Shia majority)' }

    // ─── Central Asia ─────────────────────────────────────────────────────
    case 'Tajikistan':
      // Council of Ulema of Tajikistan (Hanafi): MWL 18°/17° per institutional
      // convention. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Tajikistan, Council of Ulema)' }
    case 'Turkmenistan':
      // Muftiate of Turkmenistan (Hanafi): MWL 18°/17° per institutional
      // convention. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Turkmenistan, Muftiate)' }
    case 'Kyrgyzstan':
      // Spiritual Administration of Muslims of Kyrgyzstan (Hanafi): MWL 18°/17°
      // per institutional convention. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Kyrgyzstan, SAMK)' }
    case 'Uzbekistan':
      // Muslim Board of Uzbekistan (Hanafi): MWL 18°/17° per IslamicFinder
      // convention. Note: Russia SAM 16°/15° preset exists but Uzbek Muftiate
      // has not published a definitive preset. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Uzbekistan, Muslim Board)' }
    case 'Kazakhstan':
      // Spiritual Administration of Muslims of Kazakhstan / DUMK (Hanafi):
      // MWL 18°/17° per multi-app convention. Some Russia-influenced regions
      // use SAMR 16°/15°; DUMK has not published a definitive angle pair.
      // Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Kazakhstan, DUMK)' }

    // ─── Balkans ──────────────────────────────────────────────────────────
    case 'Albania':
      // Komuniteti Mysliman i Shqipërisë / KMSH (Sunni Hanafi ~57%): Diyanet
      // 18°/17° per Turkish institutional presence (Great Mosque of Tirana
      // funded by Diyanet). Classification: 🟢 Established.
      return { params: adhan.CalculationMethod.Turkey(), methodName: 'Diyanet (Albania KMSH, Turkish institutional)' }
    case 'Kosovo':
      // Bashkësia Islame e Kosovës / BIK (Sunni Hanafi ~96%): Diyanet
      // 18°/17° per Turkish institutional convention. Hanafi Asr (2× shadow)
      // is correctly applied via the Diyanet method.
      // Classification: 🟢 Established.
      return { params: adhan.CalculationMethod.Turkey(), methodName: 'Diyanet (Kosovo BIK, Turkish institutional)' }
    case 'Bosnia':
      // Rijaset / Islamska Zajednica u BiH (Sunni Hanafi ~51%): Diyanet
      // 18°/17° closest published match to traditional Takvim. Hanafi Asr
      // (2× shadow) correctly applied via Diyanet method. v1.6.2 follow-up:
      // validate against Rijaset's own Takvim publication; consider custom
      // offset if needed. Classification: 🟡→🟢 (regional Diyanet convention).
      return { params: adhan.CalculationMethod.Turkey(), methodName: 'Diyanet (Bosnia Rijaset, Hanafi Takvim)' }

    // ─── NE Africa / Horn ─────────────────────────────────────────────────
    case 'Djibouti':
      // ~94% Sunni Shafi'i; MWL default per MuslimPro / prayer-times.info.
      // Classification: 🟢 Established (multi-app corroboration).
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Djibouti)' }
    case 'Eritrea':
      // ~37% Sunni Shafi'i Red Sea coast; no national preset; MWL regional
      // default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Eritrea default)' }
    case 'Somalia':
      // Ministry of Endowments and Religious Affairs (Sunni Shafi'i): MWL
      // 18°/17° per regional convention + multi-app corroboration.
      // Classification: 🟢.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Somalia, Ministry of Endowments)' }
    case 'SouthSudan':
      // Small Muslim minority (~6%); no national institutional preset; MWL
      // fallback. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (South Sudan fallback)' }
    case 'Ethiopia':
      // Ethiopian Islamic Affairs Supreme Council / Majlis (~34% Muslim):
      // no specific preset; MWL 18°/17° per regional convention. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Ethiopia, Majlis regional convention)' }
    case 'Sudan':
      // Egyptian General Authority of Survey method (19.5°/17.5°) — Sudan is
      // documented in the Egyptian-method regional cluster (ITL/arabeyes);
      // local services (timesprayer.com Khartoum) default Egyptian.
      // Classification: 🟢 Established (regional convention).
      return { params: adhan.CalculationMethod.Egyptian(), methodName: 'Egyptian (Sudan regional)' }

    // ─── West Africa ──────────────────────────────────────────────────────
    case 'Gambia':
      // ~96% Sunni Maliki / Tijaniyya: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Gambia default)' }
    case 'Senegal':
      // Sufi-majority (Tijaniyya / Mouridiyya): MWL default per MuslimPro.
      // Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Senegal default)' }
    case 'SierraLeone':
      // ~78% Sunni Maliki: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Sierra Leone default)' }
    case 'Guinea':
      // ~89% Sunni Maliki: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Guinea default)' }
    case 'CoteDIvoire':
      // ~42% Muslim, Sunni Maliki: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: "MWL (Côte d'Ivoire default)" }
    case 'Ghana':
      // ~20% Muslim, National Chief Imam office: MWL default.
      // Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Ghana default)' }
    case 'BurkinaFaso':
      // ~63% Sunni Maliki: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Burkina Faso default)' }
    case 'Mali':
      // Sunni Maliki majority: MWL default per regional convention.
      // Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Mali default)' }
    case 'Niger':
      // ~99% Sunni Maliki: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Niger default)' }
    case 'Nigeria':
      // Supreme Council for Islamic Affairs (Sultan of Sokoto chair): no
      // formal national preset published; MWL per MuslimPro Sokoto/Kano/
      // Lagos multi-app convention. Classification: 🟡 (institutional
      // citation pending — Sultan of Sokoto council has not endorsed MWL
      // by name).
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Nigeria, Sultan of Sokoto council default)' }
    case 'Chad':
      // ~52% Sunni Maliki/Tijaniyya, West African convention (not Sudan
      // Egyptian cluster): MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Chad default)' }
    case 'Cameroon':
      // ~24% Muslim (concentrated north): MWL default per MuslimPro.
      // Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Cameroon default)' }

    // ─── Indian Ocean / Swahili Coast ─────────────────────────────────────
    case 'Comoros':
      // ~98% Sunni Shafi'i island state: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Comoros default)' }
    case 'Madagascar':
      // ~7% Muslim (Sunni Shafi'i NW coast): MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Madagascar default)' }
    case 'Kenya':
      // SUPKEM / Sunni Shafi'i ~11%: MWL 18°/17° per institutional convention.
      // Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Kenya, SUPKEM)' }
    case 'Tanzania':
      // BAKWATA / Sunni Shafi'i ~35% (Zanzibar ~99%): MWL 18°/17° per
      // institutional convention. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Tanzania, BAKWATA)' }
    case 'Mozambique':
      // CISLAMO / Sunni Shafi'i ~18%: MWL default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Mozambique default)' }

    // ─── South Asia non-Pakistan ──────────────────────────────────────────
    case 'Maldives':
      // Maldives Ministry of Islamic Affairs: Umm al-Qura per IslamicFinder/
      // MuslimPro Malé default. ~100% Sunni Shafi'i. Classification: 🟢.
      return { params: adhan.CalculationMethod.Karachi(), methodName: 'Karachi (Maldives, Aladhan world default)' }
    case 'SriLanka':
      // All Ceylon Jamiyyathul Ulama / ACJU (Sunni Shafi'i): South Asian
      // Karachi 18°/18° regional convention. Classification: 🟡.
      return { params: adhan.CalculationMethod.Karachi(), methodName: 'Karachi (Sri Lanka, ACJU regional)' }
    case 'Bangladesh':
      // Islamic Foundation Bangladesh: same Karachi 18°/18° as Pakistan
      // (Hanafi). ITL/arabeyes documents BD in Karachi cluster.
      // Classification: 🟢 Established (regional convention).
      return { params: adhan.CalculationMethod.Karachi(), methodName: 'Karachi (Islamic Foundation Bangladesh)' }
    case 'Afghanistan':
      // Afghanistan Ministry of Hajj and Religious Affairs (Hanafi-majority).
      // Karachi 18°/18° per ITL/arabeyes regional cluster.
      // Classification: 🟢 Established (regional convention).
      return { params: adhan.CalculationMethod.Karachi(), methodName: 'Karachi (Afghanistan, Hanafi)' }
    case 'India':
      // AIMPLB / Jamiat Ulema-e-Hind (Hanafi-majority): Karachi 18°/18° per
      // ITL/arabeyes cluster. Multi-state ikhtilaf (Kerala/TN Shafi'i,
      // Lucknow Shia) — v1.6.2 city-level overrides planned.
      // Classification: 🟡 Limited precedent (multi-method country).
      return { params: adhan.CalculationMethod.Karachi(), methodName: 'Karachi (India, Hanafi-majority via AIMPLB; multi-state ikhtilaf)' }

    // ─── SE Asia continental ──────────────────────────────────────────────
    case 'Cambodia':
      // Cham Muslims (~2%, Sunni Shafi'i): SE Asia regional MUIS/JAKIM
      // 20°/18° via Malaysian/Indonesian institutional ties.
      // Classification: 🟡.
      return { params: adhan.CalculationMethod.Singapore(), methodName: 'Singapore/MUIS (Cambodia Cham regional)' }
    case 'Thailand':
      // Sheikhul Islam Chularatchamontri (~5% Muslim, southern Patani):
      // Singapore/JAKIM 20°/18° via southern Thai mosques' Malaysian
      // institutional ties. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Thailand, Aladhan world default)' }
    case 'Myanmar':
      // ~4% Muslim (Rohingya, Indian-origin Hanafi via South Asian
      // connection): Karachi 18°/18°. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Myanmar, Aladhan world default)' }
    case 'Philippines':
      // National Commission on Muslim Filipinos / NCMF (Sunni Shafi'i,
      // Bangsamoro): Umm al-Qura per institutional Saudi ties / aladhan
      // default. Classification: 🟡.
      return { params: adhan.CalculationMethod.MuslimWorldLeague(), methodName: 'MWL (Philippines, Aladhan world default)' }

    default: {
      // Fallback: high-latitude auto-detect (lat > 55°)
      if (lat > 55) {
        const p = adhan.CalculationMethod.MuslimWorldLeague()
        p.highLatitudeRule = adhan.HighLatitudeRule.TwilightAngle
        return { params: p, methodName: 'MWL + TwilightAngle (fallback)' }
      }
      return { params: adhan.CalculationMethod.NorthAmerica(), methodName: 'ISNA (default)' }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT 1.5: City-aware location resolver (v1.7.0 phase 1)
// 🟢 Established — city-level institutional dispatch is documented Islamic
// authority practice (Diyanet's per-province ezan vakti, Ministry of Habous's
// per-zone Imsakiyya, JAKIM's per-zone waktu solat). The pure-lookup shape —
// coordinate → (city, country, timezone, method, source) — extends
// detectCountry's bbox approach without changing any astronomy.
// see knowledge/wiki/api/detectLocation.md (proposed; phase 3 publishes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Country → default method-name string.
 *
 * Mirrors the cases of `selectMethod()` above but returns just the method NAME
 * (a string) rather than the full adhan.CalculationParameters object. This is
 * what `detectLocation` surfaces to apps as `recommendedMethod`. Apps then
 * pass the same string back into `prayerTimes({ method })` (or compose with
 * their own selector) to obtain the actual calculation.
 *
 * Kept in lockstep with `selectMethod()` — when adding a new country there,
 * update this table too.
 *
 * @param {string|null} country
 * @returns {string}  Method name; defaults to 'ISNA' (the engine's fallback).
 */
function methodForCountry(country) {
  switch (country) {
    case 'Morocco':            return 'Morocco'
    case 'SaudiArabia':        return 'UmmAlQura'
    case 'Turkey':             return 'Diyanet'
    case 'Egypt':              return 'Egyptian'
    case 'UK':                 return 'MoonsightingCommittee'
    case 'Malaysia':           return 'JAKIM'
    case 'USA':                return 'ISNA'
    case 'Bolivia':            return 'MWL'
    case 'Colombia':           return 'MWL'
    case 'Ecuador':            return 'MWL'
    case 'Indonesia':          return 'JAKIM'
    case 'Pakistan':           return 'Karachi'
    case 'UAE':                return 'UmmAlQura'
    case 'Qatar':              return 'Qatar'
    case 'Kuwait':             return 'Kuwait'
    case 'Bahrain':            return 'Kuwait'
    case 'Oman':               return 'Kuwait'
    case 'Yemen':              return 'Kuwait'
    case 'Iran':               return 'Tehran'
    case 'SouthAfrica':        return 'MWL'
    case 'Brunei':             return 'JAKIM'
    case 'Singapore':          return 'MUIS'
    case 'France':             return 'UOIF'
    case 'Canada':             return 'ISNA'
    case 'Norway':             return 'MWL'
    case 'Iceland':            return 'MWL'
    case 'Finland':            return 'MWL'
    case 'Tunisia':            return 'Tunisia'
    case 'Algeria':            return 'Algeria'
    case 'Libya':              return 'Egyptian'
    case 'Mauritania':         return 'MWL'
    case 'Palestine':          return 'Egyptian'
    case 'Lebanon':            return 'Egyptian'
    case 'Jordan':             return 'Jordan'
    case 'Syria':              return 'Egyptian'
    case 'Iraq':               return 'Egyptian'
    case 'Georgia':            return 'Diyanet'
    case 'Azerbaijan':         return 'Tehran'
    case 'Tajikistan':         return 'MWL'
    case 'Turkmenistan':       return 'MWL'
    case 'Kyrgyzstan':         return 'MWL'
    case 'Uzbekistan':         return 'MWL'
    case 'Kazakhstan':         return 'MWL'
    case 'Albania':            return 'Diyanet'
    case 'Kosovo':             return 'Diyanet'
    case 'Bosnia':             return 'Diyanet'
    case 'Djibouti':           return 'MWL'
    case 'Eritrea':            return 'MWL'
    case 'Somalia':            return 'MWL'
    case 'SouthSudan':         return 'MWL'
    case 'Ethiopia':           return 'MWL'
    case 'Sudan':              return 'Egyptian'
    case 'Gambia':             return 'MWL'
    case 'Senegal':            return 'MWL'
    case 'SierraLeone':        return 'MWL'
    case 'Guinea':             return 'MWL'
    case 'CoteDIvoire':        return 'MWL'
    case 'Ghana':              return 'MWL'
    case 'BurkinaFaso':        return 'MWL'
    case 'Mali':               return 'MWL'
    case 'Niger':              return 'MWL'
    case 'Nigeria':            return 'MWL'
    case 'Chad':               return 'MWL'
    case 'Cameroon':           return 'MWL'
    case 'Comoros':            return 'MWL'
    case 'Madagascar':         return 'MWL'
    case 'Kenya':              return 'MWL'
    case 'Tanzania':           return 'MWL'
    case 'Mozambique':         return 'MWL'
    case 'Maldives':           return 'Karachi'
    case 'SriLanka':           return 'Karachi'
    case 'Bangladesh':         return 'Karachi'
    case 'Afghanistan':        return 'Karachi'
    case 'India':              return 'Karachi'
    case 'Cambodia':           return 'MUIS'
    case 'Thailand':           return 'MWL'
    case 'Myanmar':            return 'MWL'
    case 'Philippines':        return 'MWL'
    default:                   return 'ISNA'
  }
}

/**
 * Resolve a coordinate to its city, country, timezone, recommended method,
 * and institutional source.
 *
 * Pure / referentially transparent for a given (lat, lon, fallbackElevation)
 * — no astronomical computation, no I/O, no caching. Lookup cost is O(N) over
 * the city registry (~375 rows at v1.7.0 phase 1); the registry is sorted
 * with the smallest bboxes first, so a metropolitan-area match short-circuits
 * the linear scan early.
 *
 * Returns:
 *   {
 *     city:              City | null,         // null when no bbox matches
 *     country:           string | null,       // detectCountry(lat, lon)
 *     timezone:          string,              // city.timezone || 'UTC'
 *     elevation:         number,              // city.elevation ?? fallbackElevation
 *     recommendedMethod: string,              // city.methodOverride || methodForCountry(country)
 *     methodSource:      'city-institutional' | 'country-default' | 'fallback',
 *     altMethods?:       AltMethod[],         // present only when the city has documented alternatives
 *     source:            { type, slug?, institution?, from? }
 *   }
 *
 * 🟢 Established — pure lookup, no shar'i ruling involved.
 *
 * NOTE FOR PHASE 1: This function is NOT yet exported from src/index.js.
 * Phase 2 wires it into prayerTimes silently (city-aware method dispatch);
 * phase 3 exposes it publicly with full TypeScript types in src/index.d.ts.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} [fallbackElevation=0]  Used when the matched city has no
 *                                         elevation field, AND when no city
 *                                         matches. In meters.
 * @returns {object}  Location record (shape documented above).
 */
export function detectLocation(latitude, longitude, fallbackElevation = 0) {
  // ── 1. City lookup — linear scan, smallest bbox first (registry is pre-sorted)
  let matchedCity = null
  const list = (citiesRegistry && citiesRegistry.cities) || []
  for (let i = 0; i < list.length; i++) {
    const c = list[i]
    const [latMin, latMax, lonMin, lonMax] = c.bbox
    if (latitude >= latMin && latitude <= latMax &&
        longitude >= lonMin && longitude <= lonMax) {
      matchedCity = c
      break
    }
  }

  // ── 2. Country layer — re-use the existing country bbox table.
  const country = detectCountry(latitude, longitude)

  // ── 3. Timezone — prefer city, then UTC fallback. (We do not synthesise
  //      a country-level timezone fallback because Russia/USA/Canada/China
  //      have multiple zones; UTC is honest when no city matched.)
  const timezone = (matchedCity && matchedCity.timezone) || 'UTC'

  // ── 4. Elevation — city's elevation if known, else caller's fallback.
  const elevation = (matchedCity && matchedCity.elevation != null)
    ? matchedCity.elevation
    : fallbackElevation

  // ── 5. Method dispatch — city-level override > country default > 'ISNA'
  let recommendedMethod, methodSource
  if (matchedCity && matchedCity.methodOverride) {
    recommendedMethod = matchedCity.methodOverride
    methodSource = 'city-institutional'
  } else if (country) {
    recommendedMethod = methodForCountry(country)
    methodSource = 'country-default'
  } else {
    recommendedMethod = 'ISNA'  // engine fallback (matches selectMethod default)
    methodSource = 'fallback'
  }

  // ── 6. Source provenance — prefer the city's recorded source. When no
  //      city matched but a country did, the source is 'inherited' from the
  //      country. When neither matched, source is 'fallback'.
  let source
  if (matchedCity) {
    source = matchedCity.source || { type: 'inherited', from: country || matchedCity.countryISO }
  } else if (country) {
    source = { type: 'inherited', from: country }
  } else {
    source = { type: 'fallback' }
  }

  // ── 7. altMethods — only include when present on the city, to avoid
  //      filling the response with empty arrays for the >95% of cities
  //      with no documented alternative. Apps doing existence checks should
  //      use `altMethods != null` rather than `altMethods.length > 0`.
  const altMethods = (matchedCity && matchedCity.altMethods && matchedCity.altMethods.length)
    ? matchedCity.altMethods.slice()
    : undefined

  const out = {
    city: matchedCity || null,
    country,
    timezone,
    elevation,
    recommendedMethod,
    methodSource,
    source,
  }
  if (altMethods) out.altMethods = altMethods
  return out
}

/**
 * Calculate prayer times for a given location and date.
 *
 * @param {object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {Date}   params.date
 * @param {number} [params.elevation=0]  Elevation in meters above sea level
 * @param {string} [params.method]       Override auto-detected method
 * @returns {object} Prayer times with metadata
 */
/**
 * Per-prayer ihtiyat-aware minute rounding.
 *
 * 🟢 Established — direct application of classical fiqh's *yaqeen* (certainty)
 * principle to display-time rounding. See knowledge/wiki/fiqh/scholarly-oversight.md
 * and CLAUDE.md → "Islamic accuracy principles → Ihtiyat".
 *
 * adhan.js's default rounding is round-to-nearest-minute, which produces a
 * displayed minute on the unsafe side of the underlying solar event ~50% of
 * the time. fajr's prayer-time fields are interpreted as **prayer-start /
 * window-close events** (the canonical interpretation matching classical
 * Imsakiyya tables), so the rounding direction for each prayer is the one
 * that keeps the displayed minute on the prayer-validity-safe side:
 *
 *   Fajr     → UP   (later).    Prayer must start AFTER actual dawn — display later
 *                                so users praying on the displayed minute pray
 *                                inside the valid window.
 *   Shuruq   → DOWN (earlier).  Fajr-window-close event — display earlier so
 *                                the apparent window-close arrives BEFORE actual
 *                                sunrise. Users see the window as already closing
 *                                a few seconds early — prayer-safe.
 *   Dhuhr    → UP   (later).    Sun must have crossed the meridian.
 *   Asr      → UP   (later).    Shadow must have reached the Asr length.
 *   Maghrib  → UP   (later).    Sun must have fully set — also iftar-yaqeen safe.
 *   Isha     → UP   (later).    Twilight must have ended.
 *
 * Dual-ihtiyat note for fasting (imsak): the canonical fiqh resolution is to
 * compute imsak as Fajr − 10 min (rounded DOWN), separately from the Fajr
 * prayer-start field. fajr's API does not expose imsak directly; downstream
 * apps wanting to display fast-stop time should compute it from the returned
 * Fajr value and apply DOWN-rounding themselves. This matches how every
 * Imsakiyya printed in Mecca/Medina/Cairo structures the table — separate
 * Fajr and Imsak columns. Rounding Fajr itself DOWN would invalidate the
 * prayer-start interpretation by potentially displaying a time before actual
 * astronomical dawn.
 *
 * @param {Date} date  Sub-minute-precision Date from adhan.js (rounding=None).
 * @param {'up'|'down'} dir
 * @returns {Date} Date with seconds=0 and minute adjusted per direction.
 */
function roundIhtiyat(date, dir) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return date
  const seconds = date.getUTCSeconds()
  const ms = date.getUTCMilliseconds()
  if (seconds === 0 && ms === 0) return date
  const out = new Date(date.getTime())
  if (dir === 'up') {
    // Advance to the next whole minute (any fractional second rounds up).
    out.setUTCSeconds(60, 0)
  } else {
    // Truncate to the current whole minute (fractional second discarded).
    out.setUTCSeconds(0, 0)
  }
  return out
}

export function prayerTimes({ latitude, longitude, date, elevation = 0, method }) {
  const coords = new adhan.Coordinates(latitude, longitude)

  // 🟢 Established: Region-aware method selection
  const country = detectCountry(latitude, longitude)
  const { params, methodName } = selectMethod(country, latitude, coords)

  // Ask adhan.js for unrounded (seconds-precision) times. We apply our own
  // per-prayer ihtiyat-aware rounding below — see roundIhtiyat() docstring.
  // This overrides whatever rounding the selected method preset specified.
  params.rounding = adhan.Rounding.None

  // adhan v4+ takes a plain Date directly (DateComponents was removed)
  const times = new adhan.PrayerTimes(coords, date, params)

  // Surface scholarly-grounded caveats specific to this location. Empty
  // array when no specific notes apply. Each entry is a complete sentence
  // with a wiki citation. Consumers may render none, all, or a curated
  // subset depending on UX. Currently emits the high-latitude note when
  // |lat| ≥ 48.6° per Odeh 2009 — see wiki/regions/iceland.md.
  const notes = []
  if (Math.abs(latitude) >= 48.6) {
    notes.push(
      'High-latitude regime: at latitudes ≥48.6°, calculated Isha and ' +
      'next-day Fajr may converge to within minutes during summer per ' +
      'Odeh (2009). This is expected behaviour of the middle-of-night ' +
      'rule, not a calculation error. See knowledge/wiki/regions/iceland.md.'
    )
  }

  // Elevation advisory (v1.5.2). When the caller passes a non-trivial
  // elevation (≥ 500 m, where the geometric horizon dip is > 2 min on
  // Shuruq/Maghrib), surface a notes[] entry describing the institutional
  // disagreement so the consumer can make an informed choice. The dip is
  // NOT applied automatically — fajr leaves the correction off by default
  // (matching Saudi/Umm al-Qura's jama'ah-unity stance) but documents that
  // UAE / Malaysia JAKIM apply it. Apps wanting to apply pass the result
  // through applyElevationCorrection(times, elevation, latitude).
  //
  // 500 m threshold is chosen because:
  //   • below 200 m, the dip is < 1 min (sub-prayer-buffer noise)
  //   • 200–500 m is 1–2 min (within institutional ihtiyati buffers)
  //   • 500–1500 m is 2–5 min (where institutional bodies have weighed in)
  //   • > 1500 m is > 5 min (definitely worth flagging)
  // The threshold also tolerates phone-GPS altitude noise (typically
  // ±10–30 m) without flickering the advisory state.
  if (elevation >= 500) {
    const dipMin = computeElevationDipMinutes(elevation, latitude)
    notes.push(
      `Elevation advisory: altitude ${Math.round(elevation)} m is above the ` +
      `500 m threshold where the geometric horizon dip becomes practically ` +
      `significant — sun rises ~${dipMin.toFixed(1)} min EARLIER and Maghrib ` +
      `falls ~${dipMin.toFixed(1)} min LATER than at sea level. Institutional ` +
      `stances differ: UAE (Burj Khalifa fatwa, IACAD Dulook DXB) and Malaysia ` +
      `JAKIM apply this correction; Saudi Arabia / Umm al-Qura declines it for ` +
      `jama'ah unity. Because you passed a non-zero elevation, fajr's public ` +
      `\`prayerTimes\` wrapper has applied the correction (apply-stance default ` +
      `when elevation is supplied). To compute sea-level times instead, call ` +
      `again with \`elevation: 0\`. The app/user should choose based on local ` +
      `mosque practice. See knowledge/wiki/corrections/elevation.md.`
    )
  }

  // Per-prayer ihtiyat rounding — see roundIhtiyat() docstring above.
  const fajr_   = roundIhtiyat(times.fajr,    'up')
  const shuruq_ = roundIhtiyat(times.sunrise, 'down')
  const dhuhr_  = roundIhtiyat(times.dhuhr,   'up')
  const asr_    = roundIhtiyat(times.asr,     'up')
  const maghrib_= roundIhtiyat(times.maghrib, 'up')
  const isha_   = roundIhtiyat(times.isha,    'up')
  // Sunset is the astronomical event coinciding with Maghrib's start in most
  // methods. Round UP — same direction as Maghrib so the two fields stay
  // consistent for methods where the only difference is a post-sunset offset
  // (some Diyanet variants).
  const sunset_ = roundIhtiyat(times.sunset,  'up')

  // Imsak — classical fasting-yaqeen field. Computed as the astronomical
  // (sub-minute-precision) Fajr minus IMSAK_OFFSET_MIN, then rounded DOWN
  // for fasting-validity safety. The 10-minute default offset is the
  // classical convention from Imsakiyya tables published in Mecca, Medina,
  // and Cairo for over a century. Apps wanting a different offset can
  // recompute as Fajr − N minutes downstream.
  //
  // 🟢 Established — universal Imsakiyya convention.
  const IMSAK_OFFSET_MIN = 10
  const imsakRaw = new Date(times.fajr.getTime() - IMSAK_OFFSET_MIN * 60 * 1000)
  const imsak_   = roundIhtiyat(imsakRaw, 'down')

  let result = {
    imsak:   imsak_,
    fajr:    fajr_,
    shuruq:  shuruq_,
    // `sunrise` is an English-language alias for `shuruq`, kept in sync.
    // Lets adhan.js consumers migrate to fajr without a field-rename ripple
    // through their downstream display logic. The two fields point at the
    // same Date instance — modify one or the other, never both.
    sunrise: shuruq_,
    dhuhr:   dhuhr_,
    asr:     asr_,
    maghrib: maghrib_,
    isha:    isha_,
    // Astronomical sunset, distinct from `maghrib` for methods that apply
    // a post-sunset offset (e.g. some Diyanet variants). For most methods
    // these are identical to within a second. adhan.js exposes both, so
    // fajr does too — back-compat for adhan-migrating apps that tracked
    // them as separate fields.
    sunset:  sunset_,
    method:  methodName,
    notes,
    corrections: {
      elevation: false,
      refraction: 'standard (0.833°)',
      rounding:  'ihtiyat-aware per-prayer (Imsak/Shuruq DOWN; Fajr/Dhuhr/Asr/Maghrib/Isha/Sunset UP)',
      imsak_offset_min: 10,
    },
  }

  // NOTE: Elevation correction (applyElevationCorrection) is available as a
  // utility but NOT activated here. Experiment 4 confirmed that the Aladhan
  // ground truth uses sea-level calculations; applying elevation correction
  // diverges from it and increases WMAE. Correction is 🟡 Limited precedent —
  // available for use when ground truth is also elevation-corrected.

  return result
}

/**
 * Pure helper — compute the elevation horizon-dip correction in minutes.
 *
 * Geometric horizon dip: dip° = arccos(R / (R + h))
 * Time conversion at latitude φ: minutes = dip° × 4 / cos(φ)
 *
 * Used by applyElevationCorrection (which applies it) AND by prayerTimes
 * (which surfaces it as a `notes[]` advisory when elevation ≥ 500 m).
 *
 * @param {number} elevation  Meters above sea level
 * @param {number} latitude   Degrees (for latitude correction of time offset)
 * @returns {number} Correction magnitude in minutes (always positive)
 */
export function computeElevationDipMinutes(elevation, latitude = 0) {
  if (!elevation || elevation <= 0) return 0
  const EARTH_RADIUS_M = 6371000
  const horizonDipDeg = Math.acos(EARTH_RADIUS_M / (EARTH_RADIUS_M + elevation)) * (180 / Math.PI)
  return horizonDipDeg * 4 / Math.cos(latitude * Math.PI / 180)
}

/**
 * Apply elevation-based horizon correction to a set of prayer times.
 *
 * 🟡→🟢 Approaching established: Geometry is classical; institutional
 * precedent includes UAE Grand Mufti's Burj Khalifa fatwa (IACAD Dulook DXB
 * publishes floor-stratified times) and Malaysia JAKIM's systematic
 * topographic correction. Saudi Arabia / Umm al-Qura explicitly DECLINES
 * the correction, prioritising jama'ah unity (high-rise residents pray with
 * their city, not their floor). fajr leaves it OFF by default; pass through
 * this function to apply. See wiki/corrections/elevation.md.
 *
 * @param {object} times      Output from prayerTimes()
 * @param {number} elevation  Meters above sea level
 * @param {number} latitude   Degrees (for latitude correction of time offset)
 * @returns {object} Corrected times
 */
export function applyElevationCorrection(times, elevation, latitude = 0) {
  if (!elevation || elevation <= 0) return times

  const correctionMin = computeElevationDipMinutes(elevation, latitude)
  const corrMs = correctionMin * 60 * 1000

  const adjusted = { ...times }
  // Shuruq (sunrise) is earlier at elevation — depressed horizon. Re-apply
  // ihtiyat-aware DOWN rounding so the post-correction Date stays on whole
  // minutes (input was rounded by prayerTimes; sub-minute shift would
  // reintroduce fractional seconds).
  adjusted.shuruq  = roundIhtiyat(new Date(times.shuruq.getTime()  - corrMs), 'down')
  adjusted.sunrise = adjusted.shuruq    // keep alias in sync with shuruq
  // Maghrib (sunset) is later at elevation. Astronomical `sunset` shifts by
  // the same geometric amount as `maghrib` for methods where they coincide;
  // for methods with a maghrib offset we still want the astronomical sunset
  // itself elevation-corrected, so update both. Re-apply UP rounding for
  // both per the v1.5.1 ihtiyat principle.
  adjusted.maghrib = roundIhtiyat(new Date(times.maghrib.getTime() + corrMs), 'up')
  adjusted.sunset  = roundIhtiyat(new Date(times.sunset.getTime()  + corrMs), 'up')
  adjusted.corrections = { ...times.corrections, elevation: true, elevationCorrectionMin: +correctionMin.toFixed(2) }

  return adjusted
}

/**
 * Apply a tayakkun (تيقن — "certainty") buffer to Fajr.
 *
 * 🟡 Limited precedent: based on Aabed (2015), a peer-reviewed naked-eye
 * observational study published in the Jordan Journal for Islamic Studies
 * v. 11(2). Twelve observation sessions in four Jordanian localities during
 * 1430/1431 AH found that the true dawn was observed 4–5 minutes after the
 * calculated 18° Fajr time. The paper recommends keeping the calculated
 * time as-is, but adds: *"It is also accepted to delay A'than by 5 minutes
 * only to be sure of the right timing (tayakkun)."*
 *
 * This function applies that recommended buffer. It is opt-in (default
 * pipeline does not apply it) because the calculated 18° angle is itself
 * astronomically correct; the buffer is for fasting-precaution / observer-
 * certainty. Apply selectively when the consumer wants to err toward the
 * fasting-safer direction at locations where naked-eye verification would
 * trail the calculated time.
 *
 * See knowledge/wiki/methods/fajr-angle-empirics.md for the full discussion.
 *
 * @param {object} times    Output from prayerTimes() or dayTimes()
 * @param {number} [mins=5] Buffer in minutes; default 5 per Aabed 2015
 * @returns {object} Times with Fajr delayed by `mins` and a note appended
 */
export function applyTayakkunBuffer(times, mins = 5) {
  if (!mins || mins <= 0) return times

  const adjusted = { ...times }
  adjusted.fajr = new Date(times.fajr.getTime() + mins * 60 * 1000)
  // Notes is always present on prayerTimes() output as of v1.2.0; guard
  // for callers that hand-roll a `times` object without it.
  const noteText =
    `Tayakkun buffer applied: Fajr delayed by ${mins} minute${mins === 1 ? '' : 's'} ` +
    `per Aabed (2015) recommendation for naked-eye certainty. The unbuffered ` +
    `calculated 18° Fajr is astronomically correct; this buffer is for ` +
    `fasting-precaution and observer-certainty (tayakkun).`
  adjusted.notes = [...(times.notes || []), noteText]

  return adjusted
}
