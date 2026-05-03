// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// TypeScript declarations for fajr's public API surface (v1.0).
//
// Stability: the surfaces below are part of fajr's v1.0 contract — breaking
// changes require a major version bump. See README "API stability".

// ─────────────────────────────────────────────────────────────────────────────
// detectLocation — city-aware location resolver (v1.7.0)
// ─────────────────────────────────────────────────────────────────────────────

/** A documented alternative method for cities with intra-locality ikhtilaf
 *  (legitimate scholarly disagreement). Only present on cities where
 *  multiple institutional positions are documented. Apps that want to surface
 *  the disagreement to users render these as "see also" chips alongside
 *  `recommendedMethod`. */
export interface AltMethod {
  /** Method name resolvable by the engine's dispatcher (e.g. `'Tehran'`,
   *  `'Karachi'`, `'Egyptian'`). */
  method: string
  /** Free-form string explaining the institutional source / convention
   *  (e.g. "Higher Islamic Shia Council of Lebanon (al-Majlis al-Islami
   *  al-Shi'i al-A'la) — published Twelver Shia Imsakiyya..."). */
  source: string
  /** Optional rough share of the local Muslim population that follows this
   *  alternative. Surface only when a credible quantitative estimate exists;
   *  the field is omitted otherwise to avoid implied precision. */
  populationShare?: number
}

/** Provenance of the city's primary recommended method. */
export interface CitySource {
  /** `'mawaqit'` = a Mawaqit-registered mosque publishes for this city.
   *  `'national-authority'` = the country's named institution publishes
   *  (Diyanet, JAKIM, KEMENAG, MUIS, Habous, Awqaf, etc.).
   *  `'aladhan'` = no specific institutional publisher; coverage via the
   *  multi-app consensus method (typically MWL-via-Aladhan-default).
   *  `'inherited'` = no city-level source; the city inherits its country's. */
  type: 'mawaqit' | 'national-authority' | 'aladhan' | 'inherited' | 'fallback'
  /** Mawaqit slug when type === 'mawaqit', e.g. 'al-azhar-mosque-cairo-egypt'. */
  slug?: string
  /** Institution name when type === 'national-authority' or 'mawaqit'.
   *  E.g. 'Diyanet İşleri Başkanlığı', 'JAKIM', 'Dar al-Fatwa al-Lubnaniyya'. */
  institution?: string
  /** When type === 'inherited', the country key the city inherits from. */
  from?: string
}

export interface City {
  /** English/Latin transliteration. Stable across versions; used as display name. */
  name:         string
  /** Local-script form when meaningfully distinct (Arabic, Cyrillic, etc.).
   *  Optional — only included where the local script differs from `name`. */
  nameLocal?:   string
  /** ISO 3166-1 alpha-2. */
  countryISO:   string
  /** State / province / governorate / mintaqah. Free-form; not a stable enum. */
  adminRegion?: string
  /** Geographic centre, decimal degrees. */
  lat:          number
  lon:          number
  /** Bounding box for fast lookup: [latMin, latMax, lonMin, lonMax]. */
  bbox:         [number, number, number, number]
  /** Optional. Inhabitants of the city proper, latest reasonably-sourced figure. */
  population?:  number
  /** Optional. Mean elevation of the city centre in metres above sea level —
   *  surfaced to apps that want to recommend `applyElevationCorrection`. */
  elevation?:   number
  /** Optional. IANA timezone for this city. Falls through to country-level
   *  when absent — relevant for Russia, USA, China, etc. */
  timezone?:    string
  /** Optional city-level institutional method override. Resolvable by the
   *  engine's method dispatcher (e.g. `'Karachi'`, `'Tehran'`, `'Diyanet'`).
   *  When set, `prayerTimes` uses this in preference to the country default
   *  (the city is following an institutional convention that diverges from
   *  the country writ-large). When unset, the country default applies. */
  methodOverride?: string
  /** Optional documented alternative methods — surfaces the intra-city
   *  ikhtilaf rather than hiding it behind the recommended method. Only
   *  present when at least one alternative is documented. */
  altMethods?: AltMethod[]
  /** Provenance for the city's primary recommended method. */
  source?:     CitySource
}

