import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Field,
  GroupField,
} from 'payload'

import { safeRevalidate } from '@/lib/revalidate'

/** Meta title / description / share image. Empty values fall back to Site Settings defaults. */
export function seoField(): GroupField {
  return {
    name: 'seo',
    label: 'SEO',
    type: 'group',
    admin: { description: 'Leave empty to use the title and the site defaults.' },
    fields: [
      { name: 'metaTitle', type: 'text', maxLength: 70 },
      { name: 'metaDescription', type: 'textarea', maxLength: 170 },
      { name: 'ogImage', label: 'Share image', type: 'upload', relationTo: 'media' },
    ],
  }
}

/** Publish status kept in a plain select so public read rules can filter on it. */
export function statusField(
  options: { label: string; value: string }[],
  defaultValue: string,
): Field {
  return {
    name: 'status',
    type: 'select',
    required: true,
    defaultValue,
    options,
    index: true,
    admin: { position: 'sidebar' },
  }
}

export const PUBLISH_STATUS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

/**
 * A link that can point at a category, destination, package, page or custom URL.
 * Used by the slider buttons and menus.
 */
export function linkFields(): Field[] {
  return [
    {
      name: 'linkType',
      type: 'select',
      required: true,
      defaultValue: 'custom',
      options: [
        { label: 'Category', value: 'category' },
        { label: 'Destination', value: 'destination' },
        { label: 'Package', value: 'package' },
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: { condition: (_, s) => s?.linkType === 'category' },
    },
    {
      name: 'destination',
      type: 'relationship',
      relationTo: 'destinations',
      admin: { condition: (_, s) => s?.linkType === 'destination' },
    },
    {
      name: 'package',
      type: 'relationship',
      relationTo: 'packages',
      admin: { condition: (_, s) => s?.linkType === 'package' },
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: { condition: (_, s) => s?.linkType === 'page' },
    },
    {
      name: 'url',
      label: 'URL',
      type: 'text',
      admin: {
        condition: (_, s) => s?.linkType === 'custom',
        description: 'A path like /tours/domestic or a full https:// link.',
      },
    },
  ]
}

/** afterChange + afterDelete hooks that invalidate the given cache tags (plus a per-slug tag). */
export function revalidateHooks(
  tags: string[],
  perDoc?: (doc: { slug?: string | null }) => string | undefined,
): { afterChange: CollectionAfterChangeHook[]; afterDelete: CollectionAfterDeleteHook[] } {
  const run = (
    doc: { slug?: string | null },
    previousDoc?: { slug?: string | null },
    context?: Record<string, unknown>,
  ) => {
    const all = [...tags]
    for (const d of [doc, previousDoc]) {
      const tag = d && perDoc?.(d)
      if (tag) all.push(tag)
    }
    safeRevalidate(all, context)
  }
  return {
    afterChange: [
      ({ doc, previousDoc, req }) => {
        run(doc, previousDoc, req.context)
        return doc
      },
    ],
    afterDelete: [
      ({ doc, req }) => {
        run(doc, undefined, req.context)
        return doc
      },
    ],
  }
}
