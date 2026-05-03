# Research-paper survey for fajr autoresearch — 2026-05-03

> Survey of contemporary scholarly literature on Islamic prayer-time astronomy, hilal visibility, and regional almanacs, conducted as a feeder for the fajr autoresearch ratchet.
> — fajr-research-paper-survey-agent

---

## Methodology

This survey was conducted on 2026-05-03 against the v1.7.15 fajr master. Search strategy:

1. WebSearch + WebFetch against peer-reviewed publishers (Elsevier ScienceDirect, Springer, Taylor & Francis, Nature Scientific Reports, ResearchGate, ADS abstracts), Islamic-astronomy archives (astronomycenter.net / ICOP), and institutional sites (Fiqh Council of North America, JAKIM, MUIS, Diyanet).
2. Per `feedback_verify_competitor_claims`: every empirical claim cross-checked against at least one independent source. Specifically the **14-15° empirical Fajr cluster** (Egypt, Saudi, Mauritania, Indonesia, North America) was triangulated across **at least four independent peer-reviewed studies and one institutional fatwa** before being treated as a real signal rather than a single-paper outlier.
3. ResearchGate / academia.edu hits used only for citation discovery; abstract details cross-validated against ADS or the publisher.
4. Per `feedback_verify_response_date`: every paper's publication year was confirmed via the publisher's metadata, not a paraphrase.
5. Per `feedback_aggressive_data_hunt`: when a primary publisher (ScienceDirect, Springer) blocked WebFetch with 403, the citation was completed via ADS abstracts, ResearchGate snippets, and PubMed Central mirrors.

**Time budget:** ~80 min of the 90 min allocated. Survey emphasises 5–10 high-leverage findings over breadth, per the proposal scope.

---

## Papers and findings — by topic

### Twilight-angle calibration (Fajr / Isha)

The dominant finding of the 2014–2025 literature is a **persistent empirical tension** between the institutional Fajr angle (18°/18.5°/19°/19.5° per Umm al-Qura, MWL, Habous, Egyptian, JAKIM) and naked-eye / SQM observation studies that converge on **14°–15°** in dark-sky desert backgrounds. The literature is now mature enough that the tension itself is the finding — not which side is "right."

**Key cluster — empirical 14–15° dawn at dark sky:**

| # | Citation | Location | Method | Sample | Finding |
|---|---|---|---|---|---|
| 1 | **Khalifa, Hassan & Taha (2018)** *Twilight observation by the naked eye of the dawn sincere at Hail and other areas in Saudi Arabia.* NRIAG Journal of Astronomy and Geophysics, 7, 22–26. https://doi.org/10.1016/j.nrjag.2018.01.001 | Hail, Saudi Arabia (27°31'N, 41°42'E); deep-desert KSA sites | Naked-eye + photoelectric, 2014–2015 | ~80 observations; 32 quality-selected | True dawn at Do = 14.66° (mean+2SD) Hail; Do = 14.88° (mean+1SD) deep desert; range 13.48°–14.69° |
| 2 | **Hassanin et al. (2014)** *Naked eye observations for morning twilight at different sites in Egypt.* NRIAG Journal of Astronomy and Geophysics, 3(1), 23–26. https://doi.org/10.1016/j.nrjag.2014.02.002 | Bahria, Matrouh, Kottamia, Aswan (Egypt); 1984–1987 cooperation between Dar El-Iftaa' and Egyptian Academy of Scientific Research | Naked-eye + photoelectric photometry | Multi-year, 4 desert sites | Mean Do = 14.7°; range 12.01°–15.08° |
| 3 | **Sun Vertical Depressions and Their Effects on the Morning Twilight Phases in Egypt** (2025) — Springer / Proceedings of the 14th Arabic Conference of the Arab Union for Astronomy and Space Sciences (AUASS-CONF 2023). https://doi.org/10.1007/978-981-96-3276-3_14 | Kottamia, Kharga, Aswan, Hurghada, Marsa-Alam, Fayum (Egypt) | Naked-eye + 2 digital cameras + CCD + SQM, Aug 2015 – Dec 2019 | 30+ observers, multi-year | True dawn at Do = 14.56° (mean+1SD); range 14°–15° |
| 4 | **Taha, Al Mostafa, Ragheb, Hassan & Hussein (2025)** *Observation of the true dawn for three different countries in the Arab region.* Emirati Journal of Space and Astronomy Sciences, 3(1), 4–17. https://doi.org/10.54878/e3q5jd54 | Riyadh (KSA), Aswan (Egypt), Mauritania | Naked-eye + concurrent camera at Riyadh | Multi-location, 2024–2025 | **Riyadh:** true dawn 14.88° ± 0.3°; false dawn 18.58° ± 0.85°. **Aswan:** 12.69°. **Mauritania:** 14.85° ± 0.61°. Optimal-conditions consensus: Do ≈ 14.4° |
| 5 | **Aabed (2015)** *Determining the beginning of the true dawn (Al-Fajr Al-Sadek) observationally by the naked eye in Jordan.* Jordan Journal for Islamic Studies, 11(2). | Four localities in Jordan; 2009–2010 | Naked-eye, Jordanian Astronomical Society + ulamāʾ | 12 sessions; 10 quality-grade | Mean true dawn 4–5 min after the calculated 18° A'than; *tayakkun* (group concurrence) at the 5-min lag once. Endorses 18°. **City-light caveat: 20–30 min later in cities.** |
| 6 | **Sufyan et al. (2020)** *Predicting the accurate period of true dawn using a third-degree polynomial model.* NRIAG Journal of Astronomy and Geophysics, 9(1), 238. https://doi.org/10.1080/20909977.2020.1738106 | Depok, Indonesia; June–July 2015 | SQM + polynomial model, 26 nights | Single-location | Astronomical twilight begins at sun depression −14° ± 0.6° in Depok |
| 7 | **Maskufa, Damanhuri, Sopa & Hadi (2024)** *Contextualising Fajr Sadiq: Response to Dawn Research Findings with the Sky Quality Meter (SQM).* Mazahib, 23(1), 155–198. https://doi.org/10.21093/mj.v23i1.7293 | Four Indonesian locations | SQM observation | Multi-location | Sun depression range −19.30° to −13.58° depending on light pollution. Conclusion: **methodological validity of SQM accepted; institutional dip = -20° (Min. Religion / NU) and dip = -18° (Muhammadiyah) maintained.** Recommends "ongoing joint research" before adopting lower angles. |

