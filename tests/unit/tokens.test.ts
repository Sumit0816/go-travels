import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { buildTokensCss, type DesignTokens } from '@/design/build-tokens'

const root = path.resolve(__dirname, '../..')
const tokens = JSON.parse(
  fs.readFileSync(path.join(root, 'src/design/tokens.json'), 'utf8'),
) as DesignTokens
const css = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8')

describe('design tokens', () => {
  it('tokens.css is up to date with tokens.json (run `npm run tokens`)', () => {
    expect(css.replace(/\r\n/g, '\n')).toBe(buildTokensCss(tokens))
  })

  it('emits every colour token with its exact value', () => {
    for (const t of tokens.color.tokens) {
      expect(css).toContain(`--color-${t.name}: ${t.value};`)
    }
  })

  it('keeps the brand anchors from the design system', () => {
    expect(css).toContain('--color-ocean-700: #0B4F6C;')
    expect(css).toContain('--color-marigold-500: #F2A541;')
    expect(css).toContain('--color-whatsapp-600: #0F7A4A;')
    expect(css).toContain('--size-touch-min: 44px;')
    expect(css).toContain('--container-site: 1280px;')
    expect(css).toContain('--radius-pill: 999px;')
  })
})