/** How `prayerTimes` chose the calculation method for a given coordinate.
 *
 *  - `'caller-explicit'`: the caller passed `method:` in the params object;
 *    fajr honoured it without consulting the city or country tables.
 *  - `'city-institutional'`: the matched city in the registry has a
 *    `methodOverride` field; fajr used that (e.g. Mosul → Karachi via
 *    Sunni-Awqaf convention, even though Iraq's country default is Egyptian).
 *  - `'country-default'`: no city-level override; fajr used the country's
 *    default method per the bbox dispatch table.
 *  - `'fallback'`: outside any registered city AND outside any country bbox;
 *    fajr used ISNA (the engine's universal fallback). */
export type MethodSource = 'caller-explicit' | 'city-institutional' | 'country-default' | 'fallback'

/** How `prayerTimes` chose the elevation for a given coordinate.
 *
 *  - `'caller-explicit'`: the caller passed `elevation:` in the params object
 *    (any value, including 0). Apps following the Saudi/jama'ah-unity stance
 *    should pass `elevation: 0` to opt out of geometric horizon-dip correction.
 *  - `'city-registry'`: the matched city in the registry has an `elevation`
 *    field; fajr used that and applied `applyElevationCorrection` inline so
 *    the returned times are already-corrected.
 *  - `'default-zero'`: no city matched (or the matched city had no elevation
 *    field), and the caller did not pass elevation. fajr fell through to 0
 *    (sea level) silently — the safest default. */
export type ElevationSource = 'caller-explicit' | 'city-registry' | 'default-zero'

/** The location field on `prayerTimes` / `dayTimes` return values (v1.7.0+).
 *  Always populated. Apps can use this to display "you are in <city>"
 *  without an additional `detectLocation` call. */
export interface PrayerTimesLocation {
  /** Matched city, or null when no city in the bundled registry matched. */
  city:            City | null
  /** Country key from the engine's bbox table (e.g. 'SaudiArabia',
   *  'UnitedKingdom'). null when outside all known country bboxes. */
  country:         string | null
  /** IANA timezone identifier. Resolution order: city.timezone → 'UTC'.
   *  We do not synthesise a country-level timezone fallback because
   *  Russia/USA/Canada/China have multiple zones; UTC is honest when no
   *  city matched. */
  timezone:        string
  /** Effective elevation in metres used by the engine on this call. */
  elevation:       number
  /** How the method was chosen — see MethodSource above. */
  methodSource:    MethodSource
  /** How the elevation was chosen — see ElevationSource above. */
  elevationSource: ElevationSource
}

/** Standalone Location record returned by `detectLocation`. Distinct from
 *  `PrayerTimesLocation` which only carries the fields relevant to
 *  prayer-time computation; `Location` includes `recommendedMethod`,
 *  `altMethods`, and `source` for apps that want full city provenance
 *  (e.g. to render the institutional source name in a UI provenance sheet). */
export interface Location {
  /** Matched city, or null when no city in the bundled registry matched.
   *  NEVER returns a wrong-city default — `null` is the honest signal. */
  city:              City | null
  /** Country key from the engine's bbox table. null when outside all known
   *  country bboxes (open ocean, Antarctica). */
  country:           string | null
  /** IANA timezone identifier; falls through to 'UTC' when no city matched. */
  timezone:          string
  /** Effective elevation in metres. Resolution order:
   *  city.elevation → fallbackElevation parameter (default 0). */
  elevation:         number
  /** Recommended calculation method as a string resolvable by the engine
   *  dispatcher. Resolution order:
   *  city.methodOverride → countryDefault → 'ISNA'. */
  recommendedMethod: string
  /** How the recommended method was chosen — see MethodSource above. */
  methodSource:      MethodSource
  /** Documented alternative methods for this city (intra-city ikhtilaf).
   *  Only present when the matched city has at least one alternative.
   *  Apps doing existence checks should use `altMethods != null` rather
   *  than `altMethods.length > 0`. */
  altMethods?:       AltMethod[]
  /** Provenance of the recommended method. */
  source:            CitySource
}