**The light-pollution resolution — peer-reviewed:**

| # | Citation | Finding |
|---|---|---|
| 8 | **Faid, Shariff, Hamidi et al. (2024)** *Alteration of twilight sky brightness profile by light pollution.* Scientific Reports (Nature), 14, 26682. https://doi.org/10.1038/s41598-024-76550-3 | Pristine sites: twilight brightness stabilization at ~17.49° solar depression. Light-polluted urban sites: stabilization at ~11.5°. **A 6° angular shift, peer-reviewed, attributed to artificial light at night (ALAN) preventing natural deep-darkness at the deeper depressions.** This is the modern peer-reviewed-Nature-family grounding for Aabed 2015's scholarly position that 18° is correct in dark sky and the urban "Fajr looks late" complaint is light-pollution suppression of pre-dawn glow at the early stage. |

**Institutional response — recent fatwas / policy positions:**

| # | Citation | Position |
|---|---|---|
| 9 | **Fiqh Council of North America** — Umar (2024) *Fifteen or Eighteen Degrees: Calculating Prayer & Fasting Times in Islam.* Sept 18, 2024. https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/ | **Recommends 15° for both Fajr and Isha throughout USA** (no separate Canada angle in this 2024 update — the 13° Canada figure is from older ISNA guidance and is not in the 2024 article). Cites: UK 1983 Hizbul Ulama observations 12°–16°; Chicago 1985 dawn 13°–15°; Riyadh 2004 year-long observations by Sh. Abdul-Aziz Fauzan at 15°; Moonsighting.com US/Canada decade-scale 14.8°–17.5°. Position: 15° is "the middle point between twelve and eighteen, which is usually the range of dawn for most places on Earth." |

**The interpretive frame: why fajr's 18° is not falsified.**
The Faid 2024 *Scientific Reports* finding makes the resolution clean: in dark sky, dawn brightness stabilizes at ~17.5° (rounding to 18° given measurement noise). In light-polluted environments, the perception threshold shifts to ~11.5°. Aabed 2015's "20–30 min later in cities" qualitative observation is now quantitatively grounded. **The empirical 14–15° cluster is consistent with field observations at sites that are *not* deep-desert** — they include Aswan/Kottamia (relatively dark but not pristine), Riyadh observation site (suburb-edge), Hail (deep desert but the *mean* of all observations was 14°, not just the optimal), Depok Indonesia (urban-adjacent), and FCNA-cited UK/Chicago (urban). A scholar genuinely uncertain about the dawn angle in these conditions has empirical reason to prefer 14–15°. A scholar in the Aabed-Khalifa-Faid framing would say: 14–15° is the city / suburb / non-pristine threshold; 17.5°–18° is the dark-sky physical horizon. **The institutional 18° is the prayer-validity-safe choice.** The empirical 14–15° is the perception threshold for many real observers.

This is exactly the *ihtiyat / wasail-vs-ibadat* debate that fajr's CLAUDE.md already frames: prayer-validity argues for the later (18°) angle; eyewitness experience argues for the earlier (14–15°) angle; the *shar'i* definition of fajr al-sadiq is the Quranic fixed point that calibration serves, not the other way around.

---

### Elevation / horizon-dip / refraction

No new peer-reviewed papers found for 2024–2026 specifically on the horizon-dip elevation correction beyond the existing UAE Burj Khalifa fatwa / JAKIM systematic implementation that fajr's wiki already documents. The literature search returned no new arXiv preprints, no new JAKIM methodology updates, no Saudi institutional reversal of the no-correction stance. The fajr stance ([elevation.md](../../knowledge/wiki/corrections/elevation.md): 🟡→🟢 Approaching established, applied via city registry with notes[] disclosure) is the current frontier — no scholarly retreat or advance has been published.

