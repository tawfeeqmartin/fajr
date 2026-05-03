# AutoResearch Run — 2026-05-03 17:30 UTC

## Iteration 1 — Morocco Dhuhr +5min Path A

## Hypothesis

Per-region inspection of train WMAE showed every Mawaqit-Morocco city
exhibits a uniform Dhuhr signed-bias of approximately -4 to -6 minutes
(calc earlier than mosque-published) across all 18 cities. This is the
same signature class as the v1.5.0 Maghrib +5 Path A correction —
Habous Ministry institutional ihtiyati, not engine drift. Adding
+5 min Dhuhr ihtiyati via `methodAdjustments.dhuhr = 5` should close
the bias systematically.

## Wiki sources consulted

- `knowledge/wiki/regions/morocco.md` — documents Habous Path A
  precedent in section "Relationship Between Calculated and Published
  Times": Habous publishes timetables that diverge from formula by
  uniform offsets across regions; expected pattern for institutional
  ihtiyati corrections.
- `knowledge/wiki/methods/morocco.md` — Morocco custom 19°/17° already
  carries a +5min Maghrib offset (v1.5.0); same Path A precedent
  class.
- `knowledge/wiki/fiqh/prayer-definitions.md` — classical Maliki/Sunni
  jurisprudence requires *yaqeen* (certainty) that solar zenith has
  passed before initiating Dhuhr; ~5 min ihtiyati is consistent with
  the requirement.

## Empirical pre-change measurement

Across all 25 Mawaqit-Morocco fixture cells (May 2 2026):

| City | calc | mawaqit | gt − calc |
|---|---|---|---|
| Casablanca (3 mosques) | 13:28 | 13:32–13:33 | +4–+5 |
| Rabat | 13:25 | 13:30 | +5 |
| Marrakech | 13:30 | 13:34 | +4 |
| Tanger (2 mosques) | 13:21 | 13:26 | +5 |
| Nador | 13:10 | 13:14 | +4 |
| Oujda (2 mosques) | 13:05 | 13:10 | +5 |
| Fes (2 mosques) | 13:17–13:18 | 13:22 | +4–+5 |
| Meknes | 13:20 | 13:24 | +4 |
| Taza | 13:13 | 13:18 | +5 |
| Khouribga | 13:25 | 13:30 | +5 |
| Settat | 13:26 | 13:32 | +6 |
| Sale | 13:25 | 13:29 | +4 |
| Kenitra | 13:24 | 13:28 | +4 |
| Safi | 13:34 | 13:39 | +5 |
| Essaouira | 13:36 | 13:41 | +5 |
| Agadir | 13:36 | 13:41 | +5 |
| Taroudant | 13:31 | 13:37 | +6 |
| Ouarzazate (2 mosques) | 13:25 | 13:30 | +5 |
| Errachidia | 13:14 | 13:19 | +5 |

Mean offset: **+4.80 min**, range [+4, +6], no outliers, n=25.

## Change made

`src/engine.js` Morocco case: `methodAdjustments` now includes
`dhuhr: 5` alongside the existing `maghrib: 5`. Comment block
expanded to document the per-cell empirical bias and scholarly
rationale.

## Before WMAE

```
Train WMAE: 1.0668
Mawaqit (mosque-published): 1.52
Per-prayer (train): fajr 1.20 / shuruq 0.60 / dhuhr 1.60 / asr 1.59 /
                    maghrib 0.66 / isha 0.80
Per-prayer signed: fajr -0.25 / shuruq -0.33 / dhuhr +0.27 / asr +1.22 /
                   maghrib +0.49 / isha +0.71
```

## After WMAE

```
Train WMAE: 0.9930  (Δ -0.074)
Mawaqit (mosque-published): 0.88  (Δ -0.63)
Per-prayer (train): no changes outside Morocco's dhuhr cells
Per-prayer signed: no signed-bias drift
Holdout WMAE: 3.66 → 3.62 (no overfitting signal — slight improvement)
```

## Verdict

**ACCEPTED** — `eval/compare.js` returned PASS. Train WMAE strictly
decreased; no per-source/per-cell regressions; no per-prayer bias
drift; Mawaqit source improved -0.63 min in WMAE.

## Scholarly classification

🟡→🟢 Approaching established. Same precedent class as v1.5.0 Morocco
Maghrib +5: Habous Ministry institutional ihtiyati surfaced through
mosque-published reality across an 18+ city Mawaqit corpus. Direction
is prayer-validity-safer (Dhuhr LATER = unambiguously post-zenith)
and aligns calc with what Moroccan Muslims actually pray to.