/** Resolve a coordinate to its city, country, timezone, recommended method,
 *  and institutional source.
 *
 *  Pure / referentially transparent for a given (lat, lon, fallbackElevation):
 *  no astronomical computation, no I/O, no caching. Apps that already
 *  call `prayerTimes` get the same resolution surfaced via the
 *  `location` field on its return value — most apps will never need to
 *  call `detectLocation` directly.
 *
 *  Privacy: fajr never logs, persists, or transmits the coordinates you
 *  pass it. The city resolution happens entirely locally via the bundled
 *  city registry. No telemetry, no analytics, no remote calls.
 *
 *  🟢 Established — pure lookup, no shar'i ruling involved.
 *
 *  @param latitude
 *  @param longitude
 *  @param fallbackElevation Used when the matched city has no elevation
 *                           field AND when no city matches. Default 0.
 */
export function detectLocation(
  latitude: number,
  longitude: number,
  fallbackElevation?: number,
): Location

// ─────────────────────────────────────────────────────────────────────────────
// nearestCity — kNN-fuzzy display-only city lookup (v1.7.3)
// ─────────────────────────────────────────────────────────────────────────────

/** Result of `nearestCity(lat, lon)`. The `city` field is always non-null —
 *  the registry covers every populated continent so no input produces a null
 *  match. For coordinates very far from any city (open ocean, deep
 *  Antarctica), `distanceKm` will be in the thousands; apps may want to
 *  suppress the label above some threshold to avoid showing
 *  "near Christchurch (3,400 km)" on a polar research station. */
export interface NearestCityResult {
  /** Closest city in the bundled registry. Always populated — never null. */
  city: City
  /** Great-circle (haversine) distance in km from (lat, lon) to `city.lat / city.lon`. */
  distanceKm: number
}

/** kNN-fuzzy display-label lookup: return the closest city in the bundled
 *  registry to (lat, lon), with the haversine distance in km.
 *
 *  **DISPLAY-ONLY.** For prayer-time dispatch (method override + elevation),
 *  use `detectLocation` instead — it uses bbox-precise containment and
 *  returns `city: null` honestly when the coordinate is outside any
 *  registered city. `nearestCity` always returns a city; using it to drive
 *  computation would silently apply a possibly-distant city's institutional
 *  method to a user who is not actually in that city.
 *
 *  Typical pairing:
 *  ```
 *  const loc  = detectLocation(lat, lon)
 *  const near = loc.city ? null : nearestCity(lat, lon)
 *  const label = loc.city
 *    ? loc.city.name
 *    : `near ${near.city.name} (${near.distanceKm.toFixed(1)} km)`
 *  ```
 *
 *  Privacy: fajr never logs, persists, or transmits the coordinates you
 *  pass it. The lookup happens entirely locally via the bundled city
 *  registry.
 *
 *  🟢 Established — pure lookup, no shar'i ruling involved.
 *
 *  @param latitude
 *  @param longitude
 */
export function nearestCity(
  latitude: number,
  longitude: number,
): NearestCityResult

// ─────────────────────────────────────────────────────────────────────────────
// prayerTimes
// ─────────────────────────────────────────────────────────────────────────────

