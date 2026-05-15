# Known Disagreements

Last refreshed: 2026-05-06

This page lists places where fajr intentionally avoids pretending that one
calculation is the only valid view. The goal is to keep the app surface simple
without hiding real ikhtilaf, institutional variation, or data-quality limits.

## How to Read This Page

| Term | Meaning |
|---|---|
| Consensus | The fiqh or astronomical principle is broadly established. |
| Institutional split | Authorities agree on the principle but publish different operational policies. |
| Empirical split | Mosque/institutional data disagree, or one source looks stale/misconfigured. |
| Product default | The default fajr chooses today, with a documented override path. |

## Disagreement Register

| Topic | Current fajr default | Disagreement | User/app handling |
|---|---|---|---|
| Asr convention vs legal madhhab | Return `location.asrConvention` separately from `applied.asrSchool`. Deprecated `madhab` aliases now mirror `standard` / `hanafi` Asr values for compatibility. | A country can be Hanafi-majority while a particular published timetable or API fixture uses standard 1x Asr. Morocco is Maliki but uses standard Asr; this is not "Shafi'i madhhab." | Render Asr convention, not "madhhab." Let users override when their mosque uses a different Asr start. |
| Morocco formal angle vs published practice | Single canonical Morocco official-timetable calibration, using the uniform Habous city/region timetable stance by default. | Formal descriptions and empirical reproduction may not line up cleanly as raw angles. Habous published tables are the authority; Mawaqit supports real mosque practice. Morocco tables are regional/city tables, not observer-elevation tables. | Describe as "Morocco official timetable calibration," not as a bare angle claim. For Morocco, do not auto-apply elevation unless the user or mosque explicitly wants observer-elevation correction. |
| Elevation for Shuruq/Maghrib | Apply geometric horizon-dip correction when elevation is resolved from the city registry or explicitly supplied, except for countries whose official default is a uniform city/region timetable such as Morocco. Allow explicit override with `elevation` / `override.elevation`. | UAE and Malaysia apply elevation in modern institutional settings. Morocco and Saudi published city timetables are uniform; retrieved Saudi sources do not yet give a primary policy text explaining the rationale. | Show the correction amount and let users follow local mosque practice. Do not adjust Fajr/Isha for elevation. |
| Fajr/Isha elevation and atmosphere | No elevation correction to Fajr/Isha. | Atmospheric scattering at altitude may affect observed twilight, but fajr does not have a sufficiently grounded institutional rule to alter Fajr/Isha angles. | Leave unchanged and document as open research. |
| High-latitude summers | Use high-latitude adjustment rules and emit validity warnings where windows become synthetic or polar. | Local councils differ on nearest-city, middle-of-night, one-seventh, and angle-based approaches. | Render `validityWarnings[]` and encourage local mosque/council override. |
| Saudi elevation practice | Use Umm al-Qura method; expose fajr elevation correction/provenance. | Scholarly principle supports observer-visible sunset, but Saudi official city timetables are uniform. The "jama'ah unity" explanation is a plausible policy reading, not yet backed by a retrieved primary ruling. | Say "uniform Saudi city timetable practice" rather than overclaiming a formal rejection of elevation correction. |
| Local mosque buffers | Do not infer a universal correction from one mosque. | Mosques may add ihtiyat buffers, publish iqama rather than adhan, or carry stale Mawaqit settings. | Use multiple mosques or official sources before changing a default. Surface local variance as notes, not silent mutation. |
| Hijri calendars | `hijri()` defaults to Umm al-Qura tabular for ecosystem compatibility. | Diyanet, JAKIM, Morocco, local moonsighting committees, and actual hilal decisions can differ by a day. | Treat Hijri as calendar support, not a religious ruling. For Eid/Ramadan starts, follow local authority. |
| Egypt Cairo/Alexandria residuals | Egyptian method remains default. | Current train residuals suggest either fixture mismatch or local-source gap. | Keep default but track #69 before applying any Path A correction. |
| London Maghrib/Dhuhr residuals | UK/MoonsightingCommittee default remains. | The original #70 hypothesis (+5/+3 Mawaqit-vs-AlAdhan offset) is corpus-contaminated by a DST-encoding artifact: Mawaqit's yearly fixture stores times in GMT year-round, AlAdhan returns local (BST in summer). Winter shows a real +3-4 min Mawaqit signal; summer shows a -57 min artifact. See [London arbitration below](#london--maghribdhuhr-arbitration-verdict-fajr134) for the corrected verdict. | Track #70 + #134 for the corpus-normalization PR; do not tune the UK default until the BST-encoding fix lands. |
| India per-community split | Country default Karachi 18°/18°; per-city overrides where documented (Kerala, Lucknow). | India has ~204M Muslims with no single national Imsakiyya — four community traditions live in parallel. See [India section below](#india--per-community-tradition-split) for the full split. | Render `location.altMethods` when present; use city overrides for known communities; document that the country default is the dominant Hanafi-Deobandi position, not a universal Indian answer. |

## India — per-community tradition split

India is not a low-confidence region in the sense that the calculation is unclear; it's a region where there is no single national institutional Imsakiyya, and any country-level default necessarily picks one community tradition over the others. fajr's response is a Karachi country-default + per-city overrides where the documented institutional source diverges from that default.

The four parallel traditions, with institutional sources where retrievable:

| Community / region | Tradition | Institutional source | fajr default for the region | Override surface |
|---|---|---|---|---|
| **Hanafi-Deobandi (North India)** — UP, Bihar, Bengal, Maharashtra cities, the Hyderabadi Old City Deobandi communities | Karachi 18°/18° angles + Hanafi Asr (2× shadow). The University of Islamic Sciences, Karachi method is the South Asian regional reference. | Jamiat Ulema-e-Hind ([aimplb.org](https://aimplb.org/) is the broader AIMPLB body; Jamiat itself doesn't expose a canonical web Imsakiyya); also Darul Uloom Deoband (darululoom-deoband.com) as the foundational seminary. The Karachi method itself has no canonical methodology URL — see `docs/data-sources.md`. | Country default `Karachi` 18°/18°. fajr's adhan.js dispatch uses standard 1× Asr unless caller explicitly passes `madhab: 'hanafi'`. North Indian Hanafi-majority users SHOULD opt in to Hanafi Asr explicitly via the override surface. | `notes[]` flags the Hanafi-Asr-by-default-mismatch (per fajr#88 backlog). |
| **Shafi'i (Kerala / Mappila coast)** — Kerala, coastal Tamil Nadu (Labbay/Marakkayar), coastal Karnataka, Lakshadweep, parts of Andaman & Nicobar | Karachi 18°/18° angles + Shafi'i Asr (1× shadow). The Maqdumi tradition rooted in Ponnani; canonical via the [Samastha Kerala Jam-iyyathul Ulama](https://samastha.info/). | Samastha Kerala Jam-iyyathul Ulama publishes regional Imsakiyya for Kerala. Tamil Nadu coastal communities follow Samastha's method historically; no Tamil Nadu state body publishes a canonical Imsakiyya. | City-level overrides: **Kochi** → `KarachiShafi` (Karachi 18°/18° + Shafi'i Asr). Tamil Nadu coastal not yet covered with an override (see Chennai open question in `knowledge/wiki/regions/india.md`). | `altMethods` exposes the Shafi'i Asr alternative on covered cities. |
| **Twelver Shia (Sistani-aligned)** — Lucknow / Awadh (Bara Imambara, Chota Imambara), Hyderabad-Deccan, Kashmir (Imam Khomeini's followers), parts of Mumbai (Khoja Ithna Ashari) | Tehran-method-adjacent angles (17.7°/14° Tehran, or the Jafari Imsakiyya published by Sistani-aligned maraji'). | Twelver Shia communities in India don't have a single India-specific publisher; they follow the Najaf maraji' (Sistani's Imsakiyya at [sistani.org/english/data/2/](https://www.sistani.org/english/data/2/)) directly. Local Imambaras republish. | City-level override: **Lucknow** surfaces Tehran via `altMethods`. Other Twelver-Shia cities (Hyderabad-Deccan, Kashmir, Mumbai-Khoja) not yet covered with explicit overrides. | `altMethods` chip in Lucknow makes the Shia minority's alternative visible. |
| **Daudi Bohra (Tayyibi Isma'ili Shia)** — Mumbai/Maharashtra concentrated, Surat-Gujarat, Karachi (Pakistan)-area diaspora, Yemen-rooted | Distinct Bohra Imsakiyya — not Tehran-method-compatible. The Dawat-e-Hadiyah publishes per-city Bohra times via [thedawat.org](https://www.thedawat.org/) and the Saify-app calendar. Their method differs from both Sistani-Najaf Shia and Sunni Karachi. | Dawat-e-Hadiyah (the religious authority of the Daudi Bohra community), led by Syedna Mufaddal Saifuddin. | **Not yet covered** in fajr's altMethods surface. Bohra users in Mumbai currently get the Karachi country default, which differs from Bohra Imsakiyya. Tracking as an open follow-up; the Bohra Imsakiyya source needs scraping if community-specific accuracy is required. | Currently no per-city override; if a downstream app serves Bohra users specifically, recommend manually overriding with the Saify-app-derived offsets. |

This is not a low-confidence framing — it's an accurate description of a country where no single answer is correct. fajr#101 Layer 2 (multi-stance institutional registry) is the right future structural surface for this kind of multi-community ikhtilaf, but it is not shipped in v1.x today. Until that v2/research track lands, the current per-city override + `altMethods` pattern is the practical answer.

## London — Maghrib/Dhuhr arbitration verdict (fajr#134)

The original fajr#70 hypothesis: "AlAdhan-UK fixtures publish bare MoonsightingCommittee times; Mawaqit-London publishes with +5 Maghrib / +3 Dhuhr offsets per the Moonsighting Committee Worldwide convention. A Path A trade-off — any single dispatch decision closes one source's bias and opens the other."

**Empirical re-analysis of the v1.7.25-shipped corpus** (`eval/data/test/mawaqit-uk-yearly.json` + `eval/data/test/uk-aladhan-moonsighting-yearly.json`, 365 overlap days) reveals the corpus is contaminated by a DST-encoding artifact:

| Sample date | Mawaqit Maghrib | AlAdhan Maghrib | Mawaqit − AlAdhan diff |
|---|---|---|---|
| 2026-01-15 (winter, GMT) | 16:24 | 16:21 | **+3 min** ← real signal |
| 2026-03-15 (winter, GMT) | 18:08 | 18:05 | **+3 min** |
| 2026-05-15 (BST window) | 20:49 | 20:46 | **+3 min** |
| 2026-07-15 (BST) | 20:15 | 21:12 | **−57 min** ← artifact |
| 2026-09-15 (BST) | 18:19 | 19:15 | **−56 min** ← artifact |
| 2026-11-15 (winter, GMT) | 16:15 | 16:11 | **+4 min** |

**Diagnosis:** Mawaqit's yearly-calendar embedding stores times in **GMT year-round** (no DST shift); AlAdhan API returns local-clock times (BST during summer, GMT in winter). During the BST window, this produces a 60-minute artifact that swamps the real Mawaqit-vs-AlAdhan signal.

**Real signal (winter + BST-spring before the DST artifact dominates):** Mawaqit-London is **+3 to +4 min LATER** than AlAdhan MoonsightingCommittee on Maghrib. This is the original fajr#70 +5 Path A hypothesis, attenuated and slightly smaller than originally estimated — but the sign is the same as #70 claimed.

**Verdict:** The original fajr#70 hypothesis (Mawaqit-London applies a small +3-5 min Maghrib offset over bare AlAdhan MoonsightingCommittee) is **confirmed** once the corpus DST artifact is excluded. fajr's current UK dispatch matches Mawaqit (+5 / +3 buffers applied), so the institutional position fajr defaults to is the right one — but the corpus the analysis was done on (in v1.7.25 yearly fixtures) needs fixing before the analysis can be trusted across all seasons.

**What unblocks fajr#70 closure + UK promotion from C → B:**

1. **Re-fetch `mawaqit-uk-yearly.json` with explicit BST normalization** — either modify `scripts/fetch-mawaqit-yearly.js` to convert the embedded GMT times to `Europe/London` local-clock (matches AlAdhan and most consumers), or annotate the fixture explicitly as "GMT year-round" and have the eval normalize at compare-time. Filed as separate corpus-quality issue (fajr#134-followup).
2. **Verify the +3-4 min winter signal across all 5 UK mosques** (London, Manchester, Birmingham, Leicester, Bradford) — current analysis is London-only. If all 5 show the same +3-4 min signal, that's stronger support for fajr#70's Path A.
3. **Cross-validate against a third source** — MCB published Imsakiyya, East London Mosque institutional times, or JIMAS UK Astronomical Committee guidance. Currently the only sources are Mawaqit (mosque-published, with the DST encoding issue) and AlAdhan (calc-preset, no local ihtiyat). A third institutional reference would resolve any remaining ambiguity.

**UK confidence-grade trajectory:** Currently C. The corpus-fix + third-source-validation path described above moves UK to B per the [Promotion Criteria](positions.md#promotion-criteria). For now, UK stays C until the BST-encoding fix lands and the +3-4 min signal is verified across all 5 UK mosques.

## Contributor Rules

- Do not collapse disagreement into a silent default.
- Do not promote a paper-only or math-only idea into a city default without
  local timetable validation.
- Do not average noisy mosque data until it looks good. First identify whether
  the source is adhan time, iqama time, stale settings, or a local buffer.
- Use `notes[]` and `validityWarnings[]` for user-visible caveats.
- Use [docs/positions.md](positions.md) when a disagreement has matured into a
  clear product position.

## Related Docs

- [Position registry](positions.md)
- [CALIBRATION.md](../CALIBRATION.md)
- [Data sources](data-sources.md)
- [Elevation correction](../knowledge/wiki/corrections/elevation.md)
