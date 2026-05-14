# City Geometry Audit

Last refreshed: 2026-05-14

`detectLocation()` intentionally ships a compact offline bbox registry rather
than raw municipal polygons. The bbox layer is fast and small enough for
browser/mobile use, but it still needs independent geometry QA because many
rows begin as population-radius rectangles and are only tightened when a leak
is found.

The geometry audit workflow is advisory. It compares reviewed external city
geometry against `src/data/cities.json`, emits reports, and proposes rows for
human review. It must not mutate the runtime registry automatically.

## Policy

- Runtime stays bbox-based and offline.
- Runtime bboxes are lookup cells, not legal municipal polygons. When neighbor
  rectangles would overlap, reviewed bbox proposals may be clipped to preserve
  deterministic `detectLocation()` routing; document the clip in the source map.
- Raw WOF/OSM/Overture/official polygons stay in `.cache/city-geometry/`, not
  in `src/`, not in git, and not in the npm package.
- OSM and Overture are audit-only by default because their city geometry is
  ODbL. Do not ship OSM/Overture-derived bboxes under the MIT package without
  explicit license review.
- Who's On First / Geocode Earth is the preferred bulk locality source, but
  row-level source provenance still needs review before using derived values.
- geoBoundaries, Natural Earth, GeoNames, HDX/OCHA, and official local sources
  can support audits, but their granularity and licenses differ by country.
- GADM is not suitable for bundled fajr data because its license is
  academic/non-commercial and restricts redistribution.

## Source Map

Reviewed external IDs belong in `scripts/data/city-geometry-sources.json`.
The source map stores metadata and cache pointers only. The current seed covers
41 high-priority rows: 15 Morocco/Habous phase-1 rows, 5 UAE metro rows, 10
Turkey large-city rows, 1 Detroit/Windsor border row, 3 Geneva border rows, 2
Strasbourg/Kehl border rows, and 5 existing registry warning rows. It carries
17 OSM relation rows plus 37 WOF
rows across reviewed locality/county candidates. Morocco rows with WOF-backed
runtime status are separated from OSM-only audit candidates; Jerusalem
intentionally remains without a geometry candidate until a human routing
decision is available.

```json
{
  "$schema_doc": "Build-time geometry source map for auditing src/data/cities.json bboxes. Raw geometry stays outside npm in .cache/city-geometry.",
  "version": 1,
  "updated": "2026-05-08",
  "cacheRoot": ".cache/city-geometry",
  "cities": [
    {
      "cityKey": "Rabat|MA",
      "priority": ["phase-1-morocco", "habous"],
      "review": {
        "status": "unreviewed",
        "issue": 118,
        "notes": ["Habous ID is prayer-time provenance, not geometry."]
      },
      "geometries": [
        {
          "provider": "wof",
          "stableId": "wof:locality:<reviewed-id>",
          "cacheFile": "MA/rabat/wof-locality.geojson",
          "sourceConfidence": "high",
          "matchConfidence": "candidate",
          "licenseUse": "audit-and-reviewed-bbox-proposal",
          "reviewStatus": "candidate"
        }
      ]
    }
  ]
}
```

Use stable provider IDs: WOF IDs/GIDs, OSM relation IDs, Overture GERS IDs, or
official local authority IDs. Do not store Nominatim `place_id`; it is not a
stable external identifier. The current OSM relation IDs are audit-only
candidates, not bundled source data and not approved sources for deriving MIT
package bboxes without license review. WOF candidates are still candidates:
locality records are preferred, while county-level WOF records are marked
medium confidence because their placetype can over-cover the city row.

## Source Findings

The #118 Morocco pass now has enough evidence to separate runtime-ready bbox
sources from source leads:

- **WOF locality envelopes are runtime-usable after row review.** This is the
  path used for Rabat, Agadir, Berrechid, Settat, Sefrou, Tangier, Nador,
  Oujda, Fes, Basel, and Mulhouse. Current locality rows with matching OSM
  admin-8 envelopes are the strongest candidates.
- **WOF county envelopes are not automatically runtime-usable.** Casablanca is
  the exception: its WOF locality rows were deprecated/point-like, while the
  current county envelope matched OSM admin-8 closely. Sale, Meknes, Tetouan,
  Temara, and Inezgane do not yet meet that bar; their available WOF rows are
  either broad county/prefecture envelopes or point-like localadmin/locality
  records.
- **OSM relation geometry is audit-only for now.** It is useful as an
  independent shape check and often carries `ref:MA:HCP`, but OSM-derived bbox
  edits need license review before entering the MIT package.
- **HDX / OCHA COD-AB Morocco is authoritative but too coarse for city-cell
  tightening.** The public Morocco COD-AB package is HCP-derived, reviewed for
  humanitarian use, and CC BY 3.0 IGO, but the available package is admin
  level 0-2 only, not commune/city level.
