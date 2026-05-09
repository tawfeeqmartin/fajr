// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

describe('city registry generator', () => {
  it('matches the checked-in runtime registry', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/build-city-registry.js', '--check'],
      { cwd: ROOT, encoding: 'utf-8' }
    )

    expect(output).toContain('check passed')
  })
})
