# France — prayer-time conventions

## Institutional reference body

- **Name:** UOIF (Union des Organisations Islamiques de France, since renamed Musulmans de France) — historical institutional reference for French Muslim prayer-time conventions
- **Secondary:** Conseil Français du Culte Musulman (CFCM) — federation of French Muslim organizations; Grande Mosquée de Paris (GMP) — historical Algerian-affiliated institutional anchor; CIL Lisboa — Portuguese partner reference for the Iberian convention.
- **URL:** UOIF / MdF: https://www.musulmansdefrance.fr/ ; CFCM: (institution dissolved 2022); GMP: https://www.mosqueedeparis.net/
- **Population served:** ~5-6M Muslims (~8-9% of France's ~67M total — the largest Muslim population in any EU country)
- **Madhab:** Multi-madhab — Maghrebi diaspora dominant (Algerian, Moroccan, Tunisian Maliki + Hanafi minorities); West African (Senegalese Maliki, Malian/Mauritanian Maliki); Turkish diaspora (Hanafi via Diyanet-affiliated mosques); Pakistani-Bangladeshi diaspora (Hanafi via Karachi method).

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Other` with custom angles — fajr dispatches via the UOIF preset (12°/12°)
- **Fajr angle:** 12° (UOIF historical convention — significantly shallower than MWL 18°)
- **Isha angle:** 12° (UOIF historical convention — symmetric with Fajr)
- **Asr school:** Standard (1× shadow)
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (UOIF 12°/12° is institutionally used by many French mosques but not universally; per-community within France varies — see ikhtilaf below)

## Why this method

The 12°/12° angle pair is the **UOIF historical convention** — used in many French mosques' published Imsakiyyas. The shallower angles (vs MWL's 18°) reflect a high-latitude accommodation: at France's 42-51°N latitude range, deeper depression angles produce very early Fajr / very late Isha times that don't match observed twilight behavior at those latitudes.

The **alternative French convention** is CIL Lisboa (18° Fajr / +77 min after Maghrib for Isha / +3 min Maghrib) — used by some French mosques but a minority position.

## Known points of ikhtilaf within the country

- **UOIF 12°/12° vs MWL 18° vs CIL Lisboa 18°+77min** — France has three institutional positions used by different French Muslim institutions. UOIF is the largest single-institution alignment. The Mawaqit-France yearly fixture (8 mosques × 366 days, fajr#99) shows per-mosque Maghrib bias mean −2.75 vs fajr's UOIF default — suggesting some French mosques apply a +3-5 min Maghrib offset over bare UOIF, similar to the London Path A signal documented in fajr#134.
- **Maghrebi-diaspora majority follows Habous-aligned conventions for Algerian/Moroccan/Tunisian-origin populations** — but in France this is mediated by UOIF rather than the Maghreb ministries directly.
- **Turkish diaspora** follows Diyanet via Turkish-affiliated mosques; route to Diyanet method via city-level overrides where documented.

## City-level overrides

None at city level for France currently. The UOIF country-default handles all French coordinates. Future per-city overrides could surface the Diyanet-aligned subset for Strasbourg-area / Mulhouse-area Turkish communities.

## Open questions / outstanding work

- **Per-mosque +3-5 min Maghrib signal** seen in Mawaqit-France yearly fixture: needs more investigation. If consistent across mosques, a Path A buffer (similar to v1.5.0 Morocco +5) could be justified for France. Currently not applied; fajr's UOIF dispatch is bare 12°/12°.
- **CIL Lisboa method** as a per-city `altMethods` surface — for French mosques that follow CIL conventions, could expose explicitly.
- **High-latitude rule** above 51°N (most of northern France stays below; Lille is ~50.6°N): not currently applied to France-mainland. Calais (50.95°N) is the northernmost major French city; HighLatitudeRule.TwilightAngle activation could be relevant in deep summer.

## Sources

- Musulmans de France (formerly UOIF): https://www.musulmansdefrance.fr/
- Grande Mosquée de Paris: https://www.mosqueedeparis.net/
- Mawaqit France yearly fixture: `eval/data/test/mawaqit-france-yearly.json` (8 mosques × 366 days)
