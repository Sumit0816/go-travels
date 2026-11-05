import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { slugField, type CollectionConfig, type Where } from 'payload'

import { hiddenWithout, publicContentAccess } from '@/access'
import { PackageCardBlock } from '@/blocks'
import { CACHE_TAGS } from '@/lib/revalidate'
import { revalidateHooks, seoField } from '@/fields'

/** Published posts, plus scheduled posts whose publish time has passed. */
export const visiblePostsWhere = (): Where => ({
  or: [
    { status: { equals: 'published' } },
    {
      and: [
        { status: { equals: 'scheduled' } },
        { publishedAt: { less_than_equal: new Date().toISOString() } },
      ],
    },
  ],
})

export const PostCategories: CollectionConfig = {
  slug: 'postCategories',
  labels: { singular: 'Blog category', plural: 'Blog categories' },
  admin: { useAsTitle: 'name', group: 'Content', hidden: hiddenWithout('content') },
  access: publicContentAccess('content'),
  hooks: revalidateHooks([CACHE_TAGS.posts]),
  fields: [{ name: 'name', type: 'text', required: true }, slugField({ useAsSlug: 'name' })],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Blog post', plural: 'Blog posts' },
  versions: { maxPerDoc: 25 },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'category', 'author', 'status', 'publishedAt'],
    listSearchableFields: ['title'],
    hidden: hiddenWithout('content'),
  },
  access: publicContentAccess('content', visiblePostsWhere),
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.status === 'published' && !data.publishedAt)
          data.publishedAt = new Date().toISOString()
        return data
      },
    ],
    ...revalidateHooks([CACHE_TAGS.posts], (d) => (d.slug ? CACHE_TAGS.post(d.slug) : undefined)),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ useAsSlug: 'title' }),
    { name: 'excerpt', type: 'textarea', maxLength: 240 },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'content',
      type: 'richText',
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({ blocks: [PackageCardBlock] }),
        ],
      }),
    },
    seoField(),
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Scheduled', value: 'scheduled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      label: 'Publish date',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      validate: (value: unknown, { siblingData }: { siblingData: { status?: string } }) =>
        siblingData?.status === 'scheduled' && !value
          ? 'Choose when the post should go live.'
          : true,
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'postCategories',
      admin: { position: 'sidebar' },
    },
    { name: 'author', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    {
      name: 'featured',
      label: 'Feature on blog page',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
}
