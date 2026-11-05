import type { GlobalConfig } from 'payload'

import { canWrite, hiddenWithout } from '@/access'
import { CACHE_TAGS, safeRevalidate } from '@/lib/revalidate'

export const HOMEPAGE_SECTIONS = [
  { label: 'Hero slider', value: 'slider' },
  { label: 'Search widget', value: 'search' },
  { label: 'Popular destinations', value: 'popular' },
  { label: 'Our categories', value: 'categories' },
  { label: 'Why choose Go Travels', value: 'whyUs' },
  { label: 'Custom-trip band', value: 'ctaBand' },
  { label: 'Testimonials', value: 'testimonials' },
] as const

/** Homepage section order and visibility, plus the copy of the fixed sections. */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  admin: {
    hidden: hiddenWithout('homepage'),
    group: 'Content',
    description: 'Drag to reorder sections; untick to hide one.',
  },
  access: {
    read: () => true,
    update: ({ req }) => canWrite('homepage', req.user?.role),
  },
  hooks: {
    afterChange: [
      ({ doc, req }) => {
        safeRevalidate([CACHE_TAGS.global('homepage')], req.context)
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'sections',
      type: 'array',
      defaultValue: HOMEPAGE_SECTIONS.map((s) => ({ section: s.value, visible: true })),
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'section',
              type: 'select',
              required: true,
              options: [...HOMEPAGE_SECTIONS],
              admin: { width: '70%' },
            },
            { name: 'visible', type: 'checkbox', defaultValue: true, admin: { width: '30%' } },
          ],
        },
      ],
    },
    {
      name: 'popularTabs',
      label: 'Popular destinations tabs',
      type: 'relationship',
      relationTo: 'destinations',
      hasMany: true,
      admin: { description: 'Tabs under "Popular Destinations", in this order.' },
    },
    {
      name: 'whyUs',
      label: 'Why choose Go Travels',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'WHY CHOOSE GO TRAVELS?' },
        { name: 'heading', type: 'text', defaultValue: 'Travel planned with care, end to end' },
        {
          name: 'items',
          type: 'array',
          maxRows: 6,
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'text', type: 'textarea' },
            {
              name: 'icon',
              type: 'select',
              options: [
                { label: 'Map pin', value: 'mapPin' },
                { label: 'Clock', value: 'clock' },
                { label: 'Phone', value: 'phone' },
                { label: 'Check', value: 'check' },
                { label: 'WhatsApp', value: 'whatsapp' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'ctaBand',
      label: 'Custom-trip band',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', defaultValue: "Can't find the perfect package?" },
        {
          name: 'text',
          type: 'textarea',
          defaultValue:
            "Tell us your dates, budget and who's travelling. A travel expert will build a custom itinerary and send it to you on WhatsApp.",
        },
      ],
    },
  ],
}
