// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Structured feature metadata for downstream settings UIs.
 *
 * Classification: 🟢 Established — documentation/UX metadata only. These
 * records describe existing or caller-explicit options; they do not change
 * prayer-time defaults by themselves.
 */

const FEATURE_INFO = Object.freeze({
  methodOverride: Object.freeze({
    key: 'methodOverride',
    kind: 'radio',
    title: 'Calculation method',
    technical: 'Manual method override',
    layman: 'Use fajr\'s location-based default unless your local mosque or authority publishes a different method.',
    default: 'auto',
    values: Object.freeze([
      Object.freeze({ value: 'auto', label: 'Automatic', description: 'Use city, country, then fallback dispatch.' }),
      Object.freeze({ value: 'UmmAlQura', label: 'Umm al-Qura', description: 'Saudi Umm al-Qura style calculation.' }),
      Object.freeze({ value: 'Diyanet', label: 'Diyanet', description: 'Turkiye Diyanet preset.' }),
      Object.freeze({ value: 'Karachi', label: 'Karachi', description: '18 degree Fajr and 18 degree Isha preset.' }),
      Object.freeze({ value: 'Egyptian', label: 'Egyptian', description: 'Egyptian 19.5 degree Fajr and 17.5 degree Isha preset.' }),
      Object.freeze({ value: 'MoonsightingCommittee', label: 'Moonsighting Committee', description: 'Moonsighting Committee preset used by some UK and diaspora communities.' }),
      Object.freeze({ value: 'MWL', label: 'Muslim World League', description: 'MWL 18 degree Fajr and 17 degree Isha preset.' }),
      Object.freeze({ value: 'ISNA', label: 'ISNA', description: 'North America 15 degree Fajr and 15 degree Isha preset.' }),
    ]),
    docs: 'https://github.com/tawfeeqmartin/fajr#app-integration-pattern',
    citation: 'https://github.com/tawfeeqmartin/fajr/blob/master/docs/positions.md#product-guidance',
    stance: 'Prefer auto-detection, then let users match their mosque when local practice differs.',
  }),

  asrConventionOverride: Object.freeze({
    key: 'asrConventionOverride',
    kind: 'radio',
    title: 'Asr convention',
    technical: 'Asr shadow-factor override',
    layman: 'Choose standard 1x shadow or Hanafi 2x shadow when your mosque follows a different Asr time than the default.',
    default: 'auto',
    values: Object.freeze([
      Object.freeze({ value: 'auto', label: 'Automatic', description: 'Use fajr\'s detected metadata and method-implied Asr formula.' }),
      Object.freeze({ value: 'standard', label: 'Standard', description: '1x shadow Asr, used by Shafi, Maliki, Hanbali-standard, and many institutional timetables.' }),
      Object.freeze({ value: 'hanafi', label: 'Hanafi', description: '2x shadow Asr.' }),
    ]),
    docs: 'https://github.com/tawfeeqmartin/fajr#what-you-get',
    citation: 'https://github.com/tawfeeqmartin/fajr/blob/master/docs/positions.md#product-guidance',
    stance: 'Asr convention is a prayer-time shadow factor, not a full legal-madhhab label.',
  }),

  elevationOverride: Object.freeze({
    key: 'elevationOverride',
    kind: 'numeric',
    title: 'Elevation',
    technical: 'Geometric horizon-dip correction',
    layman: 'Leave automatic unless your mosque publishes uniform city times or your device altitude is reliable.',
    default: 'auto',
    range: Object.freeze({ min: -500, max: 9000, step: 1, unit: 'm' }),
    docs: 'https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/corrections/elevation.md',
    citation: 'https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/corrections/elevation.md',
    stance: 'Elevation can shift sunrise earlier and Maghrib later; local institutional practice should decide whether to apply it.',
  }),

  tayakkunBuffer: Object.freeze({
    key: 'tayakkunBuffer',
    kind: 'numeric',
    title: 'Tayakkun buffer',
    technical: 'Opt-in Fajr certainty buffer',
    layman: 'Delay the displayed Fajr time by a few minutes when you want extra observer certainty. Do not use it as an imsak replacement.',
    default: 0,
    range: Object.freeze({ min: 0, max: 10, step: 1, unit: 'min' }),
    docs: 'https://github.com/tawfeeqmartin/fajr#main-apis',
    citation: 'https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/methods/fajr-angle-empirics.md',
    stance: 'Opt-in only. fajr keeps the calculated Fajr time as the default and exposes imsak separately for fasting safety.',
  }),

  tarabishyMethod: Object.freeze({
    key: 'tarabishyMethod',
    kind: 'toggle',
    title: 'Tarabishy high-latitude method',
    technical: 'Latitude truncation above a threshold',
    layman: 'Use a published high-latitude alternative only when your community chooses it.',
    default: false,
    range: Object.freeze({ min: 45, max: 60, step: 0.5, unit: 'deg' }),
    docs: 'https://github.com/tawfeeqmartin/fajr#main-apis',
    citation: 'https://github.com/tawfeeqmartin/fajr/blob/master/knowledge/wiki/regions/high-latitude.md',
    stance: 'Limited-precedent alternative. fajr default remains the established high-latitude rule.',
  }),
})

export function features() {
  return Object.keys(FEATURE_INFO)
}

export function featureInfo(key) {
  if (!Object.hasOwn(FEATURE_INFO, key)) return null
  const info = FEATURE_INFO[key]
  return JSON.parse(JSON.stringify(info))
}
