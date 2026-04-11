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

These rules are non-negotiable:

1. **Commit only if WMAE strictly decreases.** A wash (same WMAE) is not an improvement.

2. **Never sacrifice one prayer to improve another.** If your change reduces overall WMAE but makes Fajr worse by 3 minutes at any test location, reject it.

3. **Never modify eval/ to make the eval pass.** The eval is the ground truth.

4. **Always log your run** in `autoresearch/logs/YYYY-MM-DD-HH-MM.md` whether it succeeds or fails. Include: hypothesis, change made, before/after WMAE, verdict.

5. **Tag every correction** with its scholarly classification (see below).

6. **One concern at a time.** Do not combine multiple correction changes in one commit. Isolate variables.

---

## Islamic accuracy principles

### Ihtiyat (احتياط) — Precaution

When uncertain between two values, err toward the **more cautious time**:
- Fajr: if uncertain, use the **later** time (more time in the night)
- Maghrib: if uncertain, use the **later** time (more time for fasting in Ramadan)
- Isha: if uncertain, use the **later** time

Never implement a "bold" correction that risks cutting short a prayer's valid time. The error must be asymmetric toward caution.

### Ikhtilaf (اختلاف) — Legitimate disagreement

Multiple calculation methods (ISNA 15°, MWL 18°, Egyptian 19.5°, etc.) represent **legitimate scholarly disagreement**, not errors. Do not treat one method as "correct" and others as "wrong." The eval uses region-appropriate ground truth — what is accurate in Rabat may not be the right metric for Karachi.

### Scholarly oversight classification

Every correction in `src/engine.js` must carry a classification comment:

| Tag | Meaning | Action required |
|-----|---------|----------------|
| 🟢 Established | Consensus in Islamic astronomy, classical sources | Can deploy |
| 🟡 Limited precedent | Used in some regions/institutions, minority scholarly view | Note in docs, flag for review |
| 🔴 Novel | No clear precedent in Islamic scholarly tradition | **Do not deploy without scholarly review** |

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

Every change that passes the ratchet goes through three review layers. Layers 1 and 2 are automated; layer 3 is a lightweight human gate.

### Layer 1 — Automated Lint (every ratchet commit)

Run automatically after each successful autoresearch commit. A commit is rejected if any check fails.

| Check | Rule |
|-------|------|
| **Bismillah headers** | All `.js` and `.sh` files must start with the two Bismillah lines |
| **No hardcoded angles** | Twilight angles and method parameters must live in `src/methods.js`, not scattered in engine logic |
| **No per-prayer regression** | Redundant with the ratchet, but verified again — no individual prayer gets worse at any test location |
| **Scholarly classification present** | Every new correction block must carry a `// Classification: 🟢/🟡/🔴` comment |
| **Wiki citation present** | Every new correction block must cite the supporting wiki page: `// see knowledge/wiki/...` |
| **Public API contract** | All exports in `src/index.js` must still resolve — no silent breakage of the public interface |

### Layer 2 — AI Code Review (after each overnight batch)

After a full autoresearch run completes, a separate review agent reads the cumulative diff (all commits since the last human review) and produces a structured report covering:

- **Security** — no injection risks, no unsafe eval, no external network calls added
- **Correctness** — are the formulas mathematically sound? Do the units work out? Edge cases handled?
- **Maintainability** — is the code readable? Are variable names clear? Is complexity growing unnecessarily?
- **Islamic principle compliance** — is ihtiyat (precaution) respected? Are multiple valid methods preserved? Is ikhtilaf acknowledged rather than flattened?
- **Plain-English summary** — one paragraph a non-astronomer can read
- **Flags for human judgment** — anything the review agent cannot resolve with confidence

The review agent writes its report to `autoresearch/logs/review-YYYY-MM-DD.md`.

### Layer 3 — Human Review (intent, not implementation)

The human reads the Layer 2 plain-English summary and makes yes/no calls on:

- Any correction flagged 🟡 (limited precedent) or 🔴 (novel) — approve or reject
- Strategic direction changes — e.g., "start using official timetable data as the primary source rather than calculated values"
- Method additions or removals

The human does **not** need to review code quality, mathematical correctness, or test results — those are covered by layers 1 and 2. The human's job is judgment on Islamic principle and product direction, not implementation review.

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
# Run eval
node eval/eval.js

# Typical autoresearch session
git stash                    # save current state
# ... make change to src/engine.js ...
node eval/eval.js            # measure new WMAE
# if WMAE decreased:
git add src/engine.js
git commit -m "correction: [name] — WMAE [before] → [after]"
# if not:
git checkout src/engine.js   # revert
```

---

*"Whoever is able to know the time of prayer by the stars, the sun, or the shadow, then he must do so."* — Ibn Qudama, al-Mughni
