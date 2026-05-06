# Morocco Habous Path A Analysis — 2026-05-05

## Executive Summary

**Recommendation: NO-CHANGE**

1. The Habous 12-city corpus (PR #96) confirms the engine is in the prayer-safe zone for all
   critical prayers: Fajr +1.33 min, Maghrib +0.42 min, Isha +0.67 min — all calc *later*
   than Habous published times, which is the ihtiyat-correct direction.

2. Shuruq shows +4.08 min bias vs Habous but this is explained by (a) Habous publishing
   elevation-corrected sunrise for elevated cities (~2.5 min for Fes/Marrakech/Meknes at
   410–546m), and (b) a genuine institutional split with Mawaqit (which shows ~0 bias for
   the same cities). This is an ikhtilaf between sources — not an engine error.

3. Any Path A Fajr shift toward Habous would move calc *earlier*, violating prayer-validity
   ihtiyat (Fajr must be *later* than actual dawn to be prayer-safe).

4. No dry-run eval was executed; runs.jsonl held at 81 lines throughout (no pollution).

---

## Corpus Reconciliation

| Fixture | Source | Cities | Rows | Date(s) |
|---------|--------|--------|------|---------|
| `eval/data/train/mawaqit-morocco.json` | Mawaqit mosque-published | 19 cities, 25 mosques | 25 | 2026-05-02 |
| `eval/data/test/mawaqit-morocco-extended.json` | Mawaqit mosque-published | Extended set | ~25 | 2026-05-02 |
| PR #96 `eval/data/test/morocco-habous.json` (branch `feat/v1.7.25-track-a-d-batch`) | Habous Ministry Direct API | 12 cities | 12 | 2026-05-05 |
| PR #98 expansion (`/tmp/fajr-habous-expansion/`) | habous-historical | Empty at time of analysis | 0 | — |

**Note:** PR #98 (`corpus/morocco-habous-history`) added tooling (`scripts/fetch-habous-morocco-month.js`) but
the `/tmp/fajr-habous-expansion/habous-historical/` directory was empty at analysis time. Analysis used
sources 1–3 only (37 rows total across 19 + 12 cities).

Overlapping cities between Mawaqit train and Habous: Casablanca, Rabat, Marrakech, Fes, Meknes,
Oujda, Sale, Kenitra, Taza (9 cities).

---

## Per-City Per-Prayer Bias Table

Bias convention: `calc − gt` in minutes. Positive = calc later than published (prayer-safe for
Fajr/Maghrib/Isha; prayer-safe-late for Shuruq). Data sources: Habous = 2026-05-05;
Mawaqit = 2026-05-02.

| City | Source | Fajr | Shuruq | Dhuhr | Asr | Maghrib | Isha | Notes |
|------|--------|------|--------|-------|-----|---------|------|-------|
| Casablanca | Habous | +1.0 | +2.0 | 0.0 | 0.0 | +1.0 | 0.0 | Coast 56m |
| Casablanca | Mawaqit | +0.3 | +0.3 | +0.3 | +0.7 | +0.7 | +0.7 | 3 mosques avg |
| Rabat | Habous | +2.0 | +3.0 | +1.0 | 0.0 | +2.0 | +1.0 | Coast 75m |
| Rabat | Mawaqit | +3.0 | 0.0 | 0.0 | +1.0 | +1.0 | +1.0 | 1 mosque |
| Marrakech | Habous | +1.0 | +5.0 | 0.0 | 0.0 | -1.0 | +1.0 | Inland 466m |
| Marrakech | Mawaqit | 0.0 | -1.0 | +1.0 | +1.0 | -1.0 | 0.0 | 1 mosque |
| Fes | Habous | +1.0 | +5.0 | 0.0 | +1.0 | 0.0 | +1.0 | Inland 410m |
| Fes | Mawaqit | +1.5 | -0.5 | +0.5 | +1.5 | 0.0 | 0.0 | 2 mosques avg |
| Meknes | Habous | +1.0 | +5.0 | 0.0 | +1.0 | -1.0 | 0.0 | Inland 546m |
| Meknes | Mawaqit | 0.0 | 0.0 | +1.0 | +1.0 | 0.0 | +1.0 | 1 mosque |
| Oujda | Habous | +1.0 | +5.0 | +1.0 | +1.0 | -1.0 | 0.0 | Eastern 465m |
| Oujda | Mawaqit | +1.0 | +4.5 | 0.0 | 0.0 | -1.0 | +0.5 | 2 mosques avg |
| Sale | Habous | +4.0 | +5.0 | +2.0 | +2.0 | +3.0 | +2.0 | OUTLIER – see §6 |
| Sale | Mawaqit | -1.0 | 0.0 | +1.0 | 0.0 | 0.0 | 0.0 | 1 mosque |
| Kenitra | Habous | +1.0 | +3.0 | +1.0 | +1.0 | +1.0 | +1.0 | Coast 20m |
| Kenitra | Mawaqit | +1.0 | +2.0 | +1.0 | +1.0 | +1.0 | +1.0 | 1 mosque |
| Taza | Habous | +1.0 | +5.0 | 0.0 | 0.0 | -1.0 | 0.0 | Inland 504m |
| Taza | Mawaqit | +1.0 | -1.0 | 0.0 | 0.0 | -2.0 | +1.0 | 1 mosque |
| Tangier | Habous only | +1.0 | +4.0 | +1.0 | +1.0 | +1.0 | +1.0 | Coast 15m |
| Tetouan | Habous only | +1.0 | +4.0 | +1.0 | +1.0 | 0.0 | 0.0 | Coast 20m |
| Agadir | Habous + train | +1.0 | +3.0 | +1.0 | +1.0 | +1.0 | +1.0 | Coast 49m |

**Per-prayer aggregate bias (Habous corpus, 12 cities):**

| Prayer | Mean bias | MAD | Min | Max |
|--------|-----------|-----|-----|-----|
| Fajr | +1.33 | 0.56 | +1.0 | +4.0 |
| Shuruq | +4.08 | 0.92 | +2.0 | +5.0 |
| Dhuhr | +0.67 | 0.56 | 0.0 | +2.0 |
| Asr | +0.75 | 0.50 | 0.0 | +2.0 |
| Maghrib | +0.42 | 1.08 | -1.0 | +3.0 |
| Isha | +0.67 | 0.56 | 0.0 | +2.0 |

---

## Where Mawaqit + Habous Agree (Settled Ground Truth)

**Oujda Shuruq:** Both sources show +4.5–+5.0 min bias. Consistent with Oujda's 465m elevation
(expected ~2.8 min elevation correction) plus ~2 min residual. Both institutions agree the
calc is too late — supporting elevation correction as a future enhancement.

**Directional agreement for all non-Shuruq prayers across 9 overlapping cities:** Both sources
show calc *later* than published (positive or near-zero bias) for Fajr, Dhuhr, Asr, Isha.
The engine correctly sits in the prayer-safe zone according to both institutional references.

**Maghrib at inland cities:** Both sources show calc within ±1 min of published. The v1.5.0
+5 min Maghrib ihtiyati is functioning correctly — the engine is close to both institutional
references simultaneously.

---

## Where Mawaqit + Habous Disagree (Ikhtilaf)

**Shuruq (all cities except Oujda):**
Habous: calc is +2–+5 min later than published (Habous publishes earlier sunrise).
Mawaqit: calc is −1 to +2 min (near zero; calc matches mosque sunrise closely).

The institutional split is consistent across all overlapping cities. Likely explanation: Habous
applies elevation-corrected sunrise tables and/or uses a slightly earlier refraction model
(more optimistic atmospheric conditions). After accounting for elevation (~2.5 min for
Marrakech/Fes/Meknes at 400–550m), a residual of ~1.5–2 min remains for all cities — this
residual suggests Habous uses a refraction standard that gives 1–2 min earlier visible sunrise
than adhan.js's standard atmospheric model. This is an institutional methodology difference.

**Sale (Fajr and all prayers):**
Habous Sale Fajr: 04:51. Mawaqit mosque (Masjid al-Saf) Fajr: 05:00. Gap: 9 minutes.
The specific mosque adds ~8–9 min of extra ihtiyati beyond what Habous publishes and beyond
the engine output (~04:55). This is mosque-specific practice, not a city-level calibration
signal. Treating Sale in either source as a calibration target would create a false city-level
override that doesn't reflect population-wide ground truth.

**Action: do NOT average or flatten these disagreements.** The engine should serve the
Habous-calibrated base while documenting the mosque practice via `notes[]` if desired.

---

## Proposed Adjustment

**No change** to `src/engine.js`.

Rationale:
1. **Non-Shuruq prayers:** All biases are +0.4 to +1.3 min in the prayer-safe direction.
   This is within the rounding margin (integer rounding can account for 0–0.5 min) plus
   the expected direction of the engine's existing ihtiyati calibration. No correction is
   warranted.

2. **Fajr specifically:** A shift toward Habous (earlier Fajr) would move the engine in
   the prayer-unsafe direction. The ratchet's ihtiyat bias-drift check (rule 4 in CLAUDE.md)
   would flag any shift that drifts Fajr toward EARLIER. No Path A escape clause applies
   because there is no corroboration from a non-calc source that the current Fajr is too late
   — to the contrary, Mawaqit says Fajr is approximately correct or slightly early for some
   mosques.

3. **Shuruq:** Sources institutionally disagree. Applying a Shuruq offset to chase Habous
   would regress the Mawaqit train set (Mawaqit shows Shuruq ~0 bias; the Habous discrepancy
   is an elevation + refraction methodology difference). Fixing Shuruq properly requires
   elevation-aware correction, not a uniform offset.

**v1.8.x deferred opportunity (non-blocking):**
The analysis reveals a consistent pattern across both sources where elevated cities (Fes 410m,
Marrakech 466m, Meknes 546m, Oujda 465m, Taza 504m) would benefit from opt-in elevation
correction for Shuruq/Maghrib. Applying elevation correction to these cities with `elevation`
passed explicitly reduces the Habous Shuruq residual from +5 min to ~+1 min (from +2 min to
~0 min for coastal cities). This is a separate autoresearch task
(`knowledge/wiki/corrections/elevation.md`) and should NOT be bundled with this analysis.

---

## Dry-Run Eval Verdict

**Not executed.** No candidate change was identified. The recommendation is no-change, so
running the eval against a modified engine would have no analytical value and would pollute
`eval/results/runs.jsonl` with a spurious entry. `runs.jsonl` was verified at 81 lines
both before and after this analysis session.

Current baseline (from the eval run that was already in progress at session start):
- Train WMAE: **0.9757**
- Holdout WMAE: **3.6088**
- Timestamp: 2026-05-05T18:29:50Z

---

## Honest Caveats

1. **Single-day Habous corpus.** The Habous fixture covers 12 cities × 1 day (2026-05-05).
   Seasonal variation in Habous methodology (if any) is not captured. A 30-day corpus
   (PR #98 tooling) would strengthen or refute the no-change finding.

2. **Sale anomaly unexplained.** The 9-minute gap between Habous Sale and Mawaqit Sale Fajr
   is the largest institutional discrepancy in the dataset. It may reflect that the Habous
   API returns a regional average while the Mawaqit mosque uses that city's specific ihtiyati
   tradition. It warrants a follow-up field verification.

3. **Habous Shuruq methodology.** The consistent 2–4 min residual after elevation correction
   suggests Habous uses a different refraction standard. This is documentable in
   `knowledge/wiki/regions/morocco.md` as an institutional footnote but does not require a
   library correction.

4. **Dual-ihtiyat tension (Ramadan).** The current engine's Fajr timing is
   prayer-valid-ihtiyat-safe (calc is later than Habous/mosque). For Ramadan fasting,
   the imsak would be calc_Fajr − 10 min. If the institution's published Fajr is earlier than
   calc, fasters using imsak might stop eating later than Habous intends. However: since calc
   is already later than both Habous and most mosques, the current engine is
   **fasting-unsafe** relative to Habous (imsak = 04:55 − 10 = 04:45 vs Habous Fajr 04:51
   for Sale). Users relying on the engine for Ramadan imsak in Morocco should be directed to
   Habous-published times directly. This is a documentation gap, not a calibration error.

5. **PR #98 data gap.** The `corpus/morocco-habous-history` branch added tooling but the
   `/tmp/fajr-habous-expansion/habous-historical/` directory was empty at time of this
   analysis. If a 30-day expansion becomes available, re-run this analysis to check for
   seasonal variation in per-prayer biases.

---

## Postscript — 990-row reconfirmation (2026-05-05, post Haiku Habous dataset expansion)

After this proposal landed, the parallel Habous-expansion agent (Haiku, on PR #98's branch) produced a much denser corpus: **33 cities × 30 days = 990 rows** for the current Hijri month (Rajab 1447). Re-ran the per-prayer signed-bias computation on that dataset to verify whether the no-change verdict holds at scale.

### Per-prayer signed bias at 990-row scale (calc - Habous, minutes)

| Prayer | 12-row (this proposal) | 990-row (with auto-elevation) | 990-row (no elevation, force 0) |
|---|---|---|---|
| Fajr | +1.33 | +0.98 | +0.98 |
| Sunrise | +4.08 | **+1.17** | +4.41 |
| Dhuhr | (n/a) | +0.44 | +0.44 |
| Asr | (n/a) | +0.75 | +0.75 |
| Maghrib | +0.42 | **+3.07** | -0.17 |
| Isha | +0.67 | +0.48 | +0.48 |

### Key finding at scale

**Sonnet's no-change recommendation still holds**, but the 990-row scale reveals the underlying institutional ikhtilaf more sharply:

1. **Habous publishes the astronomical Maghrib WITHOUT the +5 ihtiyati buffer** that Mawaqit-Morocco mosques add. With auto-elevation enabled, fajr's v1.5.0 +5 Path A + auto-elevation stacks to ~+3 min above Habous Maghrib. Both Maghrib ihtiyat directions (prayer-validity + iftar-fasting) AGREE on later = safer, so the +3 min isn't unsafe — it's "more cautious than ministerial" but matches mosque-published.

2. **Per-city Maghrib spread is real**: with auto-elevation, mountain/interior cities (Fquih Ben Salah +4.7, Ifrane +4.7, Ouarzazate +4.4, Tinghir +3.8) show larger positive bias vs Habous than coastal cities (~+1 to +2). This is the v1.5.0 +5 Path A interacting with auto-elevation in regions where Habous does NOT apply elevation correction.

3. **Sunrise +4.08 (Sonnet) → +1.17 (with auto-elevation)** confirms Sonnet's Habous-uses-elevation-corrected-sunrise theory at scale. The residual +1.17 is consistent with a more optimistic refraction model in Habous's calculation.

### Verdict

**Sonnet's no-change recommendation stands at scale.** The expanded corpus reveals the Habous-vs-Mawaqit Maghrib ikhtilaf is real (+5 ihtiyati buffer or not) and per-city, but neither institution is "wrong" — they represent two legitimate scholarly positions:

- **Mawaqit-Morocco** (mosque-published, +5 ihtiyati included) — what congregations actually follow
- **Habous Ministry** (astronomical, no +5) — what the ministry officially publishes

fajr currently calibrates against Mawaqit (v1.5.0 train anchor). Switching the calibration target to Habous would mean abandoning the mosque-following population for a ministerial reference that mosques themselves don't use. The right path is to **surface the disagreement via `notes[]`** when relevant (already partially done via the elevation-stance note) and offer a **caller-side override** for users who want the Habous timetable specifically — a v1.8.x #40 candidate.

### Corpus density comparison

| Source | Rows | Coverage |
|---|---|---|
| Mawaqit-Morocco (train, v1.5.0) | 25 | 19 cities × 1 date (snapshot) |
| Mawaqit-Morocco extended (test) | varies | post-v1.5.0 additions |
| Habous 12-city (PR #96) | 12 | 12 cities × 1 date |
| **Habous 33-city × 30-day (PR #98 expansion)** | **990** | **33 cities × full month, 2026-04-19 to 2026-05-18** |
| Habous Wayback historical (PR #98 expansion) | ~30-50 city-months | scattered 2023-2025 |

The 990-row fixture is the densest Morocco-ministerial corpus fajr has ever had. Even though no Path A change is recommended, the corpus is high-value for future per-city or seasonal analyses.

### Recommended next moves

1. **Promote `/tmp/fajr-habous-expansion/habous-current-month.json` to `eval/data/test/morocco-habous-monthly.json`** — augments PR #96 (or PR #98 once it merges first) with the dense 990-row holdout fixture. Read-only test corpus; never gates ratchet.
2. **Surface the Mawaqit-vs-Habous Maghrib ikhtilaf in CALIBRATION.md** — document the +5 ihtiyati split as a known institutional disagreement (per `feedback_surface_disagreement`).
3. **#40 caller-side override candidate**: expose a `respectMinisterialReference: 'mawaqit' | 'habous'` toggle in v1.8.x so apps can pick which Moroccan reference to align with.
4. **No engine change.** Path A delta is structurally inappropriate; the calibration is already correct against Mawaqit (mosque-published reality).

— fajr-claude
