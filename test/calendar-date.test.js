// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const program = `
  import { prayerTimes, dayTimes, astronomical } from './src/index.js';
  const dates = ['2026-05-05T00:30:00Z', '2026-05-05T23:30:00Z',
    '2026-03-08T00:30:00Z', '2026-11-01T00:30:00Z',
    '2026-04-05T00:30:00Z', '2026-10-04T23:30:00Z',
    '2026-12-31T23:30:00Z', '2028-02-29T00:30:00Z'];
  const values = dates.flatMap(value => [[33.5769, -7.5473], [51.5, -0.12]].map(([latitude, longitude]) => {
    const date = new Date(value);
    const params = { latitude, longitude, date };
    const a = astronomical(latitude, longitude, date);
    return { prayer: prayerTimes(params), day: dayTimes(params),
      raw: [a.solarNoon, a.apparentSunrise, a.apparentSunset, a.fajrAt(18), a.ishaAt(17), a.asrAt(1)] };
  }));
  process.stdout.write(JSON.stringify(values));
`
const run = tz => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', program], {
  cwd: root, env: { ...process.env, TZ: tz }, encoding: 'utf8', maxBuffer: 2 * 1024 * 1024,
}))

describe('UTC calendar-date contract', () => {
  const expected = run('UTC')
  it.each(['America/Los_Angeles', 'Asia/Tokyo', 'Pacific/Kiritimati',
    'Pacific/Honolulu', 'Australia/Lord_Howe', 'Europe/London'])('is identical on host TZ=%s', tz => {
    expect(run(tz)).toEqual(expected)
  })

  it.each(['2011-12-29', '2011-12-30'])('fails explicitly for an unrepresentable Samoa date/night: %s', day => {
    const code = `
      import assert from 'node:assert/strict';
      import { prayerTimes, astronomical } from './src/index.js';
      const date = new Date('${day}T12:00:00Z');
      assert.throws(() => prayerTimes({ latitude: 33.5769, longitude: -7.5473, date }), RangeError);
      assert.throws(() => astronomical(33.5769, -7.5473, date), RangeError);
    `
    expect(() => execFileSync(process.execPath, ['--input-type=module', '-e', code], {
      cwd: root, env: { ...process.env, TZ: 'Pacific/Apia' }, stdio: 'pipe',
    })).not.toThrow()
  })
})
