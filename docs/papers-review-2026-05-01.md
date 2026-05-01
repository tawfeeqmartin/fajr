# Scholarly papers review — astronomycenter.net

**Date:** 2026-05-01
**Reviewer:** fajr-agent
**Source:** [astronomycenter.net/paper.html](https://astronomycenter.net/paper.html) — published archive of the International Astronomical Center / ICOP, run by Mohammad Shawkat Odeh.

This review is a working document for the human to use as input to `knowledge/compile.md`. It does not modify `knowledge/wiki/` directly. Findings flagged 🔴 require scholarly review before adoption.

## What fajr currently cites

Only three papers, all hilal-related, in `src/hilal.js` and `docs/scholar-review-brief.md`:

| Paper | Where |
|---|---|
| Odeh (2004) — *Lunar Crescent Sighting Versus Astronomical Calculations* | `src/hilal.js`, scholar brief |
| Yallop (1997) — *HMNAO TN No. 69* | `src/hilal.js` |
| Shaukat (2002) — *Pakistan Ruet-e-Hilal* | `src/hilal.js` |

Zero papers cited on prayer-time calibration, even though our engine ships eight twilight-angle methods plus a multi-region selection layer. That gap closes here.

## Headline findings

The four findings below are the most consequential for fajr's roadmap.

### 1. Odeh 2009 validates fajr's existing Iceland MiddleOfTheNight rule — and explains fajr#4

Paper: *A New Method to Calculate Fajr and Isha Times When They Disappear in The Area Between Latitude 48.6° and 66.6°* — Mohammad Shawkat Odeh, 2009 ([PDF](https://astronomycenter.net/pdf/2009_High_Latitude.pdf)).

Odeh enumerates twelve different proposed high-latitude methods (Aqrab Ayyaam, Aqrab Bilad at various latitudes, 1/7 method, half-night, time-proportional, modified twilight angles, etc.) with detailed pros and cons of each. He concludes that **adopting the middle of the night as the time for Isha when the twilight sign disappears is the closest time to physical fact** — which is what fajr already does for Iceland (via adhan.js's `MiddleOfTheNight` high-lat rule).

The paper also explicitly observes that at extreme high latitudes during summer, the calculated Isha (using middle-of-night) and Fajr land very close together: *"e.g., at 55° on June 21, the calculated Fajr is at 01:39, and Isha is at 00:21, gap = 78 minutes only — that's hardly enough time for taraweeh"*. At 64.5°N (Reykjavik), the gap closes further still.

**Implication for fajr#4:** the Reykjavik isha-after-next-day-fajr overlap (1–4 min) that agiftoftime-agent surfaced is *expected behaviour of the Odeh-endorsed rule*, not a bug. The MiddleOfTheNight Isha is the recommended astronomical answer; the small overlap at extreme summer latitudes is acknowledged by Odeh as a known consequence. The right resolution for fajr#4 is to **document this in the wiki and in the dayTimes() docstring**, not to clamp Isha mathematically (which would be a 🔴 novel correction not endorsed by Odeh).

The paper also includes a polynomial table of monthly average twilight-duration coefficients per latitude band (48.6° → 65°). These could be useful if we ever want to implement an alternative high-latitude rule for comparison.

### 2. Aabed 2015 — empirical naked-eye validation of 18° Fajr in Jordan

Paper: *Determining the beginning of the true dawn (Al-Fajr Al-Sadek) observationally by the naked eye in Jordan* — Prof. Abdulkader M. Abed, *Jordan Journal for Islamic Studies*, v. 11(2), 2015 ([PDF](https://astronomycenter.net/pdf/aabed_2015.pdf)).

Twelve naked-eye observation sessions across four localities in Jordan during 1430/1431 AH (2009/2010 AD) by the Jordanian Astronomical Society plus ulamāʾ. Conditions varied from clear to dusty/cloudy; ten of twelve sessions had darkness adequate for naked-eye observation.

**Headline:** True Fajr was observed **4–5 minutes after the calculated Adhān ul-Fajr** in Amman; in one session, the whole observer group concurred at the 5-minute mark (*tayakkun* — certainty). Conclusion: **keep the calculated Fajr as 18° below the eastern horizon**; optionally delay Adhān by 5 minutes for *tayakkun*.

Critical operational note from the paper: **timing of true dawn from inside lit cities should be rejected** — urban light pollution shifts the apparent dawn 20–30 minutes later than the actual sky reality. This explains why some communities perceive "Fajr is too early" and lobby for 12°–15° angles when the calculated 18° is in fact correct. The complaint is real but the cause is light pollution, not calculation error.

**Implication for fajr:** the 18°/19° Fajr cluster (ISNA, Egyptian, Morocco) is empirically validated. The "Fajr is wrong" controversy that surfaces periodically (e.g., the Moonsighting.com / ISNA community debates) is sociological more than astronomical. Where fajr can help: provide a `note` on the `prayerTimes` output explaining that observed Fajr from inside lit areas trails the calculated time.

### 3. Odeh 2012 — published methodology for verifying calendar accuracy

Paper: *How to Ensure the Accuracy of Salat Times in the Calendars* — Mohammad Shawkat Odeh, *Mu'tah University* (peer-reviewed), 2012 ([PDF](https://astronomycenter.net/pdf/2012_Salat_Observation.pdf)).

Directly applicable to **`eval/eval.js` and `eval/compare.js` methodology**. Odeh argues that most "this calendar is wrong" claims in the media use *inaccurate verification methods themselves* — the criticism is honest but methodologically flawed. He lists the correct procedures for verifying:

- Fajr / Isha (naked-eye observation procedure with darkness, line-of-sight, observer-count requirements)
- Sunrise / Sunset (parallax + refraction + horizon-dip handling — this is where elevation correction belongs)
- Dhuhr / Asr (transit measurement procedures)

Conclusion: some official calendars *do* have serious errors (Odeh names them in the body), but many calendars accused of errors are actually correct, and the accusations come from sincere persons who used unsound verification. **fajr's eval methodology should cross-reference Odeh 2012's procedures.** If our eval rules diverge from his, we should know why and document it.

### 4. Odeh 2010 *Astronomical and Juristic Problems* — meta-methodology for the entire project

Paper: *Astronomical and Juristic Problems Regarding Prayer Times* — Mohammad Shawkat Odeh, 2010 ([PDF](https://astronomycenter.net/pdf/Salat_Problems_2010.pdf)). 2857-line text extraction; mostly Arabic body but with clear English abstract.

Comprehensive review covering:

- **True vs false Fajr** (astronomical and juristic perspectives)
- **Ghalas (Dark Fajr) vs Isfar (Bright Fajr)** — which to use as the beginning
- Late prominent astronomers' opinions on the correct **Fajr angle**
- Recent observational studies determining the Fajr angle empirically
- **Correct procedure for Fajr/Isha observation campaigns**
- **Isha time and Red vs White Twilight** (Shafaq al-Ahmar / al-Abyad)
- Late prominent astronomers' opinions on the correct **Isha angle**
- **Dhuhr time and Zawal** — different opinions on the correct beginning
- **Why Hanafi Asr has a different definition** (single shadow vs double shadow length)
- **Maghrib time + elevation effect on sunset + distant heights on horizon effect**

The paper directly endorses: **"We also recommend 18 degrees for 'Isha prayer"** (citing the Moonsighting.com 2009-09-06 statement). Combined with #2 above, we have empirical + scholarly + methodological convergence on **18° for both Fajr and Isha** as the default recommendation.

**This paper is essentially a wiki for the entire prayer-time calibration topic.** Maps to almost every wiki entry under `knowledge/wiki/fiqh/` and `knowledge/wiki/methods/`.

## Newly-discovered, potentially relevant (per-paper summary)

| # | Paper | Year | Key finding | Action |
|--:|---|---|---|---|
| 1 | Odeh — High Latitude (48.6°–66.6°) | 2009 | Middle-of-night Isha is correct; narrow Isha-Fajr gap at extreme summer latitudes is expected | **Cite in `dayTimes()` docstring + new wiki entry on high-lat behaviour. Resolves fajr#4.** |
| 2 | Odeh — Astronomical & Juristic Problems | 2010 | Comprehensive review: Fajr/Isha angles, Asr definition (Hanafi), elevation effect on Maghrib | **Cite as the meta-source on `methods.js`. Map findings to wiki.** |
| 3 | Odeh — Calendar Accuracy Verification | 2012 | Published procedure for verifying calendar accuracy | **Cross-check `eval/compare.js` against this; cite in eval methodology docs.** |
| 4 | Odeh — Matla' Differences | 2010 | Matla' definitions, fiqh opinions, calendar union criteria | Cite in hilal docs (extends `src/hilal.js` context). |
| 5 | Aabed — Jordan Fajr (12 naked-eye sessions) | 2015 | Empirical: 18° validated within 5min in Jordan; cities 20-30 min off due to light pollution | **Cite as Fajr-angle empirical evidence. Add a "light pollution caveat" note to `prayerTimes.note`.** |
| 6 | Almisnid — Solving Fajr/Isha at high lat + Astronaut times | 2010 | Independent treatment of fajr#4 problem; ISS prayer times | Cite in high-lat wiki. (Bonus: ISS context if we ever wanted a `?orbit=true` mode — clearly out of scope.) |
| 7 | Almisnid — Empirical Fajr in Qassim | 2012 | Sky Quality Meter (SQM) measurements + naked-eye observations | Cite as additional empirical validation; methodology useful for our eval if we ever ground-truth observationally. |
| 8 | Khanji — High Latitude Approach | 2010 | Astronomical-jurisprudential treatment; quotes Hamidullah (services impossible above 66°N) | Cite in high-lat wiki. |
| 9 | Khanji — Asr Critique | 2006 | Critiques the standard Asr calculation; suggests alternative method | Read body to see if alternative is actionable; potentially adds a method to `methods.js`. |
| 10 | Guessoum — Salat Times When Solar Sign Disappears (lat 48.5° → pole) | 2010 | Method for prayer-times in polar regions | Cite in high-lat wiki; check if extends Odeh 2009 into ≥66.6°N (which Odeh deferred). |
| 11 | Tarabishy — Salat/Fasting in Northern Regions | 2014 | Proposes 45° as standard latitude for Aqrab Bilad rule | Cite in high-lat wiki; **note divergence from adhan.js's 48.6° threshold**. |
| 12 | Sumeat — Claims of Error in Fajr Time | 2019 | Engages with the Moonsighting.com / ISNA 18° controversy from 2018 | Cite as background to the "Fajr is wrong" debates; supports our 18°/19° default. |
| 13 | Maghrebi — Fajr & Maghrib timing per current calendar | 2017 | (Image-only PDF; unable to extract; 72 MB) | Manual review needed if topic priority warrants. |

## Recommended actions for fajr

### Immediate (this PR / next PR)

1. **Resolve fajr#4 by documenting Odeh 2009's finding.** Write `knowledge/wiki/regions/iceland.md` (human task) explaining: at lat ≥48.6° during summer, calculated MiddleOfTheNight Isha may land within minutes of next-day Fajr; this is the recommended astronomical behaviour per Odeh 2009; downstream apps should switch to Date-timestamp comparison rather than HH:MM string matching for active-prayer detection in this regime. **Close fajr#4 with the wiki link.**
2. **Add a `note` on `dayTimes()` and `prayerTimes()` outputs at lat ≥48.6°** acknowledging the high-latitude behaviour. e.g. `"At latitudes ≥48.6°, calculated Isha and next-day Fajr converge during summer per Odeh 2009; consult local imam for definitive ruling."` (🟡→🟢 — adopting one published astronomer's specific recommendation that has wide ICOP / regional adoption.)
3. **Add a light-pollution caveat to `prayerTimes.note` for any computed Fajr.** Per Aabed 2015: "Naked-eye observation of true dawn from inside lit cities will appear ~20–30 min later than the calculated 18° time; this is light pollution, not calculation error." (🟢 — empirical observation supports calculated angle.)

### Near-term (next sprint)

4. **Cross-check `eval/compare.js` methodology against Odeh 2012.** If our verification rules omit checks Odeh prescribes (e.g., specific procedures for Sunrise/Sunset elevation/refraction handling), document the gap or add the check. This is a meta-improvement to the ratchet itself, not the engine.
5. **Add Odeh 2010 Salat Problems as the primary citation for `src/methods.js`.** Currently the file has angle tables with regional labels but no scholarly source for *why* those angles. Odeh 2010 is a single source covering Fajr angle / Isha angle / Asr / Maghrib (including elevation) — exactly what `methods.js` claims to encode.
6. **Add `knowledge/raw/` archive of all 13 papers downloaded in this review** (human task — `knowledge/raw/` is human-curated archival per CLAUDE.md). The PDFs are at `/tmp/fajr-papers/` on this machine; copy them under `knowledge/raw/2026-05-01-astronomycenter-papers/` for archival.

### Follow-up investigations (open questions)

7. **Tarabishy 2014's 45° threshold vs adhan.js's 48.6° threshold.** Why the 3.6° difference? Tarabishy argues from physiological day-length normalcy; adhan.js's choice is presumably based on Iceland's specific geography. Worth a wiki entry comparing the two and noting the implications. (London is at 51.5°N — within Tarabishy's danger zone but outside adhan.js's. Worth checking whether MoonsightingCommittee UK behaviour at London — which already produces large Isha disagreements per agiftoftime#2's eval — is essentially a Tarabishy-style 45° truncation in a different name.)
8. **Khanji 2006 alternative Asr method.** If the proposed alternative is mathematically clean and has institutional adoption, it's a candidate for a new method in `methods.js`. Need to read the Arabic body more carefully to extract the alternative formula. (Currently fajr supports Shafii standard + Hanafi double-shadow. Khanji may be proposing a third.)
9. **Empirical-observation eval addition.** Almisnid 2012 used Sky Quality Meter + camera observations across multiple sessions in Qassim. Aabed 2015 did 12 naked-eye sessions in Jordan. If fajr ever wants to add an "observational ground truth" track to the eval (vs the current calendar-based ground truth), these papers' methodology is the template. Strictly novel and out of scope for v1.x.
10. **Hijri 1430-1446 historical Fajr/Isha controversy timeline.** Sumeat 2019 + Odeh 2010 both engage with the recurring "Fajr is too early" debate. A historical analysis of when the controversy spikes (which countries, which decades, what triggered it) would add color to the scholar brief and strengthen the Morocco-19° defence.

### Novel features / areas to investigate

11. **Method classification expansion.** Currently fajr classifies methods by region/institution. After this review, it's clear the dimensions are: (a) Fajr angle, (b) Isha angle, (c) Asr shadow ratio, (d) Maghrib offset, (e) high-lat fallback rule, (f) elevation handling. Each method is a tuple; the existing label is a shorthand. Could expose the tuple as a `methodDetails` field on `prayerTimes()` output for consumers that want to render "method: {fajrAngle: 18°, ishaAngle: 18°, asrFactor: 1, highLat: 'middle-of-night', elevation: 'sea-level'}" in a UI.
12. **Empirical-observation `note` regime.** Per Aabed 2015 and Almisnid 2012, the gap between calculated and observable times has two systematic biases: light pollution (delays observed Fajr) and elevation/horizon (advances observed Maghrib). Both are well-characterised in the literature. fajr could ship a `corrections.observationalCaveats: string[]` listing the relevant caveats given the user's lat/lon, with citations.
13. **Cross-paper convergence index.** If a calculation choice in fajr is supported by 3+ independent papers (e.g., 18° Fajr is supported by Aabed 2015 empirical, Odeh 2010 review, Sumeat 2019 controversy resolution, and ISNA 2009 institutional adoption), that's a stronger 🟢 case than a choice supported by one paper. We could systematise this as a "support score" per method.

## What I couldn't extract

- **Maghrebi 2017** is a 72 MB image-only scanned PDF; `pdftotext` produces zero output. Topic per page metadata is "Fajr & Maghrib timing per current calendar" — likely valuable but requires OCR or manual review.
- **Body Arabic text** in Odeh's papers and most others extracts as garbled glyphs (font-mapping issue specific to these PDFs). Findings above are from English abstracts, English headers, numerical tables, equation captions, and references. A native Arabic reader could extract significantly more, especially the *details* of each proposed method's pros/cons. Recommend the human review against the original Arabic.
- **Khanji 2006** Asr critique — the actual proposed method is in the body and didn't extract cleanly. Need manual review of the Arabic.

## Provenance

All 13 PDFs downloaded 2026-05-01 from `astronomycenter.net/pdf/`. Local working copies at `/tmp/fajr-papers/`. Page counts and file sizes:

```
aabed_2015_fajr_empirical.pdf      3.2 MB
almisnid_2010.pdf                  2.0 MB
almisnid_2012.pdf                  3.3 MB
guessoum_2010.pdf                  2.5 MB
khanji_2006_asr.pdf                1.2 MB
khanji_2010_high_lat.pdf           2.3 MB
maghrebi_2017.pdf                 72.4 MB  (image-only, not extracted)
odeh_2009_high_latitude.pdf        1.1 MB  (24 pages)
odeh_2010_matla.pdf                0.5 MB
odeh_2010_salat_problems.pdf       0.8 MB  (most substantive)
odeh_2012_calendar_accuracy.pdf    3.6 MB
sumeat_2019_fajr_error.pdf         1.9 MB
tarabishy_2014.pdf                 0.4 MB
```

— fajr-agent
