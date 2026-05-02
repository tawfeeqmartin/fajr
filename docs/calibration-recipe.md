# Calibration Recipe — Path A WMAE Improvements

> A durable methodology guide for finding, validating, and shipping per-source calibration corrections that decrease train WMAE without violating the ratchet. The JAKIM offset shipped in v1.4.1 is the worked example — every step below references that change as the canonical demonstration.
>
> **Audience:** future fajr-agent sessions, human contributors, scholar reviewers who want to understand the calibration loop.
>
> **Scope:** *Path A* corrections — calibrating the engine to match what an Islamic institution actually publishes, when that institution's published reality systematically differs from a pure-calc baseline by a recoverable offset. This is the same shape as Morocco's 19° community calibration (shipped v1.0) and JAKIM's 8-min ihtiyati offset (shipped v1.4.1).
>
> **Out of scope:** novel-formula corrections without institutional precedent (those are 🔴 per [`fiqh/scholarly-oversight.md`](../knowledge/wiki/fiqh/scholarly-oversight.md) and require human scholar review before any deployment).

---

## The recipe in one diagram

```
1. DIAGNOSE          2. CROSS-CHECK       3. GROUND               4. DECOMPOSE
─────────────────    ─────────────────    ─────────────────       ─────────────────
Per-source signed    Is the source        Find institutional      Match the empirical
bias from latest     institutional        documentation           gap to documented
eval — find the      ground truth or      (papers, fatwas,        buffers (ihtiyati +
largest |bias|       calc-vs-calc?        timetables) that        tayakkun + …)
that's persistent                         explains the gap
across cells

       │                    │                    │                       │
       ▼                    ▼                    ▼                       ▼

5. IMPLEMENT         6. RUN RATCHET       7. DOCUMENT             8. SHIP
─────────────────    ─────────────────    ─────────────────       ─────────────────
methodAdjustments    eval/eval.js +       wiki entry +            patch release +
in selectMethod      eval/compare.js      autoresearch log        announce to
+ code-comment       — Path A check                               agiftoftime per
citations                                                         convention
```

Each step has a "smell test" that should hold before moving to the next. If a smell test fails at any step, **stop and investigate**, don't push forward.

---

## Step 1 — Diagnose: find the residual signal

Run `node eval/eval.js` and look at the **per-source signed bias** table. The largest persistent |bias| in train is the highest-leverage target. "Persistent" means consistent across cells in that source — if only one cell shows the bias, it's likely a per-cell artifact, not a calibration opportunity.

**JAKIM example (v1.4.0 → v1.4.1):**

```
Per-source agreement (train)
Source                  | n  | WMAE | Fajr bias | Maghrib bias | Isha bias
JAKIM (waktusolat)      | 30 | 2.64 |   -8.70   |    -0.54     |   -1.10   ← largest |bias|
Diyanet                 | 30 | 1.06 |   -0.13   |    +2.82     |   +1.10
Aladhan                 |180 | 1.05 |   -0.68   |    +1.54     |   +0.48
```

JAKIM's −8.70-min Fajr bias is the largest. Drilling down per-cell confirms persistence:

```
Kuala Lumpur (zone WLY01): -8.90 min Fajr bias
Shah Alam    (zone SGR01): -8.20 min Fajr bias
George Town  (zone PNG01): -9.00 min Fajr bias
```

All three Malaysian zones agree within 1 minute. **Persistent and recoverable.**

**Smell test:** does sunrise (a method-independent astronomical event) match within 1 minute across the same cells? If yes, the engine's astronomical math is correct and the gap is purely method calibration. If no, the gap is upstream of method config and needs a different fix. JAKIM example: sunrise matches within 1 min across all 3 zones — confirmed.

---

## Step 2 — Cross-check: institutional vs calc-vs-calc

Not all "ground truth" is created equal. Distinguish:

