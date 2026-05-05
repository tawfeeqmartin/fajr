# Mawaqit seasonal Path A re-validation — auto-generated

Fixture: `/Users/tm/Dev/fajr/eval/data/test/mawaqit-morocco-yearly.json`
Records: 42 mosques, 15372 day-rows
Generated: 2026-05-05T19:52:00.094Z

## Per-month signed bias (calc − Mawaqit, minutes)

Bias positive = fajr's calc is LATER than mosque-published.
A flat bias across months means the calibration is seasonally robust.
Variance across months means the +N Path A constant is wrong for some season.

| Month | n | Fajr | Sunrise | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|---|---|
| 01 | 1302 | 6.96 | 3.91 | 2.07 | -0.47 | -1.25 | -3.02 |
| 02 | 1160 | 0.60 | -2.62 | -0.89 | -0.25 | 0.23 | -1.71 |
| 03 | 1302 | 0.08 | -2.64 | -2.73 | -2.45 | -2.35 | -4.50 |
| 04 | 1260 | 0.73 | -1.45 | 0.19 | 1.04 | 2.12 | 0.15 |
| 05 | 1302 | -1.52 | -1.94 | 0.00 | 0.76 | 2.59 | 0.85 |
| 06 | 1230 | -5.31 | -4.04 | 0.12 | 0.60 | 4.41 | 3.41 |
| 07 | 1302 | -3.86 | -3.37 | 0.48 | 0.16 | 4.27 | 2.97 |
| 08 | 1302 | -0.99 | -2.46 | 0.36 | -0.68 | 3.16 | 1.20 |
| 09 | 1200 | 0.90 | -2.11 | -0.02 | -1.60 | 1.98 | -0.20 |
| 10 | 1302 | 3.06 | -0.35 | -0.93 | -4.07 | -1.90 | -4.19 |
| 11 | 1200 | 1.26 | -2.05 | -0.30 | -2.39 | 0.38 | -1.58 |
| 12 | 1302 | 5.09 | 2.22 | -0.26 | -4.44 | -4.26 | -5.90 |

## Per-prayer seasonal variance (max month bias − min month bias)

Larger range = more seasonal drift.
| Prayer | Min bias (month) | Max bias (month) | Range |
|---|---|---|---|
| fajr | -5.31 (m=6) | 6.96 (m=1) | 12.27 |
| sunrise | -4.04 (m=6) | 3.91 (m=1) | 7.95 |
| dhuhr | -2.73 (m=3) | 2.07 (m=1) | 4.81 |
| asr | -4.44 (m=12) | 1.04 (m=4) | 5.47 |
| maghrib | -4.26 (m=12) | 4.41 (m=6) | 8.67 |
| isha | -5.90 (m=12) | 3.41 (m=6) | 9.31 |

## Per-city Maghrib mean bias (top 15 by abs)

| City | n | Maghrib bias |
|---|---|---|
| Zagora | 366 | -32.72 |
| Sidi Kacem | 554 | -19.84 |
| Oujda | 732 | 6.73 |
| Sefrou | 366 | 4.51 |
| Berrechid | 366 | 4.46 |
| Ouarzazate | 732 | 4.45 |
| Temara | 366 | -4.39 |
| Fes | 732 | 4.32 |
| Ifrane | 366 | 4.27 |
| Erfoud | 732 | 3.98 |
| Khouribga | 366 | 3.51 |
| Marrakech | 366 | 3.49 |
| Rabat | 366 | 3.47 |
| Meknes | 366 | 3.46 |
| Essaouira | 336 | 3.43 |

## Aggregate per-prayer bias (full year)

| Prayer | n | Mean bias | MAE |
|---|---|---|---|
| fajr | 15164 | 0.61 | 3.62 |
| sunrise | 15164 | -1.38 | 4.38 |
| dhuhr | 15164 | -0.15 | 1.51 |
| asr | 15164 | -1.16 | 2.92 |
| maghrib | 15164 | 0.76 | 5.46 |
| isha | 15164 | -1.06 | 3.52 |
---

## Verdict (parent agent)

**v1.5.0 Morocco Maghrib +5 + v1.7.16 Morocco Dhuhr +5 are empirically validated year-round.**

- Maghrib: +0.76 min mean bias across 15,164 rows / 42 mosques × ~366 days. Single-minute mean is well within the ±5 ihtiyat tolerance band.
- Dhuhr: -0.15 min mean — essentially perfect year-round.
- All other prayers within ±2 min mean bias / 5 min MAE.

**Seasonal drift exists but is within tolerance.** Maghrib swings from -4.26 (December) to +4.41 (June) — a 8.67-min range. Per-month tuning could potentially halve the MAE (5.46 → ~2.5) but at the cost of complexity that the surface-disagreement principle would prefer to expose via `notes[]` rather than absorb silently.

**Per-city outliers** worth follow-up:
- Zagora (high-altitude desert): -32.72 Maghrib bias. Likely Habous/Mawaqit treats the elevation correction differently than the 0-elevation Mawaqit-Morocco fixture assumes. v1.8.x per-city investigation.
- Sidi Kacem: -19.84 Maghrib bias even after corrupt-row filter — suggests systematic offset for that specific mosque, not just calendar corruption.
- Other cities (Sefrou, Berrechid, Ouarzazate, Fes, etc.): ±4-5 Maghrib bias range — within tolerance, no action needed.

**No engine change recommended.** The aggregate calibration holds. Seasonal-drift improvements would be v1.8.x scope (caller-side per-month override or per-city refinement).

**Data-quality follow-up needed**: 208/15,372 (1.4%) rows structurally implausible — track which mosques publish corrupt embedded calendars even though their daily live page is correct. Filterable but worth a separate issue.

— fajr-claude
