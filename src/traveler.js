// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Traveler mode — shortened and combined prayers.
 *
 * Islamic law permits travelers (musafir) to shorten four-rak'ah prayers
 * to two rak'ahs (qasr) and, in some madhabs, to combine prayers (jam').
 *
 * Conditions for traveler status vary by madhab. This module provides
 * time calculations; the fiqh determination of traveler status is left
 * to the user.
 */

/**
 * Return traveler-adjusted prayer information.
 *
 * 🟢 Established: Qasr (shortening) and jam' (combining) are documented
 * in Quran 4:101 and numerous hadith. The time windows returned here are
 * the permissible combination windows by madhab.
 *
 * @param {object} params
 * @param {object} params.times   Output from prayerTimes()
 * @param {string} [params.madhab]  'hanafi' | 'maliki' | 'shafii' | 'hanbali'
 * @returns {object} Traveler prayer schedule
 */
export function travelerMode({ times, madhab = 'shafii' }) {
  // Hanafi: does not permit jam' (combining) except at Arafat and Muzdalifah
  // Other madhabs: permit jam' taqdim (combining at earlier time) and
  //                jam' ta'khir (combining at later time)

  const allowCombining = madhab !== 'hanafi'

  return {
    fajr:    times.fajr,
    shuruq:  times.shuruq,
    dhuhr:   times.dhuhr,
    asr:     times.asr,
    maghrib: times.maghrib,
    isha:    times.isha,
    qasr: true,
    jam: allowCombining
      ? {
          dhuhrAsr: {
            atDhuhr: { dhuhr: times.dhuhr, asr: times.dhuhr },
            atAsr:   { dhuhr: times.asr,   asr: times.asr },
          },
          maghribIsha: {
            atMaghrib: { maghrib: times.maghrib, isha: times.maghrib },
            atIsha:    { maghrib: times.isha,    isha: times.isha },
          },
        }
      : null,
    madhab,
    note: 'Qasr and jam\' require valid traveler status (safar). Consult a scholar for your situation.',
  }
}
