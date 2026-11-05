import { Gutter } from '@payloadcms/ui'
import type { ListViewServerProps, Where } from 'payload'

import { canWrite } from '@/access'
import type { User } from '@/payload-types'

import { ReviewLinkForm, SetValueButton } from '../client'
import { Badge, docUrl, formatDate, listUrl, param, qs } from '../shared'

const SOURCE_LABELS: Record<string, string> = {
  reviewLink: 'Via review link',
  staff: 'Added by staff',
  google: 'Google review',
}

/** Testimonials board (design: "CMS · Testimonials"): approve or hide reviews as cards. */
export async function TestimonialsBoard({
  payload,
  user: viewer,
  searchParams,
}: ListViewServerProps) {
  const user = viewer as User
  const status = param(searchParams?.status)
  const where: Where = status ? { status: { equals: status } } : {}
  const canEdit = canWrite('testimonials', user.role)

  const [list, pendingCount, packages] = await Promise.all([
    payload.find({
      collection: 'testimonials',
      where,
      sort: '-createdAt',
      limit: 60,
      depth: 0,
      user,
      overrideAccess: false,
    }),
    payload.count({
      collection: 'testimonials',
      where: { status: { equals: 'pending' } },
      user,
      overrideAccess: false,
    }),
    canEdit
      ? payload.find({
          collection: 'packages',
          where: { status: { equals: 'published' } },
          sort: 'title',
          limit: 200,
          depth: 0,
          select: { title: true },
          user,
          overrideAccess: false,
        })
      : Promise.resolve({ docs: [] as { id: number; title: string }[] }),
  ])

  const tabs = [
    { label: 'All', value: undefined as string | undefined },
    { label: `Pending (${pendingCount.totalDocs})`, value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Hidden', value: 'hidden' },
  ]

  return (
    <Gutter className="gta">
      <div className="gta-head">
        <div>
          <h1>Testimonials</h1>
          <p>Only approved reviews appear in “What Our Clients Say”.</p>
        </div>
        {canEdit && (
          <div className="gta-actions">
            <a className="gta-btn gta-btn--primary" href={`${listUrl('testimonials')}/create`}>
              + Add testimonial
            </a>
          </div>
        )}
      </div>

      {canEdit && (
        <section className="gta-panel">
          <ReviewLinkForm
            siteUrl={process.env.NEXT_PUBLIC_SITE_URL || ''}
            packages={packages.docs.map((p) => ({ id: p.id, title: p.title }))}
          />
        </section>
      )}

      <section className="gta-panel" aria-label="Testimonials">
        <div className="gta-panel__head">
          <nav className="gta-tabs" aria-label="Filter by status">
            {tabs.map((t) => (
              <a
                key={t.label}
                href={`${listUrl('testimonials')}${qs({ status: t.value })}`}
                aria-current={t.value === status ? 'page' : undefined}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
        {list.docs.length === 0 ? (
          <p className="gta-empty">No testimonials here yet.</p>
        ) : (
          <div className="gta-cards">
            {list.docs.map((t) => (
              <article key={t.id} className="gta-card" aria-label={`Review by ${t.name}`}>
                <header style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>
                    <b>{t.name}</b>
                    <br />
                    <small style={{ color: 'var(--theme-elevation-600)' }}>
                      {t.tripLabel || '—'}
                    </small>
                  </span>
                  <Badge status={t.status}>{t.status[0].toUpperCase() + t.status.slice(1)}</Badge>
                </header>
                <span className="gta-stars" aria-label={`${t.rating} out of 5 stars`}>
                  {'★'.repeat(t.rating)}
                  <span style={{ opacity: 0.25 }}>{'★'.repeat(5 - t.rating)}</span>
                </span>
                <p>{t.text}</p>
                <footer>
                  <span>
                    {SOURCE_LABELS[t.source] ?? t.source} · {formatDate(t.createdAt)}
                  </span>
                  <span className="gta-actions">
                    {canEdit && t.status !== 'approved' && (
                      <SetValueButton
                        collection="testimonials"
                        id={t.id}
                        data={{ status: 'approved' }}
                        label="Approve"
                        variant="primary"
                      />
                    )}
                    {canEdit && t.status !== 'hidden' && (
                      <SetValueButton
                        collection="testimonials"
                        id={t.id}
                        data={{ status: 'hidden' }}
                        label="Hide"
                      />
                    )}
                    <a className="gta-btn gta-btn--sm" href={docUrl('testimonials', t.id)}>
                      {canEdit ? 'Edit' : 'View'}
                    </a>
                  </span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </Gutter>
  )
}
