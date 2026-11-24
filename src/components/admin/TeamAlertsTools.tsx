import type { Payload } from 'payload'

import { SendTestAlert, TelegramChatFinder } from './client'
import { Badge, docUrl, formatWhen, listUrl, WHATSAPP_LABELS } from './shared'

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  email: 'Email',
}

/** "Test" tab of Settings › Team Alerts: Telegram setup, test sends and the latest alerts. */
export async function TeamAlertsTools({ payload }: { payload: Payload }) {
  const [settings, log] = await Promise.all([
    payload.findGlobal({ slug: 'teamAlerts', overrideAccess: true, depth: 0 }),
    payload.find({
      collection: 'messageLog',
      where: { channel: { in: ['telegram', 'email'] } },
      sort: '-createdAt',
      limit: 10,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  const now = new Date()

  return (
    <div className="gta" style={{ display: 'grid', gap: 20, marginBottom: 24 }}>
      <section className="gta-panel gta-detail" aria-labelledby="tg-setup-title">
        <h2 id="tg-setup-title">Telegram</h2>
        <ol style={{ margin: '0 0 12px', paddingLeft: 20 }}>
          <li>
            In Telegram, open <b>@BotFather</b>, send <code>/newbot</code> and follow the steps. It
            replies with a <b>token</b>.
          </li>
          <li>Paste the token on the Telegram tab and save.</li>
          <li>Add the bot to your team group, then send any message in that group.</li>
          <li>
            Click <b>Find my group</b>, copy the chat ID into the Telegram tab, switch on
            &ldquo;Send alerts to Telegram&rdquo; and save.
          </li>
        </ol>
        <TelegramChatFinder />
        <div style={{ marginTop: 14 }}>
          <SendTestAlert channel="telegram" label="Send test to Telegram" />
        </div>
        <p style={{ margin: '10px 0 0' }}>
          Status:{' '}
          <b>
            {settings.telegramStatus === 'connected'
              ? 'Connected'
              : settings.telegramStatus === 'error'
                ? 'Error'
                : 'Not connected'}
          </b>
          {settings.telegramTokenHint ? ` · token ${settings.telegramTokenHint}` : ''}
        </p>
      </section>

      <section className="gta-panel gta-detail" aria-labelledby="email-test-title">
        <h2 id="email-test-title">Email</h2>
        <p style={{ margin: '0 0 12px' }}>
          Sends the sample booking to every recipient on the Email tab. Emails need the SMTP
          settings on the server; without them they only appear in the server log.
        </p>
        <SendTestAlert channel="email" label="Send test email" />
      </section>

      <section className="gta-panel" aria-labelledby="alerts-log-title">
        <div className="gta-panel__head">
          <h2 id="alerts-log-title" style={{ margin: 0, fontSize: 16 }}>
            Latest Telegram and email alerts
          </h2>
          <a className="gta-btn gta-btn--sm" href={listUrl('messageLog')}>
            View all
          </a>
        </div>
        {log.docs.length ? (
          <div className="gta-table-wrap">
            <table className="gta-table">
              <thead>
                <tr>
                  <th scope="col">Reference</th>
                  <th scope="col">Channel</th>
                  <th scope="col">To</th>
                  <th scope="col">When</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {log.docs.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <a href={docUrl('messageLog', l.id)}>{l.reference}</a>
                    </td>
                    <td>{CHANNEL_LABEL[l.channel] ?? l.channel}</td>
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
          <p className="gta-empty">No Telegram or email alerts yet.</p>
        )}
      </section>
    </div>
  )
}
