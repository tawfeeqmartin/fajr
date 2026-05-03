# Spain — prayer-time conventions

## Institutional reference body
- **Name:** **Comisión Islámica de España (CIE)** — state-recognized peak body via 1992 Acuerdo de Cooperación; **FEERI** (Federación Española de Entidades Religiosas Islámicas) and **UCIDE** (Unión de Comunidades Islámicas de España) as the two constituent federations; Mezquita Mayor de Madrid (M-30 Mosque, Saudi-funded); Mezquita Centro Cultural Islámico de Madrid (Abu Bakr Mosque, Tetuán)
- **URL:** CIE: https://comisionislamicadeespana.org/ ; UCIDE: https://ucide.org/ ; FEERI: https://feeri.org/
- **Population served:** ~2.1M Muslims (~4.5% of Spain's ~48M total — predominantly Moroccan-origin (~830,000), plus Algerian, Pakistani, Senegalese, Bangladeshi, Mauritanian-origin; concentrated in Catalonia, Andalusia, Madrid, Valencian Community, Murcia)
- **Madhab(s):** Sunni Maliki (Moroccan / Algerian / Senegalese / Mauritanian majority); Sunni Hanafi (Pakistani / Bangladeshi-origin); small Twelver Shi'a community

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
**CIE** is the Spanish state's official Muslim counterparty via the 1992 Acuerdo, but does not publish a binding national Imsakiyya. Both constituent federations (UCIDE, FEERI) align with **MWL 18°/17°** as the European-default convention via ECFR alignment. Moroccan-origin communities (the largest demographic) may follow Morocco's Habous-Ministry-published Imsakiyya per family/mosque practice; mosques with direct Moroccan institutional ties may publish Habous-style 19°/17° + Maghrib +5min. fajr's country routing favors the MWL multi-institution default.

Spain's bbox in `detectCountry()` excludes the Canary Islands' deepest western extent to avoid Mauritania bbox overlap; the Canary Islands sit in fajr's MWL Spain routing for the populated eastern islands but high-Atlantic locations may fall through to the default.

## Known points of ikhtilaf within the country
- **Moroccan-origin Imsakiyya** — many Moroccan-Spanish mosques follow the Habous-Ministry-published Imsakiyya (19°/17° + Maghrib +5min). Users may prefer manual override to Morocco's `method: 'Morocco'` for accuracy at Moroccan-heritage community mosques.
- **Andalusian historical heritage** — al-Andalus historical Maliki convention is reflected in modern Andalusian Muslim community practice; same MWL alignment.
- **Ceuta and Melilla** (Spanish North African enclaves) — large Muslim populations (~40% of population in each); follow Spanish institutional structure but the bbox detection routes them to Morocco. v1.7.0+ may add explicit city-level overrides for Ceuta / Melilla.

## Sources
- Comisión Islámica de España: https://comisionislamicadeespana.org/
- UCIDE: https://ucide.org/
- FEERI: https://feeri.org/
- 1992 Acuerdo de Cooperación: https://www.boe.es/buscar/doc.php?id=BOE-A-1992-24855
- Aladhan API regional default for `ES` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
