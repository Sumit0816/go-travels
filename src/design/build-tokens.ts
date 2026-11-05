/**
 * Turns the Go Travels design-system tokens (src/design/tokens.json, copied from the
 * design system artifact) into a Tailwind 4 `@theme` block.
 *
 * Generated names:
 *   colours  → --color-<name>      (bg-ocean-700, text-ink-500, border-line-200 …)
 *   type     → --text-<name>        (text-h1, text-body-sm, text-eyebrow …) with line-height,
 *                                   weight and letter-spacing baked in
 *   radius   → --radius-<sm|md|lg|xl|pill>  (rounded-md, rounded-pill …)
 *   shadow   → --shadow-<card|float|modal>  (shadow-card …)
 *   sizes    → --size-<name> plain variables + --container-site (max-w-site)
 *   spacing  → --space-<n> plain variables (Tailwind's default 4px scale already matches)
 *
 * `@theme static` makes Tailwind emit every variable even when no utility class uses it,
 * because components.css and inline styles read them through var(--color-…).
 *
 * Run `npm run tokens` after updating tokens.json.
 */

type Token = { name: string; value: string; usage?: string }
type TypeStyle = {
  name: string
  fontSize: string
  lineHeight: number | string
  fontWeight: number | string
  letterSpacing?: string
}
export type DesignTokens = {
  name: string
  color: { tokens: Token[] }
  type: { families: Record<string, string>; groups: { family: string; styles: TypeStyle[] }[] }
  spacing: { tokens: Token[] }
  radius: { tokens: Token[] }
  shadow: { tokens: Token[] }
  size: { tokens: Token[] }
}

/** Mobile drops headings one step (design-system README → Type). */
const MOBILE_TYPE: Record<string, string> = { display: '36px', h1: '26px', h2: '28px', h3: '20px' }

const strip = (name: string, prefix: string) =>
  name.startsWith(prefix) ? name.slice(prefix.length) : name

export function buildTokensCss(tokens: DesignTokens): string {
  const out: string[] = []
  out.push(
    `/* ${tokens.name} — generated from src/design/tokens.json by \`npm run tokens\`. Do not edit. */`,
  )
  out.push('')
  out.push('@theme static {')

  out.push('  /* Colour */')
  for (const t of tokens.color.tokens) out.push(`  --color-${t.name}: ${t.value};`)

  out.push('')
  out.push(
    '  /* Type families (--font-sora / --font-inter are the self-hosted fonts, set in globals.css) */',
  )
  out.push(`  --font-display: var(--font-sora), ${tokens.type.families.display};`)
  out.push(`  --font-body: var(--font-inter), ${tokens.type.families.body};`)
  out.push(`  --font-sans: var(--font-body);`)

  out.push('')
  out.push('  /* Type scale */')
  for (const group of tokens.type.groups) {
    for (const s of group.styles) {
      out.push(`  --text-${s.name}: ${s.fontSize};`)
      out.push(`  --text-${s.name}--line-height: ${s.lineHeight};`)
      out.push(`  --text-${s.name}--font-weight: ${s.fontWeight};`)
      if (s.letterSpacing) out.push(`  --text-${s.name}--letter-spacing: ${s.letterSpacing};`)
    }
  }

  out.push('')
  out.push('  /* Radius */')
  for (const t of tokens.radius.tokens)
    out.push(`  --radius-${strip(t.name, 'radius-')}: ${t.value};`)

  out.push('')
  out.push('  /* Shadow */')
  for (const t of tokens.shadow.tokens)
    out.push(`  --shadow-${strip(t.name, 'shadow-')}: ${t.value};`)

  out.push('')
  out.push('  /* Layout */')
  const container = tokens.size.tokens.find((t) => t.name === 'container')
  if (container) out.push(`  --container-site: ${container.value};`)
  out.push('}')

  out.push('')
  out.push(':root {')
  for (const t of tokens.spacing.tokens) out.push(`  --${t.name}: ${t.value};`)
  for (const t of tokens.size.tokens) out.push(`  --size-${t.name}: ${t.value};`)
  for (const [name, size] of Object.entries(MOBILE_TYPE))
    out.push(`  --text-${name}-mobile: ${size};`)
  out.push('}')
  out.push('')

  return out.join('\n')
}
