# Portugal — prayer-time conventions

## Institutional reference body
- **Name:** Comunidade Islâmica de Lisboa (CIL / Lisbon Central Mosque)
- **URL:** https://comunidadeislamica.pt/ ; daily prayer times: https://comunidadeislamica.pt/horarios/
- **Population served:** ~65,000 Muslims (~0.6% of Portugal's ~10M total — concentrated in Lisbon, Porto, Algarve, Coimbra; significant Guinea-Bissauan, Mozambican, and Pakistani-origin communities)
- **Madhab(s):** Sunni — Maliki (West African / Lusophone diaspora origin), Hanafi (South Asian diaspora origin), Shafi'i (East African diaspora origin)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Other` with custom `fajrAngle = 18°`, `ishaInterval = 77` minutes (Isha = Maghrib + 77 min), `methodAdjustments.maghrib = +3` minutes
- **Fajr angle:** 18°
- **Isha angle:** N/A — Isha is a fixed interval after Maghrib, not an angle
- **Isha interval:** 77 min after Maghrib
- **Maghrib offset:** +3 min
- **Asr school:** Standard
- **Classification:** 🟢 Established

## Why this method
CIL publishes a national Imsakiyya for Portugal that follows a **bespoke Mediterranean / Iberian convention**: Fajr is computed at 18°, but Isha is **not** computed via a twilight angle — instead, it is set to a **fixed interval of 77 minutes after Maghrib**. Maghrib itself is shifted by **+3 minutes** to account for atmospheric and disc-clearance ihtiyat. This is reflected in **Aladhan API method 21 ("Portugal")** which directly mirrors CIL's published parameters.

The Isha-interval convention (rather than angle) is shared with other Iberian / North African presets where the Mediterranean-latitude refraction and aerosol environment historically made the angular-twilight definition less practical. CIL's parameters were calibrated to match what mosques in Lisbon, Porto, and Algarve have published for decades.

## Known points of ikhtilaf within the country
- **Mosque-by-mosque variance** is small — CIL's Imsakiyya is treated as the de facto national reference across the small Portuguese Muslim community.
- **Diaspora-origin variance** — South Asian-origin worshipers in Lisbon's Pakistani community may follow Karachi 18°/18° per their country of origin rather than CIL; African-origin worshipers may follow MWL via Lusophone Africa institutional ties. These are minority preferences within the small community; CIL's preset is the national institutional convention.

## Sources
- Comunidade Islâmica de Lisboa: https://comunidadeislamica.pt/
- CIL daily prayer times: https://comunidadeislamica.pt/horarios/
- Aladhan API method 21 ("Portugal"): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
