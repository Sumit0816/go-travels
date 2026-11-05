import type { Access, CollectionConfig } from 'payload'

import { isOwner, isRole, ownerOnlyField, ROLE_LABELS, ROLES } from '@/access'

/** Owners see everyone; other staff see only their own profile. */
const ownerOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (isOwner(req)) return true
  return { id: { equals: req.user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'User', plural: 'Users & Roles' },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 60 * 60 * 12,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'whatsappAlerts', 'status', 'lastActive'],
    group: 'Settings',
    description: 'Who can sign in to the CMS, and what they can change.',
    // Staff reach their own profile from the account menu; only the Owner manages users.
    hidden: ({ user }) => user?.role !== 'owner',
  },
  access: {
    // Only staff with a valid role may open the admin panel.
    admin: ({ req }) => isRole(req.user?.role),
    create: ({ req }) => isOwner(req),
    read: ownerOrSelf,
    update: ownerOrSelf,
    delete: ({ req }) => isOwner(req),
    unlock: ({ req }) => isOwner(req),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // The very first account becomes the Owner, so the CMS is never left without one.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) {
            data.role = 'owner'
            data.status = 'active'
          }
        }
        return data
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: { lastActive: new Date().toISOString(), status: 'active' },
          overrideAccess: true,
          req,
          context: { skipLastActive: true },
        })
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'phone',
      label: 'WhatsApp number',
      type: 'text',
      admin: { description: 'Used for booking alerts. Format: +91 98765 43210' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'contentEditor',
      saveToJWT: true,
      options: ROLES.map((value) => ({ label: ROLE_LABELS[value], value })),
      access: {
        create: ownerOnlyField,
        update: ownerOnlyField,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'whatsappAlerts',
      label: 'Gets WhatsApp alerts',
      type: 'select',
      required: true,
      defaultValue: 'no',
      options: [
        { label: 'Yes · primary', value: 'primary' },
        { label: 'Yes', value: 'yes' },
        { label: 'Assigned only', value: 'assignedOnly' },
        { label: 'No', value: 'no' },
      ],
      access: { create: ownerOnlyField, update: ownerOnlyField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'invited',
      options: [
        { label: 'Invited', value: 'invited' },
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
      ],
      access: { create: ownerOnlyField, update: ownerOnlyField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'lastActive',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
