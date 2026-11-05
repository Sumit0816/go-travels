import type { CollectionConfig } from 'payload'

import { publicContentAccess } from '@/access'
import { CACHE_TAGS } from '@/lib/revalidate'
import { revalidateHooks } from '@/fields'

/** Only approved reviews appear in "What Our Clients Say". */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  labels: { singular: 'Testimonial', plural: 'Testimonials' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'tripLabel', 'rating', 'source', 'status', 'createdAt'],
    description: 'Only approved reviews appear in "What Our Clients Say".',
  },
  access: publicContentAccess('testimonials', { status: { equals: 'approved' } }),
  hooks: revalidateHooks([CACHE_TAGS.testimonials]),
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'package', type: 'relationship', relationTo: 'packages', admin: { width: '50%' } },
        {
          name: 'tripLabel',
          label: 'Trip label',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Shown under the name, e.g. "Goa Beach Escape · Dec 2026"',
          },
        },
      ],
    },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5, defaultValue: 5 },
    { name: 'text', label: 'Review', type: 'textarea', required: true, maxLength: 600 },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Hidden', value: 'hidden' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      options: [
        { label: 'Via review link', value: 'reviewLink' },
        { label: 'Added by staff', value: 'staff' },
        { label: 'Google review', value: 'google' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
