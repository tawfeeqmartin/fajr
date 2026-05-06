# Mosque corpus expansion — non-Mawaqit institutional channels & OSM density (2026-05-05)

Read-only research proposal. No engine / eval / wiki / package.json edits made; this
file is the only artifact. All external claims are sourced to URLs probed live on
2026-05-05; statuses are live as of that date.

---

## Executive summary

1. **Indonesia is unblocked.** `api.myquran.com/v2` is a live, open, unauthenticated wrapper around
   KEMENAG's `bimasislam.kemenag.go.id` jadwal-shalat. 518 kabupaten/kota, daily
   prayer times for any year, 8 prayers including imsak/dhuha. **This closes
   `iconic_wishlist[Istiqlal Mosque].recommended_channel` and
   `calibration-recipe.md → KEMENAG bimasislam dead-end`**.
2. **Brunei is unblocked.** SharePoint OData REST endpoint
   `https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items`
   returns clean JSON, 4526 items, last refreshed yesterday, all 8 prayers. **Closes
   `iconic_wishlist[Sultan Omar Ali Saifuddien].recommended_channel`**.
3. **Morocco's Habous publishes a clean public PHP API** at
   `https://www.habous.gov.ma/prieres/horaire-api.php?ville={1..322}` covering
   ~191 cities, daily for current year. This is a direct first-party institutional
   channel — currently fajr's Mawaqit-Morocco corpus is mosque-published reality;
   Habous is the *ministerial* reference behind those mosques. Adding Habous as
   a separate per-region train cell would tighten the v1.5.0 calibration loop.
4. **Egypt's General Authority of Survey** (esa.gov.eg) publishes monthly tables
   for 83 Egyptian cities behind a classic ASP.NET VIEWSTATE form at
   `praytimes.aspx`. Scrapable with one-time VIEWSTATE harvest — **this closes
   `calibration-recipe.md → Egypt GAS no public JSON API` for the
   Cairo/Alexandria 6.5 min Path A residual** (the largest train outlier in the
   v1.7.19 corpus).
5. **Diyanet International ezanvakti.emushaf.net covers 204 countries**, not just
   Türkiye — it dispatches the Diyanet method globally for Turkish-diaspora
   populations. fajr currently uses it only for Türkiye train. Useful as a
   second institutional cross-reference for Diaspora-heavy populations
   (Germany, Belgium, Netherlands, Austria, Switzerland) — **but the body of
   data is structurally Diyanet-method, not local-authority
   reality**, so it is calc-vs-method-as-published, not native-authority.

**Biggest unexpected finding:** Mawaqit-search-rejected-as-dead-end channels
(KEMENAG, MUIS, Brunei MoRA, Habous, Egypt GAS, Kazakhstan KMDB, Tatarstan DUM)
are NOT actually dead-ends — they're behind one CSRF/JS-injection gate or a
documented but undiscovered REST API. Five of them are now demonstrated
unblocked in this audit's probes. The previous "dead-end" verdict in
`docs/calibration-recipe.md` was correct *conditional on the probe technique*
(GET against a SPA URL), but the real channels hide one redirect deeper.

---

## 1. Per-country coverage matrix

Sources for OSM counts: live Overpass API queries on 2026-05-05
(`https://overpass-api.de/api/interpreter`, `amenity=place_of_worship +
religion=muslim`, country-bbox-bounded). Counts include nodes + ways +
relations. Named-mosque counts are sample-only (per-metro Overpass queries
within 5–25 km of city centroid) and do not represent the full national
named-mosque count.

The "Priority class" column scores HIGH/MED/LOW based on (Muslim population ×
current Mawaqit slug count) — HIGH = ≥30 M Muslims and ≤5 Mawaqit slugs, MED =
1–30 M Muslims and ≤5 slugs, LOW = either small population OR adequate Mawaqit
coverage already.

Access status legend:
- `OPEN` — public unauthenticated endpoint, JSON or HTML scrapable today
- `OPEN-CSRF` — public but requires session cookie + form CSRF (still scriptable)
- `OPEN-VIEWSTATE` — ASP.NET form behind VIEWSTATE token (scriptable with
  one-time harvest)
- `OPEN-PHP` — classic PHP form, works today
- `OPEN-OData` — Microsoft SharePoint OData REST, works today
- `WAF-403` — Cloudflare/CloudFront/WAF blocks non-browser UA
- `MOBILE-GATED` — only the app reaches the data; web returns SPA/login
- `PDF-ONLY` — published as PDF only; manual transcription needed
- `DEAD` — domain/path returns 000 / 404 / dead and no live alternate found
- `NOT-PROBED` — not reached during this audit

