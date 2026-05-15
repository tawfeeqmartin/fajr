# Morocco Evidence Boundary

Last refreshed: 2026-05-15

This page defines what fajr can currently claim about Morocco and what remains
post-launch calibration work. It exists so public replies to Moroccan testers
are precise rather than overconfident.

## Current Product Position

fajr uses one canonical Morocco official-timetable default.

- Method: Morocco 19/17 community calibration with +5 min Dhuhr and +5 min
  Maghrib Path A buffers.
- Elevation stance: official uniform city/region timetable by default.
- Public API signal: `location.elevationSource === 'country-uniform-timetable'`
  and `location.elevation === 0` unless the caller explicitly passes elevation.
- Override path: users or mosques that intentionally follow observer-elevation
  horizon correction can pass `elevation` / `override.elevation`.

The old question "Habous vs Mawaqit stance?" is not a shipped public split.
The evidence currently supports one Morocco stance, while preserving source
evidence for future review.

## What Is Strong Enough Today

| Evidence | Scope | Result | Use |
|---|---:|---|---|
| Published v1.9.3 no-options path | Current package / npm / esm.sh | Morocco no longer auto-applies city-registry elevation by default. | Public tester sharing. |
| Live Habous check on 2026-05-15 | 33 mapped cities, current-day official endpoint | Five prayer times within 3 min; Shuruq within 10 min source sanity. | Release evidence for v1.9.3. |
| Official Habous monthly holdout fixture | 33 cities x 30 days = 990 dated rows | Five-prayer MAE 0.74 min, max abs 3 min; Sunrise MAE 4.41 min and max 8 min, tracked separately. | CI regression signal, not train ratchet. |
| Habous monthly source snapshot | `fixtures/habous-morocco/monthly/2026-04-19_to_2026-05-18.json` | Official source artifact archived outside `eval/data/`. | Source evidence for future promotion. |
| Habous vs Mawaqit empirical diff | 31 cities x 30 days matched; 5,760 prayer cells | Five-prayer WMAE excluding Sunrise 0.576 min; collapse recommendation. | Supports one canonical Morocco stance. |
| Multi-season Habous recovery | 150 valid historical day-rows across winter/summer samples | Fajr/Maghrib/Isha mean abs bias each under 1 min; winter Casablanca Fajr exact. | Seasonal sanity, not dense enough for a new calibration. |
| Mawaqit Morocco yearly corpus | 42 mosques x 366 days before filtering | Dhuhr mean bias -0.15 min; Maghrib mean bias +0.76 min; outliers are source/mosque-quality leads. | Seasonal diagnostic and source-quality work. |

## What This Allows Us To Say

For targeted public testing:

> fajr v1.9.3 follows Morocco's official Habous/Mawaqit city-region timetable
> stance by default. Please compare against your local Habous city or mosque
> table and report the city, date, and prayer if it differs.

For app UI:

> Morocco official timetable calibration. Verify the mapped city if your local
> mosque follows a different Habous region. Use explicit elevation only when
> your mosque intentionally follows observer-elevation correction.

Do not say:

- "fajr exactly reproduces every Morocco mosque."
- "Habous and Mawaqit are separate selectable calculations."
- "Shuruq is a strict Morocco calibration target."
- "Elevation is missing for Morocco." The `country-uniform-timetable` source is
  intentional.

## What Remains Open

| Track | Status | Why it stays open |
|---|---|---|
| #92 Habous fixture promotion | Open | The archived monthly source snapshot is source evidence. Promoting future months into `eval/data/test` needs curated review. |
| #103 rigorous calibration | Open | The existing evidence supports the current stance, but not a new Morocco calculation change. More non-overlapping months should accumulate before tuning. |
| Ramadan DST / GMT+0 handling | Separate engineering concern | Historical Wayback analysis surfaced a Ramadan clock-policy artifact. It should be investigated separately from the Habous-vs-Mawaqit stance question. |
| Per-mosque outliers | Open source-quality work | Zagora, Sidi Kacem, Errachidia, Fquih Ben Salah, and Guelmim need mosque/source review before any per-city rule. |

## Decision

For the current public-release path, #92 and #103 are post-launch calibration
tracks, not blockers.

The blocker would re-open only if a fresh Morocco tester report gives a
specific city/date/prayer mismatch that exceeds the current envelope:

- five prayer times: more than 3 minutes from the official Habous city table;
- Shuruq: more than 10 minutes from the official table;
- wrong city/region mapping;
- `location.elevationSource` not equal to `country-uniform-timetable` on a
  default Morocco call.

## Source Files

- [docs/positions.md](positions.md)
- [docs/data-sources.md](data-sources.md)
- [docs/known-disagreements.md](known-disagreements.md)
- [fixtures/habous-morocco/README.md](../fixtures/habous-morocco/README.md)
- [eval/data/test/morocco-habous-monthly.json](../eval/data/test/morocco-habous-monthly.json)
- [autoresearch/proposals/2026-05-05-habous-vs-mawaqit-empirical-diff.md](../autoresearch/proposals/2026-05-05-habous-vs-mawaqit-empirical-diff.md)
- [autoresearch/proposals/2026-05-05-habous-multi-season-verification.md](../autoresearch/proposals/2026-05-05-habous-multi-season-verification.md)
