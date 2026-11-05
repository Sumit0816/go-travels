import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps, Payload, Where } from 'payload'

import { canRead, canUpdateSome, canWrite } from '@/access'
import { deliveryRate } from '@/lib/admin-helpers'
import { BOOKING_STATUSES } from '@/lib/catalog'
import { formatINR, formatIndianMobile, formatTravellers } from '@/lib/format'
import { bookingsWhere } from '@/endpoints/bookings'
import type { User } from '@/payload-types'

import { ActionButton, FieldSelect } from '../client'
import {
  ADMIN,
  Badge,
  BOOKING_STATUS_COLOURS,
  docUrl,
  formatDate,
  formatWhen,
  Kpi,
  listUrl,
  param,
  qs,
  WHATSAPP_LABELS,
} from '../shared'

const PAGE_SIZE = 10

const count = (
  payload: Payload,
  user: User,
  collection: 'bookings' | 'packages' | 'enquiries' | 'testimonials' | 'posts' | 'messageLog',
  where: Where,
) =>
  payload
    .count({ collection, where, user, overrideAccess: false })
    .then((r) => r.totalDocs)
    .catch(() => 0)

function monthStart(now = new Date()) {
  // Start of the current month in India time.
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return new Date(
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - 5.5 * 60 * 60 * 1000,
  ).toISOString()
}

async function bookingKpis(payload: Payload, user: User) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [fresh, confirmed, live] = await Promise.all([
    count(payload, user, 'bookings', { status: { equals: 'new' } }),
    count(payload, user, 'bookings', {
      and: [
        { status: { equals: 'confirmed' } },
        { confirmedAt: { greater_than_equal: monthStart() } },
      ],
    }),
    count(payload, user, 'packages', { status: { equals: 'published' } }),
  ])
  let fourth: { label: string; value: string; note: string }
  if (canRead('whatsapp', user.role)) {
    // Team alerts with a final outcome; queued or in-flight retries don't count against the rate.
    const recent = { createdAt: { greater_than_equal: since } }
    const alerts = { kind: { in: ['booking', 'enquiry'] } }
    const [total, delivered, read] = await Promise.all([
      count(payload, user, 'messageLog', {
        and: [recent, alerts, { status: { in: ['delivered', 'read', 'failed'] } }],
      }),
      count(payload, user, 'messageLog', {
        and: [recent, alerts, { status: { equals: 'delivered' } }],
      }),
      count(payload, user, 'messageLog', {
        and: [recent, alerts, { status: { equals: 'read' } }],
      }),
    ])
    const rate = deliveryRate({ total, delivered, read })
    fourth = {
      label: 'WhatsApp delivery',
      value: rate === null ? '—' : `${rate}%`,
      note: 'Team alerts, last 30 days',
    }
  } else {
    const mine = await count(payload, user, 'enquiries', {
      and: [
        { assignedTo: { equals: user.id } },
        { status: { in: ['new', 'contacted', 'quoteSent'] } },
      ],
    })
    fourth = {
      label: 'My open enquiries',
      value: String(mine),
      note: 'Assigned to you, not yet closed',
    }
  }
  return [
    { label: 'New requests', value: String(fresh), note: 'Waiting for a first reply' },
    { label: 'Confirmed this month', value: String(confirmed), note: 'Bookings marked Confirmed' },
    fourth,
    { label: 'Live packages', value: String(live), note: 'Published on the website' },
  ]
}

async function contentKpis(payload: Payload, user: User) {
  const [live, drafts, pending, scheduled] = await Promise.all([
    count(payload, user, 'packages', { status: { equals: 'published' } }),
    count(payload, user, 'packages', { status: { equals: 'draft' } }),
    count(payload, user, 'testimonials', { status: { equals: 'pending' } }),
    count(payload, user, 'posts', { status: { equals: 'scheduled' } }),
  ])
  return [
    { label: 'Live packages', value: String(live), note: 'Published on the website' },
    { label: 'Draft packages', value: String(drafts), note: 'Not yet published' },
    { label: 'Reviews to approve', value: String(pending), note: 'Pending testimonials' },
    { label: 'Scheduled posts', value: String(scheduled), note: 'Blog posts waiting to go live' },
  ]
}