| Country | Mawaqit slugs in registry | OSM all (~) | OSM named (sample) | Non-Mawaqit channel candidates | Access | Priority |
|---|---:|---:|---:|---|---|---|
| Indonesia | 1 | 73,256 | 43 (Jakarta 8 km) | KEMENAG `bimasislam.kemenag.go.id/jadwalshalat` (CSRF-gated AJAX); **`api.myquran.com/v2/sholat`** (community wrapper of KEMENAG, OPEN); BMKG hisab/rukyat | OPEN-CSRF / **OPEN** | **HIGH** |
| Pakistan | 3 | 8,113 | 1,081 (Karachi 8 km) | Aladhan method=1 (Karachi); ezanvakti `IlceID 15767..15793` (28 districts, but Diyanet-method = diaspora not local); University of Islamic Sciences Karachi reference; HamariWeb (WAF) | partially OPEN via Aladhan, native auqaf DEAD | **HIGH** |
| Bangladesh | 3 | 12,137 | 1,010 (Dhaka 8 km) | Islamic Foundation Bangladesh (`islamicfoundation.gov.bd`) — SPA, no prayer-time page found; ezanvakti `IlceID 11669..11672` (4 districts, Diyanet-method); Maizbhandari aggregator | DEAD (IFB) / OPEN-but-Diyanet | **HIGH** |
| Egypt | 3 | 2,162 | (timeout) | **`esa.gov.eg/praytimes.aspx`** (83 cities, OPEN-VIEWSTATE); Aladhan method=5 (Egyptian); Dar al-Ifta (TLS error); Al-Azhar; Egypt Awqaf Online (WAF) | **OPEN-VIEWSTATE** | **HIGH** |
| Nigeria | 3 | 620 | 2 (Lagos 5 km, sparse OSM tagging) | NSCIA (`nscia.com.ng` — moonsighting fatwas only, no daily prayer); Sultanate of Sokoto (no prayer-time URL); Aladhan method=8 (Gulf as default) | DEAD for native daily | **HIGH** |
| India | 3 | 8,626 | (large) | AIMPLB (DEAD); Jamiat Ulama-i-Hind (`jamiatulama.in` accessible but no prayer-time page); Hilal Committee Hyderabad (DEAD); ezanvakti `IlceID 11254..` (~30 districts, Diyanet-method); Aladhan method=1 (Karachi) for North India; Samastha Kerala (already cited for Kochi) | partially via Aladhan, native institutional DEAD | **HIGH** |
| Saudi Arabia | 6 | 12,365 | n/a | Hajj Ministry Imsakiyya (`haj.gov.sa` — accessible but PDF-only); Umm al-Qura Aladhan method=4; General Presidency for Affairs of the Two Holy Mosques `gph.gov.sa` (TLS-failed in audit) | PDF-ONLY / Aladhan | LOW (well-served) |
| UAE | 0 | 3,014 | n/a | IACAD Dulook DXB (mobile-gated still); SZGMC `szgmc.gov.ae/en/visiting-the-mosque/szgmc-prayer-time` (server-rendered, but `txtFajar` placeholder is empty in current request — likely time-of-day-rendered); GAIAEA awqaf.gov.ae (SPA backed by `mobileappapi.awqaf.gov.ae/APIS/`, requires auth tokens); Aladhan method=16 (Dubai experimental) | MOBILE-GATED / Aladhan | LOW (well-served by Aladhan) |
| Türkiye | 0 (Diyanet integrated) | 45,676 | n/a | Diyanet `ezanvakti.emushaf.net` (already integrated) | OPEN | LOW (well-served) |
| Morocco | 42 | 3,958 | n/a | **Habous `www.habous.gov.ma/prieres/horaire-api.php?ville={1..322}`** (~191 cities, OPEN-PHP, ministerial reference); already covered by Mawaqit-Morocco (23 mosque train fixtures) | **OPEN-PHP** | MED (diversification) |
| Algeria | 6 | 7,888 | n/a | Aladhan method=19 (Algeria); MARW `marw.dz` (returns HTML, no daily-prayer page found in audit) | Aladhan only | MED |
| Tunisia | 5 | 2,151 | n/a | Aladhan method=18 (Tunisia); Tunisia Diwan al-Awqaf TLS-failed | Aladhan only | LOW |
| Libya | 4 | 5,043 | n/a | Aladhan world-default; Libya Awqaf no scriptable channel found | Aladhan only | LOW |
| Iraq | 5 | 3,989 | n/a | Sunni Iraq Awqaf `sunni.gov.iq` (TLS-failed); Sistani office `sistani.org` (English HTML accessible but no daily-prayer endpoint); Aladhan method=5 (Egyptian) | Aladhan / Sistani PDF | MED |
| Iran | 0 | 16,117 | n/a | Tehran Geophysics direct (Cloudflare-gated to Iran timezone); Astan Quds Razavi `razavi.ir` (geo-blocked; "transferring to website" message); `prayertime.ir` (WordPress, accessible — but appears calc-vs-calc); Aladhan method=7 (Tehran) | partially Aladhan / regional Cloudflare | MED |
| Lebanon | 3 | 1,067 | n/a | Dar al-Fatwa (already cited for Beirut); Higher Shia Council; Aladhan world-default | covered via Aladhan + Mawaqit | LOW |
| Syria | 4 | 3,133 | n/a | Syrian Awqaf Diwan (no API found); Aladhan world-default | covered via Mawaqit | LOW |
| Palestine | 3 | 1,678 | n/a | Jerusalem Awqaf (no public API); Aladhan custom-3 method | covered via Mawaqit + Aladhan | LOW |
| Jordan | 2 | 835 | n/a | `awqaf.gov.jo` (HTML accessible, no daily-prayer endpoint exposed in audit); Aladhan method=23 (Jordan) | Aladhan only | LOW |
| Kuwait | 1 | 1,847 | n/a | Aladhan method=9 (Kuwait); Kuwait Awqaf Ministry (NOT-PROBED) | Aladhan only | LOW |
| Bahrain | 2 | 839 | n/a | Aladhan world-default | LOW |
| Qatar | 1 | 680 | n/a | Aladhan method=10 (Qatar) | LOW |
| Oman | 1 | 2,088 | n/a | Aladhan world-default | LOW |
| Yemen | 1 | 3,338 | n/a | `iuy.org.ye` TLS-failed; `moe.gov.ye` 502; Aladhan world-default | DEAD-native | MED |
| Sudan | 1 | 3,791 | n/a | Sudan Dar al-Ifta `darulifta.sd` TLS-failed; Aladhan world-default | DEAD-native | MED |
| Somalia | 3 | 1,647 | n/a | Aladhan world-default | LOW |
| Senegal | 4 | 2,935 | 215 (Dakar 15 km) | Tijaniyya `tidjaniya.com` (WordPress accessible, no daily-prayer endpoint); Mouride Touba (DEAD); Aladhan world-default; ezanvakti `IlceID` (Senegal listed, single Diyanet zone) | Aladhan + Diyanet-diaspora | MED |
| Mali | 3 | 1,316 | n/a | HCIM (`hcim.org` accessible but no prayer page); Aladhan world-default | Aladhan only | LOW |
| Mauritania | 3 | 738 | n/a | Aladhan world-default | covered via Mawaqit | LOW |
| BurkinaFaso | 0 | 2,482 | n/a | Aladhan world-default | LOW |
| Niger | 0 | 1,108 | n/a | Aladhan world-default | LOW |
| Chad | 1 | 159 | n/a | Aladhan world-default | LOW |
| Guinea | 0 | 1,089 | n/a | Aladhan world-default | LOW |
| Sierra Leone | 0 | 303 | n/a | Aladhan world-default | LOW |
| Gambia | 0 | 203 | n/a | Aladhan world-default | LOW |
| CoteDIvoire | 0 | 1,317 | n/a | Aladhan world-default | LOW |
| Ghana | 0 | 1,102 | n/a | Aladhan world-default | LOW |
| Cameroon | 0 | 1,123 | n/a | Aladhan world-default | LOW |
| Benin | 0 | 443 | n/a | Aladhan world-default | LOW |
| Togo | 0 | 655 | n/a | Aladhan world-default | LOW |
| Liberia | 0 | 46 | n/a | Aladhan world-default | LOW |
| Tanzania | 1 | 1,227 | n/a | BAKWATA `bakwata.or.tz` (Inertia-React SPA, no prayer-time path surfaced); Mufti of Zanzibar (NOT-PROBED) | LOW (DEAD-native) | MED |
| Uganda | 0 | 532 | n/a | UMSC `umsc.or.ug` accessible but no prayer-time page found in audit | DEAD-native | LOW |
| Kenya | 0 | 620 | n/a | Aladhan world-default | LOW |
| Ethiopia | 1 | 293 | n/a | Aladhan world-default | LOW |
| South Africa | 1 | 280 | 38 (Joburg 25 km) | **MJC `mjc.org.za/quick-resources/salaah-times/`** (12 monthly tables, perpetual format, OPEN — but dates are 2021–2022 calendar so usable as a perpetual solar-derived reference); Jamiatul Ulama SA (WordPress, page exists but no embedded table found in audit); Crescent Observers DEAD | **OPEN** for MJC perpetual | **HIGH** (institutional gap) |
| Mozambique | 1 | 99 | n/a | Aladhan world-default | LOW |
| Madagascar | 1 | 102 | n/a | Aladhan world-default | LOW |
| Mauritius | 3 | 84 | n/a | covered via Mawaqit | LOW |
| Malaysia | 1 (JAKIM via waktusolat) | 6,499 | n/a | **`api.waktusolat.app/zones`** (already integrated, 60 zones, 14 negeri); JAKIM e-Solat | OPEN | LOW (well-served) |
| Singapore | 1 | 76 | n/a | MUIS `muis.gov.sg` (WAF-blocked); MUIS Imsakiyya (already in holdout via 365 daily entries); `data.gov.sg` (auth required) | WAF-403 / partial | MED |
| Brunei | 0 | 119 | n/a | **`mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items`** (4526 items, OPEN-OData, daily 2014–2026+) | **OPEN-OData** | **HIGH** (closes wishlist) |
| Philippines | 2 (Cotabato/Marawi via overrides) | 828 | n/a | NCMF (WAF-blocked); BDI BARMM (under construction page; `bangsamoro.gov.ph` 404); Aladhan method=3 (MWL default) | DEAD-native / Aladhan | MED |
| Thailand | 2 | 581 | n/a | Aladhan world-default | LOW |
| Vietnam | 0 | 27 | n/a | Aladhan world-default | LOW |
| Cambodia | 0 | 94 | n/a | Aladhan world-default | LOW |
| Myanmar | 0 | 193 | n/a | Aladhan world-default | LOW |
| Maldives | 0 (covered via country) | 309 | n/a | Maldives Islamic Ministry (NOT-PROBED) | NOT-PROBED | LOW |
| Sri Lanka | 3 | 524 | n/a | covered via Mawaqit + override | LOW |
| Afghanistan | 1 | 3,434 | n/a | Aladhan world-default; Afghan Ministry of Hajj & Religious Affairs (NOT-PROBED — likely DEAD) | LOW (poor reach) | MED |
| Russia | 4 | 4,558 | n/a | DUMRF `dumrf.ru` (HTML, no public daily endpoint); Council of Muftis `muslim.ru` (no prayer endpoint); **DUM Tatarstan `dumrt.ru/netcat_files/482/640/{City}.csv`** (42 CSV cities, OPEN, 2025 dataset); Dagestan `muftiyatrd.ru` (no daily prayer); Aladhan method=14 (Russian SAM) | **OPEN** for Tatarstan; Aladhan for rest | **HIGH** for Tatarstan path |
| Kazakhstan | 0 | 1,243 | n/a | **`api.muftyat.kz/cities/`** (5,695 cities) and **`api.muftyat.kz/prayer-times/{year}/{lat}/{lng}`** (full year 8 prayers); fully OPEN, documented | **OPEN** | **HIGH** |
| Uzbekistan | 0 | 2,280 | n/a | DUM `muslim.uz/c/prayer` (HTML present, no API surfaced in audit); Aladhan world-default | DEAD-native | MED |
| Kyrgyzstan | 0 | 769 | n/a | Aladhan world-default | LOW |
| Tajikistan | 0 | 258 | n/a | Aladhan world-default | LOW |
| Turkmenistan | 0 | 171 | n/a | Aladhan world-default | LOW |
| Azerbaijan | 0 | 1,029 | n/a | Aladhan world-default | LOW |
| France | 8 | 1,060 | n/a | Grande Mosquée de Paris `mosqueedeparis.net` (HTML, no prayer-time endpoint surfaced); UOIF/Musulmans de France (TLS-failed); Aladhan method=12 (UOIF) | covered via Mawaqit + Aladhan | LOW |
| Germany | 4 | 1,614 | n/a | DITIB → Diyanet International (covered via ezanvakti); IGMG `igmg.org` (HTML); ZMD `zentralrat.de` (no prayer-time content found) | covered via Diyanet | LOW |
| Netherlands | 3 | 364 | n/a | covered via Mawaqit + Diyanet International | LOW |
| Belgium | 2 | 226 | n/a | covered via Mawaqit + Diyanet International | LOW |
| UK | 5 | 1,337 | n/a | MCB; **`eastlondonmosque.org.uk/prayer-times`** (188 days inline HTML 2026, OPEN); Birmingham Central (WP, embedded prayer); ICCUK Regent's Park (`iccuk.org`); ADAMS-style mosques | covered + multiple individual mosques | LOW (well-served) |
| Italy | 3 | 124 | n/a | covered via Mawaqit | LOW |
| Spain | 3 | 225 | n/a | covered via Mawaqit + Aladhan | LOW |
| Austria | 2 | 156 | n/a | covered via Diyanet International | LOW |
| Switzerland | 3 | 72 | n/a | covered via Mawaqit | LOW |
| Sweden | 2 | 59 | n/a | covered via Mawaqit + Diyanet International | LOW |
| Denmark | 2 | 36 | n/a | covered via Mawaqit | LOW |
| Norway | 1 | 30 | n/a | covered via Mawaqit | LOW |
| Bosnia | 0 (override only) | 1,345 | n/a | Rijaset BiH `rijaset.ba` (cited; NOT-PROBED-this-audit); covered via Diyanet International | LOW |
| Albania | 0 | 637 | n/a | KMSh `kmsh.al` (HTML accessible, no prayer-time endpoint found); covered via Diyanet International | LOW |
| Kosovo | 0 (override only) | 615 | n/a | BIK `bislame.net` (cited); covered via Diyanet International | LOW |
| North Macedonia | 0 | 342 | n/a | Aladhan world-default; Riyaset of NorthMacedonia (NOT-PROBED) | LOW |
| Serbia | 0 | 803 | n/a | Aladhan world-default | LOW |
| Bulgaria | 0 | 273 | n/a | Bulgarian Muftiate (NOT-PROBED); Aladhan world-default | LOW |
| Greece | 0 | 61 | n/a | covered via Mawaqit / Aladhan | LOW |
| USA | 3 | 1,132 | n/a | ISNA / FCNA / Mawaqit; ICCUK; **ADAMS Center 2026 PDF** at `adamscenter.org/wp-content/uploads/2026/02/ADAMS-Prayer-Times-2026.pdf` (1.2 MB OPEN); Aladhan method=2 (ISNA) | covered + ADAMS | LOW (well-served) |
| Canada | 4 | 330 | n/a | covered via Mawaqit + Aladhan | LOW |
| Australia | 3 | 113 | n/a | ANIC (no prayer-time page); AFIC (TLS-failed); ICV (Sanity.io CMS — empty type query); ICNSW (WordPress, no prayer endpoint) | covered partially via Mawaqit | LOW |
| New Zealand | 0 | 70 | n/a | Aladhan world-default | LOW |

