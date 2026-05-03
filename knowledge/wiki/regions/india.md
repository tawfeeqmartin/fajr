# India — prayer-time conventions

## Institutional reference body
- **Name:** All India Muslim Personal Law Board (AIMPLB); Jamiat Ulema-e-Hind (Hanafi Deobandi); Samastha Kerala Jem-iyyathul Ulama (Sunni Shafi'i, Kerala)
- **URL:** AIMPLB: https://aimplb.org/ ; Samastha: https://samastha.info/
- **Population served:** ~204M Muslims (2nd-largest Muslim population in the world, ~14% of India)
- **Madhab:** Multi-madhab — Hanafi-majority (North India, Deobandi/Bareilvi), Shafi'i-majority (Kerala, coastal Tamil Nadu, parts of Karnataka), Twelver Shia (Lucknow / Awadh / Nawabi heritage; ~10% of total)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Karachi` (18°/18°)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard (Shafi) — adhan.js default; matches Kerala/coastal-South-India Shafi'i majority. North Indian Hanafi callers should pass `method: 'Karachi'` and explicitly set `madhab: 'hanafi'` (see "Open questions" below).
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (multi-method country)

## Why this method
India's 204M Muslims do not have a single uniform national timetable. The country dispatches to Karachi 18°/18° because:
- North India (UP, Bihar, Bengal, Maharashtra cities): predominantly Hanafi Deobandi or Bareilvi; Karachi 18°/18° is the South Asian regional convention via the University of Islamic Sciences, Karachi reference.
- South India coastal (Kerala, Tamil Nadu Labbay/Marakkayar, coastal Karnataka): predominantly Shafi'i (per Mappila/Samastha tradition rooted in Arab-trader settlement; Maqdumis of Ponnani popularized Shafi'i in Kerala). Same 18°/18° angles, but Shafi'i Asr (shadow = 1× object).
- Lucknow / Awadh: significant Twelver Shia minority (Bara Imambara, Chota Imambara) following Sistani-style Imsakiyya — surfaced via the Lucknow city-override `altMethods`.

## Known points of ikhtilaf within the country
- **Hanafi vs Shafi'i Asr school** — the dominant ikhtilaf. Shafi'i Asr is ~30–60 min earlier than Hanafi Asr.
- **Sunni vs Shia** — Lucknow is the principal Twelver Shia centre; the rest of UP, Maharashtra, Hyderabad, Karachi-area diaspora have smaller Shia minorities. Shia communities follow Sistani/Najaf maraji' Imsakiyya which numerically resembles Tehran-method timing.
- **Within Sunni** — Deobandi (literalist Hanafi), Bareilvi (Sufi Hanafi), Ahl-e-Hadith (anti-madhab), Salafi all coexist with theological differences but use the same angle convention.

## City-level overrides (active in fajr v1.7.x)
- **Lucknow** (UP) → Karachi 18°/18° + Hanafi Asr (explicit traceability via AIMPLB; altMethods surfaces Tehran for the Shia population)
- **Kochi** (Kerala) → KarachiShafi (Karachi 18°/18° + Shafi Asr) — Samastha Kerala / Mappila Sunni Shafi'i

## Open questions
- **Chennai (Tamil Nadu) — research not yet conclusive (v1.7.2 status):** Tamil Nadu is multi-madhab. Coastal communities (Labbay, Marakkayar) are Shafi'i; inland communities (Rowther) are Hanafi (per Tamil Muslim ethno-religious literature). No institutional Imsakiyya source located that pins a single method. **No override shipped in v1.7.2.** A future v1.7.3+ could add altMethods to expose both Shafi-coastal and Hanafi-inland conventions.
- The Karachi country-default uses adhan.js's class-level Shafi'i Asr default. North Indian Hanafi callers (the majority of India's Muslims) currently inherit Shafi'i Asr unless they explicitly opt-in to Hanafi Asr. A v1.8.0 follow-up could surface this via `notes[]` (per [[wiki/issues/issue-39-hanafi-asr-ikhtilaf]]).

## Sources
- AIMPLB: https://aimplb.org/
- Samastha Kerala Jem-iyyathul Ulama: https://samastha.info/
- Aladhan API regional-default routing for `IN`: https://aladhan.com/calculation-methods
- IslamicFinder Lucknow / Kerala state defaults (cross-reference): University of Islamic Sciences Karachi method

## Last reviewed
- 2026-05-03 by fajr-agent (v1.7.2 initial creation; Lucknow + Kochi city-overrides shipped, Chennai pending deeper research)
