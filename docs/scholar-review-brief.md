# Scholar review brief — fajr (an open-source prayer time library)

> _Adapt the salutation for the specific scholar before sending. Everything else is meant to stand on its own — the scholar should be able to read just this document and respond in writing without needing to consult any other materials._

---

**As-salāmu ʿalaykum wa raḥmatu Llāhi wa barakātuh,**

My name is Tawfeeq Martin. I am the maintainer of **fajr** (Arabic: فجر), a free, open-source software library that calculates Islamic prayer times, qibla direction, Hijri dates, and lunar crescent visibility. fajr is dedicated as a *sadaqah jāriya* for my daughters Nurjaan and Kauthar. It is freely licensed (MIT), has no commercial backing, and is intended to remain freely available indefinitely.

I am writing to ask whether you would be willing to read the four specific questions below — each describes a *fiqh*-relevant decision that the software currently makes — and offer a written assessment. I am asking for **review and the identification of problems**, not endorsement; if after reading you believe a decision is unsound, naming the problem in writing is the most useful response. If you decline or refer me elsewhere, no obligation; either is welcome.

This document is intended to be self-contained. There is no need to read code, follow links, or look at any other materials before responding. Everything material is below.

---

## What fajr is, in three sentences

When a Muslim opens an app to check prayer times, that app uses some calculation method (an astronomical formula plus some fixed parameters like the Fajr twilight angle). fajr automatically picks the method that the user's region's Islamic authority uses (Habous for Morocco, Diyanet for Türkiye, JAKIM for Malaysia, Umm al-Qurā for Saudi Arabia, etc.) so the user doesn't have to configure it. It also computes lunar crescent visibility predictions for Ramadan and Eid using three independent astronomical criteria side-by-side, surfacing the disagreement between them rather than picking one.

Throughout, fajr tries to honour the *wasāʾil/ʿibādāt* distinction — software computes the *means* of determining prayer times; the *acts of worship* themselves are governed by *sharʿ* and ultimately by the user's local Islamic authority. fajr does not issue rulings; it provides astronomical estimates.

---

## Question 1 — Morocco's Fajr angle: stated 18°, empirical 19°

The Moroccan Ministry of Habous publishes annual prayer time tables (*imsākiyya*) that are the authoritative reference for Moroccan Muslims. The Ministry's stated calculation method uses a Fajr depression angle of **18°**.

However, when one applies the standard 18° formula at the correct coordinates for Casablanca or Rabat and compares it to the Ministry's own published table, the formula's Fajr is roughly **5 minutes later** than the Ministry's published time. A **19°** formula reproduces the Ministry's published tables to within ~1 minute. This is independently corroborated by mosque-published times: five active Moroccan mosques (Casablanca x3, Rabat, Marrakech) on the Mawaqit network publish daily Fajr times consistent with the 19° calculation — not 18°.

So: the formal stated method differs from what the Ministry's own published tables actually contain. fajr therefore uses 19° for Morocco — a *community calibration* matching the Ministry's published reality, not the Ministry's stated formula.

This matters most acutely during Ramadan: a fasting Muslim following the 18° formula would stop eating roughly 5 minutes after the Ministry-published *imsāk* time, eating past the dawn the Ministry itself recognises.

**Question for review:** Is it sound for software to use a community-calibrated angle (19°) that empirically reproduces the official authority's published Fajr times, when that authority's formally stated method (18°) would diverge from those same published times by ~5 minutes? Or should the formally stated method take precedence even at the cost of accuracy against the Ministry's own published tables?

---

## Question 2 — The two directions of *iḥtiyāṭ* (precaution) for Fajr

For Fajr specifically, *iḥtiyāṭ* cuts two different ways depending on which obligation is at stake:

- **Prayer validity:** the cautious direction is **later** — praying before actual dawn (*al-fajr al-ṣādiq*) is an invalid prayer, so when the calculated time is uncertain, erring later avoids the risk.
- **Ramadan fasting (suhoor):** the cautious direction is **earlier** — eating past actual dawn breaks the fast, so erring earlier avoids the risk. The classical resolution is *imsāk* — a buffer (typically ~10 minutes) before published Fajr at which fasters stop eating, while prayer itself begins at the calculated Fajr. *Imsāk* provides the fasting precaution; published Fajr should be the actual astronomical dawn.

For automated software that improves accuracy by reducing error against multiple reference sources, the question arises: when a proposed engine change moves the calculated Fajr time **earlier** (matching what mosques and ministries actually publish), should the system accept that change?

By the prayer-only logic, "earlier" is *less safe*. By the fasting logic, "earlier" is *more safe* (so long as the published Fajr is being used by users to derive their personal *imsāk*, which is the conventional practice).

fajr currently defaults to the prayer-only direction (treating "engine moves Fajr earlier" as suspect by default), but allows that default to be **overridden** when the move toward earlier Fajr is *independently corroborated* by mosque-published times — i.e., when the engine is moving toward what the local community actually prays to, not drifting away from astronomical reality.

