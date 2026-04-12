# Scholarly Oversight Classification System

The fajr library improves the astronomical *means* (*wasail*) of determining prayer times; the Islamic *definitions* of those times are fixed by the shar'i tradition and cannot be revised by astronomical reasoning alone.

---

## The Foundational Principle: Wasail vs. Ibadat

Islamic jurisprudence distinguishes between:

- **Ibadat (العبادات):** Acts of worship — their definitions, conditions, and rulings are fixed by Quran and Sunnah. They cannot be changed by human reasoning, scientific discovery, or administrative convenience.

- **Wasail (الوسائل):** Means — the practical tools and methods used to fulfill the ibadat. These may be refined, improved, and updated as knowledge advances.

The *shar'i* definition of Fajr — "when white light spreads horizontally across the eastern horizon" (*al-fajr al-sadiq*) — is **ibadat**: fixed, not subject to revision. What the fajr library improves is the *translation* of that definition into a clock time at a given GPS coordinate, elevation, and atmospheric condition. That translation process is **wasail**: it may legitimately be refined with better astronomy, better ephemerides, and better correction formulas.

This distinction is not merely philosophical — it determines the appropriate scope of the library's authority. The library can correctly say: "given the Islamic definition of Fajr, and given your location and elevation, the most astronomically precise clock time for Fajr is X." It cannot say: "the Islamic definition of Fajr should be revised based on spectroscopic measurements of twilight light levels."

---

## The Three-Tier Classification System

Every astronomical correction or calculation method in this library must carry one of three classifications:

---

### 🟢 Established (Consensus)

