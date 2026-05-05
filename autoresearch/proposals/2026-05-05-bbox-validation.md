# 2026-05-05 — bbox validation against Nominatim + Natural Earth

External-truth audit of every city centroid + bbox in `src/data/cities.json`
(477 rows) and every country bbox in `src/engine.js#detectCountry()` /
`COUNTRY_BBOX_TABLE` (168 unique countries, 172 if-statements). External truth
sources: OpenStreetMap Nominatim reverse-geocoding + name search, plus Natural
Earth (10m admin_0_countries) country polygons. No edits to `src/`,
`scripts/build-city-registry.js`, or any code/tests — read-only research.

Run by `fajr-claude` 2026-05-05.

---

## 1. Executive summary

- **477 cities audited against Nominatim** — full pass complete. 0 HIGH-severity
  country-claim mismatches and 0 MED-severity centroid-leak findings across
  all 477 rows. The post-v1.7.19 engine correctly resolves every registered
  centroid to its claimed country at the level Nominatim's reverse +
  name-search cross-validate. 229 rows carry LOW/INFO findings (intentional
  metro-tightening, suburb-level reverse-name centroid drift, GB administrative-
  region naming convention drift) — none are bugs.
- **168 country bboxes audited against Natural Earth** — 118 OK, 19 TOO_WIDE,
  26 TOO_NARROW, 3 WIDE_AND_NARROW, 2 NE_NOT_FOUND (Réunion + Mayotte folded
  into France's MultiPolygon by Natural Earth, audited via direct OSM lookup
  instead).
- **Border-zone analysis** — 78 of 477 cities sit within 30 km of an
  international border (centroid-distance to nearest foreign-country
  boundary). 49 of those have one or more bbox corners that lie within 5 km
  of (or inside) a foreign country's geometry. Of those 49, the canonical
  registry already routes correctly via the smaller-bbox-first sort + Pass-B
  COUNTRY_BBOX_TABLE corroboration (verified by the existing
  `validate-city-registry.js` test suite). The list is provided as a watch
  list, not a regression set.
