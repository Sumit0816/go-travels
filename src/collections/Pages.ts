import { slugField, type CollectionConfig } from 'payload'

import { hiddenWithout, publicContentAccess } from '@/access'
import { PAGE_BLOCKS } from '@/blocks'
import { CACHE_TAGS } from '@/lib/revalidate'
import { revalidateHooks, seoField } from '@/fields'

/** Content pages: About, Contact, Privacy Policy, Terms & Conditions. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  versions: { maxPerDoc: 25 },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    hidden: hiddenWithout('content'),
  },
  access: publicContentAccess('content', { status: { equals: 'published' } }),
  hooks: revalidateHooks([CACHE_TAGS.pages], (d) => (d.slug ? CACHE_TAGS.page(d.slug) : undefined)),
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    { name: 'layout', type: 'blocks', blocks: PAGE_BLOCKS, required: true },
    seoField(),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
