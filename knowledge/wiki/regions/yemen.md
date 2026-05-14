# Yemen — prayer-time conventions

## Institutional reference bodies

Yemen is partitioned politically and ecclesiastically since 2014, with **two distinct institutional administrations** publishing prayer-time conventions:

- **Sana'a — Houthi-administered north (de facto control over ~80% of the population):** the Zaydi-Hadawi tradition's awqaf-administration publishes via the Houthi-run Ministry of Awqaf and Religious Guidance. The published Imsakiyya reflects Zaydi-Hadawi convention.
- **Aden — internationally-recognised government, south (Yemeni Republic):** the Aden-based mufti and the recognised government's Ministry of Endowments and Religious Affairs publish the Shafi'i-aligned Sunni Imsakiyya. URL: https://www.endowments.gov.ye
- **Pre-2014 unified reference:** the Yemeni Ministry of Endowments and Religious Affairs (وزارة الأوقاف والإرشاد) — historically the unified state institution before the political split.

**Population served:** ~32M Muslims (~99% of Yemen's ~32M total). Demographic breakdown:
- **Sunni Shafi'i (~65%)** — concentrated in southern and central Yemen (Aden, Taiz, Hadhramaut, Mukalla, Ibb); Shafi'i institutional tradition with strong Hadhrami scholarly lineage
- **Zaydi (~35%)** — concentrated in northern highlands (Sana'a, Saada, Hajjah, Sa'dah governorates); Zaydi-Hadawi tradition, theologically Shia in lineage but jurisprudentially closer to Sunni Shafi'i than to Twelver Shia
- **Ismaili minority pockets** — primarily in northern Yemen; distinct from both Zaydi and Twelver Shia traditions

**Madhab:** Both Shafi'i and Zaydi populations use **Standard 1× shadow Asr** institutionally; the wider Zaydi Imsakiyya differs from Shafi'i on Fajr/Maghrib boundary treatment but converges on Asr shadow-factor.

## Calculation method (as implemented in fajr)

- **adhan.js method:** dispatches to `Kuwait` (`CalculationMethod.Kuwait()`) via fall-through in `selectMethod()` — corresponds to **Aladhan API method 9**
- **Fajr angle:** 18° (Kuwait Awqaf institutional default)
- **Isha angle:** 17.5° (Kuwait Awqaf institutional default)
- **Asr school:** Standard (1× shadow) — shadow-correct for both Shafi'i and Zaydi populations
- **Method offsets:** none
- **Classification:** 🟡 Limited precedent — current fajr dispatch uses the Kuwait institutional preset as a regional proxy; Yemen-specific institutional fixtures are still required before treating this as approaching established.

## Why this method

Yemen has no verified post-2014-partition national prayer-time fixture in fajr yet. The current dispatch follows the Kuwait Ministry of Awqaf preset (18°/17.5°/Standard) as a regional fallback pending country-specific institutional validation. UAE and Qatar override with their own institutional presets; Bahrain, Oman, and Yemen fall through.

**v1.7.5 bbox tightening note:** Yemen's western longitude was tightened from 42 to 42.5 to prevent the bbox from swallowing Muhayil Asir (18.54, 42.05), which lies inside Saudi Arabia's southern 'Asir region. Hodeidah YE is at 42.95, so Yemen still covers correctly. This is documented in `src/engine.js:62-64`.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (both Shafi'i and Zaydi populations use Standard 1× shadow Asr; both are explicitly enumerated in the `countryDefaults` block in `src/engine.js`)
- `applied.asrSchool` returns `'standard'`

Convention and applied formula align for the current country-default dispatch. Users following a local Aden, Sana'a, or community-specific publication should use an explicit override once their source is identified.

## Known points of ikhtilaf within the country

- **Sunni Shafi'i vs. Zaydi tradition** — the defining ikhtilaf in Yemen. Both are represented as Standard 1× shadow Asr in the current metadata, but wider Zaydi Imsakiyya practice may treat Fajr and Maghrib differently from the Shafi'i Aden-mufti publication. Which source is closer to the Kuwait fall-through is a fixture question, not yet established.
- **Houthi-Aden administrative divergence** — post-2014, the two governments publish different Ramadan-calendar conventions and may publish slightly different daily Imsakiyya. This is a v1.9.0 caller-override candidate, not a country-default split — fajr ships one country-default and can surface alternatives via opt-in once fixtures exist.
- **Hadhrami scholarly tradition** in eastern Yemen (Tarim, Mukalla) carries significant influence on Shafi'i practice across the broader Indian Ocean (Southeast Asia, East Africa); fixture evidence is needed before asserting how closely Tarim-published times match the Aden Awqaf publication.

## City-level overrides

None at city level. Sana'a, Aden, Taiz, Hodeidah, Mukalla, and all major Yemeni coordinates use the Kuwait fall-through.

## Open questions / outstanding work

- **Aden Shafi'i Awqaf live fixture** — fetcher targeting https://www.endowments.gov.ye Imsakiyya would test whether the Kuwait dispatch matches the Shafi'i Aden publication. Currently the live status of the endowments.gov.ye portal is unverified (Yemen's civil-war administrative disruption may have affected uptime).
- **Sana'a Zaydi Imsakiyya capture** — a Houthi-administered awqaf Imsakiyya fixture would surface the Zaydi-Hadawi convention as a real second-source ground truth. Politically sensitive but academically valuable for documenting the only Zaydi-majority population's prayer-time convention.
- **Per-tradition `altMethods`** — once both fixtures are available, Sana'a coordinates could surface Zaydi as the country-default and Shafi'i as an opt-in alternative; Aden/southern coordinates could invert the priority. This matches the institutional structure on the ground without making fajr take a side on the political partition.

## Sources

- Yemen (recognised government) Ministry of Endowments and Religious Affairs: https://www.endowments.gov.ye (uptime variable due to civil-war disruption)
- Aladhan method 9 (Kuwait — applied to Yemen via dispatch fall-through): https://aladhan.com/calculation-methods
- Engine `selectMethod()` dispatch: see [`src/engine.js`](../../../src/engine.js#L1268)
- Engine bbox tightening note (v1.7.5, Muhayil Asir carve-out): see [`src/engine.js`](../../../src/engine.js#L62-64)
- Engine `countryDefaults` note on Yemen Shafi'i + Zaydi convergence on Standard Asr: see [`src/engine.js`](../../../src/engine.js#L965-971)
- Zaydi tradition background: Haykel, Bernard (2003) "Revival and Reform in Islam: The Legacy of Muhammad al-Shawkani" (Cambridge UP)
- Yemen sectarian breakdown: Pew Research Center "Mapping the Global Muslim Population" (2009); CIA World Factbook Yemen entry