- **Top 5 highest-impact corrections** (ranked by Muslim-population × current
  bbox-imprecision-magnitude):
  1. **Iran lat-max bug** — Iran's bbox top is 39°N but Tabriz IR (38.08°)
     and Khoy IR (38.55°) sit close, while NE shows Iran extends to 39.78°N
     (Aras River border with Armenia). Iran's `lat <= 39` at engine.js:155
     should extend to ~39.8 to cover Maku IR + the NW corner. Risk: any city
     in NW Iran's Aras-valley above 39°N currently falls through to Russia or
     null.
  2. **Iran lon-min hole** — Iran's bbox starts at lon 47, but NE shows Iran
     extends west to 44.02° (Maku, Khoy, NW Azerbaijan-province border). Some
     Iranian Kurdistan / W. Azerbaijan cities at lon 44-47 currently fall
     through to Iraq or Turkey if they sit there. Engine.js:155.
  3. **Kazakhstan lon-min** — KZ bbox lon-min is 50.0 (tightened from 46.4
     in v1.7.5 to avoid Russian Caucasus). NE shows KZ extends to lon 46.49°
     (the Caspian / Atyrau region). Atyrau KZ at lon 51.92 is fine, but
     **Aktau KZ (51.16) is fine**, however Western Kazakhstan oblast
     (Oral, Aktobe west) extends to ~46.5 lon. None currently in registry,
     but if added, would be missed. Engine.js:172.
  4. **UK overseas extent missing** — UK bbox is 49-62°N / -9-2.5°E, which
     covers GB mainland but not Northern Ireland. NI cities (Belfast 54.6°,
     -5.93°) ARE inside the bbox, so functionally OK; flag is the
     bbox extends past mainland (lat 60-62 catches a sliver of S. Iceland in
     the worst case, though Iceland's earlier check claims it). Cosmetic
     more than functional.
  5. **Jerusalem PS adminRegion** — `adminRegion` field claimed
     "Hebron Governorate" for Hebron city, but the registry's Jerusalem|PS
     row is intentionally an east-of-Jerusalem routing anchor and Nominatim
     reports it as falling inside Israel. This is a known political-overlap
     case (handled correctly by the IL+PS dual-row pattern); flagged here
     for completeness only.

The audit's strongest single finding is **negative**: the engine's post-
v1.7.19 if-chain has no detectable country-claim regressions across the
Nominatim cross-check. Most "TOO_WIDE" verdicts are intentional (the engine
deliberately uses a slightly looser bbox to claim metro-area edges that the
country's actual polygon would exclude).

---

## 2. Per-country bbox audit — 168 countries

Reference data: Natural Earth 1:10m `admin_0_countries.geojson` (CC0 /
public-domain Natural-Earth licence; Nathan Kelso curated mirror at
[natural-earth-vector](https://github.com/nvkelso/natural-earth-vector/)).
Country polygons reduced to bounding boxes; for countries whose Natural Earth
polygon is a MultiPolygon spanning overseas territories (France, UK,
Netherlands, Norway, Russia, US, etc.), I used a hand-curated *mainland-only*
bbox listed in the audit script — see methodology section §7.

Verdict legend:

- **OK** — fajr bbox is within 0.50° (~55 km) of NE's mainland bbox on all
  four sides. 118 countries.
- **TOO_WIDE** — fajr bbox extends >0.50° past country territory on at least
  one side. **In most cases this is intentional** — the engine deliberately
  takes a slightly larger bbox so cities at the edge of a country (capitals
  on rivers, coastal metros) match. The if-chain ordering then prevents
  cross-border leak. Only flag for follow-up if a sibling country's
  registered city sits in the overlap zone.
- **TOO_NARROW** — fajr bbox is >0.50° tighter than country territory. Real
  coverage hole: cities in those uncovered regions would fall through to
  null or to a fallback neighbor.
- **WIDE_AND_NARROW** — both flags fire on different sides.

### 2.1 Multi-strip countries (multiple if-statements)

Three countries have multiple if-statements in `detectCountry`, by design:

| Country | Boxes | Purpose |
|---|---|---|
| Türkiye / Turkey | 3 | E (37.05–42.10 / 26.0–44.5), W (36.0–37.05 / 26.0–35.7) split for Caucasus avoidance + a legacy 35–43 / 25–45 box at line 177 (effectively shadowed by the v1.7.19 split — see §6 recommendation 14) |
| Sudan | 2 | Identical box [9.5, 22, 21.8, 38.6] appears twice — once as an early check (line 146) before SaudiArabia to claim Port Sudan, once as the main African-block check (line 297). Functionally equivalent, but the duplicate is dead code after the first match wins |
| Afghanistan | 2 | Main (29.4–37 / 60.5–71.5) + Wakhan corridor (36.5–38.5 / 71.5–74.95) split for v1.7.19 Pakistan disambiguation |

The Türkiye legacy box and the duplicated Sudan box are dead (shadowed by the
specific-first checks). They are NOT bugs — they don't affect routing — but
they are dead code that could be removed for clarity.

### 2.2 Audit table

The full per-country audit is included verbatim below. fajr lat/lon = union
of all if-statement boxes for that country in `detectCountry()`. NE lat/lon =
mainland-only Natural Earth bbox (with overrides where NE's polygon includes
overseas territories — see §7).

| Country | ISO | Cities | fajr lat range | fajr lon range | NE lat range | NE lon range | Verdict | Flags |
|---------|-----|-------:|----------------|----------------|--------------|--------------|---------|-------|
| Canada | CA | 9 | 41.50 to 70.00 | -141.00 to -52.00 | 41.67 to 83.12 | -141.01 to -52.62 | WIDE_AND_NARROW | missing_north(+13.12°lat); extra_east(0.62°lon) |
| Morocco | MA | 33 | 27.00 to 36.50 | -14.00 to -1.50 | 21.42 to 35.93 | -17.01 to -1.03 | WIDE_AND_NARROW | missing_south(+5.58°lat); missing_west(+3.01°lon); extra_north(0.57°lat) |
| Pakistan | PK | 12 | 23.70 to 37.00 | 60.00 to 75.00 | 23.70 to 37.05 | 60.84 to 77.05 | WIDE_AND_NARROW | missing_east(+2.05°lon); extra_west(0.84°lon) |
| Bolivia | BO | 1 | -24.00 to -9.00 | -70.00 to -57.00 | -22.90 to -9.68 | -69.67 to -57.47 | TOO_WIDE | extra_south(1.10°lat); extra_north(0.68°lat) |
| Colombia | CO | 1 | -5.00 to 13.00 | -82.00 to -66.00 | -4.24 to 13.58 | -81.72 to -66.88 | TOO_WIDE | missing_north(+0.58°lat); extra_south(0.76°lat); extra_east(0.88°lon) |
| Cyprus | CY | 1 | 34.55 to 35.71 | 32.27 to 34.60 | 34.63 to 35.19 | 32.27 to 34.10 | TOO_WIDE | extra_north(0.52°lat); extra_east(0.50°lon) |
| Ecuador | EC | 1 | -6.00 to 2.00 | -82.00 to -74.00 | -5.00 to 1.45 | -81.08 to -75.20 | TOO_WIDE | extra_south(1.00°lat); extra_north(0.55°lat); extra_west(0.92°lon); extra_east(1.20°lon) |
| Egypt | EG | 11 | 22.00 to 32.00 | 24.00 to 38.00 | 21.99 to 31.66 | 24.69 to 36.90 | TOO_WIDE | extra_west(0.69°lon); extra_east(1.10°lon) |
| Finland | FI | 1 | 59.00 to 71.00 | 19.00 to 32.00 | 59.81 to 70.08 | 20.62 to 31.57 | TOO_WIDE | extra_south(0.81°lat); extra_north(0.92°lat); extra_west(1.62°lon) |
| Iceland | IS | 1 | 62.00 to 68.00 | -26.00 to -12.00 | 63.30 to 66.55 | -24.55 to -13.50 | TOO_WIDE | extra_south(1.30°lat); extra_north(1.45°lat); extra_west(1.45°lon); extra_east(1.50°lon) |
| Malaysia | MY | 7 | 1.00 to 8.00 | 99.00 to 120.00 | 0.85 to 7.36 | 99.64 to 119.28 | TOO_WIDE | extra_north(0.64°lat); extra_west(0.64°lon); extra_east(0.72°lon) |
| NewZealand | NZ | 2 | -47.29 to -34.39 | 166.43 to 178.55 | -46.65 to -34.39 | 166.43 to 178.55 | TOO_WIDE | extra_south(0.64°lat) |
| Norway | NO | 1 | 56.00 to 72.00 | 4.00 to 32.00 | 57.99 to 71.19 | 4.62 to 31.10 | TOO_WIDE | extra_south(1.99°lat); extra_north(0.81°lat); extra_west(0.62°lon); extra_east(0.90°lon) |
| Oman | OM | 1 | 16.00 to 26.50 | 51.70 to 60.00 | 16.64 to 26.39 | 51.98 to 59.84 | TOO_WIDE | extra_south(0.64°lat) |
| Qatar | QA | 1 | 24.00 to 26.50 | 50.50 to 51.70 | 24.56 to 26.16 | 50.75 to 51.62 | TOO_WIDE | extra_south(0.56°lat) |
| SaudiArabia | SA | 14 | 16.00 to 33.00 | 35.00 to 56.00 | 16.37 to 32.12 | 34.57 to 55.64 | TOO_WIDE | extra_north(0.88°lat) |
| Spain | ES | 8 | 27.64 to 43.79 | -18.16 to 4.32 | 36.00 to 43.79 | -9.30 to 4.32 | TOO_WIDE | extra_south(8.36°lat); extra_west(8.86°lon) |
| Turkey | TR | 14 / 3 boxes | 35.00 to 43.00 | 25.00 to 45.00 | 35.82 to 42.10 | 25.66 to 44.81 | TOO_WIDE | extra_south(0.82°lat); extra_north(0.90°lat); extra_west(0.66°lon) |
| UAE | AE | 7 | 22.00 to 26.50 | 51.00 to 56.50 | 22.62 to 26.07 | 51.57 to 56.38 | TOO_WIDE | extra_south(0.62°lat); extra_west(0.57°lon) |
| UK | GB | 11 | 49.00 to 62.00 | -9.00 to 2.50 | 49.91 to 60.85 | -8.65 to 1.76 | TOO_WIDE | extra_south(0.91°lat); extra_north(1.15°lat); extra_east(0.74°lon) |
| Ukraine | UA | 1 | 44.39 to 52.38 | 22.14 to 40.22 | 45.21 to 52.37 | 22.13 to 40.16 | TOO_WIDE | extra_south(0.82°lat) |
| USA | US | 15 | 24.00 to 49.00 | -125.00 to -66.00 | 24.50 to 49.40 | -125.00 to -66.90 | TOO_WIDE | extra_east(0.90°lon) |
| Benin | BJ | 1 | 6.21 to 12.42 | 0.78 to 3.20 | 6.21 to 12.40 | 0.76 to 3.84 | TOO_NARROW | missing_east(+0.64°lon) |
| Botswana | BW | 1 | -26.91 to -17.78 | 19.99 to 27.50 | -26.89 to -17.78 | 19.98 to 29.35 | TOO_NARROW | missing_east(+1.85°lon) |
| Brazil | BR | 4 | -33.75 to 5.27 | -73.99 to -34.79 | -33.74 to 5.27 | -74.02 to -28.88 | TOO_NARROW | missing_east(+5.91°lon) |
| China | CN | 2 | 18.16 to 53.56 | 73.50 to 134.77 | 15.78 to 53.57 | 73.60 to 134.77 | TOO_NARROW | missing_south(+2.38°lat) |
| Denmark | DK | 3 | 54.56 to 57.75 | 8.07 to 12.70 | 54.57 to 57.75 | 8.09 to 15.15 | TOO_NARROW | missing_east(+2.45°lon) |
| EquatorialGuinea | GQ | 1 | 0.92 to 3.85 | 5.62 to 11.34 | -1.48 to 3.77 | 5.61 to 11.34 | TOO_NARROW | missing_south(+2.40°lat) |
| France | FR | 11 | 42.00 to 51.00 | -5.00 to 8.50 | 41.36 to 51.09 | -5.14 to 9.56 | TOO_NARROW | missing_south(+0.64°lat); missing_east(+1.06°lon) |
| Georgia | GE | 1 | 41.05 to 43.00 | 40.00 to 46.70 | 41.04 to 43.58 | 39.99 to 46.70 | TOO_NARROW | missing_north(+0.58°lat) |
| Guinea | GN | 1 | 7.20 to 12.70 | -15.10 to -8.50 | 7.19 to 12.67 | -15.08 to -7.66 | TOO_NARROW | missing_east(+0.84°lon) |
| Iran | IR | 12 | 25.00 to 39.00 | 47.00 to 63.00 | 25.06 to 39.77 | 44.02 to 63.32 | TOO_NARROW | missing_north(+0.77°lat); missing_west(+2.98°lon) |
| Jordan | JO | 3 | 29.18 to 33.40 | 35.50 to 39.30 | 29.19 to 33.37 | 34.95 to 39.29 | TOO_NARROW | missing_west(+0.55°lon) |
| Kazakhstan | KZ | 2 | 40.50 to 55.50 | 50.00 to 87.40 | 40.59 to 55.44 | 46.48 to 87.32 | TOO_NARROW | missing_west(+3.52°lon) |
| Mauritania | MR | 2 | 16.04 to 27.30 | -17.10 to -4.80 | 14.73 to 27.29 | -17.08 to -4.82 | TOO_NARROW | missing_south(+1.31°lat) |
| Mozambique | MZ | 2 | -26.90 to -10.40 | 31.40 to 41.00 | -26.86 to -10.47 | 30.21 to 40.85 | TOO_NARROW | missing_west(+1.19°lon) |
| Niger | NE | 1 | 11.70 to 23.50 | 0.16 to 14.00 | 11.70 to 23.52 | 0.15 to 15.97 | TOO_NARROW | missing_east(+1.97°lon) |
| RepublicOfTheCongo | CG | 1 | -5.04 to 3.71 | 11.20 to 15.25 | -5.02 to 3.71 | 11.11 to 18.64 | TOO_NARROW | missing_east(+3.39°lon) |
| Romania | RO | 1 | 43.62 to 48.27 | 20.27 to 28.70 | 43.65 to 48.27 | 20.24 to 29.70 | TOO_NARROW | missing_east(+1.00°lon) |
| Russia | RU | 7 | 41.19 to 81.86 | 19.64 to 169.05 | 41.19 to 81.86 | 19.64 to 180.00 | TOO_NARROW | missing_east(+10.95°lon) |
| Senegal | SN | 3 | 12.30 to 16.04 | -17.60 to -11.30 | 12.31 to 16.69 | -17.54 to -11.38 | TOO_NARROW | missing_north(+0.65°lat) |
| Slovenia | SI | 1 | 45.42 to 46.88 | 13.38 to 15.70 | 45.42 to 46.86 | 13.37 to 16.52 | TOO_NARROW | missing_east(+0.82°lon) |
| Sudan | SD | 4 / 2 boxes | 9.50 to 22.00 | 21.80 to 38.60 | 8.68 to 22.23 | 21.81 to 38.60 | TOO_NARROW | missing_south(+0.82°lat) |
| Switzerland | CH | 4 | 45.82 to 47.65 | 6.00 to 9.60 | 45.82 to 47.80 | 5.96 to 10.47 | TOO_NARROW | missing_east(+0.87°lon) |
| Taiwan | TW | 1 | 21.90 to 25.30 | 119.31 to 122.00 | 21.91 to 25.29 | 118.28 to 122.00 | TOO_NARROW | missing_west(+1.03°lon) |
| Venezuela | VE | 2 | 0.65 to 12.20 | -73.36 to -59.81 | 0.65 to 15.70 | -73.39 to -59.82 | TOO_NARROW | missing_north(+3.50°lat) |
| Vietnam | VN | 1 | 8.54 to 23.39 | 104.00 to 109.47 | 8.57 to 23.37 | 102.12 to 109.47 | TOO_NARROW | missing_west(+1.88°lon) |
| Yemen | YE | 3 | 12.00 to 19.00 | 42.50 to 54.00 | 12.11 to 19.00 | 42.55 to 54.54 | TOO_NARROW | missing_east(+0.54°lon) |
| Afghanistan | AF | 1 / 2 boxes | 29.40 to 38.50 | 60.50 to 74.95 | 29.39 to 38.47 | 60.49 to 74.89 | OK | - |
| Albania | AL | 1 | 39.60 to 42.70 | 19.30 to 21.05 | 39.64 to 42.66 | 19.27 to 21.04 | OK | - |
| Algeria | DZ | 5 | 19.00 to 37.10 | -8.70 to 12.00 | 18.98 to 37.09 | -8.68 to 11.97 | OK | - |
| Angola | AO | 1 | -18.04 to -4.50 | 11.68 to 24.08 | -18.03 to -4.39 | 11.67 to 24.06 | OK | - |
| Argentina | AR | 3 | -55.06 to -21.78 | -73.57 to -53.65 | -55.05 to -21.79 | -73.57 to -53.66 | OK | - |
| Armenia | AM | 1 | 38.84 to 41.30 | 43.45 to 46.62 | 38.86 to 41.29 | 43.44 to 46.60 | OK | - |
| Australia | AU | 5 | -43.64 to -10.06 | 112.92 to 153.64 | -43.65 to -10.06 | 112.92 to 153.64 | OK | - |
| Austria | AT | 2 | 46.37 to 49.02 | 9.53 to 17.16 | 46.38 to 49.01 | 9.52 to 17.15 | OK | - |
| Azerbaijan | AZ | 1 | 38.40 to 41.90 | 44.80 to 50.40 | 38.39 to 41.89 | 44.77 to 50.63 | OK | - |
| Bahrain | BH | 2 | 25.50 to 26.50 | 50.40 to 50.85 | 25.58 to 26.29 | 50.38 to 50.82 | OK | - |
| Bangladesh | BD | 5 | 20.50 to 26.60 | 88.40 to 92.70 | 20.74 to 26.62 | 88.02 to 92.64 | OK | - |
| Belarus | BY | 1 | 51.26 to 56.17 | 23.18 to 32.78 | 51.23 to 56.16 | 23.17 to 32.72 | OK | - |
| Belgium | BE | 4 | 49.50 to 51.50 | 2.55 to 6.41 | 49.49 to 51.50 | 2.52 to 6.38 | OK | - |
| Bhutan | BT | 1 | 26.70 to 28.32 | 88.75 to 92.13 | 26.70 to 28.36 | 88.73 to 92.09 | OK | - |
| Bosnia | BA | 3 | 42.55 to 45.27 | 15.70 to 19.65 | 42.56 to 45.28 | 15.72 to 19.62 | OK | - |
| Brunei | BN | 1 | 4.00 to 5.10 | 114.00 to 115.50 | 4.02 to 5.06 | 114.00 to 115.36 | OK | - |
| Bulgaria | BG | 1 | 41.24 to 44.22 | 22.36 to 28.61 | 41.24 to 44.23 | 22.34 to 28.60 | OK | - |
| BurkinaFaso | BF | 1 | 9.40 to 15.10 | -5.60 to 1.90 | 9.39 to 15.08 | -5.52 to 2.39 | OK | - |
| Burundi | BI | 1 | -4.47 to -2.30 | 29.00 to 30.85 | -4.46 to -2.30 | 28.99 to 30.83 | OK | - |
| Cambodia | KH | 1 | 10.40 to 14.70 | 102.30 to 107.60 | 10.42 to 14.71 | 102.31 to 107.61 | OK | - |
| Cameroon | CM | 1 | 1.70 to 13.10 | 8.50 to 16.20 | 1.66 to 13.08 | 8.51 to 16.21 | OK | - |
| CapeVerde | CV | 1 | 14.80 to 17.20 | -25.36 to -22.66 | 14.80 to 17.20 | -25.36 to -22.66 | OK | - |
| CentralAfricanRepublic | CF | 1 | 2.22 to 11.01 | 14.42 to 27.46 | 2.24 to 11.00 | 14.39 to 27.44 | OK | - |
| Chad | TD | 1 | 7.40 to 23.50 | 13.50 to 24.00 | 7.46 to 23.45 | 13.45 to 23.98 | OK | - |
| Chile | CL | 1 | -55.92 to -17.51 | -75.71 to -66.42 | -55.92 to -17.51 | -75.71 to -66.42 | OK | - |
| Comoros | KM | 1 | -12.50 to -11.30 | 43.20 to 44.60 | -12.38 to -11.36 | 43.21 to 44.53 | OK | - |
| CoteDIvoire | CI | 1 | 4.30 to 10.70 | -8.60 to -2.50 | 4.34 to 10.73 | -8.62 to -2.51 | OK | - |
| Croatia | HR | 1 | 42.39 to 46.55 | 13.49 to 19.45 | 42.42 to 46.55 | 13.50 to 19.41 | OK | - |
| Cuba | CU | 1 | 19.83 to 23.20 | -84.95 to -74.13 | 19.83 to 23.27 | -84.95 to -74.13 | OK | - |
| Czechia | CZ | 1 | 48.55 to 51.06 | 12.09 to 18.86 | 48.56 to 51.04 | 12.08 to 18.84 | OK | - |
| Djibouti | DJ | 1 | 10.90 to 12.70 | 41.75 to 43.42 | 10.93 to 12.71 | 41.75 to 43.42 | OK | - |
| DominicanRepublic | DO | 1 | 17.47 to 19.93 | -72.00 to -68.32 | 17.55 to 19.94 | -72.01 to -68.33 | OK | - |
| DRCongo | CD | 1 | -13.46 to 5.39 | 12.20 to 31.31 | -13.46 to 5.38 | 12.21 to 31.28 | OK | - |
| Eritrea | ER | 1 | 12.40 to 18.00 | 36.40 to 43.10 | 12.36 to 18.00 | 36.42 to 43.12 | OK | - |
| Estonia | EE | 1 | 57.51 to 59.72 | 21.84 to 28.21 | 57.52 to 59.67 | 21.83 to 28.19 | OK | - |
| Eswatini | SZ | 1 | -27.32 to -25.72 | 30.79 to 32.13 | -27.32 to -25.74 | 30.78 to 32.12 | OK | - |
| Ethiopia | ET | 3 | 3.40 to 14.90 | 32.95 to 48.00 | 3.40 to 14.88 | 32.99 to 47.98 | OK | - |
| Fiji | FJ | 1 | -19.20 to -16.15 | 177.13 to 180.26 | -19.20 to -16.15 | 177.13 to 180.00 | OK | - |
| Gabon | GA | 1 | -3.96 to 2.32 | 8.70 to 14.50 | -3.94 to 2.32 | 8.70 to 14.50 | OK | - |
| Gambia | GM | 1 | 13.05 to 13.83 | -16.83 to -13.79 | 13.06 to 13.82 | -16.83 to -13.82 | OK | - |
| Germany | DE | 7 | 47.27 to 55.06 | 5.87 to 15.04 | 47.27 to 55.06 | 5.85 to 15.02 | OK | - |
| Ghana | GH | 1 | 4.50 to 11.20 | -3.30 to 1.20 | 4.74 to 11.16 | -3.26 to 1.19 | OK | - |
| Greece | GR | 1 | 34.80 to 41.75 | 19.37 to 28.25 | 34.81 to 41.75 | 19.63 to 28.24 | OK | - |
| Guatemala | GT | 1 | 13.74 to 17.82 | -92.23 to -88.23 | 13.73 to 17.82 | -92.25 to -88.22 | OK | - |
| GuineaBissau | GW | 1 | 10.92 to 12.68 | -16.72 to -13.64 | 10.93 to 12.68 | -16.73 to -13.66 | OK | - |
| Guyana | GY | 1 | 1.18 to 8.56 | -61.39 to -56.48 | 1.19 to 8.56 | -61.40 to -56.48 | OK | - |
| HongKong | HK | 1 | 22.15 to 22.56 | 113.83 to 114.45 | 22.15 to 22.56 | 113.83 to 114.45 | OK | - |
| Hungary | HU | 1 | 45.74 to 48.59 | 16.40 to 22.91 | 45.74 to 48.57 | 16.09 to 22.88 | OK | - |
| India | IN | 19 | 6.50 to 35.50 | 68.00 to 97.40 | 6.75 to 35.49 | 68.14 to 97.36 | OK | - |
| Indonesia | ID | 19 | -11.00 to 6.00 | 95.00 to 141.00 | -10.92 to 5.91 | 95.01 to 140.98 | OK | - |
| Iraq | IQ | 8 | 29.00 to 37.40 | 38.80 to 48.60 | 29.06 to 37.38 | 38.77 to 48.56 | OK | - |
| Ireland | IE | 1 | 51.42 to 55.39 | -10.69 to -5.83 | 51.45 to 55.39 | -10.48 to -5.99 | OK | - |
| Israel | IL | 1 | 29.49 to 33.34 | 34.27 to 35.55 | 29.49 to 33.41 | 34.25 to 35.89 | OK | - |
| Italy | IT | 5 | 35.49 to 47.09 | 6.62 to 18.51 | 35.49 to 47.09 | 6.62 to 18.51 | OK | - |
| Jamaica | JM | 1 | 17.70 to 18.53 | -78.37 to -76.18 | 17.70 to 18.52 | -78.38 to -76.19 | OK | - |
| Japan | JP | 2 | 24.05 to 45.55 | 122.93 to 153.99 | 24.21 to 45.52 | 122.94 to 153.99 | OK | - |
| Kenya | KE | 2 | -4.70 to 5.00 | 33.90 to 41.90 | -4.68 to 5.03 | 33.89 to 41.88 | OK | - |
| Kosovo | XK | 1 | 41.85 to 43.27 | 20.00 to 21.30 | 41.84 to 43.26 | 20.02 to 21.77 | OK | - |
| Kuwait | KW | 1 | 28.50 to 30.20 | 46.50 to 48.50 | 28.53 to 30.10 | 46.53 to 48.43 | OK | - |
| Kyrgyzstan | KG | 1 | 39.20 to 43.30 | 69.25 to 80.30 | 39.19 to 43.26 | 69.23 to 80.26 | OK | - |
| Laos | LA | 1 | 13.91 to 22.51 | 100.10 to 107.70 | 13.91 to 22.50 | 100.10 to 107.66 | OK | - |
| Latvia | LV | 1 | 55.67 to 58.08 | 20.97 to 28.24 | 55.67 to 58.08 | 20.97 to 28.22 | OK | - |
| Lebanon | LB | 5 | 33.05 to 34.70 | 35.10 to 36.65 | 33.06 to 34.69 | 35.10 to 36.60 | OK | - |
| Lesotho | LS | 1 | -30.68 to -28.57 | 27.01 to 29.46 | -30.66 to -28.57 | 27.00 to 29.44 | OK | - |
| Liberia | LR | 1 | 4.36 to 8.55 | -11.49 to -7.37 | 4.35 to 8.56 | -11.48 to -7.38 | OK | - |
| Libya | LY | 5 | 19.50 to 33.20 | 9.40 to 25.20 | 19.50 to 33.18 | 9.29 to 25.16 | OK | - |
| Lithuania | LT | 1 | 53.90 to 56.45 | 20.95 to 26.84 | 53.89 to 56.44 | 20.93 to 26.80 | OK | - |
| Madagascar | MG | 2 | -25.70 to -11.95 | 43.20 to 50.50 | -25.60 to -11.94 | 43.22 to 50.50 | OK | - |
| Malawi | MW | 1 | -17.13 to -9.37 | 32.67 to 35.93 | -17.14 to -9.38 | 32.66 to 35.90 | OK | - |
| Maldives | MV | 1 | -1.00 to 7.50 | 72.50 to 74.00 | -0.69 to 7.11 | 72.69 to 73.75 | OK | - |
| Mali | ML | 2 | 10.10 to 25.00 | -12.30 to 4.30 | 10.14 to 25.00 | -12.26 to 4.24 | OK | - |
| Mauritius | MU | 2 | -20.53 to -19.97 | 57.30 to 57.81 | -20.53 to -19.97 | 57.30 to 57.81 | OK | - |
| Mexico | MX | 1 | 14.53 to 32.72 | -118.40 to -86.71 | 14.55 to 32.71 | -118.37 to -86.70 | OK | - |
| Moldova | MD | 1 | 45.47 to 48.49 | 26.62 to 30.13 | 45.46 to 48.49 | 26.62 to 30.13 | OK | - |
| Mongolia | MN | 1 | 41.58 to 52.15 | 87.74 to 119.93 | 41.59 to 52.13 | 87.74 to 119.91 | OK | - |
| Montenegro | ME | 1 | 41.85 to 43.56 | 18.43 to 20.36 | 41.85 to 43.55 | 18.43 to 20.36 | OK | - |
| Myanmar | MM | 1 | 9.60 to 28.50 | 92.20 to 101.20 | 9.79 to 28.54 | 92.17 to 101.17 | OK | - |
| Namibia | NA | 1 | -28.97 to -16.96 | 11.73 to 25.26 | -28.96 to -16.95 | 11.72 to 25.26 | OK | - |
| Nepal | NP | 1 | 26.35 to 30.45 | 80.06 to 88.20 | 26.34 to 30.42 | 80.03 to 88.17 | OK | - |
| Netherlands | NL | 5 | 50.75 to 53.58 | 3.36 to 7.23 | 50.75 to 53.55 | 3.36 to 7.23 | OK | - |
| Nigeria | NG | 8 | 4.27 to 14.00 | 2.70 to 14.70 | 4.27 to 13.88 | 2.67 to 14.67 | OK | - |
| NorthKorea | KP | 1 | 37.67 to 43.01 | 124.18 to 130.70 | 37.68 to 43.01 | 124.21 to 130.70 | OK | - |
| NorthMacedonia | MK | 1 | 40.86 to 42.37 | 20.46 to 23.04 | 40.85 to 42.37 | 20.44 to 23.01 | OK | - |
| Palestine | PS | 4 | 31.20 to 32.60 | 34.20 to 35.60 | 31.21 to 32.54 | 34.20 to 35.57 | OK | - |
| PapuaNewGuinea | PG | 1 | -11.66 to -1.32 | 140.84 to 155.96 | -11.64 to -1.35 | 140.85 to 155.97 | OK | - |
| Paraguay | PY | 1 | -27.61 to -19.29 | -62.65 to -54.26 | -27.59 to -19.29 | -62.65 to -54.24 | OK | - |
| Peru | PE | 1 | -18.35 to -0.04 | -81.33 to -68.65 | -18.34 to -0.03 | -81.34 to -68.68 | OK | - |
| Philippines | PH | 3 | 4.60 to 21.10 | 116.90 to 126.60 | 4.66 to 21.12 | 116.95 to 126.62 | OK | - |
| Poland | PL | 1 | 49.00 to 54.84 | 14.12 to 24.15 | 48.99 to 54.84 | 14.12 to 24.14 | OK | - |
| Portugal | PT | 1 | 36.96 to 42.15 | -9.50 to -6.19 | 36.96 to 42.15 | -9.50 to -6.19 | OK | - |
| Rwanda | RW | 1 | -2.84 to -1.04 | 28.86 to 30.90 | -2.83 to -1.06 | 28.86 to 30.89 | OK | - |
| SaoTomeAndPrincipe | ST | 1 | -0.04 to 1.71 | 6.46 to 7.46 | 0.02 to 1.70 | 6.46 to 7.46 | OK | - |
| Serbia | RS | 1 | 42.24 to 46.18 | 18.84 to 23.00 | 42.23 to 46.17 | 18.84 to 22.98 | OK | - |
| Seychelles | SC | 1 | -10.22 to -3.71 | 46.21 to 56.30 | -9.76 to -3.79 | 46.21 to 56.29 | OK | - |
| SierraLeone | SL | 1 | 6.90 to 10.00 | -13.30 to -10.27 | 6.92 to 10.00 | -13.30 to -10.28 | OK | - |
| Singapore | SG | 1 | 1.15 to 1.47 | 103.60 to 104.05 | 1.26 to 1.45 | 103.64 to 104.00 | OK | - |
| Slovakia | SK | 1 | 47.74 to 49.61 | 16.83 to 22.57 | 47.75 to 49.60 | 16.84 to 22.54 | OK | - |
| Somalia | SO | 3 | -1.70 to 12.00 | 40.90 to 51.40 | -1.70 to 11.99 | 40.97 to 51.42 | OK | - |
| SouthAfrica | ZA | 4 | -34.85 to -22.00 | 16.00 to 33.00 | -34.85 to -22.00 | 16.00 to 33.00 | OK | - |
| SouthKorea | KR | 1 | 33.11 to 38.62 | 124.61 to 131.87 | 33.20 to 38.62 | 124.61 to 131.86 | OK | - |
| SouthSudan | SS | 1 | 3.50 to 12.30 | 24.10 to 35.95 | 3.49 to 12.22 | 24.12 to 35.92 | OK | - |
| SriLanka | LK | 2 | 5.90 to 9.85 | 79.50 to 81.90 | 5.92 to 9.83 | 79.66 to 81.89 | OK | - |
| Suriname | SR | 1 | 1.83 to 6.00 | -58.07 to -53.96 | 1.83 to 6.01 | -58.07 to -53.99 | OK | - |
| Sweden | SE | 4 | 55.34 to 69.06 | 11.10 to 24.16 | 55.34 to 69.04 | 11.11 to 24.16 | OK | - |
| Syria | SY | 4 | 32.30 to 37.05 | 35.70 to 42.40 | 32.31 to 37.33 | 35.72 to 42.38 | OK | - |
| Tajikistan | TJ | 2 | 36.70 to 41.05 | 67.40 to 75.15 | 36.68 to 41.04 | 67.34 to 75.16 | OK | - |
| Tanzania | TZ | 4 | -11.80 to -1.00 | 29.30 to 40.45 | -11.73 to -0.99 | 29.32 to 40.45 | OK | - |
| Thailand | TH | 3 | 5.60 to 20.50 | 97.30 to 105.70 | 5.63 to 20.45 | 97.35 to 105.65 | OK | - |
| Togo | TG | 1 | 6.10 to 11.14 | -0.15 to 1.81 | 6.10 to 11.13 | -0.17 to 1.78 | OK | - |
| TrinidadAndTobago | TT | 1 | 10.04 to 11.36 | -61.93 to -60.50 | 10.04 to 11.35 | -61.93 to -60.52 | OK | - |
| Tunisia | TN | 5 | 30.20 to 37.60 | 7.50 to 11.60 | 30.23 to 37.34 | 7.48 to 11.56 | OK | - |
| Turkmenistan | TM | 1 | 35.10 to 42.80 | 52.40 to 66.70 | 35.14 to 42.79 | 52.44 to 66.65 | OK | - |
| Uganda | UG | 1 | -1.48 to 4.23 | 29.57 to 35.04 | -1.48 to 4.22 | 29.55 to 35.01 | OK | - |
| Uruguay | UY | 1 | -34.99 to -30.09 | -58.00 to -53.07 | -34.97 to -30.10 | -58.44 to -53.11 | OK | - |
| Uzbekistan | UZ | 3 | 37.20 to 45.60 | 55.95 to 73.20 | 37.19 to 45.56 | 55.98 to 73.15 | OK | - |
| WesternSahara | EH | 1 | 20.70 to 27.66 | -17.10 to -8.67 | 20.77 to 27.66 | -17.11 to -8.68 | OK | - |
| Zambia | ZM | 1 | -18.08 to -8.22 | 21.99 to 33.71 | -18.07 to -8.19 | 21.98 to 33.67 | OK | - |
| Zimbabwe | ZW | 1 | -22.42 to -15.61 | 25.24 to 33.06 | -22.40 to -15.62 | 25.22 to 33.04 | OK | - |
| Mayotte | YT | 1 | ? to ? | ? to ? | ? to ? | ? to ? | NE_NOT_FOUND | - |
| Reunion | RE | 1 | ? to ? | ? to ? | ? to ? | ? to ? | NE_NOT_FOUND | - |

---

## 3. Per-city centroid drift — flagged rows only

Audit cross-checked every cities.json row against:

- **Nominatim reverse** (`https://nominatim.openstreetmap.org/reverse?format=json&lat=<LAT>&lon=<LON>&zoom=10&addressdetails=1`) — what's at the centroid coord
- **Nominatim search** (`https://nominatim.openstreetmap.org/search?format=json&q=<NAME>&countrycodes=<ISO>&limit=1&addressdetails=1`) — what OSM thinks the city is

**No HIGH-severity country-claim mismatches found.** Both Nominatim reverse
and Nominatim search agreed with `cities.json#countryISO` for every city
where Nominatim returned data, with 4 expected territorial-status overlaps:

- **Hong Kong|HK** — Nominatim's reverse returns `country_code=CN` (HK is
  legally part of PRC). fajr correctly preserves HK as a separate dispatch
  with the IACAD/IslamicTrustHK method per the SAR's institutional
  practice. The political-overlap pattern is the same as IL/PS or MA/EH.
- **Laayoune|EH** — Nominatim returns MA (Western Sahara is administered
  by Morocco). fajr's EH row is preserved to surface the institutional
  question.
- **Mamoudzou|YT** — Nominatim returns FR (Mayotte is a French overseas
  department). fajr's YT row is preserved to dispatch the local
  Mawaqit-deployed method.
- **Saint-Denis|RE** — Nominatim returns FR (Réunion is a French overseas
  department). fajr's RE row is preserved similarly.

All four are intentional fajr design choices (preserve the dispatch that
matches local institutional practice, not the legal-sovereignty country code).
None require code changes.

The remaining flags are LOW or INFO:

- **centroid-drift (LOW)** — Nominatim's reverse-name at zoom=10 returned a
  *suburb of* the claimed city rather than the city itself. e.g. Manama BH
  centroid (26.23, 50.59) reverses to "Jid Hafs", which is a Manama suburb.
  Genuine bbox is correct; this is just a centroid-location property.
- **bbox-too-wide-vs-nominatim (LOW)** — fajr's bbox is >4× larger than
  Nominatim's OSM-administrative-boundary bbox for the same city. In every
  flagged case, the larger fajr bbox is intentional (metro vs. city-proper)
  and does not cross a national border. e.g. Berrechid MA: fajr 0.0224°²,
  Nominatim 0.0046°² — the city plus surrounding industrial zone.
- **bbox-too-narrow-vs-nominatim (INFO)** — fajr's bbox is >6× tighter than
  Nominatim's. This is *intentional* in every case (Sharjah AE, Astana KZ,
  6th of October EG etc. are listed in `BBOX_OVERRIDES` precisely to
  disambiguate from a parent metro).
- **admin-region-drift (INFO)** — `adminRegion` in cities.json doesn't match
  Nominatim's `address.state`. Mostly UK admin-history naming (West
  Yorkshire vs. England, Bedfordshire vs. Borough of Luton). Cosmetic.
- **political-overlap (INFO)** — The two intentionally contested rows
  (Jerusalem|PS, Laayoune|EH).

### 3.1 Flagged-rows table (229 of 477)

Sorted by ISO, only rows with at least one LOW/INFO finding. **No HIGH/MED
findings exist** — every row's claimed country is corroborated by Nominatim's
reverse + search verdicts.

The findings below are categorised:

- **bbox-too-wide-vs-nominatim (LOW)** = fajr's bbox is >4× the OSM
  administrative-boundary bbox for the same city. In every case the larger
  fajr bbox is intentional metro-buffer (vs. OSM's strict-city-only polygon).
  136 cities flagged; concentrated in MA (10), LB (2), CH (2), MA small towns.
- **bbox-too-narrow-vs-nominatim (INFO)** = fajr's bbox is >6× tighter than
  OSM's. In every case this is an intentional sibling-disambiguation override
  from `BBOX_OVERRIDES`. 46 cities flagged; concentrated in AE/SA/EG metro
  carve-outs (Sharjah, 6th of October, Dubai, Khobar, Dammam etc.).
- **centroid-drift (LOW)** = Nominatim's reverse-geocode at zoom=10 returned
  a suburb of the claimed city (e.g. Manama BH → "Jid Hafs", Ajman AE →
  "Hamidiya"). Centroid is in the right place; just the OSM name at that
  exact coord is a sub-place. 64 cities flagged.
- **admin-region-drift (INFO)** = `cities.json#adminRegion` differs from
  Nominatim's `address.state`. Common in the UK where fajr uses
  ceremonial-county names ("West Yorkshire") and Nominatim returns "England"
  at zoom=10. 22 cities flagged; mostly GB.
- **political-overlap (INFO)** = the two intentional IL↔PS / MA↔EH cases
  (Jerusalem|PS, Laayoune|EH).

| City | ISO | Centroid | Findings |
|------|-----|----------|----------|
| Abu Dhabi | AE | (24.45, 54.38) | centroid-drift(LOW) |
| Ajman | AE | (25.41, 55.51) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Al Ain | AE | (24.21, 55.74) | centroid-drift(LOW) |
| Dubai | AE | (25.20, 55.27) | bbox-too-narrow-vs-nominatim(INFO) |
| Fujairah | AE | (25.13, 56.33) | bbox-too-narrow-vs-nominatim(INFO) |
| Sharjah | AE | (25.35, 55.42) | bbox-too-narrow-vs-nominatim(INFO) |
| Tirana | AL | (41.33, 19.82) | bbox-too-wide-vs-nominatim(LOW) |
| Luanda | AO | (-8.84, 13.29) | centroid-drift(LOW) |
| Córdoba | AR | (-31.42, -64.19) | bbox-too-wide-vs-nominatim(LOW) |
| Mar del Plata | AR | (-38.00, -57.56) | bbox-too-wide-vs-nominatim(LOW) |
| Vienna | AT | (48.21, 16.37) | bbox-too-wide-vs-nominatim(LOW) |
| Baku | AZ | (40.41, 49.87) | bbox-too-narrow-vs-nominatim(INFO) |
| Mostar | BA | (43.34, 17.81) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW), admin-region-drift(INFO) |
| Sarajevo | BA | (43.86, 18.41) | bbox-too-wide-vs-nominatim(LOW) |
| Chittagong | BD | (22.36, 91.78) | centroid-drift(LOW), admin-region-drift(INFO) |
| Dhaka | BD | (23.81, 90.41) | bbox-too-wide-vs-nominatim(LOW) |
| Khulna | BD | (22.85, 89.54) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Rajshahi | BD | (24.36, 88.62) | bbox-too-narrow-vs-nominatim(INFO) |
| Sylhet | BD | (24.89, 91.87) | bbox-too-narrow-vs-nominatim(INFO) |
| Brussels | BE | (50.85, 4.35) | bbox-too-wide-vs-nominatim(LOW) |
| Liege | BE | (50.63, 5.58) | bbox-too-narrow-vs-nominatim(INFO) |
| Isa Town | BH | (26.18, 50.55) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Manama | BH | (26.23, 50.59) | centroid-drift(LOW) |
| La Paz | BO | (-16.49, -68.12) | bbox-too-narrow-vs-nominatim(INFO) |
| Brasília | BR | (-15.83, -47.92) | centroid-drift(LOW) |
| Curitiba | BR | (-25.43, -49.27) | bbox-too-wide-vs-nominatim(LOW) |
| Vancouver | CA | (49.28, -123.12) | bbox-too-wide-vs-nominatim(LOW) |
| Kinshasa | CD | (-4.44, 15.27) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Basel | CH | (47.56, 7.59) | bbox-too-wide-vs-nominatim(LOW) |
| Geneva | CH | (46.20, 6.14) | bbox-too-wide-vs-nominatim(LOW) |
| Zurich | CH | (47.38, 8.54) | bbox-too-wide-vs-nominatim(LOW) |
| Beijing | CN | (39.90, 116.41) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Shanghai | CN | (31.23, 121.47) | bbox-too-narrow-vs-nominatim(INFO) |
| Havana | CU | (23.11, -82.37) | centroid-drift(LOW) |
| Munich | DE | (48.14, 11.58) | bbox-too-wide-vs-nominatim(LOW) |
| Djibouti | DJ | (11.57, 43.15) | bbox-too-narrow-vs-nominatim(INFO) |
| Oran | DZ | (35.70, -0.63) | bbox-too-wide-vs-nominatim(LOW) |
| Setif | DZ | (36.19, 5.41) | bbox-too-wide-vs-nominatim(LOW) |
| Tlemcen | DZ | (34.89, -1.32) | bbox-too-wide-vs-nominatim(LOW) |
| 6th of October | EG | (29.94, 30.93) | bbox-too-narrow-vs-nominatim(INFO) |
| Alexandria | EG | (31.20, 29.92) | bbox-too-wide-vs-nominatim(LOW) |
| Mansoura | EG | (31.04, 31.38) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW), admin-region-drift(INFO) |
| Tanta | EG | (30.79, 31.00) | bbox-too-wide-vs-nominatim(LOW) |
| Laayoune | EH | (27.14, -13.19) | political-overlap(INFO), bbox-too-narrow-vs-nominatim(INFO), admin-region-drift(INFO) |
| Barcelona | ES | (41.39, 2.17) | bbox-too-wide-vs-nominatim(LOW) |
| Bilbao | ES | (43.26, -2.94) | bbox-too-wide-vs-nominatim(LOW) |
| Granada | ES | (37.18, -3.60) | bbox-too-wide-vs-nominatim(LOW) |
| Sevilla | ES | (37.39, -5.98) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Addis Ababa | ET | (9.03, 38.74) | centroid-drift(LOW) |
| Dire Dawa | ET | (9.59, 41.85) | bbox-too-narrow-vs-nominatim(INFO) |
| Jaamuuq | ET | (9.78, 41.65) | centroid-drift(LOW) |
| Bordeaux | FR | (44.84, -0.58) | bbox-too-wide-vs-nominatim(LOW) |
| Lille | FR | (50.63, 3.06) | bbox-too-wide-vs-nominatim(LOW) |
| Lyon | FR | (45.76, 4.84) | bbox-too-wide-vs-nominatim(LOW) |
| Mulhouse | FR | (47.75, 7.34) | bbox-too-wide-vs-nominatim(LOW) |
| Nantes | FR | (47.22, -1.55) | bbox-too-wide-vs-nominatim(LOW) |
| Nice | FR | (43.71, 7.26) | bbox-too-wide-vs-nominatim(LOW) |
| Paris | FR | (48.86, 2.35) | bbox-too-wide-vs-nominatim(LOW) |
| Toulouse | FR | (43.60, 1.44) | bbox-too-wide-vs-nominatim(LOW) |
| Libreville | GA | (0.42, 9.47) | centroid-drift(LOW) |
| Birmingham | GB | (52.49, -1.89) | admin-region-drift(INFO) |
| Bradford | GB | (53.80, -1.76) | admin-region-drift(INFO) |
| Coventry | GB | (52.41, -1.52) | admin-region-drift(INFO) |
| Leeds | GB | (53.80, -1.55) | admin-region-drift(INFO) |
| Leicester | GB | (52.64, -1.14) | admin-region-drift(INFO) |
| London | GB | (51.51, -0.13) | centroid-drift(LOW) |
| Luton | GB | (51.88, -0.42) | admin-region-drift(INFO) |
| Manchester | GB | (53.48, -2.24) | bbox-too-wide-vs-nominatim(LOW), admin-region-drift(INFO) |
| Sheffield | GB | (53.38, -1.47) | admin-region-drift(INFO) |
| Banjul | GM | (13.45, -16.58) | bbox-too-wide-vs-nominatim(LOW) |
| Georgetown | GY | (6.80, -58.16) | bbox-too-wide-vs-nominatim(LOW) |
| Banda Aceh | ID | (5.55, 95.32) | bbox-too-wide-vs-nominatim(LOW) |
| Bandar Lampung | ID | (-5.43, 105.26) | bbox-too-wide-vs-nominatim(LOW) |
| Bandung | ID | (-6.92, 107.62) | bbox-too-wide-vs-nominatim(LOW) |
| Banjarmasin | ID | (-3.32, 114.59) | bbox-too-wide-vs-nominatim(LOW) |
| Jambi | ID | (-1.61, 103.61) | bbox-too-narrow-vs-nominatim(INFO) |
| Mataram | ID | (-8.58, 116.12) | bbox-too-wide-vs-nominatim(LOW) |
| Medan | ID | (3.60, 98.67) | bbox-too-wide-vs-nominatim(LOW) |
| Palembang | ID | (-2.99, 104.76) | bbox-too-wide-vs-nominatim(LOW) |
| Pekanbaru | ID | (0.51, 101.45) | bbox-too-wide-vs-nominatim(LOW) |
| Pontianak | ID | (-0.03, 109.34) | bbox-too-wide-vs-nominatim(LOW) |
| Semarang | ID | (-6.97, 110.42) | bbox-too-wide-vs-nominatim(LOW) |
| Solo | ID | (-7.57, 110.83) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Surabaya | ID | (-7.26, 112.75) | bbox-too-wide-vs-nominatim(LOW) |
| Yogyakarta | ID | (-7.80, 110.37) | bbox-too-narrow-vs-nominatim(INFO), admin-region-drift(INFO) |
| Ahmedabad | IN | (23.02, 72.57) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Bangalore | IN | (12.97, 77.59) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Chennai | IN | (13.08, 80.27) | bbox-too-wide-vs-nominatim(LOW) |
| Hyderabad | IN | (17.39, 78.49) | bbox-too-wide-vs-nominatim(LOW) |
| Kolkata | IN | (22.57, 88.36) | bbox-too-wide-vs-nominatim(LOW) |
| Mumbai | IN | (19.08, 72.88) | bbox-too-wide-vs-nominatim(LOW) |
| Nagpur | IN | (21.15, 79.09) | bbox-too-wide-vs-nominatim(LOW) |
| Patna | IN | (25.59, 85.14) | bbox-too-wide-vs-nominatim(LOW) |
| Baghdad | IQ | (33.32, 44.37) | bbox-too-wide-vs-nominatim(LOW) |
| Karbala | IQ | (32.61, 44.02) | bbox-too-wide-vs-nominatim(LOW) |
| Mosul | IQ | (36.35, 43.16) | bbox-too-wide-vs-nominatim(LOW) |
| Najaf | IQ | (32.00, 44.33) | centroid-drift(LOW) |
| Ahvaz | IR | (31.32, 48.67) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Bandar Abbas | IR | (27.18, 56.27) | bbox-too-wide-vs-nominatim(LOW) |
| Hamadan | IR | (34.80, 48.51) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Kerman | IR | (30.28, 57.08) | bbox-too-narrow-vs-nominatim(INFO) |
| Qom | IR | (34.64, 50.87) | bbox-too-wide-vs-nominatim(LOW) |
| Tabriz | IR | (38.07, 46.30) | bbox-too-wide-vs-nominatim(LOW) |
| Yazd | IR | (31.90, 54.36) | bbox-too-narrow-vs-nominatim(INFO) |
| Milan | IT | (45.46, 9.19) | bbox-too-wide-vs-nominatim(LOW) |
| Naples | IT | (40.85, 14.27) | bbox-too-wide-vs-nominatim(LOW) |
| Palermo | IT | (38.12, 13.36) | bbox-too-wide-vs-nominatim(LOW) |
| Turin | IT | (45.07, 7.69) | bbox-too-wide-vs-nominatim(LOW) |
| Zarqa | JO | (32.07, 36.09) | bbox-too-wide-vs-nominatim(LOW) |
| Osaka | JP | (34.69, 135.50) | bbox-too-wide-vs-nominatim(LOW) |
| Tokyo | JP | (35.68, 139.65) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Mombasa | KE | (-4.04, 39.67) | centroid-drift(LOW) |
| Phnom Penh | KH | (11.56, 104.93) | centroid-drift(LOW) |
| Pyongyang | KP | (39.04, 125.76) | bbox-too-narrow-vs-nominatim(INFO) |
| Seoul | KR | (37.57, 126.98) | bbox-too-wide-vs-nominatim(LOW) |
| Kuwait City | KW | (29.38, 47.98) | centroid-drift(LOW) |
| Astana | KZ | (51.17, 71.45) | bbox-too-narrow-vs-nominatim(INFO) |
| Baalbek | LB | (34.01, 36.22) | bbox-too-wide-vs-nominatim(LOW) |
| Beirut | LB | (33.89, 35.50) | bbox-too-wide-vs-nominatim(LOW) |
| Sidon | LB | (33.56, 35.37) | bbox-too-wide-vs-nominatim(LOW) |
| Tripoli | LB | (34.43, 35.84) | bbox-too-wide-vs-nominatim(LOW) |
| Colombo | LK | (6.93, 79.86) | bbox-too-wide-vs-nominatim(LOW) |
| Sabratha | LY | (32.79, 12.49) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Berrechid | MA | (33.27, -7.59) | bbox-too-wide-vs-nominatim(LOW) |
| Erfoud | MA | (31.43, -4.24) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Errachidia | MA | (31.93, -4.42) | bbox-too-wide-vs-nominatim(LOW) |
| Fes | MA | (34.03, -5.00) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW), admin-region-drift(INFO) |
| Fquih Ben Salah | MA | (32.50, -6.90) | centroid-drift(LOW) |
| Guelmim | MA | (28.99, -10.06) | bbox-too-wide-vs-nominatim(LOW) |
| Ifrane | MA | (33.52, -5.11) | bbox-too-wide-vs-nominatim(LOW) |
| Kenitra | MA | (34.26, -6.58) | bbox-too-wide-vs-nominatim(LOW) |
| Khouribga | MA | (32.88, -6.91) | bbox-too-wide-vs-nominatim(LOW) |
| Marrakech | MA | (31.63, -7.98) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Meknes | MA | (33.89, -5.55) | bbox-too-wide-vs-nominatim(LOW), admin-region-drift(INFO) |
| Midelt | MA | (32.69, -4.74) | bbox-too-wide-vs-nominatim(LOW) |
| Nador | MA | (35.17, -2.93) | bbox-too-wide-vs-nominatim(LOW) |
| Ouarzazate | MA | (30.93, -6.94) | bbox-too-wide-vs-nominatim(LOW) |
| Oujda | MA | (34.68, -1.91) | bbox-too-wide-vs-nominatim(LOW) |
| Safi | MA | (32.30, -9.24) | bbox-too-wide-vs-nominatim(LOW) |
| Sefrou | MA | (33.83, -4.83) | bbox-too-wide-vs-nominatim(LOW) |
| Settat | MA | (33.00, -7.62) | bbox-too-wide-vs-nominatim(LOW) |
| Sidi Kacem | MA | (34.22, -5.71) | bbox-too-wide-vs-nominatim(LOW) |
| Tangier | MA | (35.76, -5.83) | bbox-too-wide-vs-nominatim(LOW), admin-region-drift(INFO) |
| Taourirt | MA | (34.41, -2.90) | bbox-too-wide-vs-nominatim(LOW) |
| Taza | MA | (34.21, -4.01) | bbox-too-wide-vs-nominatim(LOW) |
| Tetouan | MA | (35.57, -5.37) | bbox-too-wide-vs-nominatim(LOW), admin-region-drift(INFO) |
| Zagora | MA | (30.33, -5.84) | bbox-too-wide-vs-nominatim(LOW) |
| Bamako | ML | (12.64, -8.00) | bbox-too-wide-vs-nominatim(LOW) |
| Naypyidaw | MM | (19.76, 96.08) | centroid-drift(LOW) |
| Ulaanbaatar | MN | (47.89, 106.91) | bbox-too-narrow-vs-nominatim(INFO) |
| Nouakchott | MR | (18.07, -15.96) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Beau Bassin-Rose Hill | MU | (-20.23, 57.47) | bbox-too-narrow-vs-nominatim(INFO) |
| Malé | MV | (4.18, 73.51) | bbox-too-wide-vs-nominatim(LOW) |
| Kota Bharu | MY | (6.13, 102.24) | bbox-too-wide-vs-nominatim(LOW) |
| Kuala Lumpur | MY | (3.14, 101.69) | bbox-too-wide-vs-nominatim(LOW) |
| Nampula | MZ | (-15.12, 39.27) | bbox-too-narrow-vs-nominatim(INFO) |
| Ibadan | NG | (7.38, 3.95) | centroid-drift(LOW) |
| Kaduna | NG | (10.52, 7.44) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Kano | NG | (12.00, 8.59) | centroid-drift(LOW) |
| Lagos | NG | (6.52, 3.38) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Maiduguri | NG | (11.83, 13.15) | bbox-too-wide-vs-nominatim(LOW) |
| Port Harcourt | NG | (4.82, 7.05) | bbox-too-wide-vs-nominatim(LOW) |
| Sokoto | NG | (13.01, 5.25) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Eindhoven | NL | (51.44, 5.47) | bbox-too-wide-vs-nominatim(LOW) |
| Kathmandu | NP | (27.72, 85.32) | bbox-too-wide-vs-nominatim(LOW) |
| Auckland | NZ | (-36.85, 174.76) | centroid-drift(LOW) |
| Muscat | OM | (23.59, 58.41) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Cotabato | PH | (7.22, 124.25) | bbox-too-narrow-vs-nominatim(INFO), admin-region-drift(INFO) |
| Marawi | PH | (8.00, 124.29) | bbox-too-wide-vs-nominatim(LOW) |
| Bahawalpur | PK | (29.40, 71.67) | bbox-too-wide-vs-nominatim(LOW) |
| Faisalabad | PK | (31.42, 73.08) | bbox-too-wide-vs-nominatim(LOW) |
| Gujranwala | PK | (32.19, 74.19) | bbox-too-wide-vs-nominatim(LOW) |
| Hyderabad | PK | (25.40, 68.36) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Peshawar | PK | (34.02, 71.52) | bbox-too-wide-vs-nominatim(LOW) |
| Quetta | PK | (30.18, 66.97) | bbox-too-wide-vs-nominatim(LOW) |
| Gaza | PS | (31.50, 34.47) | bbox-too-wide-vs-nominatim(LOW) |
| Hebron | PS | (31.53, 35.10) | admin-region-drift(INFO) |
| Jerusalem | PS | (31.77, 35.21) | political-overlap(INFO), bbox-too-wide-vs-nominatim(LOW) |
| Ramallah | PS | (31.90, 35.20) | bbox-too-wide-vs-nominatim(LOW) |
| Alburikent (Dagestan) | RU | (42.92, 47.51) | centroid-drift(LOW) |
| Nazran (Ingushetia) | RU | (43.22, 44.77) | bbox-too-wide-vs-nominatim(LOW) |
| Hail | SA | (27.51, 41.72) | bbox-too-narrow-vs-nominatim(INFO) |
| Mecca | SA | (21.42, 39.83) | centroid-drift(LOW) |
| Tabuk | SA | (28.38, 36.55) | bbox-too-narrow-vs-nominatim(INFO) |
| Yanbu | SA | (24.02, 38.06) | admin-region-drift(INFO) |
| Victoria | SC | (-4.62, 55.45) | centroid-drift(LOW) |
| Omdurman | SD | (15.64, 32.48) | admin-region-drift(INFO) |
| Port Sudan | SD | (19.62, 37.22) | bbox-too-narrow-vs-nominatim(INFO) |
| Dakar | SN | (14.72, -17.47) | bbox-too-wide-vs-nominatim(LOW) |
| Mbour | SN | (14.42, -16.97) | bbox-too-wide-vs-nominatim(LOW) |
| Thies | SN | (14.79, -16.94) | bbox-too-wide-vs-nominatim(LOW) |
| Bosaso | SO | (11.28, 49.18) | bbox-too-narrow-vs-nominatim(INFO) |
| Mogadishu | SO | (2.05, 45.32) | centroid-drift(LOW) |
| Paramaribo | SR | (5.85, -55.20) | centroid-drift(LOW), bbox-too-wide-vs-nominatim(LOW) |
| Damascus | SY | (33.51, 36.28) | centroid-drift(LOW) |
| Idlib | SY | (35.93, 36.63) | bbox-too-narrow-vs-nominatim(INFO) |
| Lomé | TG | (6.17, 1.23) | bbox-too-wide-vs-nominatim(LOW) |
| Bangkok | TH | (13.76, 100.50) | bbox-too-narrow-vs-nominatim(INFO) |
| Narathiwat | TH | (6.43, 101.82) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Pattani | TH | (6.87, 101.25) | bbox-too-narrow-vs-nominatim(INFO) |
| Khujand | TJ | (40.29, 69.62) | bbox-too-wide-vs-nominatim(LOW) |
| Ben Gardane | TN | (33.14, 11.22) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Nabeul | TN | (36.46, 10.74) | centroid-drift(LOW) |
| Sousse | TN | (35.83, 10.64) | bbox-too-wide-vs-nominatim(LOW) |
| Tunis | TN | (36.81, 10.18) | bbox-too-wide-vs-nominatim(LOW) |
| Ankara | TR | (39.93, 32.86) | centroid-drift(LOW) |
| Antalya | TR | (36.88, 30.71) | centroid-drift(LOW) |
| Bursa | TR | (40.19, 29.06) | centroid-drift(LOW) |
| Diyarbakir | TR | (37.91, 40.23) | centroid-drift(LOW) |
| Eskisehir | TR | (39.78, 30.52) | centroid-drift(LOW) |
| Istanbul | TR | (41.01, 28.98) | bbox-too-wide-vs-nominatim(LOW) |
| Izmir | TR | (38.42, 27.14) | admin-region-drift(INFO) |
| Kayseri | TR | (38.73, 35.49) | centroid-drift(LOW) |
| Konya | TR | (37.87, 32.49) | centroid-drift(LOW) |
| Mersin | TR | (36.81, 34.64) | centroid-drift(LOW) |
| Samsun | TR | (41.29, 36.33) | bbox-too-narrow-vs-nominatim(INFO) |
| Trabzon | TR | (41.00, 39.72) | centroid-drift(LOW) |
| Port of Spain | TT | (10.65, -61.50) | bbox-too-wide-vs-nominatim(LOW) |
| Tanga | TZ | (-5.07, 39.10) | bbox-too-narrow-vs-nominatim(INFO) |
| Zanzibar | TZ | (-6.17, 39.20) | centroid-drift(LOW), bbox-too-narrow-vs-nominatim(INFO) |
| Minneapolis | US | (44.98, -93.27) | bbox-too-wide-vs-nominatim(LOW) |
| Philadelphia | US | (39.95, -75.17) | bbox-too-wide-vs-nominatim(LOW) |
| Bukhara | UZ | (39.77, 64.46) | bbox-too-wide-vs-nominatim(LOW) |
| Samarkand | UZ | (39.65, 66.96) | bbox-too-wide-vs-nominatim(LOW) |
| Maracaibo | VE | (10.67, -71.62) | centroid-drift(LOW) |
| Hanoi | VN | (21.03, 105.85) | bbox-too-narrow-vs-nominatim(INFO) |
| Pristina | XK | (42.66, 21.17) | bbox-too-wide-vs-nominatim(LOW) |
| Aden | YE | (12.79, 45.02) | bbox-too-wide-vs-nominatim(LOW) |
| Bajil | YE | (15.06, 43.28) | bbox-too-narrow-vs-nominatim(INFO) |