**Question for review:** Is this asymmetry sound? Specifically: when mosque-published times indicate that the engine should produce an earlier Fajr (matching the fasting-safe direction *and* the local community's published reality), is that an appropriate override of the prayer-only-iḥtiyāṭ default? Or should the prayer-only direction be inviolable in software regardless of what mosques publish?

---

## Question 3 — Multi-criterion hilal output: surfacing *ikhtilāf* vs picking one

fajr predicts lunar crescent visibility using **three** independent astronomical criteria computed in parallel:

- **Odeh (2004)** — empirical fit, used by Egypt's Dār al-Iftāʾ and the Islamic Crescents' Observation Project (ICOP)
- **Yallop (1997)** — empirical fit, used by the UK Nautical Almanac Office and several European committees
- **Shaukat (2002)** — rule-based, used by Pakistan's Central Ruet-e-Hilāl Committee

For any given Hijri month at any given location, fajr returns all three classifications side-by-side, plus a flag indicating whether all three agree. It does **not** pick one as canonical or default. The reasoning: surfacing the disagreement honestly is more respectful of the *ikhtilāf* in the *ʿulamāʾ*'s tradition than presenting users with one criterion and letting them mistake it for "the answer."

A practical example: for Ramadan 1446 (sighting evening 28 February 2025), at most Muslim-majority observatories all three criteria agreed that the moon was either too young (sub-Danjon) or astronomically borderline. Different national committees announced different decisions: Saudi Arabia, the UAE, Qatar, and Egypt declared sighted; Pakistan, Morocco, Iran, and India did not. fajr's output surfaces *both possibilities* so a downstream app can show users their own committee's likely decision pattern, rather than imposing one criterion on everyone.

**Question for review:** Is multi-criterion side-by-side output an appropriate way for software to handle this *ikhtilāf*? Or does presenting three classifications to users create confusion that software should resolve itself (by, for example, preferring the criterion the user's regional authority uses)? Are Odeh, Yallop, and Shaukat the right three to compute — should others (Bruin 1977, Maunder 1911, naked-eye-only / *al-ruʾyā al-shaykhiyya* / lunar-mansion methods) be added, or any of these dropped?

---

## Question 4 — A four-tier scholarly-certainty typology for corrections

Every astronomical correction in the engine is tagged with one of four scholarly-certainty markers:

- 🟢 **Established** — consensus in classical sources or contemporary institutional practice. Examples currently classified 🟢: region-aware method selection (auto-picking the right calculation method per country); the Hijri tabular calendar; *qibla* great-circle bearing.
- 🟡→🟢 **Approaching established** — recently documented by one or more institutions; on a trajectory toward consensus. Example: the Morocco 19° community calibration above (Ministry of Habous published tables, plus Mawaqit mosque data).
- 🟡 **Limited precedent** — supported by some scholars or institutions, minority view. Examples: elevation correction for Shuruq/Maghrib (UAE Grand Mufti Burj Khalifa fatwa says yes; Saudi Arabia explicitly does not apply; JAKIM applies systematically); the three-criterion hilal output (no single criterion is universally accepted).
- 🔴 **Novel** — no clear *sharʿī* precedent. The software's automated improvement loop is forbidden from deploying 🔴 corrections; they require human scholarly review before being considered.

The intent is to encode in software the fact that a mathematically-clean correction is not the same thing as a *sharʿī*ally-validated one. Software follows the math; *sharʿ* governs the application.

**Question for review:** Does this four-tier typology meaningfully represent how scholars actually conceptualize the certainty of *masāʾil* in *ʿilm al-mīqāt*? In particular:

- Is the Morocco 19° angle correctly classified as 🟡→🟢 (community calibration with multi-source corroboration), or should it be more cautious?
- Is the elevation correction correctly classified as 🟡 (UAE/JAKIM precedent for application; Saudi Arabia's explicit non-application a documented counter-precedent)? It is currently shipped as a utility but **disabled by default** — only opt-in until either a Saudi-equivalent authority adopts it or the user explicitly enables it.

---

## What I am asking for, concretely

A response in writing, in any form you find appropriate. Possible shapes:

1. **A short written assessment** — a paragraph per question, in plain language: what is sound, what is questionable, what needs work.
2. **Pointed corrections** — even just *"decision 1 is unsound, see [reference]"* is enormously valuable and is enough on its own.
3. **A referral** — if these questions are out of scope or another scholar is better suited, a name and (if you're willing) an introduction would be welcome.
4. **A graceful no** — if you would prefer not to engage at all, no explanation needed.

If you find the methodology sound on a question and would permit attribution, I would record the attestation in writing in the project's documentation, naming the date of review and the specific scope of what you reviewed. Nothing about this is institutional certification — only a scholar's reading and assessment, attributed if you allow. If you would prefer to remain unattributed while still offering a review, your input would be just as gratefully received and held in confidence.

Please reply by email at whatever pace and depth the questions deserve — there is no deadline. If another arrangement suits you better, please let me know.

If you would like to look further into anything I have summarised above, the project lives at <https://github.com/tawfeeqmartin/fajr> — but nothing there is required reading; the four questions above are intended to stand fully on their own.

*Jazākum Allāhu khayran* for any time you can give to this. I remain grateful for your work and for the broader tradition of *ʿilm al-mīqāt* on which all of this rests.

— Tawfeeq Martin
&nbsp;&nbsp;&nbsp;tawfeeqmartin@gmail.com
