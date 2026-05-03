# Germany — prayer-time conventions

## Institutional reference body
- **Name:** Multiple — **Zentralrat der Muslime in Deutschland (ZMD)**, **Islamrat für die Bundesrepublik Deutschland**, **DİTİB** (Türkisch-Islamische Union der Anstalt für Religion — German branch of Diyanet for the Turkish-heritage community), **VIKZ** (Verband der Islamischen Kulturzentren — Süleymancı), **Islamische Gemeinschaft Millî Görüş (IGMG)**, **Koordinierungsrat der Muslime (KRM)** as peak-body coordination
- **URL:** ZMD: https://zentralrat.de/ ; DİTİB: https://www.ditib.de/ ; KRM: https://koordinationsrat.de/ ; IGMG: https://www.igmg.org/
- **Population served:** ~5.5M Muslims (~6.5% of Germany's ~84M total — largest Muslim community in Western Europe; predominantly Turkish-heritage (~2.5M), Arab (Lebanese / Syrian / Iraqi / Moroccan / Egyptian), Bosnian, Iranian, Pakistani, Afghan, Somali)
- **Madhab(s):** Sunni Hanafi (Turkish-heritage majority via DİTİB / IGMG / VIKZ); Sunni multi-madhab (Arab and other diaspora communities); Twelver Shi'a (~125,000, Iranian-heritage); Alevi (~500,000+, distinct from mainstream Sunni — observe Cem-evi practices, distinct prayer-time convention)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°), with `TwilightAngle` high-latitude rule auto-applied at lat > 55°N (Hamburg / Schleswig-Holstein)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none (TwilightAngle high-latitude rule for northern Germany)
- **Classification:** 🟡→🟢 Approaching established

## Why this method
The German Muslim community is institutionally fragmented across multiple organizations, but the **MWL 18°/17°** convention is the documented multi-institutional default endorsed by **ZMD**, **Islamrat**, and the **European Council for Fatwa and Research (ECFR)** which has its institutional center in Germany / Western Europe. **DİTİB** mosques (Turkish-heritage majority) follow Diyanet 18°/17° + Diyanet preset offsets — this is **functionally equivalent** to MWL for the angle pair, with small offsets that are within typical day-to-day mosque ikhtilaf. fajr's MWL routing represents the institutional consensus across the non-DİTİB cluster; DİTİB-affiliated mosques may publish times differing by 5-7 minutes in line with the Diyanet preset.

The TwilightAngle high-latitude rule is essential for northern German cities (Hamburg 53.5°N, Bremen 53.1°N, and especially Schleswig-Holstein) where the 18°/17° MWL preset alone produces unstable Isha during long summer days.

## Known points of ikhtilaf within the country
- **DİTİB vs. ZMD/Islamrat methodological cluster** — DİTİB follows Diyanet preset offsets producing a small (~5-7 min) Maghrib/Isha shift relative to pure MWL 18°/17°. fajr's current routing favors the broader multi-institution MWL consensus; users at DİTİB-affiliated mosques may prefer manual override to Diyanet method.
- **Hanafi Asr (2× shadow)** is observed by Turkish-heritage and Bosnian-heritage communities (significant population fraction); Standard Asr (1× shadow) by Arab and South Asian Maliki/Shafi'i communities. fajr currently uses Standard Asr at the country default; v1.7.0+ city-overrides for major Turkish-heritage population centers (Berlin Kreuzberg, Köln, Stuttgart) could route to Hanafi Asr.
- **Alevi communities (~500,000+)** observe distinct Cem-evi practices not aligned with mainstream Sunni five-prayer convention — out of fajr's institutional scope.
- **Twelver Shi'a (~125,000)** observe Jafari Maghrib timing; Hamburg's Imam Ali Mosque (Iranian-funded) is the largest Shi'a institution. Users may prefer manual `Tehran` method override.

## Sources
- Zentralrat der Muslime in Deutschland: https://zentralrat.de/
- DİTİB: https://www.ditib.de/
- Koordinierungsrat der Muslime: https://koordinationsrat.de/
- European Council for Fatwa and Research: https://www.e-cfr.org/
- Aladhan API regional default for `DE` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
