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
20 high-priority rows: 15 Morocco/Habous phase-1 rows and 5 existing registry
warning rows. It carries 17 OSM relation rows plus 16 WOF rows across reviewed
locality/county candidates. Berrechid, Settat, and Fes now have WOF locality
candidates; Jerusalem intentionally remains without a geometry candidate until
a human routing decision is available.

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
- Known geometry clipping gap: Brazzaville/Kinshasa. Their runtime bboxes are
  edge-adjacent, but WOF locality envelopes still under-cover/overlap across
  the diagonal Congo River boundary, so this remains a source-review target.
- Resolved validator-warning regression target: Basel/Mulhouse. It has
  reviewed WOF locality evidence and a tightened runtime bbox.
- High-risk metro/border clusters: Cairo/Giza/6th of October,
  Dubai/Sharjah/Ajman, Singapore/Johor Bahru, Kuala Lumpur/Shah Alam,
  Toronto/Mississauga/Laval/Montreal, Lahore/Sialkot/Gujranwala,
  Basra/Ahvaz/Kuwait City, Damascus/Homs/Gaziantep.
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
