import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  RichText as PayloadRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'

import { cn } from '@/lib/cn'

/** Converters for custom blocks; the blog's package card block is added in Phase 4c. */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({ ...defaultConverters })

/** Renders CMS rich text with the site's typography (`.gt-prose`). */
export function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!data || typeof data !== 'object' || !('root' in data)) return null
  return (
    <PayloadRichText
      data={data as SerializedEditorState}
      converters={converters}
      className={cn('gt-prose', className)}
      disableContainer={false}
    />
  )
}
