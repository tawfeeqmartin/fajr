# Austria — prayer-time conventions

## Institutional reference body
- **Name:** **Islamische Glaubensgemeinschaft in Österreich (IGGÖ)** — the official state-recognized representative body of Sunni Muslims in Austria since 1979 (Islamic Law 1912 / 2015 amended), based in Vienna; **ATIB** (Avusturya Türk-İslam Birliği — Austrian Turkish-Islamic Union, DİTİB-affiliated, the largest single mosque federation by membership)
- **URL:** IGGÖ: https://www.derislam.at/ ; ATIB: https://www.atib.at/
- **Population served:** ~750,000–800,000 Muslims (~8% of Austria's ~9M total — predominantly Turkish-heritage (~250,000), Bosnian (~150,000), Chechen, Afghan, Syrian, Pakistani, Egyptian-origin)
- **Madhab(s):** Sunni Hanafi (Turkish / Bosnian / Chechen majority); Sunni multi-madhab (other diaspora); small Alevi community

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent

## Why this method
Austria's official state-recognized Muslim institution is **IGGÖ**. The ECFR-aligned multi-institution **MWL 18°/17°** is the documented European default. **ATIB** (Turkish-heritage majority) follows DİTİB Diyanet 18°/17° + Diyanet preset offsets — functionally similar angle pair with small offsets. Aladhan defaults Austria (`AT`) to MWL. fajr routes to MWL as the Aladhan-aligned multi-institution convention.

## Known points of ikhtilaf within the country
- **ATIB / DİTİB-affiliated mosques** — follow Diyanet preset offsets producing a small (~5-7 min) Maghrib/Isha shift relative to MWL. Users at ATIB mosques may prefer manual `method: 'Diyanet'` override.
- **Hanafi Asr** — Turkish, Bosnian, Chechen-heritage communities universally observe Hanafi Asr (2× shadow). fajr's Austrian country default uses Standard Asr; users may prefer manual `madhab: 'Hanafi'` override at Hanafi-heritage mosques.
- **Bosnian-heritage community** institutional structure is via the Islamic Community of Austria's Bosnian-heritage member organizations, methodologically aligned with the Bosnian Rijaset's Diyanet-Hanafi convention.

## Sources
- Islamische Glaubensgemeinschaft in Österreich: https://www.derislam.at/
- ATIB: https://www.atib.at/
- Aladhan API regional default for `AT` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
