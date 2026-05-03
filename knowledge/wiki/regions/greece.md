# Greece — prayer-time conventions

## Institutional reference body
- **Name:** Three regional muftiates of Western Thrace — **Mufti of Komotini** (Müftülük Kümülcine), **Mufti of Xanthi** (Müftülük İskeçe), and **Mufti of Didymoteicho** (Müftülük Dimetoka). Outside Western Thrace, the **Athens Mosque** (Masjid al-Andalus, Votanikos, opened 2020) is the only institutional mosque, governed independently of the Western Thrace muftiates.
- **URL:** Mufti of Komotini: https://www.muftikomotinis.gr/ ; Mufti of Xanthi: http://www.iskecemuftulugu.org/ ; Athens Mosque governance is via the Greek Ministry of Education and Religious Affairs (no dedicated portal).
- **Population served:** ~520,000 Muslims (~5% of Greece's ~10.5M total — Western Thrace Muslim Minority ~110,000 (Pomak / Turkish / Roma); recent Muslim immigrant populations in Athens, Thessaloniki, the Dodecanese ~400,000+)
- **Madhab(s):** Sunni Hanafi (Western Thrace, Ottoman heritage); Sunni Maliki / Hanafi (recent immigrant communities); Bektashi Sufism (small)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Turkey` (Diyanet 18°/17° + Diyanet preset offsets, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** Diyanet preset (`sunrise -7, dhuhr +5, asr +4, maghrib +7, isha 0`)
- **Classification:** 🟡→🟢 Approaching established

## Why this method
The Western Thrace Muslim minority's three muftiates (Komotini, Xanthi, Didymoteicho) inherited their institutional convention from the **Ottoman / Diyanet Hanafi** tradition, codified in the **Treaty of Lausanne (1923)** Greek-Turkish-Bulgarian bilateral framework which exempted the Western Thrace Muslim minority from the population exchange and granted continuing institutional autonomy. Aladhan API confirms this with **method 13 (Diyanet)** as the default routing for `GR`.

The Athens Mosque (opened December 2020 after a 175-year gap) is institutionally separate and serves the recent immigrant Muslim community. It does not publish a divergent national preset; the broader Greek Muslim community defaults to the Diyanet convention.

The Hanafi Asr routing is essential for the Western Thrace community — Pomak and ethnic-Turkish Muslims uniformly observe Hanafi Asr (2× shadow).

## Known points of ikhtilaf within the country
- **Western Thrace Muslim minority vs. recent Muslim immigrant population** — institutional structures differ, but methodological alignment around Diyanet 18°/17° appears consistent.
- **Mufti of Komotini** is the senior of the three muftiates; their Imsakiyya is treated as the de facto reference for the Western Thrace community.
- **Pomak Bulgarian-speaking Muslims in the northern Rhodopes** — same Diyanet convention as the Bulgarian Muslim community across the border.

## Sources
- Mufti of Komotini: https://www.muftikomotinis.gr/
- Mufti of Xanthi: http://www.iskecemuftulugu.org/
- Treaty of Lausanne (1923) framework — Wikipedia: https://en.wikipedia.org/wiki/Treaty_of_Lausanne
- Aladhan API method 13 (Diyanet) regional default for `GR`: https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