**Definition:** Documented in classical Islamic astronomy (*'ilm al-miqat*) **AND** used by two or more major Islamic institutions in published timetables **AND** no significant scholarly objection exists.

**Criteria:**
1. Precedent in pre-modern Islamic astronomical tradition (the *muwaqqitun* — timekeepers attached to major mosques)
2. Adoption in at least two major published timetable systems
3. Absence of notable scholarly critique

**Permitted action:** Can be implemented and deployed without further review. Should still be documented.

**Examples:**

| Item | Basis |
|------|-------|
| Standard 0.833° horizon correction for sunrise/sunset | Universal in all institutional timetables; consistent with classical observation practice |
| Great-circle Qibla calculation | Used by all major institutions; classical spherical trigonometry |
| Twilight angle selection per regional institution (e.g., 18° MWL, 15° ISNA) | Each is the published, authoritative position of the relevant institution |
| Tabular Hijri calendar (Umm al-Qura) | Official Saudi calendar, widely used |
| Meeus/VSOP87 solar position algorithm | Standard in all modern Islamic prayer time software |

---

### 🟡 Limited Precedent

**Definition:** Used in some regional practice **OR** supported by a minority scholarly view **OR** standard in astronomy but applied to Islamic timekeeping without explicit broader institutional sanction.

**Criteria:** At least one of the following:
1. Found in a regional institutional timetable but not universally adopted
2. Mentioned in classical *muwaqqit* texts as a local practice
3. Consistent with shar'i intent but not formally documented in any institutional timetable
4. Applied by some scholars but debated by others

**Permitted action:** May be implemented. Must be:
- Clearly documented with its classification
- Flagged in any user-facing output (e.g., "this calculation includes elevation correction — 🟡 Limited precedent")
- Logged in research runs
- Not deployed silently without disclosure

**Examples:**

| Item | Basis |
|------|-------|
| Elevation-based horizon dip correction for Shuruq/Maghrib | **🟡→🟢** Originally: classical muwaqqit texts note elevated mosques observe sunrise/sunset differently. *Updated 2026-04-12:* UAE Grand Mufti issued floor-stratified Burj Khalifa fatwa (IACAD/Dulook DXB); Malaysia JAKIM systematically applies topographic elevation. Approaching established. See [[wiki/corrections/elevation#international-precedent]]. |
| Temperature/pressure refraction correction | Physically correct; not formally adopted by any institution; consistent with shar'i intent of precision |
| ECFR 12° angle for high-latitude accommodation | Endorsed by a major European scholarly body but not universally accepted |
| One-seventh-of-night Fajr calculation at high latitudes | Endorsed by some scholars; not universal |

---

### 🔴 Novel (Scholarly Review Required)

**Definition:** No clear precedent in Islamic scholarly tradition; derived from pure astronomical or computational reasoning; not found in any published institutional timetable or classical text.

**Criteria:** All of the following:
1. No precedent in classical *'ilm al-miqat* literature
2. Not adopted by any published institutional timetable
3. Represents a new type of correction not previously considered in Islamic timekeeping

**Permitted action:**
- **Must NOT be deployed for prayer use without qualified scholarly review** by a recognized institution or competent *faqih*.
- May be implemented as an **experimental** feature, clearly labeled as such.
- Must be separately toggleable from the standard calculation — never on by default.
- Research value is legitimate; shar'i deployment is not authorized.

**Examples:**

| Item | Basis |
|------|-------|
| Terrain-based horizon obstruction (DEM horizon profiles) | No classical or modern scholarly precedent; entirely computational |
| Light pollution adjustment to Fajr threshold | Represents a redefinition of what constitutes al-fajr al-sadiq — touches ibadat, not just wasail |
| Seasonal atmospheric refraction variation by month | No institutional precedent; pure astronomical reasoning applied to Islamic calculation |
| Elevation-adjusted Fajr/Isha twilight angles | Touches the shar'i definition of twilight; requires scholarly determination of whether elevated observers see different twilight |

---

## Ihtiyat (احتياط) — The Precautionary Principle

When there is genuine uncertainty between two calculated times — whether from atmospheric variability, elevation ambiguity, algorithm precision, or scholarly disagreement — Islamic jurisprudence mandates erring toward the **more cautious** time. This principle derives from the general maxim: *"when in doubt in worship, take the position of greater caution."*

**Application by prayer:**

| Prayer | Precautionary Direction | Rationale |
|--------|------------------------|-----------|
| Fajr | Later time | Ensures one is not counting time before true dawn as part of the Fajr window; protects the fast in Ramadan |
| Shuruq | Earlier (end Fajr sooner) | Ensures Fajr is not prayed after sunrise |
| Dhuhr | Later start | Ensures zawaal has definitively occurred |
| Asr | Standard start | (Less ambiguous) |
| Maghrib | Later time | Ensures the sun has fully set; critical for iftar validity in Ramadan |
| Isha | Later start | Ensures shafaq has fully disappeared |

In practice, most institutional timetables already incorporate a precautionary rounding (e.g., rounding Fajr to the next full minute, or adding a 1–2 minute safety margin). The fajr library should preserve these margins and not remove them in the name of precision.

---

## Ikhtilaf (اختلاف) — Legitimate Scholarly Disagreement

The existence of multiple valid calculation methods — ISNA (15°), MWL (18°), Egyptian (19.5°) — represents legitimate scholarly disagreement (*ikhtilaf*), not computational error. These are not approximations converging on a single "correct" angle; they reflect genuine differences in:

1. **Interpretation of al-fajr al-sadiq:** What minimum light level constitutes the "spreading of white light across the horizon"? This is inherently observational and context-dependent.
2. **Regional atmospheric conditions:** The angle at which twilight becomes visible varies with atmospheric clarity, humidity, and latitude. Scholars familiar with their region may have calibrated the angle to local conditions.
3. **Community practice and consensus:** An angle adopted by a major institution reflects the consensus of that community's scholars and carries jurisprudential authority within that community.

**The library must:**
- Never flatten these disagreements by picking a single "correct" angle.
- Preserve each method's full parameter set without modification.
- Present method-specific results as exactly that: results *under that method*, not universal truth.
- In the eval harness, evaluate accuracy against region-appropriate ground truth (Moroccan accuracy measured against MWL 18°/17° output, not Egyptian 19.5°/17.5°).

---

## Classification Summary Table

| Classification | Deployment | Documentation | User Disclosure |
|---------------|-----------|---------------|----------------|
| 🟢 Established | Deploy freely | Required | Optional |
| 🟡 Limited precedent | Deploy with disclosure | Required | Required |
| 🔴 Novel | Experimental only; no production prayer use | Required | Mandatory, prominent |

---

## Related Pages

- [[wiki/fiqh/prayer-definitions]] — The shar'i definitions that this classification system protects
- [[wiki/corrections/elevation]] — Example of a 🟡 Limited precedent correction
- [[wiki/corrections/terrain]] — Example of a 🔴 Novel correction
- [[wiki/corrections/atmosphere]] — Example of 🟡 Limited precedent atmospheric correction
