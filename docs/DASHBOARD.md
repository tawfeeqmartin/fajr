# Fajr Accuracy Dashboard

An interactive HTML dashboard visualizing the autoresearch experiment trajectory through the v1.0 milestone.

> **For current numbers** — train WMAE 1.25 min, holdout WMAE 6.15 min, 240 train + 211 holdout entries across 6 reference sources — see the auto-generated [`docs/progress.md`](progress.md). It is regenerated on every `npm run build:charts` and contains live per-source / per-region / per-prayer breakdowns. The dashboard below documents the historical Experiment 1–7 narrative.

## Historical Metrics (Experiment 6 era — v1.0 milestone)
- WMAE: 1.55 minutes across 18 cities (Aladhan-only; calc-vs-calc consistency check)
- 93.6% reduction from baseline (24.17 min). The bulk of that gain came from a single eval-bug fix in Experiment 3, not engine progress — see [README's "Honest caveat on the 93.6%"](../README.md#current-accuracy).
- All per-prayer MAEs under 2 minutes against Aladhan regional-method consensus.

The dashboard includes:
- WMAE trajectory across experiments
- Per-prayer radar chart
- Baseline vs current comparison
- Per-city accuracy table
- Experiment timeline with classifications

See `dashboard.html` for the interactive version.
