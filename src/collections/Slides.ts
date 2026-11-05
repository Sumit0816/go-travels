import type { CollectionConfig, Where } from 'payload'

import { hiddenWithout, publicContentAccess } from '@/access'
import { CACHE_TAGS } from '@/lib/revalidate'
import { linkFields, revalidateHooks } from '@/fields'

/** Active slides inside their show-from / show-until window. */
export const liveSlidesWhere = (): Where => {
  const now = new Date().toISOString()
  return {
    and: [
      { active: { equals: true } },
      { or: [{ showFrom: { exists: false } }, { showFrom: { less_than_equal: now } }] },
      { or: [{ showUntil: { exists: false } }, { showUntil: { greater_than_equal: now } }] },
    ],
  }
}

/** Homepage hero slides. Drag to reorder in the list view. */
export const Slides: CollectionConfig = {
  slug: 'slides',
  labels: { singular: 'Slide', plural: 'Homepage slider' },
  orderable: true,
  admin: {
    useAsTitle: 'heading',
    group: 'Content',
    defaultColumns: ['heading', 'eyebrow', 'active', 'showFrom', 'showUntil'],
    description: 'Hero slides at the top of the homepage.',
    hidden: hiddenWithout('homepage'),
  },
  access: publicContentAccess('homepage', liveSlidesWhere),
  hooks: revalidateHooks([CACHE_TAGS.slides]),
  fields: [
    {
      name: 'eyebrow',
      label: 'Eyebrow text',
      type: 'text',
      admin: { description: 'e.g. A NEW WORLD AWAITS' },
    },
    { name: 'heading', type: 'text', required: true },
    { name: 'buttonLabel', type: 'text', required: true, defaultValue: 'Explore Packages' },
    ...linkFields(),
    {
      name: 'imageDesktop',
      label: 'Image (desktop, 1920×720)',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'imageMobile',
      label: 'Image (mobile crop, 780×900)',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional. Uses the desktop image and its focal point if empty.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'showFrom', type: 'date', admin: { width: '50%' } },
        { name: 'showUntil', type: 'date', admin: { width: '50%' } },
      ],
    },
    {
      name: 'active',
      label: 'Slide is active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
