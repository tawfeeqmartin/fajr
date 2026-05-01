# Scholar review brief — fajr

> _Adapt this document for a specific scholar before sending. The version below is a generic starting point; substitute names, salutations, and references appropriate to the scholar's tradition and madhab._

---

**As-salāmu ʿalaykum wa raḥmatu Llāhi wa barakātuh,**

My name is Tawfeeq Martin. I am the maintainer of [**fajr**](https://github.com/tawfeeqmartin/fajr) (Arabic: فجر), a free open-source software library for calculating Islamic prayer times, qibla direction, Hijri dates, and lunar crescent visibility. fajr is dedicated as a sadaqah jariyah for my daughters Nurjaan and Kauthar. The project is MIT-licensed, has no commercial backing, and is intended to remain freely available.

The library has reached an engineering milestone (v1.0: stable API, validated astronomical primitives, public test suite) where I believe it is ready for **scholarly review of its methodology**. I am writing to ask whether you would be willing to read the brief below and offer your assessment of four specific decisions that involve *fiqh*-relevant judgments. I am not seeking approval as such — I am seeking the identification of any problems. If after review you believe the methodology is sound, I would like to attribute that attestation publicly; if you would prefer not to be named, I will respect that. If you decline to review, no obligation — I would still be grateful if you could direct me to a scholar better suited to the questions.

I have tried to make fajr respect the *wasāʾil*/*ʿibādāt* distinction throughout: software computes the *means* of determining prayer times; the *acts of worship* themselves are governed by *sharʿ* and ultimately by the user's local Islamic authority. fajr does not issue rulings; it provides astronomical estimates and surfaces *ikhtilāf* (legitimate disagreement) where it exists rather than flattening it.

---

## What fajr is

- A region-aware auto-configuration layer over `adhan.js` (a widely-used Islamic prayer time calculation library): given coordinates, fajr selects the regionally appropriate calculation method (Habous for Morocco, Diyanet for Türkiye, JAKIM for Malaysia, Umm al-Qurā for Saudi Arabia, etc.) so users do not have to configure it themselves.
- An evolving accuracy-research framework that validates the engine against multiple independent reference layers (mosque-published times via Mawaqit, official institutional tables from Diyanet and JAKIM, Aladhan API output, the praytimes.org reference library) — surfacing per-source agreement rather than blending sources into a single "ground truth."
- An implementation of three-criterion hilal visibility prediction (Odeh 2004, Yallop 1997, Shaukat 2002) computed in parallel, with a `criteriaAgree` flag highlighting borderline ikhtilaf cases.

A complete description is at <https://github.com/tawfeeqmartin/fajr/blob/master/README.md>. The full architecture is documented in [`CLAUDE.md`](https://github.com/tawfeeqmartin/fajr/blob/master/CLAUDE.md) and the wiki at [`knowledge/wiki/`](https://github.com/tawfeeqmartin/fajr/tree/master/knowledge/wiki).

---

## The four decisions I would like your view on

### 1. Morocco's Fajr angle: 18° (formal Ministry) vs. 19° (community calibration)

**What fajr does.** For Moroccan locations fajr applies a Fajr depression angle of **19°**, not the Ministry of Habous's formally stated 18°. This was empirically determined: the 19° angle reproduces the Ministry's own published *Imsakiyya* and matches mosque-published times via Mawaqit at five Moroccan mosques (Casablanca, Rabat, Marrakech) within ~1 minute. The 18° formula diverges from Ministry timetables by ~5 minutes in the prayer-late, fasting-unsafe direction.

**Question.** Is it sound for software to use a community-calibrated angle that differs from the Ministry's stated method when that empirically reproduces the Ministry's *published timetable* more accurately? Or should the formal stated angle take precedence even at the cost of accuracy against the Ministry's own published times? See [`knowledge/wiki/methods/morocco.md`](https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/methods/morocco.md) and `autoresearch/logs/2026-04-30-21-27.md` for the full reasoning trail.

### 2. The dual-ihtiyat (precaution) polarity for Fajr — prayer vs. Ramadan fasting

**What fajr does.** *Ihtiyāṭ* for Fajr depends on the obligation: prayer-validity argues for the **later** time (don't pray before dawn); Ramadan fasting argues for the **earlier** time (don't eat past dawn). The traditional resolution is *imsāk* — a buffer (~10 min) before Fajr at which fasters stop eating, while prayer begins at the calculated Fajr.

fajr's automated quality ratchet (`eval/compare.js`) by default treats Fajr drifting *earlier* as "ihtiyāṭ-unsafe" (the prayer-only frame). It has an escape clause ("Path A") that overrides this default *only* when the drift is independently corroborated by mosque-published times (Mawaqit) and other institutional sources moving toward zero-bias by the same margin. The reasoning: when the engine moves toward what real mosques actually print, it is moving toward fasting-safety while preserving the imsāk buffer.

**Question.** Is the dual-ihtiyāṭ polarity correctly handled? Is "prayer-validity ihtiyāṭ as default, fasting-ihtiyāṭ as exception when independently corroborated" the right asymmetry? Or should the fasting-frame be primary in practice, since most Muslims encounter Fajr times during Ramadan suhoor more vividly than for non-Ramadan prayer? See [`CLAUDE.md`](https://github.com/tawfeeqmartin/fajr/blob/master/CLAUDE.md) "Ihtiyat (احتياط)" section and `autoresearch/logs/2026-04-30-21-27.md`.

### 3. Three-criterion hilal output — Odeh + Yallop + Shaukat side-by-side

**What fajr does.** For lunar crescent visibility, fajr returns the verdicts of all three criteria simultaneously, with a `criteriaAgree` flag identifying borderline cases. It does not pick one criterion as canonical. Each criterion was empirically fit to a different observation dataset and is referenced by different national authorities (Odeh: Egypt Dar al-Iftaā, ICOP; Yallop: UK NAO; Shaukat: Pakistan Ruet-e-Hilāl Committee). Rationale: surfacing the disagreement is more honest than choosing one as authoritative; downstream applications (and users) can defer to their local authority.

**Question.** Is multi-criterion output an appropriate way for software to handle this *ikhtilāf*? Or does presenting users with three classifications create confusion that should be resolved by software itself (perhaps by preferring the criterion of the user's regional authority)? Are Odeh, Yallop, and Shaukat the right three to include — should others (Bruin 1977, Maunder 1911, naked-eye-only / *al-ruʾyā al-shaykhiyya*) be added, or any of these dropped? See [`knowledge/wiki/astronomy/hilal.md`](https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/astronomy/hilal.md).

### 4. The 🟢 / 🟡 / 🔴 scholarly-classification typology

**What fajr does.** Every correction in the engine is tagged with a scholarly-classification marker:

- 🟢 **Established** — consensus in Islamic astronomy / classical sources / institutional practice
- 🟡 **Limited precedent** — supported by some scholars or institutions, minority view
- 🟡→🟢 **Approaching established** — recently documented by one or more institutions; trajectory toward consensus
- 🔴 **Novel** — no clear Islamic scholarly precedent; *not deployed* without scholar review

The autoresearch loop will not deploy a 🔴 correction. 🟡 corrections are deployed only when corroborated by scholarly precedent (e.g. UAE Burj Khalifa elevation fatwa for the elevation utility, classified 🟡→🟢). 🟢 corrections are deployed by the ratchet automatically.

**Question.** Is this typology a meaningful representation of how scholars actually conceptualize the certainty of *masāʾil* in *ʿilm al-mīqāt*? Are particular corrections currently classified correctly? In particular: is the Morocco 19° angle correctly classified as 🟡→🟢 (community calibration with multi-source corroboration)? Is the elevation utility correctly classified as 🟡 (UAE / JAKIM precedent for application; Saudi Arabia explicitly does not apply)? See [`knowledge/wiki/fiqh/scholarly-oversight.md`](https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/fiqh/scholarly-oversight.md).

---

## Optional bonus question — methodology level

If the four above feel resolved or out of scope, one broader methodological question: **is it appropriate for software to encode an automated "ratchet" that decides which corrections to commit based on weighted error against multiple reference sources?** The intent is to keep accuracy-improvement work disciplined and reproducible. The risk is that "minimum error against sources" becomes a proxy for "what's correct," when scholars and ground truth (mosque-published times) might disagree on what counts as correct in the first place.

The full ratchet rules are in [`CLAUDE.md`](https://github.com/tawfeeqmartin/fajr/blob/master/CLAUDE.md) "Ratchet rules" and the implementation is `eval/compare.js`. fajr's strongest non-mathematical guardrail is the *wasāʾil*/*ʿibādāt* principle and the 🟢/🟡/🔴 classifications, which the ratchet respects (it cannot deploy 🔴 corrections at all, and 🟡 only when explicitly authorized).

---

## What I am asking for, concretely

A response in any form you find appropriate. Possible shapes:

1. **A short written assessment** (a paragraph per question, in plain language) — what is sound, what is questionable, what needs work.
2. **A conversation** (in person or via video, recorded if you permit) where I take notes and follow up in writing.
3. **Pointed corrections** — even just "decision 1 is unsound, see Reference X" is enormously valuable.
4. **A graceful no** — if the questions are out of scope or if you would prefer a different scholar lead the review, I would welcome a referral.

If you find the methodology sound and would permit me to attribute that:

- I would add a section to the README (or to [`docs/scholar-review.md`](https://github.com/tawfeeqmartin/fajr/blob/master/docs/scholar-review.md), to be created upon receiving any review) naming you, the date of review, the scope of what you reviewed, and any caveats you wish to attach.
- I would not claim that fajr is *certified* or *endorsed* by you in any institutional sense; only that you reviewed the listed methodology decisions and found them defensible.
- If you prefer not to be named while still offering a review, I will record the review privately and cite it as "anonymous scholarly review" in commit and PR contexts only.

---

## Materials, in order of priority

If you can read only one thing, the README: <https://github.com/tawfeeqmartin/fajr/blob/master/README.md>

If you can read three:

1. README (project context)
2. [`CLAUDE.md`](https://github.com/tawfeeqmartin/fajr/blob/master/CLAUDE.md) (Islamic-accuracy principles, *wasāʾil*/*ʿibādāt*, ratchet rules, scholarly classification)
3. [`knowledge/wiki/astronomy/hilal.md`](https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/astronomy/hilal.md) (the three-criterion hilal methodology and validation status)

For the Morocco-specific question: [`knowledge/wiki/methods/morocco.md`](https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/methods/morocco.md) and [`autoresearch/logs/2026-04-30-21-27.md`](https://github.com/tawfeeqmartin/fajr/blob/master/autoresearch/logs/2026-04-30-21-27.md).

For the dual-ihtiyāṭ-handling question: [`CLAUDE.md`](https://github.com/tawfeeqmartin/fajr/blob/master/CLAUDE.md) (search "Ihtiyat") and `autoresearch/logs/2026-04-30-21-27.md` (the case study where the ratchet had to be amended).

---

## Closing

I recognize that the questions above are not small. Each touches on real *ikhtilāf* in the *ʿulamāʾ*'s tradition, and a thorough answer would take time. I have built fajr to be patient: it can wait for a careful reading, and any scholarly input will materially improve the project regardless of when it arrives.

If you find this brief presumptuous in any aspect — please tell me directly. The intent is to defer to scholarly authority on the *fiqh* questions while taking responsibility for the engineering. If I have not drawn that line correctly anywhere above, I would rather know and correct it than persist in error.

*Jazākum Allāhu khayran* for any time you can give to this. I remain grateful for your work and the broader tradition of *ʿilm al-mīqāt* on which all of this rests.

— Tawfeeq Martin
   tawfeeqmartin@gmail.com
   <https://github.com/tawfeeqmartin/fajr>
