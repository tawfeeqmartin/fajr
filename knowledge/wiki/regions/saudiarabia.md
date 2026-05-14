# Saudi Arabia — prayer-time conventions

## Institutional reference bodies

- **General Presidency for the Affairs of the Two Holy Mosques (الرئاسة العامة):** administers Masjid al-Haram (Mecca) + Al-Masjid an-Nabawi (Madinah) — the most-watched prayer times in the world (livestreamed Tarawih in Ramadan, Hajj season throughout Dhul Hijjah). URL: https://gph.gov.sa (geo-blocked from non-Saudi networks; reachable from Saudi-routable contributors).
- **Umm al-Qura Calendar (Saudi Royal Court / KACST):** publishes the official Saudi Hijri calendar at https://www.ummulqura.org.sa (also geo-blocked from non-Saudi networks). Used as the global default for Hijri date computation by AlAdhan, IslamicFinder, IACAD, Microsoft Windows.
- **Ministry of Islamic Affairs, Da'wah and Guidance (MoIA):** institutional dispatch for prayer-time conventions across all Saudi mosques. URL: https://moia.gov.sa (reachable; has a prayer-time widget on the homepage).
- **Council of Senior Scholars / Permanent Committee for Fatwas (Al-Lajna al-Da'ima, الفتاوى للجنة الدائمة):** primary fatwa source for Saudi-stance positions on prayer-time methodology. URL: https://www.alifta.gov.sa (reachable with TLS warning).
- **Population served:** ~32M Muslims (~94% of Saudi Arabia's ~35M total). Sunni-Hanbali institutional madhab; significant Twelver Shia minority in the Eastern Province (~10-15% of Saudi nationals).

## Calculation method (as implemented in fajr)

- **adhan.js method:** `UmmAlQura` (`CalculationMethod.UmmAlQura()`) — corresponds to **Aladhan API method 4**
- **Fajr angle:** 18.5° (Umm al-Qura institutional convention)
- **Isha angle:** N/A — uses **90 min interval after Maghrib** (institutional fixed-interval convention; doubles to 120 min during Ramadan administratively)
- **Asr school:** Standard (1× shadow). The institutional Hanbali madhab uses Standard Asr.
- **Special offsets:** none
- **Classification:** 🟢 Established (institutional preset; UmmAlQura is the canonical UAQ-published convention)

## Why this method

The 18.5° Fajr angle + 90-minute Isha interval is the **Umm al-Qura institutional convention**, the published Saudi-state Imsakiyya. The Aladhan API's method 4 is named "Umm al-Qura" because it is the named originating convention globally.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (Saudi institutional Hanbali uses Standard Asr; not Hanafi)
- `applied.asrSchool` returns `'standard'`

This is one of the cases where convention and applied formula align — no override needed for typical Saudi users.

## The Two-Layer position on elevation correction

**Layer 1 — Saudi scholarly endorsement of the elevation principle.** Primary Hanbali scholarship explicitly supports elevation-dependent prayer times:
- **Sheikh Ibn 'Uthaymeen** *Majmoo' Fataawa* **Vol. 15 p. 437** addresses "high buildings" and rules each person follows their own personal sunset observation
- **Standing Committee** (Lajnah ad-Daa'imah) is cited in IslamQA 220838 in support of the principle

**Layer 2 — Saudi institutional non-application at the Haram.** Despite endorsing the principle, Saudi Arabia **does not** apply elevation corrections near the Haram, despite the Abraj Al-Bait towers (601m, adjacent to Masjid al-Haram). The Umm al-Qura calendar uses uniform times for all of Makkah.

**Jurisprudential rationale:** the Saudi institutional position prioritizes **communal unity (jama'ah)** over individual astronomical precision **specifically at the Haram** — when the mu'adhin calls from the Haram, all Muslims in the city pray together; floor-stratified corrections would fragment the communal prayer at the world's most communally-organized prayer venue.

The two layers are not contradictory; they operate on different axes (scholarly principle vs. institutional application). See `knowledge/wiki/corrections/elevation.md` § "Saudi Arabia — The Two-Layer Position".

## Known points of ikhtilaf within the country

- **Eastern Province Twelver Shia minority** (~10-15% of Saudi nationals; demographically concentrated in Qatif, Awamiyya, Tarout, Hofuf area) follow Sistani-aligned Jafari Imsakiyya which differs numerically from UmmAlQura. fajr does not currently surface this as an `altMethods` chip for Saudi cities — open follow-up. Demographic citations: Pew 2015, Vali Nasr, Madawi al-Rasheed, Toby Matthiesen.
- **Ramadan Isha** uses 120-minute interval after Maghrib (administrative convention) vs. the 90-minute default. fajr's UmmAlQura preset does NOT auto-switch — apps should be aware that during Ramadan the institutional Saudi Isha publication is later than fajr's calc.

## City-level overrides

None at city level. Mecca, Madinah, Riyadh, Jeddah, Dammam all use the UmmAlQura country default.

## Open questions / outstanding work

- **GPH primary fatwa text** for the jama'ah-unity rationale (fajr#132) — blocked on Saudi-routable network access. Acquiring a primary text would lift Saudi's confidence grade from B → A per the [Promotion Criteria](../../../docs/positions.md#promotion-criteria).
- **Eastern Province Shia altMethods** — should expose Tehran/Sistani-aligned alternative for cities like Qatif, Hofuf, Awamiyya. Demographic data supports this; institutional source is Sistani.org's Imsakiyya.
- **Mecca + Madinah Mawaqit yearly fixture** (commit `b281775`, 6 mosques × 366 days) shipped 2026-05-13 is the closest fajr-routable proxy for GPH-equivalent ground truth. Not GPH-official but useful for empirical validation of the UmmAlQura dispatch.

## Sources

- General Presidency: https://gph.gov.sa (geo-blocked)
- Umm al-Qura Calendar: https://www.ummulqura.org.sa (geo-blocked)
- Ministry of Islamic Affairs: https://moia.gov.sa
- Permanent Committee for Fatwas: https://www.alifta.gov.sa
- Aladhan method 4 (Umm al-Qura): https://aladhan.com/calculation-methods
- IslamQA 220838 (Ibn Uthaymeen + Standing Committee on elevation): https://islamqa.info/en/answers/220838
- Mawaqit Saudi yearly fixture: `eval/data/test/mawaqit-saudi-arabia-yearly.json` (6 mosques × 366 days)
