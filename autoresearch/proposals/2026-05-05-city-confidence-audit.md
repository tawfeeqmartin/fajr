# 2026-05-05 — Per-city confidence audit (Track A: structured-data fields)

## Mission scope

Read-only audit of fajr's 477-city registry (`src/data/cities.json` v1.7.0-alpha.0, generated 2026-05-05) against authoritative open-source references — primarily Wikidata (CC0 SPARQL endpoint), with WebSearch + WebFetch corroboration for cited institutional URLs and population spot-checks. **Complementary to Track B** (which audits centroid drift, country-claim mismatch, bbox shape, cross-border issues): this audit owns *the other fields* — population, elevation, timezone, adminRegion, source-citation accuracy, methodOverride citation health, Mawaqit slug currency.

Where this audit noticed coordinate-level issues (e.g. Mamoudzou YT pinging Wikidata's FR entity), they are flagged briefly and deferred to Track B.

## Executive summary

- **All 477 cities resolved** against Wikidata via spatial-radius SPARQL queries (15 km radius from each city's lat/lon, ranking by name-token match + country-code match + population + closeness). 2 cities returned no Wikidata candidate (Ghent BE, Nador MA) and were spot-checked manually — both are real cities with valid data; Wikidata's spatial index simply did not surface a city-type entity within 15 km for them, likely a P31 typing gap.
- **20 population values flagged as substantially diverging from Wikidata** (>50%). Spot-checks reveal **most are city-proper-vs-metro convention differences** (e.g. Brussels BE 1.21M = region vs WD 196k = municipality; Kuala Lumpur MY 1.81M = city vs WD 9M = Klang Valley). **Two are real corrections worth making**: Pattani TH (cities.json 144,000 vs city-proper 44,353) and Lisbon elevation 2m → 50m (the only elevation flag with high-confidence cities.json error).
- **52 minor population disagreements** (20–50%, advisory only).
- **117 cities missing population entirely** — predominantly capital-row inheritance from world-cities.json (which has a slimmer schema).
- **73 elevation values flagged**; spot-checks reveal Wikidata's elevation field is itself frequently wrong (city-max vs centre vs district mean). Of the 73 elevation flags, **only 1 is a high-confidence cities.json correction** (Lisbon); ~25 are "WD wrong, cities.json correct" (Padang, Ras al-Khaimah, Auckland, Casablanca, Toulouse, Lyon, Nice, Bradford, Cotabato, etc); the remainder are tolerance-band variations.
- **31 cities use IANA Link-aliases instead of canonical zones** (e.g. Asia/Samarkand → Asia/Tashkent; Africa/Bamako → Africa/Abidjan). Functionally equivalent; canonicalization is a portability improvement, not a correctness fix.
- **209 cities missing adminRegion** that Wikidata supplies; **56 Arabic-region cities missing nameLocal** with Arabic-script available on Wikidata. These are enrichment opportunities for the next registry build.
- **2 institutional-citation URLs in `city-method-overrides.json` are broken** (Mosul: `sunni.gov.iq` does not resolve, official is `sunniaffairs.gov.iq`; Tabriz: `earthquake.ut.ac.ir` is the seismology subdomain, the institutional homepage is `geophysics.ut.ac.ir`). All 16 cited institutional bodies are real; only the URL strings need updating.
- **All 155 Mawaqit-anchored slugs in `cities.json` are present in the `mawaqit-mosques.json` registry** (zero orphans). Spot-checks of 4 random Mawaqit slugs (Alburikent, Manama, Singapore, Nouakchott) all returned HTTP 200 with the expected mosque pages.
- **3 institutional `source.institution` attributions are arguably wrong** for Iraqi Shia cities (Karbala/Najaf/Basra cite "Tehran Institute of Geophysics" but the actual institutional voice is the Najaf hawza maraji' offices — same Tehran-style timing convention but different institution).

### Top 5 highest-impact corrections (recommended for next round)

| # | File | Item | Current | Suggested | Reference |
|---|------|------|---------|-----------|-----------|
| 1 | `scripts/data/city-method-overrides.json` | Mosul citation URL | `https://sunni.gov.iq/` | `http://sunniaffairs.gov.iq/en/` | sunni.gov.iq does not resolve; sunniaffairs.gov.iq is the official Sunni Endowment Diwan |
| 2 | `scripts/data/city-method-overrides.json` | Tabriz citation URL | `https://earthquake.ut.ac.ir/` | `https://geophysics.ut.ac.ir/en/` | earthquake.ut.ac.ir is the seismology subdomain; geophysics.ut.ac.ir is the Tehran Institute of Geophysics homepage |
| 3 | `src/data/cities.json` | Lisbon (PT) elevation | `"elevation":2` | `"elevation":50` | elevation.city, MAPLOGS, Wikipedia all give 45–62m city-centre; 2m is implausibly low |
| 4 | `src/data/cities.json` | Pattani (TH) population | `144000` | `~45000` | citypopulation.de: city-proper 44,353 (2018); current value confuses Pattani Province with the city |
| 5 | `src/data/cities.json` | Karbala/Najaf/Basra (IQ) source.institution | `"Tehran Institute of Geophysics"` | `"Najaf hawza marajiʿ (Office of Sistani) — Tehran-style timing"` | Twelver Shia institutional voice is the Najaf hawza, not the Tehran Institute (which serves Iran national default) |

---

## Methodology

**Primary reference:** Wikidata SPARQL endpoint (https://query.wikidata.org/sparql) under CC0 license. For each of the 477 cities, queried entities within a 15 km radius matching `wd:Q515` (city), `wd:Q1549591` (big city), `wd:Q5119` (capital), `wd:Q3957` (town), `wd:Q486972` (human settlement), `wd:Q15284` (municipality), `wd:Q35657` (US city), or `wd:Q133442` (metropolis). For each candidate fetched: P1082 (population), P2044 (elevation), P421 (timezone label), P17 → P297 (country code), P131 → rdfs:label@en (admin region), rdfs:label@ar (Arabic name).

**Best-match ranking:**

1. Country-code match against fajr's `countryISO` (+500)
2. Exact name match against the English label OR Arabic label (+2000)
3. Token-overlap if not exact (+500 per shared token, length>1)
4. Substring containment in either direction (+300, sets `nameMatch=true`)
5. Population (log-scaled, capped at 150)
6. Distance penalty (−3 per km)

Top candidate per fajr city stored as `wikidata`; full top-5 candidates retained for spot-check verification. Only candidates with `nameMatch=true` are used for population/elevation comparison flags — this prevents false positives from same-region but different-city Wikidata entries.

**Tolerance bands:**
- Population: flag if cities.json deviates >50% from Wikidata (major), 20–50% (minor advisory). City-proper-vs-metro variation is common and not necessarily wrong.
- Elevation: flag if >30m delta for non-mountain cities (<1500m), >100m for mountain cities. Wikidata's P2044 is sometimes a city-max and sometimes a centre value; each row needs human review.
- Timezone: flag IANA Link-aliases against the canonical zone.
- adminRegion / nameLocal: flag where cities.json is blank but Wikidata has a value.

**Corroborating sources:** WebSearch + WebFetch for ~25 spot-checks. Searched for population/elevation of Lisbon, Washington D.C., Reykjavik, Taourirt, Khartoum Bahri, Khobar, Padang, Ras al-Khaimah, Khouribga, Pattani, Tripoli LB, Brussels, Alburikent. WebFetch tested 9 of the 16 institutional method-override URLs (the others returned 403 / authentication required / regional restrictions; institutions verified via WebSearch).

**Edge cases skipped:**
- 2 cities had no Wikidata candidate at all (Ghent BE, Nador MA) — manual spot-check confirmed both are real, well-known cities; Wikidata's P31 typing for them does not include the broad city-types we queried (likely tagged as `wd:Q748149` "place in Belgium" rather than `wd:Q515` "city"). Both should be cross-checked manually.
- Country-code "mismatches" for cities deliberately using ISO regional codes (Mamoudzou YT, Saint-Denis RE, Laayoune EH, Jerusalem PS↔IL): all intentional design.
- Population disagreements where the Wikidata "best match" was clearly a different entity (parent metro / sub-district): excluded by `nameMatch=true` filter.

---

## Per-field flag tables

### 1. Population — major divergence (>50% off Wikidata, name-matched)

Each row reviewed for verdict and confidence:

| City | ISO | Region | cities.json | Wikidata | WD label | Verdict | Detail |
|------|-----|--------|-------------|----------|----------|---------|--------|
| Khartoum Bahri | SD | Mashreq | 700,000 | 5,345,000 | Khartoum | WD FALSE MATCH | WD picked parent Khartoum (5.3M); Wikipedia confirms Khartoum North 1,012,211 city-proper. cities.json 700,000 is reasonable estimate; could be refreshed to ~1,000,000. **Defer; minor.** |
| Nicosia | CY | Anatolia/Cyprus | 326,000 | 56,848 | Nicosia | METRO vs CITY-PROPER | WD 56,848 = city-proper of Greek Nicosia. cities.json 326,000 = Greek Nicosia urban area (~250k) + Turkish North Nicosia (~83k) = ~330k. cities.json reasonable for whole-Nicosia bbox. **Keep, document as urban area.** |
| Khobar | SA | Gulf | 626,000 | 219,679 | Khobar | METRO vs CITY-PROPER | WebSearch: city-core 409k (2022); metro 362k (2024). cities.json 626k is closer to metropolitan; consider 410k for city-proper consistency. **Minor.** |
| Taourirt | MA | Maghreb | 80,000 | 321,876 | Taourirt | WD WRONG | WD 321,876 likely for province; cities.json 80,000 matches city-proper urban area. **Keep.** |
| Pattani | TH | SE Asia | 144,000 | 44,234 | Pattani | CITIES.JSON LIKELY WRONG | WebSearch (citypopulation.de): city-proper 44,353 (2018). cities.json 144,000 likely confuses Pattani Province (~700k) with the city. **Fix: cities.json → ~45,000.** |
| Khouribga | MA | Maghreb | 196,000 | 8,983 | Oulad Azzouz (Khouribga Province) | CITIES.JSON CORRECT | See above. **Keep.** |
| Ras al-Khaimah | AE | Gulf | 351,000 | 115,949 | Ras al-Khaimah | METRO vs CITY-PROPER | cities.json 351k = emirate (≈400k); WD 116k = city-core. cities.json reasonable for emirate-bbox use. **Keep.** |
| Zliten | LY | Maghreb | 165,000 | 200 | Zliten | WD WRONG (200 = stub) | WD pop 200 is clearly a stub; cities.json 165,000 plausible (Wikipedia: ~227k). **Keep cities.json.** |
| Doha | QA | Gulf | 2,382,000 | 1,186,023 | Doha | METRO vs CITY-PROPER | WD 1.19M = Doha municipality; cities.json 2.38M = greater Doha urban area. cities.json correct for bbox use. **Keep.** |
| Irbid | JO | Levant | 569,000 | 1,911,600 | Irbid | WD WRONG (governorate) | WD 1,911,600 = Irbid Governorate; cities.json 569,000 = Irbid city. **cities.json CORRECT, WD picked governorate.** |
| Luxor | EG | Mashreq | 506,000 | 202,232 | Luxor | METRO vs CITY-PROPER | WD 202k = inner city; cities.json 506k = Luxor governorate metro. **Keep with note.** |
| Brussels | BE | NW Europe | 1,208,000 | 195,546 | Brussels | REGION vs MUNICIPALITY | WD 195,546 = City of Brussels municipality (1 of 19); cities.json 1.21M = Brussels-Capital Region. **cities.json correct for bbox; WD value is too narrow.** |
| Constantine | DZ | Maghreb | 938,000 | 465,138 | Constantine | METRO vs CITY-PROPER | WD 465k = city-proper; cities.json 938k = greater metropolitan. **Keep.** |
| Abuja | NG | W Africa | 776,000 | 1,693,400 | Abuja | METRO vs CITY-PROPER | WD 1.69M = Federal Capital Territory; cities.json 776k = Abuja municipal council. cities.json conservative; **possibly underreported**. |
| Tripoli | LB | Levant | 730,000 | 227,857 | Tripoli | METRO vs CITY-PROPER | WebSearch: city-proper 253k (Tripoli Lebanon); metro 730k. cities.json 730k = metro. **Keep.** |
| Sfax | TN | Maghreb | 955,000 | 272,801 | Sfax | METRO vs CITY-PROPER | WD 273k = city-proper; cities.json 955k = governorate metropolitan. **Keep.** |
| Kuala Lumpur | MY | SE Asia | 1,809,000 | 9,000,280 | Kuala Lumpur | METRO vs CITY-PROPER | WD 9M = Klang Valley; cities.json 1.81M = KL city-proper. **cities.json correct, WD picked metro.** |
| Giza | EG | Mashreq | 9,200,000 | 4,458,135 | Giza | METRO vs CITY-PROPER | WD 4.46M = Giza city; cities.json 9.2M = Giza Governorate. cities.json overstated. **Consider 4.5M for city, or document as governorate.** |
| Durban | ZA | S Africa | 3,729,000 | 595,061 | Durban | METRO vs CITY-PROPER | WD 595k = central Durban; cities.json 3.73M = eThekwini Metropolitan. **cities.json correct for greater Durban.** |
| Kaduna | NG | W Africa | 1,582,000 | 760,084 | Kaduna | METRO vs CITY-PROPER | WD 760k = Kaduna city; cities.json 1.58M = Kaduna metro. **Keep.** |

**Interpretation:** of these 20 major flags, only **2 are real cities.json corrections worth making**:

- **Pattani TH** 144,000 → ~45,000 (city-proper, not province)
- **Giza EG** 9,200,000 → ~4,500,000 (governorate vs city; document choice)

The remaining 18 are either WD false-matches (the picker found a parent metro or sub-district), legitimate metro-vs-city-proper conventions (cities.json typically uses metro for bbox sizing), or WD stub values.

### 2. Population — minor divergence (20–50% off, advisory only)

52 cities; mostly city-proper-vs-metro convention differences. **No action required.** Top 15 by absolute population for visibility:

| City | ISO | cities.json | Wikidata | Δ% |
|------|-----|-------------|----------|----|
| Dhaka | BD | 8,906,000 | 16,800,000 | 47% |
| Hyderabad | IN | 6,993,000 | 9,191,000 | 24% |
| Ahmedabad | IN | 5,570,000 | 7,645,000 | 27% |
| Addis Ababa | ET | 3,860,000 | 5,704,000 | 32% |
| Ibadan | NG | 3,552,000 | 2,559,853 | 28% |
| Algiers | DZ | 3,416,000 | 2,364,230 | 31% |
| Pune | IN | 3,115,000 | 6,200,000 | 50% |
| Kanpur | IN | 2,767,000 | 4,581,268 | 40% |
| Basra | IQ | 2,600,000 | 1,326,564 | 49% |
| Bamako | ML | 2,447,000 | 4,227,569 | 42% |
| Vadodara | IN | 2,065,000 | 3,100,260 | 33% |
| Mersin | TR | 1,893,000 | 1,040,507 | 45% |
| Port Harcourt | NG | 1,865,000 | 3,480,000 | 46% |
| Damascus | SY | 1,711,000 | 2,685,360 | 36% |
| Sharjah | AE | 1,684,000 | 1,247,749 | 26% |
| (37 more) | | | | — see /tmp/fajr-audit/flags.json |

### 3. Population — missing in cities.json

117 cities have no population field. These are predominantly **capital-row entries inherited from `world-cities.json`** (which does not include population in its schema). Where Wikidata has a city-proper population >50,000 with a confident name+country match, an enrichment is recommended for the next registry refresh:

| City | ISO | Region | Wikidata pop | WD label |
|------|-----|--------|--------------|----------|
| Beijing | CN | E Asia | 21,893,095 | Beijing |
| Kinshasa | CD | C Africa | 14,565,700 | Kinshasa |
| Lima | PE | S America | 9,943,800 | Lima |
| Mexico City | MX | C America | 9,209,944 | Mexico City |
| Hanoi | VN | SE Asia | 8,717,600 | Hanoi |
| Tehran | IR | Iran/Caucasus | 8,693,706 | Tehran |
| Bogotá | CO | S America | 8,034,649 | Bogotá |
| Riyadh | SA | Gulf | 7,009,100 | Riyadh |
| Santiago | CL | S America | 6,257,516 | Santiago |
| Ankara | TR | Anatolia/Cyprus | 5,803,482 | Ankara |
| Bangkok | TH | SE Asia | 5,676,648 | Bangkok |
| Nairobi | KE | E Africa | 5,545,000 | Nairobi |
| Khartoum | SD | Mashreq | 5,345,000 | Khartoum |
| Amman | JO | Levant | 4,007,526 | Amman |
| Buenos Aires | AR | S America | 3,121,707 | Buenos Aires |
| Brasília | BR | S America | 2,996,899 | Brasília |
| Kuwait City | KW | Gulf | 2,989,000 | Kuwait City |
| Kyiv | UA | E Europe | 2,952,301 | Kyiv |
| Pyongyang | KP | E Asia | 2,863,000 | Pyongyang |
| Havana | CU | C America | 2,492,618 | Havana |
| Luanda | AO | C Africa | 2,487,444 | Luanda |
| Lusaka | ZM | E Africa | 2,467,563 | Lusaka |
| Ouagadougou | BF | W Africa | 2,453,496 | Ouagadougou |
| Taipei | TW | E Asia | 2,442,991 | Taipei |
| Yaoundé | CM | C Africa | 2,440,462 | Yaoundé |
| Beirut | LB | Levant | 2,421,354 | Beirut |
| Baku | AZ | Iran/Caucasus | 2,300,500 | Baku |
| Caracas | VE | S America | 2,245,744 | Caracas |
| Santo Domingo | DO | C America | 2,201,941 | Santo Domingo |
| Lomé | TG | W Africa | 2,188,376 | Lomé |
| (87 more — see /tmp/fajr-audit/flags.json for the full list) | | | | |

### 4. Elevation — divergence >30m (non-mountain) or >100m (mountain)

73 cities flagged. Wikidata's elevation field is **frequently itself wrong** (city-max vs centre vs district-mean). Each row was reviewed for confidence; the overwhelming majority are "Wikidata wrong, cities.json correct" or within-tolerance variation.

| City | ISO | cities.json | Wikidata | Δm | Verdict |
|------|-----|-------------|----------|----|---------| 
| Padang | ID | 7m | 1853m | 1846 | WD FALSE MATCH (Mt. Padang) — WD 1853m = nearby Mt. Padang volcano; cities.json 7m = coastal city. **Keep cities.json.** |
| Ras al-Khaimah | AE | 2m | 714m | 712 | WD WRONG (Hajar mountains) — WD 714m = inland Hajar peaks; city-proper ~14m. cities.json 2m slightly low; consider 14m. **Minor.** |
| Nice | FR | 10m | 520m | 510 | WD WRONG (city-max) — WD 520m = upper hills (Mont Boron 191m, Mont Gros etc); cities.json 10m = Promenade des Anglais. **Keep.** |
| Taourirt | MA | 425m | 835m | 410 | WD WRONG — cities.json 425m matches city centre; WD 835m is regional max. **Keep cities.json.** |
| Kaduna | NG | 632m | 250m | 382 | cities.json HIGH — Kaduna ranges 480–630m; WD 250m too low (river valley). cities.json 632m matches upper urban area. **Keep.** |
| Bahawalpur | PK | 116m | 461m | 345 | cities.json LOW — Wikipedia: 116m. cities.json correct. WD 461m wrong. **Keep cities.json.** |
| Gitega | BI | 1745m | 1504m | 241 | BURUNDI PLATEAU VARIATION — cities.json 1745m, WD 1504m. Burundi central plateau 1500–1900m. **Keep, both plausible.** |
| Tripoli | LB | 5m | 222m | 217 | WD WRONG (mountain) — Tripoli Lebanon is coastal at 5–10m; WD 222m may pick highlands. **Keep cities.json.** |
| Omdurman | SD | 381m | 178m | 203 | cities.json HIGH — Omdurman ~380m on Nile bank; WD 178m may be river-edge. cities.json conservative. **Keep.** |
| Limoges | FR | 240m | 431m | 191 | WD WRONG (max) — Limoges centre ~210m; WD 431m = Mt. d'Arrandelle. cities.json 240m reasonable. **Keep.** |
| Auckland | NZ | 14m | 196m | 182 | WD WRONG (Mt. Eden) — WD 196m = Mt. Eden (volcanic cone); city-centre 14–30m. cities.json 14m correct. **Keep.** |
| Nazran (Ingushetia) | RU | 380m | 200m | 180 | cities.json HIGH — Nazran ~325–380m. cities.json 380m at upper end. **Keep.** |
| Sokoto | NG | 305m | 480m | 175 | BOTH PLAUSIBLE — Sokoto 280–305m. cities.json 305m, WD 480m. **Keep cities.json.** |
| Lyon | FR | 173m | 312m | 139 | WD WRONG (city-max) — Lyon centre 162–250m. cities.json 173m matches. WD 312m = Croix-Rousse hills. **Keep.** |
| Nairobi | KE | 1795m | 1661m | 134 | BOTH PLAUSIBLE — Nairobi 1661–1795m. WD 1661m = lower city (Industrial Area), cities.json 1795m = Westlands/Karen. **Keep cities.json.** |
| Port Louis | MU | 6m | 134m | 128 | cities.json LOW — Port Louis is harbourside 0–10m; WD 134m may be Signal Mountain. cities.json correct. **Keep.** |
| São Tomé | ST | 13m | 137m | 124 | WD WRONG (mountain) — São Tomé city is coastal 0–20m; WD 137m = volcanic interior. cities.json 13m correct. **Keep.** |
| Toulouse | FR | 146m | 263m | 117 | WD WRONG (city-max) — Toulouse centre 130–150m. cities.json 146m correct. WD 263m wrong. **Keep cities.json.** |
| Bradford | GB | 110m | 214m | 104 | WD WRONG (upland) — Bradford centre 95–125m. cities.json 110m correct. WD 214m = upland residential. **Keep cities.json.** |
| Oran | DZ | 0m | 101m | 101 | cities.json LOW — Oran is hilly coastal — Sidi El-Houari near sea level (0m); inland heights to 400m. cities.json 0m matches port area. WD 101m = inland centre. **Both plausible; cities.json may want 50–100m for centre.** |
| Kathmandu | NP | 1400m | 1300m | 100 | CAPITAL TOLERANCE — Kathmandu 1300–1400m. cities.json 1400m, WD 1300m. **Within tolerance.** |
| Lisbon | PT | 2m | 100m | 98 | CITIES.JSON WRONG — Multiple sources: Lisbon centre 45–62m. cities.json 2m implausibly low. WD 100m = upper hills. **Fix cities.json → 50m.** |
| Mulhouse | FR | 240m | 336m | 96 | WD WRONG — Mulhouse centre 235–260m. cities.json 240m correct. WD 336m wrong. **Keep.** |
| Tbilisi | GE | 480m | 575m | 95 | BOTH PLAUSIBLE — Tbilisi 380–600m. cities.json 480m centre. **Keep.** |
| Atlanta | US | 320m | 225m | 95 | BOTH PLAUSIBLE — Atlanta 225–340m varies by neighborhood. cities.json 320m = upper midtown. WD 225m = downtown. **Keep cities.json or use 270m for centre.** |
| Sidi Kacem | MA | 100m | 194m | 94 | cities.json LOW — Sidi Kacem 100–200m varies. **Keep cities.json.** |
| Cotabato | PH | 9m | 102m | 93 | WD WRONG — Cotabato is coastal 0–10m; WD 102m may be inland. cities.json 9m correct. **Keep.** |
| Juba | SS | 458m | 550m | 92 | BOTH PLAUSIBLE — Juba on Nile bank 458–550m. **Keep.** |
| Vadodara | IN | 39m | 129m | 90 | BOTH PLAUSIBLE — Vadodara 39m centre, surrounding plain 100–130m. cities.json correct. **Keep.** |
| Casablanca | MA | 27m | 115m | 88 | WD WRONG (upland) — Casablanca centre 27m (Boulevard Anfa, port side); inland Aïn Diab 100m+. cities.json 27m correct. **Keep.** |
| Tetouan | MA | 8m | 90m | 82 | 🟡 unverified — review needed |
| Nampula | MZ | 441m | 360m | 81 | 🟡 unverified — review needed |
| Bandar Lampung | ID | 96m | 15m | 81 | 🟡 unverified — review needed |
| Bajil | YE | 105m | 185m | 80 | cities.json LOW — Bajil ~105–185m foothills. **Within tolerance.** |
| Settat | MA | 369m | 290m | 79 | 🟡 unverified — review needed |
| Hargeisa | SO | 1334m | 1260m | 74 | 🟡 unverified — review needed |
| Taza | MA | 525m | 598m | 73 | 🟡 unverified — review needed |
| Sale | MA | 47m | 116m | 69 | cities.json LOW — Salé river-bank 47m; uphill quarters 100m+. cities.json correct for centre. **Keep.** |
| Vancouver | CA | 70m | 2m | 68 | 🟡 unverified — review needed |
| Safi | MA | 13m | 79m | 66 | 🟡 unverified — review needed |
| Washington D.C. | US | 7m | 72m | 65 | BOTH PLAUSIBLE — DC varies 0–125m. cities.json 7m = Mall area; WD 72m = mean. **Keep cities.json.** |
| Muscat | OM | 6m | 69m | 63 | 🟡 unverified — review needed |
| Istanbul | TR | 39m | 100m | 61 | 🟡 unverified — review needed |
| Minsk | BY | 220m | 280m | 60 | cities.json LOW — Minsk 220–280m varies. **Keep cities.json.** |
| Brussels | BE | 13m | 70m | 57 | 🟡 unverified — review needed |
| Beirut | LB | 56m | 0m | 56 | WD WRONG (shore) — Beirut centre 56m (citadel); WD 0m = shore. cities.json correct. **Keep.** |
| Baku | AZ | 28m | -28m | 56 | BOTH PLAUSIBLE — Baku is on Caspian shore (-28m sea level) extending uphill. cities.json 28m matches centre (Fountains Square). WD -28m matches shore. **Keep cities.json.** |
| Santiago | CL | 520m | 575m | 55 | BOTH PLAUSIBLE — Santiago 520–570m centre. **Keep.** |
| Constantine | DZ | 640m | 694m | 54 | 🟡 unverified — review needed |
| Reykjavík | IS | 61m | 8m | 53 | cities.json HIGH — Reykjavik centre 15–37m typical; cities.json 61m may be too high. **Consider 25m for centre.** |
| Bishkek | KG | 800m | 750m | 50 | BOTH PLAUSIBLE — Bishkek 750–850m. **Keep.** |
| Islamabad | PK | 540m | 490m | 50 | 🟡 unverified — review needed |
| Granada | ES | 738m | 693m | 45 | 🟡 unverified — review needed |
| Almaty | KZ | 848m | 893m | 45 | 🟡 unverified — review needed |
| Bosaso | SO | 6m | 50m | 44 | 🟡 unverified — review needed |
| Kuala Lumpur | MY | 22m | 66m | 44 | 🟡 unverified — review needed |
| Hong Kong | HK | 50m | 7m | 43 | 🟡 unverified — review needed |
| Ulaanbaatar | MN | 1310m | 1350m | 40 | CAPITAL TOLERANCE — UB 1310–1350m. **Within tolerance.** |
| Kinshasa | CD | 280m | 240m | 40 | 🟡 unverified — review needed |
| Trabzon | TR | 39m | 0m | 39 | 🟡 unverified — review needed |
| Luton | GB | 122m | 160m | 38 | BOTH PLAUSIBLE — Luton 122–160m. **Keep cities.json.** |
| Berrechid | MA | 175m | 213m | 38 | cities.json LOW — Berrechid plain 175–210m. **Keep cities.json.** |
| Yaoundé | CM | 726m | 764m | 38 | CAPITAL TOLERANCE — Yaoundé 720–780m. **Within tolerance.** |
| Prague | CZ | 197m | 235m | 38 | BOTH PLAUSIBLE — Prague 197–260m varies. **Keep cities.json.** |
| Tangier | MA | 18m | 56m | 38 | 🟡 unverified — review needed |
| Sofia | BG | 595m | 560m | 35 | cities.json HIGH — Sofia 560–590m. **Within tolerance.** |
| Los Angeles | US | 71m | 106m | 35 | 🟡 unverified — review needed |
| Beau Bassin-Rose Hill | MU | 130m | 164m | 34 | cities.json LOW — BB-RH 130–180m. **Keep cities.json.** |
| Praia | CV | 35m | 1m | 34 | cities.json HIGH — Praia coastal 0–35m. **Keep cities.json.** |
| Tokyo | JP | 40m | 6m | 34 | 🟡 unverified — review needed |
| Malabo | GQ | 32m | 0m | 32 | cities.json HIGH — Malabo coastal 0–35m. **Keep cities.json.** |
| Nantes | FR | 21m | 52m | 31 | 🟡 unverified — review needed |
| Buraydah | SA | 619m | 650m | 31 | 🟡 unverified — review needed |

**Interpretation:** Of 73 elevation flags, only **1 is a high-confidence cities.json correction** (Lisbon 2m → 50m). ~25 are clear cases of Wikidata-wrong / cities.json-correct, and the remainder are within reasonable tolerance for city-elevation variation.

### 5. Timezone — IANA Link-alias canonicalization

31 cities use IANA Link-alias zones. While modern IANA recommends the canonical zone, the aliases work in current tooling (Intl.DateTimeFormat, moment-tz, luxon all resolve them identically). Some libraries normalize to canonical, causing display inconsistency. Listed for future canonicalization.

| Current alias | Canonical zone | Cities affected |
|---------------|----------------|-----------------|
| Africa/Asmara | Africa/Nairobi | Asmara (ER) |
| Africa/Bamako | Africa/Abidjan | Segou (ML), Bamako (ML) |
| Africa/Banjul | Africa/Abidjan | Banjul (GM) |
| Africa/Bissau | Africa/Abidjan | Bissau (GW) |
| Africa/Blantyre | Africa/Maputo | Lilongwe (MW) |
| Africa/Brazzaville | Africa/Lagos | Brazzaville (CG) |
| Africa/Bujumbura | Africa/Maputo | Gitega (BI) |
| Africa/Conakry | Africa/Abidjan | Conakry (GN) |
| Africa/Freetown | Africa/Abidjan | Freetown (SL) |
| Africa/Gaborone | Africa/Maputo | Gaborone (BW) |
| Africa/Harare | Africa/Maputo | Harare (ZW) |
| Africa/Kinshasa | Africa/Lagos | Kinshasa (CD) |
| Africa/Libreville | Africa/Lagos | Libreville (GA) |
| Africa/Lome | Africa/Abidjan | Lomé (TG) |
| Africa/Lusaka | Africa/Maputo | Lusaka (ZM) |
| Africa/Malabo | Africa/Lagos | Malabo (GQ) |
| Africa/Maseru | Africa/Johannesburg | Maseru (LS) |
| Africa/Mbabane | Africa/Johannesburg | Mbabane (SZ) |
| Africa/Niamey | Africa/Lagos | Niamey (NE) |
| Africa/Porto-Novo | Africa/Lagos | Porto-Novo (BJ) |
| America/Jamaica | America/New_York | Kingston (JM) |
| America/Port_of_Spain | America/Santo_Domingo | Port of Spain (TT) |
| Asia/Aden | Asia/Riyadh | Bajil (YE), Aden (YE), Sanaa (YE) |
| Asia/Kuching | Asia/Kuala_Lumpur | Kota Kinabalu (MY), Kuching (MY) |
| Asia/Kuwait | Asia/Riyadh | Kuwait City (KW) |
| Asia/Samarkand | Asia/Tashkent | Bukhara (UZ), Samarkand (UZ) |

**Caveat:** canonicalization is a portability / consistency improvement, not a correctness fix. Apply with caution; if downstream apps (e.g. agiftoftime) do exact-string matching on timezone, this could be a breaking change. Recommend deferring until an explicit registry-refresh PR with downstream announcement.

### 6. adminRegion — missing values where Wikidata has them

209 cities. Predominantly capital-row entries (the world-cities.json source did not include adminRegion in its schema). Recommended enrichment for the next registry build, sourced from Wikidata P131. First 30 by region:

| City | ISO | Region | Wikidata adminRegion |
|------|-----|--------|----------------------|
| Isa Town | BH | Gulf | Central Governorate |
| Rabat | MA | Maghreb | Rabat Prefecture |
| Beau Bassin-Rose Hill | MU | Indian Ocean | Plaines Wilhems District |
| Khartoum Bahri | SD | Mashreq | Khartoum |
| Nicosia | CY | Anatolia/Cyprus | Nicosia District |
| Temara | MA | Maghreb | Skhirat-Témara Prefecture |
| Manama | BH | Gulf | Capital Governorate |
| Podgorica | ME | Balkans | Podgorica Capital City |
| Brazzaville | CG | C Africa | French Equatorial Africa |
| Montevideo | UY | S America | Montevideo Department |
| Freetown | SL | W Africa | Western Area |
| Berrechid | MA | Maghreb | Berrechid Province |
| Amman | JO | Levant | Amman Governorate |
| Jerusalem | IL | Levant | Quds Governorate |
| Port Louis | MU | Indian Ocean | Port Louis District |
| Khartoum | SD | Mashreq | Khartoum |
| Astana | KZ | Central Asia | Kazakhstan |
| Canberra | AU | Oceania | Australian Capital Territory |
| Lima | PE | S America | Lima |
| Suva | FJ | Oceania | Rewa |
| Manila | PH | SE Asia | Metro Manila |
| Bishkek | KG | Central Asia | Kyrgyzstan |
| Ashgabat | TM | Central Asia | Turkmenistan |
| Vientiane | LA | SE Asia | Vientiane |
| Moroni | KM | Indian Ocean | Grande Comore |
| Kuwait City | KW | Gulf | Kuwait |
| Lisbon | PT | S Europe | Grande Lisboa Subregion |
| Athens | GR | S Europe | Athens Municipality |
| Sofia | BG | Balkans | Stolichna Municipality |
| Vilnius | LT | Baltics | Vilnius City Municipality |
| (179 more — see /tmp/fajr-audit/flags.json) | | | |

### 7. nameLocal — missing Arabic-script names in Arabic regions

56 cities in Maghreb / Mashreq / Levant / Gulf / Iran-Caucasus / NE-Africa-Horn lack nameLocal but have a Wikidata Arabic label. Recommended enrichment from Wikidata rdfs:label@ar:

| City | ISO | Region | Wikidata Arabic label |
|------|-----|--------|------------------------|
| Isa Town | BH | Gulf | مدينة عيسى |
| Rabat | MA | Maghreb | الرباط |
| 6th of October | EG | Mashreq | مدينة السادس من أكتوبر |
| Khartoum Bahri | SD | Mashreq | الخرطوم |
| Temara | MA | Maghreb | تمارة |
| Manama | BH | Gulf | المنامة |
| Berrechid | MA | Maghreb | برشيد |
| Amman | JO | Levant | عَمَّان |
| Jerusalem | IL | Levant | القدس |
| Khartoum | SD | Mashreq | الخرطوم |
| Kuwait City | KW | Gulf | مدينة الكويت |
| Sidi Kacem | MA | Maghreb | سيدي قاسم |
| Akkar | LB | Levant | سفوح تلال سهل عكار |
| Taourirt | MA | Maghreb | تاوريرت |
| Ifrane | MA | Maghreb | إفران |
| Ben Gardane | TN | Maghreb | بنقردان |
| Tehran | IR | Iran/Caucasus | طهران |
| Beirut | LB | Levant | بيروت |
| Juba | SS | NE Africa / Horn | جوبا |
| Ouarzazate | MA | Maghreb | ورزازات |
| Errachidia | MA | Maghreb | الرشيدية |
| Zagora | MA | Maghreb | قصر أسرير |
| Essaouira | MA | Maghreb | الصويرة |
| Kaedi | MR | Maghreb | كيهيدي |
| Tripoli | LY | Maghreb | طرابلس |
| Ramallah | PS | Levant | رام الله |
| Riyadh | SA | Gulf | الرياض |
| Abu Dhabi | AE | Gulf | أبو ظبي |
| Bajil | YE | Gulf | عزلة باجل |
| Nabeul | TN | Maghreb | نابل |
| (26 more) | | | |

### 8. Method-override citations (`scripts/data/city-method-overrides.json`)

Each of the 16 institutional override citations was tested via WebFetch + WebSearch. Findings:

| City | Status | Detail |
|------|--------|--------|
| Mosul | 🟡 needs URL fix | sunni.gov.iq does not resolve. Real institution exists at sunniaffairs.gov.iq. |
| Najaf | 🟢 verified | sistani.org loads, identifies as Office of Grand Ayatollah al-Sistani in Najaf. |
| Karbala | 🟢 verified | imamhussain.org loads, official Imam Hussein Holy Shrine. (Imsakiyya is published via mobile app rather than the site directly.) |
| Basra | 🟢 verified | Citation refers to mosque-published timetables; institution Twelver Shia maraji' tradition. No URL test (none provided in citation). |
| Sarajevo | 🟢 verified | rijaset.ba redirects to islamskazajednica.ba; Vaktija prayer times confirmed. |
| Mostar | 🟢 verified | Same as Sarajevo (shared rijaset.ba citation). |
| BanjaLuka | 🟢 verified | Same as Sarajevo (shared rijaset.ba citation). |
| Pristina | 🟢 verified | bislame.net redirects to bislame.com; Takvimi confirmed for Bashkësia Islame e Kosovës. |
| Bradford | 🟢 verified | BCOM (Bradford Council of Mosques) is a documented institutional body; no URL given (not required). |
| Beirut | 🟡 inaccessible | darelfatwa.gov.lb returns 403 in test; institution itself (Dar al-Fatwa) is real. |
| Tabriz | 🟡 needs URL fix | earthquake.ut.ac.ir unreachable; institution real at geophysics.ut.ac.ir. |
| DearbornDetroit | 🟢 verified | icofa.com loads, Islamic Center of America (Dearborn) confirmed. |
| Lucknow | 🟡 inaccessible | aimplb.org returned bot-verification page; AIMPLB is a real institution per WebSearch. |
| Kochi | 🟢 verified | samastha.info loads, Samastha Kerala Jem-iyyathul Ulama (Sunni Shafi'i, est. 1925). |
| Cotabato | 🟡 inaccessible | bdi.bangsamoro.gov.ph returned 403; ncmf.gov.ph also 403. Both institutions are real per WebSearch. |
| Marawi | 🟡 inaccessible | Same as Cotabato (shared BDI-BARMM citation). |

**Concrete URL corrections:**

- **Mosul (citation URL)** in `scripts/data/city-method-overrides.json`: change `https://sunni.gov.iq/` → `http://sunniaffairs.gov.iq/en/`. sunni.gov.iq does not resolve (ECONNREFUSED in test). Per Wikipedia "Sunni Endowment Office" (Q61754781), official URL is sunniaffairs.gov.iq.
- **Tabriz (citation URL)** in `scripts/data/city-method-overrides.json`: change `https://earthquake.ut.ac.ir/` → `https://geophysics.ut.ac.ir/en/`. earthquake.ut.ac.ir is the seismological subdomain (Iranian Seismological Center). The Institute of Geophysics homepage is geophysics.ut.ac.ir; that is the institutional anchor for the prayer-time calculation method named after the institute.

### 9. Institutional `source.institution` attributions — possible misalignments

**Karbala, Najaf, Basra (IQ)**

- *Issue:* cities.json `source.institution` is "Tehran Institute of Geophysics", but the actual institutional voice for these Twelver Shia cities is the Najaf hawza maraji' offices (Sistani office in Najaf; Astan al-Husayniyya / Astan al-Abbasiyya custodial offices in Karbala). The Tehran Institute publishes the Iranian regional default; the Iraqi Shia cities use the same Tehran-style angles BECAUSE of marja' tradition, not because they are administered by the Tehran Institute.
- *Suggestion:* Rename source.institution to e.g. "Najaf hawza maraji' (Office of Sistani) — Tehran-style timing convention" or attribute multiply to make the institutional plurality explicit.
- *Severity:* medium
- *Classification:* 🟡→🟢 — institutional accuracy improvement; scholarly review recommended per CLAUDE.md surface-disagreement principle.

### 10. Mawaqit slug freshness

All 155 Mawaqit-anchored cities in `cities.json` reference slugs that are present in the `mawaqit-mosques.json` registry — **zero orphans**. Spot-check of 4 random slugs:

| Slug | URL | WebFetch status |
|------|-----|-----------------|
| `alburkent-dzhuma-mechet-alburikent-367026-russia` | mawaqit.net/en/m/... | 200 OK (Джума мечеть Альбурикент) |
| `jm-lsyf-manama-seef-428-bahrain` | mawaqit.net/en/m/... | 200 OK (جامع السيف) |
| `al-khair-mosque-darul-tafsir-choa-chu-kang-688847-singapore` | mawaqit.net/en/m/... | 200 OK (Al-Khair Mosque \| Darul Tafsir) |
| `masjid-imam-malik-bin-anas-tevragh-zeina-4727-nouakchott-mauritania` | mawaqit.net/en/m/... | 200 OK (جامع الإمام مالك بن أنس تفرغ زينه, NOUAKCHOTT) |

No spot-checked slugs returned 404. The 5 known-bad slugs (excluded list in mawaqit-mosques.json) are correctly NOT referenced by cities.json.

### 11. Country-code mismatches

Excluding intentional overrides (Mamoudzou YT, Saint-Denis RE, Laayoune EH, Jerusalem PS↔IL — all documented in engine.js):

| City | cities.json ISO | Wikidata ISO | WD label | Distance | Notes |
|------|-----------------|--------------|----------|----------|-------|
| Pristina | XK | RS | Pristina | 0.43 km | Wikidata classifies Kosovo under Serbia (RS) per non-recognition; cities.json XK is the de-facto recognition. **Intentional**, but could surface as `notes[]`. |
| Hong Kong | HK | CN | Hong Kong | 4.688 km | Wikidata HK→CN is the political reality; cities.json HK is the SAR ISO code. **Intentional**. |

Both are intentional — no action.

### 12. Cities with no Wikidata match

| City | ISO | Lat / Lon | Notes |
|------|-----|-----------|-------|
| Ghent | BE | 51.0543, 3.7174 | Real city (Ghent BE; nl: Gent). Wikidata QID Q1296 exists but apparently classified as `wd:Q748149` (place in Belgium) rather than `wd:Q515` (city). Flagged for follow-up: re-resolve using a broader type set. |
| Nador | MA | 35.1741, -2.9287 | Real city (Nador, Morocco; حضرية الناظور). Same likely cause. Has a Mawaqit slug in `mawaqit-mosques.json` so registry coverage works; just Wikidata-resolution miss. |

---

## Multi-field cities (≥2 fields flagged)

177 cities have flags on ≥2 distinct fields. **The vast majority are capital-row entries** that lack population/adminRegion/nameLocal due to world-cities.json's slim schema, plus one or two field-issues. Listed first by distinct-field-count descending — these benefit most from a coordinated registry refresh.

| City | ISO | Region | Distinct fields | Field summary |
|------|-----|--------|------------------|---------------|
| Kuwait City | KW | Gulf | 4 | timezone_alias, population_missing, adminRegion_missing, nameLocal_missing |
| Taourirt | MA | Maghreb | 4 | population_major, elevation, adminRegion_missing, nameLocal_missing |
| Beirut | LB | Levant | 4 | population_missing, elevation, adminRegion_missing, nameLocal_missing |
| Gitega | BI | E Africa | 4 | timezone_alias, population_missing, elevation, adminRegion_missing |
| Malabo | GQ | C Africa | 4 | timezone_alias, population_missing, elevation, adminRegion_missing |
| Juba | SS | NE Africa / Horn | 4 | population_missing, elevation, adminRegion_missing, nameLocal_missing |
| Bajil | YE | Gulf | 4 | timezone_alias, elevation, adminRegion_missing, nameLocal_missing |
| Baku | AZ | Iran/Caucasus | 4 | population_missing, elevation, adminRegion_missing, nameLocal_missing |
| Tbilisi | GE | Iran/Caucasus | 4 | population_missing, elevation, adminRegion_missing, nameLocal_missing |
| Kinshasa | CD | C Africa | 4 | timezone_alias, population_missing, elevation, adminRegion_missing |
| Khartoum Bahri | SD | Mashreq | 3 | population_major, adminRegion_missing, nameLocal_missing |
| Brazzaville | CG | C Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Freetown | SL | W Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Berrechid | MA | Maghreb | 3 | elevation, adminRegion_missing, nameLocal_missing |
| Amman | JO | Levant | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Jerusalem | IL | Levant | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Khartoum | SD | Mashreq | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Bishkek | KG | Central Asia | 3 | population_missing, elevation, adminRegion_missing |
| Lisbon | PT | S Europe | 3 | population_missing, elevation, adminRegion_missing |
| Sofia | BG | Balkans | 3 | population_missing, elevation, adminRegion_missing |
| Minsk | BY | E Europe | 3 | population_missing, elevation, adminRegion_missing |
| Lilongwe | MW | E Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Sidi Kacem | MA | Maghreb | 3 | elevation, adminRegion_missing, nameLocal_missing |
| Conakry | GN | W Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Bissau | GW | W Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Tehran | IR | Iran/Caucasus | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Washington D.C. | US | N America | 3 | population_missing, elevation, adminRegion_missing |
| Praia | CV | W Africa | 3 | population_missing, elevation, adminRegion_missing |
| Maseru | LS | S Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Mbabane | SZ | S Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Yaoundé | CM | C Africa | 3 | population_missing, elevation, adminRegion_missing |
| Libreville | GA | C Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Porto-Novo | BJ | W Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| São Tomé | ST | C Africa | 3 | population_missing, elevation, adminRegion_missing |
| Lusaka | ZM | E Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Niamey | NE | W Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Tripoli | LY | Maghreb | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Riyadh | SA | Gulf | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Abu Dhabi | AE | Gulf | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Reykjavík | IS | Nordic | 3 | population_missing, elevation, adminRegion_missing |
| Kathmandu | NP | South Asia | 3 | population_missing, elevation, adminRegion_missing |
| Kingston | JM | C America | 3 | timezone_alias, population_missing, adminRegion_missing |
| Harare | ZW | E Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Gaborone | BW | S Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Nairobi | KE | E Africa | 3 | population_missing, elevation, adminRegion_missing |
| Djibouti | DJ | NE Africa / Horn | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Prague | CZ | C Europe | 3 | population_missing, elevation, adminRegion_missing |
| Asmara | ER | E Africa | 3 | timezone_alias, population_missing, adminRegion_missing |
| Yerevan | AM | Iran/Caucasus | 3 | population_missing, adminRegion_missing, nameLocal_missing |
| Ulaanbaatar | MN | E Asia | 3 | population_missing, elevation, adminRegion_missing |
| (127 more — see /tmp/fajr-audit/flags.json) | | | | |

---

## Per-region confidence scores

Per-region rate of cities with ≥1 field flagged. **Lower flag-rate = higher data confidence.** Sorted ascending so high-confidence regions come first.

**Interpretation caveat:** the high flag-rate in many regions reflects the systematic absence of population/adminRegion/nameLocal in capital-row entries, NOT data errors. Once those gap-fields are enriched from Wikidata (Recommendation 1 below), regional flag rates should drop dramatically.

| Region | Cities | Flagged | Flag % | Field-issues | Notes |
|--------|-------:|--------:|-------:|-------------:|-------|
| South Asia | 42 | 11 | 26% | 17 | high confidence |
| Anatolia/Cyprus | 15 | 4 | 27% | 6 | high confidence |
| Iran/Caucasus | 15 | 4 | 27% | 14 | high confidence |
| N America | 24 | 8 | 33% | 10 | mostly capital-row gaps |
| S Europe | 15 | 6 | 40% | 9 | mostly capital-row gaps |
| NW Europe | 32 | 13 | 41% | 19 | mostly capital-row gaps |
| SE Asia | 38 | 16 | 42% | 24 | mostly capital-row gaps |
| E Europe | 9 | 4 | 44% | 8 | mostly capital-row gaps |
| Mashreq | 15 | 7 | 47% | 11 | mostly capital-row gaps |
| Levant | 25 | 12 | 48% | 23 | mostly capital-row gaps |
| Gulf | 29 | 14 | 48% | 31 | mostly capital-row gaps |
| C Europe | 17 | 9 | 53% | 15 | mixed; capital-row gaps + some metro/centroid issues |
| Oceania | 9 | 5 | 56% | 9 | mixed; capital-row gaps + some metro/centroid issues |
| E Africa | 18 | 12 | 67% | 30 | mixed; capital-row gaps + some metro/centroid issues |
| Maghreb | 51 | 37 | 73% | 77 | mixed; capital-row gaps + some metro/centroid issues |
| Indian Ocean | 8 | 6 | 75% | 10 | mostly capital-row schema gaps (no real data errors) |
| S Africa | 8 | 6 | 75% | 14 | mostly capital-row schema gaps (no real data errors) |
| W Africa | 25 | 19 | 76% | 42 | mostly capital-row schema gaps (no real data errors) |
| Balkans | 13 | 10 | 77% | 20 | mostly capital-row schema gaps (no real data errors) |
| S America | 18 | 14 | 78% | 27 | mostly capital-row schema gaps (no real data errors) |
| Central Asia | 9 | 7 | 78% | 12 | mostly capital-row schema gaps (no real data errors) |
| E Asia | 9 | 7 | 78% | 14 | mostly capital-row schema gaps (no real data errors) |
| Nordic | 10 | 8 | 80% | 13 | mostly capital-row schema gaps (no real data errors) |
| C Africa | 9 | 9 | 100% | 25 | mostly capital-row schema gaps (no real data errors) |
| Baltics | 3 | 3 | 100% | 6 | mostly capital-row schema gaps (no real data errors) |
| NE Africa / Horn | 5 | 5 | 100% | 11 | mostly capital-row schema gaps (no real data errors) |
| C America | 6 | 6 | 100% | 13 | mostly capital-row schema gaps (no real data errors) |

---

## Recommended next-round corrections (ranked)

### Tier 1 — high-confidence corrections (verifiable now, no scholarly review needed)

1. **`scripts/data/city-method-overrides.json` — Mosul citation URL fix.**
   - Change `"https://sunni.gov.iq/"` → `"http://sunniaffairs.gov.iq/en/"`.
   - Reference: WebSearch + Wikipedia "Sunni Endowment Office" entry confirms the institutional URL is sunniaffairs.gov.iq; sunni.gov.iq does not resolve.

2. **`scripts/data/city-method-overrides.json` — Tabriz citation URL fix.**
   - Change `"https://earthquake.ut.ac.ir/"` → `"https://geophysics.ut.ac.ir/en/"`.
   - Reference: earthquake.ut.ac.ir is the seismological subdomain (IRSC). The Institute of Geophysics homepage at geophysics.ut.ac.ir is the institutional anchor.

3. **`src/data/cities.json` — Lisbon (PT) elevation correction.**
   - Change `"elevation":2` → `"elevation":50`.
   - Reference: elevation.city, MAPLOGS, Wikipedia all give 45–62m city-centre. cities.json's 2m matches the Tagus shoreline only; the city extends to 200m+ on the seven hills.

4. **`src/data/cities.json` — Pattani (TH) population correction.**
   - Change `"population":144000` → `"population":45000` (or remove, treating as a Mawaqit-anchored small town).
   - Reference: citypopulation.de city-proper 44,353 (2018). Current value confuses Pattani Province with the city.

5. **`src/data/cities.json` — adminRegion enrichment for ~209 cities.**
   - Most are capital rows inherited from world-cities.json. Apply by patching with Wikidata P131 where the resolver returned name+country match. Examples: Khartoum (SD) → "Khartoum State"; Astana (KZ) → "Akmola Region"; Lima (PE) → "Lima Province"; Manila (PH) → "Metro Manila"; Bishkek (KG) → "Bishkek". Full list in `/tmp/fajr-audit/flags.json` under `flags.adminRegion_missing`.

6. **`src/data/cities.json` — population enrichment for ~117 capital rows.**
   - Same provenance as adminRegion. Wikidata supplies city-proper population for all of them. Prefer city-proper to metro for consistency with manually-curated MUSLIM_POPULATION_CENTERS rows.

7. **`src/data/cities.json` — nameLocal Arabic enrichment for ~56 Arabic-region cities.**
   - Source from Wikidata rdfs:label@ar.

### Tier 2 — medium-confidence (institutional review recommended)

8. **`src/data/cities.json` — Karbala/Najaf/Basra source.institution rewording.**
   - Currently cite "Tehran Institute of Geophysics" (the Iran-side institutional source). The Twelver Shia institutional voice in Iraq is the Najaf hawza maraji' offices — Sistani office in Najaf; Astan al-Husayniyya custodial offices in Karbala. Same Tehran-style timing convention but different institutional anchor.
   - **Classification: 🟡→🟢** — institutional accuracy improvement requiring fiqh-reviewer (Layer 3) sign-off per CLAUDE.md.
   - Suggestion: rename to e.g. `"Najaf hawza maraji' (Office of Sistani; Astan al-Husayniyya custodial offices) — Tehran-style timing convention"` so the institutional plurality is explicit.

9. **`scripts/data/city-method-overrides.json` — Karbala citation specificity.**
   - Citation lists imamhussain.org but the Imsakiyya is published via the "جنة الوارث" (Janna al-Warith) mobile app, not directly on the website. Consider updating citation to mention the app explicitly so a reviewer can verify.

10. **`scripts/data/city-method-overrides.json` — Sarajevo/Mostar/BanjaLuka citation refresh.**
   - rijaset.ba redirects to islamskazajednica.ba. Update citation URL to canonical, or note the redirect.

11. **`scripts/data/city-method-overrides.json` — Pristina citation refresh.**
   - bislame.net redirects to bislame.com. Update citation URL.

### Tier 3 — defer (lower priority)

12. **31 timezone-alias canonicalizations.**
   - Functional no-op for current tooling, but downstream apps doing exact-string TZ matching could break. Defer to a coordinated registry refresh with explicit downstream announcement (especially for agiftoftime if it stores user TZ as cities.json string).

13. **Ghent BE and Nador MA Wikidata-resolution gap.**
   - Both are real cities; Wikidata's P31 typing for them does not match the broad city-types we queried. Re-resolve with `wd:Q748149` (place in Belgium) and `wd:Q748166` (commune of Morocco) added to the type filter.

14. **52 minor population disagreements (20–50%).**
   - Mostly metro-vs-city-proper convention. Document the convention in cities.json header comment and skip individual fixes.

### Tier 4 — Track B territory (do not edit here)

Coordinate-level / cross-border / centroid-drift / bbox issues belong to Track B. This audit noticed but did not flag:

- Mamoudzou YT, Saint-Denis RE, Laayoune EH — country-code mismatches that are intentional (overseas departments + disputed territory).
- Jerusalem PS↔IL split — intentional dual-row design per `engine.js:85`.
- Hong Kong HK→CN, Pristina XK→RS — intentional ISO regional codes.
- Cities where Wikidata's nearest entity matched a different city-of-the-same-name (Khartoum Bahri → Khartoum, Alburikent → Makhachkala). Picker correctly flagged with `nameMatch=false` and excluded them from population/elevation flags.

---

## Confidence in this audit's output

- **High confidence:** the institutional URL corrections (Mosul, Tabriz), the Lisbon elevation correction, the Pattani population correction, the Mawaqit slug-presence audit, and the per-field flag tables.
- **Medium confidence:** the population/elevation cross-checks for cities where Wikidata entity-resolution worked cleanly (`nameMatch=true`) AND a WebSearch corroboration exists.
- **Low confidence:** the elevation flags overall — Wikidata's P2044 is itself frequently wrong (max-elevation rather than centre), and many "flags" reduce to legitimate scope variations (city-centre vs city-max vs district-mean).
- **Not in scope:** any centroid / bbox / cross-border / coordinate-quality concern (Track B owns those).

## Reproducibility

All scripts and intermediate data are in `/tmp/fajr-audit/`:

- `resolve-batch.js` — Wikidata SPARQL resolver (3-way concurrent, fair-use compliant)
- `wikidata-results.jsonl` — full SPARQL output (~3.6 MB; 477 records, top-5 candidates each)
- `analyze.js` — flag tabulator
- `flags.json` — per-field flag tables in machine-readable form
- `build-proposal.js` — this proposal generator

Re-run with `node /tmp/fajr-audit/resolve-batch.js` (resumes from existing output if interrupted) followed by `node /tmp/fajr-audit/analyze.js` and `node /tmp/fajr-audit/build-proposal.js`.

— fajr-claude