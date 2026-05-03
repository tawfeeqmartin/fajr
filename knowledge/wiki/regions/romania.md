# Romania — prayer-time conventions

## Institutional reference body
- **Name:** **Muftiatul Cultului Musulman din România** (Muftiate of the Muslim Faith in Romania) — Constanța-based, the state-recognized institutional body for Romania's historic **Tatar / Turkish Dobruja** Muslim community
- **URL:** Muftiatul: https://www.muftiyat.ro/ ; daily prayer times via Constanța muftiate
- **Population served:** ~64,000 Muslims (~0.3% of Romania's ~19M total — predominantly **Crimean Tatar / Lipovan-Tatar / Nogai** (continuous presence in Dobruja since 13th-14th century Mongol/Ottoman period) and **Turkish-Romanian**, concentrated in Constanța / Tulcea / Dobrogea region; small modern diaspora — Arab, Pakistani, Bangladeshi-origin)
- **Madhab(s):** Sunni Hanafi (Tatar / Turkish Dobruja heritage via Ottoman institutional inheritance — Romania's continuous tradition is one of the oldest in Europe outside the Balkans)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; Tatar/Turkish Dobruja Diyanet-Hanafi institutional alignment would suggest Diyanet method — flagged for v1.6.3)

## Why this method
Aladhan API defaults Romania (`RO`) to MWL. The Tatar / Turkish Dobruja community is institutionally Sunni Hanafi via Ottoman institutional inheritance — Diyanet 18°/17° + Hanafi Asr would be more institution-aligned. The Muftiatul Cultului Musulman has not published a divergent national preset endorsing MWL by name; the Aladhan default reflects regional convention rather than primary-source institutional declaration.

## Known points of ikhtilaf within the country
- **Tatar / Turkish Dobruja institutional convention** — Hanafi via Ottoman inheritance. Users may prefer manual `method: 'Diyanet'` and `madhab: 'Hanafi'` overrides at Constanța/Tulcea/Dobrogea-region mosques.
- **Continuous tradition since 13th century** — Romania's Tatar Muslim institutional presence predates the Ottoman period via Golden Horde / Crimean Khanate connections; this is one of the oldest continuous European Muslim institutional traditions outside the Balkans.

## Open questions
- v1.6.3+ candidate for re-routing to Diyanet method per Tatar/Turkish Dobruja Hanafi institutional convention.

## Sources
- Muftiatul Cultului Musulman din România: https://www.muftiyat.ro/
- Aladhan API regional default for `RO` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
