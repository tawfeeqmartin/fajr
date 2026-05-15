// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim
/**
 * Release preflight for npm publishing.
 *
 * This is the reproducible version of the manual checks maintainers were
 * already running before release tags. It intentionally avoids eval ratchet
 * commands because accuracy PRs still need their own autoresearch log and
 * `node eval/eval.js && npm run compare` result before merge.
 */

import { spawnSync } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const nodeCommand = process.execPath

const STEPS = [
  {
    id: 'diff-whitespace',
    title: 'Diff whitespace check',
    command: 'git',
    args: ['diff', '--check', 'HEAD', '--'],
    note: 'Catches trailing whitespace and conflict-marker style diff errors before a tag.',
  },
  {
    id: 'unit-tests',
    title: 'Unit and integration tests',
    command: npmCommand,
    args: ['test'],
    note: 'Runs the Vitest suite that guards API, registry, geometry-source, Hijri, hilal, and engine behavior.',
  },
  {
    id: 'registry-validation',
    title: 'City registry validator',
    command: npmCommand,
    args: ['run', 'validate:registry'],
    note: 'Runs the full reverse-geolocation registry validator with deterministic bbox samples.',
  },
  {
    id: 'registry-build-sync',
    title: 'Generated city registry sync',
    command: nodeCommand,
    args: ['scripts/build-city-registry.js', '--check'],
    note: 'Verifies src/data/cities.json still matches the checked-in generator inputs.',
  },
  {
    id: 'package-dry-run',
    title: 'npm package dry run',
    command: npmCommand,
    args: ['pack', '--dry-run'],
    note: 'Shows the exact files npm would publish without creating a release.',
  },
]

if (process.argv.includes('--list-json')) {
  console.log(JSON.stringify(STEPS.map(publicStep), null, 2))
  process.exit(0)
}

console.log('# fajr release preflight')
console.log('')
console.log('These checks must pass before tagging or publishing an npm release.')

for (let i = 0; i < STEPS.length; i++) {
  const step = STEPS[i]
  console.log('')
  console.log(`[${i + 1}/${STEPS.length}] ${step.title}`)
  console.log(`$ ${formatCommand(step)}`)
  console.log(step.note)

  const started = Date.now()
  const result = spawnSync(step.command, step.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) {
    console.error('')
    console.error(`preflight failed: could not run ${formatCommand(step)}`)
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) {
    const suffix = result.signal ? `signal ${result.signal}` : `exit ${result.status}`
    console.error('')
    console.error(`preflight failed at "${step.title}" (${suffix})`)
    process.exit(result.status || 1)
  }

  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`ok: ${step.title} (${elapsedSec}s)`)
}

console.log('')
console.log('Release preflight passed.')

function publicStep(step) {
  return {
    id: step.id,
    title: step.title,
    command: step.command === nodeCommand ? 'node' : step.command.replace(/\.cmd$/, ''),
    args: step.args,
    note: step.note,
  }
}

function formatCommand(step) {
  const command = step.command === nodeCommand ? 'node' : step.command.replace(/\.cmd$/, '')
  return [command, ...step.args].join(' ')
}
