# Nepal — prayer-time conventions

## Institutional reference body
- **Name:** **Nepal Muslim Federation** / **Nepal Islamic Sangh** — Kathmandu-based community institutional bodies
- **URL:** Nepal Muslim Federation: information sparse online
- **Population served:** ~1.4M Muslims (~4.4% of Nepal's ~31M total — predominantly **Madhesi Muslims** (Indian-origin, Hindi/Urdu/Nepali-speaking) in the Terai (southern lowlands — Kapilvastu, Banke, Bara, Parsa, Rautahat, Sarlahi, Mahottari, Dhanusha, Siraha, Saptari districts), plus Kashmiri Muslims (Kathmandu valley historic merchants, ~3,000), and small Tibetan-Muslim community)
- **Madhab(s):** Sunni Hanafi (Madhesi institutional inheritance via Indian regional Hanafi convention); Sunni Shafi'i (small Kashmiri merchant community); Twelver Shi'a (small Madhesi minority)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Karachi` (18°/18° Hanafi-Asr)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** none
- **Classification:** 🟢 Established (South Asian regional Hanafi convention)

## Why this method
Aladhan API defaults Nepal (`NP`) to **Karachi 18°/18°** per South Asian regional convention. The Madhesi Muslim majority is institutionally aligned with Indian Hanafi convention (AIMPLB / Jamiat Ulema-e-Hind) via cross-border cultural-linguistic continuum with Bihar / Uttar Pradesh. Karachi is the documented multi-app default.

## Known points of ikhtilaf within the country
- **Madhesi (Madheshi) majority** — Indian-Bihari / Uttar-Pradesh-origin Hanafi institutional convention.
- **Kashmiri merchants** — small Shafi'i community with distinct institutional inheritance.
- **Twelver Shi'a Madhesi minority** — Tehran-style institutional convention; users may prefer manual `method: 'Tehran'` override.

## Sources
- Aladhan API regional default for `NP` (Karachi): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
