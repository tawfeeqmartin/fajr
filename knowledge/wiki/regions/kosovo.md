# Kosovo — prayer-time conventions

## Institutional reference body
- **Name:** Bashkësia Islame e Kosovës (BIK / Islamic Community of Kosovo)
- **URL:** https://bislame.com/ ; daily prayer times: https://bislame.net/namazet/ ; Takvim calendar: https://bislame.net/takvimi/
- **Population served:** ~1.8M Muslims (~96% of Kosovo's total population)
- **Madhab:** Sunni Hanafi (Ottoman-era institutional inheritance)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Turkey` (Diyanet, 18°/17° + Diyanet preset offsets, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** Diyanet preset (`sunrise -7, dhuhr +5, asr +4, maghrib +7, isha 0`)
- **Classification:** 🟢 Established

## Why this method
This was a v1.6.0 classification-audit correction. Previously fajr routed Kosovo to `MuslimWorldLeague`. The audit identified that BIK's institutional convention is the **Diyanet calendar** — Hanafi Asr (2× shadow) + Diyanet preset offsets — reflecting Ottoman-era Hanafi inheritance and ongoing institutional ties with Turkey. The publicly-archived BIK Takvim ([drilonjaha/kohet-e-namazit-kosove-json](https://github.com/drilonjaha/kohet-e-namazit-kosove-json)) on GitHub confirms BIK publishes Takvim-style times consistent with Diyanet's published outputs for Pristina, Prizren, and Mitrovica.

The Hanafi Asr correction is essential: routing Kosovo to MWL would publish Standard Asr (1× shadow), ~30–60 min earlier than what BIK's Hanafi-Asr Takvim publishes — a meaningfully different prayer-time output for the Asr window.

## Known points of ikhtilaf within the country
- None known at the national institutional level. BIK's Takvim is uniformly observed across Kosovo's mosques.

## Sources
- Bashkësia Islame e Kosovës: https://bislame.com/
- BIK daily prayer times: https://bislame.net/namazet/
- BIK Takvim calendar: https://bislame.net/takvimi/
- BIK official Takvim mirrored as JSON: https://github.com/drilonjaha/kohet-e-namazit-kosove-json
- v1.6.0 classification audit: `autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
