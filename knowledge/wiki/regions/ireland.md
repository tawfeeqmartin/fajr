# Ireland — prayer-time conventions

## Institutional reference body
- **Name:** Islamic Cultural Centre of Ireland (ICCI), Clonskeagh, Dublin; Islamic Foundation of Ireland (Mosque on South Circular Road, Dublin); Muslim Council of Ireland (peak-body coordination)
- **URL:** ICCI: https://islamireland.ie/ ; Islamic Foundation of Ireland: http://www.islamicfoundation.ie/ ; Muslim Council of Ireland: https://muslimcouncil.ie/
- **Population served:** ~80,000 Muslims (~1.6% of Ireland's ~5M total — concentrated in Dublin, Cork, Galway; significant Pakistani, Egyptian, Sudanese, Somali, Bosnian, Algerian-origin communities)
- **Madhab(s):** Sunni multi-madhab (Maliki / Hanafi / Shafi'i diaspora-origin distribution); ICCI-Clonskeagh historically Saudi-Wahhabi-funded (Al Maktoum Foundation); IFI more diverse-Sunni

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MoonsightingCommittee` (18°/18° + seasonal Shafaq adjustment + high-latitude support)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard
- **Special offsets:** Moonsighting Committee Worldwide seasonal Shafaq adjustment for high-latitude winter night-length compression
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Ireland (`IE`) to **method 14 (Moonsighting Committee Worldwide / Yusuf Sacha)**, reflecting the convention adopted by the broader UK / Ireland diaspora Muslim community. The Moonsighting Committee method is preferred for high-latitude regions (Dublin 53.35°N) where the standard 18°/17° MWL produces unstable Isha calculations during long summer nights; the seasonal Shafaq adjustment provides a more usable computation across the year.

ICCI's published prayer times appear to track the Moonsighting Committee method via the broader UK/Ireland community calendar. No Irish institutional body has published a divergent national preset.

## Known points of ikhtilaf within the country
- **ICCI vs. Islamic Foundation of Ireland (IFI)** — both Dublin-area institutions; both align with the Moonsighting Committee convention for daily prayer times. Some institutional differences in moon-sighting for Ramadan/Eid, but daily prayer-time method is consistent.
- **Diaspora-origin variance** — Pakistani-origin worshipers may follow Karachi 18°/18° per their country of origin; Egyptian-origin may follow the Egyptian method via family practice; ICCI/IFI Imsakiyya represents the institutional default.

## Open questions
- Citation pending — currently Aladhan-aligned per v1.6.2 audit; primary-source verification from ICCI / IFI Imsakiyya pending direct publication confirmation.

## Sources
- Islamic Cultural Centre of Ireland: https://islamireland.ie/
- Islamic Foundation of Ireland: http://www.islamicfoundation.ie/
- Muslim Council of Ireland: https://muslimcouncil.ie/
- Aladhan API method 14 (MoonsightingCommittee) regional default for `IE`: https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
