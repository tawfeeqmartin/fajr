// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
import { describe, expect, it } from 'vitest'
import { detectLocation, nearestCity, prayerTimes } from '../src/index.js'

const latitude = 33.8938, longitude = 35.5018 // Beirut has nested alternatives
const params = { latitude, longitude, date: new Date('2026-05-05T12:00:00Z') }
const lookup = () => detectLocation(latitude, longitude)

describe('returned registry records are detached', () => {
  it.each(['detectLocation', 'nearestCity', 'prayerTimes'])('%s cannot poison future dispatch', api => {
    const before = structuredClone(lookup())
    const timesBefore = prayerTimes(params)
    const out = api === 'detectLocation' ? lookup()
      : api === 'nearestCity' ? nearestCity(latitude, longitude) : prayerTimes(params).location
    expect(out.city).not.toBeNull()
    const saved = structuredClone(out.city)
    try {
      out.city.name = 'consumer label'
      out.city.methodOverride = 'ISNA'
      out.city.elevation = 9000
      out.city.bbox.fill(0)
      if (out.city.source) out.city.source.type = 'fallback'
      if (out.city.altMethods?.length) out.city.altMethods[0].method = 'ISNA'
      expect(lookup()).toEqual(before)
      expect(prayerTimes(params)).toEqual(timesBefore)
    } finally {
      // Keep the deliberately failing pre-fix test from poisoning other tests.
      for (const key of Object.keys(out.city)) delete out.city[key]
      Object.assign(out.city, saved)
    }
  })

  it('also detaches top-level source and alternative objects', () => {
    const before = structuredClone(lookup())
    const out = lookup()
    expect(out.altMethods?.length).toBeGreaterThan(0)
    const source = structuredClone(out.source)
    const alternative = structuredClone(out.altMethods[0])
    try {
      out.source.type = 'fallback'
      out.altMethods[0].method = 'ISNA'
      expect(lookup()).toEqual(before)
    } finally {
      Object.assign(out.source, source)
      Object.assign(out.altMethods[0], alternative)
    }
  })
})
