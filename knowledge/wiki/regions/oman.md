# Oman — prayer-time conventions

## Institutional reference body

- **Name:** Ministry of Awqaf and Religious Affairs (وزارة الأوقاف والشؤون الدينية)
- **URL:** https://www.mara.gov.om
- **Population served:** ~3.5M Muslims (~85% of Oman's ~4M total — the rest are predominantly Hindu/Christian South Asian expatriate workforce)
- **Madhab:** Oman is the world's **only Ibadi-majority country**, a distinction that gives it a unique institutional position in Islamic jurisprudence. Demographics among Muslim Omanis (citizens + Muslim expatriates):
  - **Ibadi (~45-50% of citizens)** — official state madhhab; distinct school of Islam from both Sunni and Shia, tracing intellectual lineage to the early Kharijite movement but with substantially different theology and practice; Imam-led; represented by the state publication's Standard 1× Asr convention
  - **Sunni Shafi'i + Hanafi (~45% of citizens, primarily Dhofari Shafi'i + expatriate Hanafi)** — the state publication uses Standard Asr; Hanafi users who follow 2× shadow Asr should override explicitly
  - **Twelver Shia minority (~5%)** — primarily Iranian-origin Lawatiya merchants in Muttrah/Muscat
- The current country-default metadata is **Standard 1× shadow Asr** as an institutional publication convention, not a full legal-madhhab taxonomy.

## Calculation method (as implemented in fajr)

- **adhan.js method:** dispatches to `Kuwait` (`CalculationMethod.Kuwait()`) via fall-through in `selectMethod()` — corresponds to **Aladhan API method 9**
- **Fajr angle:** 18° (Kuwait Awqaf institutional default)
- **Isha angle:** 17.5° (Kuwait Awqaf institutional default)
- **Asr school:** Standard (1× shadow) — matches the current institutional publication/default. This does not imply all Hanafi individuals treat Standard as their madhhab rule; Hanafi users may override to 2× Asr.
- **Method offsets:** none
- **Classification:** 🟡 Limited precedent — current fajr dispatch uses the Kuwait institutional preset as a regional proxy; Oman-specific institutional fixtures are still required before treating this as approaching established.

## Why this method

Oman has no verified national prayer-time fixture in fajr yet. The current dispatch follows the Kuwait Ministry of Awqaf preset (18°/17.5°/Standard) as a regional fallback pending country-specific institutional validation. UAE and Qatar override; Bahrain, Oman, and Yemen fall through to the Kuwait preset.

No separate Ibadi calculation method is currently implemented. Available institutional practice appears to converge with the lower-Gulf Standard-Asr publication model, but a MARA fixture is still needed before fajr should call this country-specific validation.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (the current country publication/default metadata uses Standard 1× shadow Asr)
- `applied.asrSchool` returns `'standard'`

Convention and applied formula align for the current country-default dispatch. Hanafi users who follow 2× shadow Asr override explicitly via `override.asrConvention: 'hanafi'`.

## Known points of ikhtilaf within the country

- **Ibadi vs. Sunni Shafi'i practice differences** are devotional/jurisprudential (qunoot, gesture conventions, niyyah recitation) rather than an implemented separate fajr method. A direct MARA fixture should remain the arbiter before claiming full country-specific agreement.
- **Lawatiya Twelver Shia minority** in Muttrah/Muscat (~5% of citizens; Iranian-origin merchant community with distinct ḥusayniyat) follows Sistani-aligned Imsakiyya which differs from the Kuwait dispatch on Fajr/Maghrib waiting periods. Not currently surfaced via per-city `altMethods` for Omani coordinates.
- **Dhofari Shafi'i practice** (southern Oman, Salalah region) may differ subtly from northern Ibadi-administered mosque-published times due to historical Hadhramawti links. This needs fixture evidence before any tolerance-band claim.

## City-level overrides

None at city level. Muscat, Salalah, Sohar, Nizwa, Sur, and all major Omani coordinates use the Kuwait fall-through.

## Open questions / outstanding work

- **Live MARA Awqaf fixture** — fajr currently has no Oman-specific institutional fixture; a fetcher targeting https://www.mara.gov.om Imsakiyya would test whether the Kuwait dispatch matches Oman's published times. Promotion per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria) requires this empirical anchor plus a position-registry update.
- **Ibadi-specific scholarly grounding** — the wiki currently does not have a dedicated `knowledge/wiki/methods/ibadi.md` or `knowledge/wiki/fiqh/ibadi-prayer-times.md`. Because Ibadi converges with Sunni on time-boundary calculations, no separate method is needed, but a wiki page documenting why-it-converges would close the documentation gap for the world's only Ibadi-majority country.
- **Lawatiya Shia altMethods** — Sistani-aligned dispatch for Muscat/Muttrah coordinates could be exposed via `notes[]`. Open follow-up.

## Sources

- Oman Ministry of Awqaf and Religious Affairs: https://www.mara.gov.om
- Aladhan method 9 (Kuwait — applied to Oman via dispatch fall-through): https://aladhan.com/calculation-methods
- Engine `selectMethod()` dispatch: see [`src/engine.js`](../../../src/engine.js#L1267)
- Ibadi tradition background: Hoffman, Valerie J. (2012) "The Essentials of Ibāḍī Islam" (Syracuse UP); Wilkinson, John C. (2010) "Ibâdism: Origins and Early Development in Oman" (Oxford UP)
