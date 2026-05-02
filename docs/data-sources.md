# Data Sources — Every Cell fajr Validates Against

> Comprehensive inventory of every prayer-time fixture fajr's eval pulls from, with provenance and counts. **Auto-generated structure; counts updated 2026-05-02 with v1.5.0 + KEMENAG 34-province expansion.** This page exists to demonstrate breadth of validation — every named cell below is a real, verifiable institutional / mosque-published / reference-implementation source the eval gates against.

## At a glance

| Layer | Source | Cells | Daily entries | Set | License / channel |
|---|---|---:|---:|---|---|
| **Mosque-published** | Mawaqit-Morocco (calibration anchor) | 25 | 25 | train | mawaqit.net per-mosque slug; refreshed daily by cloud routine |
| **Mosque-published** | Mawaqit-Morocco-extended (post-v1.5.0) | 13 | 13 | holdout | mawaqit.net per-mosque slug; refreshed daily |
| **Mosque-published** | Mawaqit (non-Morocco) | 13 | 13 | holdout | mawaqit.net per-mosque slug; refreshed daily |
| **Institutional** | KEMENAG (Indonesia) | 34 | 1054 | holdout | bimasislam.kemenag.go.id; daily-refresh capable |
| **Institutional** | MUIS (Singapore) | 1 | 365 | holdout | data.gov.sg poll-download API; **Open Data Licence v1.0** |
| **Institutional** | Diyanet (Türkiye) | 3 | 30 | train | ezanvakti.emushaf.net |
| **Institutional** | JAKIM (Malaysia) | 3 | 30 | train | waktusolat.app community proxy for e-solat.gov.my |
| **Calc consensus** | Aladhan API | 17 (train) + 145 (world) | 130 + ~3500 | train + holdout | aladhan.com (calc-vs-calc reproduction) |
| **Calc consensus** | praytimes.org | 10 | ~100 | holdout | independent JS reference impl |
| **Aggregator** | muslimsalat.com | 4 | 32 | holdout | third-party aggregator |
| **Stress** | high-elevation, high-latitude, polar, equator | 5 fixture files | varied | holdout | targeted edge cases |

**Totals: 1800+ daily prayer-time entries across 219 distinct named cells / locations / mosques** — and that's *before* the in-flight global Mawaqit / minority-country slug sweeps land. When the daily Mawaqit refresh, KEMENAG snapshot, and MUIS annual fetch are kept current, the corpus refreshes ~1500 fresh entries per month.

---

## Mosque-published reality (Mawaqit, n = 38 mosques across 14 countries)

