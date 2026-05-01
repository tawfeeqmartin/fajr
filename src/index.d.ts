// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// TypeScript declarations for fajr's public API surface (v1.0).
//
// Stability: the surfaces below are part of fajr's v1.0 contract — breaking
// changes require a major version bump. See README "API stability".

// ─────────────────────────────────────────────────────────────────────────────
// prayerTimes
// ─────────────────────────────────────────────────────────────────────────────

export interface PrayerTimesParams {
  latitude: number
  longitude: number
  date: Date
  /** Meters above sea level. Default 0. Currently informational; elevation
   *  correction is opt-in via `applyElevationCorrection`. */
  elevation?: number
  /** Override the auto-detected method. Currently the auto-detection is
   *  authoritative; this parameter is reserved for future explicit overrides. */
  method?: string
}

export interface PrayerTimesResult {
  fajr:    Date
  shuruq:  Date
  dhuhr:   Date
  asr:     Date
  maghrib: Date
  isha:    Date
  /** Human-readable label of the auto-selected calculation method,
   *  e.g. `"Morocco (19°/17° community calibration)"` or `"Diyanet (Türkiye)"`. */
  method:  string
  corrections: {
    elevation:  boolean
    refraction: string
    /** Present if elevation correction was applied via `applyElevationCorrection`. */
    elevationCorrectionMin?: number
  }
}

export function prayerTimes(params: PrayerTimesParams): PrayerTimesResult

/** Apply an opt-in geometric horizon-dip correction for elevated locations.
 *
 *  🟡→🟢 Approaching established — UAE Burj Khalifa fatwa, Malaysia JAKIM
 *  topographic correction. Currently disabled by default; pass the result of
 *  `prayerTimes()` through this to apply the correction. */
export function applyElevationCorrection(
  times: PrayerTimesResult,
  elevation: number,
  latitude?: number,
): PrayerTimesResult

// ─────────────────────────────────────────────────────────────────────────────
// qibla
// ─────────────────────────────────────────────────────────────────────────────

export interface QiblaParams {
  latitude:  number
  longitude: number
}

export interface QiblaResult {
  /** Great-circle bearing toward the Kaaba, in degrees from true north [0, 360). */
  bearing:             number
  /** Magnetic declination at the observer's location. Currently 0 (placeholder
   *  pending WMM2024 integration). */
  magneticDeclination: number
  /** Bearing adjusted for magnetic declination, in degrees [0, 360).
   *  Equal to `bearing` while `magneticDeclination` is unintegrated. */
  trueBearing:         number
}

export function qibla(params: QiblaParams): QiblaResult

// ─────────────────────────────────────────────────────────────────────────────
// hijri
// ─────────────────────────────────────────────────────────────────────────────

export type HijriMonthName =
  | 'Muharram' | 'Safar' | "Rabi' al-Awwal" | "Rabi' al-Thani"
  | 'Jumada al-Awwal' | 'Jumada al-Thani' | 'Rajab' | "Sha'ban"
  | 'Ramadan' | 'Shawwal' | "Dhu al-Qi'dah" | 'Dhu al-Hijjah'

export interface HijriResult {
  year:      number
  /** 1–12 */
  month:     number
  /** 1–30 */
  day:       number
  monthName: HijriMonthName
}

/** Convert a Gregorian Date to the Hijri calendar (tabular Kuwaiti algorithm).
 *  🟢 Established — standard tabular Hijri used by Islamic institutions worldwide. */
export function hijri(date: Date): HijriResult

// ─────────────────────────────────────────────────────────────────────────────
// hilalVisibility — three-criterion lunar crescent visibility prediction
// ─────────────────────────────────────────────────────────────────────────────

export interface HilalVisibilityParams {
  /** Hijri year of the month whose start is being assessed. */
  year:      number
  /** Hijri month (1–12) whose start is being assessed. The actual visibility
   *  evaluation happens at sunset on day 29 of (month − 1). */
  month:     number
  latitude:  number
  longitude: number
}

export type OdehCode    = 'A' | 'B' | 'C' | 'D' | '?'
export type YallopCode  = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | '?'
export type ShaukatCode = 'A' | 'B' | 'D' | '?'

export interface YallopBlock {
  criterion: 'Yallop (1997)'
  visible:   boolean
  code:      YallopCode
  label:     string
  /** Yallop's q parameter; null in degenerate cases. */
  q:         number | null
}

export interface ShaukatBlock {
  criterion:           'Shaukat (2002)'
  visible:             boolean
  code:                ShaukatCode
  label:               string
  /** Geocentric Sun-Moon elongation at sunset (deg); null in degenerate cases. */
  elongationDeg:       number | null
  /** Topocentric moon altitude at sunset (deg); null in degenerate cases. */
  moonAltAtSunsetDeg:  number | null
  moonAgeHours:        number | null
  lagMinutes:          number | null
}

export interface HilalVisibilityResult {
  /** Odeh's binary verdict (top-level for backward-compatible primary access). */
  visible:   boolean
  /** Odeh classification class. */
  code:      OdehCode
  /** Human-readable label for the Odeh verdict. */
  label:     string
  criterion: 'Odeh (2004)'
  /** Odeh's V parameter; null in degenerate cases. */
  V:         number | null