- **geoBoundaries currently does not solve the Morocco city layer.** The public
  HDX geoBoundaries mirror exposes ADM0-ADM2 for Morocco, and current API
  probes for MAR ADM3/ADM4 returned no layer.
- **SIG-Maroc / HCP-linked commune files are a promising source lead, not a
  runtime source yet.** SIG-Maroc publishes commune-level downloads and 2024
  census joins, but the site itself says the geometry is assembled from
  multiple sources; source and license provenance need review before any bbox
  can be derived from it.

Practical rule for the remaining Morocco rows: do not tighten from WOF
county/prefecture bboxes or OSM alone. Either find a reviewed WOF locality
polygon, verify an official/commune-level source with compatible licensing, or
leave the row as a documented audit gap.

The first UAE pass shows a different pattern:

- Abu Dhabi and Al Ain have current WOF locality envelopes that expand the
  shipped city lookup cells without colliding with neighboring fajr rows, so
  they are runtime-ready.
- Dubai, Sharjah, and Ajman also have current WOF locality envelopes, but their
  rectangular envelopes overlap heavily. Dubai, Sharjah, and Ajman now use
  explicit clipped runtime cells: Dubai's northern edge meets Sharjah's
  southern edge, and Ajman starts at Sharjah's WOF north edge.

The first Turkey pass is cleaner:

- Current WOF locality envelopes are runtime-ready for Istanbul, Ankara, Izmir,
  Bursa, Konya, Gaziantep, Adana, Antalya, Samsun, and Trabzon. These replace
  broad population-radius lookup cells and preserve each city centre.
- Ambiguous Turkish rows remain source leads, not runtime inputs: Diyarbakir
  and Eskisehir use superseding rows marked `mz:is_current = -1`, Kayseri is
  point-like, and Mersin did not surface a clean city locality row in the WOF
  scan.

The Detroit/Windsor border seam needs clipping rather than direct WOF copying:

- Windsor, Ontario has a clean current WOF locality row, but its rectangular
  envelope crosses the Detroit River into Detroit/Dearborn. The runtime cell is
  clipped at the river seam while Detroit and Dearborn are clipped north of the
  same seam.

The Geneva/French-border seam is cleaner with WOF locality rows:

- Geneva's old population-radius cell swallowed adjacent French towns. WOF
  current locality rows let the runtime keep Geneva city provenance while
  routing Annemasse and Ferney-Voltaire to France.

The Strasbourg/Kehl Rhine seam requires a clipped WOF application:

- Both cities have current WOF locality rows, but the raw rectangular
  envelopes overlap across the Rhine. Strasbourg is clipped just west of
  Kehl's WOF west edge; Kehl uses its WOF envelope.

The Brazzaville/Kinshasa Congo River seam requires a clipped WOF application:

- Brazzaville uses its WOF locality envelope. Kinshasa uses the WOF
  south/west/east edges but keeps the north edge clipped at `-4.36` so the
  runtime does not fill the river gap or absorb Brazzaville.

The Singapore/Johor Bahru border seam also requires clipping:

- Singapore has a current WOF locality row sourced to Singapore government
  geometry. The full rectangle reaches north of fajr's safe city seam, so the
  runtime cell uses the WOF west/east/south edges and clips north to `1.4499`.
- Johor Bahru has a current WOF locality row, plus a point-like alternate
  spelling row. The runtime cell uses the WOF north/east/west extents and clips
  south to `1.45`, preserving city provenance on both sides of the Causeway.

The Klang Valley metro should not be represented as only Kuala Lumpur and Shah
Alam:

- WOF has current locality rows for Kuala Lumpur, Shah Alam, Petaling Jaya,
  Subang Jaya, and Klang. Petaling Jaya and Klang are now bundled as distinct
  registry rows, all inheriting the Malaysia/JAKIM country default.
- Kuala Lumpur, Petaling Jaya, and Klang use current WOF locality envelopes
  directly. Shah Alam clips between Klang and Petaling Jaya, and Kuala Lumpur
  clips west of Petaling Jaya, so each runtime rectangle validates to itself.
- Subang Jaya remains a reviewed-but-unshipped lead: its WOF rectangle is
  nested inside Petaling Jaya, and a single rectangular runtime cell would break
  the current validator. It should wait for polygon/split-cell support or a
  separate reviewed local source.
- This is a provenance/routing fix, not a prayer-math change. The Malaysia
  timezone and country default remain unchanged across the cluster.

The Pakistan Punjab Sialkot/Gujranwala overlap has a small, source-backed fix:

