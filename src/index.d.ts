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
 *    (any value, including 0). Apps matching uniform city timetable practice
 *    should pass `elevation: 0` to opt out of geometric horizon-dip correction.
 *  - `'country-uniform-timetable'`: the country default follows a uniform
 *    city/region timetable, so fajr suppresses city-registry elevation unless
 *    the caller explicitly passes an elevation.
 *  - `'city-registry'`: the matched city in the registry has an `elevation`
 *    field; fajr used that and applied `applyElevationCorrection` inline so
 *    the returned times are already-corrected.
 *  - `'default-zero'`: no city matched (or the matched city had no elevation
 *    field), and the caller did not pass elevation. fajr fell through to 0
 *    (sea level) silently — the safest default. */
export type ElevationSource =
  | 'caller-explicit'
  | 'country-uniform-timetable'
  | 'city-registry'
  | 'default-zero'

/** Asr calculation school actually applied.
 *  - `'standard'`: 1× shadow Asr, used by Shafi'i/Maliki/Hanbali-standard
 *    calculations and adhan.js presets unless explicitly changed.
 *  - `'hanafi'`: 2× shadow Asr. */
export type AsrSchool = 'standard' | 'hanafi'

/** Primary location metadata for the local Asr convention:
 *  - `'standard'`: 1× shadow Asr. This covers Shafi'i, Maliki, Hanbali-
 *    standard, and many institutional timetables. It does not imply the
 *    location's full legal madhhab is Shafi'i.
 *  - `'hanafi'`: 2× shadow Asr convention metadata. */
export type AsrConvention = AsrSchool

/** Full legal-madhhab labels used by helper APIs that actually model fiqh
 *  schools, such as `travelerMode`. Distinct from the two-value Asr
 *  convention metadata above. */
export type LegalMadhhab = 'hanafi' | 'maliki' | 'shafii' | 'hanbali'

/** Deprecated v1.7.21 field-name alias for the Hanafi-vs-standard Asr
 *  convention. As of v1.8.1 this mirrors `AsrConvention`
 *  (`'standard' | 'hanafi'`) instead of adhan.js's historic
 *  `'shafii' | 'hanafi'` vocabulary, because `'shafii'` was misleading for
 *  Maliki/Hanbali/Jafari-standard regions such as Morocco. */
export type DeprecatedMadhabAlias = AsrConvention

/** Deprecated public type name retained for callers using `travelerMode`.
 *  Prefer `LegalMadhhab` for legal schools and `AsrConvention` / `AsrSchool`
 *  for prayer-time Asr metadata. */
export type Madhab = LegalMadhhab

/** Deprecated legacy provenance alias for `AsrConventionSource`.
 *
 *  - `'caller-explicit'`: caller passed an explicit Asr-convention override
 *    via `prayerTimes({ override: { asrConvention } })`.
 *  - `'country-default'`: country is listed in the Asr-convention table and
 *    fajr reports the likely local Asr convention. This is metadata; it
 *    does not by itself mutate the calculation-facing Asr school.
 *  - `'method-implied'`: the selected method's calculation Asr school is what
 *    is reported. Mixed-madhab countries (Egypt, Saudi, Iraq, Lebanon, Syria,
 *    Western diaspora, etc.) intentionally fall through here.
 */
export type MadhabSource = 'caller-explicit' | 'country-default' | 'method-implied'

/** How `prayerTimes` chose `location.asrConvention`. Same provenance values
 *  as the legacy `madhabSource` alias, but named for the actual two-value
 *  Asr-convention surface. */
export type AsrConventionSource = MadhabSource

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
  /** Likely local Asr convention for this coordinate (v1.7.22+, #88). This
   *  may differ from `applied.asrSchool` when the bundled timetable method
   *  still uses standard 1× Asr. This is not a full legal-madhhab taxonomy. */
  asrConvention:       AsrConvention
  /** How the Asr convention was chosen — see AsrConventionSource above. */
  asrConventionSource: AsrConventionSource
  /** Deprecated legacy alias for `asrConvention`. Do not render this as
   *  "local madhhab"; Morocco, for example, is Maliki while standard 1× Asr
   *  remains the relevant convention label here. */
  madhab:          DeprecatedMadhabAlias
  /** How the method was chosen — see MethodSource above. */
  methodSource:    MethodSource
  /** Deprecated legacy alias for `asrConventionSource`. v1.7.21+ (#81). */
  madhabSource:    MadhabSource
  /** How the elevation was chosen — see ElevationSource above. */
  elevationSource: ElevationSource
}

