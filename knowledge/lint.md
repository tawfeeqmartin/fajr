# Wiki Lint Rules

Quality and consistency rules for wiki pages in `knowledge/wiki/`.

---

## Mandatory checks

1. **Every factual claim has a source citation** — `[Source: filename or author/year]`
2. **Every formula has units** — degrees, minutes, seconds, meters, etc.
3. **Every correction has a scholarly classification** — 🟢, 🟡, or 🔴
4. **Ikhtilaf is noted, not resolved** — where scholars disagree, record both positions
5. **No first-person language** — wiki pages are reference documents, not essays
6. **No normative language** — avoid "should", "must", "correct" except when quoting sources

## Format rules

- H1 = page title (one per page)
- H2 = major sections
- H3 = subsections
- Tables for comparative data (method angles, scholarly positions)
- Code blocks for formulas and algorithms

## Content rules

- Separate astronomical facts from fiqh rulings — these are different categories of knowledge
- When citing hadith or Quran: provide Arabic, transliteration, and translation
- When citing astronomical values: state precision (e.g., "0.833° ± 0.1°")
- When citing timetables: include date range and version/edition if known

## Red flags (edit required before merge)

- "The correct method is..." — delete, record all methods
- "Scholars agree that..." — almost always false; verify and cite specific scholars
- Formulas with no derivation or source
- Corrections classified 🟢 without two institutional sources
- Novel corrections classified less than 🔴
