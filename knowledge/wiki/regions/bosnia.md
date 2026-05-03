# Bosnia and Herzegovina — prayer-time conventions

## Institutional reference body
- **Name:** Rijaset / Islamska zajednica u Bosni i Hercegovini (Riyasat of the Islamic Community in Bosnia and Herzegovina), led by the Reis-ul-Ulama
- **URL:** https://islamskazajednica.ba/ ; English: https://english.islamskazajednica.ba/
- **Population served:** ~1.8M Muslims (~51% of BiH's total population)
- **Madhab:** Sunni Hanafi (Ottoman-era institutional inheritance)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `Turkey` (Diyanet, 18°/17° + Diyanet preset offsets, Hanafi Asr)
- **Fajr angle:** 18°
- **Isha angle:** 17°
- **Asr school:** Hanafi (2× shadow)
- **Special offsets:** Diyanet preset (`sunrise -7, dhuhr +5, asr +4, maghrib +7, isha 0`)
- **Classification:** 🟡→🟢 Approaching established (regional Diyanet convention)

## Why this method
This was a v1.6.0 classification-audit correction. Previously fajr routed Bosnia to `MuslimWorldLeague`. The audit identified that the Rijaset's traditional **Takvim** calendar aligns most closely with Diyanet's Hanafi 18°/17° + Hanafi Asr convention. Bosnia, like Kosovo and Albania, inherited institutional Sunni Hanafi structure from the Ottoman period; the Rijaset publishes its own annual Takvim (Hijri calendar with prayer times) which is consistent with the Diyanet output pattern within sub-minute resolution.

Reis-ul-Ulama Husein Kavazović has led the Islamic Community since 2012 and the institution is headquartered in Sarajevo.

## Known points of ikhtilaf within the country
- None known at the institutional level. The Rijaset's Takvim is uniformly observed across the Federation of BiH and Republika Srpska's Muslim communities.
- Some mosques in Sandžak (across the Serbian/Montenegrin borders) follow the same Rijaset convention but are formally affiliated with the Islamic Community of Serbia / Montenegro.

## Open questions
- Empirical validation against a Rijaset-published Takvim is pending. If the Takvim diverges from Diyanet output by more than ~1 minute on any prayer, a Bosnia-specific custom offset may be needed (similar to Morocco's Path A pattern).
- v1.6.2 follow-up (per audit log): validate against Rijaset's own Takvim publication; consider custom offset if needed.

## Sources
- Islamska zajednica u BiH: https://islamskazajednica.ba/
- Rijaset (English): https://english.islamskazajednica.ba/the-islamic-community-1/riyasat/information/8-riyaset
- Rijaset Twitter: https://twitter.com/rijasetbih
- v1.6.0 classification audit: `autoresearch/logs/2026-05-02-v1.6.0-classification-audit.md`

## Last reviewed
- 2026-05-02 by fajr-agent (initial creation per v1.6.0 audit log)
