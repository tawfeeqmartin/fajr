# Tajikistan — prayer-time conventions

## Institutional reference body
- **Name:** Council of Ulema of Tajikistan (Šūrā-ye ʿUlamāʾ-i Tājikistān) under the Islamic Centre of Tajikistan
- **URL:** Not consistently published online; operates from Dushanbe under state oversight.
- **Population served:** ~10M (≈98% Muslim)
- **Madhab:** Sunni Hanafi (overwhelmingly)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
fajr previously routed Tajikistan to `MoonsightingCommittee` (a v1.6.0 default for several Central Asian republics). The v1.6.0 classification audit corrected this to `MuslimWorldLeague` based on the Council of Ulema's Hanafi institutional convention and the multi-app (Muslim Pro, IslamicFinder) consensus for Dushanbe and Khujand. The MWL 18°/17° angle pair is the documented Central Asian Hanafi default.

**Note on Asr:** Although Tajikistan is overwhelmingly Hanafi, fajr currently uses Standard Asr via `MuslimWorldLeague`. A future refinement could switch to Hanafi Asr (2× shadow) via `Karachi` or `Other` with explicit Hanafi flag if institutional Tajik timetables consistently publish Hanafi Asr — pending verification.

## Known points of ikhtilaf within the country
- The state-controlled Council of Ulema operates under significant government oversight; non-state Hanafi voices (some Pamiri Ismaili communities in Gorno-Badakhshan) may follow different conventions but do not publish separate calendars.

## Open questions
- Citation pending — currently MWL-aligned per v1.6.0 audit; needs primary-source verification from the Council of Ulema or Islamic Centre of Tajikistan.
- Hanafi Asr verification: should Standard be replaced with Hanafi Asr?

## Sources
- v1.6.0 classification audit: `autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`
- Aladhan API regional-default routing for `TJ`
- Multi-app convention (Muslim Pro Dushanbe)

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
