import { slugField, type CollectionConfig } from 'payload'

import { publicContentAccess } from '@/access'
import { HOTEL_CATEGORIES, PACKAGE_BADGES, PACKAGE_THEMES, startingPrice } from '@/lib/catalog'
import { CACHE_TAGS } from '@/lib/revalidate'
import { PUBLISH_STATUS, revalidateHooks, seoField, statusField } from '@/fields'

const revalidate = revalidateHooks([CACHE_TAGS.packages], (d) =>
  d.slug ? CACHE_TAGS.package(d.slug) : undefined,
)

/** Tour packages — fields follow the CMS "Package editor" screen. */
export const Packages: CollectionConfig = {
  slug: 'packages',
  labels: { singular: 'Package', plural: 'Packages' },
  versions: { maxPerDoc: 25 },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: [
      'title',
      'tourCode',
      'categories',
      'durationNights',
      'startingPrice',
      'homepage',
      'status',
      'updatedAt',
    ],
    listSearchableFields: ['title', 'tourCode'],
    description: 'All tour packages shown on the website.',
  },
  access: publicContentAccess('packages', { status: { equals: 'published' } }),
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.durationNights != null && !data.durationDays)
          data.durationDays = data.durationNights + 1
        data.startingPrice = startingPrice(data.hotelOptions)
        return data
      },
    ],
    ...revalidate,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic information',
          fields: [
            { name: 'title', label: 'Package title', type: 'text', required: true },
            slugField({ useAsSlug: 'title' }),
            {
              type: 'row',
              fields: [
                {
                  name: 'tourCode',
                  type: 'text',
                  required: true,
                  unique: true,
                  admin: { width: '33%', description: 'e.g. GT-GOA-04' },
                },
                {
                  name: 'destination',
                  type: 'relationship',
                  relationTo: 'destinations',
                  required: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'durationNights',
                  label: 'Nights',
                  type: 'number',
                  required: true,
                  min: 0,
                  max: 60,
                  admin: { width: '17%' },
                },
                {
                  name: 'durationDays',
                  label: 'Days',
                  type: 'number',
                  min: 1,
                  max: 61,
                  admin: { width: '17%', description: 'Defaults to nights + 1' },
                },
              ],
            },
            {
              name: 'categories',
              label: 'Categories & menus',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              required: true,
            },
            { name: 'themes', type: 'select', hasMany: true, options: [...PACKAGE_THEMES] },
            {
              type: 'row',
              fields: [
                {
                  name: 'pickup',
                  type: 'text',
                  admin: { width: '50%', description: 'e.g. Goa Airport (GOI) / Madgaon' },
                },
                {
                  name: 'cities',
                  type: 'text',
                  admin: { width: '50%', description: 'e.g. Bangkok · Pattaya' },
                },
              ],
            },
            {
              name: 'cardInclusions',
              label: 'Card inclusions line',
              type: 'text',
              admin: { description: 'Short line on cards, e.g. "Hotel · Breakfast · Transfers".' },
            },
            {
              name: 'highlights',
              label: 'At a glance',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'stay',
                      type: 'text',
                      admin: { width: '33%', description: 'e.g. 3★ / 4★ / 5★' },
                    },
                    {
                      name: 'meals',
                      type: 'text',
                      admin: { width: '33%', description: 'e.g. Daily breakfast' },
                    },
                    {
                      name: 'transport',
                      type: 'text',
                      admin: { width: '33%', description: 'e.g. Private AC cab' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Overview & gallery',
          fields: [
            { name: 'overview', type: 'richText' },
            {
              name: 'gallery',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: 'Drag to reorder. The first image is the cover.' },
            },
          ],
        },
        {
          label: 'Itinerary',
          fields: [
            {
              name: 'itinerary',
              label: 'Day-wise itinerary',
              type: 'array',
              labels: { singular: 'Day', plural: 'Days' },
              admin: { initCollapsed: false },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
              ],
            },
          ],
        },
        {
          label: 'Inclusions',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'inclusions',
                  type: 'array',
                  admin: { width: '50%' },
                  fields: [{ name: 'item', type: 'text', required: true }],
                },
                {
                  name: 'exclusions',
                  type: 'array',
                  admin: { width: '50%' },
                  fields: [{ name: 'item', type: 'text', required: true }],
                },
              ],
            },
          ],
        },
        {
          label: 'Pricing & hotels',
          fields: [
            {
              name: 'hotelOptions',
              label: 'Pricing (per person, twin sharing)',
              type: 'array',
              minRows: 1,
              maxRows: 3,
              required: true,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'category',
                      type: 'select',
                      required: true,
                      options: [...HOTEL_CATEGORIES],
                      admin: { width: '25%' },
                    },
                    {
                      name: 'price',
                      label: 'Price ₹',
                      type: 'number',
                      required: true,
                      min: 0,
                      admin: { width: '20%' },
                    },
                    {
                      name: 'strikePrice',
                      label: 'Strike-through ₹',
                      type: 'number',
                      min: 0,
                      admin: { width: '20%' },
                    },
                    {
                      name: 'isPopular',
                      label: 'Popular',
                      type: 'checkbox',
                      admin: { width: '15%' },
                    },
                  ],
                },
                { name: 'hotelName', label: 'Hotel (or similar)', type: 'text' },
              ],
            },
            {
              name: 'childPricePercent',
              label: 'Child price (% of adult)',
              type: 'number',
              defaultValue: 50,
              min: 0,
              max: 100,
            },
            {
              name: 'addOns',
              label: 'Add-ons (optional)',
              type: 'array',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', required: true, admin: { width: '70%' } },
                    {
                      name: 'price',
                      label: 'Price ₹ (optional)',
                      type: 'number',
                      min: 0,
                      admin: { width: '30%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Policies & FAQs',
          fields: [
            { name: 'policies', label: 'Booking & cancellation policy', type: 'richText' },
            {
              name: 'faqs',
              label: 'FAQs',
              type: 'array',
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoField()] },
      ],
    },
    statusField(PUBLISH_STATUS, 'draft'),
    {
      name: 'badge',
      type: 'select',
      defaultValue: 'none',
      options: [...PACKAGE_BADGES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'showInPopular',
      label: 'Show in Popular Destinations',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featureOnSlider',
      label: 'Feature on homepage slider',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'homepage',
      label: 'Homepage',
      type: 'text',
      virtual: true,
      admin: { hidden: true },
      hooks: {
        afterRead: [
          ({ siblingData }) =>
            [siblingData.showInPopular && 'Popular', siblingData.featureOnSlider && 'Slider']
              .filter(Boolean)
              .join(' · ') || '—',
        ],
      },
    },
    {
      name: 'startingPrice',
      label: 'Starting from ₹',
      type: 'number',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Lowest hotel price, set automatically.',
      },
    },
  ],
}