**Summary by tier:**
- **HIGH-priority new channels (5):** Indonesia/myQuran, Pakistan/auqaf-via-Aladhan-improvement, Bangladesh/Diyanet-diaspora-only, Egypt/ESA-VIEWSTATE, Nigeria/no-clear-path, India/no-clear-native-path, South Africa/MJC-perpetual, Russia-Tatarstan/CSV, Kazakhstan/KMDB-API
- **MED-priority opportunities (~10):** Algeria, Iraq-native, Iran-native, Yemen, Sudan, Senegal-native, Tanzania-Zanzibar, Singapore-MUIS-revisit, Philippines-BDI-revisit, Brunei-now-confirmed
- **LOW-priority (~50):** countries with adequate Mawaqit/Aladhan/Diyanet coverage and small populations

---

## 2. Top 20 actionable mosque-source candidates

Effort scale: 1 = fetch a JSON URL once, 5 = needs scraper + cookie session +
periodic refresh. Value scale: 1 = small Muslim population or already
covered, 5 = fills a major gap (Indonesia, Pakistan, Bangladesh, Egypt,
Nigeria) or unblocks a deferred ratchet (Cairo / Alexandria Path A).

| # | Source | Country / city | Type | Effort | Value | Specific scrape hint |
|---|---|---|---|---:|---:|---|
| 1 | **myQuran API** at `https://api.myquran.com/v2/sholat` | Indonesia (518 kabupaten/kota) | community-wrapped institutional | 1 | 5 | `GET /v2/sholat/kota/semua` returns full kota list; `GET /v2/sholat/jadwal/{id}/{YYYY}/{M}/{D}` returns daily prayer with imsak/subuh/terbit/dhuha/dzuhur/ashar/maghrib/isya. No auth, sub-second response. Verified 2026-05-05. |
| 2 | **Brunei MoRA SharePoint** `https://www.mora.gov.bn/_api/web/lists/getbytitle('Waktu%20Sembahyang')/items` | Brunei | institutional-API (OData) | 1 | 5 | `Accept: application/json;odata=verbose` returns all 4,526 daily items (Aug 2014 – Jun 2026 currently). Filter `?$filter=Date%20ge%20datetime'2026-01-01T00:00:00Z'&$top=400&$orderby=Date`. |
| 3 | **Habous Morocco PHP API** at `https://www.habous.gov.ma/prieres/horaire-api.php?ville={1..322}` | Morocco (~191 cities) | institutional-PHP-API | 2 | 4 | HTML response with `<table>` of today's 5-prayer Fajr/Sunrise/Dhuhr/Maghrib/Isha; no Asr (the perpetual Habous tradition treats Asr by sunlight ratio, not separate publication). Iterate ville ID 1–322; ~131 IDs are gaps. |
| 4 | **Egypt General Authority of Survey** `http://www.esa.gov.eg/praytimes.aspx` | Egypt (83 cities) | institutional-VIEWSTATE | 3 | 5 | ASP.NET WebForms with VIEWSTATE / EVENTVALIDATION tokens. POST `ctl00$placeholder1$DropDownList1=<city Arabic>` with full VIEWSTATE blob. Returns full month table with Fajr/Sunrise/Dhuhr/Asr/Maghrib/Isha. **Closes Cairo / Alexandria 6.5 min Fajr Path A residual.** |
| 5 | **Kazakhstan KMDB** `https://api.muftyat.kz/cities/` and `https://api.muftyat.kz/prayer-times/{year}/{lat}/{lng}` | Kazakhstan (5,695 cities) | institutional-API (open) | 1 | 4 | Public JSON, paginated cities list, full-year prayer times per coordinate. Imsak/Fajr/Sunrise/Dhuhr/Asr/Sunset/Maghrib/Isha/Midnight. No auth. Verified 2026-05-05. |
| 6 | **DUM Tatarstan CSV** `https://dumrt.ru/netcat_files/482/640/{City}.csv` | Russia / Tatarstan (42 cities) | mosque-aggregator-CSV | 2 | 3 | One CSV per city: `dd.MM.yyyy;HH:mm` × 9 columns. Cities: Kazan, Almet, Naberezhnye Chelny, Bugulma, Elabuga, Zelenodolsk, etc. Currently dated 2025. |
| 7 | **East London Mosque** `https://www.eastlondonmosque.org.uk/prayer-times` | UK / Tower Hamlets | direct-website (HTML) | 2 | 2 | 188 inline `<tr style="height: 19.5px;">` rows for 2026, full year, with Fajr/Sunrise/Dhuhr/Asr/Maghrib/Isha + Iqamah times for each prayer. Also annual PDF via `Handlers/Download.ashx?IDMF=...`. |
| 8 | **MJC South Africa perpetual** `https://mjc.org.za/quick-resources/salaah-times/` | South Africa / Cape Town | direct-website (HTML, perpetual) | 2 | 4 | 12 monthly tables embedded inline, each row gives Date/Fajr/Sunrise/Zuhr/Asr-Shafi/Asr-Hanafi/Maghrib/Isha-Shafi/Isha-Hanafi (9 columns!). Solar-derived perpetual format, dates 2021–2022 but seasonal pattern is the same year-on-year. Cross-validate against current solar with up to 2-min calendar drift. **Best Asr-school dual-publication source found.** |
| 9 | **Jamiatul Ulama SA** WordPress page `https://www.jamiatsa.org/perpertual-salaah-times/` | South Africa / Gauteng | direct-website (WordPress) | 3 | 3 | Page exists, WP-JSON endpoint `wp-json/wp/v2/pages/205` returns content but rendering is JavaScript-driven; needs follow-up to find the embedded shortcode source. |
| 10 | **ezanvakti.emushaf.net (Diyanet International)** `https://ezanvakti.emushaf.net/{ulkeler,sehirler,ilceler,vakitler}/{id}` | 204 countries (Turkish-diaspora-aligned) | institutional-API (open) | 1 | 3 | Already integrated for Türkiye. Extending to Germany (Berlin/Bavaria/Hamburg/etc.), Belgium, Netherlands, Austria, Switzerland gives Diaspora-Diyanet ground truth. **NB: data is Diyanet-method, not local-authority** — useful as second cross-reference for diaspora-heavy regions, NOT as primary institutional reference for non-Turkey countries. |
| 11 | **ADAMS Center 2026 PDF** `https://adamscenter.org/wp-content/uploads/2026/02/ADAMS-Prayer-Times-2026.pdf` | USA / Northern Virginia | direct-mosque-PDF | 4 | 2 | 1.2 MB PDF. Annual transcription. Covers Sterling VA / DMV-area Hanafi Deobandi following ISNA-aligned + Hanafi Asr practice. Sample for Dearborn override extension. |
| 12 | **Birmingham Central Mosque** `https://centralmosque.org.uk/wp-json/wp/v2/pages/30` | UK / Birmingham | WP-JSON | 4 | 2 | WordPress with Divi shortcodes embedding prayer times. Page payload >100KB, prayer table is in `[et_pb_row]` markup. Can be extracted but messy. |
| 13 | **Diyanet zone-by-zone for Pakistan** `ezanvakti.emushaf.net/ilceler/792` (28 districts) | Pakistan (28 cities including Karachi/Lahore/Islamabad/Faisalabad) | institutional-API-as-Diyanet | 1 | 2 | Same caveat as #10 — Diyanet-method dispatched, not Auqaf-Pakistan. Useful only as a *third* calc-vs-calc reference for Karachi 18°/18° verification. |
| 14 | **Diyanet zone-by-zone for Bangladesh** `ezanvakti.emushaf.net/ilceler/661` (4 districts: Dhaka, Khulna, Comilla, Rajshahi) | Bangladesh | institutional-API-as-Diyanet | 1 | 2 | Same caveat. |
| 15 | **Diyanet zone-by-zone for Indonesia** `ezanvakti.emushaf.net/ilceler/693` (52 districts) | Indonesia | institutional-API-as-Diyanet | 1 | 2 | Compare against #1 (myQuran/KEMENAG) for diaspora vs. local divergence. Useful holdout cross-check; not a substitute. |
| 16 | **Diyanet zone-by-zone for Nigeria** `ezanvakti.emushaf.net/ilceler/786` (28 districts) | Nigeria | institutional-API-as-Diyanet | 1 | 2 | Lagos / Abuja / Kano / Kaduna / Ibadan / Sokoto-area zones. Caveat: Diyanet-method, not local Maliki/Hanafi practice. |
| 17 | **Diyanet zone-by-zone for Egypt** `ezanvakti.emushaf.net/ilceler/776` (23 districts) | Egypt | institutional-API-as-Diyanet | 1 | 1 | Same caveat. Mostly redundant with #4. |
| 18 | **moonsighting.com Hijri month tables** `https://moonsighting.com/{HHHH}{mon3}.html` (per Hijri month/year) | UK + worldwide moonsighting | astronomical | 4 | 1 | Already informally folded into MoonsightingCommittee Aladhan method=15. Limited additional ratchet leverage. |
| 19 | **muwaqqit.com astronomical calculator** `https://www.muwaqqit.com/?lt=...&ln=...` | global (calc-vs-calc) | calc-website | 4 | 1 | Felix Suckert's astronomy-grade prayer-time calculator. Covers high-latitude / unusual cases. Supplementary cross-reference, not institutional. |
| 20 | **Iranian community `prayertime.ir`** WordPress | Iran | community-aggregator | 4 | 2 | Accessible from outside Iran (unlike `time.ir`/`razavi.ir` which are geo-blocked). WordPress-driven; would require shortcode reverse-engineering. |