---

## 4. Cross-border audit — 78 border-zone cities

Methodology: for each cities.json row, computed the haversine distance from
the centroid to every Natural Earth foreign-country boundary segment
(boundary sampled at vertex granularity — fine enough for this audit). Any
city within 30 km of a non-claimed-country border is in the "border zone"
and flagged for review.

For each border-zone city, also checked whether any of the bbox's four
corners lie *inside* a neighbouring country's bbox AND within 5 km of that
country's actual polygon boundary — which is a fast proxy for cross-border
bbox extension.

### 4.1 Border-zone cities with bbox corners near a foreign border

The 49 cities below have at least one bbox corner within 5 km of a foreign
boundary. **All are already correctly routed** by `validate-city-registry.js`
(0 cross-border FAILs as of v1.7.19). The list is for ongoing monitoring:
these are the cities most likely to flake if the registry expands, the
detectCountry if-chain reorders, or a neighbouring-country bbox tightens.

| City | ISO | Centroid | Closest foreign border (km) | Watch-cluster |
|------|-----|----------|------------------------------|---------------|
| Baalbek | LB | 34.01, 36.22 | SY (0.2 km) | LB↔SY (Beqaa) |
| Nicosia | CY | 35.19, 33.38 | TRNC `-99` boundary (0.3 km) | CY↔Cyprus-Northern |
| Kinshasa | CD | -4.44, 15.27 | CG (0.7 km) | CD↔CG (Congo River) |
| Tripoli | LB | 34.43, 35.84 | SY (0.8 km) | LB↔SY (Akkar) |
| Djibouti | DJ | 11.57, 43.15 | Eritrea / Somalia coast (0.8 km) | DJ↔Horn |
| Akkar | LB | 34.54, 36.12 | SY (0.9 km) | LB↔SY |
| Bandar Seri Begawan | BN | 4.90, 114.94 | MY (0.9 km) | BN↔MY (Sarawak surrounds Brunei) |
| Kaedi | MR | 16.15, -13.50 | SN (1.0 km) | MR↔SN (Senegal River) |
| Antwerp | BE | 51.22, 4.40 | NL (1.1 km) | BE↔NL (BeNeLux border) |
| Tashkent | UZ | 41.30, 69.24 | KZ (1.1 km) | UZ↔KZ |
| Foz do Iguaçu | BR | -25.55, -54.59 | AR (1.3 km) | BR↔AR↔PY (Iguazu junction) |
| Vientiane | LA | 17.98, 102.63 | TH (1.3 km) | LA↔TH (Mekong) |
| Sialkot | PK | 32.49, 74.52 | IN (1.4 km) | PK↔IN (Wagah / Sialkot) |
| Niagara Falls | CA | 43.09, -79.08 | US (1.5 km) | CA↔US (Niagara River) |
| Hong Kong | HK | 22.32, 114.17 | CN (1.5 km) | HK↔CN (Shenzhen border) |
| Fujairah | AE | 25.13, 56.33 | OM (1.6 km) | AE↔OM (Musandam) |
| Toronto | CA | 43.65, -79.38 | US (1.7 km) | CA↔US |
| Saint-Denis | RE | -20.88, 55.45 | FR overseas (1.7 km) | RE↔FR (NE folds RE into FR) |
| Liège | BE | 50.63, 5.58 | NL (1.8 km) | BE↔NL |
| Singapore | SG | 1.35, 103.82 | MY (1.9 km), ID (2.6 km) | SG↔MY↔ID |
| Skopje | MK | 42.00, 21.43 | XK Kosovo (2.0 km) | MK↔XK |
| Geneva | CH | 46.20, 6.14 | FR (2.2 km) | CH↔FR |
| Maseru | LS | -29.32, 27.49 | ZA (2.2 km) | LS↔ZA |
| Jerusalem | PS | 31.77, 35.21 | JO (2.2 km) | IL↔PS↔JO |
| Al Ain | AE | 24.21, 55.74 | OM (2.2 km) | AE↔OM (Musandam interior) |
| Porto-Novo | BJ | 6.50, 2.63 | NG (2.3 km) | BJ↔NG |
| Ramallah | PS | 31.90, 35.20 | IL (2.4 km) | PS↔IL |
| Kota Bharu | MY | 6.13, 102.24 | TH (2.6 km) | MY↔TH (Sungai Golok) |
| Jerusalem | IL | 31.77, 35.21 | PS (2.7 km) | IL↔PS |
| Gaborone | BW | -24.63, 25.92 | ZA (2.8 km) | BW↔ZA |
| Almaty | KZ | 43.24, 76.89 | KG (2.8 km) | KZ↔KG |
| Lahore | PK | 31.55, 74.34 | IN (2.9 km) | PK↔IN (Wagah) |
| Strasbourg | FR | 48.57, 7.75 | DE (3.2 km) | FR↔DE (Rhine) |
| Podgorica | ME | 42.43, 19.26 | AL (3.2 km) | ME↔AL |
| Mulhouse | FR | 47.75, 7.34 | DE (3.3 km), CH (3.7 km) | FR↔DE↔CH (Rhine triple) |
| Asunción | PY | -25.26, -57.58 | AR (3.5 km) | PY↔AR (Pilcomayo) |
| Bratislava | SK | 48.15, 17.11 | HU (3.6 km) | SK↔HU↔AT |
| Khujand | TJ | 40.29, 69.62 | KG (4.0 km) | TJ↔KG |
| Basel | CH | 47.56, 7.59 | FR (4.0 km), DE (3.5 km) | CH↔FR↔DE (Rhine triple) |
| Ghent | BE | 51.05, 3.72 | NL (4.1 km) | BE↔NL |
| Banjul | GM | 13.45, -16.58 | SN (4.1 km) | GM↔SN (Gambia in Senegal) |
| Oujda | MA | 34.68, -1.91 | DZ (4.2 km) | MA↔DZ |
| Lille | FR | 50.63, 3.06 | BE (4.4 km) | FR↔BE |
| Bishkek | KG | 42.87, 74.57 | KZ (4.6 km) | KG↔KZ |
| Dearborn | US | 42.32, -83.18 | CA (4.6 km) | US↔CA (Detroit↔Windsor) |
| Brazzaville | CG | -4.26, 15.24 | CD (4.6 km) | CG↔CD (Congo River) |
| Lomé | TG | 6.17, 1.23 | GH (4.7 km) | TG↔GH |
| Eindhoven | NL | 51.44, 5.47 | BE (4.8 km) | NL↔BE |
| Mamoudzou | YT | -12.78, 45.23 | FR overseas (0.4 km) | YT↔FR (NE folds YT into FR) |

