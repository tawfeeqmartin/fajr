# Argentina — prayer-time conventions

## Institutional reference body
- **Name:** **Centro Islámico de la República Argentina (CIRA)** — Buenos Aires-based, founded 1931, the oldest and largest institutional Muslim body in Argentina; **Asociación Argentina de Beneficencia y Cultura Islámica**; **Centro Cultural Islámico Custodio de las Dos Sagradas Mezquitas Rey Fahd** (Saudi-funded, opened 2000, the largest mosque in Latin America)
- **URL:** CIRA: https://cira.org.ar/ ; Centro Cultural Islámico Rey Fahd: https://centroislamico.com.ar/
- **Population served:** ~500,000–800,000 Muslims (~1–2% of Argentina's ~46M total — predominantly **Syrian / Lebanese / Palestinian-origin** community (post-1880 Mahjar migration via the Italian / Spanish migration waves), plus Arab / Egyptian / Iranian / Pakistani / Bangladeshi-origin diaspora, growing Argentine convert community; concentrated in Buenos Aires, Córdoba, Mendoza, Tucumán, Rosario)
- **Madhab(s):** Sunni multi-madhab (Maliki / Shafi'i for Arab); significant Twelver Shi'a (via Lebanese Shia diaspora); Druze community (theologically distinct from Sunni Islam, observe distinct calendar — out of fajr scope)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Argentina (`AR`) to MWL. CIRA is the documented institutional default; the Saudi-funded Centro Cultural Islámico Rey Fahd publishes Saudi-style Imsakiyya at Umm al-Qura method angles. fajr's MWL routing follows the Aladhan default.

## Known points of ikhtilaf within the country
- **Saudi-funded Centro Cultural Islámico Rey Fahd** — Umm al-Qura institutional alignment; users at this specific mosque may prefer manual `method: 'UmmAlQura'` override.
- **Twelver Shi'a Lebanese-heritage community** — institutional ties to Tehran method.

## Open questions
- Citation pending — currently MWL Aladhan-aligned per v1.6.2 audit.

## Sources
- CIRA: https://cira.org.ar/
- Centro Cultural Islámico Rey Fahd: https://centroislamico.com.ar/
- Aladhan API regional default for `AR` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
