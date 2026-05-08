# Morocco Habous Source Snapshots

This directory stores official Morocco Habous monthly-table captures before the
live endpoint rolls over.

These files are source evidence, not ratchet fixtures. They are intentionally
kept outside `eval/data/` until a maintainer promotes a reviewed subset into the
holdout corpus.

## Capture Workflow

`.github/workflows/habous-morocco-snapshot.yml` runs on a schedule and by manual
dispatch. It calls:

```bash
node scripts/fetch-habous-morocco-month.js --allow-insecure-habous-cert --out /tmp/habous/current.json
```

Then it opens a PR with a new file under:

```txt
fixtures/habous-morocco/monthly/YYYY-MM-DD_to_YYYY-MM-DD.json
```

The path is based on the Gregorian date range in the official monthly table. If
that range was already captured, the workflow exits without opening a duplicate
PR.

## Promotion Rule

Do not move these snapshots into `eval/data/` mechanically. A curated fixture PR
should first verify:

- the Habous `ville` mapping matches `scripts/data/habous-morocco-cities.json`;
- the table source is the official Imsakiyya page, not the current-day API
  mirror;
- the rows parse to the expected Gregorian date range;
- per-city residuals are understood before any Morocco calibration change.
