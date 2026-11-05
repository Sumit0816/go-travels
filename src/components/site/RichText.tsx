import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  RichText as PayloadRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { PackageCard } from '@/components/ui/PackageCard'
import { headingId, nodeText, uniqueId } from '@/lib/blog'
import { toPackageCard } from '@/lib/cms'
import { cn } from '@/lib/cn'
import { firstImage } from '@/lib/site/media'
import type { Package } from '@/payload-types'

const HEADINGS = new Set(['h2', 'h3', 'h4', 'h5', 'h6'])

/**
 * Converters for this document. A fresh `seen` map per render keeps h2 ids in step with
 * `tableOfContents()` (the blog's "On this page" list).
 */
function makeConverters(): JSXConvertersFunction {
  const seen = new Map<string, number>()
  return ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX }) => {
      const children: ReactNode = nodesToJSX({ nodes: node.children })
      // h1 is reserved for the page title.
      const Tag = (HEADINGS.has(node.tag) ? node.tag : 'h2') as 'h2'
      const id = Tag === 'h2' ? uniqueId(headingId(nodeText(node).trim()), seen) : undefined
      return (
        <Tag id={id} className={id ? 'gt-anchor' : undefined}>
          {children}
        </Tag>
      )
    },
    blocks: {
      packageCard: ({ node }: { node: { fields: Record<string, unknown> } }) => {
        const pkg = (node.fields as { package?: Package | number | null }).package
        if (!pkg || typeof pkg !== 'object' || pkg.status !== 'published') return null
        const img = firstImage(pkg.gallery, 'card')
        const c = toPackageCard(pkg, img && { src: img.src, alt: img.alt })
        return (
          <div className="my-6 max-w-[360px]">
            <PackageCard
              href={c.href}
              title={c.title}
              place={c.place}
              nights={c.nights}
              days={c.days}
              inclusions={c.inclusions}
              price={c.price}
              tag={c.tag}
              tone={c.tone}
              imageUrl={c.image?.src}
              imageAlt={c.image?.alt}
              ctaLabel="View Details"
            />
          </div>
        )
      },
    },
  })
}

/** Renders CMS rich text with the site's typography (`.gt-prose`). */
export function RichText({ data, className }: { data: unknown; className?: string }) {
  if (!data || typeof data !== 'object' || !('root' in data)) return null
  return (
    <PayloadRichText
      data={data as SerializedEditorState}
      converters={makeConverters()}
      className={cn('gt-prose', className)}
      disableContainer={false}
    />
  )
}
