# Sri Lanka — prayer-time conventions

## Institutional reference body
- **Name:** All Ceylon Jamiyyathul Ulama (ACJU)
- **URL:** https://acju.lk/
- **Population served:** ~2.1M Muslims (~10% of Sri Lanka's ~22M total — predominantly Sri Lankan Moors, plus Malay and Memon minorities)
- **Madhab:** Sunni Shafi'i (overwhelmingly — Moor community); Hanafi (Indian-origin Memon community); Twelver Shi'a (small Bohra minority)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Karachi` (18°/18°, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Hanafi (2× shadow) — *note: Sri Lanka is majority Shafi'i; this may be a mismatch*
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
ACJU is Sri Lanka's primary Sunni religious authority, established in 1924 and headquartered in Colombo. ACJU publishes Ramadan Imsakiyya and recommends adhan timings; aligned with the broader **South Asian regional Karachi 18°/18° convention** for the angle pair. However, Sri Lanka's Sunni majority is Shafi'i (1× shadow Asr), not Hanafi (2× shadow Asr) — using `adhan.CalculationMethod.Karachi()` produces a Hanafi-Asr output that is ~30–60 minutes later than the institutional Shafi'i convention.

This is a known limitation; a future refinement should switch Sri Lanka to `Other` with explicit Standard Asr if ACJU's published Imsakiyya confirms.

## Known points of ikhtilaf within the country
- **Shafi'i Moor majority** vs. **Hanafi Memon minority** — Asr time difference (Shafi'i 1× shadow earlier; Hanafi 2× shadow later).
- **Bohra and Twelver Shi'a minorities** — follow their own conventions; not currently differentiated.

## Open questions
- **Asr school mismatch** — Karachi preset is Hanafi Asr; Sri Lanka majority is Shafi'i (Standard Asr). Needs verification against ACJU Imsakiyya + fix.
- Citation pending — primary-source verification from ACJU pending.

## Sources
- All Ceylon Jamiyyathul Ulama: https://acju.lk/
- Aladhan API regional-default routing for `LK`
- Multi-app convention (Muslim Pro Colombo)

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
