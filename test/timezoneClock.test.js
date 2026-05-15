// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { describe, expect, it } from 'vitest'
import { normalizeClockTimeForZone } from '../scripts/lib/timezone-clock.js'

describe('timezone clock normalization', () => {
  it('keeps GMT winter clocks unchanged for Europe/London', () => {
    expect(normalizeClockTimeForZone({
      date: '2026-01-15',
      time: '16:24',
      sourceTimeZone: 'UTC',
      targetTimeZone: 'Europe/London',
    })).toBe('16:24')
  })

  it('adds the BST hour when a GMT-year-round source is compared as London local clock', () => {
    expect(normalizeClockTimeForZone({
      date: '2026-07-15',
      time: '20:15',
      sourceTimeZone: 'UTC',
      targetTimeZone: 'Europe/London',
    })).toBe('21:15')
  })

  it('leaves non-clock strings untouched', () => {
    expect(normalizeClockTimeForZone({
      date: '2026-07-15',
      time: '+20',
      sourceTimeZone: 'UTC',
      targetTimeZone: 'Europe/London',
    })).toBe('+20')
  })
})