- WOF has current locality rows for Lahore, Gujranwala, and Sialkot. This pass
  ships only Sialkot because the concrete runtime bug was a remaining overlap:
  Gujranwala north-east coordinates such as `(32.42, 74.46)` resolved to
  Sialkot.
- Sialkot now uses the reviewed WOF current locality envelope. Lahore and
  Gujranwala WOF rows remain reviewed leads, not runtime changes, to avoid a
  broader coverage shift in the same PR.
- This is a Pakistan city-provenance fix only. Country, timezone, and Karachi
  method routing remain unchanged.

Reference URLs checked in this pass:

- HDX Morocco COD-AB:
  `https://data.humdata.org/dataset/cod-ab-mar`
- OCHA COD-AB guidance:
  `https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/2557378679/`
- geoBoundaries API:
  `https://www.geoboundaries.org/api.html`
- SIG-Maroc administrative boundaries:
  `https://www.sig-maroc.com/donnees/limites-administratives-maroc`
- SIG-Maroc RGPH 2024 commune joins:
  `https://sig-maroc.com/donnees/shapefiles-recensement-2024`

## Reviewed Runtime Changes

The first runtime bbox edits from this workflow are Rabat and Agadir, applied
on 2026-05-09. Both use reviewed WOF locality candidates as the source of
direction, but both are clipped before shipping so they do not steal coordinates
from neighboring Morocco rows during `detectLocation()`'s smallest-match scan:

- `Rabat|MA`: widened toward the WOF locality while stopping short of the
  Sale and Temara lookup cells.
- `Agadir|MA`: tightened from the old broad rectangle and aligned to the WOF
  locality while stopping short of the Inezgane lookup cell.
- `Berrechid|MA`, `Settat|MA`, `Sefrou|MA`, `Tangier|MA`, `Nador|MA`, and
  `Oujda|MA`: tightened to reviewed WOF locality envelopes where the previous
  population-radius boxes materially over-covered surrounding areas and no
  adjacent-city clipping was needed.
- `Casablanca|MA`: tightened to the WOF current county envelope after the WOF
  locality rows proved deprecated/point-like and the county envelope matched
  OSM admin-8 Casablanca closely enough for the offline lookup cell.
- `Fes|MA`: tightened to WOF current locality `421190143`; that row is named
  Fes-Ville-Nouvelle in WOF but supersedes the older Fes locality row and
  matches the OSM admin-8 Fes envelope.
- `Abu Dhabi|AE` and `Al Ain|AE`: expanded/tightened to reviewed WOF current
  locality envelopes.
- `Dubai|AE`, `Sharjah|AE`, and `Ajman|AE`: clipped into adjacent runtime
  lookup cells after WOF current locality envelopes proved too overlapping to
  ship directly. Dubai keeps its centre and existing west/east/south edges but
  stops at Sharjah's south edge; Ajman starts at Sharjah's WOF north edge so
  the three cells do not area-overlap.
- `Istanbul|TR`, `Ankara|TR`, `Izmir|TR`, `Bursa|TR`, `Konya|TR`,
  `Gaziantep|TR`, `Adana|TR`, `Antalya|TR`, `Samsun|TR`, and `Trabzon|TR`:
  tightened to reviewed WOF current locality envelopes. Trabzon's previous
  Georgia-edge safety intent is preserved by the tighter WOF cell.
- `Windsor|CA`: added as a clipped WOF-backed lookup cell for the
  Detroit/Windsor seam. `Detroit|US` and `Dearborn|US` now start north of the
  seam, so Windsor no longer resolves to a US city.
- `Geneva|CH`, `Annemasse|FR`, and `Ferney-Voltaire|FR`: tightened/added from
  WOF current locality envelopes so French border-town coordinates no longer
  resolve to Geneva/Switzerland.
- `Strasbourg|FR` and `Kehl|DE`: separated at the Rhine seam so Kehl no
  longer resolves to Strasbourg/France.
- `Brazzaville|CG` and `Kinshasa|CD`: separated across the Congo River seam so
  Brazzaville's east edge and Kinshasa's south/east edges resolve to their own
  countries/timezones without filling the river gap.
- `Singapore|SG` and `Johor Bahru|MY`: separated at the Causeway seam.
  Northern Singapore coordinates now keep Singapore city/timezone provenance,
  while the old overbroad Johor Bahru north/east corners no longer resolve to
  Johor Bahru city provenance.
- `Kuala Lumpur|MY`, `Shah Alam|MY`, `Petaling Jaya|MY`, and `Klang|MY`:
  converted from a two-cell KL/Shah approximation into WOF-backed Klang Valley
  city cells. Petaling Jaya and Klang now exist as explicit registry rows.
- `Sialkot|PK`: moved to a reviewed WOF current locality envelope so
  Gujranwala north-east coordinates no longer resolve to Sialkot.
