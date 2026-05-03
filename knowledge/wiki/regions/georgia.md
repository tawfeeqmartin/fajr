# Georgia — prayer-time conventions

## Institutional reference body
- **Name:** Administration of Muslims of All Georgia (Sruliad Sakartvelos Muslimta Sammartvelo)
- **URL:** Not consistently published online; operates from Tbilisi with regional offices in Batumi (Adjara) and Akhaltsikhe (Meskheti).
- **Population served:** ~400k–500k Muslims (~10% of Georgia's ~3.7M total)
- **Madhab:** Sunni Hanafi (Adjara, mostly ethnic Georgian Muslims); Twelver Shi'a (Azeri minority in Kvemo Kartli)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Turkey` (Diyanet, 18°/17° + Diyanet preset offsets, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** Diyanet preset (`sunrise -7, dhuhr +5, asr +4, maghrib +7, isha 0`)
- **Classification:** 🟡 Limited precedent

## Why this method
Georgian Muslim institutional life — particularly in Adjara — is heavily intertwined with Turkish institutional and educational presence. Many Adjarian mosques are funded or rebuilt by the Turkish Diyanet (Diyanet İşleri Başkanlığı). The Diyanet calendar convention (18°/17° + Hanafi Asr + Diyanet's published offsets) is therefore the natural institutional fit for the Sunni-Hanafi Adjarian majority of Georgian Muslims.

The Azeri-Shi'a minority in Kvemo Kartli follows the Caucasian Muslims Office (Baku-based) Tehran-style convention. This is not currently differentiated in fajr; the Georgia bbox routes everyone to Diyanet.

## Known points of ikhtilaf within the country
- **Adjarian Sunni Hanafi (Diyanet)** vs. **Kvemo Kartli Azeri Shi'a (Caucasian Muslims Office, Tehran)** — different angle pairs, different Asr (Hanafi vs. Standard), different Maghrib (sunset vs. disappearance-of-redness).

## Open questions
- A v1.7.0 city-override for Kvemo Kartli (Marneuli, Bolnisi, Dmanisi) to route to Tehran method would better serve the Shi'a Azeri minority.
- Primary-source verification of the Administration of Muslims of All Georgia's published timetable is pending.

## Sources
- Caucasus Muslims Office (covers Georgia): https://qafqazislam.com/
- Diyanet İşleri Başkanlığı (Turkey): https://www.diyanet.gov.tr/
- Aladhan API regional-default routing for `GE`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
