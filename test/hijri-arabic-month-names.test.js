// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Tests for v1.7.13 Arabic Hijri month names — issue #62.
 *
 * Covers:
 *  - 12 month-by-month assertions in AH 1447 (one per Hijri month) — every
 *    month from Muharram through Dhu al-Hijjah returns the expected
 *    fully-voweled Arabic string with diacritics.
 *  - Backwards-compat: existing English `monthName` field is unchanged.
 *  - Tabular-path coverage: { convention: 'tabular' } also returns
 *    `monthNameAr` (not just the umm-al-qura default path).
 */

import { describe, it, expect } from 'vitest'
import { hijri } from '../src/index.js'

// ─── 12 month-by-month assertions (AH 1447, full year coverage) ──────────────

describe('hijri — monthNameAr returns voweled Arabic for every Hijri month', () => {
  // One Gregorian date per Hijri month in 1447 AH. Each row asserts that
  // both the integer month index AND the Arabic display string match
  // AlAdhan / IslamicFinder convention.
  const cases = [
    { date: '2025-07-15', month: 1,  monthNameAr: 'مُحَرَّم' },
    { date: '2025-07-26', month: 2,  monthNameAr: 'صَفَر' },
    { date: '2025-08-24', month: 3,  monthNameAr: 'رَبِيع الأَوَّل' },
    { date: '2025-09-23', month: 4,  monthNameAr: 'رَبِيع الآخِر' },
    { date: '2025-10-23', month: 5,  monthNameAr: 'جُمَادَى الأُولَى' },
    { date: '2025-11-22', month: 6,  monthNameAr: 'جُمَادَى الآخِرَة' },
    { date: '2025-12-21', month: 7,  monthNameAr: 'رَجَب' },
    { date: '2026-01-20', month: 8,  monthNameAr: 'شَعْبَان' },
    { date: '2026-02-18', month: 9,  monthNameAr: 'رَمَضَان' },
    { date: '2026-03-20', month: 10, monthNameAr: 'شَوَّال' },
    { date: '2026-04-18', month: 11, monthNameAr: 'ذُو الْقَعْدَة' },
    { date: '2026-05-18', month: 12, monthNameAr: 'ذُو الْحِجَّة' },
  ]

  for (const { date: dateStr, month, monthNameAr } of cases) {
    it(`${dateStr} → month ${month} → ${monthNameAr}`, () => {
      const result = hijri(new Date(dateStr + 'T00:00:00Z'))
      expect(result.month).toBe(month)
      expect(result.monthNameAr).toBe(monthNameAr)
    })
  }
})

// ─── Backwards-compat: English monthName field still present + unchanged ──────

describe('hijri — English monthName is unchanged alongside new monthNameAr', () => {
  it('2026-05-02 → still returns English "Dhu al-Qi\'dah" + Arabic ذُو الْقَعْدَة', () => {
    const result = hijri(new Date('2026-05-02T00:00:00Z'))
    // English field preserved exactly as before v1.7.13 — no breakage.
    expect(result.monthName).toBe("Dhu al-Qi'dah")
    // New field present alongside.
    expect(result.monthNameAr).toBe('ذُو الْقَعْدَة')
    // Other fields unchanged.
    expect(result.year).toBe(1447)
    expect(result.month).toBe(11)
    expect(result.day).toBe(15)
  })
})

// ─── Tabular path also exposes monthNameAr ───────────────────────────────────

describe('hijri — convention: tabular also returns monthNameAr', () => {
  it('2025-03-30 tabular → Ramadan / رَمَضَان', () => {
    const result = hijri(new Date('2025-03-30T00:00:00Z'), { convention: 'tabular' })
    expect(result.monthName).toBe('Ramadan')
    expect(result.monthNameAr).toBe('رَمَضَان')
  })
})
