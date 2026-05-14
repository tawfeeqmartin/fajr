# United Kingdom — prayer-time conventions

## Institutional reference body

- **Name:** Muslim Council of Britain (MCB) — federation of UK Muslim organizations; East London Mosque (ELM) — historically influential institutional anchor; UK Astronomical Committee (within JIMAS) — astronomical-methodology body.
- **Secondary:** Moonsighting Committee Worldwide (mediated via various UK-affiliated bodies) — used for hilal sighting + as a calculation-method anchor (Aladhan method=15).
- **URL:** MCB: https://mcb.org.uk/ ; ELM: https://www.eastlondonmosque.org.uk/ ; JIMAS: https://jimas.org/
- **Population served:** ~4M Muslims (~6% of UK's ~67M total).
- **Madhab:** Multi-madhab — Pakistani-Bangladeshi diaspora dominant (Sunni Hanafi via Deobandi + Bareilvi traditions); Indian-diaspora (Hanafi, Shafi'i Mappila for Kerala-origin); Arab diaspora (multi-madhab); African (Maliki for West Africans, Shafi'i for Somali); Turkish (Hanafi via Diyanet-affiliated mosques); Twelver Shia minority (~10% of UK Muslims).

## Calculation method (as implemented in fajr)

- **adhan.js method:** `MoonsightingCommittee` (`CalculationMethod.MoonsightingCommittee()`) — corresponds to **Aladhan API method 15**
- **Fajr angle:** empirical model (not a fixed angle) — accommodates high-latitude practice
- **Isha angle:** empirical model + fixed-interval fallback
- **Asr school:** Standard (1× shadow). Hanafi-observant callers override explicitly.
- **Special offsets (per adhan.js MoonsightingCommittee preset):** dhuhr:5 / maghrib:3 — applied by the preset; fajr inherits these
- **Classification:** 🟡 Limited precedent (institutional reference is empirical-Moonsighting-Committee, not a fixed-angle method; per-community within UK varies significantly)

## Why this method

The MoonsightingCommittee method is the **most-adopted UK convention** — used by MCB-affiliated mosques + agot's experience with the largest UK Muslim apps. The empirical model accommodates the UK's high-latitude challenge: at 50-58°N, fixed angles like MWL 18° produce very early Fajr / very late Isha times in summer that don't match observed twilight behavior at those latitudes.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'hanafi'` for Pakistani/Bangladeshi-diaspora-majority cities (Bradford, Leicester, Birmingham, parts of London) — open question whether the country-default should surface this metadata for ALL UK coordinates or just those city-level overrides
- `applied.asrSchool` returns `'standard'` (MoonsightingCommittee preset uses 1× shadow Asr)

## Known points of ikhtilaf within the country

- **Maghrib/Dhuhr offsets:** fajr#70/fajr#134 documented that Mawaqit-London publishes ~+3-4 min Maghrib later than AlAdhan MoonsightingCommittee preset. fajr's UK dispatch currently applies the MoonsightingCommittee preset's +5 Maghrib / +3 Dhuhr offsets, matching Mawaqit (closer to UK mosque-published reality).
- **BST/GMT DST encoding** in Mawaqit-UK yearly fixture: per fajr#134 verdict, the corpus stores times in GMT year-round, creating a -57 min summer artifact. Real Mawaqit-vs-AlAdhan signal (after DST normalization) is the +3-4 min Maghrib offset above.
- **Per-community Asr:** Pakistani-Bangladeshi-Hanafi cities (Bradford, Leicester, parts of Birmingham/London) effectively want Hanafi Asr; Arab/Maliki/Shafi'i cities want Standard. fajr's country-default of Standard is correct for the Standard-using subset; Hanafi-using callers should override.
- **Twelver Shia minority** follows Sistani-aligned Imsakiyya. Concentrated in London Edgware Road / Imam Khoei Centre + parts of Manchester. Not currently surfaced via per-city `altMethods`.

## City-level overrides

None at city level currently. UK country-default MoonsightingCommittee handles all UK coordinates. Future per-city overrides could surface:
- **Bradford, Leicester** — explicit Hanafi-2x-Asr metadata
- **London Imam Khoei Centre** — Tehran/Sistani-aligned Twelver Shia option in `altMethods`

## Open questions / outstanding work

- **fajr#70/#134** — UK Maghrib/Dhuhr arbitration. The original +5/+3 Path A hypothesis is **confirmed once corpus DST artifact is excluded** (commit `336fdae`). UK could promote from C → B once: (a) the Mawaqit-UK yearly fixture is re-fetched with DST normalization, (b) the +3-4 min signal is verified across all 5 UK mosques (currently London-only analysis), (c) a third institutional reference (MCB / ELM / JIMAS) cross-validates.
- **High-latitude rule** above 55°N (Edinburgh ≈ 55.95°N is the northernmost major UK city): MoonsightingCommittee method's empirical model handles this; fajr applies it correctly.
- **Per-community altMethods** — significant Pakistani-Bangladeshi Hanafi diaspora not currently surfaced via metadata or altMethods at country level (only `location.asrConvention === 'standard'` returned, which is correct for the calculation but doesn't surface the demographic-Hanafi context).

## Sources

- Muslim Council of Britain: https://mcb.org.uk/
- East London Mosque: https://www.eastlondonmosque.org.uk/
- JIMAS: https://jimas.org/
- Moonsighting Committee Worldwide: http://www.moonsighting.com/
- Aladhan method 15 (MoonsightingCommittee): https://aladhan.com/calculation-methods
- Mawaqit UK yearly: `eval/data/test/mawaqit-uk-yearly.json` (5 mosques × 366 days)
- Aladhan-UK-MoonsightingCommittee yearly: `eval/data/test/uk-aladhan-moonsighting-yearly.json` (3 cities × 365 days)
