import type { GlobalConfig } from 'payload'

import { canWrite, hiddenWithout } from '@/access'
import { CACHE_TAGS, safeRevalidate } from '@/lib/revalidate'

/** Values that fill the header, footer, contact page and search results. */
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'Site Settings & SEO',
  admin: {
    hidden: hiddenWithout('settings'),
    group: 'Settings',
    description: 'These values fill the header, footer, contact page and search results.',
  },
  access: {
    read: () => true,
    update: ({ req }) => canWrite('settings', req.user?.role),
  },
  hooks: {
    afterChange: [
      ({ doc, req }) => {
        safeRevalidate([CACHE_TAGS.global('siteSettings')], req.context)
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'siteName',
                  type: 'text',
                  required: true,
                  defaultValue: 'Go Travels',
                  admin: { width: '50%' },
                },
                {
                  name: 'tagline',
                  type: 'text',
                  defaultValue: 'Discover. Dream. Travel.',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    width: '50%',
                    description: 'Optional. The built-in logo is used if empty.',
                  },
                },
                {
                  name: 'favicon',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { width: '50%', description: 'Square, 512×512.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Contact details',
          description: 'Shown in "Reach Us Out", the utility bar and the contact page.',
          fields: [
            { name: 'address', label: 'Office address', type: 'textarea' },
            {
              name: 'phones',
              label: 'Phone numbers',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'number', type: 'text', required: true, admin: { width: '60%' } },
                    {
                      name: 'label',
                      type: 'text',
                      admin: { width: '40%', description: 'e.g. Mobile, Office' },
                    },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'whatsapp',
                  label: 'WhatsApp (public)',
                  type: 'text',
                  admin: { width: '50%' },
                },
                { name: 'email', type: 'email', admin: { width: '50%' } },
              ],
            },
            { name: 'workingHours', type: 'text', defaultValue: 'Mon – Sat · 10:00 AM – 07:00 PM' },
            {
              name: 'mapEmbedUrl',
              label: 'Google Maps embed link',
              type: 'text',
              validate: (v: unknown) =>
                !v || (typeof v === 'string' && v.startsWith('https://www.google.com/maps/embed'))
                  ? true
                  : 'Paste the "Embed a map" link from Google Maps (starts with https://www.google.com/maps/embed).',
            },
          ],
        },
        {
          label: 'Social links',
          fields: [
            { name: 'instagram', type: 'text' },
            { name: 'facebook', type: 'text' },
            { name: 'youtube', label: 'YouTube', type: 'text' },
            { name: 'googleReviews', label: 'Google reviews', type: 'text' },
          ],
        },
        {
          label: 'SEO & analytics',
          fields: [
            {
              name: 'defaultMetaTitle',
              type: 'text',
              defaultValue: 'Go Travels — Domestic, International & Religious Tours',
            },
            {
              name: 'defaultMetaDescription',
              type: 'textarea',
              defaultValue: 'Handpicked tour packages with booking confirmed on WhatsApp.',
            },
            {
              name: 'defaultOgImage',
              label: 'Default share image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'gaId',
                  label: 'Google Analytics ID',
                  type: 'text',
                  admin: { width: '50%', description: 'e.g. G-XXXXXXX' },
                },
                {
                  name: 'searchConsoleCode',
                  label: 'Search Console code',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'sitemapEnabled',
              label: 'Generate sitemap.xml automatically',
              type: 'checkbox',
              defaultValue: true,
            },
          ],
        },
      ],
    },
  ],
}
