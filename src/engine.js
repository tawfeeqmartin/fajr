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
  // larger one's bbox would never match if listed second. The Gulf region
  // is the main case: Bahrain/Qatar/Kuwait/Oman/UAE bboxes all overlap with
  // Saudi Arabia's, so they must be checked before SaudiArabia.
  // ──────────────────────────────────────────────────────────────────────

  if (lat >= 27   && lat <= 36.5 && lon >= -14  && lon <= -1)   return 'Morocco'

  // Gulf — small countries first, before SaudiArabia bbox catches them.
  // Within the Gulf cluster, the order is: smallest islands → coastal small
  // states → UAE → Oman (UAE's bbox is a subset of Oman's broader lat range,
  // so UAE must be checked first for Dubai-area coords to dispatch correctly).
  if (lat >= 25.5 && lat <= 26.5 && lon >= 50.4 && lon <= 50.85) return 'Bahrain'
  if (lat >= 24   && lat <= 26.5 && lon >= 50.5 && lon <= 51.7) return 'Qatar'
  if (lat >= 28.5 && lat <= 30.2 && lon >= 46.5 && lon <= 48.5) return 'Kuwait'
  if (lat >= 22   && lat <= 26.5 && lon >= 51   && lon <= 56.5) return 'UAE'
  if (lat >= 16   && lat <= 26.5 && lon >= 51.7 && lon <= 60)   return 'Oman'
  if (lat >= 12   && lat <= 19   && lon >= 42   && lon <= 54)   return 'Yemen'
  if (lat >= 25   && lat <= 39   && lon >= 44   && lon <= 63)   return 'Iran'

  if (lat >= 16   && lat <= 33   && lon >= 34   && lon <= 56)   return 'SaudiArabia'
  if (lat >= 35   && lat <= 43   && lon >= 25   && lon <= 45)   return 'Turkey'
  if (lat >= 21   && lat <= 32   && lon >= 24   && lon <= 38)   return 'Egypt'
  if (lat >= 49   && lat <= 62   && lon >= -9   && lon <= 2.5)  return 'UK'

  // Equatorial SE Asia — small countries first, before Malaysia bbox
  if (lat >= 4    && lat <= 5.1  && lon >= 114  && lon <= 115.5) return 'Brunei'
  if (lat >= 1.15 && lat <= 1.5  && lon >= 103.6 && lon <= 104.05) return 'Singapore'
  if (lat >= 0.5  && lat <= 8    && lon >= 99   && lon <= 120)  return 'Malaysia'

  if (lat >= 24   && lat <= 50   && lon >= -125 && lon <= -66)  return 'USA'
  if (lat >= -24  && lat <= -9   && lon >= -70  && lon <= -57)  return 'Bolivia'
  if (lat >= -5   && lat <= 13   && lon >= -82  && lon <= -66)  return 'Colombia'
  if (lat >= -6   && lat <= 2    && lon >= -82  && lon <= -74)  return 'Ecuador'
  if (lat >= -11  && lat <= 6    && lon >= 95   && lon <= 141)  return 'Indonesia'
  if (lat >= 23   && lat <= 37   && lon >= 60   && lon <= 75)   return 'Pakistan'

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
      // Ministry of Habous (community-calibrated): Fajr 19°, Isha 17°, Standard Asr.
      // see knowledge/wiki/methods/morocco.md
      // Classification: 🟡→🟢 (community calibration; matches mosque-published reality)
      //
      // The formal Ministry-stated angle is 18°, but the published Imsakiyya
      // is best reproduced by 19° per the wiki's documented community calibration.
      // Empirically corroborated by Mawaqit mosque-published times across 5 Moroccan
      // mosques (Casablanca, Rabat, Marrakech): real Fajr is ~5-7 min earlier
      // than the 18° calculation. Critical during Ramadan — 18° produced engine
      // Fajr ~5 min late vs mosque tables, which would push imsak past actual
      // dawn for fasters (broken fast). The +5 min was prayer-safe but
      // fasting-unsafe; 19° matches what Moroccan Muslims actually pray to.
      // Ratchet acceptance via Path A cross-source corroboration: Aladhan-Morocco
      // and Mawaqit-Morocco both showed |Fajr bias| improvements ≫ aggregate drift.
      const p = adhan.CalculationMethod.Other()
      p.fajrAngle = 19
      p.ishaAngle = 17
      return { params: p, methodName: 'Morocco (19°/17° community calibration)' }
    }
    case 'SaudiArabia':
      // Umm al-Qura University: Fajr 18.5°, Isha +90 min
      return { params: adhan.CalculationMethod.UmmAlQura(), methodName: 'Umm al-Qura' }
    case 'Turkey':
      // Diyanet İşleri Başkanlığı: Fajr 18°, Isha 17° + minute adjustments
      return { params: adhan.CalculationMethod.Turkey(), methodName: 'Diyanet (Turkey)' }
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
      const p = adhan.CalculationMethod.Singapore()
      p.methodAdjustments = { ...(p.methodAdjustments || {}), fajr: 8 }
      return { params: p, methodName: 'JAKIM (20°/18° + 8min ihtiyati per Path A community calibration)' }
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
export function prayerTimes({ latitude, longitude, date, elevation = 0, method }) {
  const coords = new adhan.Coordinates(latitude, longitude)

  // 🟢 Established: Region-aware method selection
  const country = detectCountry(latitude, longitude)
  const { params, methodName } = selectMethod(country, latitude, coords)

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

  let result = {
    fajr:    times.fajr,
    shuruq:  times.sunrise,
    // `sunrise` is an English-language alias for `shuruq`, kept in sync.
    // Lets adhan.js consumers migrate to fajr without a field-rename ripple
    // through their downstream display logic. The two fields point at the
    // same Date instance — modify one or the other, never both.
    sunrise: times.sunrise,
    dhuhr:   times.dhuhr,
    asr:     times.asr,
    maghrib: times.maghrib,
    isha:    times.isha,
    // Astronomical sunset, distinct from `maghrib` for methods that apply
    // a post-sunset offset (e.g. some Diyanet variants). For most methods
    // these are identical to within a second. adhan.js exposes both, so
    // fajr does too — back-compat for adhan-migrating apps that tracked
    // them as separate fields.
    sunset:  times.sunset,
    method:  methodName,
    notes,
    corrections: {
      elevation: false,
      refraction: 'standard (0.833°)',
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
 * Apply elevation-based horizon correction to a set of prayer times.
 *
 * 🟡 Limited precedent: Geometry is classical; application to Islamic prayer
 * times has precedent in classical muwaqqit texts but is not adopted by any
 * major institution. See wiki/corrections/elevation.md.
 *
 * @param {object} times      Output from prayerTimes()
 * @param {number} elevation  Meters above sea level
 * @param {number} latitude   Degrees (for latitude correction of time offset)
 * @returns {object} Corrected times
 */
export function applyElevationCorrection(times, elevation, latitude = 0) {
  if (!elevation || elevation <= 0) return times

  // Geometric horizon dip: arccos(R / (R + h)) in degrees
  // 🟡 Limited precedent — see wiki/corrections/elevation.md
  const EARTH_RADIUS_M = 6371000
  const horizonDipDeg = Math.acos(EARTH_RADIUS_M / (EARTH_RADIUS_M + elevation)) * (180 / Math.PI)

  // Latitude correction: at latitude φ, sun crosses horizon at rate 4/cos(φ) min per degree
  const correctionMin = horizonDipDeg * 4 / Math.cos(latitude * Math.PI / 180)
  const corrMs = correctionMin * 60 * 1000

  const adjusted = { ...times }
  // Shuruq (sunrise) is earlier at elevation — depressed horizon
  adjusted.shuruq  = new Date(times.shuruq.getTime()  - corrMs)
  adjusted.sunrise = adjusted.shuruq    // keep alias in sync with shuruq
  // Maghrib (sunset) is later at elevation. Astronomical `sunset` shifts by
  // the same geometric amount as `maghrib` for methods where they coincide;
  // for methods with a maghrib offset we still want the astronomical sunset
  // itself elevation-corrected, so update both.
  adjusted.maghrib = new Date(times.maghrib.getTime() + corrMs)
  adjusted.sunset  = new Date(times.sunset.getTime()  + corrMs)
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
