# Brazil — prayer-time conventions

## Institutional reference body
- **Name:** **Federação das Associações Muçulmanas do Brasil (FAMBRAS)** — São Paulo-based, founded 1980, the peak institutional body for Brazilian Muslim affairs; **Centro de Divulgação do Islã para a América Latina (CDIAL)**; **União das Entidades Islâmicas do Brasil**
- **URL:** FAMBRAS: https://fambras.org.br/ ; CDIAL: https://cdial.org.br/
- **Population served:** ~250,000–1.5M Muslims (~0.1–0.7% of Brazil's ~215M total — predominantly **Lebanese / Syrian / Palestinian-origin** community (the largest Arab diaspora in Latin America, post-1880 Mahjar migration), plus modern Egyptian / Saudi / Pakistani / Indonesian / Senegalese / Turkish-origin diaspora, growing Brazilian convert community; concentrated in São Paulo (the largest concentration), Foz do Iguaçu (the Brazil-Paraguay-Argentina tri-border area), Curitiba, Rio de Janeiro, Brasília)
- **Madhab(s):** Sunni multi-madhab (Maliki / Shafi'i for Arab; Hanafi for Pakistani / Turkish; multi-madhab for Brazilian converts); Twelver Shi'a (~10-20% via Lebanese Shia diaspora — significant)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MuslimWorldLeague` (18°/17°)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Standard
- **Special offsets:** none
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults Brazil (`BR`) to MWL. FAMBRAS is the documented institutional default; the Lebanese-Syrian-Palestinian-origin majority follows multi-madhab Maliki / Shafi'i convention via Levantine institutional ties. MWL is the multi-app Latin-America default.

## Known points of ikhtilaf within the country
- **Twelver Shi'a Lebanese-heritage community (substantial)** — institutional ties to Tehran method via Lebanese Higher Islamic Shi'ite Council; users at Shi'a mosques may prefer manual `method: 'Tehran'` override. The Foz do Iguaçu Shi'a community is one of the largest in Latin America.
- **Sunni Lebanese / Syrian-origin** — Maliki / Shafi'i institutional inheritance.
- **Modern diaspora variance** — Pakistani (Karachi), Turkish (Diyanet), Indonesian (JAKIM), Senegalese (MWL).

## Open questions
- Citation pending — currently MWL Aladhan-aligned per v1.6.2 audit; primary-source verification from FAMBRAS Imsakiyya pending.

## Sources
- FAMBRAS: https://fambras.org.br/
- CDIAL: https://cdial.org.br/
- Aladhan API regional default for `BR` (MWL): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
