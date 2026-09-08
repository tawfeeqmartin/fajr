// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
// Human-approved correctness repairs use exact metric identity, never a
// relaxed calibration ratchet. The default remains strict calibration.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { compare, validateTrainingPair } from '../eval/compare.js'

export function checkEvalChange(previous, current, { unchanged = false, log = console.log } = {}) {
  if (!unchanged) return compare(previous, current, { log })
  const errors = validateTrainingPair(previous, current)
  if (errors.length || !previous.test || !current.test ||
      !isDeepStrictEqual(previous.train, current.train) ||
      !isDeepStrictEqual(previous.test, current.test)) {
    log('FAIL — correctness-only repairs require valid, exactly identical train and holdout metrics.')
    for (const error of errors) log(error)
    return 1
  }
  log('PASS — correctness-only metric identity. No calibration improvement is claimed.')
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [baseline, candidate, mode = 'calibration', ...extra] = process.argv.slice(2)
  if (!baseline || !candidate || extra.length || !['calibration', 'unchanged'].includes(mode)) {
    console.error('Usage: node scripts/check-eval-change.js baseline.jsonl candidate.jsonl [calibration|unchanged]')
    process.exit(2)
  }
  try {
    const latest = path => JSON.parse(readFileSync(path, 'utf8').trim().split('\n').at(-1))
    process.exitCode = checkEvalChange(latest(baseline), latest(candidate), { unchanged: mode === 'unchanged' })
  } catch (error) {
    console.error(`FAIL — cannot read comparison records: ${error.message}`)
    process.exitCode = 2
  }
}
