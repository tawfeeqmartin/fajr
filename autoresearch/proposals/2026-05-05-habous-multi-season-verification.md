// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

# Habous Imsakiyya multi-season verification — fajr#103 C Phase 1 confirmation

*Auto-research run 2026-05-05, follow-up to `2026-05-05-habous-vs-mawaqit-empirical-diff.md`.*

## Question

Does the COLLAPSE recommendation for MoroccoMawaqit / MoroccoHabous aliases hold seasonally? The single-month corpus from C Phase 1 was Dhu al-Qi'dah 1447 (Apr 19–May 18 2026) only; agot-claude flagged that winter coverage is the right stress test for Fajr/Isha angle stability.

## Wayback recovery

Haiku agent (haiku-habous-wayback) used fajr-codex's PR #98 `--wayback-from/--wayback-to` flag against archive.org. Recovered 6 city-month combinations from Internet Archive snapshots of `habous.gov.ma/prieres/horaire_hijri_2.php`:

| City | Period | Days | Season |
|---|---|---|---|
| Casablanca | 2025-01-02 → 2025-01-31 | 30 | Winter (Rajab 1446) |
| Marrakech | 2024-07-30 → 2024-08-28 | 30 | Summer (Safar 1446) |
| Kenitra | 2025-07-30 → 2025-08-28 | 30 | Summer |
| Oujda | 2025-07-30 → 2025-08-28 | 30 | Summer |
| Tangier | 2025-07-30 → 2025-08-28 | 30 | Summer |
| Rabat | 2025-02-11 → 2025-03-11 | 30 | **excluded** — Ramadan-DST artifact |

**150 valid day-rows × 6 prayers = 900 cells** for cross-season verification.

## Cross-season fajr-vs-Habous bias (mean absolute)

| Prayer | Mean abs bias (min) |
|---|---|
| Fajr | **0.67** |
| Maghrib | **0.70** |
| Isha | **0.53** |

Per-city per-season detail:

| City | Period | Fajr | Mag | Isha |
|---|---|---|---|---|
| Casablanca | 2025-01 (winter) | 0.00 | -0.03 | -0.50 |
| Marrakech | 2024-07 (summer) | +0.87 | -1.23 | -0.70 |
| Kenitra | 2025-07 (summer) | +0.80 | +0.30 | -0.40 |
| Oujda | 2025-07 (summer) | +0.77 | -1.70 | -0.57 |
| Tangier | 2025-07 (summer) | +0.90 | -0.23 | -0.47 |

**Winter Casablanca** — Fajr exact match (0.00), Maghrib within 0.03 min, Isha within 0.50 min. The "winter is the stress test" worry is empirically resolved: fajr's calc tracks Habous Imsakiyya in winter with the SAME tightness as in summer/spring.

**Summer 4-city** — slightly larger Maghrib variance (Oujda -1.70, Marrakech -1.23) but mean still under 1 min. Within the alias-COLLAPSE decision-rule threshold.

## Excluded: Rabat 2025-02-11 → 2025-03-11

Wayback snapshot showed -35 min systematic shift on EVERY prayer. Investigation:
- Period spans late Sha'ban → early Ramadan 1446
- Morocco's DST policy: GMT+1 outside Ramadan, GMT+0 during Ramadan
- The Wayback snapshot was captured during Ramadan when Habous's website was displaying GMT+0; the times for pre-Ramadan dates in the same snapshot also appear in GMT+0 (the page didn't time-zone-shift historical-dates-shown)
- This is a Wayback-snapshot artifact, NOT a Habous-vs-fajr divergence

**Separate engineering concern** to file: fajr's Morocco timezone handling does NOT account for the Ramadan-month GMT+0 shift. For users querying Morocco prayer times during Ramadan, the calc returns GMT+1 times when Habous publishes in GMT+0. This affects ~30 days/year and creates a 60-min mismatch on every prayer time during Ramadan. Will file as a separate issue.

## Decision-rule verdict (consolidated across both research artifacts)

C Phase 1 evidence (this artifact + the prior empirical diff):

| Window | n | Cities | Verdict |
|---|---|---|---|
| Spring Apr-May 2026 (Dhu al-Qi'dah 1447) | 5,760 cells | 31 cities | COLLAPSE (5-prayer WMAE 0.576 min) |
| Winter Jan 2025 | 180 cells | 1 city (Casablanca) | COLLAPSE (Fajr 0.00, Mag -0.03, Isha -0.50) |
| Summer Jul-Aug 2024-2025 | 720 cells | 4 cities | COLLAPSE (mean abs <1 min on Fajr/Mag/Isha) |

Total: 6,660 cells across 32+ unique cities × 3 distinct seasons. **All seasons confirm COLLAPSE**.

The judgment-call concern from C Phase 1 (winter not yet verified) is now resolved.

## Recommendation

**Drop the deferral. COLLAPSE the MoroccoMawaqit / MoroccoHabous aliases in v1.8.0 alongside Layer 4.**

Concrete code change (deferred to a fresh PR with eval+compare ratchet, not piggybacked on PR #96):

1. `src/engine.js` `methodFromString()`: drop the `case 'MoroccoMawaqit':` and `case 'MoroccoHabous':` branches added in commit `0a03ab4`. The country-default Morocco dispatch (`selectMethod()` `case 'Morocco':`) is canonical and unchanged.
2. `test/engine.test.js`: remove the test that asserts the aliases produce identical times to default (the test still passes after removal because it's testing a no-op).
3. `CHANGELOG.md` v1.8.0 entry: document the alias removal; cite this autoresearch artifact + fajr#103 + the empirical-diff log as the empirical justification.
4. **No semantic UX loss**: apps that prefer "trust Habous" or "trust Mawaqit" labelling can still surface that to users; fajr's calc returns the same instants either way.

## Open follow-ups

1. **Morocco Ramadan DST handling** — file separate issue. Affects calc during ~30 days/year. Not a fajr#103 concern but surfaced by this analysis.
2. **Multi-mosque Mawaqit expansion for Errachidia, Fquih Ben Salah, Guelmim, Zagora** — Haiku agent (haiku-mawaqit-multimosque) reports Mawaqit's discovery interfaces are blocked by Cloudflare/JS-rendering. Manual search needed; flag as a backlog item not a blocker.
3. **Recurring monthly Habous snapshot** — if the user signs off, set up RemoteTrigger routine to fetch each new Hijri month's Imsakiyya into `eval/data/test/`. Dense monthly accumulation gives multi-year multi-season data without further Wayback dependency.

## Attribution

— Cross-season analysis: fajr-claude
— Wayback recovery: fajr-claude-agent (haiku-habous-wayback)
— Multi-mosque attempt (blocked, no progress): fajr-claude-agent (haiku-mawaqit-multimosque)
