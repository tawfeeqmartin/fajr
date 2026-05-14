# Oman — prayer-time conventions

## Institutional reference body

- **Name:** Ministry of Awqaf and Religious Affairs (وزارة الأوقاف والشؤون الدينية)
- **URL:** https://www.mara.gov.om
- **Population served:** ~3.5M Muslims (~85% of Oman's ~4M total — the rest are predominantly Hindu/Christian South Asian expatriate workforce)
- **Madhab:** Oman is the world's **only Ibadi-majority country**, a distinction that gives it a unique institutional position in Islamic jurisprudence. Demographics among Muslim Omanis (citizens + Muslim expatriates):
  - **Ibadi (~45-50% of citizens)** — official state madhhab; distinct school of Islam from both Sunni and Shia, tracing intellectual lineage to the early Kharijite movement but with substantially different theology and practice; Imam-led; uses 1× shadow Asr (Standard) institutionally
  - **Sunni Shafi'i + Hanafi (~45% of citizens, primarily Dhofari Shafi'i + expatriate Hanafi)** — both use Standard Asr
  - **Twelver Shia minority (~5%)** — primarily Iranian-origin Lawatiya merchants in Muttrah/Muscat
- All three Omani traditions converge on **Standard 1× shadow Asr** as the institutional convention.

## Calculation method (as implemented in fajr)

- **adhan.js method:** dispatches to `Kuwait` (`CalculationMethod.Kuwait()`) via fall-through in `selectMethod()` — corresponds to **Aladhan API method 8**
- **Fajr angle:** 18° (Kuwait Awqaf institutional default)
- **Isha angle:** 17.5° (Kuwait Awqaf institutional default)
- **Asr school:** Standard (1× shadow) — matches Ibadi + Sunni Shafi'i/Hanbali + Twelver Shia conventions in Oman uniformly. Only Hanafi calls for 2× shadow and Oman's Hanafi expatriate citizens follow the institutional Standard publication.
- **Method offsets:** none
- **Classification:** 🟡→🟢 (Approaching established — preset is regional-cluster default; Oman-specific institutional verification against MARA Awqaf publication is open follow-up)

## Why this method

Oman has no canonical national prayer-time methodology distinct from the lower-Gulf cluster. fajr's dispatch follows the Kuwait Ministry of Awqaf preset (18°/17.5°/Standard) which is the empirical Gulf default for lower-Gulf countries without their own national preset. UAE and Qatar override; Bahrain, Oman, and Yemen fall through to the Kuwait preset.

The **Ibadi institutional position on prayer-time astronomy** is consistent with Sunni convention — Ibadi jurisprudence accepts the 18°/17.5° twilight-angle pair and Standard Asr without dispute; the practice-level differences between Ibadi and Sunni prayer observance (slightly different qunoot recitation; folded vs. opened hands during qiyam) do not change the *time-boundary* definitions that fajr's engine calculates.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (Ibadi + Sunni Shafi'i/Hanbali + Twelver Shia all use Standard 1× shadow Asr in Oman)
- `applied.asrSchool` returns `'standard'`

Convention and applied formula align — no override needed for typical Omani users.

## Known points of ikhtilaf within the country

- **Ibadi vs. Sunni Shafi'i practice differences** are devotional/jurisprudential (qunoot, gesture conventions, niyyah recitation) but **not time-boundary differences**. fajr's prayer times serve both Ibadi and Sunni-Shafi'i Omanis correctly — the per-prayer time calculation is identical for both traditions.
- **Lawatiya Twelver Shia minority** in Muttrah/Muscat (~5% of citizens; Iranian-origin merchant community with distinct ḥusayniyat) follows Sistani-aligned Imsakiyya which differs from the Kuwait dispatch on Fajr/Maghrib waiting periods. Not currently surfaced via per-city `altMethods` for Omani coordinates.
- **Dhofari Shafi'i practice** (southern Oman, Salalah region) may differ subtly from northern Ibadi-administered mosque-published times due to historical Hadhramawti links, but this falls within fajr's tolerance bands for the Kuwait dispatch.

## City-level overrides

None at city level. Muscat, Salalah, Sohar, Nizwa, Sur, and all major Omani coordinates use the Kuwait fall-through.

## Open questions / outstanding work

- **Live MARA Awqaf fixture** — fajr currently has no Oman-specific institutional fixture; a fetcher targeting https://www.mara.gov.om Imsakiyya would confirm the Kuwait dispatch matches Oman's published times. Grade B → A per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria) requires this empirical anchor.
- **Ibadi-specific scholarly grounding** — the wiki currently does not have a dedicated `knowledge/wiki/methods/ibadi.md` or `knowledge/wiki/fiqh/ibadi-prayer-times.md`. Because Ibadi converges with Sunni on time-boundary calculations, no separate method is needed, but a wiki page documenting why-it-converges would close the documentation gap for the world's only Ibadi-majority country.
- **Lawatiya Shia altMethods** — Sistani-aligned dispatch for Muscat/Muttrah coordinates could be exposed via `notes[]`. Open follow-up.

## Sources

- Oman Ministry of Awqaf and Religious Affairs: https://www.mara.gov.om
- Aladhan method 8 (Kuwait — applied to Oman via dispatch fall-through): https://aladhan.com/calculation-methods
- Engine `selectMethod()` dispatch: see [`src/engine.js`](../../../src/engine.js#L1267)
- Ibadi tradition background: Hoffman, Valerie J. (2012) "The Essentials of Ibāḍī Islam" (Syracuse UP); Wilkinson, John C. (2010) "Ibâdism: Origins and Early Development in Oman" (Oxford UP)
