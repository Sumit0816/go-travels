import type { Payload } from 'payload'

import { bookingVariables, renderBookingMessage } from '@/lib/whatsapp/messages'
import { SAMPLE_BOOKING } from '@/lib/whatsapp/send'

import { SendTestMessage } from './client'
import { Badge, docUrl, formatWhen, listUrl, WHATSAPP_LABELS } from './shared'

/** WhatsApp `*bold*` lines, rendered as text (no HTML from data). */
function Bubble({ text }: { text: string }) {
  return (
    <div className="gta-wa">
      {text.split('\n').map((line, i) => (
        <div key={i}>
          {line
            .split(/(\*[^*]+\*)/g)
            .map((part, j) =>
              part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
                <b key={j}>{part.slice(1, -1)}</b>
              ) : (
                part
              ),
            )}
        </div>
      ))}
    </div>
  )
}

const KIND_LABEL: Record<string, string> = {
  booking: 'Booking',
  enquiry: 'Enquiry',
  customerCopy: 'Customer copy',
  reviewLink: 'Review link',
  test: 'Test',
}

/**
 * "4 · Test & delivery log" tab of WhatsApp Integration (design: CMS WhatsApp — template
 * preview, Send test message, delivery log).
 */
export async function WhatsAppTools({ payload }: { payload: Payload }) {
  const { docs } = await payload.find({
    collection: 'messageLog',
    sort: '-createdAt',
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain').replace(/\/+$/, '')
  const now = new Date()

  return (
    <div className="gta" style={{ display: 'grid', gap: 20, marginBottom: 24 }}>
      <section className="gta-panel gta-detail" aria-labelledby="wa-test-title">
        <h2 id="wa-test-title">Test the connection</h2>
        <p style={{ margin: '0 0 12px' }}>
          Sends the booking template with sample values to the primary recipient and updates the
          connection status. Save your settings first.
        </p>
        <SendTestMessage />
        <h3 style={{ margin: '18px 0 8px', fontSize: 14 }}>Booking alert preview</h3>
        <Bubble text={renderBookingMessage(bookingVariables(SAMPLE_BOOKING))} />
      </section>

      <section className="gta-panel gta-detail" aria-labelledby="wa-setup-title">
        <h2 id="wa-setup-title">Delivery receipts and retries</h2>
        <p style={{ margin: '0 0 8px' }}>
          Set this webhook URL in your provider&apos;s dashboard so messages move to Delivered and
          Read. Replace <code>SECRET</code> with the <code>WHATSAPP_WEBHOOK_SECRET</code> value from
          the server settings.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <code>{site}/api/webhooks/whatsapp/gupshup?token=SECRET</code>
          <br />
          <code>{site}/api/webhooks/whatsapp/interakt?token=SECRET</code>
        </p>
        <p style={{ margin: 0 }}>
          Failed sends are retried after 1, 5 and 15 minutes by a cron calling{' '}
          <code>/api/whatsapp/process</code> every minute. After the last try, the fallback email is
          sent.
        </p>
      </section>

      <section className="gta-panel" aria-labelledby="wa-log-title">
        <div className="gta-panel__head">
          <h2 id="wa-log-title" style={{ margin: 0, fontSize: 16 }}>
            Delivery log
          </h2>
          <a className="gta-btn gta-btn--sm" href={listUrl('messageLog')}>
            View all
          </a>
        </div>
        {docs.length ? (
          <div className="gta-table-wrap">
            <table className="gta-table">
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">Type</th>
                  <th scope="col">To</th>
                  <th scope="col">When</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <a href={docUrl('messageLog', l.id)}>{l.reference}</a>
                    </td>
                    <td>{KIND_LABEL[l.kind] ?? l.kind}</td>
                    <td>{l.recipientLabel ?? l.phone}</td>
                    <td>{formatWhen(l.createdAt, now)}</td>
                    <td>
                      <Badge status={l.status}>{WHATSAPP_LABELS[l.status] ?? l.status}</Badge>
                      {l.status === 'failed' && l.error && (
                        <div className="gta-error" style={{ marginTop: 4 }}>
                          {l.error}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="gta-empty">No messages yet.</p>
        )}
      </section>
    </div>
  )
}
