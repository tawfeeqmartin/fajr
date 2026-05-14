# Bahrain — prayer-time conventions

## Institutional reference bodies

Bahrain is unusual in maintaining **two parallel awqaf administrations** along the sectarian Sunni/Shia divide — a structure documented in Bahraini law that recognises and serves both communities institutionally:

- **Sunni Endowments Directorate (الإدارة العامة للأوقاف السنية)** — administers Sunni mosques and publishes the Sunni Awqaf Imsakiyya. URL: https://www.sunniaffairs.gov.bh
- **Jaafari Endowments Directorate (الإدارة العامة للأوقاف الجعفرية)** — administers Twelver Shia mosques and ḥusayniyat, publishes the Jaafari Imsakiyya. URL: https://www.jawf.gov.bh
- **Ministry of Justice, Islamic Affairs and Awqaf (وزارة العدل والشؤون الإسلامية والأوقاف)** — umbrella institutional reference. URL: https://www.moj.gov.bh

**Population served:** ~1.1M Muslims (~73% of Bahrain's ~1.5M total). **Twelver Shia majority among nationals** (~60-70% of Bahraini citizens), Sunni minority among nationals (~30%); the overall Muslim breakdown is closer to 50/50 when expat Sunni population is included. Citation: Pew 2015, Bahraini government census reporting, Toby Matthiesen.

**Madhab:** Multi-tradition. Twelver Shia Jaafari (citizen-majority) + Sunni Maliki/Hanbali (citizen-minority + expat-majority). Institutional publications use Standard (1× shadow) Asr; this is an Asr-convention statement, not a claim that all communities share one legal madhhab. Twelver Shia jurisprudence on Fajr/Maghrib waiting boundaries differs from Sunni convention.

## Calculation method (as implemented in fajr)

- **adhan.js method:** dispatches to `Kuwait` (`CalculationMethod.Kuwait()`) via fall-through in `selectMethod()` — corresponds to **Aladhan API method 9**
- **Fajr angle:** 18° (Kuwait Awqaf institutional default; used as a hypothesised proxy pending a Bahrain Sunni Awqaf fixture)
- **Isha angle:** 17.5° (Kuwait Awqaf default; Bahrain's Sunni Awqaf does not publish a distinct angle pair)
- **Asr school:** Standard (1× shadow)
- **Method offsets:** none
- **Classification:** 🟡 Limited precedent — current fajr dispatch uses the Kuwait institutional preset as a regional proxy; Bahrain-specific institutional fixtures are still required before treating this as approaching established.

## Why this method

Bahrain has no verified national prayer-time fixture in fajr yet. The current dispatch follows the Kuwait Ministry of Awqaf preset (18°/17.5°/Standard) as a **regional fallback pending country-specific institutional validation**. UAE and Qatar override with their own institutional presets; Bahrain, Oman, and Yemen fall through to the Kuwait preset.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (the current country publication/default metadata uses Standard 1× shadow Asr)
- `applied.asrSchool` returns `'standard'`

Convention and applied formula align for the current country-default dispatch. Users following a different local publication should use an explicit override once their source is identified.

## Known points of ikhtilaf within the country

- **Sectarian Jaafari/Sunni split is the defining ikhtilaf** — Bahrain is one of the few states where the institutional Awqaf is explicitly structured along this divide, with separate Sunni and Jaafari Imsakiyya publications. Numerically, both communities use Standard Asr; the Twelver Shia Jaafari convention treats Maghrib boundary slightly differently (later, by ~5-10 min, to ensure full sunset) and Fajr boundary slightly differently (the Sistani-aligned Jaafari Imsakiyya). fajr does not currently surface this as per-city `altMethods` for Bahraini coordinates — open follow-up given the institutional ground-truth split.
- **The Kuwait dispatch is a Sunni-aligned proxy.** Pending a Bahrain Jaafari Awqaf fixture, Tehran/Sistani-style methods are only a user-selected proxy for some Jaafari practice, not an established Bahraini institutional mapping.

## City-level overrides

None at city level. Manama, Riffa, Muharraq, Hamad Town, Isa Town, and all major Bahraini coordinates use the Kuwait fall-through.

## Open questions / outstanding work

- **Bahrain Sunni Awqaf live fixture** — fajr currently has no Bahrain-specific institutional fixture; an empirical fetcher targeting https://www.sunniaffairs.gov.bh Imsakiyya or a single-day Sunni Awqaf scrape would compare the Kuwait dispatch against Bahrain's published Sunni Awqaf publication.
- **Bahrain Jaafari Awqaf live fixture** — separate fetcher for https://www.jawf.gov.bh would surface the Twelver Shia Jaafari convention as a real second-source ground truth, enabling per-community ground-truth for Bahrain — the only country in fajr's coverage where both Sunni and Shia institutional awqaf publish at official-state level.
- **Per-community `altMethods`** — once both fixtures are available, Bahraini coordinates could surface both Sunni and Jaafari as `altMethods` chips in `notes[]`, matching the institutional ground-truth structure.

## Sources

- Bahrain Sunni Endowments Directorate: https://www.sunniaffairs.gov.bh
- Bahrain Jaafari Endowments Directorate: https://www.jawf.gov.bh
- Bahrain Ministry of Justice, Islamic Affairs and Awqaf: https://www.moj.gov.bh
- Aladhan method 9 (Kuwait — applied to Bahrain via dispatch fall-through): https://aladhan.com/calculation-methods
- Engine `selectMethod()` dispatch: see [`src/engine.js`](../../../src/engine.js#L1266)
- Demographic citations: Pew 2015, Matthiesen "The Other Saudis: Shiism, Dissent and Sectarianism" (2014), Bahraini government 2010 census
