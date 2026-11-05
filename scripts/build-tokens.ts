import fs from 'node:fs'
import path from 'node:path'

import { buildTokensCss, type DesignTokens } from '../src/design/build-tokens'

const root = path.resolve(import.meta.dirname, '..')
const tokens = JSON.parse(
  fs.readFileSync(path.join(root, 'src/design/tokens.json'), 'utf8'),
) as DesignTokens
const outFile = path.join(root, 'src/styles/tokens.css')

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, buildTokensCss(tokens))
console.log(`Wrote ${path.relative(root, outFile)}`)
