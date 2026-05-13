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
| Asr convention vs legal madhhab | Return `location.asrConvention` separately from `applied.asrSchool`. Deprecated `madhab` aliases remain for compatibility. | A country can be Hanafi-majority while a particular published timetable or API fixture uses standard 1x Asr. Morocco is Maliki but uses standard Asr; this is not "Shafi'i madhhab." | Render Asr convention, not "madhhab." Let users override when their mosque uses a different Asr start. |
| Morocco formal angle vs published practice | Single canonical Morocco official-timetable calibration. | Formal descriptions and empirical reproduction may not line up cleanly as raw angles. Habous published tables are the authority; Mawaqit supports real mosque practice. | Describe as "Morocco official timetable calibration," not as a bare angle claim. |
| Elevation for Shuruq/Maghrib | Apply geometric horizon-dip correction when elevation is resolved from the city registry or explicitly supplied. Allow opt-out with `elevation: 0`. | UAE and Malaysia apply elevation in modern institutional settings. Saudi published city timetables remain uniform for Makkah/Madinah; retrieved sources do not yet give a primary policy text explaining the rationale. | Show the correction amount and let users follow local mosque practice. Do not adjust Fajr/Isha for elevation. |
| Fajr/Isha elevation and atmosphere | No elevation correction to Fajr/Isha. | Atmospheric scattering at altitude may affect observed twilight, but fajr does not have a sufficiently grounded institutional rule to alter Fajr/Isha angles. | Leave unchanged and document as open research. |
| High-latitude summers | Use high-latitude adjustment rules and emit validity warnings where windows become synthetic or polar. | Local councils differ on nearest-city, middle-of-night, one-seventh, and angle-based approaches. | Render `validityWarnings[]` and encourage local mosque/council override. |
| Saudi elevation practice | Use Umm al-Qura method; expose fajr elevation correction/provenance. | Scholarly principle supports observer-visible sunset, but Saudi official city timetables are uniform. The "jama'ah unity" explanation is a plausible policy reading, not yet backed by a retrieved primary ruling. | Say "uniform Saudi city timetable practice" rather than overclaiming a formal rejection of elevation correction. |
| Local mosque buffers | Do not infer a universal correction from one mosque. | Mosques may add ihtiyat buffers, publish iqama rather than adhan, or carry stale Mawaqit settings. | Use multiple mosques or official sources before changing a default. Surface local variance as notes, not silent mutation. |
| Hijri calendars | `hijri()` defaults to Umm al-Qura tabular for ecosystem compatibility. | Diyanet, JAKIM, Morocco, local moonsighting committees, and actual hilal decisions can differ by a day. | Treat Hijri as calendar support, not a religious ruling. For Eid/Ramadan starts, follow local authority. |
| Egypt Cairo/Alexandria residuals | Egyptian method remains default. | Current train residuals suggest either fixture mismatch or local-source gap. | Keep default but track #69 before applying any Path A correction. |
| London Maghrib/Dhuhr residuals | UK/MoonsightingCommittee default remains. | Mawaqit London and calc references diverge enough to justify further investigation. | Track #70; do not tune until source arbitration is clear. |
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

This is not a low-confidence framing — it's an accurate description of a country where no single answer is correct. fajr#101 Layer 2 (multi-stance institutional registry) is the right structural surface for this kind of multi-community ikhtilaf; until that ships, the current per-city override + `altMethods` pattern is the practical answer.

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
