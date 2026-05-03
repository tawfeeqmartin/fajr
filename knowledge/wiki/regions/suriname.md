# Suriname — prayer-time conventions

## Institutional reference body
- **Name:** **Surinaamse Islamitische Vereniging (SIV)** — Paramaribo-based, founded 1929, the institutional body for Indo-Surinamese Hanafi Muslim affairs; **Surinaamse Moeslim Associatie (SMA)** — institutional body for Javanese-Surinamese Shafi'i Muslim affairs; **Federatie Islamitische Gemeente in Suriname (FIGS)** — peak coordinating body
- **URL:** SIV: https://siv.sr/ (community portal); SMA: institutional info via FIGS
- **Population served:** ~80,000–100,000 Muslims (~14–18% of Suriname's ~600,000 total — predominantly **Javanese-origin** Muslims (~60%, post-Dutch-colonial migration from Java) and **Indian-origin (Indo-Surinamese)** Muslims (~40%, indentured-labor diaspora from Bihar / Uttar Pradesh); concentrated in Paramaribo, Wanica, Commewijne)
- **Madhab(s):** **Sunni Shafi'i** (Javanese-origin majority via Indonesian / SE Asian regional convention); **Sunni Hanafi** (Indian-origin via Pakistani / Indian institutional ties)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent — **deviation flagged for v1.6.3** (Aladhan-aligned default; bifurcated institutional alignment — SIV Hanafi → Karachi, SMA Javanese → JAKIM/Singapore)

## Why this method
Aladhan API defaults Suriname (`SR`) to MWL. **The Surinamese Muslim community is institutionally bifurcated**:
- **Indo-Surinamese (SIV)** — Hanafi via Pakistani / Indian institutional ties; canonically Karachi 18°/18°.
- **Javanese-Surinamese (SMA)** — Shafi'i via Indonesian institutional ties; canonically JAKIM/Singapore 20°/18°.

A single country-level dispatch cannot honor both institutional alignments. fajr's MWL routing represents the multi-institution compromise per Aladhan's default; v1.6.3+ may revisit with city-level overrides for Indo-Surinamese vs. Javanese-Surinamese majority neighborhoods.

## Known points of ikhtilaf within the country
- **SIV (Indo-Surinamese Hanafi)** — Karachi institutional alignment; users may prefer manual `method: 'Karachi'` and `madhab: 'Hanafi'` overrides.
- **SMA (Javanese-Surinamese Shafi'i)** — JAKIM/Singapore institutional alignment via Indonesian regional ties; users may prefer manual `method: 'MUIS'` override.
- **Surinamese-Javanese Muslims** notably observe Indonesian-origin practices including specific KEMENAG / NU institutional traditions; this is one of the longest-standing Indonesian-Muslim diaspora communities outside Indonesia.

## Open questions
- **v1.6.3 candidate** for re-routing — possibly via city-level Paramaribo / Wanica overrides differentiating Indo-Surinamese vs. Javanese-Surinamese majority neighborhoods, or by adopting Karachi as the country default given SIV is the institutionally-larger Hanafi-aligned body.

## Sources
- Surinaamse Islamitische Vereniging: https://siv.sr/
- Aladhan API regional default for `SR` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`
- v1.6.2 implementation log (deviation flag): `autoresearch/logs/2026-05-02-v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
