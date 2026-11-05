import { slugField, type CollectionConfig } from 'payload'

import { publicContentAccess } from '@/access'
import { DESTINATION_TONES } from '@/lib/catalog'
import { CACHE_TAGS } from '@/lib/revalidate'
import { revalidateHooks, seoField } from '@/fields'

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  labels: { singular: 'Destination', plural: 'Destinations' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'region', 'hasPage', 'updatedAt'],
    listSearchableFields: ['name', 'region'],
  },
  access: publicContentAccess('packages'),
  hooks: revalidateHooks([CACHE_TAGS.destinations, CACHE_TAGS.packages]),
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ useAsSlug: 'name' }),
    {
      name: 'region',
      type: 'text',
      admin: { description: 'e.g. West India, Jharkhand, Middle East, Southeast Asia' },
    },
    {
      name: 'isInternational',
      label: 'International',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'tone',
      label: 'Fallback colour',
      type: 'select',
      defaultValue: 'coast',
      options: [...DESTINATION_TONES],
      admin: { position: 'sidebar', description: 'Shown while there is no photo.' },
    },
    { name: 'thumbnail', type: 'upload', relationTo: 'media' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    {
      name: 'intro',
      type: 'textarea',
      admin: { description: 'One or two sentences for the page header.' },
    },
    { name: 'description', type: 'richText' },
    {
      name: 'hasPage',
      label: 'Has its own page',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    seoField(),
  ],
}
