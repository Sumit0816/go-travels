import type { CollectionConfig } from 'payload'

/**
 * Internal counters behind the GT-/EQ- request IDs (see src/lib/request-id.ts).
 * A Payload-managed table, so development schema sync keeps it. Not visible or editable in the CMS.
 */
export const Counters: CollectionConfig = {
  slug: 'counters',
  admin: { hidden: true },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'value', type: 'number', required: true },
  ],
}