---

## 3. Mosque-app aggregator alternatives summary

| Aggregator | URL | Open API? | Coverage | Terms / Fiqh-accessibility flag |
|---|---|---|---|---|
| **AlAdhan** (already integrated) | `aladhan.com` | Yes (`api.aladhan.com/v1/...`) | 24 named methods + custom 99; 168 countries | Permissive, MIT-spirit. Calc-vs-calc; not institutional. Already fajr's primary holdout. |
| **myQuran** (NEW) | `api.myquran.com/v2/sholat/...` | Yes, no auth | Indonesia 518 kabupaten/kota | Community wrapper of KEMENAG. Free, no rate-limit observed. |
| **WaktuSolat** (already integrated) | `api.waktusolat.app` | Yes | Malaysia 60 zones (14 negeri) | Community wrapper of JAKIM e-Solat. Free, MIT licensed. |
| **ezanvakti.emushaf.net** (already integrated for Türkiye) | `ezanvakti.emushaf.net` | Yes, no auth | 204 countries (Diyanet International dispatch) | Furkan Tektas community-mirrors Diyanet. Free. |
| **api.muftyat.kz** (NEW) | `api.muftyat.kz` | Yes, no auth | Kazakhstan 5,695 cities | KMDB / Muslim Board of Kazakhstan official. Free. |
| **SalahTimes** | `salahtimes.com` | No public API found (probed `/api/v1/...`, `/_api/`, `/developers` — all 404) | 182 countries claimed | Web-only; no scrapable API; not a candidate. |
| **IslamicFinder mosque-finder** | `islamicfinder.org/mosques/` | API exists but unauthenticated probes return Adpushup-injected HTML (no JSON); historical `api.islamicfinder.org/mosque/api/v1.0/...` was 000 in audit | Worldwide claimed | Heavily ad-monetised; ToS unclear. fajr already references for IF prayer cross-check; mosque-list is gated. |
| **MuslimPro** | `muslimpro.com` | `muslimpro.com/api/v1/prayer/times` returns 404; partner program required | Worldwide | Commercial; ToS prohibits public API consumption without partner agreement. **Not a fajr candidate.** |
| **Halal Trip** | `halaltrip.com/prayertime/` | WAF (403); audit attempts blocked | Global | WAF-blocked. Likely scrape-prohibited. |
| **Salatomatic** | `salatomatic.com` | SPA (all routes return same page); no API discovered | Global mosque directory | Mosque-locator only; no daily prayer-times API. |
| **MosqueFinder.io / MosqueLocator** | `mosquefinder.com` | TLS-failed (000) | Global mosque directory | Site dead. |
| **Bayan Foundation** | `bayan-foundation.com` | TLS-failed (000) | Mosque directory | Site dead. |
| **AthanPro / IslamiCity** | various | No public API | Global | Commercial / closed. |