- Morocco WOF-backed runtime rows now have source-map status aligned with the
  shipped registry bboxes: Rabat, Agadir, Berrechid, Settat, Fes, Sefrou,
  Tangier, Nador, and Oujda. OSM-only rows remain audit candidates pending
  license review.

These are provenance/routing fixes only. They do not change prayer-time
calculation math or imply that rectangles now encode municipal boundaries.

## Running

With reviewed IDs and cached GeoJSON present:

```bash
node scripts/fetch-city-geometry-cache.js --provider wof --dry-run
node scripts/fetch-city-geometry-cache.js --provider wof
node scripts/audit-city-geometry.js
node scripts/audit-city-geometry.js --format json
node scripts/audit-city-geometry.js --sources scripts/data/city-geometry-sources.json --cache-dir .cache/city-geometry
```

If `scripts/data/city-geometry-sources.json` is absent, the script exits cleanly
and prints a setup message. If the source map exists but cached GeoJSON is
absent, the report lists `cache-file-not-found`; that is expected until a
reviewer fetches raw geometry into `.cache/city-geometry/`.

`fetch-city-geometry-cache.js` currently hydrates WOF candidates only. It uses
the explicit WOF repository metadata in the source map, writes raw GeoJSON to
`.cache/city-geometry/`, and leaves OSM/Overture/official fetch paths to
separate reviewed workflows because their terms and APIs differ.

## First Audit Targets

Start with rows where geometry quality affects source provenance, existing
validator warnings, or known clipping gaps:

- Morocco Habous clusters: Rabat/Sale/Temara, Agadir/Inezgane,
  Casablanca/Berrechid/Settat, Fes/Sefrou/Meknes, Tangier/Tetouan/Nador/Oujda.
- Current registry warning: Jerusalem PS/IL routing.
- Resolved geometry clipping gap: Brazzaville/Kinshasa. Brazzaville uses its
  WOF locality envelope; Kinshasa uses WOF south/west/east edges with the north
  edge still clipped at the existing river-safe boundary.
- Resolved validator-warning regression target: Basel/Mulhouse. It has
  reviewed WOF locality evidence and a tightened runtime bbox.
- Resolved high-risk border cluster: Singapore/Johor Bahru. It now has
  reviewed WOF source-map rows and clipped runtime cells that preserve the
  MUIS/JAKIM source boundary.
- Resolved high-risk metro cluster: Kuala Lumpur/Shah Alam. It now has
  reviewed WOF source-map rows plus explicit Petaling Jaya and Klang registry
  rows, preserving Malaysia/JAKIM provenance at city level.
- Resolved high-risk overlap: Sialkot/Gujranwala. Sialkot now has a reviewed
  WOF source-map row and no longer shadows Gujranwala's north-east edge.
- High-risk metro/border clusters: Cairo/Giza/6th of October,
  Dubai/Sharjah/Ajman, Toronto/Mississauga/Laval/Montreal,
  Lahore/Gujranwala broader coverage, Basra/Ahvaz/Kuwait City,
  Damascus/Homs/Gaziantep.
- Large heuristic bboxes such as Karachi, Istanbul, Jakarta, Bangalore, Dhaka,
  Tokyo, Seoul, Moscow, Melbourne, Sydney, Shanghai, Lagos, London, New York.

Western Sahara / Laayoune should be handled in a separate reviewed pass because
Moroccan official/Habous framing, ISO `EH`, OSM, WOF, and other boundary
sources encode political geography differently. A geometry audit must not
silently change method dispatch or country identity.

## Reports

The report should distinguish geometry QA from prayer-time math. A bbox change
may alter city/source/method provenance, but it is not a WMAE improvement unless
fixtures prove a calculation change.

Reports include advisory triage labels so reviewers can sort rows before
opening bbox PRs:

- `undercoverage-review` — reviewed geometry samples fall outside the shipped
  bbox; potential missed city coverage.
- `tighten-review` — most shipped bbox samples fall outside reviewed geometry;
  potential metro/border leakage.
- `envelope-aligned` — the bbox already matches the reviewed geometry envelope;
  remaining sample mismatch is polygon shape and cannot be improved without
  runtime polygon routing.
- `watch` / `low-priority` — visible or minor mismatch, usually not first in
  line unless the row affects a known source or border problem.
- `registry-center-review` / `center-geometry-review` — center-point mismatch;
  treat as high-priority data quality review.

Each row should report at minimum:

- city key and provider stable ID;
- source license/use status;
- center-inside-geometry status;
- registry bbox vs geometry bbox overlap;
- sampled overcoverage and undercoverage;
- cross-border and sibling-overlap risks;
- whether any proposed bbox change is human-reviewed.
