import { randomBytes } from 'node:crypto'

import type { CollectionConfig } from 'payload'

import { adminAccess, canWrite } from '@/access'

/**
 * One-time links sent to past travellers on WhatsApp ("Send review link on WhatsApp").
 * The public review form (Phase 3) checks the token, then creates a pending testimonial.
 */
export const ReviewLinks: CollectionConfig = {
  slug: 'reviewLinks',
  labels: { singular: 'Review link', plural: 'Review links' },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
    defaultColumns: ['name', 'phone', 'package', 'expiresAt', 'usedAt'],
    hidden: ({ user }) => !canWrite('testimonials', user?.role),
  },
  access: adminAccess('testimonials'),
  fields: [
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      defaultValue: () => randomBytes(24).toString('base64url'),
      admin: { readOnly: true },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'phone', label: 'WhatsApp number', type: 'text', required: true },
    { name: 'package', type: 'relationship', relationTo: 'packages' },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    { name: 'usedAt', type: 'date', admin: { readOnly: true } },
    {
      name: 'testimonial',
      type: 'relationship',
      relationTo: 'testimonials',
      admin: { readOnly: true },
    },
  ],
}