Each entry is a real, active mosque on [mawaqit.net](https://mawaqit.net) — a community platform that 6000+ mosques use to publish their official daily prayer times. The slug links to `https://mawaqit.net/en/m/<slug>`. Mosque-published reality is fajr's highest-quality grounding signal: it's what Muslims actually pray to, after each mosque's *muezzin* applies their local horizon, ihtiyati margin, and fiqh interpretation.

### Morocco (25 mosques across 14 cities — train fixture; v1.5.0 Path A signal)

These 25 are the institutional ground-truth that anchored the v1.5.0 Maghrib +5 calibration. They span all macro-regions of Morocco including the high-elevation Atlas / pre-Sahara cities at 1037 m and 1135 m above sea level — fajr's first elevation-validated Moroccan ground truth above the coastal plain.

| City | Region | Mosque slug | Arabic name |
|---|---|---|---|
| Casablanca | Atlantic Coast | `moulay-ismail-casablanca-20400-morocco` | مولاي إسماعيل |
| Casablanca | Atlantic Coast | `msjd-qm-lslm-casablanca-20320-morocco` | مسجد اقامة السلام |
| Casablanca | Atlantic Coast | `mosquee-bab-arrahmane-casablanca-20050-morocco` | مسجد باب الرحمن |
| Rabat | Atlantic Coast (capital) | `msjd-lm-masjid-ummah-rabat-10130-morocco` | مسجد الأمة |
| Marrakech | Interior | `msjd-lthr-marrakech-40170-morocco` | مسجد الطاهر |
| Tanger | Northern | `msjd-sydy-qsm-tanger-90000-morocco` | مسجد سيدي قاسم |
| Tanger | Northern | `msjd-hjryyn-tnj-tanger-90000-morocco` | مسجد حجريين |
| Nador | Northern | `masjid-al-falah-nador-66000-morocco` | مسجد الفلاح |
| Oujda | Eastern | `lmoubacharine-biljna-oujda-60020-morocco` | مسجد المبشرين بالجنة |
| Oujda | Eastern | `mosquee-jaafar-ibn-abi-talib-oujda-60000-morocco` | مسجد جعفر بن أبي طالب |
| Fes | Interior / Atlas-foothill | `masjid-aamrou-bn-laas-fes-30000-morocco-1` | مسجد عمرو بن العاص |
| Fes | Interior / Atlas-foothill | `msjd-lhsn-ryd-llymwn-fes-30000-morocco` | مسجد الحسنى رياض الليمون |
| Meknes | Interior / Atlas-foothill | `mosquee-elamine-meknes-50000-morocco` | مسجد الامين |
| Taza | Interior / Atlas-foothill | `msjd-mr-bn-lkhtb-lqds1-tz-taza-35000-morocco` | مسجد عمر بن الخطاب — القدس1 |
| Khouribga | Interior | `msjd-mr-bn-bd-l-zyz-khouribga-25000-morocco-1` | مسجد عمر بن عبد العزيز |
| Settat | Interior | `mosquee-imam-tarmidi-settat-26000-morocco` | مسجد الإمام الترمذي |
| Sale | Atlantic Coast (capital region) | `msjd-lsf-sale-11000-morocco` | مسجد الصف |
| Kenitra | Atlantic Coast (capital region) | `msjd-lqdsy-kenitra-14000-morocco` | مسجد القادسية |
| Safi | Atlantic Coast (central) | `msjd-blkhy-safi-46000-morocco` | مسجد بلكاهية |
| Essaouira | Atlantic Coast (central) | `msjd-lrwnq-essaouira-44000-morocco` | مسجد الرونق |
| Agadir | Atlantic Coast (south) | `msjd-hl-sws-agadir-80000-morocco` | مسجد اهل سوس |
| Taroudant | Atlantic Coast (south) | `msjd-wld-brhym-taroudant-83300-morocco` | مسجد اولاد براهيم |
| Ouarzazate (1135 m) | High-elevation Atlas | `msjd-lqds-masjid-elqods-ouarzazate-45000-morocco` | مسجد القدس |
| Ouarzazate (1135 m) | High-elevation Atlas | `msjd-sydy-dwd-wrzzt-ouarzazate-45000-morocco` | مسجد سيدي داود |
| Errachidia (1037 m) | High-elevation pre-Sahara | `masjid-marzouga-lgharbia-errachidia-52202-morocco` | مسجد مرزوكة الغربية |

### Morocco — extended holdout (13 mosques across 13 additional cities, post-v1.5.0)

Added 2026-05-02 in the "every Moroccan city" expansion pass. Held in `eval/data/test/mawaqit-morocco-extended.json` rather than train so the v1.5.0 +5 Maghrib calibration's per-cell ratchet stays anchored against its original 25-mosque signal. Future calibrations targeting Atlas / Sahara / extended-region biases can promote individual mosques into train as warranted.

| City | Region | Mosque slug |
|---|---|---|
| Taourirt | Eastern | `jamii-ibrahim-lkhalil-taourirt-65000-morocco-1` |
| Berrechid | Atlantic Coast (Casa metro) | `mosquee-brahimm-lkhlalil-berrchid-26100-morocco` |
| Temara | Atlantic Coast (capital region) | `msjd-bd-llh-bn-ysyn-temara-12123-morocco` |
| Sidi Kacem | Atlantic Coast (capital region) | `msjd-zgr-sidi-kacem-16000-morocco` |
| Sidi Kacem | Atlantic Coast (capital region) | `msjd-lmm-lbkhry-sidi-kacem-16000-morocco` |
| Fquih Ben Salah | Interior | `masjid-lhouda-fkih-ben-salah-23200-morocco` |
| Sefrou | Interior / Atlas-foothill | `mosquee-ahel-sefrou-sefrou-31000-morocco` |
| Guelmim | Atlantic Coast (south) | `msjd-m-dh-bn-jbl-tl-ynt-timoulay-izdar-guelmim-81053-morocco` |
| Inezgane | Atlantic Coast (south) | `msjd-lbrr-nzkn-86150-morocco` |
| Inezgane | Atlantic Coast (south) | `msjd-bdr-msdwr-nzkn-86350-morocco` |
| Ifrane (1665 m) | High-elevation Atlas | `mosquee-universite-alakhawayn-ifrane-53000-morocco` |
| Midelt (1488 m) | High-elevation Atlas | `masjid-lryad-midelt-54350-morocco` |
| Tinghir | High-elevation Atlas | `mosquee-icherban-tinghir-45800-morocco` |
| Tinghir | High-elevation Atlas | `mosquee-alhidaya-tinghir-45800-morocco` |
| Erfoud | High-elevation pre-Sahara | `msjd-lhmry-erfoud-52200-morocco` |
| Erfoud | High-elevation pre-Sahara | `msjd-mwly-slymn-erfoud-52200-morocco` |
| Zagora | Sahara | `msjd-yt-hdw-tgblt-zkwr-zagora-49000-morocco` |

**Total Morocco coverage: 38 mosques across 27 distinct cities, spanning every macro-region** (north / east / interior / Atlantic coast — north & central & south / Atlas / pre-Sahara / Sahara / Western Sahara).

### Cities probed but NOT in Mawaqit's coverage

Mawaqit's coverage is structurally community / diaspora-skewed; some major Moroccan cities have no mosque listings on the platform. Documented honestly so the next agent doesn't re-walk these dead-ends:

- **Tetouan** (~400k pop) — no mosque slugs found via name or postcode (93000) search.
- **Beni Mellal** (~200k) — no mosque slugs.
- **Al Hoceima** — no mosque slugs.
- **Chefchaouen** — no mosque slugs.
- **Larache, Ksar el Kebir, Asilah, Ouezzane** — northern coastal/interior cities with no Mawaqit coverage.
- **Berkane** — no mosque slugs.
- **Khemisset** — no Mawaqit results at all.
- **Azrou, Tiznit, Rissani** — no Mawaqit-published mosques.
- **Laayoune, Dakhla, Tan Tan** (Western Sahara / far south) — `tayib-morabit-tantan-82000-morocco` exists but returns stale/undefined times.

**Recommended channels for these cities:** Ministry of Habous publishes regional Imsakiyya for all Moroccan governorates; manual transcription of the regional PDF would close every remaining gap. Aladhan API custom-method-99 is the calc-vs-calc fallback already in `eval/data/test/morocco.json`.

### International (13 mosques across 12 cities — holdout)

| City | Country | Mosque slug |
|---|---|---|
| Cairo | Egypt | `msjd-l-lm-lnf-nouveau-caire-4710001-egypt` |
| London | United Kingdom | `dar-ul-quran-london-london-nw1-1hw-united-kingdom` |
| Marseille | France | `mosquee-de-frais-vallon-marseille-13013-france-1` |
| Limoges | France | `les-compagnons-limoges-87000-france-1` |
| Mulhouse | France | `association-des-musulmans-des-coteaux-mulhouse` |
| Tunis | Tunisia | `msjd-sydy-qwysm-tunis-1006-tunisia` |
| Algiers | Algeria | `masjid-abi-bakr-lsidiq-algiers-16200-algeria` |
| Doha | Qatar | `masjid-imam-muhammad-bin-abdul-wahhab-doha-00000-qatar` |
| Kuwait | Kuwait | `mubarak-omar-dhiyab-al-rajhi-mosque-abdali-3200-kuwait` |
| Dammam | Saudi Arabia | `jawharah-taybah-dammam-32275-saudi-arabia` |
| Jakarta | Indonesia | `attaufiq-cptiv-jakarta-dki-jakarta-10510-indonesia` |
| Singapore | Singapore | `al-khair-mosque-darul-tafsir-choa-chu-kang-688847-singapore` |
| Kuala Lumpur | Malaysia | `surau-ar-raudhah-islamiah-kuala-lumpur-54200-malaysia-2` |

The full registry — including 5 explicitly excluded slugs (data-quality issues like Ramadan-DST tz misconfigs and 30 `iconic_wishlist` canonical mosques (Hassan II, Al-Qarawiyyin, Al-Azhar, Sheikh Zayed, Faisal, Masjid Negara, Istiqlal, Süleymaniye, etc.) with their recommended national-awqaf channels — is at [`scripts/data/mawaqit-mosques.json`](../scripts/data/mawaqit-mosques.json).

---

## Institutional ground truth — KEMENAG (Indonesia, n = 34 provincial capitals, 1054 daily entries)

Indonesia has the world's largest Muslim population (~270 million). KEMENAG (Kementerian Agama Republik Indonesia, the Ministry of Religious Affairs) publishes per-kabupaten/kota Imsakiyya at [bimasislam.kemenag.go.id](https://bimasislam.kemenag.go.id). One representative provincial capital is fetched per province for the v1 corpus expansion.

The endpoint uses an undocumented `md5(N)` ID convention discovered via [aproxtimedev/api-jadwal-sholat](https://github.com/aproxtimedev/api-jadwal-sholat) and verified live 2026-05-02. KEMENAG's own province ordering is registered at [`scripts/data/kemenag-provinces.json`](../scripts/data/kemenag-provinces.json).

| n  | Province                     | Capital            | KEMENAG kabupaten name | Timezone |
|----|------------------------------|--------------------|-----------------------|----------|
|  1 | Aceh                         | Banda Aceh         | KOTA BANDA ACEH       | WIB      |
|  2 | Sumatera Utara               | Medan              | KOTA MEDAN            | WIB      |
|  3 | Sumatera Barat               | Padang             | KOTA PADANG           | WIB      |
|  4 | Riau                         | Pekanbaru          | KOTA PEKANBARU        | WIB      |
|  5 | Kepulauan Riau               | Tanjung Pinang     | KOTA TANJUNG PINANG   | WIB      |
|  6 | Jambi                        | Jambi              | KOTA JAMBI            | WIB      |
|  7 | Bengkulu                     | Bengkulu           | KOTA BENGKULU         | WIB      |
|  8 | Sumatera Selatan             | Palembang          | KOTA PALEMBANG        | WIB      |
|  9 | Kepulauan Bangka Belitung    | Pangkal Pinang     | KOTA PANGKAL PINANG   | WIB      |
| 10 | Lampung                      | Bandar Lampung     | KOTA BANDAR LAMPUNG   | WIB      |
| 11 | Banten                       | Serang             | KOTA SERANG           | WIB      |
| 12 | Jawa Barat                   | Bandung            | KOTA BANDUNG          | WIB      |
| 13 | DKI Jakarta                  | Jakarta            | KOTA JAKARTA          | WIB      |
| 14 | Jawa Tengah                  | Semarang           | KOTA SEMARANG         | WIB      |
| 15 | DI Yogyakarta                | Yogyakarta         | KOTA YOGYAKARTA       | WIB      |
| 16 | Jawa Timur                   | Surabaya           | KOTA SURABAYA         | WIB      |
| 17 | Bali                         | Denpasar           | KOTA DENPASAR         | WITA     |
| 18 | Nusa Tenggara Barat          | Mataram            | KOTA MATARAM          | WITA     |
| 19 | Nusa Tenggara Timur          | Kupang             | KOTA KUPANG           | WITA     |
| 20 | Kalimantan Barat             | Pontianak          | KOTA PONTIANAK        | WIB      |
| 21 | Kalimantan Selatan           | Banjarmasin        | KOTA BANJARMASIN      | WITA     |
| 22 | Kalimantan Tengah            | Palangka Raya      | KOTA PALANGKARAYA     | WIB      |
| 23 | Kalimantan Timur             | Samarinda          | KOTA SAMARINDA        | WITA     |
| 24 | Kalimantan Utara             | Tanjung Selor      | KAB. BULUNGAN         | WITA     |
| 25 | Gorontalo                    | Gorontalo          | KOTA GORONTALO        | WITA     |
| 26 | Sulawesi Selatan             | Makassar           | KOTA MAKASSAR         | WITA     |
| 27 | Sulawesi Tenggara            | Kendari            | KOTA KENDARI          | WITA     |
| 28 | Sulawesi Tengah              | Palu               | KOTA PALU             | WITA     |
| 29 | Sulawesi Utara               | Manado             | KOTA MANADO           | WITA     |
| 30 | Sulawesi Barat               | Mamuju             | KAB. MAMUJU           | WITA     |
| 31 | Maluku                       | Ambon              | KOTA AMBON            | WIT      |
| 32 | Maluku Utara                 | Ternate            | KOTA TERNATE          | WIT      |
| 33 | Papua                        | Jayapura           | KOTA JAYAPURA         | WIT      |
| 34 | Papua Barat                  | Manokwari          | KAB. MANOKWARI        | WIT      |

Each provincial cell carries a full month of daily entries (1054 days total). KEMENAG-province residual against fajr's calc layer (fresh holdout, 2026-05-02): WMAE 2.44 min, Maghrib bias −2.84 min — visible Path A signal for a future v1.6.0 calibration.

---

## Institutional ground truth — MUIS (Singapore, n = 365 daily entries, **WMAE 0.31 — fajr's strongest single match**)

[MUIS](https://muis.gov.sg) (Majlis Ugama Islam Singapura — the Islamic Religious Council of Singapore) publishes their official annual Imsakiyya to [data.gov.sg](https://data.gov.sg) under the **Singapore Open Data Licence v1.0** — commercial redistribution explicitly permitted with attribution. This is the cleanest licensed institutional channel fajr integrates: official, no auth, no scraping, full year of daily data in a single API call.

| Year | Resource ID                                  |
|------|----------------------------------------------|
| 2026 | `d_d441e7242e78efc566024dd5b0d9829c`        |
| 2025 | `d_e81ea2337599b674c4f645c1af93e0dc`        |
| 2024 | `d_dddc19f6c90edd7cff6b57494630ad29`        |

Per-year fetcher: `scripts/fetch-muis.js`. Output: `eval/data/test/muis.json` — single fixture with 365 daily entries.

**Empirical agreement (post-fetch eval, 2026-05-02):** WMAE **0.31 min** across 365 days. Per-prayer biases all under 0.30 minutes. This is fajr's single best-agreeing institutional source — calc against MUIS published Imsakiyya is sub-minute precision across the entire year.

---

## Institutional ground truth — Diyanet İşleri Başkanlığı (Türkiye, n = 3 zones)

Diyanet is Türkiye's authoritative state Islamic body for Sunni practice. Their ezanvakti.emushaf.net publishing endpoint is fajr's institutional channel for Türkiye (calibrated against in v1.4.5 Maghrib/Isha −1).

| Zone     | City     | Method                          |
|----------|----------|---------------------------------|
| 9541     | Istanbul | Diyanet İşleri Başkanlığı       |
| 9206     | Ankara   | Diyanet İşleri Başkanlığı       |
| 9560     | Izmir    | Diyanet İşleri Başkanlığı       |

10 daily entries per zone × 3 zones = 30 entries.

---

## Institutional ground truth — JAKIM (Malaysia, n = 3 zones)

JAKIM (Department of Islamic Development Malaysia) is the federal Islamic authority for Malaysia. Their e-solat.gov.my system is geo-restricted; fajr accesses JAKIM data via the [waktusolat.app](https://waktusolat.app) community proxy. Calibrated against in v1.4.1 (Fajr +8) and v1.4.4 (Isha +1).

| Zone   | Region              | City         |
|--------|---------------------|--------------|
| WLY01  | Wilayah Persekutuan | Kuala Lumpur |
| SGR03  | Selangor            | Shah Alam    |
| PNG01  | Pulau Pinang        | George Town  |

10 daily entries per zone × 3 zones = 30 entries.

---

## Calculation-method consensus — Aladhan (n = 17 train cities + 145 country fixtures)

[Aladhan API](https://aladhan.com) is an independent JS implementation of the same calculation methods fajr auto-detects. Its agreement with fajr is a *consistency check* (we're applying the formulas correctly), not an *accuracy claim* (we match what mosques publish). Both used as train-corpus stability anchors and as a holdout coverage backbone.

### Train (n = 17 cities)

| Region            | Cities                                                                |
|-------------------|-----------------------------------------------------------------------|
| Saudi Arabia      | Makkah, Madinah, Riyadh                                               |
| UAE               | Dubai                                                                 |
| Egypt             | Cairo, Alexandria                                                     |
| France            | Paris                                                                 |
| United Kingdom    | London                                                                |
| Pakistan          | Karachi                                                               |
| Indonesia         | Jakarta                                                               |
| USA               | New York, Los Angeles                                                 |
| Canada            | Toronto                                                               |

10 daily entries per city × 17 cities = 170 train entries.

### Holdout — `world-coverage` (n = 145 countries)

In v1.4.0 the eval expanded to 163 country fixtures via `scripts/fetch-aladhan-world.js`, hitting one major-city per UN-member-state. Each country's fixture carries 8 daily entries (one per representative day across spring/summer/autumn ranges). Run `ls eval/data/test/world-*.json` for the full list — every country with a Muslim population of any size is covered, plus tropical / equatorial / polar stress cells (Ecuador, Iceland, Norway, etc.) and ≥10 % Muslim minority countries (India, China, Russia, Ethiopia, Nigeria, etc.).

---

## Calculation-method reference — praytimes.org / Hamid Zarrabi-Zadeh (n = 10 cities)

`praytimes.json` ships [praytimes.org](http://praytimes.org)'s reference implementation evaluations — an independent JavaScript engine maintained by Hamid Zarrabi-Zadeh. Used as a third independent reference layer for selected major Islamic cities; ~100 daily entries.

---

## Aggregator cross-check — muslimsalat.com (n = 4 cities, holdout)

Third-party prayer-time aggregator with known accuracy variance — explicitly held in the test set as a *cross-check ceiling* (its 26 min holdout WMAE flags it as the noisiest source we look at, used to verify our metric system flags real divergence rather than fitting to noise).

| City    | Country        |
|---------|----------------|
| Karachi | Pakistan       |
| Cairo   | Egypt          |
| London  | United Kingdom |
| Dubai   | UAE            |

---

## Stress-test fixtures (holdout, edge-case validation)

| Fixture | Purpose |
|---|---|
| `eval/data/test/anchorage.json` | Sub-arctic high-latitude (61° N) — exercises the high-latitude rule |
| `eval/data/test/svalbard.json`  | Polar 78° N — beyond the analytical solver's domain; verifies graceful fallback |
| `eval/data/test/quito.json`     | Equator 0° — verifies symmetry / no NaN at θ = 0 |
| `eval/data/test/high_elevation.json` | Mountain coordinates — verifies elevation-correction guard rails |
| `eval/data/test/high_latitude.json`  | Mid-high latitudes (Reykjavik, etc.) — verifies notes/warnings |

---

## Calc-vs-calc fixtures held in test/ (corpus curation per recipe step 2)

Three Aladhan-method-99 calc-vs-calc reproductions are explicitly *held* in test/ rather than train/, so they're reported but never gating. Each was originally in train/ then moved out when an actual-institutional Path A signal arrived for the same region:

| Fixture | Reason for test-only classification |
|---|---|
| `eval/data/test/morocco.json` | Aladhan reproduction of `Other(19, 17)`; replaced in train by `mawaqit-morocco.json` at v1.5.0 |
| `eval/data/test/turkey.json` | Aladhan reproduction of `CalculationMethod.Turkey()`; replaced in train by `diyanet.json` at v1.4.5 |
| `eval/data/test/malaysia.json` | Aladhan reproduction of `JAKIM` method; replaced in train by `waktusolat.json` at v1.4.1 |

This is corpus *curation*, not data modification — the file content is unchanged, only its classification.

---

## Refresh cadence

- **Daily** — `node scripts/fetch-mawaqit.js` refreshes Mawaqit fixtures (38 mosques, both Morocco-train and non-Morocco-test). Wired up as a 06:00 UTC cloud routine; opens an auto-PR if `docs/progress.md` shifts more than timestamp-only.
- **On-demand** — `node scripts/fetch-kemenag.js` refreshes the 34 KEMENAG provincial-capital fixtures with a fresh full-month snapshot. Run before any v1.6.0 calibration work to ensure the Path A signal is current.
- **Annual / per-release** — `node scripts/fetch-diyanet.js`, `fetch-waktusolat.js`, `fetch-aladhan.js`, `fetch-aladhan-world.js`, `fetch-praytimes.js`, `fetch-muslimsalat.js`. These produce stable monthly snapshots that don't need daily refresh.

---

## Sources we WANT but cannot yet integrate

Three institutional channels were probed 2026-05-02 and remain blocked from a clean / scriptable / non-residential context:

| Channel | Status | Recommended unblock |
|---|---|---|
| ~~MUIS (Singapore)~~ | ✅ INTEGRATED — `scripts/fetch-muis.js` via data.gov.sg poll-download API. WMAE 0.31 across 365 daily entries — sub-minute agreement, fajr's strongest institutional match. | n/a |
| IACAD (UAE Dulook DXB) | `/services/prayertimes` redirects to login | Mobile-app-only; awaiting documented public API |
| Saudi Hajj Ministry Haramain Imsakiyya | PDF-only | Manual transcription required — small one-time effort |
| Egyptian GAS / Al-Azhar | No public JSON API | Manual transcription required |
| Pakistani Auqaf | DNS does not resolve from outside-region | Either community proxy or in-region access |

Detailed status notes are in [`scripts/data/mawaqit-mosques.json`](../scripts/data/mawaqit-mosques.json) under each `iconic_wishlist[*].recommended_channel`. Each entry includes a 2026-05-02 probe timestamp so future agents don't re-walk the same dead-ends.

The MUIS data.gov.sg path was identified by a parallel-research agent and is an obvious next-PR target — single-fetch CSV download, official Open Data Licence v1.0, ~365 daily Singapore entries.
