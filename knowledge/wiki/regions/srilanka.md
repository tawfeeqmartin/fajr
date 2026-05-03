# Sri Lanka — prayer-time conventions

## Institutional reference body
- **Name:** All Ceylon Jamiyyathul Ulama (ACJU)
- **URL:** https://acju.lk/
- **Population served:** ~2.1M Muslims (~10% of Sri Lanka's ~22M total — predominantly Sri Lankan Moors, plus Malay and Memon minorities)
- **Madhab:** Sunni Shafi'i (overwhelmingly — Moor community); Hanafi (Indian-origin Memon community); Twelver Shi'a (small Bohra minority)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Karachi` (18°/18°) with explicit `madhab = Madhab.Shafi`
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard (Shafi, 1× shadow length) — set explicitly in `selectMethod()` since v1.7.1
- **Special offsets:** none
- **Classification:** 🟡→🟢 Approaching established (regional convention + Aladhan default; ACJU primary-source citation pending)

## Why this method
ACJU is Sri Lanka's primary Sunni religious authority, established in 1924 and headquartered in Colombo. ACJU publishes Ramadan Imsakiyya and recommends adhan timings; aligned with the broader **South Asian regional Karachi 18°/18° convention** for the angle pair. Sri Lanka's Sunni majority is Shafi'i (1× shadow Asr), not Hanafi.

The Aladhan API default for Colombo is method 1 (`Karachi`, "University of Islamic Sciences, Karachi"), with `school=STANDARD` (Shafi Asr) — verified via `https://api.aladhan.com/v1/timingsByCity?city=Colombo&country=Sri+Lanka` on 2026-05-02. This matches ACJU's Shafi-majority convention.

**v1.7.1 fix (issue #26):** Earlier versions of this page incorrectly claimed `adhan.CalculationMethod.Karachi()` ships Hanafi Asr (2× shadow) — but adhan-js's `Karachi()` actually defaults to `Madhab.Shafi`. The shipped Asr time has always been the Shafi-majority value; v1.7.1 makes the madhab assignment explicit in `selectMethod()` so future adhan-js default changes don't silently break the population.

## Known points of ikhtilaf within the country
- **Shafi'i Moor majority** vs. **Hanafi Memon minority** — Asr time difference (Shafi'i 1× shadow earlier; Hanafi 2× shadow later, ~30–60 min depending on latitude/season).
- **Bohra and Twelver Shi'a minorities** — follow their own conventions; not currently differentiated.
- A future v1.7.x city-level override could route Memon-community mosques (predominantly in Colombo's Pettah district + select pockets) to a Hanafi-Asr variant.

## Resolution log
- **2026-05-02 (v1.7.1)** — Asr-school open question resolved. adhan-js's `CalculationMethod.Karachi()` already defaults to `Madhab.Shafi`, so no behavior change for Colombo Asr; the v1.7.1 fix made the Shafi madhab explicit in the dispatch. Aladhan default for Colombo verified as method 1 (Karachi) + Standard Asr (Shafi). Memon-Hanafi minority noted for potential future city-level override.

## Sources
- All Ceylon Jamiyyathul Ulama: https://acju.lk/
- Aladhan API regional-default routing for `LK` — verified 2026-05-02: `method=1 (Karachi, 18°/18°)`, `school=STANDARD (Shafi)`
- Multi-app convention (Muslim Pro Colombo, IslamicFinder)

## Last reviewed
- 2026-05-02 by fajr-agent (v1.7.1 — Asr-school resolution per issue #26)
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
