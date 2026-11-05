/**
 * Helpers for blog posts stored as Lexical rich text: plain text, read time and the
 * "On this page" heading list. Pure, so they are unit-tested.
 */

type LexNode = { type?: string; text?: string; tag?: string; children?: LexNode[] }

const childrenOf = (n: unknown): LexNode[] =>
  n && typeof n === 'object' && Array.isArray((n as LexNode).children)
    ? (n as LexNode).children!
    : []

/** All text inside a node, joined. */
export function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as LexNode
  if (typeof n.text === 'string') return n.text
  return childrenOf(n).map(nodeText).join('')
}

const rootOf = (content: unknown): LexNode | null =>
  content && typeof content === 'object' && 'root' in content
    ? ((content as { root: LexNode }).root ?? null)
    : null

/** Plain text of a whole document, one block per line. */
export function plainText(content: unknown): string {
  const root = rootOf(content)
  return root ? childrenOf(root).map(nodeText).filter(Boolean).join('\n') : ''
}

const WORDS_PER_MINUTE = 200

/** Reading time in whole minutes (at least 1). */
export function readMinutes(content: unknown): number {
  const words = plainText(content).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** URL fragment for a heading: lowercase words joined by hyphens. */
export function headingId(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section'
  )
}

/** The post's h2 headings, with unique ids, for the "On this page" list. */
export function tableOfContents(content: unknown): { id: string; text: string }[] {
  const root = rootOf(content)
  if (!root) return []
  const seen = new Map<string, number>()
  const out: { id: string; text: string }[] = []
  for (const n of childrenOf(root)) {
    if (n.type !== 'heading' || n.tag !== 'h2') continue
    const text = nodeText(n).trim()
    if (!text) continue
    out.push({ id: uniqueId(headingId(text), seen), text })
  }
  return out
}

/** Appends -2, -3 … to repeated ids; `seen` is shared across one document. */
export function uniqueId(id: string, seen: Map<string, number>): string {
  const count = seen.get(id) ?? 0
  seen.set(id, count + 1)
  return count ? `${id}-${count + 1}` : id
}