**Summary:** the only viable aggregator additions beyond what fajr already
integrates are **myQuran** (Indonesia) and **api.muftyat.kz** (Kazakhstan).
SalahTimes/IslamicFinder/MuslimPro are dead-ends for programmatic access and
also carry licensing risk. Mosque-finder directories like Salatomatic exist
but provide *location* not *prayer times* — useful for OSM mosque-locator
verification but not for ground-truth fixtures.

---

## 4. Top 5 country deep-dives

These are the worst-coverage countries with high Muslim populations
(Indonesia/Pakistan/Bangladesh/Egypt/Nigeria), with concrete next moves.

### 4.1 Indonesia (~230M Muslims, 1 Mawaqit slug, 73,256 OSM mosques)

The largest gap closing in this audit. **Three concrete moves:**

- **Move A1 (highest-leverage):** Add `scripts/fetch-myquran.js` that pulls
  daily prayer-time JSON from `api.myquran.com/v2/sholat/jadwal/{id}/{YYYY}/{MM}`
  for ~10–15 high-population kabupaten (Jakarta, Bandung, Surabaya, Medan,
  Makassar, Semarang, Palembang, Tangerang, Bekasi, Depok, Padang, Bogor) →
  emit `eval/data/test/kemenag-myquran.json`. Effort: ~1 day. Effect: closes
  KEMENAG dead-end documented in `calibration-recipe.md`.
