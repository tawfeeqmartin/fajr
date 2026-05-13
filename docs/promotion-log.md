# fajr Position Registry — Promotion Log

This is the append-only audit trail for confidence-grade changes in
[`docs/positions.md`](positions.md). Each entry records which evidence
justified a move between grades (D ↔ C ↔ B ↔ A) per the [Promotion Criteria
section](positions.md#promotion-criteria).

When a paper reviewer, scholarly contributor, or downstream agent asks "why
is Singapore A and Egypt C right now?" the answer is the most recent log
entry for that region, plus the evidence it cites.

Demotion entries (`X → Y` where `X` precedes `Y` alphabetically — i.e.
A→B, B→C, C→D) follow the same shape. Grades drift both directions
according to the criteria; this log captures both.

---

## 2026-05-13 — Bootstrap: retroactive classification of all current rows

**PR:** (this commit — fajr#113 closure)
**Trigger:** PR #110 introduced the position registry without explicit
promotion thresholds; fajr#113 added mechanical criteria. This entry
captures the evidence-state for each region at the moment the criteria
landed, so future promotions/demotions have a verifiable baseline.

**Evidence per region (snapshot 2026-05-13):**

- **Morocco — A**: dispatch present in `selectMethod()` ✓; wiki page
  `knowledge/wiki/regions/morocco.md` ✓; fixtures
  `eval/data/test/mawaqit-morocco-yearly.json` (15K+ rows × 42 mosques)
  + `eval/data/test/morocco-habous-monthly.json` (990 rows × 33 cities)
  + `eval/data/test/morocco-habous.json` (12 cities × 1 day) covering >3
  cities × >2 seasons ✓; multi-season mean abs bias < 1 min per fajr#103
  C Phase 1 verification ✓; primary URL `https://www.habous.gov.ma`
  cited in `docs/data-sources.md` + wiki ✓.

- **Singapore — A**: dispatch present (MUIS country default) ✓; wiki page
  `knowledge/wiki/regions/singapore.md` ✓; fixture `eval/data/test/muis.json`
  (1 city × 365 days, Singapore is geographically point-sized) ✓;
  per-source WMAE 0.45 (Maghrib bias -0.27, Isha -0.22 — well under 1
  min on all prayers) ✓; primary URL `data.gov.sg` (Open Data Licence
  v1.0) cited ✓.

- **Türkiye — B**: dispatch present (Diyanet country default) ✓; wiki page
  `knowledge/wiki/regions/turkiye.md` ✓; fixtures
  `eval/data/test/turkey.json` (3 cities × 10 days, train) + holdout
  via Aladhan world fixtures; per-source WMAE 0.50 well under 1 min on
  the 3 train cities ✓; primary URL `ezanvakti.emushaf.net` cited ✓.
  **Why not A**: 3 train cities × 10 days only — does not meet ≥3 cities
  × ≥2 seasons criterion. Verified ezanvakti city-ID mapping (PR #111)
  unlocks yearly fixture promotion which would move Türkiye to A. Open
  follow-up.

- **Malaysia — B**: dispatch present (JAKIM country default) ✓; wiki page
  `knowledge/wiki/regions/malaysia.md` ✓; fixtures
  `eval/data/train/waktusolat.json` (3 zones × 10 days) ✓; per-source
  WMAE 0.45 ✓; primary URL `e-solat.gov.my` (via waktusolat.app proxy)
  cited ✓. **Why not A**: 3 train zones × 10 days does not meet ≥2
  seasons. Yearly fixture promotion would move Malaysia to A.

- **Indonesia — B**: dispatch present (KEMENAG country default) ✓; wiki
  page `knowledge/wiki/regions/indonesia.md` ✓; fixtures
  `eval/data/test/kemenag.json` (34 provincial capitals × 31 days,
  WMAE 2.27) + `eval/data/test/indonesia-myquran.json` (21 cities × 7
  days). **Why not A**: per-source bias on the 1054-row kemenag fixture
  is -1.78 Fajr / -2.85 Maghrib — exceeds the ≤1 min A threshold on
  Maghrib. myQuran wrapper divergence tracked in fajr#97.

- **Saudi Arabia — B**: dispatch present (UmmAlQura country default) ✓;
  wiki page `knowledge/wiki/regions/saudiarabia.md` ✓; fixtures via
  Aladhan train Saudi.json (3 cities × 10 days). **Why not A**: real
  GPH (Two Holy Mosques) primary URL is unreachable from this network
  (geo-blocked); citation chain is institutional-reference only per
  fajr#109 cleanup. Promotion to A requires either a Saudi-routable
  contributor pulling primary data OR Aladhan UmmAlQura cross-validation
  reaching ≥3 cities × ≥2 seasons.

- **Pakistan / South Asia cluster — B**: dispatch present (Karachi
  country default) ✓; wiki pages for the cluster ✓; fixture
  `eval/data/test/iran-pakistan-aladhan-yearly.json` (5 Pakistan cities
  × 365 days, calc-vs-calc, WMAE 0.72). **Why not A**: calc-vs-calc only,
  no direct institutional ground truth from University of Islamic
  Sciences Karachi (no canonical web URL exists per agot#109). Aladhan
  reproducibility ≠ institutional primary.

- **France — B**: dispatch present ✓; wiki page ✓; fixture
  `eval/data/test/mawaqit-france-yearly.json` (8 mosques × 366 days).
  **Why not A**: per-mosque Maghrib bias mean -2.75 (Toulouse worst at
  -4.59) exceeds the ≤1 min A threshold; UOIF vs CIL vs Mawaqit
  cluster-divergence still ikhtilaf-active per `knowledge/wiki/regions/france.md`.

- **UAE — B**: dispatch present ✓; wiki page ✓; IACAD/Burj Khalifa
  precedent documented in `knowledge/wiki/corrections/elevation.md` +
  primary scholarly chain (Ibn Uthaymeen *Majmoo'* 15/437) vendored.
  **Why not A**: no automated UAE-specific institutional fixture yet
  (IACAD Dulook DXB times not scraped). Promotion to A requires either a
  manual IACAD Imsakiyya capture or contact with Dr. Al Haddad's office.

- **India — C**: dispatch present (Karachi country default) ✓; wiki
  page `knowledge/wiki/regions/india.md` ✓; fixtures only via Aladhan
  world coverage. **Why not B**: heterogeneous local practice (Hanafi /
  Shafi'i / Shia split per fajr#114) makes a single country-default
  fixture meaningless. City-level overrides (Kerala, Lucknow) are
  appropriate; country-level promotion to B requires either accepting
  Karachi as the answer for the dominant Hanafi case or surfacing the
  split in `known-disagreements.md` and grading sub-regions separately.

- **UK — C**: dispatch present (MoonsightingCommittee country default) ✓;
  wiki page ✓; fixtures `eval/data/test/mawaqit-uk-yearly.json` (5
  mosques × 366 days) + `uk-aladhan-moonsighting-yearly.json` (3 cities
  × 365 days). **Why not B**: London Maghrib/Dhuhr residual still open
  in fajr#70 (Mawaqit-London vs AlAdhan MoonsightingCommittee, opposite
  sign from the original +5/+3 hypothesis); source arbitration unresolved.

- **Egypt — C**: dispatch present (Egyptian country default) ✓; wiki
  page ✓; fixtures only via stub `eval/data/test/egypt-esa.json` (ESA
  VIEWSTATE form blocked raw HTTP scrape). **Why not B**: Cairo /
  Alexandria residual unresolved in fajr#69, no institutional fixture
  beyond stub.

- **Iran / Shia city overrides — B**: dispatch present (Tehran country
  default + per-city Shia overrides) ✓; wiki page ✓; fixture
  `eval/data/test/iran-pakistan-aladhan-yearly.json` (5 cities × 365
  days, WMAE 0.59). **Why not A**: calc-vs-calc (Aladhan method=7) only;
  Institute of Geophysics, University of Tehran is the original publisher
  but the site is Cloudflare-protected so no direct fetch path exists.

- **High latitudes — C**: dispatch present (HighLatitudeRule.TwilightAngle
  + Tarabishy thresholds) ✓; wiki pages ✓; fixtures
  `eval/data/test/high_latitude.json` + `svalbard.json` + `anchorage.json`.
  **Why not B**: fiqh-necessity disagreement (Aabed 2015, Tarabishy 2014,
  Odeh 2009 disagree); fajr currently emits Layer 4 high-lat info
  warnings + multiple Path A rules. Promotion to B requires picking a
  default and documenting the rest as `known-disagreements.md` entries
  rather than parallel methods.

- **Unknown / fallback — D**: by definition. No country bbox match → ISNA
  fallback with `methodSource: 'fallback'` and `validityWarnings[]`.

**Total at bootstrap (2026-05-13):** 2 × A, 8 × B, 4 × C, 1 × D. The
mechanical criteria preserve the framing PR #110 introduced while making
the path to A explicit for the 8 currently-B regions (most are blocked on
either yearly fixture promotion or primary URL reachability).

**Notes:** This bootstrap entry is the only one without a preceding
promotion event — every subsequent change should reference a specific
trigger (new fixture, source-freshness re-run, primary citation landing,
bias regression, etc.) per the criteria.

— fajr-claude