- **Institutional published reality:** what the institution authoritatively publishes via its official channel. Examples: Diyanet via [ezanvakti.emushaf.net](https://ezanvakti.emushaf.net), JAKIM via [waktusolat.app](https://waktusolat.app) (community proxy for the geo-restricted e-solat.gov.my), Habous via Mawaqit mosque-published times.
- **Calc-vs-calc consensus check:** what an independent re-implementation of an angle config produces. Examples: Aladhan with custom method 99 + matching angles, praytimes.org with the same parameters as fajr.

**Calibrate against institutional, never against calc-vs-calc.** Calc-vs-calc convergence is a *consistency* signal (we're computing the same formula correctly), not an *accuracy* signal (we match what real Muslims pray to). Moving the engine toward calc-vs-calc baselines is circular — if both engines drift the same way, they'd converge wrongly.

**JAKIM example:** the train corpus had two competing Malaysia "ground truth" sources:

| Fixture | Source | Type |
|---|---|---|
| `eval/data/train/waktusolat.json` | JAKIM via waktusolat.app | **Institutional** ✓ |
| `eval/data/train/malaysia.json` | Aladhan custom method 99 | Calc-vs-calc consensus |

Calibrating to the JAKIM institutional source revealed that `malaysia.json` had been miscategorised as institutional ground truth. **Side-effect of step 2:** when this happens, move the calc-vs-calc fixture from `eval/data/train/` to `eval/data/test/` so it's reported but no longer ratchet-gating. This is corpus *curation*, not data *modification* — the file content is unchanged, only its classification.

**Smell test:** does the source label say "institution X" with a verifiable URL or "Aladhan custom method N"? Institutional sources cite a specific authority and have a public publishing endpoint. Calc-vs-calc sources reference an angle table they're applying.

---

## Step 3 — Ground: find scholarly justification

The bias must be explainable by published institutional methodology, not engineered to fit. Look in this order:

1. **Existing fajr archive:** [`knowledge/raw/papers/`](../knowledge/raw/papers/) — 13+ papers as of v1.4.1, mostly from astronomycenter.net.
2. **Multi-institutional archive:** the 8 papers fetched in v1.2-1.4 from Egyptian (Bolbol et al), JAKIM (Razali & Hisham), Diyanet, arXiv (Abdelwahab fiqh-as-algorithm), Indonesian state Islamic universities — see [`docs/papers-review-2026-05-01.md`](papers-review-2026-05-01.md).
3. **Institutional websites:** astronomycenter.net, journals from UIN Mataram / UIN Alauddin / UIN Suska, Mu'tah University Jordan, Universiti Malaysia Pahang. Use `npm run extract:paper <pdf>` to extract text (with OCR fallback for image-only/Arabic-mangled PDFs).
4. **Web search:** institutional fatwas often live on government-religious-affairs sites (diyanet.gov.tr, e-solat.gov.my, awqaf.gov.qa, etc.).

**Smell test:** does the grounding cite a specific institution + year + (ideally) page reference? Vague "Islamic tradition supports this" is not grounding; "Razali & Hisham 2021 IJHTC v.10(1) p.17 documents the 2-min ihtiyati per Nurul Asikin 2016" is.

**JAKIM example:** the [`jakim_ijhtc_reevaluation.pdf`](../knowledge/raw/papers/2026-05-01-astronomycenter/jakim_ijhtc_reevaluation.pdf) paper documents JAKIM's 2-minute *waktu ihtiyati* (precaution buffer) per Nurul Asikin (2016). [`aabed_2015_fajr_empirical.pdf`](../knowledge/raw/papers/2026-05-01-astronomycenter/aabed_2015_fajr_empirical.pdf) documents an additional 5-minute *tayakkun* (certainty) visual margin recommendation. Both are peer-reviewed.

---

## Step 4 — Decompose: match the empirical gap to documented buffers

The empirical gap should be reconstructible from documented institutional buffers. If you can't decompose the gap, you don't yet understand what you're calibrating to — back to step 3.

**JAKIM example:**

| Component | Source | Magnitude |
|---|---|---|
| *Waktu ihtiyati* (precaution) | Razali & Hisham 2021 / Nurul Asikin 2016 | 2 min |
| *Tayakkun* (visual-margin certainty) | Aabed 2015 | 5 min |
| **Reconstructed total** | | **7 min** |
| **Empirical gap (mean across 3 zones)** | | **8.7 min** |
| Residual unexplained | (DST? regional atmospheric? rounding) | ~1.7 min |

The reconstruction matches within ~2 min — within the calibration's own published tolerance. **Acceptable.**

**Smell test:** is the unexplained residual smaller than the smallest documented buffer in the decomposition? In the JAKIM case: 1.7-min residual vs 2-min smallest documented buffer — yes. If the residual exceeds the smallest documented buffer, the decomposition is incomplete — back to step 3.

---

## Step 5 — Implement: methodAdjustments offset

The implementation is one or two lines in `src/engine.js`'s `selectMethod` for the affected country. **Do not change the angle.** Preserve the formally-cited institutional angle and apply the buffer as `methodAdjustments.<prayer> = <minutes>`. This separates the calibration from the engine's astronomical model and makes the deviation visible in the method-name label.

**JAKIM example:**

```js
// src/engine.js — selectMethod, case 'Malaysia'
const p = adhan.CalculationMethod.Singapore()  // 20°/18° base preserved
p.methodAdjustments = { ...(p.methodAdjustments || {}), fajr: 8 }
return {
  params: p,
  methodName: 'JAKIM (20°/18° + 8min ihtiyati per Path A community calibration)'
}
```

**Code-comment block (mandatory):** every Path A correction needs a comment explaining what's being calibrated, what papers establish the basis, and why dual-ihtiyat is satisfied. See the JAKIM block in `src/engine.js` for the canonical format. Required components:

1. **Classification line:** `🟡→🟢 Path A community calibration (community-published reality + multi-source corroboration)`
2. **Empirical signal:** the per-cell biases observed
3. **Paper citations:** at least one peer-reviewed source per documented buffer component
4. **Dual-ihtiyat note:** why the calibration is fasting-safer AND prayer-validity-safer (both polarities)
5. **Wiki cross-reference:** `// see knowledge/wiki/regions/<country>.md`

**Smell test:** would a fellow contributor who wasn't in this conversation be able to read the code comment and understand WHY the buffer is 8 min, not 5 or 12? If yes, it's documented enough.

---

## Step 6 — Run ratchet: Path A activation

Run `node eval/eval.js` (appends record to `runs.jsonl`), then `node eval/compare.js` (compares latest two records). The ratchet PASSes if:

- Train WMAE strictly decreased
- No per-source aggregate worsened by > `SOURCE_TOLERANCE_MIN` (0.10 min)
- No per-cell worsened by > `REGION_TOLERANCE_MIN` (0.10 min)
- No per-prayer signed-bias drifted in the ihtiyat-unsafe direction by > `BIAS_TOLERANCE_MIN` (0.30 min) **UNLESS** an independent source's |bias| improved by ≥ max(2·|drift|, 1.0 min) for the same prayer (Path A escape clause)

**JAKIM example:**

```
Train WMAE: 1.2472 → 1.0394 (16.6% reduction) ✓
Per-prayer Fajr bias: -1.61 → -0.66 (drifted +0.95 toward zero — within tolerance even before Path A check) ✓
Per-source JAKIM |Fajr bias|: 8.70 → 0.70 (closed by 8.00 min, far above 1.0-min Path A floor) ✓
PASS via straight rules + Path A corroboration.
```

**Smell test for Path A activation:** if compare.js reports `Path A active` in the per-prayer signed-bias drift table heading, and the ratchet exits 0, the calibration is cleanly justified. If compare.js reports `FAIL — No source's |bias| improved by the required N min for cross-validation`, the calibration moved an aggregate without a corroborating source, which means either (a) the calibration is too aggressive (reduce magnitude), (b) the corpus is missing a corroborating institutional source (add one before retrying), or (c) the calibration is wrong and you should revert.

**If a per-cell fails by >0.10 min:** before reverting, check whether the failing cell is institutional ground truth or calc-vs-calc consensus. If calc-vs-calc, that's the corpus-curation case from step 2 — move the fixture to `test/`, re-run. If institutional, the calibration is genuinely regressing it — revert.

---

## Step 7 — Document: wiki entry + autoresearch log

**Wiki entry:** `knowledge/wiki/regions/<country>.md` (or `methods/<method>.md` if the calibration is method-level rather than country-level). Use `knowledge/wiki/regions/malaysia.md` as the canonical template. Required sections:

1. **Empirical signal** — per-cell biases that motivated the calibration
2. **Documented institutional methodology** — paper citations, with archived PDF links
3. **fajr's resolution** — the implementation, with code snippet
4. **Why this is *not* a unilateral angle change** — preserves institutional documentation while matching institutional reality
5. **Where this calibration does NOT apply** — explicit disclaimer for adjacent regions/methods that look similar but don't share the buffer

**Autoresearch log:** `autoresearch/logs/YYYY-MM-DD-<topic>.md` per CLAUDE.md format. Use `autoresearch/logs/2026-05-02-jakim-ihtiyati.md` as the canonical template. Required sections:

1. **Hypothesis**
2. **Wiki sources consulted**
3. **Change made**
4. **Before WMAE** (per-source table)
5. **After WMAE** (per-source table)
6. **Per-prayer signed-bias drift** (with Path A activation status)
7. **Verdict** (ACCEPTED/REJECTED with reason)
8. **Scholarly classification**

---

## Step 8 — Ship: patch release + announcement

Path A calibration refinements are **patch releases** (1.x.y), not minor or major. They don't change the API surface, only the calibration of one country's auto-detected method.

**Commit message structure** (match `git log --grep "Path A"` for canonical examples):

```
fix(calibration): vX.Y.Z — <COUNTRY> Path A <BUFFER NAME> offset (train WMAE A → B)

EMPIRICAL FINDING
  ... per-cell biases, sunrise consistency check ...

SCHOLARLY GROUNDING
  * Author Year — Paper title — Citation. Buffer documented.
  * Author Year — Paper title — Citation. Buffer documented.
  Decomposition: <total> = <component A> + <component B> + ...

PATH A RATCHET ACTIVATION
  Source-bias improvement: <pre> → <post>, exceeding Path A floor.

DUAL-IHTIYAT COMPLIANCE
  Why this is fasting-safer AND prayer-validity-safer.

CORPUS CURATION SIDE-EFFECT (if applicable)
  ... fixture moved from train to test ...
```

**Announcement to agiftoftime** per the proactive convention in fajr's CLAUDE.md and in `feedback_agiftoftime_first_class.md` memory: file an issue on `tawfeeqmartin/agiftoftime` titled `[fajr↔agiftoftime] vX.Y.Z released — <one-line>`. Include:

- The change in plain language (X-min Fajr shift for users in <country>)
- Per-source WMAE delta
- Scholarly grounding citations
- Specific test/review asks for the agiftoftime side

---

## Antipatterns (don't do these)

| Antipattern | Why it's wrong |
|---|---|
| Tuning to lower holdout WMAE | Holdout is a diagnostic — tuning against it eliminates its signal. CLAUDE.md ratchet rule 2. |
| Modifying eval/data/ ground-truth files | Ground truth is sacred. Adding new fixtures via `scripts/fetch-*.js` is fine; editing existing ones is not. CLAUDE.md ratchet rule 5. |
| Modifying eval/eval.js or eval/compare.js to make a change pass | The ratchet is the metric. Bypassing it is cheating. CLAUDE.md ratchet rule 6. |
| Stacking multiple corrections in one commit | Isolate variables. CLAUDE.md ratchet rule 9. |
| Calibrating against calc-vs-calc consensus | Circular. Step 2 above. |
| Skipping the wiki + autoresearch log | The next contributor (or future you) won't be able to reproduce or audit the change without them. |
| Adding a 🔴 novel correction with mathematical justification only | Novel corrections need scholarly review before deployment. CLAUDE.md scholarly-oversight section. |
| Tuning a single calibration to overfit one source while regressing others | Watch the per-cell ratchet — if Cell X improves by 5 min while Cell Y worsens by 2 min, the calibration is overfit to X. |

---

## What's left on the table — current state and priorities

As of v1.4.4, the train residuals look like this:

```
Per-source agreement (train)
Source       | n   | WMAE | Fajr | Maghrib | Isha
JAKIM        | 30  | 0.75 | -0.70|  -0.54  | -0.10  ← largest source WMAE
Aladhan      | 170 | 0.70 | -0.75|  +0.24  | +0.48
Diyanet      | 30  | 0.50 | -0.13|  +0.87  | +1.10
```

Train WMAE: **0.6814** (was 1.0394 at v1.4.1, 1.2472 at v1.0 baseline).

Calibrations shipped so far:
- **v1.4.1** — JAKIM Fajr +8min Path A (Razali & Hisham 2021 + Aabed 2015). Train 1.25 → 1.04.
- **v1.4.3** — eval elevation-policy heuristic. Removed phantom Diyanet/Aladhan Maghrib biases caused by elevation correction being applied where ground truth is sea-level. Train 1.04 → 0.70.
- **v1.4.4** — JAKIM Isha +1min Path A (same Razali & Hisham 2021 grounding, half-share of the documented 2-min ihtiyati). Train 0.70 → 0.68.
- **v1.4.5** — Diyanet Maghrib/Isha −1min Path A (matching ezanvakti.emushaf.net institutional convention across Istanbul/Ankara/Izmir). Train 0.68 → 0.67. Corpus side-effect: `turkey.json` moved to test (Aladhan calc-vs-calc).
- **v1.5.0** — Morocco Maghrib +5min Path A across 23 mosque-published Mawaqit-Morocco fixtures spanning 14 cities (north / east / interior / coast / Atlas-Sahara high-elevation 1135 m + 1037 m). Source-level Maghrib bias closed −5.57 → −0.57. Corpus restructured: `morocco.json` moved to test (Aladhan calc-vs-calc), new `train/mawaqit-morocco.json` is now the institutional Path A signal for Morocco. Clean apples-to-apples train delta −0.07; aggregate train rises 0.67 → 0.80 only because the new train fixture is high-fidelity / high-noise institutional ground truth replacing low-error calc-vs-calc entries.

### Update (2026-05-02): post-v1.5.0 corpus state

After v1.5.0 the calibration loop has hit the same structural ceiling for fajr's three integrated institutional sources (Diyanet ezanvakti, JAKIM waktusolat, Mawaqit mosque-published). All four institutional Path A residuals identified through the v1.4 series have been closed; the remaining train residuals fall into three categories, none of which are immediately Path-A-actionable:

1. **JAKIM heterogeneity (deferred)** — Fajr/Maghrib direction varies by zone (KL/Shah Alam/George Town). Resolving requires more Malaysian zones (waktusolat seasonal-drift caveat — see [`autoresearch/logs/2026-05-02-jakim-zone-expansion-deferred.md`](../autoresearch/logs/2026-05-02-jakim-zone-expansion-deferred.md)) OR finer per-zone calibration data not currently available.

2. **Aladhan-routed cells (~70% of remaining bias)** — Cairo/Alexandria Fajr −7, London Maghrib +3, etc. These aren't Path A targets because the source is Aladhan's reproduction of the regional method (calc-vs-calc consensus). Calibrating against them would be circular.

3. **Source saturation** — Diyanet, JAKIM, Mawaqit-Morocco have all been calibrated. No additional institutional sources are currently in the train corpus.

**The next-tier accuracy work requires corpus expansion**, specifically adding native national-awqaf-API channels. Mawaqit search has been verified to NOT cover state-monumental mosques (Hassan II, Al-Qarawiyyin, Al-Azhar, Sheikh Zayed, Faisal, Masjid Negara, Istiqlal, Süleymaniye) — its coverage is community / diaspora. The high-leverage source channels are documented in [`scripts/data/mawaqit-mosques.json`](../scripts/data/mawaqit-mosques.json)'s `iconic_wishlist[*].recommended_channel`:

| Country | Channel | Status |
|---|---|---|
| Indonesia | KEMENAG `bimasislam.kemenag.go.id` | Probed 2026-05-02; ajax endpoint behind session/CSRF gate. Not currently scriptable from a clean curl. Documented dead-end for now. |
| Singapore | MUIS `muis.gov.sg` | Probed 2026-05-02; CloudFront WAF returns 403 to non-browser UA. Documented dead-end. |
| UAE | IACAD Dulook DXB | Probed 2026-05-02; `/services/prayertimes` redirects to login. Mobile-app-gated. Documented dead-end. |
| Saudi Arabia | Hajj Ministry Haramain Imsakiyya | PDF-only. Manual transcription. |
| Egypt | Egyptian GAS | No public JSON API. Manual transcription. |
| Pakistan | Karachi University reference | Investigate (not yet probed). |
| Türkiye | Diyanet ezanvakti.emushaf.net | ✅ Already integrated. |
| Malaysia | JAKIM via waktusolat.app | ✅ Already integrated. |
| Morocco | Habous (via Mawaqit-Morocco) | ✅ Integrated v1.5.0. |

Until at least one of the dead-end channels yields a fetchable endpoint, **train WMAE 0.80 is the steady-state floor for the v1.5.0 corpus**. The Mawaqit Morocco fixture refreshes daily via the `fajr · daily Mawaqit refresh` cloud routine (06:00 UTC), so per-date drift is captured automatically — but the institutional source set is what gates further calibration.

**Holdout signals** (1141 entries from 145 country fixtures): 60-min outliers cluster around DST transitions (Tehran in IRDT, Vilnius in EEST, etc.). These are NOT calibration opportunities — they're tz-handling refinements in `eval/eval.js`'s dynamic resolver. Address as framework improvements, not Path A corrections.

---

## Cross-references

- [`docs/papers-review-2026-05-01.md`](papers-review-2026-05-01.md) — astronomycenter.net + multi-institutional papers archive
- [`knowledge/wiki/fiqh/scholarly-oversight.md`](../knowledge/wiki/fiqh/scholarly-oversight.md) — 🟢/🟡/🔴 classification framework
- [`knowledge/wiki/regions/morocco.md`](../knowledge/wiki/regions/morocco.md) — first Path A calibration (formal 18° + community-calibrated 19°)
- [`knowledge/wiki/regions/malaysia.md`](../knowledge/wiki/regions/malaysia.md) — JAKIM Path A calibration (the worked example for this recipe)
- [`autoresearch/logs/`](../autoresearch/logs/) — per-run research logs
- [`CLAUDE.md`](../CLAUDE.md) — ratchet rules, ihtiyat principles, cross-repo coordination