- **Move A2 (medium-leverage):** Compare myQuran (KEMENAG) output against the
  existing 1054-entry KEMENAG holdout to verify they reflect the same
  upstream data; this is a sanity check on community-wrapper fidelity. If
  they match within ~30 sec, consider promoting myQuran-Indonesia to the
  *train* corpus for a Path A KEMENAG calibration on Bandung (3.44 min) and
  Pekanbaru (2.87 min) — both flagged in `calibration-recipe.md` as v1.8.0+
  candidates.
- **Move A3 (low-leverage):** Sample Diyanet International ezanvakti for
  Indonesia (52 districts) and compare against myQuran/KEMENAG. The
  Diyanet-method-vs-KEMENAG delta is itself a holdout signal for the
  diaspora-vs-local-authority gap that fajr does not currently surface.

### 4.2 Pakistan (~240M Muslims, 3 Mawaqit slugs, 8,113 OSM mosques)

Worst coverage relative to population. **Three moves:**

- **Move B1:** Pakistan has *no* native scriptable institutional channel.
  `mora.gov.pk` (Federal Ministry), `awqaf.gop.pk` (federal Auqaf),
  `auqaf.gop.pk` (Punjab), `pakhilal.com`, and `uok.edu.pk` (University of
  Islamic Sciences Karachi) all returned 000 (TLS-failed) or DEAD in
  audit. The realistic short-term path is **Aladhan method=1 (Karachi
  18°/18°)** as already done, but expand the *city corpus*: add Lahore,
  Islamabad, Faisalabad, Hyderabad, Multan, Peshawar, Rawalpindi explicitly to
  `eval/data/train/aladhan-pakistan.json` instead of relying on country-default
  dispatch alone.
- **Move B2:** Use Diyanet ezanvakti `/ilceler/792` (28 districts) as a
  third cross-reference. The 28 districts include Karachi/Lahore/Islamabad/
  Faisalabad/Multan/Rawalpindi/Peshawar — but the data dispatched is the
  Diyanet 18°/17° method, NOT the Karachi 18°/18° Pakistani institutional
  default. So this is calc-vs-calc with a different angle table; useful for
  surfacing the angle-disagreement.
- **Move B3 (long-term):** Reach out via fajr-agent issue tracker to the
  Pakistan Hilal Committee (`pakhilal.gov.pk` if it ever responds) or AIMPLB-
  Pakistan equivalent and request institutional Imsakiyya. This is research
  + outreach, not autoresearch loop.

### 4.3 Bangladesh (~150M Muslims, 3 Mawaqit slugs, 12,137 OSM mosques)

- **Move C1:** Islamic Foundation Bangladesh (`islamicfoundation.gov.bd`)
  is a Bengali-language Inertia-style SPA. The audit fetched the home page
  successfully (HTTP 200, ~96 KB) but no prayer-time / sehri-iftar page is
  surfaced from the static HTML. The IFB *publishes* daily Imsakiyya — likely
  via PDFs uploaded to `/pages/files/...` (the audit found ~25 such file IDs).
  Manual transcription of the annual IFB Imsakiyya PDF would close
  Bangladesh, but this is high-effort.
- **Move C2:** Diyanet ezanvakti `/ilceler/661` covers Dhaka, Khulna, Comilla,
  Rajshahi (4 districts) using Diyanet method. Useful as a third cross-reference
  but not a substitute for IFB.
- **Move C3 (medium-term):** Reach out via cross-repo issue to BD-tech
  community for a myQuran-equivalent BD wrapper. The Inertia-React stack of
  IFB suggests they could expose JSON via `Inertia` page-data — would require
  a specific page URL.

### 4.4 Egypt (~110M Muslims, 3 Mawaqit slugs, 2,162 OSM mosques)

The **biggest train-residual win** in this audit.

- **Move D1 (highest-priority):** Add `scripts/fetch-esa-egypt.js` that
  performs the ASP.NET VIEWSTATE/EVENTVALIDATION dance on
  `http://www.esa.gov.eg/praytimes.aspx`. POST a city Arabic-name (e.g.
  `القـاهـرة` for Cairo, `الأسكندرية` for Alexandria) to fetch the monthly
  table. Parse the embedded HTML table to emit `eval/data/train/esa-egypt.json`
  with Cairo + Alexandria + Tanta + Luxor + Aswan + Hurghada (6 cities). **This is the
  Path A target for `calibration-recipe.md → Cairo/Alexandria 6.5 min Fajr` —
  the largest train residual.** Effort: ~2–3 days for the VIEWSTATE
  scraper.
- **Move D2:** Compare ESA against Aladhan method=5 (Egyptian) over the 6
  cities to estimate Path A bias. Likely the ESA values diverge from
  Aladhan's reproduction of Egyptian 19.5°/17.5° — exactly as Mawaqit-Morocco
  diverged from Aladhan-Morocco in v1.5.0.
