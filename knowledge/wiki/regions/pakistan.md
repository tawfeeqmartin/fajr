# Pakistan — prayer-time conventions

## Institutional reference body

- **Name:** University of Islamic Sciences, Karachi (the originating institution of the "Karachi method" globally adopted as the South Asian regional convention)
- **Secondary:** Pakistan Council of Islamic Ideology (CII) — issues fatwas; Ministry of Religious Affairs and Interfaith Harmony (MoRA) for institutional dispatch.
- **URL:** No canonical web URL for the University of Islamic Sciences, Karachi (institutional reference only); MoRA: https://mora.gov.pk
- **Population served:** ~239M Muslims (~96% of Pakistan's ~248M total — second-largest Muslim population in the world).
- **Madhab:** Sunni Hanafi institutionally dominant (Deobandi + Bareilvi sub-traditions); Sunni Ahl-e-Hadith minority; Twelver Shia minority (~10-15%, concentrated in Karachi + Lahore + KPK / Kurram Agency); Ismaili Nizari Shia (Khoja) minority concentrated in Karachi.

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Karachi` (`CalculationMethod.Karachi()`) — corresponds to **Aladhan API method 1**
- **Fajr angle:** 18° (Karachi convention)
- **Isha angle:** 18° (Karachi convention; symmetric with Fajr)
- **Asr school:** Standard (Shafi'i — 1× shadow) by adhan.js preset default. Hanafi-observant callers should pass `madhab: 'hanafi'` explicitly.
- **Special offsets:** none
- **Classification:** 🟢 Established (institutional preset; the Karachi method is the South Asian regional reference, also used by India / Bangladesh / Afghanistan / Maldives / Sri Lanka in various forms)

## Why this method

The 18°/18° angle pair is the **University of Islamic Sciences, Karachi convention** — adopted in Pakistan's Muslim Population Council publications and dispatched internationally as the "Karachi method" via adhan.js, Aladhan, and PrayTimes.org.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'hanafi'` (Pakistan is Hanafi-majority demographically)
- `location.asrConventionSource` returns `'country-default'`
- `applied.asrSchool` returns `'standard'` (adhan.js Karachi preset uses 1× shadow Asr in its calculation)

Hanafi-observant callers (the majority of Pakistanis) should override with `madhab: 'hanafi'` to get 2× shadow Asr calculation. fajr's metadata correctly surfaces "this is a Hanafi country" while the applied formula remains Standard until the override.

## Known points of ikhtilaf within the country

- **Asr school: Standard vs Hanafi.** The dominant ikhtilaf in Pakistan. Hanafi 2× shadow Asr is ~30-60 min later than Standard 1× shadow Asr. fajr's adhan.js Karachi preset uses Standard by default; Hanafi users override explicitly. Tracking: fajr#88 documents this metadata-vs-formula split.
- **Twelver Shia minority** (~10-15% of Pakistani Muslims, concentrated in Karachi, Lahore, KPK Kurram). Follow Najaf maraji' (Sistani-aligned) Imsakiyya which differs numerically from Karachi method. Not currently surfaced via per-city `altMethods` in fajr. Same shape as the India per-community split entry in `docs/known-disagreements.md`.
- **Ismaili Nizari (Khoja Ismaili) minority** concentrated in Karachi — distinct devotional practice but generally follow Karachi method for the 5 daily prayers.

## City-level overrides

None at city level. The Karachi country-default dispatch handles every Pakistani coordinate.

## Open questions / outstanding work

- **No canonical University of Islamic Sciences, Karachi web URL** — institutional reference only. The 18°/18° angle pair is universally cited in adhan-equivalent implementations but the originating institutional document is hard to retrieve.
- **Aladhan method=1 calc-vs-calc fixture** in fajr's eval covers 5 Pakistani cities × 365 days (commit `18d8f6e`), validating that fajr's Karachi dispatch matches Aladhan method=1 within ~0.5 min. Not institutional ground truth (Aladhan IS adhan.js wrapper), but cross-implementation reproducibility check.
- **Twelver Shia altMethods** for Karachi/Lahore/KPK cities — should expose Tehran/Sistani-aligned alternative. Open follow-up.

## Sources

- Ministry of Religious Affairs Pakistan (MoRA): https://mora.gov.pk
- Council of Islamic Ideology (CII): https://www.cii.gov.pk
- Aladhan method 1: https://aladhan.com/calculation-methods
- Pakistan Aladhan fixture: `eval/data/test/iran-pakistan-aladhan-yearly.json` (5 Pakistan cities × 365 days, fajr#133 / commit `18d8f6e`)