export interface PrayerTimesParams {
  latitude: number
  longitude: number
  date: Date
  /** Meters above sea level. When omitted (or set to `undefined`), fajr
   *  auto-resolves elevation from the bundled city registry — apps that
   *  want city-registry elevation should NOT pass this parameter. To opt
   *  out of elevation correction (e.g. Saudi/jama'ah-unity stance), pass
   *  `elevation: 0` explicitly — the engine then treats this as caller-
   *  explicit sea-level and skips the geometric horizon-dip correction.
   *  Apps that already have a GPS-supplied altitude should pass it through;
   *  the engine then applies `applyElevationCorrection` to the returned
   *  times automatically (since v1.5.2). */
  elevation?: number
  /** Override the auto-detected method. Pass a method-name string
   *  resolvable by the engine's `methodFromString` dispatcher (e.g.
   *  `'UmmAlQura'`, `'Diyanet'`, `'Karachi'`, `'Tehran'`, `'Egyptian'`,
   *  `'MoonsightingCommittee'`, `'JAKIM'`, `'MUIS'`, `'ISNA'`, `'MWL'`,
   *  `'UOIF'`, `'CIL'`, `'DUMR'`, `'Morocco'`, `'Tunisia'`, `'Algeria'`,
   *  `'Jordan'`). When omitted, the engine resolves the method from the
   *  bundled city registry's `methodOverride` (if present), then falls
   *  through to the country default, then to ISNA. Caller-explicit method
   *  takes priority over both city-institutional and country-default
   *  resolution; the resulting `location.methodSource` is then
   *  `'caller-explicit'`. */
  method?: string
}

export interface PrayerTimesResult {
  /** Imsak (إمساك) — fasting-yaqeen field. Computed as Fajr − 10 min and
   *  rounded DOWN (earlier) to ensure the displayed minute arrives BEFORE
   *  actual astronomical dawn, so fasters who stop eating at imsak finish
   *  their suhur with safety margin before the fast officially begins. The
   *  10-minute default offset is the universal Imsakiyya convention used
   *  in Mecca, Medina, Cairo printed tables for over a century. To use a
   *  different offset, recompute as `fajr - N minutes` and round DOWN. */
  imsak:   Date
  /** Fajr (فجر) — start of the dawn prayer window. Rounded UP (later) to
   *  ensure prayer-validity yaqeen: the displayed minute is guaranteed to
   *  fall AFTER actual astronomical Fajr, so prayers performed at the
   *  displayed time fall inside the valid window. */
  fajr:    Date
  shuruq:  Date
  /** English-language alias for `shuruq`, kept in sync. Lets adhan.js
   *  consumers migrate to fajr without a field-rename ripple through their
   *  downstream display logic. Points at the same Date instance as `shuruq`. */
  sunrise: Date
  dhuhr:   Date
  asr:     Date
  maghrib: Date
  isha:    Date
  /** Astronomical sunset, distinct from `maghrib` for methods that apply a
   *  post-sunset offset (e.g. some Diyanet variants); for most methods these
   *  are identical to within a second. Mirrors adhan.js's separate `sunset`
   *  field for back-compat with adhan-migrating apps. */
  sunset:  Date
  /** Human-readable label of the auto-selected calculation method,
   *  e.g. `"Morocco (19°/17° community calibration)"` or `"Diyanet (Türkiye)"`. */
  method:  string
  /** Scholarly-grounded caveats specific to this location and method. Each
   *  entry is a complete sentence with a wiki citation. Empty array when no
   *  specific notes apply. Consumers may render none, all, or a curated
   *  subset depending on UX.
   *
   *  Currently emits a high-latitude advisory at |latitude| ≥ 48.6° per
   *  [Odeh, 2009] — see knowledge/wiki/regions/iceland.md. Future versions
   *  may add other location-specific caveats (light pollution, elevation,
   *  DST transition days). */
  notes: string[]
  corrections: {
    elevation:  boolean
    refraction: string
    /** Description of the per-prayer rounding policy applied to the
     *  returned Date fields. Since v1.5.1 fajr applies ihtiyat-aware
     *  directional rounding (Imsak/Shuruq DOWN, Fajr/Dhuhr/Asr/Maghrib/
     *  Isha/Sunset UP) so every displayed minute is on the prayer-validity-
     *  safe (or, for Imsak, fasting-validity-safe) side of the underlying
     *  solar event, by construction. */
    rounding?: string
    /** The number of minutes Imsak is computed before Fajr. Default 10
     *  per the universal Imsakiyya convention. Read-only; recompute
     *  downstream if a different offset is needed. */
    imsak_offset_min?: number
    /** Present if elevation correction was applied via `applyElevationCorrection`. */
    elevationCorrectionMin?: number
  }
  /** City + country + timezone + sourcing metadata for this call (v1.7.0+).
   *  Always populated. Apps can use this to display "you are in <city>"
   *  without an additional `detectLocation` call. `methodSource` and
   *  `elevationSource` report HOW the engine chose its inputs for this
   *  call — useful for "Why is my Fajr at this time?" explanatory UX.
   *
   *  When no city in the bundled registry matches the coordinate, `city`
   *  is null. When outside all known country bboxes (open ocean,
   *  Antarctica), `country` is also null and `methodSource === 'fallback'`. */
  location: PrayerTimesLocation
}

