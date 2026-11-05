import type { GlobalConfig } from 'payload'

import { canRead, canWrite } from '@/access'
import { WHATSAPP_PROVIDERS } from '@/lib/catalog'
import { encryptSecret, isEncryptedSecret } from '@/lib/crypto'

/** Variables available in the booking template, in the order the design shows them. */
export const BOOKING_TEMPLATE_VARIABLES = [
  'request_id',
  'package_name',
  'duration',
  'travel_date',
  'departure_city',
  'travellers',
  'hotel_category',
  'customer_name',
  'customer_phone',
  'estimated_total',
  'special_requests',
] as const

const templateGroup = (name: string, label: string, description: string) => ({
  name,
  label,
  type: 'group' as const,
  admin: { description },
  fields: [
    {
      type: 'row' as const,
      fields: [
        { name: 'name', label: 'Template name', type: 'text' as const, admin: { width: '60%' } },
        { name: 'language', type: 'text' as const, defaultValue: 'en', admin: { width: '40%' } },
      ],
    },
  ],
})

/**
 * WhatsApp aggregator connection. The API key is encrypted before it is saved and is never
 * returned by the API — not even to the Owner. Saving with the field empty keeps the old key.
 */
export const WhatsAppSettings: GlobalConfig = {
  slug: 'whatsappSettings',
  label: 'WhatsApp Integration',
  admin: {
    group: 'Settings',
    description:
      'Booking requests are sent to your team through a WhatsApp Business messaging aggregator.',
  },
  access: {
    read: ({ req }) => canRead('whatsapp', req.user?.role),
    update: ({ req }) => canWrite('whatsapp', req.user?.role),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        const raw = data.apiKey
        if (typeof raw === 'string' && raw.trim() !== '' && !isEncryptedSecret(raw)) {
          data.apiKeyHint = `•••• ${raw.trim().slice(-4)}`
          data.apiKey = encryptSecret(raw.trim())
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '1 · Provider',
          fields: [
            {
              name: 'provider',
              type: 'select',
              required: true,
              defaultValue: 'gupshup',
              options: [...WHATSAPP_PROVIDERS],
            },
            {
              name: 'apiKey',
              label: 'API key / token',
              type: 'text',
              access: { read: () => false },
              admin: {
                description:
                  'Stored encrypted on the server and never sent to the browser. Leave empty to keep the current key.',
              },
              hooks: {
                // Empty submit keeps the saved key (the form never receives it back).
                beforeChange: [
                  ({ value, previousValue }) =>
                    typeof value === 'string' && value.trim() !== '' ? value : previousValue,
                ],
              },
            },
            {
              name: 'apiKeyHint',
              label: 'Saved key',
              type: 'text',
              admin: { readOnly: true, description: 'Last 4 characters of the saved key.' },
            },
            { name: 'senderNumber', label: 'Business sender number', type: 'text' },
            {
              name: 'connectionStatus',
              type: 'select',
              defaultValue: 'notConnected',
              options: [
                { label: 'Not connected', value: 'notConnected' },
                { label: 'Connected', value: 'connected' },
                { label: 'Error', value: 'error' },
              ],
              admin: { readOnly: true, description: 'Updated by "Send test message" (Phase 5).' },
            },
          ],
        },
        {
          label: '2 · Who receives alerts',
          fields: [
            {
              name: 'recipients',
              type: 'array',
              labels: { singular: 'Recipient', plural: 'Recipients' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { width: '35%', description: 'e.g. Owner, Sales desk' },
                    },
                    { name: 'phone', type: 'text', required: true, admin: { width: '45%' } },
                    {
                      name: 'isPrimary',
                      label: 'Primary',
                      type: 'checkbox',
                      admin: { width: '20%' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'sendCustomerCopy',
              label: 'Also send the customer a confirmation copy',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'emailFallback',
              label: 'Email fallback if WhatsApp delivery fails',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'fallbackEmail',
              type: 'email',
              admin: { condition: (data) => Boolean(data?.emailFallback) },
            },
          ],
        },
        {
          label: '3 · Message templates',
          description: `Approved Meta "utility" templates. Booking variables: ${BOOKING_TEMPLATE_VARIABLES.map((v) => `[${v}]`).join(' ')}`,
          fields: [
            templateGroup(
              'bookingTemplate',
              'Booking request',
              'Sent to the team for every booking.',
            ),
            templateGroup('enquiryTemplate', 'Enquiry', 'Sent to the team for every enquiry.'),
            templateGroup(
              'customerTemplate',
              'Customer copy',
              'Sent to the customer when the copy is switched on.',
            ),
            templateGroup('reviewTemplate', 'Review link', 'Sent when staff request a review.'),
          ],
        },
      ],
    },
  ],
}
