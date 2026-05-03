# Fajr Accuracy Dashboard

An interactive HTML dashboard visualizing the autoresearch experiment trajectory through the v1.0 milestone.

> **For current numbers** — train WMAE 1.07 min, holdout WMAE 3.62 min, 215 train + 2,980 holdout entries across 4 train + 6 holdout reference sources — see the auto-generated [`docs/progress.md`](progress.md). It is regenerated on every `npm run build:charts` and contains live per-source / per-region / per-prayer breakdowns. The dashboard below documents the historical Experiment 1–7 narrative.

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

## Last refreshed
- 2026-05-03 by fajr-agent (v1.7.9 docs regen sweep — refreshed live numbers from current `eval/results/runs.jsonl`)
