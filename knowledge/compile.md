# Knowledge Wiki Compilation Instructions

This file tells an LLM how to compile raw sources into the structured wiki.
Run this process whenever new sources are added to `raw/`.

---

## What you are doing

You are acting as a research compiler. Your job is to:

1. Read raw sources in `raw/` (papers, fatwas, timetables, code, observations)
2. Extract factual claims relevant to Islamic prayer time calculation
3. Write or update structured wiki pages in `wiki/`

You are NOT:
- Making fiqh rulings
- Deciding which method is "correct"
- Inventing corrections without source support

---

## Source types and how to handle them

### `raw/papers/`
Academic papers on solar position algorithms, atmospheric optics, twilight measurement.
Extract: formulas, constants, accuracy claims, measurement data.
Tag extracted claims with the paper citation.

### `raw/fatwas/`
Islamic scholarly opinions on prayer time definitions and high-latitude rulings.
Extract: the scholarly position, the reasoning, the institution/scholar, the geographic scope.
Note disagreements between scholars — ikhtilaf is data, not noise.
**Do not adjudicate.** Record all positions.

### `raw/timetables/`
Official government or institutional prayer timetables.
Extract: the method name claimed, effective angles (if stated), dates and locations.
These are ground truth for the eval harness — preserve them exactly.

### `raw/code-references/`
Source code from other prayer time libraries (adhan.js, prayer-times.js, etc.).
Extract: formulas, constants, correction logic.
Note which formulas are from which library.

### `raw/observations/`
Field observations: measured dawn/dusk times at known GPS coordinates and elevations.
Extract: exact coordinates, elevation, observer notes, measurement method.
These feed directly into `eval/data/`.

---

## Wiki page format

Each wiki page should follow this structure:

```markdown
# [Topic]

## Summary
One paragraph: what this page covers and why it matters for prayer times.

## Key facts
- Bullet list of factual claims
- Each claim tagged with [Source: citation]
- Quantitative values clearly stated (units, precision)

## Scholarly positions (for fiqh pages)
| Scholar/Institution | Position | Reasoning | Geographic scope |
|---------------------|----------|-----------|------------------|

## Formulas (for astronomy/correction pages)
Present formulas clearly with variable definitions and units.
Tag with scholarly classification: 🟢 / 🟡 / 🔴

## Sources
Numbered reference list linking to raw/ files.
```

---

## Scholarly classification rules

When writing correction pages, classify each formula:

**🟢 Established** — meets ALL of:
- Documented in classical Islamic astronomy (*ilm al-miqat*)
- Used by at least two major Islamic institutions in their published timetables
- No significant scholarly objection

**🟡 Limited precedent** — meets ONE OR MORE of:
- Used in some regional practice but not universally
- Supported by minority scholarly position
- Standard in astronomy but applied to Islamic timekeeping without explicit scholarly sanction

**🔴 Novel** — meets ANY of:
- No clear Islamic scholarly precedent
- Derived purely from astronomical reasoning
- Not found in any published institutional timetable
- Corrections to phenomena (light pollution, terrain) not addressed in classical sources

When uncertain: classify more cautiously. 🟡 rather than 🟢, 🔴 rather than 🟡.

---

## Compile checklist

- [ ] New raw sources read and understood
- [ ] Relevant wiki pages identified (new pages or updates)
- [ ] Claims extracted and tagged with sources
- [ ] Ikhtilaf (scholarly disagreements) faithfully recorded
- [ ] Formulas classified (🟢/🟡/🔴)
- [ ] `wiki/index.md` updated if new pages added
- [ ] No factual claims without source citations
