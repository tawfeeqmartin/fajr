# City Geometry Audit

Last refreshed: 2026-05-08

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
warning rows. It carries 17 candidate OSM relation IDs plus 11 WOF candidate
IDs. Berrechid and Settat now have WOF locality candidates; Jerusalem
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

## Running

With reviewed IDs and cached GeoJSON present:

```bash
node scripts/audit-city-geometry.js
node scripts/audit-city-geometry.js --format json
node scripts/audit-city-geometry.js --sources scripts/data/city-geometry-sources.json --cache-dir .cache/city-geometry
```

If `scripts/data/city-geometry-sources.json` is absent, the script exits cleanly
and prints a setup message. If the source map exists but cached GeoJSON is
absent, the report lists `cache-file-not-found`; that is expected until a
reviewer fetches raw geometry into `.cache/city-geometry/`.

## First Audit Targets

Start with rows where geometry quality affects source provenance or existing
validator warnings:

- Morocco Habous clusters: Rabat/Sale/Temara, Agadir/Inezgane,
  Casablanca/Berrechid/Settat, Fes/Sefrou/Meknes, Tangier/Tetouan/Nador/Oujda.
- Current registry warnings: Jerusalem PS/IL routing, Brazzaville/Kinshasa,
  Basel/Mulhouse.
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

Each row should report at minimum:

- city key and provider stable ID;
- source license/use status;
- center-inside-geometry status;
- registry bbox vs geometry bbox overlap;
- sampled overcoverage and undercoverage;
- cross-border and sibling-overlap risks;
- whether any proposed bbox change is human-reviewed.
