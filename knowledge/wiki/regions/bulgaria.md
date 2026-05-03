# Bulgaria — prayer-time conventions

## Institutional reference body
- **Name:** Главно Мюфтийство на Република България (Glavno Myuftiystvo na Republika Bulgaria — Chief Mufti's Office of the Republic of Bulgaria), Sofia
- **URL:** https://www.grandmufti.bg/ ; daily prayer times via the Office's regional muftiates (Sofia, Plovdiv, Kardzhali, Razgrad, Shumen, Smolyan, Burgas, Haskovo)
- **Population served:** ~700,000–1M Muslims (~10% of Bulgaria's ~6.5M total — concentrated in the Rhodope Mountains (Pomak Bulgarian-speaking Muslims), Kardzhali, Razgrad, Shumen, Burgas; ethnic Turks in Ludogorie and Eastern Rhodopes)
- **Madhab(s):** Sunni Hanafi (predominant — Ottoman heritage); small Sufi orders (Bektashi, Naqshbandi)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Turkey` (Diyanet 18°/17° + Diyanet preset offsets, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** Diyanet preset (`sunrise -7, dhuhr +5, asr +4, maghrib +7, isha 0`)
- **Classification:** 🟡→🟢 Approaching established

## Why this method
The Chief Mufti's Office of Bulgaria publishes regional Imsakiyya across all eight regional muftiates, using the **Diyanet 18°/17° Hanafi-Asr** convention. This reflects Bulgaria's deep **Ottoman Hanafi institutional inheritance** — the Bulgarian Muslim community institutional structure was established under Ottoman rule and maintained through the post-1878 Bulgarian state, with ongoing institutional ties to Diyanet via Turkey's diaspora religious diplomacy. Aladhan API confirms this with **method 13 (Diyanet)** as the default routing for `BG`.

The Hanafi Asr routing is essential — Pomak and Turkish-Bulgarian communities universally observe Hanafi Asr (2× shadow); routing Bulgaria to MWL would publish Standard Asr (1× shadow), materially divergent from what Bulgarian mosques publish.

## Known points of ikhtilaf within the country
- **Pomak (Bulgarian-speaking Muslim) vs. Turkish-Bulgarian communities** — both follow the same Diyanet/Hanafi institutional convention via the Chief Mufti's Office; no methodological split.
- **Bektashi and Sufi orders** (small, mainly Rhodope Mountains) — observe the same five-prayer timetable; no separate Imsakiyya.
- **Communist-era institutional discontinuity (1944–1989)** — religious institutions were heavily suppressed; the post-1989 reconstitution of the Chief Mufti's Office reaffirmed the Diyanet/Hanafi inheritance.

## Sources
- Chief Mufti's Office of Bulgaria: https://www.grandmufti.bg/
- Aladhan API method 13 (Diyanet) regional default for `BG`: https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
