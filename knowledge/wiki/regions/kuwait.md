# Kuwait — prayer-time conventions

## Institutional reference body

- **Name:** Ministry of Awqaf and Islamic Affairs (وزارة الأوقاف والشؤون الإسلامية)
- **URL:** https://www.awqaf.gov.kw ; published prayer times via Kuwait Awqaf timetables; data feed channels include the al-Mosaller (المصلي) public app
- **Population served:** ~3M Muslims (~75% of Kuwait's ~4M total — Kuwait's heavy expat population is largely Muslim too, particularly South Asian Sunni, Egyptian/Syrian Sunni, and Iranian/Iraqi Shia)
- **Madhab:** Kuwait is Sunni-majority overall (~70% of citizens; Maliki + Hanafi + Shafi'i + Hanbali represented institutionally without one dominant), with a substantial Twelver Shia minority (~30% of citizens, concentrated in Kuwait City and Ahmadi). Awqaf is structured as Sunni-administered; Shia communities run their own ḥusayniyat and madrasas. Asr convention is Standard (1× shadow) across both populations institutionally.

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Kuwait` (`CalculationMethod.Kuwait()`) — corresponds to **Aladhan API method 8**
- **Fajr angle:** 18° (Kuwait Awqaf institutional convention)
- **Isha angle:** 17.5° (Kuwait Awqaf institutional convention)
- **Asr school:** Standard (1× shadow) — matches both Sunni (Maliki/Shafi'i/Hanbali) and Twelver Shia conventions; only Hanafi calls for 2× shadow and Kuwait's Hanafi citizenry follows the institutional Standard publication.
- **Method offsets:** none institutional; the adhan.js Kuwait preset matches Kuwait Awqaf's published times within fajr's tolerance bands.
- **Classification:** 🟢 Established (institutional preset; Kuwait Awqaf is the named originating institution; the preset is widely deployed across the lower Gulf as the regional default)

## Why this method

The 18°/17.5° angle pair is the **Kuwait Ministry of Awqaf institutional convention**, used in Kuwait's published Imsakiyya and the al-Mosaller official app data. The Aladhan API's method 8 is named "Kuwait" because Awqaf is the named originating institution.

The Kuwait preset is also the **regional default for Bahrain, Oman, and Yemen** in fajr (via fall-through in `selectMethod()`), reflecting the empirical observation that the lower Gulf countries without their own national preset follow Kuwait's published angle pair closely enough to share the dispatch. UAE and Qatar have their own institutional presets (Umm al-Qura and Qatar Calendar House respectively) and override the fall-through.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (Kuwait's institutional Sunni + Shia conventions both use Standard Asr)
- `applied.asrSchool` returns `'standard'`

Convention and applied formula align — no override needed for typical Kuwaiti users. Hanafi users who want 2× shadow Asr override explicitly via `madhab: 'hanafi'`.

## Known points of ikhtilaf within the country

- **Twelver Shia ~30% of citizens** primarily follow Sistani-aligned Imsakiyya in their religious-publishing practice; numerically this matches Kuwait Awqaf's institutional convention closely on Standard Asr but differs on Fajr/Maghrib waiting periods. Not currently surfaced via per-city `altMethods`.
- **Hanafi expatriate population** (Pakistani-Bangladeshi-Indian) in Kuwait City + Salmiya may publish via mosque-level Hanafi-published times that use 2× shadow Asr. fajr's `applied.asrSchool` defaults to Standard; Hanafi users override explicitly.
- **Iranian-expatriate Shia** in Kuwait may follow Tehran/Sistani convention rather than the Kuwait default; like the UAE pattern, geography-based override is less clean than the citizen-population-based Saudi case.

## City-level overrides

None at city level for Kuwait. The country-default Kuwait dispatch handles Kuwait City, Hawalli, Salmiya, Ahmadi, Jahra, and all major Kuwaiti coordinates correctly.

## Open questions / outstanding work

- **Live Awqaf fixture** — fajr currently has no Kuwait-specific institutional fixture in the eval corpus. Acquiring an Awqaf-direct fetcher (al-Mosaller API or scraped daily Imsakiyya from awqaf.gov.kw) would lift Kuwait from 🟡→🟢 to 🟢 with empirical backing and grade B → A per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria).
- **Shia altMethods surfacing** — Sistani-aligned Imsakiyya for the ~30% Twelver Shia citizenry could be exposed as a `notes[]` chip for Kuwait City coordinates, analogous to the Saudi Eastern Province pattern.

## Sources

- Kuwait Ministry of Awqaf and Islamic Affairs: https://www.awqaf.gov.kw
- Aladhan method 8 (Kuwait): https://aladhan.com/calculation-methods
- adhan.js Kuwait preset: https://github.com/batoulapps/adhan-js
- Engine `selectMethod()` dispatch: see [`src/engine.js`](../../../src/engine.js#L1265)
