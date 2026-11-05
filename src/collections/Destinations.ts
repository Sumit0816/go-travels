import { slugField, type CollectionConfig } from 'payload'

import { publicContentAccess } from '@/access'
import { DESTINATION_TONES, MONTHS } from '@/lib/catalog'
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
      name: 'facts',
      label: 'Quick facts',
      type: 'group',
      admin: { description: 'The strip under the page title. Leave a fact empty to hide it.' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'bestTime',
              type: 'text',
              admin: { width: '33%', description: 'e.g. November – February' },
            },
            {
              name: 'idealDuration',
              type: 'text',
              admin: { width: '33%', description: 'e.g. 3 – 5 nights' },
            },
            {
              name: 'nearestAirports',
              type: 'text',
              admin: { width: '33%', description: 'e.g. Dabolim (GOI) · Mopa (GOX)' },
            },
          ],
        },
      ],
    },
    {
      name: 'places',
      label: 'Top places to visit',
      type: 'array',
      maxRows: 8,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'seasons',
      label: 'When to go',
      type: 'group',
      admin: { description: 'Months you leave out are shown without a rating.' },
      fields: [
        { name: 'bestMonths', type: 'select', hasMany: true, options: [...MONTHS] },
        { name: 'bestNote', type: 'text', admin: { description: 'e.g. pleasant, peak season' } },
        { name: 'goodMonths', type: 'select', hasMany: true, options: [...MONTHS] },
        { name: 'goodNote', type: 'text', admin: { description: 'e.g. warm, fewer crowds' } },
        {
          name: 'offMonths',
          label: 'Monsoon / off months',
          type: 'select',
          hasMany: true,
          options: [...MONTHS],
        },
        {
          name: 'offNote',
          type: 'text',
          admin: { description: 'e.g. green, many beach shacks closed' },
        },
      ],
    },
    {
      name: 'faqs',
      label: 'FAQs',
      type: 'array',
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
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
