import type { CollectionConfig } from 'payload'

import { canRead } from '@/access'
import { WHATSAPP_PROVIDERS } from '@/lib/catalog'

/**
 * WhatsApp delivery log. Written only by the server (sending, retries and provider webhooks),
 * so no CMS user can create, edit or delete entries.
 */
export const MessageLog: CollectionConfig = {
  slug: 'messageLog',
  labels: { singular: 'WhatsApp message', plural: 'WhatsApp delivery log' },
  admin: {
    useAsTitle: 'reference',
    group: 'Settings',
    defaultColumns: ['reference', 'recipientLabel', 'phone', 'status', 'attempts', 'createdAt'],
    listSearchableFields: ['reference', 'phone', 'providerMessageId'],
  },
  access: {
    read: ({ req }) => canRead('whatsapp', req.user?.role),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'reference',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'GT-… / EQ-… / TEST' },
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Booking alert', value: 'booking' },
        { label: 'Enquiry alert', value: 'enquiry' },
        { label: 'Customer copy', value: 'customerCopy' },
        { label: 'Review link', value: 'reviewLink' },
        { label: 'Test message', value: 'test' },
      ],
    },
    { name: 'booking', type: 'relationship', relationTo: 'bookings' },
    { name: 'enquiry', type: 'relationship', relationTo: 'enquiries' },
    {
      name: 'recipientLabel',
      type: 'text',
      admin: { description: 'e.g. Owner, Sales desk, Customer' },
    },
    { name: 'phone', type: 'text', required: true },
    { name: 'provider', type: 'select', options: [...WHATSAPP_PROVIDERS] },
    { name: 'providerMessageId', type: 'text', index: true },
    { name: 'template', type: 'text' },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'queued',
      index: true,
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Read', value: 'read' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    {
      name: 'nextAttemptAt',
      label: 'Next attempt',
      type: 'date',
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'error', type: 'textarea' },
    {
      name: 'body',
      label: 'Message',
      type: 'textarea',
      admin: { description: 'Exactly what the recipient sees.' },
    },
    { name: 'params', label: 'Template values', type: 'json', admin: { hidden: true } },
    { name: 'language', type: 'text', admin: { hidden: true } },
    { name: 'deliveredAt', type: 'date' },
    { name: 'readAt', type: 'date' },
  ],
}
