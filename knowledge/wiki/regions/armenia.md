# Armenia — prayer-time conventions

## Institutional reference body
- **Name:** No single national Muslim institutional body. The **Yerevan Blue Mosque** (Կապույտ մզկիթ / Göy Məscid, originally an 18th-century Persian-era foundation) is administered by the Iranian embassy in Yerevan and serves as the only functioning historical mosque in the country.
- **URL:** Yerevan Blue Mosque (Iranian Cultural Centre): no current independent portal; managed via the Iranian embassy https://yerevan.mfa.ir/
- **Population served:** ~1,000–3,000 active Muslims (~0.05% of Armenia's ~3M total — mostly Iranian residents/students, small Yazidi-adjacent Kurdish Sunni community in Yerevan, Lebanese-Armenian Sunni descendants)
- **Madhab(s):** Twelver Shi'a (Iranian residents, Blue Mosque); Sunni Hanafi historically (Ottoman-era Azeri/Tatar inheritance, now near-zero); Yazidis (~1.3% of population, follow Yazidi religion not Islam — out of fajr scope)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Turkey` (Diyanet 18°/17° + Diyanet preset offsets, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** Diyanet preset (`sunrise -7, dhuhr +5, asr +4, maghrib +7, isha 0`)
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Armenia (`AM`) to **method 13 (Diyanet)**, reflecting historical Ottoman Hanafi inheritance and ongoing Diyanet institutional reach into the Caucasus via the Turkish state's regional religious diplomacy. fajr follows this Aladhan default for the country case.

Note that this routing is somewhat anomalous given Armenia's actual Muslim demographic (predominantly Iranian Shi'a in the Blue Mosque community), where **Tehran method (17.7°/14°)** would be institutionally more accurate. The Diyanet routing is preserved for v1.6.2 as the Aladhan-aligned default; v1.6.3+ may revisit if direct Iranian-embassy / Blue Mosque Imsakiyya becomes available.

## Known points of ikhtilaf within the country
- **Yerevan Blue Mosque (Iranian Shi'a)** — institutionally aligned with Tehran method via Iranian embassy administration. Users at Blue Mosque coordinates may prefer manual `method: 'Tehran'` override.
- **Sunni Hanafi inheritance (near-zero living community)** — historical Diyanet alignment via Ottoman heritage; the routing reflects this rather than the present Iranian-Shi'a reality.

## Open questions
- Citation pending — currently Aladhan-aligned per v1.6.2 audit; primary-source verification from the Yerevan Blue Mosque or Armenian-Iranian cultural authority pending. v1.6.3+ candidate for re-routing to Tehran method if Blue Mosque is the dominant active institution.

## Sources
- Iranian embassy in Yerevan: https://yerevan.mfa.ir/
- Aladhan API regional-default routing for `AM` (method 13 Diyanet): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