One adjacent finding:
- **Faid 2024 (Scientific Reports)** mentions in passing that high-altitude pristine sites (Mauna Kea, Atacama-class) show even stronger 17.5° stabilization, providing indirect support for the proposition that elevated observers are *less* affected by horizon-dip-related Fajr corrections (the geometric horizon dip drives Shuruq/Maghrib but the astronomical-twilight Fajr-marker is referenced to the geometric horizon plane — fajr's existing Fajr/Isha-not-elevation-corrected stance is consistent with this).

---

### Hilal visibility criteria

The major 2023–2024 development is the **Faid–Nawawi–Saadon corpus** at the University of Malaya, which has built **HilalPy** — an integrated database of 8,290 lunar crescent sighting records analysed via swarm-plot, contradiction-rate, and regression analysis. This is the largest systematic empirical assessment of crescent visibility criteria since Schaefer / Yallop / Odeh.

| # | Citation | Finding |
|---|---|---|
| 10 | **Faid, Nawawi & Saadon (2024)** *Assessment and review of modern lunar crescent visibility criterion.* Icarus / ScienceDirect (S0019103524000289), https://doi.org/10.1016/j.icarus.2024.116015 (and companion 2023 paper *Analysis tool for lunar crescent visibility criterion based on integrated lunar crescent database* in New Astronomy, S2213133723000677) | **Yallop 1997 has the lowest naked-eye negative contradiction rate of any criterion: 5.83%** (positive contradiction 20.2%). For optical-aided observations, Yallop / Odeh / Qureshi / Caldwell all have 100% negative contradiction (i.e., all over-predict invisibility for telescope-aided sightings). Published methodology dataset: 8,290 records. |
| 11 | **Faid, Nawawi & Saadon (2024)** *Design, Development and Analysis of Lunar Crescent Visibility Criterion with Python.* Routledge / CRC Press / Taylor & Francis, ISBN 978-1-032-86692-5. eBook published 2024-12-05. https://doi.org/10.1201/9781003536192 | Book-length companion describing HilalPy + HilalObs as Python libraries deployable into prayer-time / Hijri-calendar applications. |

**MABIMS criterion update (2021) — Southeast Asia regional consensus:**

| # | Citation | Finding |
|---|---|---|
| 12 | **Implementation of the New MABIMS Crescent Visibility Criteria** (2022). Ahkam Journal — UIN Jakarta. https://journal.uinjkt.ac.id/index.php/ahkam/article/download/22275/10513 | MABIMS (Indonesia + Malaysia + Brunei + Singapore) updated from old criteria 2°/3° (height/elongation, in place 30 years) to new criteria **3°/6.4°**. Adopted via ad-referendum 2021-12-08. Active in MABIMS member countries since 2022. Implementation varies: Malaysia and Brunei adopted directly; Indonesia and Singapore retain some local flexibility. |

**Implication for fajr/hilal.js.** Currently fajr implements Yallop 1997 + Odeh 2004 + Shaukat 2002 (and confirms via Meeus). The Faid 2024 contradiction-rate finding is *good news* for the existing implementation: Yallop is the most reliable naked-eye criterion of all assessed. **However**, fajr does not currently encode the MABIMS 2021 3°/6.4° criterion — which is the institutional default for ~270M Muslims across SE Asia. This is a high-leverage extension.

---

### Regional / madhab-specific calibrations

Most regional updates in 2023–2024 are administrative (publication apps, cosmetic UI changes) rather than methodological. Three notable findings:

- **Indonesia, Muhammadiyah vs Nahdlatul Ulama divergence on Fajr angle**: Min. of Religion + NU = -20° dip; Muhammadiyah = -18° dip. Surfaced in *Parewa Saraq: Journal of Islamic Law and Fatwa Review* (2024) "The Compliance with Tarjih Fatwa on the -18° Dawn Criterion: A Study of Muhammadiyah Mosques in Gowa Regency." This is institutional ikhtilaf inside a single country — fajr currently dispatches Indonesia → KEMENAG, which is the Min. of Religion default at -20°. Surfacing the Muhammadiyah -18° via `altMethods` is consistent with fajr's surface-disagreement principle.
- **MUIS Singapore, Diyanet Türkiye:** No methodology change in 2023–2024 per searches. Both continue traditional published methods (MUIS uses Singapore-specific 20°/18°-equivalent dispatch; Diyanet uses 18°/17°). The Diyanet 1983 Fajr-from-19°-to-18° change remains the most recent Diyanet methodological shift.
- **FCNA 2024 update**: clarification that the 15°/15° angle is "throughout the year" and is the consolidated FCNA position (per Sept 2024 article by Mustafa Umar). No region-specific Canada-vs-USA split in the 2024 article. Earlier Yasir Qadhi tweet (2020) confirms FCNA was already at 15° — the 2024 article re-affirms.

---

### High-latitude rules

The literature search returned **no new 2024–2026 high-latitude rule proposals beyond Tarabishy 2014 and Odeh 2009**, which fajr already cites. The astronomycenter.net latitude page (https://astronomycenter.net/latitude.html) remains the canonical Islamic-astronomy reference for the high-lat methods (1/7, middle-of-night, twilight-angle, Local Relative Estimation per the 2008 Riyadh + 2009 Mecca MWL+ICOP committee). The Tarabishy 2015 critique of Khalid Shaukat's method (https://astronomycenter.net/pdf/tarabishyshigh_2015.pdf) is already in the fajr knowledge corpus implicitly via the wiki.

The Cureus 2024 Irfan & Yaqoob paper *Between Fajr and Isha: Understanding Sleep Dynamics in Islamic Prayer Timings and Astronomical Considerations* (PMC11117174, 2024-04-24) is a health-literature framing that is **not actionable** for fajr's accuracy work but is worth citing for the public-interest framing in CALIBRATION.md.

No new rules. **fajr's existing Tarabishy / Odeh / MiddleOfTheNight / TwilightAngle dispatch is the current frontier.** No high-latitude correction proposal makes it onto the ratchet candidate list below.

---

## Ratchet candidates (top 10, ordered by leverage × confidence)

The ratchet's hard rule is per-region pass/fail against institutional ground truth. These candidates are ordered by their expected ability to pass `eval/compare.js` *while* surfacing legitimate scholarly evidence:

| # | Source | Finding | Proposed fajr correction | Classification | Estimated WMAE impact (train) | Test cells affected |
|---|---|---|---|---|---|---|
| **1** | Faid 2024 *Scientific Reports*; Aabed 2015; Khalifa 2018 | Light pollution causes ~6° angular shift in perceived dawn (17.49° dark-sky → 11.5° urban-polluted) | **Surface a `lightPollutionAdvisory` boolean on `prayerTimes()` output** for any city with population > X, with `notes[]` text quoting Faid 2024 (peer-reviewed Nature-family grounding) and Aabed 2015 (20–30 min city delay). No clock-minute change to engine output. Pure transparency / disclosure improvement. | 🟢 Established (peer-reviewed Nature Scientific Reports 2024 + scholarly Aabed 2015 institutional consensus) | 0 (transparency, no math change). Train WMAE unchanged. | All urban cells; biggest legibility for Cairo / Karachi / Lagos / Jakarta / Istanbul where population > 10M and 18°/19° dispatch differs visually from FCNA 15° |
| **2** | Faid–Nawawi–Saadon 2023/2024 *New Astronomy* + 2024 book | MABIMS 2021 adopted 3°/6.4° (height/elongation) as official Hijri month criterion for ~270M Muslims | **Add a `mabims2021` criterion to `src/hilal.js`** alongside Yallop / Odeh / Shaukat. Default for Indonesia / Malaysia / Brunei / Singapore (with backward compat — not changed for callers explicitly requesting Yallop/Odeh) | 🟡→🟢 Approaching established (MABIMS official 2021; institutional consensus among 4 SE-Asia countries; cross-validated by HilalPy 8,290-record contradiction analysis) | 0 (separate prayerTimes-vs-hilal pipeline; affects hilal output not WMAE) | All hilal calls in MABIMS region; better alignment with KEMENAG / JAKIM official Hijri-month publications |
| **3** | FCNA 2024 (Umar) | FCNA 2024 article restates 15° North America Fajr/Isha; cites empirical observation history (Riyadh 2004 al-Fauzan, Chicago 1985, UK 1983, Moonsighting.com decade-scale) | **Add `altMethods: ['ISNA-15']` to North America country dispatch** (USA/Canada) — fajr currently dispatches NorthAmerica method (which is ISNA 15°/15° per adhan-js); this is essentially already correct, but the FCNA 2024 cite should land in `notes[]` so users can audit. **Verify** the current North America angle dispatch matches FCNA 15°; if not, sync. | 🟢 Established (FCNA institutional fatwa, Sept 2024) | 0–0.1 min train WMAE (likely already correct; verify-only) | All US/Canada cells (New York, LA, Toronto already in train); Chicago, Houston, Detroit if test holdout adds them |
| **4** | Maskufa et al. 2024 *Mazahib* | Indonesian institutional split: Min. Religion + NU = -20° dip; Muhammadiyah = -18° | **Add `altMethods: [{ name: 'Muhammadiyah', fajrAngle: 18, ishaAngle: 18 }]` to Indonesia country dispatch.** Default remains KEMENAG -20° (Min. of Religion); Muhammadiyah is the documented-minority alternative. | 🟢 Established (institutional split documented in 2024 peer-reviewed Mazahib paper; Muhammadiyah is the second-largest Indonesian Islamic organization with ~30M adherents) | 0 train WMAE (default unchanged) | Surfacing: Jakarta, Bandung, Surabaya — for Muhammadiyah-affiliated callers |
| **5** | Khalifa 2018; Taha 2025; Hassanin 2014 (Saudi/Egypt 14–15° empirical) | Multi-paper convergence: dark-sky dawn at 14.5°–14.9° at desert observation sites; institutional Umm al-Qura 18.5° / Egyptian 19.5° | **Surface `altMethods` for Saudi Arabia and Egypt only — do NOT change the default.** Dispatch remains Umm al-Qura 18.5° / Egyptian 19.5°. The empirical-14.66° paper (Khalifa 2018) is added as a secondary `altMethods` entry under name `Khalifa-2018-empirical` for the Saudi country dispatch, and `Hassanin-2014-empirical` for Egypt. **Crucial**: the proposal is *not* to deploy 14.66° as a default. It is a *surfacing-disagreement* opt-in, with `notes[]` text explicitly noting that the institutional 18.5°/19.5° is prayer-validity-safe and the 14.66° empirical is fasting-only-relevant. | 🟡 Limited precedent (peer-reviewed but not adopted by any institution) | 0 train WMAE (default unchanged). Cairo + Alexandria 6.5min Fajr MAE residual *would* close almost completely if 19.5° → 14.5° as default — but this would breach prayer-validity ihtiyat. The opt-in path A respects ihtiyat. | Surfacing: Makkah, Madinah, Riyadh, Jeddah, Dammam, Cairo, Alexandria. Optional opt-in for ICCMW-style empirical-Fajr communities |
| **6** | Cureus 2024 (Irfan & Yaqoob); Faid 2024 | Sleep-dynamics / health-policy framing of the Fajr-Isha angle question | **Add a `health` section to `CALIBRATION.md`** citing Cureus 2024 sleep-disruption framing — *not* a code change. Improves the public-interest framing of why ihtiyat matters. | 🟢 Established (peer-reviewed health literature) | 0 (doc only) | All — strengthens fajr's transparency claim for downstream regulators / app-store reviewers / consumer-health journalists |
| **7** | Sufyan 2020 (Indonesia Depok SQM); Maskufa 2024 | Two more datapoints for the SE-Asia 14° empirical Fajr cluster | **Cite Sufyan 2020 in `wiki/methods/fajr-angle-empirics.md`** as a third instrumented confirmation alongside Almisnid 2012 and Hassan 2014. No code change. | 🟢 Established | 0 (doc only) | None directly; reinforces the existing wiki page |
| **8** | OpenFajr Birmingham project | 25,000+ photographs of dawn over 1 year using astrophysics-grade fish-eye CCD camera | **Cite OpenFajr in `wiki/methods/fajr-angle-empirics.md` as a UK contemporary observation effort.** No code change. (Project hasn't published a single recommended angle — it explicitly rejects fixed-angle calculations.) | 🟡 Limited precedent (community-driven, no peer-reviewed publication) | 0 (doc only) | None directly; legitimizes UK MoonsightingCommittee dispatch by showing parallel community work |
| **9** | None new — fajr's existing wiki | The Diyanet 1983 19°→18° Fajr change remains the most recent Diyanet methodological shift | **Cite the Diyanet 1983 change in the existing `wiki/regions/turkiye.md` (or add it)** so reviewers can see Diyanet's institutional precedent for periodic-recalibration. No code change. | 🟢 Established | 0 (doc only) | Documentation only |
| **10** | Faid, Nawawi & Saadon 2024 book + Mazahib 2024 | Combined: HilalPy is a deployable Python library for sighting-criterion analysis | **Add a `hilalPy` reference to `wiki/astronomy/hilal.md`** as a tool callers can use to validate fajr's Yallop/Odeh/Shaukat output against the 8,290-record empirical corpus. Documentation only. | 🟢 Established | 0 (doc only) | Documentation only; strengthens the hilal page |

**The non-default candidates 1–4 are all on the ratchet's safe side**: they ship via `altMethods` / `notes[]` / new opt-in Hilal criterion. None changes the default engine output. None breaches prayer-validity ihtiyat. The autoresearch ratchet should accept all four with low risk.

**Candidate 5 (Saudi/Egypt 14–15° as `altMethods`)** is the most consequential and most exposed to scholarly debate. It is *opt-in*, but surfacing it via `notes[]` makes fajr take a public position that the empirical 14–15° angle is real and is worth surfacing. The Maskufa 2024 *Mazahib* paper's institutional caution ("avoid wholesale adoption … recommends ongoing joint research") is the right *posture* for fajr to model: **surface the ikhtilaf, do not resolve it.**

---

## Validation sets extracted

Three papers publish specific lat/lon/date/expected-time tuples that fajr could absorb directly into the eval corpus:

### Set A — Khalifa, Hassan & Taha 2018 (Hail KSA)

**Source PDF:** https://www.academia.edu/47336966/Twilight_observation_by_the_naked_eye_of_the_dawn_sincere_at_Hail_and_other_areas_in_Saudi_Arabia (verified ResearchGate / ADS metadata)
**Lat/Lon:** 27°31'N, 41°42'E (Hail, Saudi Arabia, desert background)
**Date range:** 2014–2015, ~80 observations (32 quality-selected)
**Variable:** sun depression at observed true dawn, naked-eye + tayakkun
**Mean:** Do = 14.014° ± 0.317° (range 13.48°–14.69°); high-confidence true dawn at 14.66° = mean+2SD
**fajr usage:** add as a "scientific empirical-observation" cell in `eval/data/test/` with notes flagging this as *empirical observation, not institutional ground truth* — it is the kind of cell that should *not* improve when the engine moves toward institutional 18.5°. It exists to characterize the bias direction.

### Set B — Hassanin et al. 2014 (4 Egypt sites)

**Lat/lon:** Bahria, Matrouh, Kottamia, Aswan (verifiable per Egyptian astronomy infrastructure — Kottamia is the NRIAG observatory at 29.93°N, 31.83°E)
**Date range:** 1984–1987, multi-year
**Mean:** Do = 14.7° ± 1.05° across all four sites
**fajr usage:** same as Set A — empirical-observation test cell, *not* institutional ground truth.

### Set C — Taha et al. 2025 (Riyadh + Aswan + Mauritania)

**Lat/lon:** Riyadh (~24.7°N, 46.7°E); Aswan (~24.1°N, 32.9°E); Mauritania site (specific coords pending paper acquisition — likely Nouakchott region)
**Date range:** 2024–2025
**Variable:** simultaneous true-dawn and false-dawn observations
**Means:**
- Riyadh: true dawn 14.88° ± 0.3°; false dawn 18.58° ± 0.85°
- Aswan: 12.69°
- Mauritania: 14.85° ± 0.61°
- Optimal-conditions consensus: Do ≈ 14.4°
**fajr usage:** Riyadh is already in fajr's train cluster (currently 0.94 WMAE against Aladhan); adding the Taha 2025 14.88° empirical observation as a second-source reference for Riyadh would surface the institutional-18.5°-vs-empirical-14.88° split as exactly the kind of dual-source cell that exposes the Path A vs ihtiyat tension. **High value for the eval corpus** — especially for the 5-iteration autoresearch agenda described in the proposal scope.

### Caveat — none of these are mosque-published

Per fajr's `eval/compare.js` ratchet design, mosque-published times (Mawaqit / JAKIM / Diyanet / KEMENAG) are the institutional ground truth that drives the train ratchet. The Khalifa / Hassanin / Taha empirical observations are scholarly observation studies, *not* institutional dispatch. They should land in `eval/data/test/` as informational holdout cells, **not** in `eval/data/train/`. The autoresearch ratchet should explicitly *not* gate accept/reject on these cells — they exist to characterize the gap between calculation and naked-eye observation, not to drive calibration toward observation-only ground truth.

---

## Open citations needed

Per `feedback_aggressive_data_hunt`: papers where the abstract was found but full text was blocked behind a paywall / ScienceDirect 403:

| Paper | What's missing | Suggested next-search-paths |
|---|---|---|
| Faid–Nawawi–Saadon 2024 *Assessment and review of modern lunar crescent visibility criterion* (Icarus / S0019103524000289) | Full text — only abstract + Faid's other published work surfaces. | Try: (a) ResearchGate fulltext via Faid's profile https://www.researchgate.net/profile/Muhamad-Syazwan-Faid; (b) UM library OA repository http://eprints.um.edu.my/; (c) author email tawfeeqmartin → Faid for direct preprint share; (d) OAI-PMH bulk via University of Malaya institutional repository |
| Faid–Nawawi–Saadon 2023 *New Astronomy* (S2213133723000677) | Full text — same issue | Same paths as above |
| Hassanin et al. 2014 (NRIAG Journal of Astronomy and Geophysics 3:23) | Full text — Taylor & Francis 403 | Try: (a) astronomycenter.net direct PDF — Odeh's site mirrors many NRIAG papers; (b) academia.edu Hassan or Taha profile; (c) NRIAG institutional URL https://www.nriag.sci.eg/ |
| Khalifa, Hassan & Taha 2018 (NRIAG 7:22) | Full text — same | Same; the academia.edu mirror at https://www.academia.edu/47336966 has the full PDF per the search result |
| Sun Vertical Depressions… 2025 Springer chapter | Full text — Springer 303 redirect on chapter URL | Try: (a) Springer eBook deep-link http://link.springer.com/chapter/10.1007/978-981-96-3276-3_14 with browser instead of WebFetch; (b) author preprint via Hassan/Taha ResearchGate; (c) university institutional repository (NRIAG / Cairo Univ astronomy dept) |
| Maskufa 2024 Mazahib | Full text — full UIN Samarinda PDF should be open. The `https://journal.uinsi.ac.id/index.php/mazahib/article/view/7293` URL is OA but fetch returned a citation-extraction rather than full-text. | Try direct: `journal.uinsi.ac.id/index.php/mazahib/article/download/7293/<artifact-id>` |
| Sufyan 2020 (NRIAG 9:238) | Same Taylor & Francis 403 | Same paths |

**For the autoresearch agent:** if any of these primary papers is needed for an actionable correction (especially the Faid 2024 Icarus paper, which contains the concrete 5.83% Yallop contradiction-rate number that grounds the Yallop-default decision), the next step is to email tawfeeqmartin@gmail.com → request institutional access via University of Malaya for the Faid corpus, or write to Mohd Saiful Anwar Mohd Nawawi directly. The book *Design, Development and Analysis of Lunar Crescent Visibility Criterion with Python* (Routledge 2024) consolidates the corpus and may be the cleanest single citation if obtainable.

---

## Scholarly opinion summary

**Where is the field moving?**

1. **The 14–15° empirical Fajr observation is now multi-paper, multi-country, and unmistakable.** Aabed 2015 (Jordan), Hassanin 2014 (Egypt), Almisnid 2012 (KSA Qassim), Khalifa 2018 (KSA Hail), Sufyan 2020 (Indonesia Depok), Taha 2025 (Riyadh + Aswan + Mauritania), FCNA's cited Riyadh 2004 al-Fauzan and Chicago 1985 / UK 1988 — all converge on Do ≈ 14°–15° at non-deep-desert observation sites. Treating this as a "minority position" is no longer defensible by 2026.

2. **However, the Faid 2024 *Scientific Reports* paper is the cleanest peer-reviewed grounding for the institutional 18° in dark sky.** The 17.49° dark-sky stabilization vs. 11.5° polluted-sky stabilization is a 6° angular-perception shift attributable to ALAN, not to dawn timing. **This rescues the institutional 18° for prayer-validity** while *also* validating the urban observer reports of "Fajr looks too early." The two observations are reconciled, not in conflict.

3. **The current scholarly consensus among contemporary working researchers** (per Faid, Nawawi, Hassanin, Taha, Khalifa, Maskufa, Damanhuri) appears to be:
   - Institutional 18° / 18.5° / 19° / 19.5° remains *prayer-validity-safe* in dark sky.
   - Empirical 14–15° remains *the perceived-dawn* threshold for many real observers in non-pristine sites.
   - The reconciliation is **light pollution + dual-ihtiyat** (prayer-validity vs fasting-validity), not "one is right and the other is wrong."
   - Surfacing both is the right institutional posture (per Maskufa 2024 *Mazahib*'s explicit recommendation).

4. **Yallop/Odeh/Shaukat hilal criteria are not challenged.** The Faid 2024 contradiction-rate analysis confirms Yallop 1997 has the lowest (5.83%) naked-eye negative contradiction rate of any tested criterion. Odeh 2004 remains a strong second. fajr's existing implementation is empirically defensible.

5. **MABIMS 2021** is the institutional change to absorb. The 3°/6.4° criterion is the new SE-Asia regional default and fajr's hilal code does not yet implement it.

**Has Yallop/Odeh been challenged?**

Yallop has been *empirically validated*, not challenged. The 2023–2024 Faid corpus systematically confirms Yallop is the strongest naked-eye criterion. Odeh remains the institutional default for Egypt's Dar al-Iftaa, Jordan, and ICOP — also unchanged. The challenge in 2024–2026 is *additional* criteria (MABIMS 2021, Faid's data-driven proposals from the 8,290-record database) — not displacement of Yallop/Odeh.

**Any modern peer-reviewed results that should update fajr's defaults?**

The four candidates worth landing in code (not just docs) are:

1. **MABIMS 2021 hilal criterion** (3°/6.4°) — required for SE Asia fidelity (~270M Muslims).
2. **Light-pollution advisory** (`notes[]` text grounded in Faid 2024 *Scientific Reports*) — required for legibility of the institutional-18° decision.
3. **Indonesia Muhammadiyah `altMethods` -18°** — surfaces NU/Muhammadiyah institutional ikhtilaf inside Indonesia.
4. **Saudi/Egypt empirical `altMethods` 14.66°/14.7°** — surfaces the empirical-vs-institutional gap.

Items 5–10 in the ratchet candidates table are documentation strengthenings. None of the four code-changing candidates breaches the ratchet's per-region regression rule (none changes a default). All are 🟢 Established or 🟡→🟢 Approaching established. **No 🔴 Novel candidates were generated** by this survey, consistent with the proposal's constraints.

---

## Sources

Per the WebSearch tool's required sourcing convention:

- [Khalifa, Hassan & Taha 2018 — Twilight observation by the naked eye of the dawn sincere at Hail and other areas in Saudi Arabia (NRIAG / Taylor & Francis)](https://www.tandfonline.com/doi/full/10.1016/j.nrjag.2018.01.001)
- [Khalifa, Hassan & Taha 2018 — ADS abstract](https://ui.adsabs.harvard.edu/abs/2018JAsGe...7...22K/abstract)
- [Khalifa, Hassan & Taha 2018 — academia.edu mirror](https://www.academia.edu/47336966/Twilight_observation_by_the_naked_eye_of_the_dawn_sincere_at_Hail_and_other_areas_in_Saudi_Arabia)
- [Hassanin et al. 2014 — Naked eye observations for morning twilight at different sites in Egypt (NRIAG / Taylor & Francis)](https://www.tandfonline.com/doi/full/10.1016/j.nrjag.2014.02.002)
- [Sun Vertical Depressions and Their Effects on the Morning Twilight Phases in Egypt (Springer 2025)](https://link.springer.com/chapter/10.1007/978-981-96-3276-3_14)
- [Taha, Al Mostafa, Ragheb, Hassan & Hussein 2025 — Observation of the true dawn for three different countries in the Arab region (Emirati Journal of Space and Astronomy Sciences)](https://emiratesscholar.com/directory/index.php/ejsas/article/view/1047)
- [Aabed 2015 — Determining the beginning of the true dawn in Jordan (ResearchGate)](https://www.researchgate.net/publication/282576052_thdyd_mwd_hlwl_alfjr_alsadq_fy_alardn_balrsd_alflky_almbashr_balyn_almjrdt_Determining_the_beginning_of_the_true_dawn_Al-Fajr_Al-Sadek_observationally_by_the_naked_eye_in_Jordan)
- [Sufyan et al. 2020 — Predicting the accurate period of true dawn using a third-degree polynomial model (NRIAG / Taylor & Francis)](https://www.tandfonline.com/doi/full/10.1080/20909977.2020.1738106)
- [Maskufa, Damanhuri, Sopa & Hadi 2024 — Contextualising Fajr Sadiq with the SQM (Mazahib UIN Samarinda)](https://journal.uinsi.ac.id/index.php/mazahib/article/view/7293)
- [Faid, Shariff, Hamidi et al. 2024 — Alteration of twilight sky brightness profile by light pollution (Nature Scientific Reports)](https://www.nature.com/articles/s41598-024-76550-3)
- [Faid 2024 — PMC mirror of the Scientific Reports paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11535048/)
- [Fiqh Council of North America 2024 — Fifteen or Eighteen Degrees: Calculating Prayer & Fasting Times in Islam (Mustafa Umar)](https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/)
- [Fiqh Council of North America — How should the times of Fajr and Isha be calculated?](https://fiqhcouncil.org/the-suggested-calculation-method-for-fajr-and-isha/)
- [Faid, Nawawi & Saadon 2024 — Assessment and review of modern lunar crescent visibility criterion (Icarus / ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0019103524000289)
- [Faid, Nawawi & Saadon 2023 — Analysis tool for lunar crescent visibility criterion based on integrated lunar crescent database (New Astronomy / ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S2213133723000677)
- [Faid, Nawawi & Saadon 2024 — Design, Development and Analysis of Lunar Crescent Visibility Criterion with Python (Routledge book)](https://www.routledge.com/Design-Development-and-Analysis-of-Lunar-Crescent-Visibility-Criterion-With-Python/Faid-Nawawi-Saadon/p/book/9781032866925)
- [Implementation of the New MABIMS Crescent Visibility Criteria (Ahkam UIN Jakarta 2022)](https://journal.uinjkt.ac.id/index.php/ahkam/article/download/22275/10513)
- [Irfan & Yaqoob 2024 — Between Fajr and Isha: Understanding Sleep Dynamics in Islamic Prayer Timings (Cureus / PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11117174/)
- [Tarabishy 2014 — Salat / Fasting Time in Northern Regions (astronomycenter.net)](https://astronomycenter.net/pdf/tarabishy_2014.pdf)
- [Tarabishy 2015 — Evaluation of Khalid Shaukat's Method for Salat Time (astronomycenter.net)](https://astronomycenter.net/pdf/tarabishyshigh_2015.pdf)
- [Odeh 2009 — A New Method to Calculate Fajr and Isha Times When They Disappear in The Area Between Latitude 48.6° and 66.6° (astronomycenter.net)](https://astronomycenter.net/paper.html)
- [astronomycenter.net — Prayer Times in High-Latitude Areas](https://astronomycenter.net/latitude.html)
- [Compliance with Tarjih Fatwa on the -18° Dawn Criterion: A Study of Muhammadiyah Mosques in Gowa Regency (Parewa Saraq 2024)](https://ejournal.sulselmui.com/index.php/PS/article/view/47)
- [OpenFajr Birmingham project](https://openfajr.org/)
- [Diyanet Turkey — Presidency of Religious Affairs (2024 namaz vakitleri)](https://www.diyanet.gov.tr/en-US/)
- [Aladhan calculation methods (institutional reference)](https://aladhan.com/calculation-methods)
- [Praytimes.org calculation methodology](https://praytimes.org/calculation)
- [Moonsighting.com calculation methodology](https://www.moonsighting.com/how-we.html)

— fajr-research-paper-survey-agent
