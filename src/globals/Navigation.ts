import type { Field, GlobalConfig } from 'payload'

import { canWrite } from '@/access'
import { CACHE_TAGS, safeRevalidate } from '@/lib/revalidate'
import { linkFields } from '@/fields'

const linkItem = (extra: Field[] = []): Field[] => [
  { name: 'label', type: 'text', required: true },
  ...linkFields(),
  ...extra,
]

/** Header (with mega-menu columns) and footer link lists. */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Menus',
  admin: { group: 'Content', description: 'Header menu and footer link lists.' },
  access: {
    read: () => true,
    update: ({ req }) => canWrite('packages', req.user?.role),
  },
  hooks: {
    afterChange: [
      ({ doc, req }) => {
        safeRevalidate([CACHE_TAGS.global('navigation')], req.context)
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Header menu',
          fields: [
            {
              name: 'header',
              type: 'array',
              labels: { singular: 'Menu item', plural: 'Menu items' },
              fields: linkItem([
                {
                  name: 'megaMenu',
                  label: 'Mega-menu columns',
                  type: 'array',
                  admin: { description: 'Optional columns, e.g. "North India", "South India".' },
                  fields: [
                    { name: 'heading', type: 'text', required: true },
                    { name: 'links', type: 'array', fields: linkItem() },
                  ],
                },
                {
                  name: 'featuredPackage',
                  type: 'relationship',
                  relationTo: 'packages',
                  admin: { description: 'Shown on the right of the mega menu.' },
                },
              ]),
            },
          ],
        },
        {
          label: 'Footer · Quick links',
          fields: [{ name: 'footerQuickLinks', type: 'array', fields: linkItem() }],
        },
        {
          label: 'Footer · Tours',
          fields: [{ name: 'footerTours', type: 'array', fields: linkItem() }],
        },
      ],
    },
  ],
}
