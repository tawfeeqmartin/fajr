# CLAUDE.md — fajr autoresearch agent instructions

This file is for AI agents working within the fajr autoresearch loop. Read it fully before making any changes.

---

## What this repository is

**fajr** is a high-accuracy Islamic prayer time library. It wraps `adhan.js` with an accuracy layer that applies astronomically-grounded corrections validated against official timetables and field observations.

The goal is to **reduce WMAE** (Weighted Mean Absolute Error) against ground truth timetable data — measuring in seconds, not minutes.

---

## Two-loop architecture

### Loop 1: Knowledge Base (continuous, human-driven)

```
knowledge/raw/     →    knowledge/compile.md    →    knowledge/wiki/
(raw sources)           (LLM compilation              (structured facts)
                         instructions)
```

Raw sources (papers, fatwas, timetables, code, field observations) are compiled into the structured wiki by a human following `knowledge/compile.md`. You READ the wiki; you do not write to it.

### Loop 2: AutoResearch (batch, agent-driven — that's you)

```
src/engine.js  +  knowledge/wiki/  →  propose change  →  eval/eval.js  →  ratchet
```

Your job in a single autoresearch run:
1. Read `src/engine.js` — understand the current calculation engine
2. Read relevant `knowledge/wiki/` pages — find an accuracy opportunity
3. Propose a specific change to `src/engine.js`
4. Run `node eval/eval.js` — measure WMAE before and after
5. If WMAE decreases: commit the change with `logs/` entry
6. If WMAE increases or stays the same: revert and log the attempt

---

## File permissions

### READ-ONLY (never modify)

| Path | Reason |
|------|--------|
| `eval/` | Eval harness integrity — changing eval to pass is cheating |
| `eval/data/` | Ground truth data — sacred, never modify |
| `knowledge/raw/` | Raw sources — archived as-is |
| `knowledge/wiki/` | Compiled knowledge — modified only by human via compile.md |
| `knowledge/compile.md` | Wiki compilation instructions |
| `knowledge/lint.md` | Wiki quality rules |

### EDITABLE (your primary target)

| Path | What it does |
|------|-------------|
| `src/engine.js` | Core calculation engine — all accuracy corrections live here |
| `src/methods.js` | Method definitions (angle tables, regional defaults) |
| `src/elevation.js` | Elevation correction formulas |
| `autoresearch/logs/` | Append-only research log — always log your runs |

### DO NOT TOUCH

| Path | Reason |
|------|--------|
| `src/index.js` | Public API surface — changes here break users |
| `package.json` | Dependency changes require human review |

---

## How to reference the wiki

The wiki is organized by topic:

```
knowledge/wiki/
├── astronomy/      Solar position, refraction, twilight, horizon geometry
├── fiqh/           Islamic law definitions of prayer time boundaries
├── methods/        Per-method angle tables and regional usage
├── regions/        Country/region-specific corrections and timetable sources
├── corrections/    Specific correction formulas with scholarly classification
└── index.md        Master index — start here
```

When proposing a change, cite the specific wiki page(s) that support it. Example:

```js
// Elevation horizon correction — see knowledge/wiki/corrections/elevation-horizon.md
// Classification: 🟢 Established
const horizonDip = Math.sqrt(2 * elevation / EARTH_RADIUS_M) * (180 / Math.PI)
```

---

## Running the eval

```bash
node eval/eval.js
```

Output format:
```
WMAE Report
===========
Method: [current engine description]
Ground truth sources: [N timetables, M observations]

Prayer   | MAE (min) | Weighted | Notes
---------|-----------|----------|------
Fajr     |      1.23 |     1.85 |
Shuruq   |      0.87 |     0.87 |
Dhuhr    |      0.12 |     0.12 |
Asr      |      0.43 |     0.43 |
Maghrib  |      0.21 |     0.21 |
Isha     |      1.45 |     1.60 |
---------|-----------|----------|------
WMAE     |           |     0.85 | ← this is the number that matters
```

The **WMAE** (Weighted Mean Absolute Error) is the single number to minimize. Fajr and Isha have higher weights because they are the most affected by twilight angle uncertainty.

---

## Ratchet rules

These rules are non-negotiable. They are mechanically enforced by `eval/compare.js` — run it after every candidate change.

