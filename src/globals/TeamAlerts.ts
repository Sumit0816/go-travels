import type { GlobalConfig } from 'payload'

import { canRead, canWrite } from '@/access'
import { secretField, stripSecrets } from '@/fields/secret'
import { encryptSecret, isEncryptedSecret } from '@/lib/crypto'

/**
 * Free alert channels for the team: a Telegram group and email. They run alongside WhatsApp
 * (Settings › WhatsApp Integration) and can be used on their own until WhatsApp is set up.
 * The Telegram bot token is encrypted like the WhatsApp key and never sent to the browser.
 */
export const TeamAlerts: GlobalConfig = {
  slug: 'teamAlerts',
  label: 'Team Alerts',
  admin: {
    group: 'Settings',
    description:
      'Where new bookings and enquiries are announced to the team, besides WhatsApp. Turn on as many as you like.',
  },
  access: {
    read: ({ req }) => canRead('whatsapp', req.user?.role),
    update: ({ req }) => canWrite('whatsapp', req.user?.role),
  },
  hooks: {
    afterRead: [stripSecrets('telegramBotToken')],
    beforeChange: [
      ({ data }) => {
        const raw = data.telegramBotToken
        if (typeof raw === 'string' && raw.trim() !== '' && !isEncryptedSecret(raw)) {
          data.telegramTokenHint = `•••• ${raw.trim().slice(-4)}`
          data.telegramBotToken = encryptSecret(raw.trim())
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
          label: 'Telegram',
          description:
            'Free. Create a bot with @BotFather, add it to your team group, paste the token below, save, then use "Find my group" on the Test tab.',
          fields: [
            {
              name: 'telegramEnabled',
              label: 'Send alerts to Telegram',
              type: 'checkbox',
              defaultValue: false,
            },
            secretField(
              'telegramBotToken',
              'Bot token',
              'From @BotFather, e.g. 123456:ABC-… Stored encrypted and never shown again. Leave empty to keep the saved token.',
            ),
            {
              name: 'telegramTokenHint',
              label: 'Saved token',
              type: 'text',
              admin: { readOnly: true, description: 'Last 4 characters of the saved token.' },
            },
            {
              name: 'telegramChats',
              label: 'Groups or chats',
              type: 'array',
              labels: { singular: 'Chat', plural: 'Chats' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { width: '45%', description: 'e.g. Bookings group' },
                    },
                    {
                      name: 'chatId',
                      label: 'Chat ID',
                      type: 'text',
                      required: true,
                      validate: (v: unknown) =>
                        typeof v === 'string' && /^(-?\d{5,20}|@[A-Za-z0-9_]{5,32})$/.test(v.trim())
                          ? true
                          : 'A number like -1001234567890 (use "Find my group"), or @channelname',
                      admin: { width: '55%' },
                    },
                  ],
                },
              ],
            },
            {
              name: 'telegramStatus',
              label: 'Connection',
              type: 'select',
              defaultValue: 'notConnected',
              options: [
                { label: 'Not connected', value: 'notConnected' },
                { label: 'Connected', value: 'connected' },
                { label: 'Error', value: 'error' },
              ],
              admin: { readOnly: true, description: 'Updated by "Send test to Telegram".' },
            },
          ],
        },
        {
          label: 'Email',
          description:
            'Free with any mailbox. Uses the SMTP settings on the server; without them, emails only reach the server log.',
          fields: [
            {
              name: 'emailEnabled',
              label: 'Send alerts by email',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'emailRecipients',
              label: 'Recipients',
              type: 'array',
              labels: { singular: 'Recipient', plural: 'Recipients' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', admin: { width: '40%' } },
                    { name: 'email', type: 'email', required: true, admin: { width: '60%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Test',
          fields: [
            {
              name: 'tools',
              type: 'ui',
              admin: { components: { Field: '/components/admin/TeamAlertsTools#TeamAlertsTools' } },
            },
          ],
        },
      ],
    },
  ],
}