  /** Yallop's classification side-by-side. */
  yallop:    YallopBlock
  /** Shaukat's classification side-by-side. */
  shaukat:   ShaukatBlock

  /** True iff all three criteria agree on the binary visible/not-visible
   *  verdict. False = borderline ikhtilaf — surface this in any UI; the
   *  sighting is contested and witness testimony / scholarly judgment matter. */
  criteriaAgree: boolean

  /** Geocentric arc of vision between Sun and Moon centres at best time (deg). */
  arcvDeg:        number | null
  /** Crescent width (arcminutes). */
  widthArcmin:    number | null
  /** Sunset → moonset lag (minutes). */
  lagTimeMinutes: number | null
  /** Moon age since conjunction at best time (hours). */
  moonAgeHours:   number | null

  bestTimeUTC:    string | null
  sunsetUTC:      string | null
  moonsetUTC:     string | null
  conjunctionUTC: string | null

  /** The actual Hijri date at which sighting was evaluated (day 29 of prior month). */
  evaluatedHijriDate: { year: number; month: number; day: number }
  /** The Hijri month whose start is being assessed (= the input). */
  forHijriMonth:      { year: number; month: number }
  latitude:           number
  longitude:          number

  /** Wasail/ibadat reminder string. */
  note: string
}

/** Predict crescent visibility at a location for a given Hijri month, using
 *  three criteria computed in parallel.
 *
 *  🟡 Limited precedent — Odeh / Yallop / Shaukat are widely used but not
 *  universally accepted; pure naked-eye sighting traditions are equally
 *  legitimate. fajr is wasail (means); the decision to begin a Hijri month
 *  is ibadat (worship) and rests with Islamic authorities. */
export function hilalVisibility(params: HilalVisibilityParams): HilalVisibilityResult

// ─────────────────────────────────────────────────────────────────────────────
// nightThirds — divisions of the night (Tahajjud / Qiyam al-Layl)
// ─────────────────────────────────────────────────────────────────────────────

export interface NightThirdsResult {
  /** Start of the second third (= first-third boundary). */
  firstThird:  Date
  /** Start of the last third (= second-third boundary). */
  secondThird: Date
  /** Alias for `secondThird`. */
  lastThird:   Date
  /** Midpoint of the night. */
  midnight:    Date
}

/** Calculate the three divisions of the night (Maghrib → next day's Fajr).
 *
 *  Two call shapes:
 *  - `nightThirds({ date, latitude, longitude })` — computes Maghrib (today)
 *    and Fajr (tomorrow) internally via `prayerTimes`.
 *  - `nightThirds({ maghrib, fajr })` — for callers that already have the
 *    boundary times computed.
 *
 *  🟢 Established — division of night into thirds is documented in hadith and
 *  classical fiqh for the timing of Tahajjud prayer. */
export function nightThirds(params:
  | { date: Date; latitude: number; longitude: number }
  | { maghrib: Date; fajr: Date }
): NightThirdsResult

// ─────────────────────────────────────────────────────────────────────────────
// travelerMode — qasr / jam' (shortened / combined) prayer metadata
// ─────────────────────────────────────────────────────────────────────────────

export type Madhab = 'shafii' | 'maliki' | 'hanbali' | 'hanafi'

export interface TravelerModeResult {
  fajr:    Date
  shuruq:  Date
  dhuhr:   Date
  asr:     Date
  maghrib: Date
  isha:    Date
  /** Permission to shorten (qasr) four-rakah prayers. */
  qasr:    boolean
  /** Permission to combine (jam') prayers, by pairing.
   *  null for Hanafi (no jam' except at Arafat / Muzdalifah). */
  jam: null | {
    dhuhrAsr:    { atDhuhr:   { dhuhr: Date; asr: Date }; atAsr:    { dhuhr: Date; asr: Date } }
    maghribIsha: { atMaghrib: { maghrib: Date; isha: Date }; atIsha: { maghrib: Date; isha: Date } }
  }
  madhab: Madhab
  /** Disclaimer reminding the user that traveler-status determination is
   *  a fiqh question this library does not answer. */
  note: string
}

/** Return permissibility metadata for shortened (qasr) and combined (jam')
 *  prayers under traveler (musafir) status.
 *
 *  fajr does NOT determine whether the user qualifies as a traveler — that
 *  is a fiqh determination dependent on distance, intention, and madhab-
 *  specific rules. This function reports what concessions are AVAILABLE per
 *  madhab; the user (or their scholarly reference) decides whether to apply.
 *
 *  🟢 Established — Quran 4:101 + numerous hadith. */
export function travelerMode(params: {
  times:  PrayerTimesResult | { fajr: Date; shuruq: Date; dhuhr: Date; asr: Date; maghrib: Date; isha: Date }
  madhab?: Madhab
}): TravelerModeResult

// ─────────────────────────────────────────────────────────────────────────────
// Default export — convenient namespace for `import fajr from '@tawfeeqmartin/fajr'`
// ─────────────────────────────────────────────────────────────────────────────

declare const fajr: {
  prayerTimes:     typeof prayerTimes
  qibla:           typeof qibla
  hijri:           typeof hijri
  hilalVisibility: typeof hilalVisibility
  nightThirds:     typeof nightThirds
  travelerMode:    typeof travelerMode
}

export default fajr
