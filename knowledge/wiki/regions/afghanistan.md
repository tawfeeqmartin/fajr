# Afghanistan — prayer-time conventions

## Institutional reference body
- **Name:** Ministry of Hajj and Religious Affairs (Wizārat-e Hajj wa Awqāf wa Iršād); also Office of the Mufti
- **URL:** https://hajj.gov.af/ (intermittently available since 2021)
- **Population served:** ~42M (≈99% Muslim; roughly 85% Sunni Hanafi, 10% Twelver Shi'a — primarily Hazara, plus Ismaili minority)
- **Madhab:** Sunni Hanafi (majority); Twelver Jafari and Ismaili minorities

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Karachi` (18°/18°, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** none
- **Classification:** 🟢 Established (regional convention)

## Why this method
Afghanistan is documented in the **Karachi cluster** per ITL/arabeyes regional method-info — Hanafi-majority country sharing the South Asian 18°/18° + Hanafi Asr convention with Pakistan and Bangladesh. Multi-app consensus aligns Kabul, Kandahar, Herat, and Mazar-i-Sharif with Karachi.

## Known points of ikhtilaf within the country
- **Hazara Twelver Shi'a community** (Bamiyan, Daikundi, west Kabul / Dasht-e-Barchi) — follows the Jafari Maghrib timing convention (Tehran-style); not currently differentiated in fajr.
- **Ismaili minority** — follows distinct conventions; not differentiated.

## Open questions
- A v1.7.0 city-override list for Hazara-majority districts (Bamiyan, Yakawlang, Daikundi, Behsud) would route those coordinates to Tehran method.

## Sources
- Afghanistan Ministry of Hajj and Religious Affairs: https://hajj.gov.af/
- ITL/arabeyes regional-cluster documentation
- Aladhan API regional-default routing for `AF`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
