import { Gutter } from '@payloadcms/ui'
import type { ListViewServerProps, Where } from 'payload'

import { canUpdateSome, canWrite } from '@/access'
import { waMeLink } from '@/lib/admin-helpers'
import {
  BUDGETS,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  TRAVELLER_GROUPS,
  TRIP_TYPES,
} from '@/lib/catalog'
import { formatIndianMobile } from '@/lib/format'
import type { Enquiry, User } from '@/payload-types'

import { ActionButton, FieldSelect, NoteForm } from '../client'
import { Badge, docUrl, formatWhen, listUrl, param, qs, WHATSAPP_LABELS } from '../shared'

const OPEN = ['new', 'contacted', 'quoteSent']
const CLOSED = ['converted', 'closed']

const label = (list: readonly { label: string; value: string }[], v?: string | null) =>
  (v && list.find((o) => o.value === v)?.label) || '—'

const monthLabel = (m?: string | null) => {
  const match = m?.match(/^(\d{4})-(\d{2})$/)
  if (!match) return m || '—'
  return new Date(Date.UTC(+match[1], +match[2] - 1, 1)).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const userName = (u: Enquiry['assignedTo']) => (u && typeof u === 'object' ? u.name : null)

/** Enquiries inbox (design: "CMS · Enquiries"): list on the left, the selected enquiry on the right. */
export async function EnquiriesInbox({ payload, user: viewer, searchParams }: ListViewServerProps) {
  const user = viewer as User
  const tab = param(searchParams?.tab) ?? 'open'
  const selectedId = Number(param(searchParams?.id)) || undefined

  const tabWhere: Record<string, Where> = {
    open: { status: { in: OPEN } },
    mine: { assignedTo: { equals: user.id } },
    closed: { status: { in: CLOSED } },
  }
  const where = tabWhere[tab] ?? tabWhere.open

  const [list, openCount] = await Promise.all([
    payload.find({
      collection: 'enquiries',
      where,
      sort: '-createdAt',
      limit: 50,
      depth: 1,
      user,
      overrideAccess: false,
    }),
    payload.count({ collection: 'enquiries', where: tabWhere.open, user, overrideAccess: false }),
  ])

  const selected =
    (selectedId && list.docs.find((d) => d.id === selectedId)) ||
    (selectedId
      ? await payload
          .findByID({
            collection: 'enquiries',
            id: selectedId,
            depth: 1,
            user,
            overrideAccess: false,
          })
          .catch(() => null)
      : list.docs[0]) ||
    null

  const fullAccess = canWrite('enquiries', user.role)
  const canUpdate = canUpdateSome('enquiries', user.role)

  // Owners/managers can reassign; the list of staff comes from users they can read.
  const staff = fullAccess
    ? (
        await payload.find({
          collection: 'users',
          where: { role: { in: ['owner', 'manager', 'sales'] } },
          limit: 100,
          depth: 0,
          user,
          overrideAccess: false,
        })
      ).docs
    : []

  const tabs = [
    { key: 'open', label: `Open (${openCount.totalDocs})` },
    { key: 'mine', label: 'Mine' },
    { key: 'closed', label: 'Closed' },
  ]

  return (
    <Gutter className="gta">
      <div className="gta-head">
        <div>
          <h1>Enquiries</h1>
          <p>From “Find Your Perfect Trip”, Contact Us and package “Ask on WhatsApp”.</p>
        </div>
        {fullAccess && (
          <div className="gta-actions">
            <a className="gta-btn gta-btn--primary" href={`${listUrl('enquiries')}/create`}>
              + Add enquiry
            </a>
          </div>
        )}
      </div>

      <div className="gta-inbox">
        <section className="gta-panel" aria-label="Enquiry list">
          <div className="gta-panel__head">
            <nav className="gta-tabs" aria-label="Filter enquiries">
              {tabs.map((t) => (
                <a
                  key={t.key}
                  href={`${listUrl('enquiries')}${qs({ tab: t.key })}`}
                  aria-current={t.key === tab ? 'page' : undefined}
                >
                  {t.label}
                </a>
              ))}
            </nav>
          </div>
          {list.docs.length === 0 ? (
            <p className="gta-empty">
              Nothing here. New enquiries from the website appear in Open.
            </p>
          ) : (
            <nav className="gta-inbox__list" aria-label="Enquiries">
              {list.docs.map((e) => (
                <a
                  key={e.id}
                  href={`${listUrl('enquiries')}${qs({ tab, id: e.id })}`}
                  aria-current={selected?.id === e.id ? 'true' : undefined}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <b>
                      {e.name} · {e.enquiryId}
                    </b>
                    <small>{formatWhen(e.createdAt)}</small>
                  </span>
                  <span>
                    {[
                      label(TRIP_TYPES, e.tripType),
                      e.destination,
                      e.travelMonth && monthLabel(e.travelMonth),
                    ]
                      .filter((x) => x && x !== '—')
                      .join(' · ') || e.message?.slice(0, 60)}
                  </span>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <small>{label(ENQUIRY_SOURCES, e.source)}</small>
                    {e.status === 'new' && <Badge status="new">New</Badge>}
                  </span>
                </a>
              ))}
            </nav>
          )}
        </section>

        {selected ? (
          <section className="gta-panel gta-detail" aria-labelledby="enquiry-title">
            <div className="gta-head">
              <div>
                <h2 id="enquiry-title" style={{ fontSize: 20 }}>
                  {selected.name} · {selected.enquiryId}
                </h2>
                <p>
                  {formatIndianMobile(selected.whatsapp)} · {formatWhen(selected.createdAt)} ·{' '}
                  {label(ENQUIRY_SOURCES, selected.source)}
                </p>
              </div>
              <div className="gta-actions">
                <a
                  className="gta-btn gta-btn--whatsapp"
                  href={waMeLink(
                    selected.whatsapp,
                    `Hi ${selected.name}, this is Go Travels about your enquiry ${selected.enquiryId}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Reply on WhatsApp
                </a>
                <a
                  className="gta-btn"
                  href={`tel:+91${selected.whatsapp.replace(/\D/g, '').slice(-10)}`}
                >
                  Call
                </a>
              </div>
            </div>

            <dl className="gta-facts">
              <div>
                <dt>Trip type</dt>
                <dd>{label(TRIP_TYPES, selected.tripType)}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{selected.destination || '—'}</dd>
              </div>
              <div>
                <dt>Month</dt>
                <dd>{monthLabel(selected.travelMonth)}</dd>
              </div>
              <div>
                <dt>Travellers</dt>
                <dd>{label(TRAVELLER_GROUPS, selected.travellers)}</dd>
              </div>
              <div>
                <dt>Budget / person</dt>
                <dd>{label(BUDGETS, selected.budget)}</dd>
              </div>
              <div>
                <dt>WhatsApp alert</dt>
                <dd>
                  <Badge status={selected.whatsappStatus ?? 'notSent'}>
                    {WHATSAPP_LABELS[selected.whatsappStatus ?? 'notSent']}
                  </Badge>
                </dd>
              </div>
            </dl>

            {selected.message && (
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{selected.message}</p>
            )}
            {selected.package && typeof selected.package === 'object' && (
              <p style={{ margin: 0 }}>
                Asked about{' '}
                <a href={docUrl('packages', selected.package.id)}>{selected.package.title}</a>
              </p>
            )}

            <div className="gta-row">
              <label className="gta-field">
                Assigned to
                {fullAccess ? (
                  <FieldSelect
                    collection="enquiries"
                    id={selected.id}
                    field="assignedTo"
                    label="Assigned to"
                    value={
                      typeof selected.assignedTo === 'object'
                        ? (selected.assignedTo?.id ?? null)
                        : (selected.assignedTo ?? null)
                    }
                    allowEmpty="Unassigned"
                    options={staff.map((s) => ({
                      label: `${s.name} (${s.role})`,
                      value: String(s.id),
                    }))}
                  />
                ) : (
                  <span style={{ fontWeight: 400 }}>
                    {userName(selected.assignedTo) ?? 'Unassigned'}
                  </span>
                )}
              </label>
              <label className="gta-field">
                Status
                <FieldSelect
                  collection="enquiries"
                  id={selected.id}
                  field="status"
                  label="Enquiry status"
                  value={selected.status}
                  disabled={!canUpdate || selected.status === 'converted'}
                  options={ENQUIRY_STATUSES.map((s) => ({ ...s }))}
                />
              </label>
            </div>

            <div className="gta-field">
              <span>Internal notes</span>
              {selected.internalNotes?.length ? (
                <ul className="gta-notes">
                  {selected.internalNotes.map((n) => (
                    <li key={n.id}>
                      <small>
                        {userName(n.author as Enquiry['assignedTo']) ?? 'Staff'} ·{' '}
                        {n.at ? formatWhen(n.at) : ''}
                      </small>
                      {n.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={{ fontWeight: 400, color: 'var(--theme-elevation-600)' }}>
                  No notes yet.
                </span>
              )}
            </div>
            {canUpdate && (
              <NoteForm
                collection="enquiries"
                id={selected.id}
                notes={(selected.internalNotes ?? []).map((n) => ({
                  id: n.id,
                  text: n.text,
                  author:
                    typeof n.author === 'object' ? (n.author?.id ?? null) : (n.author ?? null),
                  at: n.at,
                }))}
              />
            )}

            <div className="gta-actions" style={{ justifyContent: 'space-between' }}>
              <a href={docUrl('enquiries', selected.id)}>Open full record</a>
              {selected.convertedBooking ? (
                <a
                  className="gta-btn gta-btn--primary"
                  href={docUrl(
                    'bookings',
                    typeof selected.convertedBooking === 'object'
                      ? selected.convertedBooking.id
                      : selected.convertedBooking,
                  )}
                >
                  View booking
                  {typeof selected.convertedBooking === 'object'
                    ? ` ${selected.convertedBooking.requestId}`
                    : ''}
                </a>
              ) : (
                canUpdate && (
                  <ActionButton
                    path={`/enquiries/${selected.id}/convert`}
                    label="Convert to booking"
                    pendingLabel="Converting…"
                    variant="primary"
                    confirmText={`Create a booking from ${selected.enquiryId}?`}
                    redirectTo="/admin/collections/bookings/{bookingId}"
                  />
                )
              )}
            </div>
          </section>
        ) : (
          <section className="gta-panel">
            <p className="gta-empty">Select an enquiry to see its details.</p>
          </section>
        )}
      </div>
    </Gutter>
  )
}