/** CMS home: KPI cards and the bookings table (design: "CMS · Dashboard & bookings"). */
export async function Dashboard({ initPageResult, searchParams }: AdminViewServerProps) {
  const { payload } = initPageResult.req
  const user = initPageResult.req.user as User
  const role = user?.role
  const showBookings = canRead('bookings', role)

  const kpis = showBookings ? await bookingKpis(payload, user) : await contentKpis(payload, user)

  const status = param(searchParams?.status)
  const q = param(searchParams?.q)
  const page = Math.max(1, Number(param(searchParams?.page)) || 1)

  const bookings = showBookings
    ? await payload.find({
        collection: 'bookings',
        where: bookingsWhere(status, q),
        sort: '-createdAt',
        limit: PAGE_SIZE,
        page,
        depth: 0,
        user,
        overrideAccess: false,
      })
    : null

  const canEditStatus = canUpdateSome('bookings', role)
  const tabs = [
    { label: 'All', value: undefined as string | undefined },
    ...BOOKING_STATUSES.map((s) => ({ label: s.label, value: s.value })),
  ]
  const first = bookings ? (bookings.page! - 1) * PAGE_SIZE + 1 : 0
  const last = bookings ? first + bookings.docs.length - 1 : 0

  return (
    <Gutter className="gta">
      <div className="gta-head">
        <div>
          <h1>{showBookings ? 'Bookings' : 'Dashboard'}</h1>
          <p>
            {showBookings
              ? 'Every request from the website, and its WhatsApp delivery status.'
              : `Welcome back, ${user?.name ?? 'there'}. Here's what needs attention in the content.`}
          </p>
        </div>
        <div className="gta-actions">
          {showBookings && (
            <a className="gta-btn" href={`/api/bookings/export${qs({ status, q })}`}>
              Export CSV
            </a>
          )}
          {canWrite('packages', role) && (
            <a className="gta-btn gta-btn--primary" href={`${listUrl('packages')}/create`}>
              + New package
            </a>
          )}
        </div>
      </div>

      <section className="gta-kpis" aria-label="Key numbers">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </section>

      {bookings && (
        <section className="gta-panel" aria-labelledby="bookings-title">
          <div className="gta-panel__head">
            <h2
              id="bookings-title"
              className="sr-only"
              style={{ position: 'absolute', left: -9999 }}
            >
              Bookings
            </h2>
            <nav className="gta-tabs" aria-label="Filter by status">
              {tabs.map((t) => (
                <a
                  key={t.label}
                  href={`${ADMIN}${qs({ status: t.value, q })}`}
                  aria-current={t.value === status ? 'page' : undefined}
                >
                  {t.label}
                </a>
              ))}
            </nav>
            <form className="gta-search" method="get" action={ADMIN} role="search">
              {status && <input type="hidden" name="status" value={status} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search bookings"
                aria-label="Search bookings"
              />
              <button type="submit" className="gta-btn gta-btn--sm">
                Search
              </button>
            </form>
          </div>

          {bookings.docs.length === 0 ? (
            <p className="gta-empty">No bookings match. Try another status or search.</p>
          ) : (
            <div className="gta-table-wrap">
              <table className="gta-table">
                <thead>
                  <tr>
                    <th scope="col">Request</th>
                    <th scope="col">Customer</th>
                    <th scope="col">Package</th>
                    <th scope="col">Travel date</th>
                    <th scope="col">Pax</th>
                    <th scope="col">Est. total</th>
                    <th scope="col">WhatsApp</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span style={{ position: 'absolute', left: -9999 }}>Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.docs.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <a href={docUrl('bookings', b.id)}>
                          <b>{b.requestId}</b>
                        </a>
                        <small>{formatWhen(b.createdAt)}</small>
                      </td>
                      <td>
                        {b.name}
                        <small>{formatIndianMobile(b.whatsapp)}</small>
                      </td>
                      <td>
                        {b.packageSnapshot?.title ?? '—'}
                        {b.packageSnapshot?.duration && <small>{b.packageSnapshot.duration}</small>}
                      </td>
                      <td>{formatDate(b.travelDate)}</td>
                      <td>{formatTravellers(b.adults, b.children ?? 0)}</td>
                      <td>{b.estimatedTotal != null ? formatINR(b.estimatedTotal) : '—'}</td>
                      <td>
                        <Badge status={b.whatsappStatus ?? 'notSent'}>
                          {WHATSAPP_LABELS[b.whatsappStatus ?? 'notSent']}
                        </Badge>
                      </td>
                      <td>
                        <FieldSelect
                          collection="bookings"
                          id={b.id}
                          field="status"
                          label={`Status of ${b.requestId}`}
                          value={b.status}
                          disabled={!canEditStatus}
                          options={BOOKING_STATUSES.map((s) => ({
                            ...s,
                            colour: BOOKING_STATUS_COLOURS[s.value],
                          }))}
                        />
                      </td>
                      <td>
                        {b.whatsappStatus === 'failed' && canEditStatus ? (
                          <ActionButton
                            path={`/bookings/${b.id}/resend`}
                            label="Resend"
                            pendingLabel="Queuing…"
                            variant="whatsapp"
                          />
                        ) : (
                          <a href={docUrl('bookings', b.id)}>View</a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="gta-pager">
            <span>
              {bookings.totalDocs
                ? `Showing ${first}–${last} of ${bookings.totalDocs}`
                : 'No bookings'}
            </span>
            <span className="gta-actions">
              {bookings.hasPrevPage && (
                <a
                  className="gta-btn gta-btn--sm"
                  href={`${ADMIN}${qs({ status, q, page: page - 1 })}`}
                >
                  Prev
                </a>
              )}
              {bookings.hasNextPage && (
                <a
                  className="gta-btn gta-btn--sm"
                  href={`${ADMIN}${qs({ status, q, page: page + 1 })}`}
                >
                  Next
                </a>
              )}
            </span>
          </div>
        </section>
      )}

      {!showBookings && (
        <section className="gta-panel gta-detail" aria-label="Shortcuts">
          <h2>Shortcuts</h2>
          <div className="gta-actions">
            <a className="gta-btn" href={listUrl('packages')}>
              Packages
            </a>
            <a className="gta-btn" href={listUrl('testimonials')}>
              Testimonials
            </a>
            <a className="gta-btn" href={listUrl('posts')}>
              Blog posts
            </a>
            <a className="gta-btn" href={listUrl('slides')}>
              Homepage slider
            </a>
            <a className="gta-btn" href={listUrl('media')}>
              Media library
            </a>
          </div>
        </section>
      )}
    </Gutter>
  )
}
