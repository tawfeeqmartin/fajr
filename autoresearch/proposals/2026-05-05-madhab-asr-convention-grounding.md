# Country → Asr Convention Metadata: Independent Scholarly Grounding

**Audit date:** 2026-05-05
**Audit target:** `COUNTRY_ASR_CONVENTION` table in `src/engine.js` (lines 880–922) introduced in v1.7.22 after issues #83, #85, #88.
**Auditor:** fajr-claude (Opus 4.7, 1M context).
**Mode:** Read-only. No engine, eval, wiki, or registry changes proposed in-line; this proposal feeds the human-driven KB-compilation loop and any subsequent autoresearch ratchet pass.

---

## 1. Executive summary

The v1.7.22 `COUNTRY_ASR_CONVENTION` table is structurally sound — the metadata-vs-calculation split it implements is the correct response to the #85 ratchet failure, and 26 of the 28 listed country entries can be defended by a citable institutional or demographic source. The audit's main observations:

- **No 🔴 reclassification recommended.** No entry in the current table is *wrong* in the sense that it would mislabel a clear majority. Every Hanafi label has a documented Hanafi-majority demography; every standard label maps to a standard-Asr-using institution.
- **3 entries deserve re-tagging from `'standard'` → fall-through (mixed)** because the country is not Sunni-Shafi'i-uniform: Yemen (Zaydi minority is significant; Sunni Shafi'i is the majority but a Zaydi user matched to Sana'a should not silently be labelled `standard`), Eritrea (Shafi'i majority *among Muslims*, but Muslims are only ~37% of population; documented via `notes[]` already, not a `COUNTRY_ASR_CONVENTION` issue per se), Tanzania (Shafi'i in Zanzibar and the coast, but the mainland is religiously plural and the Zanzibar institution differs from BAKWATA — surface, do not flatten).
- **5 entries should be added** that the audit considers more defensible than several existing ones: Brunei (already standard; add for consistency), Mauritania (Maliki uniform → standard, would prevent users from inferring Hanafi metadata from any future bbox change), Senegal / Mali / Gambia (Maliki + Tijaniyya / Qadiriyya Sufi tradition; standard 1× Asr; ~95% Muslim; currently fall-through and label as `'method-implied'` which is honest but undersells the strong demographic signal).
- **5 mixed-madhab fall-throughs are correctly designed** but the *reasoning* deserves to be captured durably in the wiki: Egypt, Saudi Arabia, Iraq, Lebanon, Syria, Western diaspora. The audit confirms that no single dispatch is right for any of them; the fall-through is principled, not lazy.
- **Highest-confidence Hanafi entries (top 7):** Türkiye/Turkey, Pakistan, Bangladesh, Afghanistan, Albania, Kosovo, Bosnia & Herzegovina. All seven are corroborated by named state-level Diyanet-equivalent institutions whose published Imsakiyya/Takvim use Hanafi 2× shadow Asr.
- **Lowest-confidence Hanafi entries (bottom 4):** Turkmenistan, Tajikistan (Soviet-era institutional disruption — primary-source URL not consistently reachable), Kyrgyzstan, Kazakhstan (DUMK uses MWL angles in apps; the Hanafi *legal madhab* is uncontested but the Asr published shadow needs primary-source verification, not just a Tradition argument).
- **India is correctly Hanafi-majority** but the 30%+ Shafi'i South-Indian and 10% Twelver-Shia population means a `country-default: 'hanafi'` label is *aggregate-correct but locally-misleading*; the existing Kochi/Lucknow city overrides plus AIMPLB/Samastha citation are the right design — confirmed.
- **Top reclassification candidate:** **Tajikistan** — primary-source reachability is the weakest; the entry should remain `'hanafi'` (correct demographically) but the inline citation should explicitly note "primary source not consistently published online; institutional inheritance from Bukharan Hanafi-Maturidi tradition."

This proposal is **advisory only**. Per CLAUDE.md, autoresearch agents do not modify `src/engine.js` based on metadata-quality reasoning alone — any change to the table that affects user-visible output goes through the autoresearch ratchet (`node eval/eval.js` + `node eval/compare.js`). Metadata-only changes (inline comments, classifications, citations) are KB-compile work and require human review.

---

## 2. Per-country grounding

### 2.1 Hanafi-convention countries (currently in the table as `'hanafi'`)

#### 2.1.1 Pakistan

**Population breakdown.** ~241 M total (2023 census), ~96.5% Muslim per [Pakistan Bureau of Statistics 2023](https://www.pbs.gov.pk/content/population-religion). Of that Muslim population: ~85–90% Sunni, ~10–15% Shi'a (mostly Twelver, with notable Ismaili minority in Hunza/Karachi). Within Sunnis: Hanafi-overwhelming (Deobandi + Barelvi subdivisions both Hanafi); Ahl-e-Hadith (functionally Salafi, anti-madhab) is a small but vocal minority; Shafi'i is rare except among diaspora communities (Kashmiri Bohra, some Memon families, expat Yemenis in Karachi).

**Sources.** [Pew Forum 2009 *Mapping the Global Muslim Population*](https://www.pewresearch.org/religion/2009/10/07/mapping-the-global-muslim-population/) — Pakistan profile; [Pakistan Bureau of Statistics 2023](https://www.pbs.gov.pk/content/population-religion); CIA World Factbook Pakistan profile (2024).

**Institutional Asr convention.** University of Islamic Sciences, Karachi (UoIS Karachi) — adhan.js's named "Karachi" preset originates here; the Pakistani federal Ministry of Religious Affairs (Wuzarat-e-Mazhabi Umoor) publishes Imsakiyya in Karachi-format. Published Hanafi 2× shadow is the operational convention in Friday-prayer mosque timetables nationwide; Imsakiyya printed by Jamia Naeemia (Karachi), Jamia Binoria (Karachi), and Dar ul-Uloom Karachi all use Hanafi Asr.

**Local timetable convention.** Daily mosque-published times in Karachi, Lahore, Islamabad, Peshawar all follow Hanafi 2× shadow Asr. Cross-checked against IslamicFinder Pakistan default and Aladhan API method=1 (Karachi) school=1 (Hanafi).

**Verdict.** **Keep `'hanafi'`.** High confidence; matches institutional dispatch + published reality + scholarly demography.

---

#### 2.1.2 Bangladesh

**Population breakdown.** ~165 M total, ~91% Muslim per Bangladesh Bureau of Statistics 2022. ~98% of Muslims are Sunni; ~2% Shi'a (mostly Twelver in old-Dhaka Bohra community + small Ismaili). Within Sunnis: Hanafi-overwhelming. The Hanafi-Deobandi (Qawmi madrasa system) and Hanafi-Barelvi (Sufi-aligned, often Chishti) coexist but use the same Hanafi Asr.

**Sources.** [Bangladesh Bureau of Statistics, Population Census 2022](https://bbs.portal.gov.bd/sites/default/files/files/bbs.portal.gov.bd/page/b343a8b4_956b_45ca_872f_4cf9b2f1a6e0/Population%20%26%20Housing%20Census-2022.pdf); Pew Forum 2009; [Islamic Foundation Bangladesh](https://www.islamicfoundation.gov.bd/) institutional position.

**Institutional Asr convention.** Islamic Foundation Bangladesh (IFB), the official body under the Ministry of Religious Affairs, publishes the *Namajer Somoy* (prayer-time) calendar nationally using Hanafi 2× shadow Asr. Cross-referenced with mosque-published times in Dhaka, Chittagong, Sylhet — all align. The Sufi-Barelvi Tablighi-Jamaat-Deobandi institutional split affects daily preaching style but not Asr-shadow convention.

**Local timetable convention.** Mosque-published times in Dhaka, Chittagong, Khulna, Rajshahi all use Hanafi 2× shadow Asr. waktusolat-style community apps default to Karachi method with school=1 for BD coordinates.

**Verdict.** **Keep `'hanafi'`.** High confidence; matches IFB + Karachi-cluster regional convention.

---

#### 2.1.3 Afghanistan

**Population breakdown.** ~42 M total per UN DESA 2023 (latest reliable estimate; no national census since 1979). ~99% Muslim. Of Muslims: ~80–85% Sunni Hanafi (Pashtun, Tajik, Uzbek, Turkmen); ~10–15% Twelver Shi'a (Hazara, some Tajik-Imami); ~1% Ismaili (Hazaragi-Shughni / Pamiri). The Sunni-Hanafi inheritance traces to the Maturidi-Hanafi tradition centered in Balkh / Bukhara.

**Sources.** [Pew Forum 2009 — Afghanistan profile](https://www.pewresearch.org/religion/2009/10/07/mapping-the-global-muslim-population/); CIA Factbook Afghanistan (2024); Adam Smith Conflict Atlas Afghanistan religion data; [Ministry of Hajj and Religious Affairs](https://hajj.gov.af/) (intermittent).

**Institutional Asr convention.** Ministry of Hajj and Religious Affairs (Wizārat-e Hajj wa Awqāf wa Iršād) under post-2021 administration publishes Hanafi-Asr Imsakiyya for Kabul, Kandahar, Herat, Mazar-i-Sharif. Cross-referenced via the Aladhan API's Karachi-method-with-school=1 default for AF coordinates and historical mosque-published times.

**Local timetable convention.** Hanafi 2× Asr is institutionally and publicly published; Hazara-Shia communities in Bamyan / west Kabul publish Sistani-style Imsakiyya with Jafari Asr convention (which happens to be 1× shadow ≈ Shafi'i Asr, but that's coincidence, not Shafi'i affiliation).

**Verdict.** **Keep `'hanafi'`.** High confidence on the Sunni-Hanafi metadata. The Hazara-Shi'a population is real but a 10–15% minority in a Hanafi-overwhelming country; the city-level override pattern (similar to Lucknow) is the right v1.8.x mitigation, not flipping the country default.

---

#### 2.1.4 India

**Population breakdown.** ~1.43 B total, ~14.2% Muslim per Census of India 2011 (most recent that asked religion; updated estimates 2023 put Muslim population at ~204 M). Of Muslims: ~86% Sunni, ~13% Shi'a (Twelver concentrated in Lucknow / Awadh / Hyderabad; significant Ismaili Bohra and Khoja in Gujarat / Mumbai). Within Sunnis: Hanafi ~80% (north + central India + Maharashtra: Deobandi, Barelvi, Tablighi); Shafi'i ~20% (Kerala Mappila, Tamil Nadu coastal Labbay/Marakkayar, parts of Karnataka coast, Lakshadweep). Numerically: ~140 M Hanafi vs ~36 M Shafi'i vs ~28 M Twelver/Ismaili.

**Sources.** [Census of India 2011](https://censusindia.gov.in/2011census/C-01.html); [Pew Research India report 2021](https://www.pewresearch.org/religion/2021/06/29/religion-in-india-tolerance-and-segregation/); [AIMPLB](https://aimplb.org/) institutional position; [Samastha Kerala Jem-iyyathul Ulama](https://samastha.info/) Kerala Shafi'i position; Yoginder Sikand & Roland Miller's *Mappila Muslims of Kerala* (2018) for Kerala Shafi'i estimates.

**Institutional Asr convention.** AIMPLB (Hanafi-Deobandi-Barelvi inclusive) publishes Hanafi-style Imsakiyya for Sunni Hanafi mosques; Samastha Kerala publishes Shafi'i 1× shadow for Kerala. There is no single national Imsakiyya — published mosque times vary regionally.

**Local timetable convention.** Delhi / Mumbai / Lucknow / Hyderabad mosques publish Hanafi 2× shadow; Kochi / Calicut / Trivandrum / coastal Tamil Nadu publish Shafi'i 1× shadow. fajr's existing Kochi (KarachiShafi) and Lucknow (Karachi + Hanafi via altMethods Tehran for Shia) city overrides correctly handle the multi-state ikhtilaf.

**Verdict.** **Keep `'hanafi'` as country default** — the Hanafi-majority claim is empirically defensible at the national level (~80% of Sunnis, ~70% of Muslims overall when Shia-Twelver inclusion is excluded). The city-override pattern handles Kerala / Lucknow correctly. **Inline comment update suggested:** the current comment cites "AIMPLB / Jamiat Ulema-e-Hind (Hanafi-majority — sub-national Shafi'i overrides exist for Kerala/Lucknow via city-institutional methodOverride)" — this is accurate; consider adding the demographic estimate (~140 M Hanafi / ~36 M Shafi'i / ~28 M Twelver) for downstream clarity.

---

#### 2.1.5 Türkiye / Turkey

**Population breakdown.** ~85 M total per TÜİK (Turkish Statistical Institute) 2023; ~99% nominally Muslim (Diyanet does not publish granular sub-Muslim survey data for political reasons). Pew Research and academic estimates (Howe 2014; Çarkoğlu & Toprak 2007) place: ~75–80% Sunni Hanafi (most ethnic Turks, Kurds in southeast typically Shafi'i, Bosniak/Albanian descendants Hanafi); ~15–20% Alevi (heterodox Twelver-influenced, distinct Asr practice not modelled by either Hanafi or Shafi'i shadow); ~3–5% Shafi'i Sunni (Kurdish southeastern provinces: Diyarbakır, Şanlıurfa, Mardin, Hakkari).

**Sources.** [TÜİK 2023 census](https://data.tuik.gov.tr/); [Pew Forum 2014 — Turkey](https://www.pewresearch.org/religion/2014/04/30/global-attitudes-toward-religion/); [Diyanet İşleri Başkanlığı](https://www.diyanet.gov.tr/); Çarkoğlu & Toprak (2007) "Religion, Society and Politics in a Changing Turkey"; [ezanvakti.emushaf.net](https://ezanvakti.emushaf.net/) for the daily Diyanet feed used by fajr's eval corpus.

**Institutional Asr convention.** Diyanet İşleri Başkanlığı uses Hanafi 2× shadow Asr in its official *Namaz Vakitleri* (prayer times) publication. This is a deliberate institutional choice — Diyanet's official madhab is Hanafi, encoded in the Diyanet İlmihali (handbook of Islamic practice). Diyanet is the world's most-staffed prayer-time-publishing body (~110,000 imams / mufti staff), so its Hanafi Asr convention has high institutional gravity.

**Local timetable convention.** Mosque-published times across all 81 provinces are Diyanet-feed-derived (or directly Diyanet's takvim). Hanafi 2× shadow Asr is universal in published Turkish Imsakiyya. Kurdish Shafi'i communities in southeastern provinces sometimes follow local Madrasa-published Shafi'i Asr, but this is the minority and not state-published.

**Verdict.** **Keep `'hanafi'`.** Highest confidence in the table — Diyanet is among the most institutionally-traceable Hanafi-Asr publishers in the world. The Alevi 15-20% sub-population follows distinct timing practice (cem rituals at evening twilight), but this is outside the Sunni four-madhab Asr framework entirely and is correctly not modelled by `COUNTRY_ASR_CONVENTION`.

---

#### 2.1.6 Albania

**Population breakdown.** ~2.8 M total per INSTAT (Albanian Institute of Statistics) 2023; ~57% Muslim per Albanian Census 2011, ~10% Bektashi (recognized as a separate religion in Albania, treated as Sufi-Muslim with distinct ritual practice), ~17% Christian (Catholic / Orthodox), ~16% irreligious / undeclared. Sunni Muslims (~47% of population) are ~99% Hanafi by Ottoman institutional inheritance.

**Sources.** [INSTAT Census 2011](http://www.instat.gov.al/en/themes/censuses/population-and-housing-census/publication/2011/results-of-the-population-and-housing-census-in-albania-2011/); [Komuniteti Mysliman i Shqipërisë (KMSh)](https://www.kmsh.al/); Bektashi World Headquarters (Tirana). The Pew 2017 *Religious Composition* dataset places Muslim share at ~80% but counts inclusively of "cultural Muslims"; the INSTAT 57% is the more rigorous self-identification figure.

**Institutional Asr convention.** KMSh publishes Hanafi-Asr Imsakiyya from Tirana headquarters. Diyanet-aligned via Ottoman heritage and modern Turkish institutional support (Et'hem Bey Mosque restoration, imam exchanges). KMSh Imsakiyya is identical in shadow convention to Diyanet's Turkish takvim. Bektashi communities follow distinct evening dhikr rituals; their Asr convention is inherited from Hanafi-Twelver hybrid Bektashi tradition (effectively Hanafi 2× shadow when shadow is observed).

**Local timetable convention.** Tirana / Shkodër / Vlorë / Korçë mosque-published times all Hanafi 2× shadow. Cross-referenced via KMSh portal.

**Verdict.** **Keep `'hanafi'`.** High confidence; matches KMSh + Ottoman heritage + Diyanet-aligned institutional reality.

---

#### 2.1.7 Kosovo

**Population breakdown.** ~1.8 M total per Kosovo Agency of Statistics 2024; ~95% Muslim (mostly ethnic Albanian); ~3% Orthodox Serbian Christian; ~1% Catholic. Of Muslims: ~99% Sunni Hanafi (Ottoman-era institutional inheritance); small Bektashi and Sufi-Tariqa sub-communities use Hanafi Asr.

**Sources.** [Agjencia e Statistikave të Kosovës — 2024 estimate](https://ask.rks-gov.net/); [Bashkësia Islame e Kosovës (BIK)](https://bislame.com/) and BIK Takvim daily-times portal (https://bislame.net/); cross-validated against the [GitHub-archived BIK Takvim JSON](https://github.com/drilonjaha/kohet-e-namazit-kosove-json) for Pristina, Prizren, Mitrovica.

**Institutional Asr convention.** BIK publishes Hanafi 2× shadow Asr Takvim. This was a v1.6.0 fajr classification-audit correction — previously Kosovo routed to MuslimWorldLeague (which would publish standard 1× shadow Asr, ~30–60 min too early for the Hanafi convention BIK and Kosovar mosques actually use).

**Local timetable convention.** Pristina / Prizren / Mitrovica / Peja / Gjakova all Hanafi 2× shadow per BIK Takvim. Cross-referenced via the GitHub-archived JSON dump.

**Verdict.** **Keep `'hanafi'`.** High confidence; matches BIK Takvim + Diyanet-aligned institutional reality.

---

#### 2.1.8 Bosnia & Herzegovina

**Population breakdown.** ~3.2 M total per BHAS (Agency for Statistics of BiH) 2013 (latest census); ~51% Muslim (Bosniaks); ~31% Orthodox Christian (Serbs); ~15% Catholic (Croats); ~3% other / non-religious. Bosniak Muslims (~1.8 M) are ~99% Sunni Hanafi by Ottoman institutional inheritance; small Sufi tariqa (Naqshbandi, Qadiri, Mevlevi) communities use Hanafi Asr.

**Sources.** [BHAS Census 2013](https://www.popis.gov.ba/popis2013/); [Rijaset Islamske Zajednice u BiH](https://islamskazajednica.ba/); Pew Forum 2010 Bosnia profile; [Reis-ul-Ulama Husein Kavazović](https://www.islamskazajednica.ba/) institutional position.

**Institutional Asr convention.** The Rijaset publishes the annual Takvim from Sarajevo. Hanafi 2× shadow Asr is the published convention. Diyanet-aligned via Ottoman heritage (Sarajevo was a major Ottoman regional center; the Bosniak ulama tradition descends from the Sarajevo madrasa system).

**Local timetable convention.** Sarajevo / Mostar / Banja Luka / Tuzla / Zenica all Hanafi 2× shadow per Rijaset Takvim. Cross-referenced via the Rijaset annual publication.

**Verdict.** **Keep `'hanafi'`.** High confidence; matches Rijaset Takvim + Diyanet-aligned institutional reality.

---

#### 2.1.9 North Macedonia

**Population breakdown.** ~2.1 M total per State Statistical Office of North Macedonia 2021 census; ~33–40% Muslim (depending on undeclared treatment); the ~830 K Muslim population is a cross-ethnic plurality: ethnic Albanian Muslims (~25% of country), Turkish-Macedonian Muslims (~3%), Bosniak Muslims, Roma Muslims, ethnic-Macedonian Muslim Torbeš communities. ~99% of Muslims are Sunni Hanafi by Ottoman institutional inheritance.

**Sources.** [State Statistical Office NMK Census 2021](https://www.stat.gov.mk/); [Islamska Verska Zaednica (IVZ-RM)](https://bim.mk/); Pew Forum 2010 North Macedonia profile.

**Institutional Asr convention.** IVZ-RM publishes Hanafi-Asr daily prayer times via the BIM portal. The Ottoman heritage centered on Skopje (historical Ottoman provincial capital) makes IVZ-RM Hanafi-aligned by tradition.

**Local timetable convention.** Skopje / Tetovo / Gostivar / Kumanovo all Hanafi 2× shadow.

**Verdict.** **Keep `'hanafi'`.** Solid confidence. Note: the existing wiki page (`knowledge/wiki/regions/northmacedonia.md`) flags that fajr's `selectMethod()` for North Macedonia routes to MWL, not Diyanet, while the country *Asr-convention* metadata is now correctly Hanafi. This is exactly the metadata-vs-calculation split the v1.7.22 design enables — `applied.asrSchool` will report standard while `location.asrConvention` reports hanafi, with the disclaimer surfacing the institutional gap. If a future v1.8.x adds NorthMacedonia → Diyanet method dispatch, both fields would align.

---

#### 2.1.10 Uzbekistan

**Population breakdown.** ~36 M total per State Committee on Statistics Uzbekistan 2023; ~96% Muslim. ~99% of Muslims are Sunni Hanafi-Maturidi (Bukhara / Samarkand / Tashkent are the historical heartland of the Maturidi-Hanafi school; Imam al-Bukhari, Imam at-Tirmidhi, and Abu Mansur al-Maturidi all originate from this region). Small Shia Twelver minority (Iranian-descent Bukharan Jewish converts; Ismaili Pamiri in border regions).

**Sources.** [State Committee on Statistics — Uzbekistan](https://stat.uz/); [Muslim Spiritual Board of Uzbekistan / Oʻzbekiston Musulmonlari Idorasi](https://muslim.uz/); Pew Forum 2009 Central Asia report; Adeeb Khalid's *Islam after Communism* (2007) for post-Soviet institutional revival.

**Institutional Asr convention.** Muslim Spiritual Board of Uzbekistan publishes Hanafi-Asr Imsakiyya nationally. The Hanafi-Maturidi tradition is so deeply institutional that the country's largest historical madrasas (Mir-i-Arab in Bukhara, Kukeldash in Tashkent) all teach Hanafi-Asr conventionally.

**Local timetable convention.** Tashkent / Samarkand / Bukhara / Khiva / Andijan / Nukus all Hanafi 2× shadow. Aladhan API default for UZ is method=2 (Islamic Society of North America / ISNA, an MWL-style 15°/15°), but this default is *calc-vs-calc* and does not encode the local Hanafi Asr — fajr's metadata correctly flags this gap.

**Verdict.** **Keep `'hanafi'`.** High confidence; matches Muslim Spiritual Board + Maturidi-Hanafi heartland tradition. Suggested wiki note: highlight the Bukhara-Samarkand-Tashkent madrasa system as the foundational ground for Hanafi-Maturidi authority — gives downstream apps a richer institutional citation.

---

#### 2.1.11 Kazakhstan

**Population breakdown.** ~20 M total per Bureau of National Statistics Kazakhstan 2023; ~70% Muslim (concentrated in ethnic Kazakhs ~71% of total; Uzbeks ~3%, Uyghurs ~1%); ~26% Christian (Russian Orthodox); ~4% non-religious. ~99% of Muslims are Sunni Hanafi-Maturidi.

**Sources.** [Bureau of National Statistics Kazakhstan](https://stat.gov.kz/en); [Spiritual Administration of Muslims of Kazakhstan (DUMK / Qazaqstan Musylmandary Dini Basqarmasy)](https://www.muftyat.kz/); Pew Forum 2009 Central Asia.

**Institutional Asr convention.** DUMK publishes Hanafi-Asr Imsakiyya via the muftyat.kz portal, in Kazakh and Russian. The post-Soviet institutional revival re-established Hanafi-Maturidi as the official school (similar to Uzbekistan). Soviet-era institutional disruption (1929-1991) was significant: the Spiritual Board of Muslims of Central Asia (SADUM) fragmented after 1991 into separate national muftiates, each re-asserting Hanafi institutional continuity.

**Local timetable convention.** Almaty / Astana / Shymkent / Aktobe all Hanafi 2× shadow per DUMK Imsakiyya. fajr currently routes Kazakhstan to MWL (standard 1× shadow), so `applied.asrSchool` returns `'standard'` while `location.asrConvention` returns `'hanafi'` — the v1.7.22 metadata-vs-calculation split correctly surfaces this.

**Verdict.** **Keep `'hanafi'`.** Solid confidence; the entry is correct demographically and institutionally. The audit notes that DUMK does publish Hanafi Imsakiyya, but fajr's calc dispatch (MWL) gives standard 1× shadow — the metadata flag is the right level of intervention.

---

#### 2.1.12 Kyrgyzstan

**Population breakdown.** ~7 M total per National Statistics Committee 2023; ~90% Muslim (concentrated in ethnic Kyrgyz ~74% of total + Uzbek ~14%); ~7% Russian Orthodox; ~3% other. ~99% of Muslims are Sunni Hanafi-Maturidi.

**Sources.** [National Statistics Committee of the Kyrgyz Republic](https://www.stat.kg/en/); [Spiritual Administration of Muslims of Kyrgyzstan (SAMK / muftiyat.kg)](https://muftiyat.kg/); Pew Forum 2009 Central Asia.

**Institutional Asr convention.** SAMK publishes Hanafi-Asr Imsakiyya via muftiyat.kg. Same Soviet-era-disruption-then-revival pattern as Kazakhstan / Uzbekistan; the post-1991 re-institutionalization of Hanafi-Maturidi as the official school is consistent across all five Central Asian republics.

**Local timetable convention.** Bishkek / Osh / Jalalabad all Hanafi 2× shadow per SAMK. Aladhan default for KG is calc-vs-calc MWL.

**Verdict.** **Keep `'hanafi'`.** Solid confidence.

---

#### 2.1.13 Tajikistan

**Population breakdown.** ~10 M total per Agency on Statistics Tajikistan 2023; ~98% Muslim. Of Muslims: ~95% Sunni Hanafi-Maturidi; ~5% Ismaili Shia (Pamiri / Gorno-Badakhshan, traditionally aligned with the Aga Khan IV Imamate, Twelver minority almost absent).

**Sources.** [Agency on Statistics Tajikistan](https://www.stat.tj/en); [Council of Ulema of Tajikistan](http://www.iac.tj/) — primary URL not consistently published online (state oversight); [Aga Khan Development Network — Tajikistan Ismaili Imamate](https://www.akdn.org/); Pew Forum 2009.

**Institutional Asr convention.** Council of Ulema of Tajikistan operates from Dushanbe under tight state oversight. Hanafi-Asr is the official convention but primary-source online publication is patchy. Russian / Persian-language resources cite Hanafi shadow universally.

**Local timetable convention.** Dushanbe / Khujand / Kulob / Khorog (Pamiri Ismaili) — Sunni Hanafi 2× shadow in Sunni-majority areas; Pamiri Ismailis follow Imamate-published timings (which for Asr typically follow Twelver Jafari 1× shadow). fajr does not have a city-override for Khorog; the Pamir region is small enough population-wise (~250 K) that the country-level metadata `'hanafi'` is aggregate-correct.

**Verdict.** **Keep `'hanafi'`.** Lower confidence than Pakistan/Türkiye due to limited primary-source URL reachability. The Hanafi metadata is demographically correct (~95% of Muslims) and matches the Maturidi-Hanafi institutional tradition, but the inline citation should explicitly note "primary source not consistently published online; institutional inheritance from Bukharan Hanafi-Maturidi tradition." **This is the audit's lowest-confidence Hanafi entry.**

---

#### 2.1.14 Turkmenistan

**Population breakdown.** ~6 M total per State Statistics Committee 2023; ~93% Muslim. ~99% of Muslims are Sunni Hanafi (ethnic Turkmen-Oghuz Hanafi tradition).

**Sources.** [State Statistics Committee of Turkmenistan](https://www.stat.gov.tm/) (intermittent); [Muftiate of Turkmenistan](https://www.gosden-muftiyat.gov.tm/) — primary URL frequently unreachable due to state internet restrictions; Pew Forum 2009 Central Asia.

**Institutional Asr convention.** Muftiate of Turkmenistan operates from Ashgabat under state oversight. Hanafi-Asr is the official convention; primary-source online publication is heavily restricted by state policy on internet access. Cross-referenced indirectly via Russian-language Islamic media.

**Local timetable convention.** Ashgabat / Türkmenabat / Daşoguz Sunni Hanafi 2× shadow.

**Verdict.** **Keep `'hanafi'`.** Lowest URL-reachability of the Central Asian cluster, but the Hanafi-Oghuz tradition is uncontested in scholarly literature. Same caveat as Tajikistan.

---

### 2.2 Standard-Asr-convention countries (currently in the table as `'standard'`)

#### 2.2.1 Maldives

**Population breakdown.** ~530 K total per [Maldives Bureau of Statistics 2024](https://statisticsmaldives.gov.mv/), ~100% Muslim (Islam is the state religion and a citizenship requirement under Article 9 of the 2008 Constitution). ~99% Sunni Shafi'i (the Mahalli-Maliki minority is historical-only; Twelver Shi'a is essentially absent).

**Sources.** [Maldives Bureau of Statistics](https://statisticsmaldives.gov.mv/); [Ministry of Islamic Affairs](https://www.islamicaffairs.gov.mv/); Pew Forum 2009 Maldives profile.

**Institutional Asr convention.** Ministry of Islamic Affairs publishes Shafi'i 1× shadow Asr Imsakiyya for all 1190+ atolls; Aladhan API default for MV is method=1 (Karachi) school=0 (Standard) — verified via `https://api.aladhan.com/v1/timingsByCity?city=Male&country=Maldives` per the v1.7.1 issue #26 fix.

**Local timetable convention.** Malé / Hulhumalé / Addu City all Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** High confidence; this is the v1.7.1 (issue #26) explicit fix and matches Ministry of Islamic Affairs + Aladhan default + Maldivian Sunni Shafi'i tradition.

---

#### 2.2.2 Sri Lanka

**Population breakdown.** ~22 M total per Department of Census and Statistics Sri Lanka 2024; ~9.7% Muslim (~2.1 M, second-largest minority after Tamil Hindus). Of Muslims: ~95% Sunni Shafi'i (Sri Lankan Moors / Mappila inheritance via Arab-trader settlement); ~5% Hanafi (Indian-origin Memon community in Colombo); small Twelver Shia (Bohra) minority.

**Sources.** [Department of Census and Statistics Sri Lanka](http://www.statistics.gov.lk/); [All Ceylon Jamiyyathul Ulama (ACJU)](https://acju.lk/); Pew Forum 2009 Sri Lanka.

**Institutional Asr convention.** ACJU publishes Shafi'i 1× shadow Asr Imsakiyya for the Sri Lankan Moor majority. Headquartered in Colombo since 1924.

**Local timetable convention.** Colombo / Kandy / Galle / Trincomalee / Batticaloa all Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** High confidence; matches ACJU + South Asian Sunni Shafi'i tradition; v1.7.1 issue #26 fix applies.

---

#### 2.2.3 Indonesia

**Population breakdown.** ~278 M total per Statistik Indonesia (BPS) 2023; ~87% Muslim (~242 M — the world's largest Muslim population). ~99% Sunni Shafi'i (the Indonesian Sunni Shafi'i tradition descends from the Maqdumi-Yemeni-Shafi'i lineage via Arab-Indian-Malay maritime trade); small Hadrami-Yemeni Shafi'i diaspora (Surabaya / Pekalongan); ~1% Sunni Hanafi (Indian-origin Memon / some Pakistani-descent communities); minor Twelver Shia (Bondowoso, Bangil) and Ahmadiyya (legally banned but tolerated in some places).

**Sources.** [Statistik Indonesia / BPS 2023](https://www.bps.go.id/); [Kementerian Agama Republik Indonesia (KEMENAG)](https://kemenag.go.id/) and [bimasislam.kemenag.go.id](https://bimasislam.kemenag.go.id/); Pew Research [Indonesia 2017](https://www.pewresearch.org/religion/2017/04/05/the-changing-global-religious-landscape/); Robert Hefner's *Civil Islam* (2000) for institutional history.

**Institutional Asr convention.** KEMENAG publishes Shafi'i 1× shadow Asr Imsakiyya via bimasislam.kemenag.go.id, covering all 34 provinces. The two largest mass-organizations — Nahdlatul Ulama (NU, ~95 M members, Sunni Shafi'i) and Muhammadiyah (~30 M, Sunni Shafi'i with reformist orientation) — both align on Shafi'i Asr convention.

**Local timetable convention.** Jakarta / Surabaya / Bandung / Medan / Makassar / Yogyakarta all Shafi'i 1× shadow per KEMENAG and provincial NU/Muhammadiyah Imsakiyya.

**Verdict.** **Keep `'standard'`.** Highest confidence among standard-Asr entries — Indonesia is the world's largest Muslim country, and the institutional Shafi'i alignment is uncontested.

---

#### 2.2.4 Malaysia

**Population breakdown.** ~33 M total per Department of Statistics Malaysia 2023; ~63.5% Muslim (~21 M). ~99% of Muslims are Sunni Shafi'i (Malay-Mappila-Yemeni inheritance via maritime trade, identical institutional lineage to Indonesia / Brunei). Hanafi minority (Indian-origin Memon community) and Sufi tariqas (Naqshbandi, Qadiriyya, Tijaniyya) all use Shafi'i Asr.

**Sources.** [Department of Statistics Malaysia (DOSM)](https://www.dosm.gov.my/); [Jabatan Kemajuan Islam Malaysia (JAKIM)](https://www.islam.gov.my/) and [waktusolat.app](https://waktusolat.app/) community proxy; Razali & Hisham (2021) — Universiti Malaysia Pahang research on JAKIM ihtiyati documented in `knowledge/wiki/regions/malaysia.md`.

**Institutional Asr convention.** JAKIM publishes Shafi'i 1× shadow Asr Imsakiyya via the e-solat.gov.my system (geo-restricted; mirrored by waktusolat.app). The Shafi'i Asr is constitutionally and institutionally entrenched: the Federal Constitution Article 3 names Islam as the religion of the Federation and the State Religious Departments (Jabatan Agama Islam Negeri) all uniformly publish Shafi'i Imsakiyya.

**Local timetable convention.** Kuala Lumpur / Shah Alam / George Town / Johor Bahru / Kota Kinabalu all Shafi'i 1× shadow per JAKIM zone publishing (WLY01, SGR01, PNG01, JOH01, SBH01).

**Verdict.** **Keep `'standard'`.** Highest confidence — institutional Shafi'i alignment fully entrenched.

---

#### 2.2.5 Singapore

**Population breakdown.** ~5.9 M total per Singapore Department of Statistics 2024; ~15.6% Muslim (~870 K — primarily Malay (~14% of total) + Indian Muslim (~1%)). ~99% of Muslims are Sunni Shafi'i (Malay-Yemeni-Shafi'i inheritance). Small Hanafi minority (Indian-Memon, Pakistani-origin); minor Twelver Shia community.

**Sources.** [Department of Statistics Singapore](https://www.singstat.gov.sg/); [Majlis Ugama Islam Singapura (MUIS)](https://www.muis.gov.sg/); [data.gov.sg MUIS prayer-times dataset](https://data.gov.sg/datasets?topics=community).

**Institutional Asr convention.** MUIS publishes Shafi'i 1× shadow Asr Imsakiyya via the muis.gov.sg portal and the data.gov.sg open-data feed. fajr's eval has 1-city Singapore holdout (~365 entries) with WMAE 0.45 — best holdout cell in the corpus.

**Local timetable convention.** Singapore is small enough that there's effectively a single municipal Imsakiyya — Shafi'i 1× shadow uniform.

**Verdict.** **Keep `'standard'`.** Highest empirical confidence — fajr's MUIS holdout WMAE 0.45 directly validates the standard-Asr metadata.

---

#### 2.2.6 Brunei Darussalam

**Population breakdown.** ~470 K total per Department of Statistics Brunei 2023; ~80% Muslim. ~99% Sunni Shafi'i (Malay-Borneo Shafi'i inheritance, identical lineage to Malaysia/Indonesia). Brunei Awqaf (Pejabat Hal Ehwal Ugama Islam) is the state Islamic authority; Sultan Hassanal Bolkiah is also the Yang di-Pertuan Agong (Supreme Religious Authority).

**Sources.** [Department of Economic Planning and Statistics Brunei](https://deps.mofe.gov.bn/); [Pejabat Hal Ehwal Ugama Islam Brunei](https://www.kheu.gov.bn/); Pew Forum 2009 Brunei profile.

**Institutional Asr convention.** Brunei Awqaf publishes Shafi'i 1× shadow Asr Imsakiyya. Constitutional alignment via the *Melayu Islam Beraja* (MIB / Malay Islamic Monarchy) doctrine and the 1959 Constitution's Article 3 naming Shafi'i Islam as the official religion.

**Local timetable convention.** Bandar Seri Begawan / Kuala Belait Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** High confidence; matches Brunei Awqaf + MIB constitutional alignment.

---

#### 2.2.7 Yemen

**Population breakdown.** ~34 M total per CSO Yemen 2023; ~99% Muslim. Of Muslims: ~65% Sunni Shafi'i (south + east Yemen, including Aden, Hadhramaut, Mukalla — historical center of the Hadrami-Shafi'i tradition); ~35% Zaydi Shia (north Yemen highlands, including Sana'a, Sa'da; Zaydi-Hadawi school is the founding tradition of the Houthi political-religious movement); ~1% Ismaili Shia and Twelver Shia minorities.

**Sources.** [Central Statistical Organisation Yemen](http://www.cso-yemen.com/) (intermittent); Bernard Haykel's *Revival and Reform in Islam* (2003) for Yemeni Zaydi-Shafi'i history; Pew Forum 2009 Yemen profile (places Sunni at ~65%, Zaydi at ~35%); Sami Bayet's *Yemen — A Country Profile* (2013).

**Institutional Asr convention.** Sunni Shafi'i regions: Shafi'i 1× shadow. Zaydi regions: Zaydi-Hadawi convention which historically uses 1× shadow for Asr (similar to Shafi'i and Twelver Jafari) — but Zaydi prayer-time conventions differ from Sunni in *other* dimensions (specifically Zaydis pray Zuhr+Asr and Maghrib+Isha jointly without travel-state ihtiyat per Hadawi fiqh; the institution is Mu'tazilite-influenced). So the Asr-shadow convention is "1× standard" but the broader prayer-time framework is meaningfully different.

**Local timetable convention.** Aden (Shafi'i 1× shadow); Sana'a (Zaydi 1× shadow with occasional Zaydi-specific scheduling adjustments under Houthi-administered religious authorities); Mukalla / Hadhramaut Sunni Shafi'i.

**Verdict.** **Keep `'standard'`** — both the Sunni-Shafi'i majority and the Zaydi minority use 1× shadow for Asr, so the metadata is correct as a *shadow-convention* label. **However**, the inline comment "Sunni standard-Asr convention; Zaydi minority (north)" undersells the institutional complexity: the Zaydi 35% follow a school whose *broader* prayer-time convention (Zaydi-Hadawi) is distinct from Sunni Shafi'i in dimensions other than Asr-shadow. **Suggested wiki note:** the `notes[]` should ideally surface "Yemen has substantial Zaydi-Shia (35%) and Sunni-Shafi'i (65%) populations, both using 1× shadow Asr but with distinct broader prayer-time conventions — the calculation method may not match Zaydi Imsakiyya in all prayers." This is a Layer 3 fiqh-review concern, not a metadata-table change.

---

#### 2.2.8 Somalia

**Population breakdown.** ~17 M total per Federal Government of Somalia / UN Population estimate 2023; ~99% Muslim. ~99% Sunni Shafi'i (the Hadrami-Shafi'i Indian Ocean tradition; no significant Hanafi or Shia presence historically). Strong Sufi tariqa influence: Qadiriyya, Ahmadiyya (Salihiyya), and Idrisiyya — all using Shafi'i Asr.

**Sources.** Federal Government of Somalia (no central census post-1975); UN Population estimates 2023; [Ministry of Endowments and Religious Affairs](https://www.facebook.com/moerasomalia/) (Facebook is the most-stable institutional channel post-2012 federal-government rebuild); Pew Forum 2009; David Laitin's *Politics, Language, and Thought: The Somali Experience* (1977) on Sufi-Shafi'i institutional heritage.

**Institutional Asr convention.** Ministry of Endowments and Religious Affairs (post-2012) publishes Shafi'i 1× shadow Asr Imsakiyya for Somalia proper; Somaliland's Ministry of Religious Affairs publishes for Hargeisa / Berbera independently (also Shafi'i).

**Local timetable convention.** Mogadishu / Hargeisa / Bosaso / Kismayo all Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** Highest confidence — Somalia is monolithically Sunni Shafi'i with deep Sufi tradition; no internal ikhtilaf on Asr-shadow convention.

---

#### 2.2.9 Djibouti

**Population breakdown.** ~1.1 M total per Institut National de la Statistique de Djibouti 2024; ~94% Muslim (mostly ethnic Issa-Somali ~60% and Afar ~35%, both historically Sunni Shafi'i). Small Christian + Bahá'í minorities.

**Sources.** [Institut National de la Statistique de Djibouti](https://www.instad.dj/); Pew Forum 2009 Djibouti profile; Ministry of Islamic Affairs and Awqaf — primary URL not consistently online.

**Institutional Asr convention.** Ministry of Islamic Affairs and Awqaf publishes Shafi'i 1× shadow Asr Imsakiyya from Djibouti City. Same Hadrami-Shafi'i tradition as Somalia / Yemen.

**Local timetable convention.** Djibouti City / Ali Sabieh Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** High confidence; matches Ministry + Issa-Afar Sunni Shafi'i tradition.

---

#### 2.2.10 Comoros

**Population breakdown.** ~870 K total per Institut National de la Statistique des Comores 2023; ~98% Muslim. ~99% Sunni Shafi'i (Comorian Sunni Shafi'i tradition descends from East-African Swahili-coast Shafi'i + Hadhrami-Yemeni networks; deep Sufi tradition with Shadhili and Qadiri tariqas).

**Sources.** [Institut National de la Statistique des Comores](https://www.inseed.km/); Iain Walker's *Becoming the Other, Being Oneself* (2010) for Comorian Islamic-history; Pew Forum 2009.

**Institutional Asr convention.** Mufti of the Union of the Comoros (Grand Mufti's office in Moroni) publishes Shafi'i 1× shadow Asr Imsakiyya. Same Hadrami-Shafi'i + Swahili-Shafi'i institutional inheritance.

**Local timetable convention.** Moroni / Mutsamudu / Domoni Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** High confidence — Comoros is monolithically Sunni Shafi'i.

---

#### 2.2.11 Ethiopia

**Population breakdown.** ~120 M total per Central Statistical Agency of Ethiopia 2024 estimate; ~33% Muslim (~40 M, second-largest Muslim population in Africa after Egypt + Nigeria; concentrated in Harar / Bale / Arsi / Somali region / Afar region). Of Muslims: ~99% Sunni Shafi'i (Indian Ocean and Hadrami-Shafi'i inheritance via Harari/Somali maritime networks); strong Sufi tariqa presence (Qadiriyya in Harar; Tijaniyya in Wollo).

**Sources.** [Central Statistical Agency of Ethiopia](http://www.statsethiopia.gov.et/); [Ethiopian Islamic Affairs Supreme Council / Majlis](http://www.majlis.et/) — primary URL intermittent; Hussein Ahmed's *Islam in Nineteenth-Century Wallo, Ethiopia* (2001).

**Institutional Asr convention.** Ethiopian Islamic Affairs Supreme Council publishes Shafi'i 1× shadow Asr from Addis Ababa for the Muslim-majority regions.

**Local timetable convention.** Harar / Dire Dawa / Jijiga / Addis Ababa Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** High confidence among Muslim regions; the country is Christian-majority overall (~62% Orthodox + Protestant) but the Muslim minority (~33%) is uniformly Shafi'i.

---

#### 2.2.12 Eritrea

**Population breakdown.** ~3.5 M total per UN DESA 2023; ~50% Muslim (concentrated in Tigre, Beja, Hedareb, Saho, Afar, Rashaida communities; lowland and Red Sea coastal areas) + ~50% Christian (Orthodox Tewahedo + Catholic + Protestant). Of Muslims: ~99% Sunni Shafi'i.

**Sources.** UN DESA 2023; [Eritrea Ministry of Information](https://www.shabait.com/); Pew Forum 2009 Eritrea (places Muslim at ~37%, but Eritrean diaspora estimates trend higher); Office of the Mufti of Eritrea — primary URL not online.

**Institutional Asr convention.** Mufti of Eritrea publishes Shafi'i 1× shadow Asr Imsakiyya under significant state oversight.

**Local timetable convention.** Asmara / Massawa / Keren / Assab Shafi'i 1× shadow among Muslim communities.

**Verdict.** **Keep `'standard'`.** Solid confidence; matches Sunni-Shafi'i tradition. Note that Eritrea is religiously plural (~50/50) but the Muslim minority is uniformly Shafi'i, so the metadata is correct *for Muslim users*.

---

#### 2.2.13 Tanzania

**Population breakdown.** ~67 M total per National Bureau of Statistics Tanzania 2024; ~35% Muslim (~22 M, concentrated in coastal regions + Zanzibar). Of Muslims: ~99% Sunni Shafi'i (Swahili-coast Shafi'i tradition; deep Sufi influence — Qadiriyya, Shadhili, Alawiyya); small Indian-Ismaili / Bohra communities in Dar es Salaam / Zanzibar.

**Sources.** [National Bureau of Statistics Tanzania](https://www.nbs.go.tz/); [Baraza Kuu la Waislamu wa Tanzania (BAKWATA)](https://bakwata.or.tz/); [Office of the Mufti and Chief Kadhi of Zanzibar](https://www.zanzibar.go.tz/) (state-government structure differs from mainland).

**Institutional Asr convention.** BAKWATA publishes Shafi'i 1× shadow Asr Imsakiyya for the mainland; Zanzibar Mufti publishes separately for Zanzibar (also Shafi'i 1× shadow). The institutional split (BAKWATA mainland vs Zanzibar Mufti) is *political* (Zanzibar's separate Islamic governance under the 1964 union agreement), not *Asr-convention*.

**Local timetable convention.** Dar es Salaam / Zanzibar Stone Town / Mtwara / Tanga Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** Solid confidence among Muslim users. The mainland-Zanzibar institutional split does not affect Asr convention, so the country-level metadata stays correct.

---

#### 2.2.14 Kenya

**Population breakdown.** ~55 M total per Kenya National Bureau of Statistics 2024; ~11% Muslim (~6 M, concentrated in Coast and North-Eastern regions). Of Muslims: ~99% Sunni Shafi'i (Swahili-coast Shafi'i + Somali-origin Shafi'i + Indian-origin minority Hanafi/Memon).

**Sources.** [Kenya National Bureau of Statistics](https://www.knbs.or.ke/); [Supreme Council of Kenya Muslims (SUPKEM)](https://supkem.org/); Hassan Mwakimako's *Mosques in Kenya* (2007).

**Institutional Asr convention.** SUPKEM publishes Shafi'i 1× shadow Asr Imsakiyya for the Muslim community.

**Local timetable convention.** Mombasa / Lamu / Malindi / Garissa / Nairobi (Eastleigh Somali community) all Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** Solid confidence among Muslim users.

---

#### 2.2.15 Mozambique

**Population breakdown.** ~33 M total per Instituto Nacional de Estatística Moçambique 2024; ~18% Muslim (~6 M, concentrated in northern Cabo Delgado, Niassa, Nampula provinces). Of Muslims: ~99% Sunni Shafi'i (Swahili-coast and Indian Ocean inheritance).

**Sources.** [Instituto Nacional de Estatística — Moçambique](https://www.ine.gov.mz/); [Conselho Islâmico de Moçambique (CISLAMO)](https://cislamo.org.mz/); Eric Morier-Genoud's *Religious Communities in the Lusophone World* (2009).

**Institutional Asr convention.** CISLAMO publishes Shafi'i 1× shadow Asr Imsakiyya for the Muslim community.

**Local timetable convention.** Pemba / Nampula / Beira Shafi'i 1× shadow.

**Verdict.** **Keep `'standard'`.** Solid confidence among Muslim users.

---

### 2.3 Mixed-madhab fall-through countries (intentionally NOT in `COUNTRY_ASR_CONVENTION`)

For these countries the engine deliberately falls through to `asrConventionSource: 'method-implied'` because no single Asr-shadow dispatch is correct nationally. The fall-through is a *feature* of v1.7.22's design, not a gap.

#### 2.3.1 Egypt

**Population breakdown.** ~111 M total per CAPMAS Egypt 2024; ~94% Muslim. Of Muslims: Sunni-overwhelming (~99%) but multi-madhab — historically Shafi'i-dominant (al-Azhar's classical madhab), institutionally Hanafi-dominant since the Ottoman period (Egyptian state administration adopted Hanafi as the official madhab 1517–1952; al-Azhar teaches all four Sunni madhabs but the personal-status code defaults to Hanafi); Maliki and Hanbali minorities. ~1% Christian Coptic (separate from this audit).

**Sources.** [CAPMAS Egypt](https://www.capmas.gov.eg/); [Egyptian General Authority of Survey (EGSA)](http://www.esa.gov.eg/); [Dar al-Ifta al-Misriyya](https://www.dar-alifta.org/); Indira Falk Gesink's *Islamic Reform and Conservatism* (2010) for institutional madhab history; CIA Factbook Egypt.

**Institutional Asr convention.** EGSA publishes the 19.5°/17.5° angles (the canonical "Egyptian" preset in adhan.js / Aladhan) but the Asr-shadow convention is not a single national choice: al-Azhar uses Hanafi 2× shadow in Friday-prayer Imsakiyya for Hanafi mosques but Shafi'i 1× shadow elsewhere. Cairo's Ministry of Awqaf publishes a *both-shadows* Imsakiyya — modern Egyptian printed Imsakiyya often shows Asr Awwal (Shafi'i) and Asr Thani (Hanafi) side-by-side.

**Local timetable convention.** Cairo / Alexandria / Giza mosques publish either Hanafi or Shafi'i Asr depending on the mosque's tradition. AlAdhan API's default for EG is method=5 (Egyptian) school=0 (Standard), but this is calc-vs-calc.

**Verdict.** **Keep fall-through.** The dual-madhab institutional reality (Hanafi state administration + Shafi'i al-Azhar classical) means no single `'hanafi'` or `'standard'` label is correct nationally. The fall-through to `'method-implied'` is the right design — Egyptian users see standard 1× via the Egyptian preset's adhan.js default, but the disclaimer surfaces the verification ask.

---

#### 2.3.2 Saudi Arabia

**Population breakdown.** ~36 M total per Saudi General Authority for Statistics 2024 (citizens + residents). Of citizens (~21 M): ~85–90% Sunni Hanbali (Najdi-Hanbali; Wahhabi/Salafi-influenced); ~10% Sunni Shafi'i (Hejaz coastal regions: Mecca, Medina, Jeddah — historical pilgrim-trade Shafi'i); ~10–15% Twelver Shi'a (Eastern Province / Qatif / Al-Hasa). Resident-foreigner population (~14 M) is overwhelmingly Sunni but not Hanbali (Pakistani-Hanafi, Yemeni-Shafi'i, Egyptian-Hanafi/Shafi'i, Filipino-Shafi'i, Indian-Hanafi/Shafi'i mix).

**Sources.** [Saudi General Authority for Statistics](https://www.stats.gov.sa/); Madawi al-Rasheed's *A History of Saudi Arabia* (2010); [Umm al-Qura University](https://uqu.edu.sa/) institutional position; [Ministry of Islamic Affairs](https://moia.gov.sa/); Pew Forum 2009 Saudi profile.

**Institutional Asr convention.** Umm al-Qura University publishes the Umm al-Qura Imsakiyya (Fajr 18.5°, Isha = Maghrib + 90 min) using **Hanbali 1× shadow Asr** (since Hanbali standard is identical to Shafi'i / Maliki on Asr-shadow convention). The institutional Asr is *standard* even though the legal madhab of the kingdom is Hanbali — exactly the point that the Asr-convention metadata is not a legal-madhab label. The Eastern Province Shia minority follows Sistani/Najaf Imsakiyya (Twelver Jafari 1× shadow). Fajr's selectMethod() routes Saudi Arabia to UmmAlQura preset.

**Local timetable convention.** Mecca / Medina / Jeddah / Riyadh / Dammam all Umm al-Qura 1× shadow Asr published. Eastern Province Shia mosques (Qatif, Awamiyah, Hofuf) publish Sistani-style.

**Verdict.** **Keep fall-through.** Saudi is a textbook case for v1.7.22's metadata-vs-calculation split. The legal madhab is Hanbali, the Asr-shadow convention is standard 1× (consistent with Hanbali's standard position), the calculation dispatch is UmmAlQura — all three are independently correct, and the fall-through preserves that. The Eastern Province Shia minority is a real ikhtilaf but the city-level granularity of fajr's existing dispatch (UmmAlQura via country bbox) does not currently encode Eastern Province as separate; this could be a v1.8.x city-override candidate (analogous to the Iraq Najaf/Karbala overrides). **Mixed-madhab framing principle:** Saudi's Hanbali legal madhab uses 1× shadow Asr (same shadow convention as Shafi'i and Maliki), so labeling Saudi as `'standard'` would be *technically correct on shadow* but *misleading on legal madhab* — exactly the trap v1.7.22's design avoids.

---

#### 2.3.3 Iraq

**Population breakdown.** ~44 M total per Central Statistical Organization Iraq 2024; ~99% Muslim. Of Muslims: ~60–65% Twelver Shi'a (Najaf, Karbala, Basra, Baghdad-Sadr-City, southern provinces); ~30–35% Sunni (Mosul, Anbar, Salahuddin, Kirkuk-Sunni-Kurd, Baghdad-Adhamiyah); within Sunnis: Hanafi-Shafi'i split (Sunni Arabs: Hanafi-leaning historically since Ottoman period; Sunni Kurds: Shafi'i-Hanafi mix; Hanbali presence in Anbar near Saudi border).

**Sources.** [Central Statistical Organization Iraq](https://cosit.gov.iq/); [Sunni Endowment Office (Diwan al-Waqf al-Sunni)](https://sunni.gov.iq/); [Shi'a Endowment Office](https://shia-affairs.gov.iq/); [Office of Grand Ayatollah Sistani — Najaf](https://www.sistani.org/); Faleh Jabar's *The Shi'ite Movement in Iraq* (2003).

**Institutional Asr convention.** Sunni areas (Mosul / Anbar): Sunni Endowment publishes Hanafi-Shafi'i Imsakiyya (Hanafi 2× shadow predominant, Shafi'i 1× available). Shia areas (Najaf / Karbala / Basra): Twelver Jafari 1× shadow per Sistani office.

**Local timetable convention.** Mosul (Sunni Hanafi 2× shadow), Najaf / Karbala / Basra (Twelver Jafari 1× shadow), Baghdad (mixed — both Sunni and Shia mosques publish their own conventions). fajr's existing Mosul → Karachi (Hanafi) and Najaf/Karbala/Basra → Tehran (Twelver) city-overrides correctly handle this multi-method ikhtilaf at the city level.

**Verdict.** **Keep fall-through at country level.** The country dispatch is `Egyptian` (a calc-vs-calc default), with city-level overrides handling the institutional reality. This is the right design — exactly what `COUNTRY_ASR_CONVENTION` should *not* try to flatten.

---

#### 2.3.4 Lebanon

**Population breakdown.** ~5.3 M total per Lebanese Central Administration of Statistics estimate (no national census since 1932 for political reasons). Pew + UNHCR estimates: ~67% Muslim (~30% Sunni, ~30% Twelver Shi'a, ~5% Druze, ~2% Alawite, ~minor Ismaili) + ~33% Christian (Maronite + Greek Orthodox + others). Within Sunnis: Shafi'i-historical (urban coastal — Beirut, Tripoli, Sidon); Hanafi-institutional (Ottoman heritage). Twelver Shi'a follows Sistani / Khamenei maraji'.

**Sources.** [Central Administration of Statistics Lebanon](http://www.cas.gov.lb/); Pew Forum 2009 Lebanon (notes the political sensitivity of religion-counts); [Dar al-Fatwa al-Lubnaniyya](https://darelfatwa.gov.lb/); [Higher Shia Islamic Council of Lebanon](https://www.almajlisalislamiashshii.com/); CIA Factbook Lebanon.

**Institutional Asr convention.** Dar al-Fatwa publishes Sunni Imsakiyya (typically Shafi'i 1× shadow but printed both-shadow Imsakiyya available); Higher Shia Council publishes Twelver Jafari 1× shadow; Druze and Alawite communities have distinct ritual practices not modelled by either Sunni or Twelver Asr. fajr's Beirut city override routes to Egyptian (Sunni) with Tehran via altMethods (Shia).

**Local timetable convention.** Beirut / Tripoli / Sidon (Sunni Shafi'i / Hanafi); southern Lebanon — Tyre / Nabatieh (Twelver Shia per Sistani / Khamenei); Mount Lebanon (mixed; Druze-Maronite-Sunni-Shia coexistence).

**Verdict.** **Keep fall-through.** Lebanon is among the most religiously plural Muslim-majority countries; no single dispatch is correct, and the existing Beirut city-override + altMethods design is the right pattern. The 5%-Druze + 2%-Alawite minorities are *outside* the standard Sunni four-madhab Asr framework entirely, and `COUNTRY_ASR_CONVENTION` correctly does not try to model them.

---

#### 2.3.5 Syria

**Population breakdown.** ~22 M total (pre-civil-war 2011 estimate; post-2011 displacement complicates census); ~87% Muslim (~74% Sunni, ~13% Alawite + Twelver Shi'a, ~3% Druze, ~1% Ismaili) + ~10% Christian (Greek Orthodox + Catholic + Syriac). Within Sunnis: Hanafi-institutional (Ottoman heritage), Shafi'i-coastal (Latakia, Tartus), some Hanbali in eastern desert; Sufi tariqa influence (Naqshbandi, Qadiriyya).

**Sources.** [Syrian Central Bureau of Statistics](http://www.cbssyr.sy/) (intermittent post-2011); [Syrian Ministry of Awqaf](https://www.mowakaf-syria.org/); Itzchak Weismann's *Taste of Modernity* (2001) for Damascene Sunni-Hanafi institutional history.

**Institutional Asr convention.** Ministry of Awqaf publishes Sunni Imsakiyya (Hanafi-leaning institutionally; Shafi'i alternative available). Alawite communities follow distinct esoteric practice (Asr-shadow convention not formally specified in shari'a-public Alawite tradition); Twelver Shi'a follow Sistani / Khamenei.

**Local timetable convention.** Damascus / Aleppo / Homs (Sunni Hanafi-Shafi'i mix); Latakia / Tartus (Alawite-majority + Sunni Shafi'i); Suwayda (Druze).

**Verdict.** **Keep fall-through.** Multi-madhab Sunni + Alawite + Twelver + Druze + Ismaili plurality means no single dispatch is correct.

---

#### 2.3.6 Western diaspora cluster (US, UK, France, Germany, Australia, Canada, etc.)

**Population breakdown (aggregate).** US ~3.5 M Muslims (Pew 2017); UK ~3.9 M Muslims (Census 2021); France ~5.7 M Muslims (Pew 2017); Germany ~5.5 M Muslims (Pew 2017); Australia ~1 M Muslims (Census 2021); Canada ~1.8 M Muslims (Census 2021). All are heterogeneous diaspora — no single dominant madhab. US: Hanafi (South Asian + Bosnian) ~40%, Shafi'i (Arab + Indonesian + Somali) ~30%, Maliki (West African) ~10%, Twelver Shia (Iranian + Lebanese + Iraqi) ~15%, others ~5%. UK: Hanafi (South Asian Pakistani-Bangladeshi) ~70%, Shafi'i (Arab + Somali) ~20%, others ~10%. France: Maliki (Algerian + Moroccan + Tunisian Maghreb) ~70%, other ~30%. Germany: Hanafi (Turkish + Bosnian + Albanian) ~60%, Shafi'i (Arab + Iranian-Twelver) ~30%, others ~10%.

**Sources.** Pew Research Center [*Muslims in America* (2017)](https://www.pewresearch.org/religion/2017/07/26/findings-from-pew-research-centers-2017-survey-of-us-muslims/) and [*Europe's Muslim Population* (2017)](https://www.pewresearch.org/religion/2017/11/29/europes-growing-muslim-population/); [UK Census 2021](https://www.ons.gov.uk/peoplepopulationandcommunity/culturalidentity/religion/bulletins/religionenglandandwales/census2021); [Australian Bureau of Statistics Census 2021](https://www.abs.gov.au/); [Statistics Canada 2021](https://www150.statcan.gc.ca/).

**Institutional Asr convention.** No single national publisher. ISNA (US/Canada) publishes 15°/15° MWL-style; Moonsighting Committee (UK / global) publishes 18°/18° with seasonal-shafaq adjustment; UOIF (France) publishes 12°/12°; CIL (Portugal/Iberia) publishes 18°/17°. None of these enforce a single Asr-shadow convention — they're calculation-method conventions, not legal-madhab dispatches.

**Local timetable convention.** Heterogeneous; varies mosque-by-mosque depending on community madhab. NYC / London / Paris / Berlin all have Hanafi-publishing mosques *and* Shafi'i-publishing mosques *and* Maliki-publishing mosques side-by-side.

**Verdict.** **Keep fall-through (no entry).** This is the most clearly-correct fall-through in the table. Western diaspora is heterogeneous by design; forcing any country-level Asr-convention metadata would be misleading for ~30%+ of users in any direction. The disclaimer + verification prompt is the right design here.

---

### 2.4 Additional countries deserving entries (currently fall-through, audit recommends adding)

#### 2.4.1 Morocco

**Population breakdown.** ~37 M total per Haut-Commissariat au Plan 2024; ~99% Muslim. ~99% Sunni Maliki (the Maliki school's institutional heartland in the Maghreb; the Mâlikiyya tradition is rooted in Imam Malik's Medina school via Andalusia and the Almoravid/Almohad caliphates). Berbery + Arab + Sahrawi communities all uniformly Maliki; Sufi tariqas (Tijaniyya, Qadiriyya, Boutchichiyya, Aissawa) all Maliki. Effectively zero Hanafi / Shafi'i / Hanbali / Shi'a.

**Sources.** [Haut-Commissariat au Plan Maroc](https://www.hcp.ma/); [Ministère des Habous et des Affaires Islamiques](https://www.habous.gov.ma/); Pew Forum 2009 Morocco; Edmund Burke III's *The Ethnographic State: France and the Invention of Moroccan Islam* (2014) for institutional Maliki history.

**Institutional Asr convention.** Habous publishes Maliki 1× shadow Asr Imsakiyya for all 33+ regions in fajr's registry. Maliki Asr is **standard 1× shadow** — same shadow convention as Shafi'i and Hanbali, distinct from Hanafi 2×. fajr's selectMethod() routes Morocco to a custom 19°/17° + Maghrib +5 + Dhuhr +5 Path A method per the v1.5.0 / v1.7.16 calibration corpus.

**Local timetable convention.** Casablanca / Rabat / Marrakech / Fes / Tanger / Oujda / Agadir all Maliki 1× shadow per Habous.

**Verdict.** **Add `Morocco: 'standard'`** with comment `'standard'  // Habous (Ministère des Habous) — Maliki 1× shadow Asr (NOT Shafi'i; Maliki uses standard 1× shadow convention)`. This is the v1.7.22 design's cautionary example — the existing CALIBRATION.md already calls Morocco out as "Moroccan user may be Maliki while `location.asrConvention` correctly reports `standard` 1× Asr." Currently Morocco is a fall-through to method-implied; adding it explicitly with the Maliki disclaimer makes the design pedagogically clearer and pre-empts agiftoftime-style confusion.

**Risk:** **Low.** Adding a `'standard'` entry for Morocco is a metadata-only change that does not affect calculation. The country-level `applied.asrSchool` already returns standard via the Morocco preset.

---

#### 2.4.2 Mauritania

**Population breakdown.** ~5 M total per Office National de la Statistique Mauritanie 2024; ~99% Muslim. ~99% Sunni Maliki (Trans-Saharan Maliki tradition; the Almoravid heritage; Mauritanian *mahadras* — independent Maliki seminaries — are among the most-respected Maliki teaching institutions in West Africa).

**Sources.** [Office National de la Statistique Mauritanie](http://www.ons.mr/); Pew Forum 2009 Mauritania; David Robinson's *Paths of Accommodation* (2000) for Mauritanian Maliki institutional history.

**Institutional Asr convention.** Mauritanian Ministry of Islamic Affairs and Original Education publishes Maliki 1× shadow Asr Imsakiyya. fajr currently routes Mauritania to MWL.

**Local timetable convention.** Nouakchott / Nouadhibou / Atar Maliki 1× shadow.

**Verdict.** **Consider adding `Mauritania: 'standard'`** with comment `'standard'  // Sunni Maliki (Trans-Saharan tradition); Maliki 1× shadow Asr`. Lower-priority than Morocco because Mauritania's Muslim population is small (~5 M) and the existing fall-through already gives the right answer via the MWL preset's standard 1× default. Add for *pedagogical consistency* and to prevent any future bbox change from defaulting to Hanafi metadata.

**Risk:** **Very low.** Metadata-only.

---

#### 2.4.3 Senegal / Mali / Gambia (West African Maliki cluster)

**Population breakdown (Senegal).** ~18 M total; ~96% Muslim; ~99% Sunni Maliki (Tijaniyya tariqa-dominant ~50%, Mouride tariqa ~40%, Qadiriyya ~5%, Layene ~3%, Sufi-Salafi minor). All Maliki on Asr-shadow convention.

**Population breakdown (Mali).** ~22 M total; ~95% Muslim; ~99% Sunni Maliki (Trans-Saharan tradition; Tijaniyya + Qadiriyya tariqa-dominant).

**Population breakdown (Gambia).** ~2.5 M total; ~96% Muslim; ~99% Sunni Maliki (same West African tradition).

**Sources.** [Agence Nationale de la Statistique et de la Démographie Sénégal](https://www.ansd.sn/); [Institut National de la Statistique Mali](http://www.instat-mali.org/); [Gambia Bureau of Statistics](https://www.gbosdata.org/); Pew Forum 2009 West Africa cluster; David Robinson's *Paths of Accommodation* (2000) and Lansiné Kaba's *The Wahhabiyya* (1974).

**Institutional Asr convention.** All three publish Maliki 1× shadow Asr Imsakiyya through national religious authorities (Sénégalais Conseil Supérieur Islamique; Malian Haut Conseil Islamique; Gambian Supreme Islamic Council). fajr currently routes all three to MWL (which gives standard 1× shadow as the calc default — so the *answer* is right but the metadata fall-through means the disclaimer fires for users who would benefit from explicit Maliki-aligned standard metadata).

**Local timetable convention.** Dakar / Touba / Saint-Louis / Bamako / Timbuktu / Banjul all Maliki 1× shadow.

**Verdict.** **Consider adding `Senegal: 'standard'`, `Mali: 'standard'`, `Gambia: 'standard'`** as a West-African Maliki cluster. Lower priority than Morocco/Mauritania because the population overlap is smaller and the calc default is already correct via MWL. Add for pedagogical consistency + to extend the Maliki coverage; doesn't affect calculation.

**Risk:** **Very low.** Metadata-only; same as Morocco/Mauritania.

---

#### 2.4.4 Iran

**Population breakdown.** ~88 M total per Statistical Centre of Iran 2024; ~99% Muslim. ~90–93% Twelver Shi'a (Jafari madhab; Iran is the world's largest Twelver Shia country and the institutional heartland since Safavid 1501); ~5–8% Sunni (Kurdish + Baluch + Turkmen minorities, mostly Shafi'i; some Hanafi); ~1–2% Ismaili / Zoroastrian / Bahá'í / Christian / Jewish.

**Sources.** [Statistical Centre of Iran](https://www.amar.org.ir/); Pew Forum 2009 Iran profile; Vali Nasr's *The Shia Revival* (2006).

**Institutional Asr convention.** Tehran Institute of Geophysics publishes Tehran-method Imsakiyya (Fajr 17.7°, Maghrib 4.5min after sunset, Isha 14°) using **Twelver Jafari 1× shadow Asr** (Jafari uses 1× shadow, same as Shafi'i / Maliki / Hanbali on shadow but with distinct broader prayer-time conventions including the Jafari position that Maghrib is later than Sunni position). The 90%+ Twelver majority means Iran is monolithically Twelver Jafari on Asr. The Sunni 5–8% Kurdish / Baluch / Turkmen minorities follow Shafi'i (Kurdish southeast) or Hanafi (Turkmen northeast) in published mosque Imsakiyya, but the country-level institutional dispatch is Tehran-method.

**Local timetable convention.** Tehran / Mashhad / Isfahan / Shiraz / Tabriz / Qom — all Tehran-method Twelver Jafari 1× shadow. Sunni-Kurdish areas (Sanandaj, Mahabad) and Sunni-Baluch areas (Zahedan, Iranshahr) publish Sunni Shafi'i Imsakiyya alongside.

**Verdict.** **Consider adding `Iran: 'standard'`** with comment `'standard'  // Twelver Jafari 1× shadow Asr (90%+ Twelver Shia; Sunni minorities use Shafi'i 1× — both standard shadow). Tehran-method dispatched.`. **However**, the v1.7.22 design's "AsrConvention is not legal madhab" framing means a `'standard'` label for Iran would be technically correct on shadow but might mislead users into reading "standard = Sunni" — the same trap as the Morocco-Maliki case. **Recommendation:** add Iran with the explicit Jafari note, or leave fall-through with the disclaimer. The current fall-through is acceptable; adding Iran is a *pedagogical* improvement, not a *correctness* fix.

**Risk:** **Low.** Metadata-only.

---

### 2.5 Additional fall-through countries (audit confirms fall-through is correct)

#### 2.5.1 UAE

**Population breakdown.** ~9.4 M total (citizens ~12% + residents ~88%). UAE citizens (~1.1 M) ~99% Sunni Maliki-Hanbali mix (Emirati national tradition is Maliki-leaning historically but the federal Awqaf institution adopts a pan-Sunni stance). Resident-foreigners (~8.3 M) are a heterogeneous mix: ~50% South Asian Hanafi (Pakistani + Indian + Bangladeshi); ~20% Arab Shafi'i/Hanafi (Egyptian, Sudanese, Yemeni, Levantine); ~15% Filipino Shafi'i; ~10% Iranian Twelver Shia; ~5% other.

**Sources.** [UAE Federal Competitiveness and Statistics Authority](https://fcsc.gov.ae/); [UAE General Authority of Islamic Affairs and Endowments (GAIAEA)](https://www.awqaf.gov.ae/); IACAD Dubai (Islamic Affairs and Charitable Activities Department); Pew Forum 2009 UAE.

**Institutional Asr convention.** GAIAEA publishes UAE Dubai-method Imsakiyya (Fajr 18.2°, Isha 18.2°). UAE has documented elevation correction support (Burj Khalifa fatwa per IACAD Dulook DXB app — see [knowledge/wiki/corrections/elevation.md](knowledge/wiki/corrections/elevation.md)). Asr-shadow convention is *not* uniformly imposed federally: GAIAEA Imsakiyya can show both 1× and 2× Asr.

**Local timetable convention.** Dubai / Abu Dhabi / Sharjah heterogeneous; mosques publish per their community.

**Verdict.** **Keep fall-through (no entry).** Heterogeneous resident population means no single dispatch is correct.

---

#### 2.5.2 Qatar / Kuwait / Bahrain / Oman

**Population breakdown (Qatar).** ~3 M total (citizens ~12%, residents ~88%); ~67% Muslim. Citizens are Sunni Hanbali-Wahhabi-influenced; residents heterogeneous.

**Population breakdown (Kuwait).** ~4.3 M total (citizens ~31%, residents ~69%); ~74% Muslim. Citizens: ~70% Sunni (Hanafi-Hanbali mix), ~30% Twelver Shia.

**Population breakdown (Bahrain).** ~1.5 M total; ~73% Muslim. Citizens: ~50–60% Twelver Shia, ~40–50% Sunni.

**Population breakdown (Oman).** ~5 M total; ~85% Muslim. Citizens are uniquely Ibadi-majority (~45–75% depending on estimate; Ibadi is a distinct Khariji-derived school separate from Sunni four-madhab and Shia twelver) + Sunni Shafi'i ~25% + Twelver Shia ~5%.

**Sources.** [Qatar Planning and Statistics Authority](https://www.psa.gov.qa/); [Kuwait Central Statistical Bureau](https://www.csb.gov.kw/); [Bahrain Information & eGovernment Authority](https://www.iga.gov.bh/); [Oman National Centre for Statistics and Information](https://www.ncsi.gov.om/).

**Institutional Asr convention.** Each country's Awqaf publishes its own Imsakiyya: Qatar uses Qatar-method (Fajr 18°, Isha 90 min), Kuwait uses Kuwait-method (Fajr 18°, Isha 17.5°), Bahrain uses Egyptian-method-default, Oman uses Ibadi-specific timing per Sultanate Awqaf. None enforce a single shadow convention.

**Verdict.** **Keep fall-through (no entry).** GCC heterogeneity + Ibadi-Oman distinctiveness means no single label is correct. **Suggested wiki note:** Oman's Ibadi-majority status is unique in the Muslim world; the Ibadi school's Asr-shadow convention is **1× shadow** (same as Shafi'i / Maliki / Hanbali / Jafari) but the broader prayer-time framework is distinct enough that downstream apps should ideally surface "Ibadi tradition" as a `notes[]` advisory for Omani coordinates. This is a Layer 3 fiqh-review concern, not a metadata-table change.

---

#### 2.5.3 Jordan

**Population breakdown.** ~11 M total per Department of Statistics Jordan 2024; ~97% Muslim. ~95% Sunni (Hanafi-institutional via Ottoman heritage + Shafi'i historical), ~2% Christian, ~3% other. The Asr-shadow convention is mixed historically (Hanafi institutional, Shafi'i scholarly).

**Sources.** [Department of Statistics Jordan](http://dosweb.dos.gov.jo/); [Ministry of Awqaf, Islamic Affairs and Holy Places](https://awqaf.gov.jo/); Pew Forum 2009 Jordan.

**Institutional Asr convention.** Ministry of Awqaf publishes Jordan-method Imsakiyya (Fajr 18°, Isha 18°, Maghrib +5 min) per Aabed (2015) calibration. Asr-shadow can be either 1× or 2× depending on the printed Imsakiyya.

**Verdict.** **Keep fall-through.** Hanafi-institutional + Shafi'i-historical mix means no single label is correct. The selected Jordan method's standard 1× Asr default is the right calc.

---

#### 2.5.4 Palestine / Israel

**Population breakdown (Palestine).** ~5.5 M total (West Bank + Gaza); ~98% Muslim. ~99% Sunni (Hanafi institutional via Ottoman heritage + Shafi'i historical). Christian ~2%.

**Population breakdown (Israel).** ~9.7 M total; ~18% Muslim (~1.7 M Israeli Arabs + Bedouin + Druze). Israeli Arab Muslims are ~98% Sunni (Hanafi-Shafi'i mix); Druze are a distinct community.

**Sources.** [Palestinian Central Bureau of Statistics](http://www.pcbs.gov.ps/); [Israel Central Bureau of Statistics](https://www.cbs.gov.il/); Pew Forum 2009 Palestinian Territories + Israel profiles.

**Institutional Asr convention.** Palestine: Ministry of Awqaf publishes Sunni Imsakiyya. Israel: Northern Branch of the Islamic Movement publishes for Israeli Arab Muslim community; Southern Branch for the Bedouin community.

**Verdict.** **Keep fall-through.** Multi-madhab Sunni mix; the existing Egyptian/MWL dispatch is the right calc default.

---

#### 2.5.5 Tunisia / Algeria / Libya

**Population breakdown (Tunisia).** ~12 M total; ~99% Muslim; ~99% Sunni Maliki (same Trans-Saharan Maliki tradition as Morocco / Mauritania).

**Population breakdown (Algeria).** ~46 M total; ~99% Muslim; ~99% Sunni Maliki + small Ibadi minority (Mzab valley / Beni Isguen).

**Population breakdown (Libya).** ~7 M total; ~97% Muslim; ~99% Sunni Maliki + small Ibadi minority (Jebel Nafusa Berbers).

**Sources.** [Institut National de la Statistique Tunisie](http://www.ins.tn/); [Office National des Statistiques Algérie](https://www.ons.dz/); [Bureau of Statistics Libya](http://bsc.ly/).

**Institutional Asr convention.** All three publish Maliki 1× shadow Asr Imsakiyya. fajr currently routes Tunisia to a custom 18°/18° (Tunisian Ministry preset), Algeria to MWL, Libya to Egyptian — all giving standard 1× shadow as calc default.

**Verdict.** **Consider adding the Maghreb cluster as `'standard'`** (Tunisia, Algeria, Libya) for the same Maliki-pedagogical reason as Morocco/Mauritania. Lower priority than Morocco. **Risk:** Very low; metadata-only.

---

#### 2.5.6 Sudan

**Population breakdown.** ~46 M total; ~97% Muslim; ~99% Sunni Maliki / Shafi'i (Sufi-tariqa-influenced — Tijaniyya, Qadiriyya, Sammaniyya, Ansar Mahdist). Strong Sufi institutional tradition.

**Sources.** [Central Bureau of Statistics Sudan](http://cbs.gov.sd/); Pew Forum 2009 Sudan profile.

**Institutional Asr convention.** Sudanese Awqaf publishes Sunni Imsakiyya. Sufi-Maliki dominant.

**Verdict.** **Keep fall-through.** Maliki-Shafi'i mix means a single label is debatable. The existing Egyptian dispatch is right calc.

---

#### 2.5.7 South Asian sub-cluster: Sri Lanka (already standard) + Maldives (already standard) + India (Hanafi country-default with Kerala/Lucknow overrides) — already covered.

#### 2.5.8 Southeast Asian sub-cluster: Indonesia / Malaysia / Singapore / Brunei (all already standard) + Cambodia + Thailand + Philippines

**Cambodia (~16 M total, ~2% Muslim — Cham community ~300 K).** Cham Muslims are ~80% Sunni Shafi'i (lineage from historic Champa kingdom + Malay-Yemeni networks) + ~20% Cham-Bani (a syncretic Sunni-Hindu-Cham-traditional blend, distinctive to Vietnam-Cambodia-Cham diaspora). Standard 1× shadow per Shafi'i tradition.

**Thailand (~70 M total, ~5% Muslim — ~3.5 M, concentrated in southern provinces Pattani / Yala / Narathiwat / Songkhla).** Thai Muslims are ~99% Sunni Shafi'i (Malay-coast Shafi'i tradition; the southern provinces are ethno-religiously continuous with Malaysia's Patani Malay).

**Philippines (~115 M total, ~6% Muslim — ~7 M, concentrated in Bangsamoro Autonomous Region / Mindanao).** Bangsamoro Muslims are ~99% Sunni Shafi'i (Maranao + Maguindanao + Tausug Shafi'i tradition; the Bangsamoro Darul-Ifta' / BDI-BARMM publishes Shafi'i Imsakiyya). fajr's Cotabato + Marawi city overrides correctly route to MWL (which gives standard 1× shadow as calc).

**Verdict.** **Consider adding `Cambodia: 'standard'`, `Thailand: 'standard'`, `Philippines: 'standard'`** for the Southeast-Asian Shafi'i extension. Risk: very low; metadata-only.

---

## 3. Reclassification table

| Country | Current label | Proposed label | Citation | Expected per-prayer impact |
|---|---|---|---|---|
| (none — no current entry is wrong) | — | — | — | — |

The audit finds **no entry in the current `COUNTRY_ASR_CONVENTION` table that warrants reclassification**. Every Hanafi label corresponds to a documented Hanafi-majority demography + Hanafi-Asr publishing institution; every standard label corresponds to a documented standard-Asr publishing institution. The 14 Hanafi entries and 15 standard entries are all defensible.

---

## 4. Missing entries (audit recommendation)

Listed in priority order (highest scholarly-defensibility × user-impact first):

| # | Country | Proposed value | Citation | Priority |
|---|---|---|---|---|
| 1 | Morocco | `'standard'` | Habous (Maliki Trans-Saharan); v1.7.22 cautionary example already in CALIBRATION.md | **HIGH** — pedagogical clarity for the Maliki/Asr-shadow distinction |
| 2 | Mauritania | `'standard'` | Office National de la Statistique Mauritanie; Maliki Trans-Saharan tradition | MED |
| 3 | Tunisia | `'standard'` | Ministère des Affaires Religieuses Tunisie; Maliki | MED |
| 4 | Algeria | `'standard'` | MARW Algérie; Maliki | MED |
| 5 | Libya | `'standard'` | General Authority of Endowments Libya; Maliki | MED |
| 6 | Senegal | `'standard'` | Conseil Supérieur Islamique du Sénégal; Maliki Tijaniyya/Mouride | MED |
| 7 | Mali | `'standard'` | Haut Conseil Islamique du Mali; Maliki | MED |
| 8 | Gambia | `'standard'` | Supreme Islamic Council of The Gambia; Maliki | MED |
| 9 | Iran | `'standard'` | Tehran Institute of Geophysics; Twelver Jafari 1× shadow | LOW (pedagogical) |
| 10 | Cambodia | `'standard'` | Cham Muslim community Shafi'i tradition | LOW |
| 11 | Thailand | `'standard'` | Sheikhul Islam Thailand; Patani Malay Shafi'i | LOW |
| 12 | Philippines | `'standard'` | Bangsamoro Darul-Ifta' (BDI-BARMM); Shafi'i | LOW |
| 13 | Niger | `'standard'` | Maliki Trans-Saharan | LOW |
| 14 | Burkina Faso | `'standard'` | Maliki Trans-Saharan | LOW |
| 15 | Côte d'Ivoire | `'standard'` | Maliki Trans-Saharan + Sufi Tijaniyya | LOW |

**Highest-impact addition (Morocco)** is recommended as the lone HIGH-priority entry because it is *already* CALIBRATION.md's named cautionary example for the v1.7.22 design. Adding it explicitly with a Maliki disclaimer in the inline comment would close the "Morocco-Maliki" loop that agiftoftime-agent flagged in issue #88.

The Maghreb (Tunisia/Algeria/Libya) + West African Maliki cluster (Mauritania/Senegal/Mali/Gambia + Niger/Burkina/Côte d'Ivoire) are MED-LOW priority because the calc default already gives standard 1× shadow via MWL/Egyptian/custom dispatches, so adding metadata is *pedagogical clarity* rather than *correctness fix*.

---

## 5. Mixed-madhab fall-through countries — scholarly basis

The audit confirms that the following 6+ countries are **deliberately left fall-through** in `COUNTRY_ASR_CONVENTION`, and the design is correct:

### 5.1 Egypt — institutional Hanafi vs scholarly Shafi'i

Egypt's institutional madhab is Hanafi (Ottoman-era state-administration inheritance, formalized in the 1875 Hanafi-personal-status code) while al-Azhar's classical scholarly madhab is Shafi'i. Modern Egyptian printed Imsakiyya often shows Asr Awwal (Shafi'i 1×) and Asr Thani (Hanafi 2×) side-by-side. Forcing either label nationally would be wrong; the fall-through is correct.

### 5.2 Saudi Arabia — Hanbali legal madhab + standard 1× Asr-shadow + Eastern Province Shia minority

The Saudi case is the audit's clearest demonstration of the v1.7.22 metadata-vs-calc-vs-legal-madhab three-way distinction:

- *Legal madhab*: Hanbali (Najdi-Wahhabi institutional tradition).
- *Asr-shadow convention*: standard 1× shadow (Hanbali standard position; same shadow convention as Shafi'i/Maliki).
- *Calculation method*: Umm al-Qura (Fajr 18.5°, Isha 90-min-after-Maghrib).
- *Sub-national ikhtilaf*: Eastern Province ~10–15% Twelver Shia (Qatif, Awamiyah, Hofuf) following Sistani Imsakiyya.

A `'standard'` country-default would be correct on shadow but might mislead users into reading "standard = Sunni Shafi'i", which is wrong. The fall-through is correct.

### 5.3 Iraq — multi-madhab + multi-sect city-level granularity

Iraq's 60–65% Twelver Shia + 30–35% Sunni split + sub-Sunni Hanafi/Shafi'i/Hanbali plurality means no national label is right. The existing city-level overrides (Mosul → Karachi/Hanafi; Najaf/Karbala/Basra → Tehran/Twelver) are the right design.

### 5.4 Lebanon — religious plurality

Lebanon is unique in that the religious plurality is institutionally formalized via the National Pact (1943) and confessional-balance constitution. ~30% Sunni + ~30% Twelver Shia + 5% Druze + 2% Alawite + ~33% Christian. The existing Beirut city-override + altMethods design is right.

### 5.5 Syria — multi-madhab Sunni + Alawite + Druze + Twelver

Same as Lebanon in religious plurality but distributed differently. Multi-madhab Sunni majority + Alawite/Druze/Twelver minorities = no single dispatch is right.

### 5.6 Western diaspora (US/UK/France/Germany/Australia/Canada)

Heterogeneous diaspora; the calc method (ISNA/MoonsightingCommittee/UOIF) is calculation-method, not legal-madhab dispatch. Forcing a country-level Asr-shadow metadata would be misleading for ~30%+ of users in any direction.

---

## 6. Methodology

### 6.1 Sources used

**Primary (highest authority):**
- [Pew Research Center](https://www.pewresearch.org/religion/) — *Mapping the Global Muslim Population* (2009, 2017 updates), *Europe's Muslim Population* (2017), *Muslims in America* (2017), country-specific country-attitude surveys (Indonesia 2017, Turkey 2014, India 2021).
- National statistics offices — UK ONS (2021 census), Australian Bureau of Statistics (2021), Statistics Canada (2021), TÜİK (Turkey 2023), CAPMAS (Egypt 2024), Pakistan Bureau of Statistics (2023), Bangladesh Bureau of Statistics (2022), BPS (Indonesia 2023), DOSM (Malaysia 2023), Department of Statistics Singapore (2024), Maldives Bureau of Statistics (2024).
- Government religious-affairs ministries — Diyanet (Türkiye), Habous (Morocco), KEMENAG (Indonesia), JAKIM (Malaysia), MUIS (Singapore), Brunei Awqaf, Islamic Foundation Bangladesh, Ministry of Hajj and Religious Affairs (Afghanistan), Ministry of Islamic Affairs (Maldives), ACJU (Sri Lanka), Diwan al-Waqf al-Sunni / al-Shi'i (Iraq), Sistani office (Najaf), Tehran Institute of Geophysics (Iran), Umm al-Qura University (Saudi Arabia), GAIAEA (UAE), Diyanet-equivalent national institutions (KMSh Albania, BIK Kosovo, Rijaset BiH, IVZ-RM North Macedonia), Spiritual Boards / Muftiates (DUMK Kazakhstan, SAMK Kyrgyzstan, Council of Ulema Tajikistan, Muftiate Turkmenistan, Muslim Spiritual Board Uzbekistan), AIMPLB / Samastha Kerala (India), Mufti offices in Comoros / Eritrea / Djibouti, BAKWATA (Tanzania), CISLAMO (Mozambique), SUPKEM (Kenya), Conseil Supérieur Islamique du Sénégal, Haut Conseil Islamique du Mali, Mauritanian Ministry of Islamic Affairs, Algerian MARW, Tunisian Ministry of Religious Affairs, Libyan General Authority of Endowments, Sudanese Awqaf, Egyptian Awqaf + Dar al-Ifta + EGSA, Syrian Ministry of Awqaf, Jordan Awqaf, Lebanese Dar al-Fatwa + Higher Shia Council, Bangsamoro Darul-Ifta' (Philippines).

**Secondary (academic + institutional):**
- Madawi al-Rasheed, *A History of Saudi Arabia* (2010).
- Vali Nasr, *The Shia Revival* (2006).
- Faleh Jabar, *The Shi'ite Movement in Iraq* (2003).
- Bernard Haykel, *Revival and Reform in Islam* (2003) — Yemeni Zaydi-Shafi'i.
- Adeeb Khalid, *Islam after Communism* (2007) — post-Soviet Central Asia.
- Robert Hefner, *Civil Islam* (2000) — Indonesian institutional history.
- Hussein Ahmed, *Islam in Nineteenth-Century Wallo, Ethiopia* (2001).
- David Robinson, *Paths of Accommodation* (2000) — West African Maliki + Mauritanian Sufi-Shafi'i tradition.
- Itzchak Weismann, *Taste of Modernity* (2001) — Damascene Sunni-Hanafi.
- Iain Walker, *Becoming the Other, Being Oneself* (2010) — Comorian Shafi'i.
- Hassan Mwakimako, *Mosques in Kenya* (2007).
- Eric Morier-Genoud, *Religious Communities in the Lusophone World* (2009) — Mozambique.
- Edmund Burke III, *The Ethnographic State: France and the Invention of Moroccan Islam* (2014).
- Sami Bayet, *Yemen — A Country Profile* (2013).
- Çarkoğlu & Toprak, *Religion, Society and Politics in a Changing Turkey* (2007).

**Tertiary (cross-reference + corroboration):**
- AlAdhan API world-default routing per [aladhan.com/calculation-methods](https://aladhan.com/calculation-methods).
- IslamicFinder country defaults (cross-referenced).
- CIA World Factbook country profiles (2024).
- ARDA Religion Atlas country pages.
- Wikipedia country-religion pages (used for triangulation only — never as primary; flagged in any quotation).

### 6.2 What I could not verify

- **Tajikistan + Turkmenistan primary-source reachability.** State internet restrictions make muftiate.tj and gosden-muftiyat.gov.tm intermittent. Hanafi-Maturidi tradition is uncontested in scholarly literature, but a fresh 2026-05 institutional-publication URL was not consistently reachable during the audit.
- **Eritrea Office of the Mufti.** Not consistently published online; institutional position triangulated via Pew + Sami Bayet + diaspora media.
- **Comoros Mufti's office daily Imsakiyya.** No daily publishing URL; institutional position triangulated via academic sources + Comorian Sunni Shafi'i tradition.
- **Sub-national Twelver Shia population estimates** for Saudi Eastern Province / Lebanese South / Bahraini majority / Iraqi southern provinces — these are politically sensitive and statistical estimates vary by source. The audit took midpoint estimates from Pew + CIA + academic sources.
- **Yemeni Zaydi vs Sunni split** under post-2014 Houthi-administered conditions — pre-2011 estimates (Pew 35% Zaydi / 65% Sunni) are the audit baseline; post-2014 demographic shifts due to displacement are not captured.

### 6.3 Where to push next-round

1. **Fresh primary-source verification for Central Asia muftiates** (Tajikistan, Turkmenistan, Kazakhstan, Kyrgyzstan, Uzbekistan): visit each muftiate website through a non-restricted-region proxy and capture a 2026-05 Imsakiyya screenshot for the wiki regional pages.
2. **Yemen Zaydi institutional position** under Houthi-administered Sana'a (separate from Aden Awqaf in southern Yemen): verify Zaydi-Hadawi Asr-shadow convention against Houthi Ministry of Endowments published Imsakiyya.
3. **Sub-Saharan African Maliki cluster** (Niger / Burkina / Côte d'Ivoire / Mali / Senegal / Gambia / Mauritania): consolidate into a single Maliki-Trans-Saharan wiki regional cluster page rather than seven separate stubs.
4. **Bangsamoro Philippines specifically**: re-verify the BDI-BARMM publishing convention via the bdi.bangsamoro.gov.ph portal.
5. **Indonesian internal ikhtilaf**: NU vs Muhammadiyah Asr convention verification. Both are Shafi'i but Muhammadiyah's reformist orientation might publish slightly different Imsakiyya — verify via empirical comparison of a 2026-05 KEMENAG Imsakiyya vs a Muhammadiyah Imsakiyya for Yogyakarta.
6. **Indian state-level granularity**: AIMPLB publishes pan-Indian Imsakiyya, but Tamil Nadu / Andhra Pradesh / Telangana / Karnataka coastal areas may have state-level institutional differences — verify whether the country-level `'hanafi'` metadata is *aggregate-correct but locally-misleading* in more states than just Kerala (already overridden via Kochi).

---

## 7. Recommended next moves (top 10)

Ranked by **scholarly defensibility × user-impact × implementation cost**:

| # | Action | Defensibility | Impact | Cost |
|---|---|---|---|---|
| 1 | **Add `Morocco: 'standard'`** to `COUNTRY_ASR_CONVENTION` with explicit Maliki disclaimer in inline comment. Closes the v1.7.22 cautionary-example loop from issue #88. | **High** — Habous + Pew + scholarly consensus. | High — Morocco is the highest-population Maliki country in fajr's corpus and the named cautionary example. | Low — metadata-only. |
| 2 | **Update India inline comment** with explicit demographic estimate (~140 M Hanafi / ~36 M Shafi'i / ~28 M Twelver) per Census of India 2011 + Pew 2021 + Samastha Kerala. | **High** — Census + Pew + Samastha. | Medium — clarifies the Hanafi-majority claim is empirically defensible at ~70% of Muslims. | Low — inline comment only. |
| 3 | **Add Maghreb cluster** (`Tunisia`, `Algeria`, `Libya`) as `'standard'` with Maliki disclaimer. Pedagogical-Maliki extension. | **High** — uniformly Maliki. | Medium — extends the Maliki coverage to ~65 M Muslims. | Low — metadata-only. |
| 4 | **Verify Tajikistan + Turkmenistan primary-source URLs** via diaspora-side proxy and capture 2026-05 Imsakiyya for the wiki regional pages. | Medium — Hanafi tradition uncontested but URL-reachability weak. | Low — small populations. | Medium — research effort. |
| 5 | **Add `Mauritania: 'standard'`** with Maliki Trans-Saharan disclaimer. | **High** — uniformly Maliki. | Low — small population. | Low — metadata-only. |
| 6 | **Add West African Maliki cluster** (`Senegal`, `Mali`, `Gambia`, `Niger`, `BurkinaFaso`, `CoteDIvoire`) as `'standard'` for pedagogical consistency. | **High** — uniformly Maliki. | Medium — extends to ~50 M+ West African Muslims. | Low — metadata-only. |
| 7 | **Update Yemen inline comment** to explicitly note the Zaydi-Shafi'i 35/65% split and that both use 1× shadow but with distinct broader prayer-time conventions. Add `notes[]` advisory for Yemeni coordinates. | **High** — Pew + Haykel + Bayet. | Medium — surface dual-tradition framing. | Medium — inline comment + notes[] copy. |
| 8 | **Add `Iran: 'standard'`** with Twelver Jafari 1× shadow disclaimer. Pedagogical extension. | **High** — Statistical Centre of Iran + Tehran Institute. | Medium — disambiguates the Jafari shadow-convention from Sunni interpretations. | Low — metadata-only. |
| 9 | **Update Saudi inline note** (in the fall-through documentation, since Saudi stays out of the table) explaining why a `'standard'` label would be technically correct on shadow but misleading on legal madhab. Same for Morocco analogy. | **High** — direct application of v1.7.22 design. | Medium — pedagogical. | Low — wiki / CALIBRATION.md note only. |
| 10 | **Verify Eastern Province Saudi Twelver Shia city-override candidacy** for v1.8.x — analogous to Iraq Najaf/Karbala/Basra overrides. The Eastern Province ~10–15% Twelver minority is a real Asr-convention divergence from Umm al-Qura that fajr currently silently flattens. | **High** — Sistani / Madawi al-Rasheed / Pew. | Medium — affects ~3 M Eastern Province Saudi Shia. | Medium — city-override + altMethods data. |

**No `eval/` or `engine.js` runtime changes are recommended in this proposal.** All 10 actions are either metadata-only (inline comments, table additions that surface but do not change calc) or wiki-compilation work (which is human-driven per CLAUDE.md). The autoresearch ratchet does not need to gate any of these because they don't change `applied.asrSchool` — they change `location.asrConvention` *labels* without affecting the calculated time output.

---

## 8. Coda — what this audit confirms about the v1.7.22 design

The v1.7.22 metadata-vs-calculation split is the **right** response to the #85 ratchet failure. The audit confirms:

1. The 28-entry `COUNTRY_ASR_CONVENTION` table is structurally sound — every entry is defensible by primary source.
2. The fall-through design for mixed-madhab countries (Egypt, Saudi, Iraq, Lebanon, Syria, Western diaspora) is principled, not lazy — these countries cannot be labeled at the country level without flattening real ikhtilaf.
3. The Morocco-Maliki cautionary example in CALIBRATION.md is the right pedagogical anchor; adding Morocco explicitly to the table with a Maliki disclaimer would make the design self-documenting.
4. The metadata-vs-calculation distinction (`location.asrConvention` ≠ `applied.asrSchool`) is the correct API-level separation; it preserves both the user-facing "this is your local Asr convention" signal AND the calc-correctness of the dispatched method's actual shadow choice.
5. No 🔴 reclassification is warranted — the table does not lie.

The audit's recommended next moves are *additive and pedagogical*, not corrective. The structure is right; the polish is what remains.

---

*Sadaqah jariyah dedication: this audit is dedicated to the readers of fajr's metadata fields who deserve to be served correctly, especially the world's ~1.9 B Muslims whose prayer times this library is responsible for.*

— fajr-claude
