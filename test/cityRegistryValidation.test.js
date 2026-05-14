// بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
// Bismillah ir-Rahman ir-Rahim

import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

describe('city registry validator', () => {
  it('does not report bbox edge-touch as cross-country overlap', () => {
    const output = execFileSync(
      process.execPath,
      ['scripts/validate-city-registry.js'],
      {
        cwd: ROOT,
        encoding: 'utf-8',
        env: { ...process.env, SHOW_WARNS: '1' },
      }
    )

    expect(output).toContain('Validation PASSED: 0 fail-class issues.')
    expect(output).not.toContain('Brazzaville|CG ∩ Kinshasa|CD')
    expect(output).not.toContain('bbox-overlap-cross-country')
  })
})
