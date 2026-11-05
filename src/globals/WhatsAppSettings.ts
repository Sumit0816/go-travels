import type { GlobalConfig } from 'payload'

import { canRead, canWrite } from '@/access'
import { WHATSAPP_PROVIDERS } from '@/lib/catalog'
import { encryptSecret, isEncryptedSecret } from '@/lib/crypto'
import {
  BOOKING_TEMPLATE_VARIABLES,
  CUSTOMER_TEMPLATE_VARIABLES,
  ENQUIRY_TEMPLATE_VARIABLES,
} from '@/lib/whatsapp/messages'

export { BOOKING_TEMPLATE_VARIABLES }

const vars = (list: readonly string[]) => list.map((v) => `[${v}]`).join(' ')

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
                // The seed passes `resetWhatsAppKey` so demo data never calls a real provider.
                beforeChange: [
                  ({ value, previousValue, context }) =>
                    context?.resetWhatsAppKey
                      ? null
                      : typeof value === 'string' && value.trim() !== ''
                        ? value
                        : previousValue,
                ],
              },
            },
            {
              name: 'apiKeyHint',
              label: 'Saved key',
              type: 'text',
              admin: { readOnly: true, description: 'Last 4 characters of the saved key.' },
            },
            {
              name: 'senderNumber',
              label: 'Business sender number',
              type: 'text',
              admin: { description: 'With country code, e.g. 91 98765 43210.' },
            },
            {
              name: 'appName',
              label: 'Gupshup app name',
              type: 'text',
              admin: {
                condition: (data) => data?.provider === 'gupshup',
                description: 'The app name shown in your Gupshup dashboard.',
              },
            },
            {
              name: 'connectionStatus',
              type: 'select',
              defaultValue: 'notConnected',
              options: [
                { label: 'Not connected', value: 'notConnected' },
                { label: 'Connected', value: 'connected' },
                { label: 'Error', value: 'error' },
              ],
              admin: { readOnly: true, description: 'Updated by "Send test message".' },
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
          description: `Approved Meta "utility" templates, with values in this order. Booking: ${vars(BOOKING_TEMPLATE_VARIABLES)}. Enquiry: ${vars(ENQUIRY_TEMPLATE_VARIABLES)}. Customer copy: ${vars(CUSTOMER_TEMPLATE_VARIABLES)}. For Gupshup, enter the template ID as the name.`,
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
        {
          label: '4 · Test & delivery log',
          fields: [
            {
              name: 'tools',
              type: 'ui',
              admin: { components: { Field: '/components/admin/WhatsAppTools#WhatsAppTools' } },
            },
          ],
        },
      ],
    },
  ],
}