export function prayerTimes(params: PrayerTimesParams): PrayerTimesResult

/** Single-call convenience returning all common day-times in one object:
 *  the 6 prayers, sunrise + sunset, midnight (mid-night), and qiyam (start
 *  of last third of night, recommended time for tahajjud). Computes today's
 *  prayer times AND tomorrow's fajr internally to derive the night-third
 *  boundaries. For callers needing only the 6 prayers, use `prayerTimes()`. */
export interface DayTimesResult extends PrayerTimesResult {
  midnight: Date
  /** Start of the last third of the night — recommended window for
   *  qiyām al-layl / tahajjud per hadith tradition. */
  qiyam:    Date
}

export function dayTimes(params: PrayerTimesParams): DayTimesResult

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

/** Apply an opt-in tayakkun (تيقن — "certainty") buffer to Fajr.
 *
 *  🟡 Limited precedent — Aabed (2015), peer-reviewed naked-eye observational
 *  study, Jordan Journal for Islamic Studies v. 11(2). Twelve sessions in
 *  four Jordanian localities found true dawn was observed 4–5 minutes after
 *  the calculated 18° Fajr time. The paper recommends keeping the calculated
 *  time, but adds: *"It is also accepted to delay A'than by 5 minutes only
 *  to be sure of the right timing (tayakkun)."*
 *
 *  This buffer is for fasting-precaution and observer-certainty; the
 *  unbuffered calculated 18° Fajr is itself astronomically correct. */
export function applyTayakkunBuffer(
  times: PrayerTimesResult,
  mins?: number,
): PrayerTimesResult

/** Compute prayer times using Tarabishy's (2014) latitude-truncation method.
 *
 *  🟡 Limited precedent — Tarabishy 2014 argues 45° is the highest latitude
 *  with "normal" days year-round (using physiological day-length as the
 *  criterion). Above 45°, this function computes prayer times for the
 *  truncated latitude (45° preserving sign) at the actual longitude. Below
 *  45° the result is identical to `prayerTimes()`.
 *
 *  This is the principal published dissent from the Odeh-2009-endorsed
 *  middle-of-night high-latitude rule. Opt-in only — fajr's default high-
 *  latitude behaviour remains middle-of-night via adhan.js. */
export function tarabishyTimes(
  params: PrayerTimesParams,
  thresholdLat?: number,
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
  prayerTimes:              typeof prayerTimes
  dayTimes:                 typeof dayTimes
  tarabishyTimes:           typeof tarabishyTimes
  detectLocation:           typeof detectLocation
  nearestCity:              typeof nearestCity
  applyElevationCorrection: typeof applyElevationCorrection
  applyTayakkunBuffer:      typeof applyTayakkunBuffer
  qibla:                    typeof qibla
  hijri:                    typeof hijri
  hilalVisibility:          typeof hilalVisibility
  nightThirds:              typeof nightThirds
  travelerMode:             typeof travelerMode
}

export default fajr
