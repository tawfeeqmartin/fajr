# Egypt ESA daily snapshots

Source: Egyptian General Authority for Survey
URL: https://www.esa.gov.eg/praytimes.aspx

This directory accumulates daily institutional Imsakiyya captures from
ESA for the 27 mapped major Egyptian cities. The capture workflow at
`.github/workflows/egypt-esa-snapshot.yml` fires daily at 03:17 UTC
(~05:17 Cairo) and opens a review PR per snapshot.

## Daily files

`daily/YYYY-MM-DD.json` — one file per day, structured as a flat array
of city records matching the schema of `eval/data/test/egypt-esa.json`
(itself a single-day curated holdout fixture, NOT auto-updated by this
workflow).

## Why this exists

ESA serves today's prayer times only — no historical query path
without VIEWSTATE/Puppeteer form-post simulation. Daily capture is the
simplest path to multi-season coverage for the Egypt C → B
confidence-grade promotion per `docs/positions.md` Promotion Criteria.

## Promotion rules

1. Captures land here via the automated workflow.
2. After a meaningful accumulation period (≥2 months covering ≥2
   seasons), a human curator opens a separate PR to promote a curated
   subset into `eval/data/test/egypt-esa-yearly.json` (or
   per-season splits).
3. The promotion PR touches `docs/promotion-log.md` with the specific
   evidence (cities × dates, bias against fajr's Egyptian dispatch).
4. If Egypt's per-source WMAE remains ≤ 1 min across the curated
   corpus, Egypt is eligible for B → A promotion per the criteria.

## Why we don't promote directly

- Daily captures may include parser errors or city-mapping drift; need
  manual review.
- Sample dates need to be balanced across seasons; auto-promotion
  would just sample whatever days happened to capture cleanly.
- The eval ratchet should not be auto-modified by an unattended
  workflow.

## Related

- `scripts/fetch-egypt-esa.js` — the fetcher this workflow calls.
- `eval/data/test/egypt-esa.json` — the curated single-day holdout
  (15 cities, verified-clean, used by eval ratchet reports).
- `fajr#133` — the original issue that surfaced ESA as a reachable
  institutional source.
- `docs/positions.md` § Egypt — current confidence grade C; this
  workflow is part of the path to B.
