# Iran — prayer-time conventions

## Institutional reference body

- **Name:** Institute of Geophysics, University of Tehran (the originating institution of the "Tehran method" — the Iranian Twelver-Shia institutional preset)
- **Secondary:** Office of the Supreme Leader (Ayatollah Khamenei) and individual marja' al-taqlid offices (Sistani, Khamenei, Makarem-Shirazi, etc.) publish Imsakiyya for their respective followers.
- **URL:** Institute of Geophysics: https://geophysics.ut.ac.ir/ (Cloudflare-protected, requires JS-enabled browser); Khamenei's office: https://www.leader.ir/
- **Population served:** ~83M Muslims (~99% of Iran's ~83M total).
- **Madhab:** Twelver Shia (Imamiyya / Ithna Ashari) is the constitutionally-established state religion. Sunni minority (~10%, Kurdish + Baluchi + Turkmen ethnic-affiliated, mostly Hanafi Kurdish or Shafi'i Baluchi).

## Calculation method (as implemented in fajr)

- **adhan.js method:** `Tehran` (`CalculationMethod.Tehran()`) — corresponds to **Aladhan API method 7**
- **Fajr angle:** 17.7° (Tehran Institute of Geophysics convention — slightly shallower than MWL's 18°)
- **Isha angle:** 14° (significantly shallower than other regional conventions; reflects Twelver Shia jurisprudence on timing of Isha relative to the end of "redness in the sky")
- **Asr school:** Standard (1× shadow). Twelver Shia jurisprudence aligns with Standard 1× shadow for Asr (no Hanafi 2× shadow tradition in Shia fiqh).
- **Special offsets:** none institutional
- **Classification:** 🟢 Established (Institute of Geophysics is the canonical Iranian institutional reference; the 17.7°/14° pair is documented across implementations — though no single primary publication has been retrieved per fajr#109 research)

## Why this method

The 17.7°/14° angle pair is the **Tehran Institute of Geophysics convention**, used in Iran's national Imsakiyya publications and dispatched internationally as the "Tehran method" via adhan.js, Aladhan (method 7), and PrayTimes.org. The smaller Isha angle (14° vs MWL 17° or Karachi 18°) reflects Twelver Shia jurisprudence on the end of "humrah maghribiyya" (redness on the western horizon) as the start of Isha.

The **Asr school choice** uses the v1.7.22 metadata split:
- `location.asrConvention` returns `'standard'` (Twelver Shia jurisprudence aligns with Standard 1× shadow; no 2× shadow tradition)
- `applied.asrSchool` returns `'standard'`

This is one of the cases where convention and applied formula align cleanly — Iran is the Standard-Shia baseline case.

## Known points of ikhtilaf within the country

- **Sunni Kurdish minority** (~7% of Iranian Muslims, concentrated in Kurdistan Province, West Azerbaijan, Kermanshah) — follows Hanafi madhab + Karachi/MWL angle conventions, not Tehran 17.7°/14°. Iran NW provinces have geographic carve-outs in `detectCountry()` to handle the Iran/Türkiye/Iraq tri-border (Hatay-Iğdır routing), but the per-community Sunni-Iranian dispatch isn't currently surfaced via per-city `altMethods`.
- **Baluchi minority** (~2%) — Shafi'i, follow Karachi conventions; concentrated in Sistan-Baluchestan. Similar disclosure shape.
- **Within Twelver Shia: different marja' al-taqlid:** Sistani-aligned (transnational, includes many Iranians despite being Najaf-based), Khamenei-aligned (state-aligned), Makarem-Shirazi-aligned (Qom-based reformist). Numerically these don't differ much (±2 min on Imsakiyya) but represent real institutional plurality.

## City-level overrides

- **Iraq Twelver Shia cities** (Karbala, Najaf, Kazimiya, Samarra — geographically Iraqi but ecclesiastically Najaf-marja'iyya-aligned) — route to Tehran method via city-level overrides per their institutional affiliation.

## Open questions / outstanding work

- **Cloudflare protection** on the Institute of Geophysics website (geophysics.ut.ac.ir) blocks plain HTTP scrape. Browser-session-required for any direct fetcher work.
- **Per-marja' altMethods** — fajr's `altMethods` surface could expose Sistani-aligned vs Khamenei-aligned distinctions for major Iranian cities. Currently not surfaced.
- **Sunni Iranian regions** (Kurdistan, Sistan-Baluchestan) — should expose `altMethods` for Karachi/MWL conventions for the Sunni minorities there.

## Sources

- Institute of Geophysics, University of Tehran: https://geophysics.ut.ac.ir/ (Cloudflare-protected)
- Office of the Supreme Leader (Khamenei): https://www.leader.ir/
- Sistani official: https://www.sistani.org/
- Aladhan method 7 (Tehran): https://aladhan.com/calculation-methods
- Iran Aladhan fixture: `eval/data/test/iran-pakistan-aladhan-yearly.json` (5 Iran cities × 365 days, fajr#133 / commit `18d8f6e`)