1. **Commit only if TRAIN WMAE strictly decreases.** The ratchet number is `train.wmae` from `eval/results/runs.jsonl`, computed only from `eval/data/train/`. A wash is a rejection.

2. **The test set (`eval/data/test/`) is a holdout.** It is reported as `Holdout WMAE` but never gates accept/reject. Its purpose is to detect overfitting: if holdout WMAE rises while train WMAE falls, the engine is overfitting to whichever timetables happened to be digitized first. Never tune against the holdout — doing so destroys its signal.

3. **No per-region regression.** If any single city in the train set worsens by more than `REGION_TOLERANCE_MIN` (currently 0.10 min), reject the change even if overall WMAE falls. This prevents the optimizer from flattening legitimate ikhtilaf — improving an aggregate by sacrificing a region's accuracy.

4. **No ihtiyat-unsafe bias drift.** `eval/compare.js` tracks per-prayer signed bias (calc − ground truth, in minutes). If Fajr / Maghrib / Isha bias drifts more than `BIAS_TOLERANCE_MIN` (currently 0.30 min) toward EARLIER (negative direction), or Shuruq drifts toward LATER (positive direction), reject the change. MAE alone is direction-blind; ihtiyat is not.

5. **Never modify `eval/data/`.** Ground truth is sacred. New stress-test fixtures may be *added* via `scripts/fetch-aladhan.js` (test cases route to `eval/data/test/`), but existing files are not edited.

6. **`eval/eval.js` and `eval/compare.js` are also read-only for the autoresearch agent.** They are the ratchet itself; modifying them to make a change pass is cheating. Framework improvements to the eval are a separate, human-driven track.

7. **Always log your run** in `autoresearch/logs/YYYY-MM-DD-HH-MM.md` whether it succeeds or fails. Include: hypothesis, change made, before/after WMAE (train and holdout), per-region deltas, signed-bias deltas, verdict.

8. **Tag every correction** with its scholarly classification (see below).

9. **One concern at a time.** Do not combine multiple correction changes in one commit. Isolate variables.

---

## Islamic accuracy principles

### Ihtiyat (احتياط) — Precaution

When uncertain between two values, err toward the **more cautious time**. The cautious direction depends on which Islamic obligation is at stake:

**Prayer-validity ihtiyat (the default in `eval/compare.js`):**
- Fajr: use the **later** time — praying before actual dawn invalidates the prayer
- Maghrib: use the **later** time — to ensure sunset has completed
- Isha: use the **later** time — to ensure twilight has fully ended

