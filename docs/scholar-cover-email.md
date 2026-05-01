# Cover email — to send to Dr. Mohammad Shaukat Odeh

> Adapt salutation and any specifics before sending. The body below is what goes in the email. The scholar-review-brief.md file is the document you link to.

---

**Subject:** Open-source 2025 implementation of your 2004 criterion — with a collaboration ask

---

As-salāmu ʿalaykum wa raḥmatu Llāhi wa barakātuh, Dr. Odeh,

I write because your 2004 paper ("New criterion for lunar crescent visibility," *Experimental Astronomy* 18, 39–64) is the foundation of fajr's hilal classifier — and we have a specific collaboration question for you. **fajr** ([github.com/tawfeeqmartin/fajr](https://github.com/tawfeeqmartin/fajr)) is an open-source, MIT-licensed Islamic prayer-time and lunar-crescent-visibility library, built as a *sadaqah jāriya* for my daughters Nurjaan and Kauthar.

We have empirically tested your criterion at scale:

- **78 documented committee decisions** across Hijri 1441–1446 (Saudi Arabia, UAE, Qatar, Egypt, Pakistan, Morocco, Iran, India, Indonesia, Turkey)
- **240 location × event predictions** across 16 geographically-diverse test points spanning Tromsø 69°N → Cape Town 34°S, sea level → Lhasa 3,656m
- **Lunar and solar primitives independently validated against NASA JPL Horizons DE441** (max ΔRA 156″ lunar, 15″ solar)
- A **structural re-derivation**: your V parameter's polynomial and Yallop's q polynomial are identical except for a constant **2.53° offset in ARCV** — making the *ikhtilāf* band a uniform strip across all W rather than a region that varies with crescent width

The headline empirical finding: your criterion agrees with strict-sighting committees (Pakistan, Morocco, India, Iran, Indonesia) at **82–88%** and with witness-testimony committees (Saudi Arabia, UAE, Egypt, Turkey) at **16–20%** — exactly the *wasāʾil/ʿibādāt* split one would predict, made measurable.

I would be deeply grateful if you would consider reading our scholar-review brief, which has four specific questions about *fiqh*-relevant decisions in fajr's design plus one open prompt for your wider perspective:

[github.com/tawfeeqmartin/fajr/blob/master/docs/scholar-review-brief.md](https://github.com/tawfeeqmartin/fajr/blob/master/docs/scholar-review-brief.md)

One collaboration question I want to surface directly: **with ~22 years of post-2004 ICOP observation data now available, would it be worthwhile to re-fit your polynomial coefficients on the larger sample?** fajr would happily host that analysis if the observation data is shareable.

I deeply appreciate your time and look forward to your email at whatever depth you deem appropriate.

— Tawfeeq Martin
&nbsp;&nbsp;&nbsp;tawfeeqmartin@gmail.com
&nbsp;&nbsp;&nbsp;[github.com/tawfeeqmartin/fajr](https://github.com/tawfeeqmartin/fajr)

---

## Tactical notes (not for sending — these are for you)

### Where to find his email

- ICOP's general site: [icoproject.org](https://www.icoproject.org/)
- His listed contact via the project / institutional pages there
- Jordanian Astronomical Society also lists faculty contacts
- If neither is workable, an alternative is sending via the ICOP general inbox with `Attn: Dr. Odeh` in the subject — slower but gets through

### Timing

- **Avoid:** Ramadan (he's busiest with sighting season), Eid weeks, the days right before / after a Hijri month onset he's tracking
- **Good windows:** mid-month within a non-Ramadan/Eid Hijri month when ICOP isn't in active observation campaigns
- This conversation is happening in late Ramadan 1446 / early Shawwal — wait at least 2 weeks past Eid before sending

### What to expect

- Realistic response probability: **~40–60%** with this email (versus ~30% with a generic one) — the structural finding and specific collaboration ask are doing meaningful work
- Don't follow up before **3 weeks**. Two weeks reads anxious; one week reads desperate
- Most likely substantive response shape: a short reply addressing one or two of the brief's questions, possibly engaging the polynomial-refit ask, and a referral to a *faqīh* for the questions outside his astronomy lane (Q2 ihtiyāṭ, Q4 typology). That's a great outcome.

### If he engages on the polynomial refit

That becomes its own thread. Don't try to scope it in the same email. Just respond enthusiastically that you'd be glad to schedule whatever rhythm of work suits him — and let him drive the academic side. fajr's role would be to provide the implementation infrastructure (re-running the fit, generating validation against the new coefficients, regenerating the analysis); his role would be to provide the data and the methodological judgment.

### If he doesn't respond

After 4 weeks of silence: send a single short "checking in" follow-up referencing the original. After that, accept the silence and move to other scholars (Khalid Shaukat, ICOP general inbox, a *faqīh* for the *fiqh* questions). The brief is durable — it lives in the repo as the project's articulated self-assessment regardless of any specific scholar's response.

### Adjusting before sending

- Replace `[github.com/tawfeeqmartin/fajr/blob/master/docs/scholar-review-brief.md]` with the live URL once the repo is publicly available at that path (it should be — that doc is committed to master).
- Consider whether to send to his personal email vs an institutional one. Personal generally gets faster response; institutional has a lower bar to forward to colleagues if he's busy.
- Read the email aloud once before sending. Anything that sounds like an investor pitch, cut it.