**No BBOX_OVERRIDE candidates needed.** Every city above is in the registry,
already routed correctly, and validated by the existing v1.7.19 v-validation
suite. The current overrides + ordering are sufficient. The list is
informational — the registry's existing "smaller-bbox-first" sort + the
Pass-B COUNTRY_BBOX_TABLE fallback already handles every case.

### 4.2 Cities NOT in the registry that would benefit from inclusion

Cities flagged in the v1.7.19 log as "pre-existing limitations not addressed
in this PR":

- **Iğdır TR** (39.92, 44.05) — currently routes to Armenia. Engine.js:114
  Armenia bbox [38.84, 41.30, 43.45, 46.62] catches it. Türkiye eastern bbox
  [37.05, 42.10, 26.0, 44.5] would also match but Armenia is checked first.
  If added to the registry with countryISO=TR, the Pass-B COUNTRY_BBOX_TABLE
  + city.countryISO override would correctly resolve to Türkiye. Iğdır is
  the easternmost province of Türkiye, contains a sizeable Muslim population,
  and currently has no fajr coverage.
- **Faizabad AF** (37.12, 70.58), **Ishkashim AF Wakhan** (37.0, 73.5) —
  routes to Tajikistan today. Engine.js:158 Tajikistan bbox catches them.
  Afghanistan main bbox is now lat 29.4–37 (capped at 37) so they fall
  through. Could be addressed by extending Afghanistan main lat-max from 37
  to 37.5, or by adding the cities with Pass-B fallback.
