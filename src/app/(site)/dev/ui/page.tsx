import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  BookingStepper,
  Button,
  Chip,
  DataTable,
  Icon,
  KpiCard,
  Logo,
  LogoMark,
  PackageCard,
  SelectField,
  SiteHeader,
  StatusBadge,
  TextAreaField,
  TextField,
  WhatsAppMessage,
} from '@/components/ui'
import { formatINR, formatTravellers } from '@/lib/format'

export const metadata: Metadata = { title: 'Component library', robots: { index: false } }

const COLOURS = [
  'ocean-50',
  'ocean-700',
  'ocean-800',
  'night-900',
  'marigold-500',
  'marigold-700',
  'ink-900',
  'ink-700',
  'ink-500',
  'sand-100',
  'line-200',
  'line-300',
  'whatsapp-600',
  'whatsapp-header',
  'whatsapp-bubble',
  'whatsapp-wall',
  'success-50',
  'success-700',
  'info-50',
  'warning-50',
  'warning-700',
  'danger-50',
  'danger-700',
  'error',
  'dest-coast',
  'dest-desert',
  'dest-forest',
  'dest-romance',
  'dest-pilgrim',
  'dest-mountain',
]

const SAMPLE_MESSAGE = `*New Booking Request* · GT-24871
Package: Goa Beach Escape (3N/4D)
Date: 18 Dec 2026 · From: Ranchi
Travellers: ${formatTravellers(2)}
Hotel: Deluxe 4★ · 1 room
Name: Ankit Kumar
WhatsApp: +91 98301 22457
Est. total: ${formatINR(33998)}
Notes: Vegetarian meals`

type BookingRow = {
  id: string
  when: string
  name: string
  phone: string
  pkg: string
  total: number
  wa: string
  status: string
}
const BOOKINGS: BookingRow[] = [
  {
    id: 'GT-24871',
    when: 'Today 12:41',
    name: 'Ankit Kumar',
    phone: '+91 98301 22457',
    pkg: 'Goa Beach Escape 3N/4D',
    total: 33998,
    wa: 'Read',
    status: 'New',
  },
  {
    id: 'GT-24870',
    when: 'Today 11:05',
    name: 'Rahul Mehta',
    phone: '+91 98351 44120',
    pkg: 'Dubai Highlights 4N/5D',
    total: 132497,
    wa: 'Delivered',
    status: 'Contacted',
  },
  {
    id: 'GT-24869',
    when: 'Today 09:22',
    name: 'Sanjay Oraon',
    phone: '+91 70044 81236',
    pkg: 'Deoghar & Basukinath 2N/3D',
    total: 27996,
    wa: 'Failed',
    status: 'New',
  },
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line-200 py-10">
      <h2 className="heading-3">{title}</h2>
      {children}
    </section>
  )
}

