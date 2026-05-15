// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

describe('release preflight script', () => {
  it('lists the release gate checks without executing them', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/preflight-release.js', '--list-json'],
      { cwd: ROOT, encoding: 'utf8' }
    )
    const steps = JSON.parse(output)

    expect(steps.map(step => step.id)).toEqual([
      'diff-whitespace',
      'unit-tests',
      'registry-validation',
      'registry-build-sync',
      'package-dry-run',
    ])
    expect(steps.find(step => step.id === 'package-dry-run')).toMatchObject({
      command: 'npm',
      args: ['pack', '--dry-run'],
    })
  })
})