- **Hatay TR cities** (Antakya 36.20, 36.16; İskenderun 36.59, 36.17) —
  routes to Syria today (Syria's lon range 35.7–42.4 catches Hatay; Türkiye's
  W. bbox is lon 26.0–35.7). Hatay province is Türkiye's southernmost coastal
  province. Adding it to the registry with countryISO=TR + Pass-B
  COUNTRY_BBOX_TABLE should resolve correctly via the city.countryISO
  override path, but the detectCountry verdict alone would still say Syria.

These three are the highest-leverage detectCountry-coverage gaps; they each
correspond to a Muslim-population centre currently routed to a different
country. None are blocking — they require *adding* a city, not fixing one.

---

## 5. Country bbox-overlap matrix — fajr ordering vs geographic reality

Total fajr country-bbox-overlap pairs: 411. Of those, 267 reflect a real
shared land border (countries that genuinely abut each other on the ground);
the remaining 144 are bbox-coincidence (e.g. Algeria's bbox 19–37.1 / -8.7–12
overlaps Spain's 27.64–43.79 / -18.16–4.32 in the Atlantic, but the two
don't share a land border — Gibraltar Strait is sea).

The table below shows the **30 largest bbox-overlap pairs** (by overlap area
in degrees²) along with which country wins detectCountry's first-match
ordering.

| A | B | overlap (deg²) | Winner (first-match) | Notes |
|---|---|---:|---|---|
| China | Russia | 757.91 | China | China listed earlier; CN cities at lat 41–53 / lon 87–134 (Heilongjiang etc.) — fajr correctly routes to China |
| Kazakhstan | Russia | 535.19 | Kazakhstan | KZ checked before Russia; KZ lon-min 50.0 caps the western reach; Russia catches western Russia |
| USA | Canada | 442.50 | USA | USA bbox lat 24–49 fully contains S. Canada (Toronto 43.65 etc.) — Pass-B COUNTRY_BBOX_TABLE + city.countryISO=CA override handles this |
| India | China | 414.43 | India | IN listed before CN; Aksai Chin / Arunachal contested area falls to whoever's bbox contains the point first (IN's bbox 6.5–35.5 / 68–97.4 includes the contested zone) |
| Mongolia | China | 340.25 | Mongolia | MN bbox is smaller (lat 41.58–52.15 / lon 87.74–119.93); listed first |
| Mongolia | Russia | 340.25 | Mongolia | Same; MN beats both larger neighbours |
| USA | Mexico | 276.34 | USA | US lat 24–49; Mexico 14.53–32.72; overlap zone is ~lat 24–32, fully inside USA's bbox; MX lon-max -86.71 keeps GoM separation |
| Japan | China | 254.56 | Japan | JP lat 24.05–45.55 / lon 122.93–153.99; CN lon-max 134.77; overlap is in the East China Sea — bbox-coincidence, not real border |
| Argentina | Brazil | 238.44 | Argentina | AR listed first; real border (Iguazu/Uruguay River) — fajr correctly routes Foz do Iguaçu BR to BR via city.countryISO override |
| Chile | Argentina | 237.95 | Chile | CL listed first (long N-S strip); AR catches mainland AR |
| Norway | Russia | 197.76 | Norway | Bbox-coincidence (Barents Sea); real border is at lon 28-32 N. Norway/Murmansk |
| Bolivia | Brazil | 195.00 | Bolivia | BO smaller; real border (Pantanal) |
| Kazakhstan | China | 181.53 | Kazakhstan | Real Tian-Shan / Dzungarian-gate border |
| Sweden | Norway | 170.56 | Sweden | SE listed first; long Scandinavian peninsular border |
| Finland | Norway | 156.00 | Finland | FI listed before NO |
| Finland | Russia | 148.32 | Finland | Karelian border |
| Ukraine | Russia | 144.46 | Ukraine | Real border |
| Japan | Russia | 135.42 | Japan | Sakhalin / Kuriles bbox-overlap |
| **Algeria** | **Spain** | **123.17** | **Algeria** | **Bbox-coincidence (Mediterranean)**, no real land border. Spain's bbox lon-min -18.16 includes Canary Islands which are in Atlantic. Not a routing concern in practice (no fajr cities at sea). |
| Chile | Brazil | 122.94 | Chile | Bbox-coincidence (no real CL↔BR border) |
| **Morocco** | **Spain** | **110.75** | **Morocco** | **Real Strait of Gibraltar** — Ceuta + Melilla (Spanish exclaves on Moroccan coast) currently route to Morocco via Morocco-first ordering. Ceuta (35.89, -5.32) is inside Morocco's bbox lat 27–36.5 / lon -14 to -1.5 → returns Morocco, not Spain. **Real ikhtilaf**: Ceuta/Melilla are Spanish administratively but Habous-method-aligned in practice. fajr's verdict is operationally correct; flagged for awareness. |
| Afghanistan | Pakistan | 109.82 | Afghanistan | v1.7.19 split (Wakhan corridor + main) handles this correctly |
| Angola | DRCongo | 106.45 | Angola | Real border; Cabinda exclave handled via tightened Angola lat-max -4.50 |
| Malaysia | Indonesia | 105.00 | Malaysia | Real border (Borneo); Pekanbaru ID resolved via v1.7.19 lat-min tightening to 1.0 |
| Myanmar | India | 98.28 | Myanmar | Real Mizoram border |
| Peru | Brazil | 97.78 | Peru | Real Acre/Madre de Dios border |
| Myanmar | China | 93.06 | Myanmar | Real Yunnan border |
| Uzbekistan | Kazakhstan | 87.98 | Uzbekistan | Real border |
| Venezuela | Colombia | 85.01 | Venezuela | Real Guajira border |
| Pakistan | India | 82.60 | Pakistan | Real Wagah border |