/** Summary of what was actually applied for this call (v1.7.21+, #81).
 *  Apps surface a single canonical "what we did" badge from this without
 *  re-deriving from method/Asr-convention/elevation fields scattered through the
 *  result. */
export interface AppliedDispatch {
  /** The method actually used (verbose label, same string as `result.method`). */
  method:        string
  /** The Asr calculation school actually applied. */
  asrSchool:     AsrSchool
  /** Deprecated legacy alias for the Asr formula actually used. Prefer
   *  `asrSchool`; this is not a full legal-madhhab claim. */
  madhab:        AsrSchool
  /** Elevation correction in minutes that fajr applied (or would apply at the
   *  given effective elevation). 0 at sea level / when correction declined. */
  elevationMin:  number
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

/** App-facing override surface for settings UIs (v1.8.x+, #40).
 *
 *  All fields are optional. Omitted fields keep fajr's city/country defaults.
 *  This object is the preferred shape for new apps because it keeps user
 *  choices grouped separately from the coordinate/date inputs. Legacy top-level
 *  `method` and `elevation` remain supported for backwards compatibility. */
export interface PrayerTimesOverride {
  /** Override the auto-detected method. Same accepted method-name strings as
   *  legacy top-level `method`. Takes priority over `method` when both are
   *  supplied. */
  method?: string
  /** Override the effective elevation in metres. Pass 0 to opt out of
   *  city-registry elevation correction; pass a GPS/device altitude when the
   *  app trusts it. Takes priority over legacy top-level `elevation`. */
  elevation?: number
  /** Override the actual Asr calculation convention for this call.
   *  - `'standard'`: 1x shadow
   *  - `'hanafi'`: 2x shadow
   *
   *  This changes `applied.asrSchool`, sets
   *  `location.asrConventionSource === 'caller-explicit'`, and suppresses the
   *  country-metadata mismatch advisory because the caller made an explicit
   *  choice. */
  asrConvention?: AsrConvention
  /** Deprecated alias accepted for older settings UIs. Prefer
   *  `asrConvention`; this is not a full legal-madhhab taxonomy. `shafi` and
   *  `shafii` are accepted only as legacy spellings for standard 1x Asr. */
  madhab?: AsrConvention | 'shafi' | 'shafii'
}

export interface PrayerTimesParams {
  latitude: number
  longitude: number
  date: Date
  /** Meters above sea level. When omitted (or set to `undefined`), fajr
   *  auto-resolves elevation from the bundled city registry — apps that
   *  want city-registry elevation should NOT pass this parameter. To opt
   *  out of elevation correction (e.g. uniform city timetable practice), pass
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
  /** Preferred app-facing override object for user settings. New apps should
   *  use this shape instead of adding more top-level parameters. */
  override?: PrayerTimesOverride
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
   *  without an additional `detectLocation` call. `methodSource` /
   *  `asrConventionSource` / `elevationSource` report HOW the engine chose its
   *  inputs for this call — useful for "Why is my Fajr at this time?"
   *  explanatory UX and "verify your Asr convention" verification prompts.
   *
   *  When no city in the bundled registry matches the coordinate, `city`
   *  is null. When outside all known country bboxes (open ocean,
   *  Antarctica), `country` is also null and `methodSource === 'fallback'`. */
  location: PrayerTimesLocation
  /** Summary of what was actually applied for this call (v1.7.21+, #81).
   *  Apps surface a single canonical "what we did" badge from this. */
  applied:    AppliedDispatch
  /** Turn-key user-facing copy framing the auto-dispatched values as
   *  "best guess" and recommending verification (v1.7.21+, #81). Apps
   *  can render verbatim in long-press / "Why this time?" sheets, or
   *  ignore it. Saves every consumer rewriting the same disclaimer
   *  text and keeps framing consistent across the ecosystem. */
  disclaimer: string
  /** Layer 4 fiqh-validity warnings (v1.8.0+, #101). Always populated; empty
   *  array when no warnings apply (the green-state baseline). Catches
   *  conditions like Maghrib before astronomical sunset, Fajr after Shuruq,
   *  Asr outside the Dhuhr-Maghrib window, Dhuhr before solar noon, the 12°
   *  absolute floor on Fajr/Isha, and polar regions where the sun doesn't
   *  set or rise. Apps that render prayer times should at minimum check
   *  `validityWarnings.some(w => w.severity === 'critical')` and surface
   *  prominently if any critical warnings fire — a prayer at a flagged time
   *  may be invalid regardless of madhab. */
  validityWarnings: ValidityWarning[]
}

/** Severity tier for a Layer 4 validity warning (v1.8.0+).
 *
 *  - `'critical'`: definite fiqh violation under any recognised school.
 *    The returned time is astronomically impossible given the prayer's
 *    *shar'i* definition (e.g. Maghrib before apparent sunset). Surface
 *    prominently.
 *  - `'advisory'`: outside typical range for one or more schools but may
 *    be valid under a minority position. (Reserved for v1.8.1+; v1.8.0
 *    emits only critical and info.)
 *  - `'info'`: a high-latitude rule fired or other transparency signal.
 *    The calculation is valid; this is provenance, not a warning. */
export type ValidityWarningSeverity = 'critical' | 'advisory' | 'info'

/** Layer 4 fiqh-validity warning (v1.8.0+, #101).
 *  Each entry on `prayerTimes().validityWarnings[]` describes one violation
 *  or advisory signal. Codes are stable across versions; new codes may be
 *  added but existing codes will not be removed or redefined. */
export interface ValidityWarning {
  severity: ValidityWarningSeverity
  /** Which prayer this warning applies to. `null` for warnings that span
   *  multiple prayers or are structural. */
  prayer: PrayerKey | null
  /** Machine-readable code for programmatic handling and i18n keying.
   *  Examples: `'MAGHRIB_BEFORE_SUNSET'`, `'FAJR_AFTER_SHURUQ'`,
   *  `'POLAR_NO_SUNSET'`, `'FAJR_HIGH_LAT_RULE_APPLIED'`. */
  code: string
  /** Human-readable English explanation, complete sentence. Suitable for
   *  display in a "Why?" provenance sheet or developer log. NOT suitable
   *  for end-user-facing prayer-time display without i18n. */
  message: string
  /** ISO 8601 UTC string of the astronomical reference value being checked
   *  against, or `null` for structural warnings (e.g. polar / high-lat). */
  astronomicalReference: string | null
  /** ISO 8601 UTC string of the time fajr returned for this prayer, or
   *  `null` for structural warnings. */
  applied: string | null
  /** Magnitude of the discrepancy in minutes (applied − reference), signed:
   *  positive = applied is later than reference, negative = earlier.
   *  `null` for structural warnings. */
  diffMinutes: number | null
  /** Optional human-readable suggestion for resolving the warning. */
  fix?: string
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

// ─────────────────────────────────────────────────────────────────────────────
// astronomical — Layer 1 primitives (v1.8.x, fajr#101 agot-claude)
// ─────────────────────────────────────────────────────────────────────────────

/** Return type of `astronomical(lat, lon, date)`. Pure deterministic
 *  astronomical events for the given coordinate + date, with no
 *  institutional offsets, no elevation correction, no per-country buffers.
 *
 *  Layer 1 of agot-claude's 5-layer canonical architecture (fajr#101): the
 *  primitives that fajr's institutional layers build on. Returned alongside
 *  institutional results (via `prayerTimes()`) so consumers can verify
 *  what's calc-vs-institutional. */
export interface AstronomicalPrimitives {
  /** Instant the sun crosses the local meridian (solar noon, EoT-corrected). */
  solarNoon: Date
  /** Upper-limb crossing the geometric horizon with standard 0.833° refraction
   *  (sea-level — no elevation correction applied). */
  apparentSunrise: Date
  /** Evening upper-limb crossing the geometric horizon with standard
   *  refraction (sea-level). */
  apparentSunset: Date
  /** Instant the sun reaches `angleDeg` below the horizon, pre-dawn.
   *  Caller passes the depression angle they want:
   *    - `fajrAt(18)` for MWL
   *    - `fajrAt(19.5)` for Egyptian
   *    - `fajrAt(15)` for ISNA
   *  No institutional default is implied; this is the raw astronomical
   *  event at the requested angle. */
  fajrAt: (angleDeg: number) => Date
  /** Instant the sun reaches `angleDeg` below the horizon, post-twilight.
   *  Same shape as `fajrAt`. */
  ishaAt: (angleDeg: number) => Date
  /** Asr time at the given shadow-length factor. `1` = Shafi'i/Maliki/
   *  Hanbali standard; `2` = Hanafi. */
  asrAt: (shadowFactor: number) => Date
}

/** Compute astronomical primitives for a coordinate + date.
 *
 *  Layer 1 of agot-claude's 5-layer canonical architecture (fajr#101).
 *  Pure deterministic: no method dispatch, no elevation correction, no
 *  per-country buffers. The returned object's accessor functions
 *  (`fajrAt`/`ishaAt`/`asrAt`) re-instantiate adhan.js with the requested
 *  parameter each call.
 *
 *  Use cases:
 *  - Layer 4 validity warnings reference these primitives to detect
 *    "Maghrib before astronomical sunset" type violations
 *  - Apps wanting "calculated method time vs raw astronomical time" in
 *    provenance UI
 *  - Scholarly tooling computing prayer times at arbitrary depression
 *    angles for research
 *  - Cross-validation against other implementations
 *
 *  🟢 Established — pure astronomy, no shar'i interpretation.
 *
 *  @param latitude  Decimal degrees, [-90, 90]
 *  @param longitude Decimal degrees, [-180, 180]
 *  @param date      Any Date in the target day (UTC noon recommended for
 *                   stability across timezones) */
export function astronomical(
  latitude: number,
  longitude: number,
  date: Date,
): AstronomicalPrimitives

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
// featureInfo — structured settings metadata (v1.8.x, fajr#40)
// ─────────────────────────────────────────────────────────────────────────────

export type FeatureKind = 'toggle' | 'radio' | 'numeric'

export interface FeatureValue {
  value: string | number | boolean
  label: string
  description: string
}

export interface FeatureRange {
  min: number
  max: number
  step: number
  unit: string
}

/** Structured metadata for app settings surfaces. `layman` is suitable for
 *  non-specialist users; `technical`, `citation`, and `stance` support
 *  provenance sheets and maintainer review. */
export interface FeatureInfo {
  key: string
  kind: FeatureKind
  title: string
  technical: string
  layman: string
  default: string | number | boolean
  values?: FeatureValue[]
  range?: FeatureRange
  docs: string
  citation: string
  stance: string
}

/** List feature keys known to `featureInfo()`. */
export function features(): string[]

/** Return structured metadata for one feature key, or null when unknown.
 *  The returned object is a clone; mutating it does not affect future calls. */
export function featureInfo(key: string): FeatureInfo | null

// ─────────────────────────────────────────────────────────────────────────────
// qibla
// ─────────────────────────────────────────────────────────────────────────────

export interface QiblaParams {
  latitude:  number
  longitude: number
}

/** 16-point compass abbreviation. v1.7.20+ (#63 Proposal 4). */
export type CardinalAbbr =
  | 'N'   | 'NNE' | 'NE'  | 'ENE'
  | 'E'   | 'ESE' | 'SE'  | 'SSE'
  | 'S'   | 'SSW' | 'SW'  | 'WSW'
  | 'W'   | 'WNW' | 'NW'  | 'NNW'

export interface QiblaResult {
  /** Great-circle bearing toward the Kaaba, in degrees from true north [0, 360). */
  bearing:             number
  /** Magnetic declination at the observer's location. Currently 0 (placeholder
   *  pending WMM2024 integration). */
  magneticDeclination: number
  /** Bearing adjusted for magnetic declination, in degrees [0, 360).
   *  Equal to `bearing` while `magneticDeclination` is unintegrated. */
  trueBearing:         number
  /** 16-point compass abbreviation matching `bearing` (e.g. 'WNW' at 280°).
   *  Added in v1.7.20 (#63 Proposal 4). */
  cardinal:            CardinalAbbr
  /** Human-readable expansion of `cardinal` (e.g. 'West-northwest').
   *  Added in v1.7.20 (#63 Proposal 4). */
  cardinalDescription: string
}

export function qibla(params: QiblaParams): QiblaResult

// ─────────────────────────────────────────────────────────────────────────────
// locale — prayer names in multiple languages (#63 Proposal 1, v1.7.20+)
// ─────────────────────────────────────────────────────────────────────────────

/** Prayer-key strings, matching the keys returned by `prayerTimes()` plus
 *  `imsak` (Ramadan-fasting boundary). */
export type PrayerKey =
  | 'fajr' | 'shuruq' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'imsak'

/** Locale codes currently shipped. Adding a new locale requires a PR adding
 *  the strings — fall through to English when the requested code is unknown. */
export type LocaleCode = 'en' | 'ar' | 'tr' | 'id' | 'ur'

/** Lookup table — keyed by prayer key, then by locale code. */
export const prayerNames: Record<PrayerKey, Record<LocaleCode, string>>

/**
 * Look up a prayer name in the requested locale. Falls back to English when
 * the locale isn't shipped.
 */
export function prayerName(prayer: PrayerKey, lang?: LocaleCode | string): string

// ─────────────────────────────────────────────────────────────────────────────
// hijri
// ─────────────────────────────────────────────────────────────────────────────

export type HijriMonthName =
  | 'Muharram' | 'Safar' | "Rabi' al-Awwal" | "Rabi' al-Thani"
  | 'Jumada al-Awwal' | 'Jumada al-Thani' | 'Rajab' | "Sha'ban"
  | 'Ramadan' | 'Shawwal' | "Dhu al-Qi'dah" | 'Dhu al-Hijjah'

/** Hijri calendar convention. 'umm-al-qura' is the default (Saudi Arabia's
 *  official calendar, used by AlAdhan, IslamicFinder, IACAD, Microsoft).
 *  'tabular' returns the Kuwaiti arithmetic calendar (v1.7.5-and-earlier default).
 *  'observational' is planned for v1.9.x; throws NotImplementedError currently. */
export type HijriConvention = 'umm-al-qura' | 'tabular' | 'observational'

export interface HijriOptions {
  convention?: HijriConvention
}

export interface HijriResult {
  year:      number
  /** 1–12 */
  month:     number
  /** 1–30 */
  day:       number
  monthName: HijriMonthName
  /** Arabic month name with full diacritics (sukūn, fatḥa, kasra, shadda),
   *  matching AlAdhan / IslamicFinder / IACAD / printed mosque calendars
   *  (v1.7.13+). The 12 Arabic strings — مُحَرَّم, صَفَر, رَبِيع الأَوَّل,
   *  رَبِيع الآخِر, جُمَادَى الأُولَى, جُمَادَى الآخِرَة, رَجَب, شَعْبَان,
   *  رَمَضَان, شَوَّال, ذُو الْقَعْدَة, ذُو الْحِجَّة — let downstream apps
   *  drop their locally-vendored arrays and inherit consistent voweling. */
  monthNameAr: string
}

/** Convert a Gregorian Date to the Hijri calendar.
 *  Default convention: 'umm-al-qura' (Saudi Arabia's official Umm al-Qura calendar,
 *  used by AlAdhan, IslamicFinder, IACAD, Microsoft).
 *  Pass { convention: 'tabular' } to use the Kuwaiti arithmetic calendar
 *  (v1.7.5-and-earlier default).
 *  🟡→🟢 Approaching established — Umm al-Qura is Saudi Arabia's official calendar,
 *  used by AlAdhan, IslamicFinder, IACAD, Microsoft. Kuwaiti tabular preserved via
 *  { convention: "tabular" }. */
export function hijri(date: Date, opts?: HijriOptions): HijriResult

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
  madhab: LegalMadhhab
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
  madhab?: LegalMadhhab
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
  astronomical:             typeof astronomical
  qibla:                    typeof qibla
  hijri:                    typeof hijri
  hilalVisibility:          typeof hilalVisibility
  nightThirds:              typeof nightThirds
  travelerMode:             typeof travelerMode
  prayerNames:              typeof prayerNames
  prayerName:               typeof prayerName
  features:                 typeof features
  featureInfo:              typeof featureInfo
}

export default fajr
