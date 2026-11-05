import type { CollectionConfig } from 'payload'

import { assignedAccess, fullWriteOnly } from '@/access'
import {
  BUDGETS,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  TRAVELLER_GROUPS,
  TRIP_TYPES,
  WHATSAPP_STATUSES,
} from '@/lib/catalog'
import { normalizeIndianMobile } from '@/lib/format'
import { nextRequestId } from '@/lib/request-id'
import { convertEnquiry } from '@/endpoints/enquiries'

const locked = { update: fullWriteOnly('enquiries') }

/** Enquiries from "Find Your Perfect Trip", Contact Us and "Ask on WhatsApp". */
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    useAsTitle: 'enquiryId',
    group: 'Overview',
    defaultColumns: [
      'enquiryId',
      'name',
      'tripType',
      'destination',
      'source',
      'assignedTo',
      'status',
      'createdAt',
    ],
    listSearchableFields: ['enquiryId', 'name', 'whatsapp', 'destination'],
    description: 'From "Find Your Perfect Trip", Contact Us and package "Ask on WhatsApp".',
    components: {
      views: { list: { Component: '/components/admin/views/EnquiriesInbox#EnquiriesInbox' } },
    },
  },
  access: assignedAccess('enquiries'),
  endpoints: [convertEnquiry],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.enquiryId) {
          data.enquiryId = await nextRequestId(req.payload, 'enquiry')
        }
        if (typeof data.whatsapp === 'string') {
          data.whatsapp = normalizeIndianMobile(data.whatsapp) ?? data.whatsapp
        }
        if (Array.isArray(data.internalNotes)) {
          data.internalNotes = data.internalNotes.map((n: { author?: unknown; at?: string }) => ({
            ...n,
            author: n.author ?? req.user?.id,
            at: n.at ?? new Date().toISOString(),
          }))
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'enquiryId',
      label: 'Enquiry ID',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Set automatically, e.g. EQ-1093.',
      },
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, access: locked, admin: { width: '50%' } },
        {
          name: 'whatsapp',
          label: 'WhatsApp number',
          type: 'text',
          required: true,
          access: locked,
          admin: { width: '50%' },
          validate: (value: unknown) =>
            typeof value === 'string' && normalizeIndianMobile(value)
              ? true
              : 'Enter a valid 10-digit mobile number',
        },
      ],
    },
    { name: 'email', type: 'email', access: locked },
    {
      type: 'row',
      fields: [
        {
          name: 'tripType',
          type: 'select',
          options: [...TRIP_TYPES],
          access: locked,
          admin: { width: '33%' },
        },
        { name: 'destination', type: 'text', access: locked, admin: { width: '33%' } },
        {
          name: 'travelMonth',
          type: 'text',
          access: locked,
          admin: { width: '33%', description: 'YYYY-MM, e.g. 2027-02' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'travellers',
          type: 'select',
          options: [...TRAVELLER_GROUPS],
          access: locked,
          admin: { width: '50%' },
        },
        {
          name: 'budget',
          label: 'Budget / person',
          type: 'select',
          options: [...BUDGETS],
          access: locked,
          admin: { width: '50%' },
        },
      ],
    },
    { name: 'message', type: 'textarea', access: locked },
    {
      name: 'package',
      type: 'relationship',
      relationTo: 'packages',
      access: locked,
      admin: { description: 'Set when the enquiry came from a package page.' },
    },
    {
      name: 'internalNotes',
      type: 'array',
      labels: { singular: 'Note', plural: 'Internal notes' },
      fields: [
        { name: 'text', type: 'textarea', required: true },
        { name: 'author', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
        {
          name: 'at',
          type: 'date',
          admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [...ENQUIRY_STATUSES],
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      access: locked,
      admin: { position: 'sidebar' },
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'tripFinder',
      options: [...ENQUIRY_SOURCES],
      access: locked,
      admin: { position: 'sidebar' },
    },
    {
      name: 'whatsappStatus',
      label: 'WhatsApp alert',
      type: 'select',
      defaultValue: 'notSent',
      options: [...WHATSAPP_STATUSES],
      access: locked,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'convertedBooking',
      type: 'relationship',
      relationTo: 'bookings',
      access: locked,
      admin: { position: 'sidebar', condition: (data) => data?.status === 'converted' },
    },
  ],
}
