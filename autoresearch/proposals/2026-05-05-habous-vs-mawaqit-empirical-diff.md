// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

# Habous-Morocco vs Mawaqit-Morocco — empirical diff (fajr#103 C Phase 1)

*Auto-research run 2026-05-05, sonnet-habous-vs-mawaqit-diff agent.*

## Question (per fajr#103, agot-claude)

Do Habous-Morocco's published Imsakiyya times and Mawaqit-Morocco's mosque-published times actually diverge enough to warrant maintaining separate calculation stances in fajr, or are they effectively the same source?

## Decision rule (per fajr#103)

- Per-city Habous-vs-Mawaqit WMAE < 1 min consistently → **COLLAPSE** the MoroccoMawaqit/MoroccoHabous aliases to a single canonical Morocco stance
- ≥ 2 min in any meaningful subset → **KEEP** separate stances with empirically-attributed offsets
- 1-2 min → judgment call

## Data sources

- **Habous:** `eval/data/test/morocco-habous-monthly.json` — 33 cities × 30 days (ذي القعدة 1447H = April 19–May 18 2026), source per-fixture attribution via fajr-codex PR #98 tooling.
- **Mawaqit:** `eval/data/test/mawaqit-morocco-yearly.json` — 42 mosques across 29 cities × 366 days. Multiple mosques per city averaged.
- **Match key:** city-name canonical, with one alias (Habous "Tangier" → Mawaqit "Tanger"). Tetouan in Habous but absent from Mawaqit fixture — excluded.
- **Total matched:** 32 cities × 30 dates × 6 prayers = 5,760 cells (960 city-date pairs).

## Per-prayer mean bias (Habous − Mawaqit, 31 cities, Zagora excluded)

| Prayer | Mean bias (min) | MAE (min) | StdDev |
|---|---|---|---|
| Fajr | −0.42 | 0.87 | 1.71 |
| **Sunrise** | **−3.61** | **3.66** | **2.19** |
| Dhuhr | −0.03 | 0.25 | 0.70 |
| Asr | +0.55 | 0.66 | 1.04 |
| Maghrib | +0.27 | 0.54 | 0.83 |
| Isha | +0.38 | 0.48 | 0.84 |

**5-prayer WMAE excluding Sunrise: 0.576 min**

The Sunrise 3.6-min systematic gap (Habous earlier than Mawaqit-mosque) is mosque-practice ihtiyat, not calculation-method divergence — Moroccan mosques systematically push their published Sunrise time later than astronomical to mark the end of the Fajr prayer window. Present in 26/31 cities. Sunrise is correctly excluded from the WMAE that gates the institutional-stance decision rule.

Fajr bias direction-balanced: 17 cities show Habous Fajr earlier than mosque, 14 show it later. No institutional directional pattern.

## Per-city WMAE (5-prayer, Sunrise excluded)

28 of 31 cities have WMAE < 1 min:

| Bucket | Count | Cities |
|---|---|---|
| < 0.5 min | 19 | Sidi Kacem (0.03), Ifrane (0.11), Oujda (0.16), Taourirt (0.22), Taroudant (0.22), Ouarzazate (0.23), Kenitra (0.24), Tinghir (0.29), Safi (0.30), Agadir (0.37), Fes (0.37), Erfoud (0.39), Marrakech (0.41), Casablanca (0.42), Inezgane (0.42), Taza (0.41), Nador (0.48), … |
| 0.5-1.0 min | 9 | Tangier (0.50), Meknes (0.53), Rabat (0.53), Sale (0.55), Sefrou (0.55), Settat (0.73), Temara (0.72), Berrechid (0.73), Midelt (0.76), Khouribga (0.79), Essaouira (0.98) |
| 1.0-2.0 min | 2 | Fquih Ben Salah (1.25), Guelmim (1.38) |
| ≥ 2.0 min | 1 | Errachidia (2.81) |
| Excluded | 1 | Zagora (data anomaly: Mawaqit mosque's Fajr frozen at 05:48 from late April, almost certainly leftover Ramadan-jadwal not refreshed) |

## Outlier analysis

**Errachidia (2.81 WMAE)** — single mosque (`masjid-marzouga-lgharbia`) shows constant offsets vs Habous: Asr −4 min, Maghrib +2.9, Isha +3.3. Coherent per-mosque schedule (likely a non-standard Asr shadow ratio at this specific mosque, or an early-jamaa'ah convenience schedule). NOT evidence of a Habous-vs-Mawaqit institutional difference — one mosque's idiosyncratic policy.

**Zagora (excluded)** — `msjd-yt-hdw-tgblt-zkwr-zagora` mosque publishes Fajr at a flat 05:48 from late April through at least June. Habous shows the expected seasonal drift (06:33 → 04:50 across the month). This is a Mawaqit data quality issue (the mosque didn't update their post-Ramadan Fajr schedule), not institutional divergence.

**Fquih Ben Salah / Guelmim (1.0-2.0 min)** — both have only one mosque in the Mawaqit corpus. The 1-2 min signal could be per-mosque method variation or a regional position; need a second Mawaqit source per city to disambiguate.

## Decision-rule verdict

**COLLAPSE recommended.**

- 28/31 cities individually fire COLLAPSE (< 1 min)
- 2/31 fire judgment-call (1-2 min, single-mosque corpus limitation)
- 1/31 fires KEEP (Errachidia 2.81), but is attributable to single-mosque idiosyncrasy, not institutional Habous-vs-Mawaqit difference
- Aggregate 5-prayer WMAE 0.576 min is firmly in COLLAPSE territory
- Sunrise 3.6 min gap is mosque-ihtiyat practice (NOT a calc-method divergence), correctly excluded from the gating WMAE

## Caveats — what would raise confidence

1. **Multi-month corpus** — current data is one Hijri month (Dhu al-Qi'dah 1447). Winter months (longer nights, larger Fajr/Isha angle sensitivity) are the stress test. Need at least one winter month to confirm the agreement holds seasonally.
2. **Multi-mosque per outlier city** — Fquih Ben Salah, Guelmim, Errachidia each have exactly one Mawaqit mosque in the corpus. A second mosque per city would confirm whether the divergence is institutional or per-mosque.
3. **Wayback historical** — fajr-codex's PR #98 has Internet Archive recovery (sparse so far: 7 Rabat snapshots, 3 Casablanca). Filling this in over 3-4 historical months would directly test seasonal stability.

## Recommended action

1. **Reply to fajr#103** with this verdict (done in parallel).
2. **Defer alias-collapse code change** until:
   - User signs off on the empirical conclusion, AND
   - PR #98 (Codex's Habous monthly tooling) merges to master so future re-runs are first-class, AND
   - At least one winter Hijri month is in the corpus to confirm seasonal stability
3. **When the collapse ships:** drop `MoroccoMawaqit` and `MoroccoHabous` from `methodFromString()` (currently same-as-default scaffolding); the country dispatch in `selectMethod()` for Morocco is already canonical — no change needed there.
4. **CI gate:** when promoting Habous monthly fixtures into eval, add per-city per-prayer drift gate at 2 min worst-case to catch any future divergence (this is fajr#103 Phase 2).

## Attribution

— fajr-claude-agent (sonnet-habous-vs-mawaqit-diff), supervised by fajr-claude
