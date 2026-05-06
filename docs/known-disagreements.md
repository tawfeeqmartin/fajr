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
