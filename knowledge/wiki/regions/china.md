# China — prayer-time conventions

## Institutional reference body
- **Name:** **China Islamic Association** (中国伊斯兰教协会, Zhōngguó Yīsīlán Jiào Xiéhuì) — Beijing-based, the state-recognized peak institutional body for Chinese Muslim affairs since 1953
- **URL:** China Islamic Association: http://www.chinaislam.net.cn/ (institutional portal)
- **Population served:** ~25–30M Muslims (~2% of China's ~1.4B total — predominantly **Hui** (Hui Mandarin-speaking Muslims, the largest Muslim ethnic group, dispersed across China with concentrations in Ningxia, Gansu, Qinghai, Henan, Shanxi, Yunnan, Hebei, Beijing), **Uyghur** (Xinjiang, Turkic-speaking, Sunni Hanafi), **Kazakh / Kyrgyz / Tajik / Uzbek / Tatar** (smaller Turkic / Iranic Sunni-Hanafi communities in Xinjiang and the northwest), **Salar** (Qinghai, Turkic Sunni-Hanafi), **Dongxiang / Bonan** (Gansu, Mongol-Hui Sunni-Hanafi))
- **Madhab(s):** Sunni Hanafi (the overwhelming majority via Central Asian / Silk Road institutional inheritance — Hanafi madhab dominates across all major Muslim ethnic groups)

## Calculation method (as implemented in fajr)
- **adhan.js method:** `MoonsightingCommittee` (18°/18° + seasonal Shafaq adjustment + high-latitude support)
- **Fajr angle:** 18°
- **Isha angle:** 18°
- **Asr school:** Standard
- **Special offsets:** Moonsighting Committee Worldwide seasonal Shafaq adjustment for high-latitude Xinjiang / Inner Mongolia winter
- **Classification:** 🟡 Limited precedent (Aladhan-aligned default; institutional citation pending)

## Why this method
Aladhan API defaults China (`CN`) to **method 14 (Moonsighting Committee Worldwide / Yusuf Sacha)**, reflecting the practical need for Shafaq-general high-latitude support across Xinjiang (lat 35-50°N) and Inner Mongolia (lat 38-53°N). The China Islamic Association does not publish a divergent national preset.

Note that the dominant Hanafi institutional inheritance across Hui / Uyghur / Kazakh / Salar communities would suggest **Karachi 18°/18° + Hanafi Asr** as institutionally aligned. The Moonsighting routing is preferred for the high-latitude Xinjiang / Inner Mongolia scenarios where Karachi alone would produce unstable Isha. fajr's MoonsightingCommittee routing follows the Aladhan default.

## Known points of ikhtilaf within the country
- **Hanafi Asr** — observed across all major Muslim ethnic communities; users may prefer manual `madhab: 'Hanafi'` override.
- **Uyghur Xinjiang community** — institutional ties to Central Asia / former-Silk-Road Hanafi convention.
- **Hui Mandarin-speaking community** — long-established institutional structure (since 7th-century Tang dynasty arrival of Arab/Persian merchants); predominantly Hanafi.
- **High-latitude Xinjiang / Inner Mongolia** — Shafaq-general adjustment required for stable Isha during long summer days.

## Open questions
- Citation pending — currently Aladhan-aligned per v1.6.2 audit; primary-source verification from China Islamic Association Imsakiyya pending.

## Sources
- China Islamic Association: http://www.chinaislam.net.cn/
- Aladhan API regional default for `CN` (MoonsightingCommittee): https://aladhan.com/calculation-methods
- v1.6.2 country-coverage proposal: `autoresearch/proposals/v1.6.2-country-coverage.md`

## Last reviewed
- 2026-05-03 by fajr-agent (initial creation per v1.6.2 audit log)
