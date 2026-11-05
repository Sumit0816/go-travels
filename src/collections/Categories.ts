import { slugField, type CollectionConfig } from 'payload'

import { publicContentAccess } from '@/access'
import { CATEGORY_COLOURS } from '@/lib/catalog'
import { CACHE_TAGS } from '@/lib/revalidate'
import { revalidateHooks, seoField } from '@/fields'

/** Tour categories: Domestic, International, Honeymoon, Jharkhand, Religious, Family, MICE. */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  orderable: true,
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'eyebrow', 'showOnHome', 'updatedAt'],
    description: 'Groups packages for the menus, homepage tiles and listing pages.',
  },
  access: publicContentAccess('packages'),
  hooks: revalidateHooks([CACHE_TAGS.categories, CACHE_TAGS.packages]),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ useAsSlug: 'name' }),
    {
      name: 'eyebrow',
      type: 'text',
      admin: { description: 'Short caps label on the homepage tile, e.g. INDIA, ABROAD.' },
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: { description: 'e.g. "Goa, Kashmir, Kerala, Jharkhand"' },
    },
    {
      name: 'intro',
      type: 'textarea',
      admin: { description: 'Shown under the listing page title.' },
    },
    {
      name: 'colour',
      type: 'select',
      defaultValue: 'ocean',
      options: [...CATEGORY_COLOURS],
      admin: { position: 'sidebar' },
    },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      name: 'subDestinations',
      label: 'Destination chips',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
      admin: { description: 'Chips shown above the listing, in this order.' },
    },
    {
      name: 'showOnHome',
      label: 'Show in "Our Categories"',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    seoField(),
  ],
}