The order is **operationally correct in every case** for the cities currently
in the registry. The two flagged rows (Algeria/Spain, Morocco/Spain) reflect
geographic peculiarities that don't affect fajr routing today — Spain's
Canary Islands and African exclaves don't have registered cities, and the
Strait of Gibraltar geography makes Morocco-first the right choice for the
North African Mediterranean coast.

### 5.1 Pairs with NON-real overlap (Atlantic / Pacific / sea-coincidence)

These 144 pairs reflect bbox geometry rather than actual neighbour
relationships. They are not actionable — no fajr city sits in open ocean —
but listed here for the next-round reviewer:

(Truncated — see `/tmp/fajr-bbox-research/country-overlap-matrix.json` for
the full 144-row list.)

---

## 6. Recommended next-round corrections

Ranked by impact (Muslim population × magnitude of error). All are deferred
recommendations — the user explicitly asked for read-only research with no
engine changes.

### 6.1 HIGH-IMPACT (resolve >100K Muslim users' coverage)

1. **Iran NW corner extension** — Engine.js:155, currently
   `if (lat >= 25 && lat <= 39 && lon >= 47 && lon <= 63) return 'Iran'`.
   Natural Earth shows Iran extends to lat 39.78°N (Aras River with Armenia)
   and lon 44.02°E (Maku, Khoy in W. Azerbaijan province). Recommended:
   widen to `lat <= 39.8` and `lon >= 44`. Currently affects Maku IR (~37K
   pop) and any future Khoy/Urmia coverage. **TOO_NARROW** flag.

