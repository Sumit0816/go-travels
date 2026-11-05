/**
 * Builds Lexical rich-text JSON (the format Payload stores) from simple building blocks.
 * Used by the seed script and anywhere content is created in code.
 */

type TextNode = {
  type: 'text'
  text: string
  format: number
  style: string
  mode: 'normal'
  detail: number
  version: 1
}

type ElementBase = { format: ''; indent: 0; version: 1; direction: 'ltr' }

export type RichNode =
  | (ElementBase & { type: 'paragraph'; textFormat: 0; textStyle: ''; children: TextNode[] })
  | (ElementBase & { type: 'heading'; tag: 'h2' | 'h3'; children: TextNode[] })
  | (ElementBase & {
      type: 'list'
      listType: 'bullet' | 'number'
      tag: 'ul' | 'ol'
      start: 1
      children: RichNode[]
    })
  | (ElementBase & { type: 'listitem'; value: number; children: TextNode[] })
  | {
      type: 'block'
      version: 2
      format: ''
      fields: Record<string, unknown> & { blockType: string }
    }

export type RichText = {
  root: ElementBase & { type: 'root'; children: RichNode[] }
}

const BOLD = 1
const base: ElementBase = { format: '', indent: 0, version: 1, direction: 'ltr' }

/** `**bold**` segments become bold text; everything else is plain. */
function textNodes(text: string): TextNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => {
      const bold = part.startsWith('**') && part.endsWith('**')
      return {
        type: 'text',
        text: bold ? part.slice(2, -2) : part,
        format: bold ? BOLD : 0,
        style: '',
        mode: 'normal',
        detail: 0,
        version: 1,
      }
    })
}

export const p = (text: string): RichNode => ({
  ...base,
  type: 'paragraph',
  textFormat: 0,
  textStyle: '',
  children: textNodes(text),
})

export const h2 = (text: string): RichNode => ({
  ...base,
  type: 'heading',
  tag: 'h2',
  children: textNodes(text),
})
export const h3 = (text: string): RichNode => ({
  ...base,
  type: 'heading',
  tag: 'h3',
  children: textNodes(text),
})

export const ul = (items: string[]): RichNode => ({
  ...base,
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  children: items.map((item, i) => ({
    ...base,
    type: 'listitem',
    value: i + 1,
    children: textNodes(item),
  })),
})

export const block = (blockType: string, fields: Record<string, unknown>): RichNode => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { blockName: '', ...fields, blockType },
})

/** A rich-text document. Plain strings become paragraphs. */
export function richText(...nodes: (RichNode | string)[]): RichText {
  return {
    root: {
      ...base,
      type: 'root',
      children: nodes.map((n) => (typeof n === 'string' ? p(n) : n)),
    },
  }
}
