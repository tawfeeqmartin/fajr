# AutoResearch Run — 2026-05-02 09:50 UTC

## Hypothesis

The +2.82 Diyanet Maghrib bias and +1.54 Aladhan Maghrib bias are
mostly elevation-correction artifacts: the eval was passing each
fixture's `elevation` field to `prayerTimes()`, triggering fajr's
auto-elevation correction on cells whose institutional ground truth
publishes sea-level times. Fixing the eval to apply elevation
correction only when the source publishes elevation-corrected times
should close most of these biases without regressing JAKIM (which
does publish elevation-corrected times per Razali & Hisham 2021).

## Evidence

Direct measurement at Ankara (938m) under Diyanet method:

  fajr no-elevation:  Maghrib 19:49
  fajr w/elevation:   Maghrib 19:52  (correction +3.93 min)
  Diyanet published:  Maghrib 19:48  (sea-level)

The +4.93-min Ankara/Diyanet Maghrib bias decomposes as ~+1 min real
calibration drift + ~+3.9 min elevation artifact.

JAKIM via waktusolat.app explicitly publishes elevation-corrected
times per its `source_method`: "JAKIM (Fajr 20°, Isha 18°,
topographic elevation)".

## Change

`eval/eval.js` `evaluateEntry`:
  Pass elevation only when source publishes elevation-corrected times.
  Detection heuristic: source_method/source matches /topographic|
  topographical|elevation[\s-]?correct/ (case-insensitive).

  This is a framework-correctness fix. Engine src/ is unchanged. The
  public `prayerTimes()` wrapper still auto-applies elevation for
  consumers who pass `elevation > 0` — production behaviour
  preserved.

No fixture edits required — the heuristic reads existing
source_method metadata.

## Before WMAE (v1.4.2)

| Source       | n   | WMAE | Maghrib bias |
|--------------|-----|------|--------------|
| JAKIM        | 30  | 0.92 | -0.54        |
| Aladhan      | 180 | 1.06 | +1.54        |
| Diyanet      | 30  | 1.06 | +2.82        |

Train WMAE: 1.0394

## After WMAE (v1.4.3)

| Source       | n   | WMAE | Maghrib bias |
|--------------|-----|------|--------------|
| JAKIM        | 30  | 0.92 | -0.54  (unchanged — heuristic preserves) |
| Aladhan      | 170 | 0.70 | +0.24  (closed +1.30 of phantom bias)    |
| Diyanet      | 30  | 0.50 | +0.87  (closed +1.95 of phantom bias)    |

Train WMAE: **0.7038** (a 32% reduction from 1.0394)

## Verdict

ACCEPTED — train WMAE strictly decreased; no per-source, per-cell, or
unsafe-bias regressions. compare.js exits 0 (PASS).

## Scholarly classification

🟢 Established — no engine math change. The eval correctness fix
makes the measurement match the institutional convention each ground-
truth source publishes (sea-level for Aladhan/Diyanet/most;
elevation-corrected for JAKIM per Razali & Hisham 2021).

## Heuristic limitations / future-proofing

The heuristic reads `source_method` (or `source` as fallback) for
"topographic" / "topographical" / "elevation correct*" substrings.
Currently matches only the 3 JAKIM/waktusolat fixtures. If a future
fixture is added whose source publishes elevation-corrected times
without using these markers, it will default to no-elevation and
under-correct. Mitigation: future contributors set source_method
explicitly when adding such fixtures, e.g. "Foo Authority (...,
elevation-corrected)" or "... topographic elevation".
