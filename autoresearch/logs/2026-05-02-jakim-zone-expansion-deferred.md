# AutoResearch Run — 2026-05-02 — JAKIM zone expansion (DEFERRED)

## Hypothesis

Expanding the JAKIM corpus from 3 zones (KL/Shah Alam/George Town) to
10 zones spanning Peninsular + East Malaysia (adding Johor Bahru, Alor
Setar, Kota Bharu, Melaka, Ipoh, Kota Kinabalu, Kuching) would resolve
the Maghrib heterogeneity that v1.4.4 deferred. With more zones we
could either: (a) confirm Maghrib bias is uniform after broader
sampling, justifying a Path A offset; or (b) confirm heterogeneity is
real, accepting the deferral.

## What happened

The waktusolat.app v2 endpoint returned MAY 2026 data when queried,
not April 2026 (which the existing 3-zone fixture had). Refreshing
waktusolat.json overwrote April with May. The NEW per-source biases
were:

| Source | n | WMAE | Fajr | Maghrib | Isha |
|---|---:|---:|---:|---:|---:|
| JAKIM (April, 3 zones, pre)   | 30  | 0.75 | -0.70 | -0.54 | -0.10 |
| JAKIM (May, 10 zones, post)   | 100 | 3.20 | +0.49 | +1.06 | +1.98 |

JAKIM source WMAE worsened 0.75 → 3.20. Per-prayer biases flipped
sign for Fajr and Isha relative to April. Aggregate Shuruq drift
exceeded the ihtiyat threshold.

## Diagnosis

This is NOT a corpus-expansion failure per se — it's evidence of
**JAKIM seasonal drift**:

* The +8 Fajr / +1 Isha Path A calibrations shipped in v1.4.1/v1.4.4
  were tuned against April data only.
* In May, fajr's calc-with-those-Path-A-offsets sits LATER than
  JAKIM's published times for Fajr (+0.49) and especially Isha (+1.98).
* The April calibration may be over-correcting for May, OR JAKIM's
  ihtiyati varies across months in a way we haven't characterised.

The corpus expansion appears to have failed mostly because the data
shifted month, not because adding zones was wrong in principle. With
proper month-aligned data, the 10-zone corpus would be a richer
calibration baseline.

## Action: REVERT, not SHIP

`waktusolat.json` reverted to the prior 3-zone April corpus via
`git checkout`. The expanded ZONES array is preserved in
`scripts/fetch-waktusolat.js` for a future re-fetch when April-2027
data is available (or the API's month behaviour is understood).

## Future investigation hooks

1. **Seasonal-drift characterisation**: fetch waktusolat for several
   months, compare per-zone biases month-over-month. If biases swing
   by >0.5 min seasonally, the +8 Fajr / +1 Isha Path A offsets need
   to be revisited as month-dependent OR averaged across the year.

2. **East Malaysia (Sabah/Sarawak)**: Kuching especially showed an
   outlier Isha bias (+17 min in raw script — unverified due to my
   diagnostic-script bug, not the eval). Worth investigating whether
   East Malaysia zones really need different calibration than
   Peninsular.

3. **API month behaviour**: waktusolat's `/v2/solat/{zone}` returns
   the API's "current" month. The fetch script logged warnings when
   asked for a different month; this is expected per the docs but
   means the corpus is always anchored to whatever month the fetch
   ran in. Re-fetching annually should be ritualised.

## Verdict

DEFERRED — investigation surfaced a real signal (seasonal JAKIM drift)
but the proposed fix (expand corpus) needs careful month-alignment
to be useful. Train WMAE remains at 0.6732 (v1.4.5 baseline). No code
shipped. autoresearch/logs/ holds the investigation note for the next
session that picks this thread up.
