// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { describe, expect, it } from 'vitest'
import { compare } from '../eval/compare.js'
import { checkEvalChange } from '../scripts/check-eval-change.js'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const prayers = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha']
const institution = 'Mawaqit (mosque-published)'
const biases = () => Object.fromEntries(prayers.map(p => [p, 0]))
const metric = () => ({ count: 10, wmae: 1, perPrayer: biases(), perPrayerSigned: biases() })
function pair() {
  const prev = {
    schema: 3, timestamp: 'before',
    train: { entries: 10, wmae: 1, perPrayer: biases(), perPrayerSigned: biases(),
      perSource: { [institution]: metric() }, perCell: { 'City / source': metric() }, perRegion: { City: metric() } },
    test: { entries: 0, wmae: null, perSource: {} },
  }
  const curr = structuredClone(prev)
  curr.timestamp = 'after'
  curr.train.wmae = 0.9
  return [prev, curr]
}
const verdict = (p, c) => compare(p, c, { log: () => {} })

describe('accuracy ratchet integrity', () => {
  it('requires explicit correctness mode and exact identity, including holdout and nested metrics', () => {
    const [p] = pair()
    const c = structuredClone(p)
    const silent = { log: () => {} }
    expect(checkEvalChange(p, c, silent)).toBe(1)
    expect(checkEvalChange(p, c, { ...silent, unchanged: true })).toBe(0)
    for (const mutate of [
      value => { value.train.wmae -= 0.001 },
      value => { value.train.perRegion.City.perPrayerSigned.fajr += 0.001 },
      value => { value.test.wmae = 0.001 },
      value => { delete value.train.perSource },
    ]) {
      const candidate = structuredClone(c)
      mutate(candidate)
      expect(checkEvalChange(p, candidate, { ...silent, unchanged: true })).toBe(1)
    }
  })
  it('CLI refuses malformed or incompatible final records instead of using an older passing pair', () => {
    const dir = mkdtempSync(join(tmpdir(), 'fajr-ratchet-'))
    const file = join(dir, 'runs.jsonl')
    const cli = fileURLToPath(new URL('../eval/compare.js', import.meta.url))
    const rows = pair().map(JSON.stringify).join('\n')
    try {
      writeFileSync(file, rows + '\n')
      expect(spawnSync(process.execPath, [cli, '--runs', file]).status).toBe(0)
      for (const tail of ['{broken', '{"schema":2}', 'null']) {
        writeFileSync(file, rows + '\n' + tail + '\n')
        expect(spawnSync(process.execPath, [cli, '--runs', file]).status).toBe(2)
      }
    } finally { rmSync(dir, { recursive: true, force: true }) }
  })
  it('accepts a strict improvement and rejects a wash or regression', () => {
    const [p, c] = pair()
    expect(verdict(p, c)).toBe(0)
    for (const wmae of [1, 1.01]) {
      c.train.wmae = wmae
      expect(verdict(p, c)).toBe(1)
    }
  })

  it.each(['Aladhan API', institution])('holdout %s cannot excuse unsafe bias', source => {
    const [p, c] = pair()
    c.train.perPrayerSigned.fajr = -0.5
    expect(verdict(p, c)).toBe(1)
    p.test = { entries: 10, wmae: 2, perSource: { [source]: { ...metric(), perPrayerSigned: { ...biases(), fajr: 2 } } } }
    c.test = { entries: 10, wmae: 0, perSource: { [source]: metric() } }
    expect(verdict(p, c)).toBe(1)
  })

  it('accepts corroboration from an eligible TRAIN institution even if holdout disagrees', () => {
    const [p, c] = pair()
    p.train.perSource[institution].perPrayerSigned.fajr = 2
    c.train.perPrayerSigned.fajr = -0.5
    expect(verdict(p, c)).toBe(0)
    p.test.perSource[institution] = metric()
    c.test.perSource[institution] = { ...metric(), perPrayerSigned: { ...biases(), fajr: 20 } }
    expect(verdict(p, c)).toBe(0)
  })

  it('does not accept calculated or unknown TRAIN sources as independent corroboration', () => {
    for (const source of ['Aladhan API', 'Unknown institution', 'Mawaqit-like calculation']) {
      const [p, c] = pair()
      p.train.perSource = { [source]: { ...metric(), perPrayerSigned: { ...biases(), fajr: 2 } } }
      c.train.perSource = { [source]: metric() }
      c.train.perPrayerSigned.fajr = -0.5
      expect(verdict(p, c)).toBe(1)
    }
  })

  it.each(['perSource', 'perCell', 'perRegion'])('rejects %s regression and lost coverage', group => {
    const [p, c] = pair()
    const key = Object.keys(c.train[group])[0]
    c.train[group][key].wmae += 0.11
    expect(verdict(p, c)).toBe(1)
    delete c.train[group][key]
    expect(verdict(p, c)).toBe(1)
  })

  it.each([null, NaN, Infinity, undefined, '0.1'])('fails closed for invalid training WMAE %s', value => {
    const [p, c] = pair()
    c.train.wmae = value
    expect(verdict(p, c)).toBe(1)
  })

  it('rejects nonfinite/missing nested metrics and changed sample counts', () => {
    for (const mutate of [
      c => { c.train.entries-- },
      c => { c.train.perCell['City / source'].count-- },
      c => { c.train.perRegion.City.perPrayerSigned.fajr = null },
      c => { delete c.train.perPrayerSigned.isha },
      c => { c.train.perSource[institution].wmae = null },
    ]) {
      const [p, c] = pair()
      mutate(c)
      expect(verdict(p, c)).toBe(1)
    }
  })
})