2. **Iran lon-min hole (Iranian Kurdistan)** — same line. Iran's bbox starts
   at lon 47, but the country extends west to 44°E (W. Azerbaijan / Kurdistan
   provinces). If the proposed change above is applied (lon >= 44), still
   need to verify no Iraqi-border leak — Iraq's bbox is lat 29-37.4 / lon
   38.8-48.6, so there's overlap at lon 44-48. Recommend: keep Iraq before
   Iran (currently Iraq is at line 105, Iran at 155 — Iraq wins, correct).

3. **Hatay TR coverage gap** — currently routes to Syria. Recommend either:
   (a) add Hatay carve-out to detectCountry between Syria and Türkiye
       checks (engine.js around line 104):
       `if (lat >= 35.5 && lat <= 36.7 && lon >= 35.7 && lon <= 36.5)
       return 'Turkey'` (covers Hatay province + Iskenderun), OR
   (b) add Antakya / İskenderun as registry cities with countryISO=TR; the
       Pass-B COUNTRY_BBOX_TABLE Turkey entry already covers them
       conceptually but the if-chain returns Syria first. Pass-B falls
       through to Syria's verdict because Pass-A only fires when there's a
       matching city. So Pass-B alone doesn't fix.
   Recommend (a) for engine-level correctness.

