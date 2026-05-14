# Yemen — prayer-time conventions

## Institutional reference bodies

Yemen is partitioned politically and ecclesiastically since 2014, with **two distinct institutional administrations** publishing prayer-time conventions:

- **Sana'a — Houthi-administered north (de facto control over ~80% of the population):** the Zaydi-Hadawi tradition's awqaf-administration publishes via the Houthi-run Ministry of Awqaf and Religious Guidance. The published Imsakiyya reflects Zaydi-Hadawi convention.
- **Aden — internationally-recognised government, south (Yemeni Republic):** the Aden-based mufti and the recognised government's Ministry of Endowments and Religious Affairs publish the Shafi'i-aligned Sunni Imsakiyya. URL: https://www.endowments.gov.ye
- **Pre-2014 unified reference:** the Yemeni Ministry of Endowments and Religious Affairs (وزارة الأوقاف والإرشاد) — historically the unified state institution before the political split.

**Population served:** ~32M Muslims (~99% of Yemen's ~32M total). Demographic breakdown:
- **Sunni Shafi'i (~65%)** — concentrated in southern and central Yemen (Aden, Taiz, Hadhramaut, Mukalla, Ibb); Shafi'i institutional tradition with strong Hadhrami scholarly lineage
- **Zaydi (~35%)** — concentrated in northern highlands (Sana'a, Saada, Hajjah, Sa'dah governorates); Zaydi-Hadawi tradition, theologically Shia in lineage but jurisprudentially closer to Sunni Shafi'i than to Twelver Shia
- **Twelver Shia (~1-2%)** — small minority, primarily in Saada governorate's Ismaili pockets

**Madhab:** Both Shafi'i and Zaydi populations use **Standard 1× shadow Asr** institutionally; the wider Zaydi Imsakiyya differs from Shafi'i on Fajr/Maghrib boundary treatment but converges on Asr shadow-factor.

## Calculation method (as implemented in fajr)

- **adhan.js method:** dispatches to `Kuwait` (`CalculationMethod.Kuwait()`) via fall-through in `selectMethod()` — corresponds to **Aladhan API method 8**
- **Fajr angle:** 18° (Kuwait Awqaf institutional default)
- **Isha angle:** 17.5° (Kuwait Awqaf institutional default)
- **Asr school:** Standard (1× shadow) — shadow-correct for both Shafi'i and Zaydi populations
- **Method offsets:** none
- **Classification:** 🟡→🟢 (Approaching established — preset is regional-cluster default; Yemen-specific institutional verification against either Aden Shafi'i or Sana'a Zaydi awqaf is open follow-up, complicated by the political-administrative partition)

## Why this method

Yemen has no canonical post-2014-partition national prayer-time methodology distinct from the lower-Gulf cluster. fajr's dispatch follows the Kuwait Ministry of Awqaf preset (18°/17.5°/Standard) which is the empirical Gulf default for lower-Gulf countries without their own national preset. UAE and Qatar override with their own institutional presets; Bahrain, Oman, and Yemen fall through.

**v1.7.5 bbox tightening note:** Yemen's western longitude was tightened from 42 to 42.5 to prevent the bbox from swallowing Muhayil Asir (18.54, 42.05), which lies inside Saudi Arabia's southern 'Asir region. Hodeidah YE is at 42.95, so Yemen still covers correctly. This is documented in `src/engine.js:62-64`.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (both Shafi'i and Zaydi populations use Standard 1× shadow Asr; both are explicitly enumerated in the `countryDefaults` block in `src/engine.js`)
- `applied.asrSchool` returns `'standard'`

Convention and applied formula align — no override needed for typical Yemeni users.

## Known points of ikhtilaf within the country

- **Sunni Shafi'i vs. Zaydi tradition** — the defining ikhtilaf in Yemen. Both use Standard 1× shadow Asr (so fajr's default is shadow-correct for both), but the wider Zaydi Imsakiyya treats Fajr (slightly later, per Hadawi convention) and Maghrib (slightly later, ensuring sunset completion) differently from the Shafi'i Aden-mufti publication. The Kuwait preset's 18°/17.5° is closer to the Shafi'i Aden convention than the Zaydi Sana'a convention.
- **Houthi-Aden administrative divergence** — post-2014, the two governments publish different Ramadan-calendar conventions and may publish slightly different daily Imsakiyya. This is a **future #40 caller-override candidate**, not a country-default split — fajr ships one country-default and surfaces the alternative via opt-in.
- **Hadhrami scholarly tradition** in eastern Yemen (Tarim, Mukalla) carries significant influence on Shafi'i practice across the broader Indian Ocean (Southeast Asia, East Africa); the Tarim-published Imsakiyya may differ from the Aden Awqaf publication by 1-2 minutes, within fajr's tolerance bands.

## City-level overrides

None at city level. Sana'a, Aden, Taiz, Hodeidah, Mukalla, and all major Yemeni coordinates use the Kuwait fall-through.

## Open questions / outstanding work

- **Aden Shafi'i Awqaf live fixture** — fetcher targeting https://www.endowments.gov.ye Imsakiyya would confirm the Kuwait dispatch matches the Shafi'i Aden publication. Currently the live status of the endowments.gov.ye portal is unverified (Yemen's civil-war administrative disruption may have affected uptime).
- **Sana'a Zaydi Imsakiyya capture** — a Houthi-administered awqaf Imsakiyya fixture would surface the Zaydi-Hadawi convention as a real second-source ground truth. Politically sensitive but academically valuable for documenting the only Zaydi-majority population's prayer-time convention.
- **Per-tradition `altMethods`** — once both fixtures are available, Sana'a coordinates could surface Zaydi as the country-default and Shafi'i as an opt-in alternative; Aden/southern coordinates could invert the priority. This matches the institutional structure on the ground without making fajr take a side on the political partition.

## Sources

- Yemen (recognised government) Ministry of Endowments and Religious Affairs: https://www.endowments.gov.ye (uptime variable due to civil-war disruption)
- Aladhan method 8 (Kuwait — applied to Yemen via dispatch fall-through): https://aladhan.com/calculation-methods
- Engine `selectMethod()` dispatch: see [`src/engine.js`](../../../src/engine.js#L1268)
- Engine bbox tightening note (v1.7.5, Muhayil Asir carve-out): see [`src/engine.js`](../../../src/engine.js#L62-64)
- Engine `countryDefaults` note on Yemen Shafi'i + Zaydi convergence on Standard Asr: see [`src/engine.js`](../../../src/engine.js#L965-971)
- Zaydi tradition background: Haykel, Bernard (2003) "Revival and Reform in Islam: The Legacy of Muhammad al-Shawkani" (Cambridge UP)
- Yemen sectarian breakdown: Pew Research Center "Mapping the Global Muslim Population" (2009); CIA World Factbook Yemen entry
