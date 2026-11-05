import type { CollectionConfig, Field } from 'payload'

import { adminAccess, fullWriteOnly } from '@/access'
import { BOOKING_STATUSES, HOTEL_CATEGORIES, WHATSAPP_STATUSES } from '@/lib/catalog'
import { normalizeIndianMobile } from '@/lib/format'
import { nextRequestId } from '@/lib/request-id'
import { exportBookingsCsv, resendBookingAlert } from '@/endpoints/bookings'

/** Fields everyone with booking access may change. Everything else needs "Full". */
const workflowFields: Field[] = [
  {
    name: 'status',
    type: 'select',
    required: true,
    defaultValue: 'new',
    options: [...BOOKING_STATUSES],
    index: true,
    admin: { position: 'sidebar' },
  },
  {
    name: 'assignedTo',
    type: 'relationship',
    relationTo: 'users',
    access: { update: fullWriteOnly('bookings') },
    admin: { position: 'sidebar' },
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
]

const locked = { update: fullWriteOnly('bookings') }

/** Booking requests from the website. Nothing is charged; staff confirm on WhatsApp. */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  labels: { singular: 'Booking', plural: 'Bookings' },
  admin: {
    useAsTitle: 'requestId',
    group: 'Overview',
    defaultColumns: [
      'requestId',
      'name',
      'package',
      'travelDate',
      'estimatedTotal',
      'whatsappStatus',
      'status',
    ],
    listSearchableFields: ['requestId', 'name', 'whatsapp', 'email'],
    description: 'Every request from the website, and its WhatsApp delivery status.',
  },
  access: adminAccess('bookings'),
  endpoints: [exportBookingsCsv, resendBookingAlert],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        // Stamp the moment a booking is confirmed ("Confirmed this month" on the dashboard).
        if (data.status === 'confirmed' && originalDoc?.status !== 'confirmed') {
          data.confirmedAt = new Date().toISOString()
        }
        if (operation === 'create' && !data.requestId) {
          data.requestId = await nextRequestId(req.payload, 'booking')
        }
        if (typeof data.whatsapp === 'string') {
          data.whatsapp = normalizeIndianMobile(data.whatsapp) ?? data.whatsapp
        }
        // Stamp new notes with who wrote them and when.
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
      name: 'requestId',
      label: 'Request ID',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Set automatically, e.g. GT-24871.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Trip',
          fields: [
            { name: 'package', type: 'relationship', relationTo: 'packages', access: locked },
            {
              name: 'packageSnapshot',
              label: 'Package as booked',
              type: 'group',
              access: locked,
              admin: {
                description: 'Kept so the request still reads correctly if the package changes.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'title', type: 'text', admin: { width: '70%' } },
                    { name: 'duration', type: 'text', admin: { width: '30%' } },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'travelDate',
                  type: 'date',
                  required: true,
                  access: locked,
                  admin: { width: '33%' },
                },
                { name: 'departureCity', type: 'text', access: locked, admin: { width: '33%' } },
                {
                  name: 'hotelCategory',
                  type: 'select',
                  options: [...HOTEL_CATEGORIES],
                  access: locked,
                  admin: { width: '33%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'rooms',
                  type: 'number',
                  min: 1,
                  max: 20,
                  defaultValue: 1,
                  access: locked,
                  admin: { width: '33%' },
                },
                {
                  name: 'adults',
                  type: 'number',
                  required: true,
                  min: 1,
                  max: 9,
                  defaultValue: 2,
                  access: locked,
                  admin: { width: '33%' },
                },
                {
                  name: 'children',
                  type: 'number',
                  min: 0,
                  max: 6,
                  defaultValue: 0,
                  access: locked,
                  admin: { width: '33%' },
                },
              ],
            },
            { name: 'addOns', type: 'text', hasMany: true, access: locked },
            {
              name: 'estimatedTotal',
              label: 'Estimated total ₹',
              type: 'number',
              min: 0,
              access: locked,
              admin: {
                description:
                  'Shown to the customer as an estimate; final price confirmed on WhatsApp.',
              },
            },
          ],
        },
        {
          label: 'Traveller',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  label: 'Full name',
                  type: 'text',
                  required: true,
                  access: locked,
                  admin: { width: '50%' },
                },
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
            {
              type: 'row',
              fields: [
                { name: 'email', type: 'email', access: locked, admin: { width: '50%' } },
                { name: 'city', type: 'text', access: locked, admin: { width: '50%' } },
              ],
            },
            { name: 'specialRequests', type: 'textarea', access: locked },
            {
              name: 'consent',
              label: 'Agreed to WhatsApp updates and terms',
              type: 'checkbox',
              access: locked,
            },
          ],
        },
        {
          label: 'Notes',
          fields: workflowFields.filter((f) => 'name' in f && f.name === 'internalNotes'),
        },
      ],
    },
    ...workflowFields.filter((f) => 'name' in f && f.name !== 'internalNotes'),
    {
      name: 'whatsappStatus',
      label: 'WhatsApp',
      type: 'select',
      defaultValue: 'notSent',
      options: [...WHATSAPP_STATUSES],
      index: true,
      access: locked,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'confirmedAt',
      type: 'date',
      index: true,
      access: locked,
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'website',
      options: [
        { label: 'Website', value: 'website' },
        { label: 'Phone / walk-in', value: 'phone' },
        { label: 'Converted enquiry', value: 'enquiry' },
      ],
      access: locked,
      admin: { position: 'sidebar' },
    },
    {
      name: 'fromEnquiry',
      type: 'relationship',
      relationTo: 'enquiries',
      access: locked,
      admin: { position: 'sidebar', condition: (data) => data?.source === 'enquiry' },
    },
  ],
}