4. **Iğdır TR coverage gap** — routes to Armenia. Engine.js:114 Armenia
   bbox catches it. Real fix is adding an Iğdır carve-out to detectCountry.
   Recommend a 2-row addition between Armenia and Türkiye:
   `if (lat >= 39.78 && lat <= 40.05 && lon >= 43.86 && lon <= 44.30)
   return 'Turkey'` — covers Iğdır province only.

5. **Afghanistan main lat-max bump** — currently `lat <= 37` for the main
   bbox catches Kabul/Kandahar/Mazar but excludes Faizabad (37.12) and
   parts of Badakhshan. NE shows AF extends to lat 38.49 in Badakhshan.
   Recommend bumping lat-max from 37 to 37.5 in the main bbox; the Wakhan
   corridor entry (lat 36.5-38.5) already covers the corridor proper.

### 6.2 MED-IMPACT (administrative cleanup, registry correctness)

6. **Türkiye legacy bbox removal** — Engine.js:177
   `if (lat >= 35 && lat <= 43 && lon >= 25 && lon <= 45) return 'Turkey'`.
   This is shadowed by the v1.7.19 split at lines 127-128 and is dead code.
   Recommend removing for clarity.

7. **Sudan duplicate bbox removal** — Engine.js:297 duplicates the
   line 146 early-Sudan check. Both have the same range
   [9.5, 22, 21.8, 38.6]. The first one runs and matches; the second is
   dead. Recommend removing the duplicate at line 297 OR removing the
   early check at line 146 (the early check exists specifically to claim
   Port Sudan SD before SaudiArabia's bbox catches it, so keep early
   check + remove the late one).

8. **Kazakhstan W. coverage extension** — Engine.js:172, currently
   `lon >= 50.0`. NE shows KZ extends to lon 46.49 (W. Kazakhstan oblast,
   Atyrau capital region). Tightened in v1.7.5 to 50 to avoid Russian
   Caucasus. The actual KZ-RU border in this longitude range is at
   lat 47-48; if Atyrau (47.10, 51.92) and Aktobe (50.30, 57.16) need
   coverage they're already inside. Oral / Uralsk KZ at (51.23, 51.37) is
   inside. The 46.49 issue is only relevant if a city in KZ's western tip
   is added — none currently. **No action needed.**

9. **Mauritania southern lat extension** — Engine.js:311 currently
   `lat >= 16.04`. NE shows MR extends to lat 14.73 (S. tip near
   Diama on the Senegal River). Senegal's lat-max 16.04 (line 310) is
   tight against the Senegal River border. Recommended: keep as-is unless
   a S. Mauritanian border city is added.

10. **Russia lon-max extension** — Engine.js:722 `lon <= 169.05`. NE
    shows Russia extends to lon 180 (and across the antimeridian; Wrangel
    Island at 179°E and Big Diomede). Eastern Chukotka (Anadyr at 64.73,
    177.50) currently lies at lon 177.50 < 169.05 → falls through to null
    or USA's bbox (which is lon -125 to -66, doesn't catch Chukotka).
    **TOO_NARROW**. Recommend `lon <= 180`. No fajr cities currently
    affected, but a Chukotka / Anadyr / Vladivostok-east entry would
    miss otherwise.

### 6.3 LOW-IMPACT (cosmetic)

11. **Türkiye lat-max** — currently 42.10. NE shows TR extends to lat
    42.10 in Trabzon's hinterland. Boundary already correctly tight.
    No action.

12. **UK Northern Ireland verification** — UK bbox lat 49-62 / lon -9-2.5
    catches NI (Belfast 54.6, -5.93) ✓. NE mainland-only bbox is 49.91-
    60.85 / -8.65-1.76. fajr's looser bbox is fine. No action.

13. **Cyprus bbox** — fajr 34.55-35.71 / 32.27-34.60. NE 34.63-35.19 /
    32.27-34.10. fajr extends 0.52° north and 0.50° east. Northern Cyprus
    (TRNC) extends to ~35.7°N — fajr's looser bbox correctly includes it.
    The "extra_east 0.50°" is in the Mediterranean Sea past Famagusta. No
    action.

14. **Adminregion field GB cities** — claimed `adminRegion="West Yorkshire"`
    etc. Nominatim returns "England" at this granularity. Cosmetic; the
    registry is more specific than Nominatim's `state` resolution. No
    action.

### 6.4 Watch list (no change yet, but flag for recurring audit)

- **Belgium↔Netherlands border** — Antwerp BE, Eindhoven NL, Liège BE,
  Ghent BE, Maastricht NL all sit within 5 km of the BE↔NL border. The
  v1.7.19 NL-before-BE-before-FR ordering at engine.js:272-274 is
  load-bearing. Any reorder could regress. Already covered by the validate
  suite.
- **PK↔IN Wagah corridor** — Sialkot PK + Lahore PK both within 3 km of
  the IN border. v1.7.19 BBOX_OVERRIDES['Sialkot|PK'] tightening is
  load-bearing.
- **HK↔CN Shenzhen** — Hong Kong bbox 22.15-22.56 / 113.83-114.45 is
  carved out before China's bbox at engine.js:556. The Shenzhen border
  is at lat 22.55. fajr's lat-max 22.56 includes a sliver of Shenzhen
  but Pass-B / city.countryISO override handles this.
- **CH↔FR↔DE Rhine triple** — Basel CH, Mulhouse FR, Strasbourg FR,
  Geneva CH all border-zone. Already correctly routed via v1.7.5
  reordering + v1.7.8 Switzerland lat-max tightening.

---

## 7. Methodology + caveats

### Data sources used

1. **Nominatim** (`https://nominatim.openstreetmap.org`) — OpenStreetMap's
   public reverse-geocoding service, run by the OpenStreetMap Foundation.
   Free, no API key, ODbL data licence. User chose this over Google because
   (a) free + no key, (b) no usage tracking of Muslim users' coordinate
   queries, (c) underlying data community-contributed under ODbL, (d)
   self-hostable for high-volume work. Two endpoints used per city:
   - `GET /reverse?format=json&lat=<LAT>&lon=<LON>&zoom=10&addressdetails=1`
   - `GET /search?format=json&q=<NAME>&countrycodes=<ISO>&limit=1&addressdetails=1`

   1.1s rate-limit, custom User-Agent
   `fajr-research/1.0 (https://github.com/tawfeeqmartin/fajr; tawfeeqmartin@gmail.com)`
   per the Nominatim Usage Policy. Total queries: 477 reverse + 477 search
   = 954 requests, run sequentially over ~17 minutes. Zero rate-limit
   responses observed. All responses cached at
   `/tmp/fajr-bbox-research/nominatim-cache/<safekey>.json`.

2. **Natural Earth** 1:10m admin_0_countries
   (`https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson`)
   — public-domain (Creative Commons CC0) cartographic dataset. 258
   features (countries + dependencies). Used for ground-truth
   country-polygon bbox + boundary-distance computation.

3. **Google Maps reverse-geocoding** — NOT USED in this audit. The user
   explicitly asked for fiqh-advised alternatives to Google. No tie-breaker
   needs arose where a Google query would have changed a verdict; the
   Nominatim-vs-Natural-Earth cross-check was sufficient.

### Verdict thresholds

- Per-country: 0.50° (~55 km) tolerance for OK. Anything tighter would
  flag legitimate metropolitan-area approximations and ocean-edge gaps
  as false positives.
- Per-city: 4× area ratio for "bbox-too-wide" flag (fajr 4× larger than
  Nominatim); 6× ratio for "bbox-too-narrow" (fajr 6× tighter). These
  thresholds were chosen so intentional metro-tightening (Sharjah AE,
  6th of October EG, Geneva CH) doesn't drown out genuine signals.
- Border-zone: 30 km centroid-to-foreign-boundary cutoff. Below 30 km =
  "border-zone" (worth watching). Below 5 km bbox-corner-to-foreign-
  boundary = "possible bbox-corner leak" (verify with samples).

### Mainland-only NE bbox overrides

For 17 countries whose Natural Earth polygon is a MultiPolygon spanning
overseas territories or distant islands, I used a hand-curated mainland
bbox in the audit script. These overrides are documented inline in
`/tmp/fajr-bbox-research/per-country-audit.js`. Examples:

- France: `[41.36, 51.09, -5.14, 9.56]` (excludes French Guiana, Réunion,
  Mayotte, French Polynesia, etc.)
- UK: `[49.91, 60.85, -8.65, 1.76]` (excludes Falklands, BIOT, Pitcairn,
  Channel Islands)
- USA: `[24.5, 49.4, -125, -66.9]` (CONUS only — Alaska, Hawaii, USMOI
  excluded since fajr's USA bbox is CONUS-only)
- Russia: `[41.19, 81.86, 19.64, 180]` (mainland; NE wraps Wrangel/Big
  Diomede across the antimeridian)
- Spain: `[36.0, 43.79, -9.30, 4.32]` (excludes Canary Islands at lat 28°)
- Indonesia, Philippines, Japan, Australia, NZ, Chile, Ecuador,
  Mauritius, Cape Verde, HK, Iceland, Italy, Norway, Portugal —
  similar mainland-or-main-archipelago overrides.

For Mauritius specifically, the override [-20.53, -19.97, 57.30, 57.81]
is the main island only; Rodrigues (-19.7, 63.4), Cargados Carajos
(16.5°S 59.6°E) and Agalega (10.4°S 56.6°E) are not in fajr's registry
and not in fajr's bbox — they would fall through to Seychelles or null.

### Edge cases skipped

- **Israel ↔ Palestine** — political boundaries are contested. The
  audit treats IL/PS country-claim disagreement as "political-overlap"
  (INFO-severity, not flagged).
- **Morocco ↔ Western Sahara** — same as above. Laayoune EH centroid
  reverses to MA via Nominatim (which respects Morocco's de-facto
  administration); the EH row is correctly preserved in fajr to surface
  the institutional question.
- **Russia border with Wrangel Island** — Chukotka extends past the
  antimeridian; bbox arithmetic across the dateline isn't handled in
  this audit. Would need a separate fixture set.
- **Antarctica** — none of fajr's countries claim Antarctic territory in
  the engine; NE Antarctic claims are stripped via the mainland-only
  overrides.

### Reproduction

```
# Fetch Natural Earth polygons (cache invalidates on upstream commit hash):
curl -fsSL "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson" \
  -o /tmp/fajr-bbox-research/ne_10m_admin_0_countries.geojson

# Compute NE country bboxes:
node /tmp/fajr-bbox-research/compute-ne-bboxes.js
# → /tmp/fajr-bbox-research/ne-country-bboxes.json

# Extract engine.js bboxes:
node /tmp/fajr-bbox-research/extract-engine-bboxes.js
# → /tmp/fajr-bbox-research/engine-country-bboxes.json

# Per-country audit (engine vs NE):
node /tmp/fajr-bbox-research/per-country-audit.js
# → /tmp/fajr-bbox-research/per-country-audit.json

# Country-overlap matrix:
node /tmp/fajr-bbox-research/country-overlap-matrix.js
# → /tmp/fajr-bbox-research/country-overlap-matrix.json

# Border-zone audit (cities near foreign borders):
node /tmp/fajr-bbox-research/border-zone-audit.js
# → /tmp/fajr-bbox-research/border-zone-audit.json

# Nominatim queries (1 req/sec, 17 min for 477 cities):
node /tmp/fajr-bbox-research/nominatim-cities.js
# → /tmp/fajr-bbox-research/nominatim-cache/<key>.json (per city)

# Per-city audit (against Nominatim):
node /tmp/fajr-bbox-research/per-city-audit.js
# → /tmp/fajr-bbox-research/per-city-audit.json
```

All outputs cached locally; rerun is instant.

---

— fajr-claude