/** Dev-only preview of every design-system component (404 in production). */
export default function ComponentLibraryPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="container-site py-10">
      <span className="eyebrow">Go Travels design system</span>
      <h1 className="heading-1 mt-2">Component library</h1>
      <p className="mt-2 max-w-[640px] text-ink-700">
        Every component built from the design-system tokens. Use this page to check a change before
        it reaches a real screen.
      </p>

      <Section title="Colour">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
          {COLOURS.map((c) => (
            <div key={c} className="overflow-hidden rounded-md border border-line-200 text-caption">
              <div className="h-14" style={{ background: `var(--color-${c})` }} />
              <div className="px-2 py-1.5 font-semibold">{c}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type">
        <div className="flex flex-col gap-3">
          <span className="heading-display">Discover. Dream. Travel.</span>
          <span className="heading-1">International Tour Packages</span>
          <span className="heading-2">Tour packages travellers love</span>
          <span className="heading-3">Day-wise itinerary</span>
          <span className="font-display text-h4">
            Goa Beach Escape with North &amp; South Goa Tour
          </span>
          <span className="font-display text-price">{formatINR(12499)}</span>
          <span className="text-body-lg text-ink-700">
            Handpicked tours, planned by real people and confirmed on WhatsApp.
          </span>
          <span className="text-body">
            Pickup from airport or station, hotel check-in, then a relaxed evening on the beach.
          </span>
          <span className="text-body-sm">
            Transparent, all-inclusive quotes with no hidden fees.
          </span>
          <span className="text-label">WhatsApp number*</span>
          <span className="eyebrow">Popular destinations</span>
          <span className="text-caption text-ink-500">Starting from · per person</span>
        </div>
      </Section>

      <Section title="Logo">
        <div className="flex flex-wrap items-center gap-6">
          <Logo />
          <div className="rounded-lg bg-night-900 p-4">
            <Logo onDark />
          </div>
          <LogoMark size={32} />
          <LogoMark size={32} onDark />
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Book Now</Button>
          <Button variant="accent">Plan My Trip</Button>
          <Button variant="whatsapp">
            <Icon name="whatsapp" size={18} />
            Chat on WhatsApp
          </Button>
          <Button variant="outline">← Back</Button>
          <Button variant="ghost">View all packages →</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="whatsapp" size="lg">
            Send Booking via WhatsApp
          </Button>
          <Button size="sm">+ New package</Button>
          <Button variant="outline" size="icon" aria-label="Next slide">
            <Icon name="chevronRight" />
          </Button>
          <Button variant="whatsapp" disabled>
            Sending to WhatsApp…
          </Button>
        </div>
      </Section>

      <Section title="Chips">
        <div className="flex flex-wrap gap-2">
          <Chip pressed>Goa</Chip>
          <Chip>Dubai</Chip>
          <Chip>Thailand</Chip>
          <Chip soft pressed>
            4–6 nights
          </Chip>
          <Chip soft>Family</Chip>
        </div>
      </Section>

      <Section title="Form fields">
        <div className="grid max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Full name" required placeholder="As on ID" />
          <TextField label="WhatsApp number" required type="tel" prefix="+91" inputMode="numeric" />
          <TextField
            label="WhatsApp number"
            required
            type="tel"
            prefix="+91"
            defaultValue="98301"
            error="Enter a valid 10-digit mobile number"
          />
          <TextField
            label="Travel date"
            required
            type="date"
            hint="We confirm availability on WhatsApp."
          />
          <SelectField label="Hotel category" options={['Deluxe 4★', 'Standard 3★', 'Luxury 5★']} />
          <SelectField
            label="Budget / person"
            options={['Under ₹25k', '₹25k – ₹50k', '₹50k – ₹1L', '₹1L+']}
          />
          <TextAreaField
            className="sm:col-span-2"
            label="Special requests"
            placeholder="Vegetarian meals, sea-facing room if possible."
          />
        </div>
      </Section>

      <Section title="Status badges">
        <div className="flex flex-wrap gap-2">
          {[
            'Delivered',
            'Read',
            'Queued',
            'Failed',
            'Published',
            'Draft',
            'Scheduled',
            'Archived',
            'New',
            'Confirmed',
          ].map((s) => (
            <StatusBadge key={s}>{s}</StatusBadge>
          ))}
          <span className="rounded-md bg-dest-coast p-1">
            <StatusBadge tone="tag">Bestseller</StatusBadge>
          </span>
        </div>
      </Section>

      <Section title="Package cards">
        <div className="gt-card-grid">
          <PackageCard
            href="#"
            place="Goa"
            tag="Bestseller"
            title="Goa Beach Escape with North & South Goa Tour"
            nights={3}
            inclusions="Hotel · Breakfast · Transfers"
            price={12499}
            imageUrl="/brand/illustrations/beach.svg"
            tone="coast"
          />
          <PackageCard
            href="#"
            place="Dubai"
            tag="International"
            title="Dubai Highlights with Desert Safari & Dhow Cruise"
            nights={4}
            inclusions="Hotel · Visa help · Tours"
            price={54999}
            imageUrl="/brand/illustrations/desert.svg"
            tone="desert"
          />
          <PackageCard
            href="#"
            place="Deoghar"
            tag="Pilgrimage"
            title="Deoghar & Basukinath Darshan"
            nights={2}
            inclusions="Hotel · Darshan help"
            price={6999}
            imageUrl="/brand/illustrations/temple.svg"
            tone="pilgrim"
          />
          <PackageCard
            href="#"
            place="Bali"
            tag="Honeymoon"
            title="Romantic Bali with Private Pool Villa Stay"
            nights={5}
            inclusions="Villa · Candlelight dinner"
            price={46499}
            tone="romance"
            ctaLabel="View Details"
          />
        </div>
      </Section>

      <Section title="Booking stepper">
        <BookingStepper current={3} />
        <BookingStepper current={1} />
      </Section>

      <Section title="WhatsApp message">
        <WhatsAppMessage text={SAMPLE_MESSAGE} time="12:41 PM" />
      </Section>

      <Section title="CMS: KPI cards and table">
        <div className="gt-kpi-grid">
          <KpiCard label="New requests" value="3" note="Waiting for a first reply" />
          <KpiCard label="Confirmed this month" value="42" note="Bookings marked Confirmed" />
          <KpiCard label="WhatsApp delivery" value="98.4%" note="Last 30 days, all recipients" />
          <KpiCard label="Live packages" value="128" note="Published on the website" />
        </div>
        <DataTable<BookingRow>
          caption="Bookings"
          rows={BOOKINGS}
          rowKey={(r) => r.id}
          columns={[
            {
              key: 'id',
              header: 'Request',
              render: (r) => (
                <>
                  <b>{r.id}</b>
                  <small>{r.when}</small>
                </>
              ),
            },
            {
              key: 'customer',
              header: 'Customer',
              render: (r) => (
                <>
                  {r.name}
                  <small>{r.phone}</small>
                </>
              ),
            },
            { key: 'pkg', header: 'Package', render: (r) => r.pkg },
            { key: 'total', header: 'Est. total', render: (r) => formatINR(r.total) },
            { key: 'wa', header: 'WhatsApp', render: (r) => <StatusBadge>{r.wa}</StatusBadge> },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusBadge>{r.status}</StatusBadge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              hideHeader: true,
              align: 'right',
              render: (r) => <a href="#">{r.wa === 'Failed' ? 'Resend' : 'View'}</a>,
            },
          ]}
        />
      </Section>

      <Section title="Site header">
        <div className="overflow-hidden rounded-lg border border-line-200">
          <SiteHeader currentPath="/" />
        </div>
      </Section>
    </main>
  )
}