- **Move D3:** Add Dar al-Ifta (`dar-alifta.org` — TLS-failed) and Al-Azhar
  (`azhar.eg` — accessible) as background institutional context, but ESA
  is the operational source.

### 4.5 Nigeria (~110M Muslims, 3 Mawaqit slugs, 620 OSM mosques)

Lowest OSM density relative to population — Nigeria's mosque tagging is
significantly under-represented in OSM compared to neighbouring Niger
(1,108) and Ghana (1,102). **Three moves:**

- **Move E1:** No native scriptable channel. NSCIA publishes only
  moonsighting fatwas. Sultanate of Sokoto (`sokotostate.gov.ng`) has the
  page accessible but no prayer-time URL discovered.
- **Move E2:** Diyanet ezanvakti `/ilceler/786` (28 districts: Lagos / Abuja
  / Kano / Kaduna / Ibadan / Sokoto / Maiduguri / Benin City / Calabar /
  Enugu / Aba etc.) provides Diyanet-method dispatch for these 28 cities.
  This is the only structured option short-term — even though it's
  Diyanet-method (not Maliki-Sokoto or Hanafi-Kano) it gives per-city
  ground truth in a country where fajr currently has only 3 Mawaqit slugs.
- **Move E3:** Fill a `node:script/fetch-overpass-mosques.js` companion
  script that queries Overpass for `name=*` mosques in Lagos/Kano/Abuja
  metros to populate iconic_wishlist with NSCIA-affiliated mosques. The
  audit found Lagos central has only 2 OSM-named mosques within 5 km
  (Olountooba and Olountoba Central) — Nigerian OSM tagging is sparse;
  this is itself a contribution opportunity.

---

## 5. Recommended next batch for the autoresearch loop

Highest value/effort ratio for ≤1 week of work each:

1. **`scripts/fetch-myquran.js`** — Indonesia/KEMENAG via myQuran wrapper.
   Effort 1; Value 5. Single-day implementation; closes `iconic_wishlist[Istiqlal]`
   and `calibration-recipe.md → Indonesia` dead-end. **Highest-leverage.**

