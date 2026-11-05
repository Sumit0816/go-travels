import type { Metadata } from 'next'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { buildContact } from '@/components/site/data'
import { TripFinderForm } from '@/components/site/EnquiryForms'
import { Icon } from '@/components/ui/Icon'
import { TRIP_TYPES } from '@/lib/catalog'
import { getSiteSettings } from '@/lib/cms'

export const metadata: Metadata = {
  title: 'Plan My Trip',
  description:
    'Tell us where and when you want to travel. A Go Travels expert replies on WhatsApp with a plan and a quote — free, no obligation.',
  alternates: { canonical: '/plan-my-trip' },
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 120)

const NEXT_STEPS = [
  'We read your enquiry and check availability.',
  'A travel expert messages you on WhatsApp, usually within a few working hours.',
  'You get a day-by-day plan and a clear quote. Change anything you like.',
]

/** "Find Your Perfect Trip" (design: EnquiryModal and Mobile · Enquiry form). */
export default async function PlanMyTripPage({ searchParams }: Props) {
  const sp = await searchParams
  const settings = await getSiteSettings().catch(() => null)
  const contact = buildContact(settings)
  const type = one(sp.type)
  const month = one(sp.month)
  const defaults = {
    destination: one(sp.destination),
    tripType: TRIP_TYPES.some((t) => t.value === type) ? type : undefined,
    packageSlug: one(sp.package),
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : undefined,
  }

  return (
    <div className="bg-sand-100">
      <div className="container-site flex flex-col gap-6 py-8 md:py-12">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Plan My Trip' }]} />
        <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
          <section
            aria-labelledby="plan-title"
            className="rounded-lg bg-surface p-5 shadow-card md:p-8"
          >
            <span className="eyebrow">Free trip planning</span>
            <h1 id="plan-title" className="heading-1 mt-2 mb-2">
              Find your perfect trip
            </h1>
            <p className="mt-0 mb-6 text-body-lg text-ink-700">
              Tell us a little about your trip. We&apos;ll reply on WhatsApp with options and a
              quote.
            </p>
            <TripFinderForm whatsappHref={contact.whatsappHref} defaults={defaults} />
          </section>

          <aside className="flex flex-col gap-5">
            <section aria-labelledby="next-title" className="rounded-lg bg-surface p-5 md:p-6">
              <h2 id="next-title" className="heading-3 mb-4">
                What happens next
              </h2>
              <ol className="m-0 flex list-none flex-col gap-4 p-0">
                {NEXT_STEPS.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-ocean-700 font-display text-[14px] font-bold text-surface"
                    >
                      {i + 1}
                    </span>
                    <span className="pt-1 text-body-sm leading-relaxed text-ink-700">{s}</span>
                  </li>
                ))}
              </ol>
            </section>
            {(contact.whatsappHref || contact.phoneHref) && (
              <section
                aria-labelledby="talk-title"
                className="flex flex-col gap-3 rounded-lg bg-surface p-5 md:p-6"
              >
                <h2 id="talk-title" className="heading-3 m-0">
                  Rather talk now?
                </h2>
                {contact.hours && (
                  <p className="m-0 text-body-sm text-ink-500">
                    We&apos;re available {contact.hours}.
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  {contact.whatsappHref && (
                    <a
                      href={contact.whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="gt-btn gt-btn--whatsapp"
                    >
                      <Icon name="whatsapp" size={18} />
                      WhatsApp us
                    </a>
                  )}
                  {contact.phoneHref && (
                    <a href={contact.phoneHref} className="gt-btn gt-btn--outline">
                      <Icon name="phone" size={18} />
                      {contact.phone}
                    </a>
                  )}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