**Ramadan-fasting ihtiyat (inverts Fajr's polarity):**
- Imsak / start of fasting: stop eating at the **earlier** candidate time — eating past actual dawn breaks the fast
- The classical resolution is *imsak* — a buffer (typically ~10 minutes) **before** the calculated Fajr at which fasters stop eating, while the prayer itself begins at the (later) calculated Fajr. Imsak provides the fasting-precaution; the calculated Fajr should be the *actual* astronomical dawn so both obligations are honoured.

Concretely: a Fajr time that is 5 minutes *late* relative to mosque-published reality is prayer-safe but **fasting-unsafe** — fasters following imsak (Fajr − 10 min) would be eating until 5 minutes past actual dawn. For populations where Ramadan fasting is the dominant concern (Morocco, Maghreb, much of the Muslim world during Ramadan), the "later = safe" prayer-only heuristic is wrong. See `autoresearch/logs/2026-04-30-21-27.md` for the case study.

**How `eval/compare.js` handles this:** The default ratchet flags prayer-validity ihtiyat — Fajr drifting earlier is treated as unsafe. There is an **escape clause** (Path A): if the aggregate drift is in the prayer-only-unsafe direction BUT at least one independent reference source's per-source signed bias for that prayer also moves toward zero by ≥2× the aggregate drift magnitude, the drift is treated as cross-validated and is NOT flagged. This catches the case where the engine is moving toward what mosques actually publish — fasting-safer and reality-aligned — rather than drifting away.

Never implement a "bold" correction that risks cutting short a prayer's valid time **without independent corroboration from a non-calc source** (Mawaqit / Diyanet / JAKIM). Mathematical math-vs-math improvements alone do not justify breaching prayer-validity ihtiyat.

### Ikhtilaf (اختلاف) — Legitimate disagreement

Multiple calculation methods (ISNA 15°, MWL 18°, Egyptian 19.5°, etc.) represent **legitimate scholarly disagreement**, not errors. Do not treat one method as "correct" and others as "wrong." The eval uses region-appropriate ground truth — what is accurate in Rabat may not be the right metric for Karachi.

### Scholarly oversight classification

Every correction in `src/engine.js` must carry a classification comment:

| Tag | Meaning | Action required |
|-----|---------|----------------|
| 🟢 Established | Consensus in Islamic astronomy, classical sources | Can deploy |
| 🟡→🟢 Approaching established | Recently documented in one or more regional institutions; trajectory toward consensus | Deploy with light disclosure; document institution and ruling |
| 🟡 Limited precedent | Used in some regions/institutions, minority scholarly view | Note in docs, flag for review |
| 🔴 Novel | No clear precedent in Islamic scholarly tradition | **Do not deploy without scholarly review** |

**Current 🟡→🟢 items:**
- **Elevation correction (Shuruq/Maghrib):** UAE Grand Mufti Dr. Ahmed Al Haddad issued a floor-stratified fatwa for Burj Khalifa (IACAD Dulook DXB app); Malaysia JAKIM applies topographic elevation systematically. Saudi Arabia deliberately does NOT apply it (jama'ah priority). See [[wiki/corrections/elevation#international-precedent]].

If you derive a correction from pure astronomical reasoning with no Islamic scholarly basis, it is 🔴 Novel by default, regardless of how mathematically sound it is. The *shar'i* definitions of prayer times are prior to astronomy; astronomy serves the *shar'*.

---

## The wasail/ibadat distinction

This library improves the **wasail** (الوسائل, the means) of determining prayer times — the mathematical and astronomical tools. It does not and cannot change the **ibadat** (العبادات, the acts of worship) themselves.

The *shar'i* definition of Fajr is: "the second dawn (*al-fajr al-sadiq*) — when white light spreads horizontally across the horizon." This is fixed by Islamic law. What fajr improves is the precision of translating that definition into a clock time at a given GPS coordinate and elevation.

🔴 Novel corrections affect the *wasail* in ways not validated by the scholarly tradition. They may be astronomically correct while being *shar'i*-untested. Treat them accordingly.

---

## Logging format

Each autoresearch run should produce a log file at `autoresearch/logs/YYYY-MM-DD-HH-MM.md`:

```markdown
# AutoResearch Run — YYYY-MM-DD HH:MM UTC

## Hypothesis
[What you expected to improve and why]

## Wiki sources consulted
- knowledge/wiki/[page].md — [one-line summary]

## Change made
[Description of the change to src/engine.js]

## Before WMAE
[Table from eval output]

## After WMAE
[Table from eval output]

## Verdict
ACCEPTED / REJECTED — [reason]

## Scholarly classification
🟢 / 🟡 / 🔴 — [justification]
```

---

## Code Review Pipeline

Every PR goes through up to **five** review layers before merge. Layers 1, 2, 3 run automatically on every PR; Layer 4.5 is an auto-merger that executes routine merges; Layer 4 is the human, reserved for the cases that actually need judgment. **All five are wired up — see implementation pointers below.**

```
PR opened → Layer 1   (Lint, CI, blocks)
         → Layer 2   (Engineering review, daily routine, advisory)
         → Layer 3   (Fiqh review, daily routine, advisory)
         → Layer 4.5 (Auto-merger, daily routine; merges if all gates pass; else escalates)
         → Layer 4   (Human merge, judgment-only — only for PRs Layer 4.5 escalated)
```

Layers 1, 2, 3 are *complementary not redundant* — Layer 1 enforces convention mechanically (Bismillah, classification-tag presence), Layer 2 reviews engineering correctness (correctness, ratchet, API contract), Layer 3 reviews scholarly accuracy (classification *correctness*, fiqh grounding, ikhtilaf preservation). Layer 4.5 then reads Layers 1+2+3 outputs and either merges (if all six gates below pass) or escalates to the human (Layer 4) for cases that genuinely need judgment.

### Layer 1 — Automated Lint (`.github/workflows/lint.yml`)

Implemented as a GitHub Actions workflow that runs on every push and PR to master. Fast (~5s), deterministic, blocks merge on any check that's in enforce mode.

| Check | Mode | Rule |
|-------|------|------|
| **Bismillah headers** | enforce | All `.js` and `.sh` source files must start with the two-line Bismillah header (adapt comment syntax to language; for shebang scripts place after shebang). |
| **No hardcoded angles** | enforce | `fajrAngle` / `ishaAngle` outside `src/engine.js` and `src/methods.js` is rejected. Catches drift where contributors copy-paste an angle into tests / eval / scripts. |
| **Scholarly classification + wiki citation** | warn-only (Phase 1) | Every `case '<Country>':` in `selectMethod()` should carry a 🟢/🟡/🔴 tag AND cite `knowledge/wiki/...`. Phase 1 surfaces missing tags as warnings while master is being backfilled; Phase 2 (after backfill) flips to enforce. |
| **Tests must pass** | enforce | `npm test` (vitest, 76+ tests) must pass. The existing `test.yml` workflow covers this independently; the lint job runs it again as a single-stop gate. |
| **No per-prayer regression** | enforced by `eval/compare.js` | Verified by the ratchet check, not the lint job — `eval/compare.js` is the source of truth and is read-only for the autoresearch agent. |
| **Public API contract** | enforced by tests | The 76-test vitest suite covers public API stability — type checks via `src/index.d.ts` and behavioural assertions via `test/engine.test.js`. |

### Layer 2 — Engineering Review (RemoteTrigger cloud routine `trig_01QvX1USUVEK9w8mVSyesKPX`)

Runs **daily at 18:30 UTC** in Anthropic's cloud (Claude Sonnet 4.6, sandboxed CCR session with read-only tools). Reviews every open PR that doesn't already carry a `🔎 fajr-code-reviewer` comment, then posts a structured PR comment with findings. **Engineer-perspective:** correctness, ratchet integrity, code quality.

The review prompt covers:

- **Correctness** — diff matches description; off-by-ones; sign errors against the `signedMinutesDiff(calc, gt)` convention; missing null guards; wrong defaults.
- **Ratchet integrity** — does the autoresearch log support the claimed eval result? Any forbidden modifications to `eval/eval.js` / `eval/compare.js` / `eval/data/`?
- **Ihtiyat alignment** — rounding direction shar'i-safe? Dual-ihtiyat tension cited correctly? Ikhtilaf preserved rather than flattened?
- **Scholarly classification** — new corrections have 🟢/🟡/🔴 + wiki citation?
- **API contract** — `src/index.js` / `src/index.d.ts` changes non-breaking?
- **Bismillah / convention** — new files have header?
- **Test coverage** — new behaviour covered in `test/engine.test.js`?
- **Surface-disagreement principle** — new institutional disagreements use `notes[]` not silent defaults?

Output format: structured PR comment with `🟥 Blockers / 🟨 Suggestions / 🟪 Flags for human judgment / 🟩 Looks good` sections plus a CLAUDE.md compliance paragraph and test-coverage note. Comments are **advisory not blocking** — they don't approve / request-changes via the GitHub PR review API; merge stays a Layer 3 human decision.

The routine prompt itself lives in the RemoteTrigger configuration; to update it, fetch via `RemoteTrigger.get(trigger_id)`, edit, and `RemoteTrigger.update(trigger_id, body)`.

### Layer 3 — Fiqh Review (RemoteTrigger cloud routine `trig_01MNbo5NtCp2rE5PuD2CNqJ2`)

Runs **daily at 19:30 UTC** (one hour after Layer 2 to avoid comment collision) in Anthropic's cloud (Claude Sonnet 4.6, sandboxed CCR session with Read / Glob / Grep / Bash / WebFetch). Reviews every open PR that doesn't already carry a `📜 fajr-fiqh-reviewer` comment, then posts a structured PR comment with **scholar-perspective findings**.

What Layer 3 covers (and Layer 2 doesn't):

- **Scholarly-classification accuracy** — verifies the assigned 🟢/🟡→🟢/🟡/🔴 tag matches the actual scholarly precedent. Flags tags that are too generous (e.g. 🟢 used for what's actually 🟡→🟢; 🟡 used as placeholder for 🔴).
- **Wiki-citation validity** — reads the cited wiki pages and verifies they actually support the claim. Catches cherry-picked sentences, paraphrased institutional positions, stale citations.
- **Ihtiyat alignment** — direction-correct? Dual-ihtiyat tension cited correctly? Path A escape clause justification valid?
- **Ikhtilaf preservation** — institutional disagreements surfaced via `notes[]` rather than picked silently? Active disagreements not collapsed?
- **Muwaqqit-tradition grounding** — calculations consistent with Battani / Biruni / Ibn al-Shatir / Khalili / Ibn Yunus consensus on prayer-time astronomy.
- **Institutional-position accuracy** — Diyanet / JAKIM / Habous / Umm al-Qura / Egyptian / KEMENAG positions described accurately.
- **Quranic / hadith grounding** — fiqh-boundary features grounded in scriptural sources (Al-Isra 17:78, Hud 11:114, Al-Baqarah 2:187, Hadith of Jibril, etc.).

Layer 3 does NOT cover code style, WMAE numbers, off-by-ones, Bismillah-presence — those are Layer 1 / Layer 2 / ratchet jobs. Layer 3 reads scholarly context where Layer 2 reads code.

Output: a structured PR comment with `🟥 Blockers / 🟨 Suggestions / 🟪 Flags for human judgment / 🟩 Looks good` sections plus three required paragraphs: classification accuracy, ihtiyat/ikhtilaf check, wiki/scholarly grounding. Comments are advisory; merge stays a Layer 4 human decision.

### Layer 4.5 — Auto-merger (RemoteTrigger cloud routine `trig_01VnAw1bT4JqVxhCyLHKEmRL`, Moderate scope)

Runs **daily at 20:30 UTC** (one hour after Layer 3 fires at 19:30 so both Layer 2 and Layer 3 advisory comments have landed by the time it runs). Sandboxed CCR session with read-only file tools + `gh` CLI (Bash). Reads each open PR's CI status + Layer 2 + Layer 3 advisory comments, then either merges or escalates.

A PR auto-merges only if **all six gates** pass:

1. **Gate 1 — CI green:** `statusCheckRollup` shows `SUCCESS` for every check (no FAILURE / CANCELLED / pending).
2. **Gate 2 — Layer 2 (engineering) reviewed, no 🟥 Blockers:** at least one `🔎 fajr-code-reviewer` comment exists; its 🟥 Blockers section is empty.
3. **Gate 3 — Layer 3 (fiqh) reviewed, no 🟥 Blockers:** at least one `📜 fajr-fiqh-reviewer` comment; same emptiness rule.
4. **Gate 4 — No 🟪 Flags for human judgment:** neither Layer 2 nor Layer 3 flagged anything that explicitly punted to the human.
5. **Gate 5 — No public-API surface change:** PR diff doesn't touch `src/index.js`, `src/index.d.ts`, or the `main`/`exports`/`types`/`type` fields in `package.json`. Version-only bumps are fine.
6. **Gate 6 — No new 🟡 or 🔴 classification:** the diff doesn't INTRODUCE a new 🟡 (limited precedent) or 🔴 (novel) classification tag in `src/engine.js`. Modifying existing 🟡/🔴 cases is fine.

Plus three meta-rules:

- **Branch allowlist:** only `calibration/*`, `fix/*`, `feat/*`, `docs/*`, `chore/*`, `corpus/*`, `progress/*` head branches are eligible. Anything else escalates.
- **Daily cap of 3 auto-merges per run** to prevent runaway batches.
- **Stacked PRs escalate** (`baseRefName !== master`) — dependency ordering is a Layer 4 decision.

When all gates pass: `gh pr merge --squash --auto`, then post a `✅ fajr-auto-merger` comment listing which gates passed and noting Layer 4.5 (Moderate scope) handled this PR.

When any gate fails or the PR is stacked / outside the allowlist: post a `⚠️ fajr-auto-merger` comment listing the failed gate(s) and explicitly escalating to the human, but do NOT merge.

What Layer 4.5 explicitly DOES NOT do:

- Make judgment calls. Layer 2 + Layer 3 do the judging; Layer 4.5 just executes their verdict.
- Decide whether a calibration is correct, whether a method choice is right, or whether a classification is appropriate.
- Touch the public API contract (`src/index.js`, `src/index.d.ts`, package exports). Always escalates.
- Approve novel scholarly classifications. New 🟡 / 🔴 always need human review.
- Override CI failures. If Layer 1 (lint) didn't pass, Layer 4.5 doesn't bypass — escalates.

If the human wants to disable Layer 4.5 (e.g., during a release week or major refactor sprint), call `RemoteTrigger.update(trigger_id='trig_01VnAw1bT4JqVxhCyLHKEmRL', body={enabled:false})`. Re-enable when ready.

The Moderate scope is documented in the routine prompt itself — the human can switch to Conservative (only docs/chore branches; nothing under `src/`) or Aggressive (any PR passing Layers 1-3 regardless of API surface) by editing the prompt via `RemoteTrigger.update`.

### Layer 4 — Human Review (intent, not implementation)

The human reads Layers 1, 2, 3 findings + the diff and makes yes/no calls on:

- Any correction flagged 🟡 (limited precedent) or 🔴 (novel) — approve or reject.
- Strategic direction changes — e.g., "start using official timetable data as the primary source rather than calculated values".
- Method additions or removals.
- Anything Layer 2 or Layer 3 flagged in their respective 🟪 "Flags for human judgment" sections.
- Disagreements between Layer 2 and Layer 3 (rare but possible — e.g. Layer 2 says correctness OK while Layer 3 says classification wrong).

The human does **not** need to review code style, mathematical correctness, test results, Bismillah-presence, classification-tag presence, or wiki-citation presence — those are covered by Layers 1, 2, 3. The human's job is judgment on Islamic principle and product direction.

### `/ultrareview` (heavy-weight, user-triggered)

Separate from the daily Layer 2 + Layer 3 routines: when the user invokes `/ultrareview` (or `/ultrareview <PR#>`), a multi-agent cloud review runs against the current branch or named PR. Heavier and billed; user-initiated only, not automated. Use it for marquee changes (major refactors, new method additions, releases preceding tag, anything where the daily Layer 2 + Layer 3 advisory feels insufficient).

---

## Documentation Regen Rule (self-enforced, v1.7.x → CI-gated v1.8.x)

**Rule:** if a PR modifies any of `src/hijri.js`, `src/hijri-umm-al-qura.js`, `src/hilal.js`, `src/lunar.js`, `src/engine.js`, or anything under `src/data/` — that PR MUST also commit the regenerated `docs/charts/*.svg` and any `docs/*.md` whose content is derived from those modules. The reverse is also enforced: if a release ships engine semantics, the docs must reflect that release's behaviour, not the previous release's.

**Why:** the v1.7.7-era docs/paper.md / docs/calibration-recipe.md / docs/dashboard.html accidentally cited pre-v1.7.6 numbers (auto-elevation Maghrib bug + Kuwaiti hijri 38% wrong) for ~2 days after the v1.7.6 fix shipped, which agot-agent's #57 audit caught. The risk is reputational: a paper reviewer or contributor pulling fajr today should NOT see pre-fix baselines and draw wrong conclusions about library accuracy.

**Sources of truth:**

| Module changed | Docs to regenerate |
|---|---|
| `src/lunar.js` | `npm run validate:lunar-jpl`, `npm run validate:solar-jpl` (regenerates `docs/lunar-jpl-validation.md` + `docs/solar-jpl-validation.md`) |
| `src/hijri-umm-al-qura.js`, `src/hijri.js` | `npm run build:hilal-map -- --year 1446 --month 9` and `--year 1447 --month 9`, `npm run build:hilal-year -- --year 1446` and `--year 1447`, `npm run analyze:hilal-historical` |
| `src/hilal.js`, criterion tunings | `npm run build:criterion-isolines`, `npm run analyze:hilal-historical` |
| `src/engine.js`, `src/data/cities.json`, `src/data/city-method-overrides.json` | `npm run build:charts` (refreshes `docs/charts/*.svg` + `docs/progress.md`); audit `docs/paper.md`, `docs/calibration-recipe.md`, `docs/DASHBOARD.md`, `docs/dashboard.html` for stale numeric claims |

**Convenience umbrella:** `npm run regenerate-docs` (added in v1.7.11) runs every script in dependency order. Use it after any engine change before opening the PR.

**Enforcement modes:**

- **v1.7.x (current — self-enforced):** every release agent and PR author manually runs `npm run regenerate-docs` after engine changes and commits the resulting diff alongside the source change. The Layer 1 lint job does NOT yet check this — agents are expected to honor it. If a release ships without the docs regen, file a `chore: docs regen sweep` PR within 1 working day of the release tag (this PR — v1.7.9 / v1.7.11 — is the canonical example, addressing #57).
- **v1.8.x (planned — CI-gated):** Layer 1 lint will fail any PR that touches the modules in the table above without also touching at least one downstream doc artifact. The check will allow-list pure refactor PRs that explicitly assert "no behavior change" via a `[skip-docs-regen]` PR title prefix.

**What is regenerated automatically vs hand-curated:**

- **Automatic:** `docs/charts/*.svg`, `docs/progress.md`, `docs/lunar-jpl-validation.md`, `docs/solar-jpl-validation.md`, `docs/hilal-historical-analysis.md`. These are deterministic outputs of scripts; never hand-edit them.
- **Hand-curated:** `docs/paper.md`, `docs/calibration-recipe.md`, `docs/DASHBOARD.md`, `docs/dashboard.html`. These contain prose that requires human/agent judgment to update — but their *numeric claims* must be reconciled against the latest `eval/results/runs.jsonl` after every release. Add a `Last refreshed: YYYY-MM-DD` line at the top of each.

---

## Continuous Research & Documentation Custodianship (RemoteTrigger `trig_01DbgkRPvVVMmo9FjDFJQ54C`)

Separate from the per-PR review pipeline above. Runs **weekly, Mondays 06:00 UTC**. Cares about the project as a whole rather than any single PR — the role explicitly cares that *every Muslim everywhere in the world is accurately served by fajr and not put at risk by wrong data we might have supplied*.

The agent runs six audits per week and reports findings as GitHub Issues:

1. **README coherence audit** — geographic miscategorisations (the South Africa example), stale numbers, architectural drift between diagram and code, section ordering, internal-link rot, cross-doc version inconsistencies, factual claims unsupported by data.
2. **Wiki completeness audit** — every method dispatched by `selectMethod()` should have a `wiki/methods/<method>.md`; every country in `detectCountry()` should have a `wiki/regions/<country>.md`; every 🟡→🟢/🟡/🔴 correction should have a `wiki/corrections/<topic>.md`; flag stale entries and dead citations.
3. **Coverage holes audit** — country bbox holes (every Muslim-majority country + every Muslim-minority country with > 1 M Muslims should have a bbox + method dispatch + ≥ 3 ground-truth fixtures); city-level coverage; elevation coverage above the 500 m threshold; per-method ground-truth asymmetry.
4. **Risk audit** — score each gap HIGH/MED/LOW/INFO based on Muslim-population magnitude × prayer-time-error magnitude. HIGH and MED gaps get separate `[custodian-risk]` issues for individual triage; LOW + INFO go in the consolidated weekly report.
5. **Source freshness audit** — verify ezanvakti.emushaf.net, waktusolat.app, bimasislam.kemenag.go.id, data.gov.sg MUIS dataset, mawaqit.net, aladhan.com still respond. Early warning for fixture-refresh routines that might start failing.
6. **Architectural-drift audit** — does the actual code structure match what `CLAUDE.md` describes? Bismillah convention sweep across all .js / .sh files. Code review pipeline (Layers 1–4) all wired up?

Output: one consolidated `[custodian] Weekly audit — YYYY-MM-DD` issue plus separate `[custodian-risk] <country> — <description>` issues for each HIGH/MED gap. Read-only — never modifies files, only opens issues.

This is the layer that catches **structural risk** (a Muslim-majority country fajr silently returns wrong times for) and **drift** (README claiming "20+ cities" when the registry now has 191). The user's framing: this agent's job is to find the holes BEFORE a user does.

---

## Cross-repo coordination

fajr is consumed downstream by other repos (notably [agiftoftime.app](https://agiftoftime.app), which integrates fajr's prayer-time and hilal output). The agents working in those repos will sometimes have fajr-side questions — API behaviour, edge cases, integration patterns, regression concerns. The convention for handling those:

**Open issues trigger immediate remediation. Always.**

Whenever you check the issue tracker — at session start, after a release, after any cross-repo announcement, at any natural pause point — and find any open issue, that issue takes priority over whatever other plan you had next. Treat open issues as interrupts, not as a backlog to clear "later". The user's explicit instruction:

> *"any open issues should immediately trigger remediation"*

Practical sequence on every check:

```bash
gh issue list --repo tawfeeqmartin/fajr --state open
gh issue list --repo tawfeeqmartin/agiftoftime --state open  # cross-repo
```

For each open issue:

1. **Read it in full** (`gh issue view N --comments`). Don't skim.
2. **If it's an inbound from `agiftoftime-agent`** (signed at the bottom) or any cross-repo agent: it's blocking real users — agiftoftime end-users. Resolve before resuming any other work.
3. **If it requires a code change**: open a PR with `Fixes #N` in the description. The merge auto-closes the issue.
4. **If it requires only an action (e.g. trigger a workflow, publish a tag, run a script)**: do it, then comment on the issue with the resolution details and close it.
5. **If it's a tracking issue with no immediate action** (like #15 — eval rounding-convention alignment, deferred): leave it open but **add a comment confirming you've seen it and what the deferred plan is**. Don't let it rot uncommented for days.

Triggers that should make you check the tracker immediately:

- Just shipped a release (tags + announcements may surface a downstream regression — like fajr#18 surfaced the publish-gap).
- Just received a cross-repo notification (agent on the other side filed an issue).
- About to start something new — clear the inbox first.
- User asks "where are we" or "status".

When the tracker is empty, say so explicitly in your status update. When it's not, the next thing you do is the issue, not the thing you had planned.

**When asked a question that affects another repo's integration**, prefer to answer in a GitHub issue comment rather than only in the local conversation — that creates durable cross-repo memory both agents and humans can reference.

**When proposing a change that downstream repos need to know about** (API additions, behaviour changes, version bumps), file an issue describing the change and what downstream needs to do. Cross-reference in the commit message.

**Proactively announce every release and significant wiki/doc change to agiftoftime-agent.** agiftoftime is fajr's first-class integration test bed; the user's explicit position is that *fajr's library practicality is verified there or it is unverified*. Every release (v1.x.y, v1.x.0, v2.x.0) and every meaningful wiki addition or `examples/agiftoftime/INTEGRATION.md` change must be announced via a GitHub issue on `tawfeeqmartin/agiftoftime`. The minimum shape:

- **Title:** `[fajr↔agiftoftime] vX.Y.Z released — <one-line summary>` (or `[fajr↔agiftoftime] wiki addition — <topic>` for wiki changes)
- **Body:** (a) what's new, (b) why it might matter to agiftoftime's UX or integration code, (c) **specific test/review asks framed as concrete actions** — e.g. "render `times.notes` in the long-press provenance sheet and report whether the high-lat advisory text reads usefully at Reykjavik test coords" — not vague "let me know if anything seems off".
- Sign as `— fajr-agent`.

Do NOT let agiftoftime-agent discover changes by reading commits, the README, or by accident. Proactive surfacing is the contract.

**Identify yourself as `fajr-agent` whenever the conversation crosses repo boundaries.** Specifically:

- In commit messages, use `Co-Authored-By: fajr-agent (Claude Opus 4.7) <noreply@anthropic.com>` instead of the generic Claude footer.
- At the end of any GitHub issue comment or PR description you write, sign with `— fajr-agent`.

This is purely for human/cross-agent legibility — Tawfeeq and the agiftoftime-agent should be able to read a thread and immediately know which agent said what. The other repo's agent uses `agiftoftime-agent` correspondingly.

This pattern lets each agent work asynchronously in its own repo without bottlenecking the human as a relay between sessions.

---

## Bismillah Convention

Every source code file in this repository must begin with:

```js
// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
```

This is the first line of every file, before any imports or code. Adapt comment syntax to the language (`//` for JS, `#` for Python/shell). For shell scripts with a shebang line, put Bismillah immediately after the shebang. This is a deeply held practice — beginning every piece of work in the name of Allah.

---

## Quick reference

```bash
# Typical autoresearch session
node eval/eval.js                # baseline — appends record to runs.jsonl
# ... make ONE change to src/engine.js ...
node eval/eval.js                # candidate — appends second record
node eval/compare.js             # ratchet decision (exit 0 = PASS, 1 = FAIL)

# If PASS:
git add src/engine.js
git commit -m "correction: [name] — train WMAE [before] → [after]"

# If FAIL:
git checkout src/engine.js       # revert
# Log the attempt anyway in autoresearch/logs/
```

Train WMAE drives the ratchet. Holdout WMAE (test set) is reported but never optimized against. Per-region and signed-bias checks are enforced by `compare.js`.

---

*"Whoever is able to know the time of prayer by the stars, the sun, or the shadow, then he must do so."* — Ibn Qudama, al-Mughni