2. **`scripts/fetch-mora-brunei.js`** — Brunei via SharePoint OData REST.
   Effort 1; Value 4. Single-day implementation; closes
   `iconic_wishlist[Sultan Omar Ali Saifuddien]` and adds Brunei to the train
   corpus (it's currently 0 slugs).

3. **`scripts/fetch-habous-morocco.js`** — Morocco Habous direct PHP API.
   Effort 2; Value 4. Diversifies the v1.5.0 Mawaqit-Morocco Path A
   corpus by adding the *ministerial* reference behind the published
   mosques, allowing detection of mosque-vs-ministry divergence.

4. **`scripts/fetch-esa-egypt.js`** — Egypt General Authority of Survey via
   ASP.NET VIEWSTATE scraper. Effort 3; Value 5. Closes the **largest train
   residual in the v1.7.19 corpus** (Cairo/Alexandria 6.5 min Fajr) via Path
   A calibration. Highest engineering effort but highest impact.

5. **`scripts/fetch-muftyat-kz.js`** — Kazakhstan KMDB API. Effort 1; Value 3.
   Single-day implementation; gives full Central Asia institutional reach
   (KZ has 1,243 OSM mosques and currently 0 Mawaqit slugs).

These five together would:
- Close **2 of 3 documented dead-ends** in `calibration-recipe.md`
- Close **3 of 22 iconic_wishlist** entries (Istiqlal, Sultan Omar Ali Saifuddien,
  + raise possibility of Al-Azhar via ESA-Cairo proxy)
- **Reduce train WMAE residual by an estimated 0.3–0.5 min** via the Egypt Path A
  alone (matching the v1.5.0 Morocco precedent: Mawaqit-Morocco Maghrib bias
  closed −5.57 → −0.57; ESA-Egypt Fajr bias estimated similar magnitude)
- Add **~1,000 new train cells** across Indonesia (12 cities × 31 days) +
  Brunei (1 × 31) + Morocco-Habous (10 × 31) + Egypt (6 × 31) + Kazakhstan
  (5 × 31) = ~1080 cells, more than tripling the existing 215 institutional
  train cell count.

**Suggested ordering:** 1 → 2 → 5 (three single-day effort 1s before the
multi-day effort 3 ESA scraper) → 3 → 4. Serialize per
`feedback_serialize_engine_edits` — each fetcher lands as its own PR, eval is
re-run only after the test fixture lands and Path A targeting is proposed.

---

## Appendix A — channel access matrix for follow-up

Channels probed but not actionable in the recommended batch (NOT-PROBED, DEAD,
WAF-403, MOBILE-GATED, PDF-ONLY) — recorded for future audit cycles:

| Source | Country | URL probed | Access status | Path forward |
|---|---|---|---|---|
| Saudi Hajj Ministry Imsakiyya | Saudi Arabia | `haj.gov.sa/en/imsakiyya` | OPEN-page (78KB HTML); body has no daily-prayer JSON | Manual PDF transcription (annual) |
| Saudi General Presidency Two Holy Mosques | Saudi Arabia | `gph.gov.sa` | TLS error (000) | Retry from non-US IP; potentially IP-geofenced |
| Saudi `prayertimes.gov.sa` | Saudi Arabia | (000) | TLS / DNS dead | None |
| IACAD UAE Dulook | UAE | `iacad.gov.ae/en/services/prayertimes` | Redirect → 404 | Mobile app reverse-engineering |
| UAE awqaf.gov.ae | UAE | SPA backed by `mobileappapi.awqaf.gov.ae/APIS/` | Auth tokens required | Document API call from mobile app |
| MUIS Singapore | Singapore | `muis.gov.sg/Resources/Prayer-Times` | 404 (page renamed) + WAF-403 on alternates | data.gov.sg requires AWS API key; document path |
| Dar al-Ifta Egypt | Egypt | `dar-alifta.org.eg` | TLS error / timeout | Retry; alternate `dar-alifta.com` may be live |
| Egypt Awqaf Online | Egypt | `awkafonline.com` | WAF-403 | Document; consider Wayback fallback |
| Pakistan Hilal Committee | Pakistan | `pakhilal.gov.pk` | TLS dead | Outreach via fajr issue tracker |
| Pakistan Auqaf federal/provincial | Pakistan | `mora.gov.pk` / `awqaf.gop.pk` / `auqaf.gop.pk` | TLS errors | Outreach |
| University of Islamic Sciences Karachi | Pakistan | `uok.edu.pk` | TLS error | Outreach |
| Tehran Geophysics direct | Iran | `ut.ac.ir` and `earthquake.ut.ac.ir` | Cloudflare geo-block ("transferring to website") | Geo-relay or institutional IP |
| Astan Quds Razavi | Iran | `razavi.ir` / `aqr.razavi.ir` | Cloudflare geo-block | Same |
| Iran time.ir | Iran | `time.ir` | TLS error | Same |
| Algeria MARW | Algeria | `marw.dz` | HTML accessible, no daily-prayer page found | Re-probe with explicit prayer-time URL guess |
| Tunisia Diwan al-Awqaf | Tunisia | `affaires-religieuses.tn` | TLS error / 000 | Retry |
| Iraqi Sunni Awqaf Diwan | Iraq | `sunni.gov.iq` | TLS error (000) | Retry; Wayback fallback |
| Iraqi Shia Awqaf Diwan | Iraq | `shia.gov.iq` | TLS error (000) | Retry |
| Yemen Al-Iman | Yemen | `iman.ye` | TLS error | Retry |
| Sudan Dar al-Ifta | Sudan | `darulifta.sd` | TLS error | Retry |
| BAKWATA Tanzania | Tanzania | `bakwata.or.tz` | OPEN-Inertia-SPA, no daily-prayer route surfaced | Inspect Inertia page-data on `/jadwal` or `/wakti-sala` |
| UMSC Uganda | Uganda | `umsc.or.ug` | OPEN HTML, no prayer-time page surfaced | Inspect specific sub-paths |
| Mali HCIM | Mali | `hcim.org` | OPEN HTML, no prayer-time page found | Inspect |
| Senegal Tijaniyya | Senegal | `tidjaniya.com` | OPEN WordPress, no daily prayer endpoint | Inspect WP-JSON pages |
| Senegal Mouride Touba | Senegal | `toubacityorg.org` / `touba.sn` | Both DEAD (000) | Outreach |
| KMSh Albania | Albania | `kmsh.al` | OPEN HTML, no prayer-time endpoint surfaced | Inspect specific routes |
| DUMRF Russia | Russia | `dumrf.ru` | OPEN HTML, prayer references but no daily endpoint surfaced | Inspect `/img/namaz/05.jpg` (likely a static infographic) |
| Council of Muftis Russia | Russia | `muslim.ru` | OPEN, no prayer-time endpoint surfaced | Cross-reference with Tatarstan CSV |
| DUM Dagestan | Russia / Dagestan | `muftiyatrd.ru` | OPEN, no daily prayer endpoint | Inspect |
| DUM Uzbekistan | Uzbekistan | `muslim.uz/c/prayer` | HTML accessible (1.6MB), no API | Find embedded prayer table or API URL |
| AIMPLB India | India | `aimplb.org` | TLS dead | Retry; Wayback |
| Hilal Committee India | India | `hilalcommittee.in` | DEAD (000) | None |
| Darul Uloom Deoband | India | `darululoom-deoband.com` | OPEN minimal HTML (182 bytes — likely down) | Retry |
| NCMF Philippines | Philippines | `ncmf.gov.ph` | WAF-403 | None for now |
| BDI BARMM | Philippines | `bdi.bangsamoro.gov.ph` | "Under Construction" page | Re-probe in 1–3 months |
| ANIC Australia | Australia | `anic.org.au` | OPEN news content; no daily prayer endpoint | None |
| AFIC | Australia | `afic.com.au` | TLS error | Retry |
| ICV Sanity.io CMS | Australia / Victoria | `erp2sbpv.api.sanity.io` | OPEN but `_type==prayerTime` returns empty | Find correct schema name |
| ICNSW | Australia / NSW | `icnsw.org.au` | OPEN WordPress, no daily prayer page | Inspect |
| Crescent Observers SA | South Africa | `crescentobservers.co.za` / `.org.za` | DEAD (000) | None |
| Saudi `masaajid.gov.sa` | Saudi Arabia | (000) | DEAD | None |

---

## Appendix B — fajr-agent observations on the methodology

1. **The ratchet's "3 dead-ends" framing in `calibration-recipe.md` is now
   stale.** This audit unblocks 2 of 3 (KEMENAG via myQuran, Brunei via
   OData) and finds the third (Egypt GAS) is actually OPEN-VIEWSTATE.
   Updating that section after the next release would help the
   custodian-agent's audit.

2. **OSM mosque counts vary wildly with national tagging culture, NOT with
   actual mosque density.** Nigeria has 110M Muslims and 620 OSM mosques;
   Niger has 22M Muslims and 1,108 OSM mosques. This makes OSM density a
   poor proxy for institutional opportunity and a misleading priority signal
   if used naively. The matrix in §1 weights priority by Muslim population
   and Mawaqit-slug count, NOT by raw OSM count.

3. **Diyanet International (ezanvakti.emushaf.net) is structurally
   diaspora-method-as-published**, not local-authority. The 204-country reach
   is impressive but should NOT be promoted to *train* corpus for non-Türkiye
   countries — only to *holdout* as a third cross-reference. Treating Diyanet's
   18°/17° Pakistan dispatch as Pakistani-institutional ground truth would
   silently flatten the Karachi 18°/18° vs Diyanet 18°/17° angle ikhtilaf,
   which is exactly what `feedback_surface_disagreement` warns against.

4. **Aladhan method coverage is denser than expected** — 23 named methods
   covering all major institutional dispatches plus a custom 99 method.
   Adding new institutional channels like ESA-Egypt is valuable not because
   Aladhan doesn't have an Egyptian method (it does, method=5), but because
   ESA publishes the *actual minute-rounded* table that Egyptian mosques
   follow, including any Path A offsets that Aladhan's pure-angle calculation
   doesn't reproduce. This is the same logic that motivated v1.5.0
   Mawaqit-Morocco over Aladhan method=21.

5. **Habous Morocco does not publish Asr** — only Fajr/Sunrise/Dhuhr/Maghrib/Isha.
   Maliki tradition computes Asr via shadow-ratio at the muezzin's discretion
   rather than a centrally-fixed minute. fajr should keep Asr from the
   adhan.js calculation when integrating Habous.

6. **The MJC South Africa "perpetual" table is unusually rich** — 9
   columns including dual-Asr and dual-Isha (Shafi/Hanafi). This is the
   richest Asr-school dual-publication source found in the audit and
   would directly serve the `applied.asrSchool` vs `location.asrConvention`
   issue #40 design work. Even with stale 2021–2022 dates, the seasonal
   pattern is solar-derived and re-usable for current calendar years
   with sub-2-min calibration drift.

---

— fajr-claude
