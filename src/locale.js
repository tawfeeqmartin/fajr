// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Locale-specific prayer-name strings.
 *
 * Centralises the multi-language prayer name strings so every consuming app
 * inherits a single canonical set instead of vendoring its own (which leads
 * to drift across apps — different transliterations, different Arabic
 * voweling, etc.). Resolves [#63 Proposal 1](https://github.com/tawfeeqmartin/fajr/issues/63).
 *
 * Voweling convention matches v1.7.13 `monthNameAr` (#62) — full diacritics
 * (sukūn / fatḥa / kasra / shadda) per AlAdhan / IslamicFinder convention.
 *
 * Languages currently shipped:
 *   en — English (Romanised, the default everywhere fajr's prayer-key strings appear)
 *   ar — Arabic (voweled)
 *   tr — Turkish (Diyanet convention)
 *   id — Indonesian / Malay (KEMENAG convention)
 *   ur — Urdu
 *
 * Adding a language: contributions welcome — just add a new key per prayer.
 * The helper `prayerName(prayer, lang)` falls back to English when a
 * requested language is missing.
 *
 * Classification: 🟢 Established — these are conventional name renderings
 * with broad institutional usage, not a scholarly judgment.
 */

/**
 * @typedef {'fajr'|'shuruq'|'dhuhr'|'asr'|'maghrib'|'isha'|'imsak'} PrayerKey
 * @typedef {'en'|'ar'|'tr'|'id'|'ur'} LocaleCode
 */

/**
 * Prayer-name lookup table. Keyed by the same prayer-key strings that
 * `prayerTimes()` returns (`fajr`, `shuruq`, `dhuhr`, `asr`, `maghrib`,
 * `isha`) plus `imsak` (Ramadan-fasting boundary, returned by `prayerTimes()`
 * when `applyTayakkunBuffer` is in use or when downstream apps derive it).
 */
export const prayerNames = {
  fajr:    { en: 'Fajr',     ar: 'الفَجْر',      tr: 'İmsak',    id: 'Subuh',   ur: 'فجر' },
  shuruq:  { en: 'Sunrise',  ar: 'الشُّرُوق',    tr: 'Güneş',    id: 'Syuruk',  ur: 'طلوع' },
  dhuhr:   { en: 'Dhuhr',    ar: 'الظُّهْر',     tr: 'Öğle',     id: 'Zuhur',   ur: 'ظہر' },
  asr:     { en: 'Asr',      ar: 'العَصْر',      tr: 'İkindi',   id: 'Asar',    ur: 'عصر' },
  maghrib: { en: 'Maghrib',  ar: 'المَغْرِب',    tr: 'Akşam',    id: 'Maghrib', ur: 'مغرب' },
  isha:    { en: 'Isha',     ar: 'العِشَاء',     tr: 'Yatsı',    id: 'Isya',    ur: 'عشاء' },
  imsak:   { en: 'Imsak',    ar: 'الإِمْسَاك',   tr: 'İmsak',    id: 'Imsak',   ur: 'سحری' },
}

/**
 * Look up a prayer name in a given locale. Falls back to English when
 * the requested locale is unknown.
 *
 * @param {PrayerKey} prayer  one of fajr / shuruq / dhuhr / asr / maghrib / isha / imsak
 * @param {LocaleCode} [lang='en']  one of en / ar / tr / id / ur
 * @returns {string}
 *
 * @example
 *   prayerName('dhuhr', 'ar')   // → 'الظُّهْر'
 *   prayerName('isha', 'tr')    // → 'Yatsı'
 *   prayerName('fajr', 'xx')    // → 'Fajr'  (unknown lang falls back to en)
 */
export function prayerName(prayer, lang = 'en') {
  const entry = prayerNames[prayer]
  if (!entry) return ''
  return entry[lang] || entry.en
}
