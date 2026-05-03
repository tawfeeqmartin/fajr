# AutoResearch Run — 2026-05-03 17:36 UTC

## Iteration 2 — JAKIM Dhuhr +2 / Asr +1 ihtiyati extension

## Hypothesis

Per-source signed-bias inspection showed JAKIM source had Dhuhr -0.77
and Asr -0.97 across all 3 Malaysian zones — uniform direction, low
variance, sub-minute magnitude. Razali & Hisham 2021 documents JAKIM's
institutional 2-min *waktu ihtiyati* pattern systematically applied
across all five prayers. fajr already applies the corresponding +8
Fajr (v1.4.1) and +1 Isha (v1.4.4) Path A offsets but had not extended
to Dhuhr/Asr. Adding +1 Dhuhr (cumulative +2 with adhan default +1)
and +1 Asr should close those biases.

## Wiki sources consulted

- `knowledge/wiki/regions/malaysia.md` — full Razali & Hisham 2021
  citation; explicit documentation that 2-min ihtiyati applies "across
  all prayer times by JAKIM's institutional convention". Per-cell
  bias data already documented in the existing engine.js comment block
  for Maghrib but explicitly noted as not extended due to
  heterogeneity at that time.
- `knowledge/raw/papers/2026-05-01-astronomycenter/jakim_ijhtc_reevaluation.pdf` —
  Razali & Hisham 2021 in archive.

## Empirical pre-change measurement

Per-cell signed-bias from runs.jsonl after iteration 1:

| Zone | City | Dhuhr bias | Asr bias |
|---|---|---|---|
| WLY01 | Kuala Lumpur | -1.00 | -1.00 |
| SGR01 | Shah Alam | -0.50 | -1.00 |
| PNG01 | George Town | -0.80 | -0.90 |
| **mean** | | **-0.77** | **-0.97** |

All three zones consistent direction; sub-zone variance < 0.5 min.

## Change made

`src/engine.js` Malaysia case: extended `methodAdjustments` to
`{ fajr: 8, dhuhr: 2, asr: 1, isha: 1 }`. Dhuhr changed from default
+1 (from adhan-js Singapore preset) to +2 cumulative. Asr added at +1.
Comment block extended to document the empirical bias and rationale.

## Before WMAE (after iteration 1)

```
Train WMAE: 0.9930
JAKIM (via waktusolat.app): 0.579
```

## After WMAE

```
Train WMAE: 0.9757  (Δ -0.017)
JAKIM (via waktusolat.app): 0.451  (Δ -0.128)
Holdout WMAE: 3.6243 → 3.6162 (slight improvement; no overfitting)
```

## Verdict

**ACCEPTED** — `eval/compare.js` returned PASS. Train WMAE strictly
decreased; no per-source/per-cell regressions; no per-prayer
signed-bias drift; JAKIM source WMAE improved by 0.128 min.

## Scholarly classification

🟡→🟢 Approaching established. Same precedent class as the existing
JAKIM Fajr +8 and Isha +1 ihtiyati offsets:
- Same institutional citation (Razali & Hisham 2021 documenting
  JAKIM's 2-min *waktu ihtiyati* applied "to or subtracted from the
  calculated time" across prayer times)
- Same Path A pattern (uniform direction across multi-zone corpus)
- Same dual-ihtiyat compliance (later = prayer-validity-safer for
  both Dhuhr/Asr; fasting-neutral)

The change brings fajr's calc into uniform sub-minute alignment with
JAKIM's published institutional reality across all 3 Malaysian zones.
