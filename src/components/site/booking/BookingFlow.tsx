'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react'

import {
  retryBookingAlert,
  submitBooking,
  type BookingResult,
} from '@/app/(site)/packages/[slug]/book/actions'
import { BookingStepper } from '@/components/ui/BookingStepper'
import { Icon } from '@/components/ui/Icon'
import { SelectField, TextAreaField, TextField } from '@/components/ui/TextField'
import { WhatsAppMessage } from '@/components/ui/WhatsAppMessage'
import {
  MAX_ADULTS,
  MAX_CHILDREN,
  MAX_ROOMS,
  STEP_FIELDS,
  quoteBooking,
  stepErrors,
  todayInIndia,
  type BookingErrors,
  type BookingField,
} from '@/lib/booking'
import { hotelCategoryLabel } from '@/lib/catalog'
import { formatINR, formatIndianMobile, formatTravellers } from '@/lib/format'
import { formatTripDate } from '@/lib/whatsapp/messages'

export type BookingPackage = {
  slug: string
  title: string
  place: string
  duration: string
  image: { src: string; alt: string; position: string } | null
  hotels: { category: string; price: number; hotelName?: string | null }[]
  addOns: { name: string; price: number }[]
  childPricePercent: number | null
  pickup: string | null
}

export type BookingContact = {
  whatsappHref: string | null
  phone: string | null
  phoneHref: string | null
}

type Values = {
  travelDate: string
  departureCity: string
  hotel: string
  rooms: number
  adults: number
  children: number
  addOns: string[]
  name: string
  whatsapp: string
  email: string
  city: string
  specialRequests: string
  consent: boolean
}

type Step = 1 | 2 | 3 | 4

const storageKey = (slug: string) => `gt-booking:${slug}`

function readSaved(slug: string): Partial<Values> | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(slug))
    return raw ? (JSON.parse(raw) as Partial<Values>) : null
  } catch {
    return null
  }
}

function save(slug: string, v: Values | null) {
  try {
    if (v) window.sessionStorage.setItem(storageKey(slug), JSON.stringify(v))
    else window.sessionStorage.removeItem(storageKey(slug))
  } catch {
    // Private mode or blocked storage: the form still works, it just won't survive a refresh.
  }
}

const stepOfField = (f: BookingField): 1 | 2 => (STEP_FIELDS[1].includes(f) ? 1 : 2)

/** Booking request form (design: "Desktop · Booking", States · "WhatsApp send failed"). */
export function BookingFlow({
  pkg,
  initial,
  contact,
}: {
  pkg: BookingPackage
  initial: Partial<Values>
  contact: BookingContact
}) {
  const params = useSearchParams()
  const urlStep = Math.min(4, Math.max(1, Number(params.get('step')) || 1)) as Step
  const today = todayInIndia()

  const [values, setValues] = useState<Values>(() => ({
    travelDate: '',
    departureCity: pkg.pickup ?? '',
    hotel: pkg.hotels[0]?.category ?? '',
    rooms: 1,
    adults: 2,
    children: 0,
    addOns: [],
    name: '',
    whatsapp: '',
    email: '',
    city: '',
    specialRequests: '',
    consent: false,
    ...initial,
  }))
  const [hydrated, setHydrated] = useState(false)
  const [errors, setErrors] = useState<BookingErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [result, setResult] = useState<BookingResult | null>(null)
  const [pending, startTransition] = useTransition()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)

  // Restore a half-filled form after a refresh (values from the URL win for trip choices).
  useEffect(() => {
    const saved = readSaved(pkg.slug)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off restore from storage
    if (saved) setValues((v) => ({ ...v, ...saved, ...initial }))
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])
  useEffect(() => {
    if (hydrated && !(result && result.status !== 'error')) save(pkg.slug, values)
  }, [hydrated, values, pkg.slug, result])

  const withSlug = useMemo(() => ({ ...values, packageSlug: pkg.slug }), [values, pkg.slug])

  // Never show a step whose earlier steps are incomplete (e.g. a shared ?step=3 link).
  let step: Step = urlStep
  if (hydrated) {
    if (step >= 2 && Object.keys(stepErrors(withSlug, 1, today)).length) step = 1
    else if (step >= 3 && Object.keys(stepErrors(withSlug, 2, today)).length) step = 2
    if (step === 4 && (!result || result.status === 'error')) step = 3
  } else if (step === 4) step = 3
  const done = step === 4 && result && result.status !== 'error' ? result : null

  const quote = quoteBooking(
    { hotelOptions: pkg.hotels, childPricePercent: pkg.childPricePercent, addOns: pkg.addOns },
    values,
  )

  useEffect(() => {
    headingRef.current?.focus()
  }, [step, done?.status])

  function go(next: Step, replace = false) {
    const sp = new URLSearchParams(params.toString())
    if (next === 1) sp.delete('step')
    else sp.set('step', String(next))
    const url = `${window.location.pathname}${sp.size ? `?${sp}` : ''}`
    if (replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    window.scrollTo({ top: 0 })
  }

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key as BookingField]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function focusField(name: string) {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[name="${name}"]`)?.focus()
    })
  }

  function next() {
    setFormError(null)
    if (step === 1 || step === 2) {
      const errs = stepErrors(withSlug, step, today)
      const first = Object.keys(errs)[0]
      if (first) {
        setErrors(errs)
        focusField(first)
        return
      }
      setErrors({})
      go((step + 1) as Step)
      return
    }
    startTransition(async () => {
      const r = await submitBooking({ ...withSlug, website: honeypotRef.current?.value ?? '' })
      if (r.status === 'error') {
        setFormError(r.message)
        const first = Object.keys(r.errors ?? {})[0] as BookingField | undefined
        if (first) {
          setErrors(r.errors ?? {})
          go(stepOfField(first))
          focusField(first)
        }
        return
      }
      setResult(r)
      save(pkg.slug, null)
      go(4, true)
    })
  }

  function retry() {
    if (!result || result.status !== 'failed') return
    startTransition(async () => {
      const r = await retryBookingAlert(result.requestId, values.whatsapp)
      if (r.status === 'error') setFormError(r.message)
      else {
        setFormError(null)
        setResult(r)
      }
    })
  }

  const hotelLabel = `${hotelCategoryLabel(values.hotel)} · ${values.rooms} room${values.rooms === 1 ? '' : 's'}`
  const travellers = formatTravellers(values.adults, values.children)

  return (
    <div className="container-site flex flex-col gap-6 py-6 md:py-10">
      <p className="m-0 flex items-center gap-2 text-body-sm text-ink-500">
        <Icon name="check" size={16} />
        Secure booking request · No online payment
      </p>
      <BookingStepper current={step} />

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 rounded-xl border border-line-200 bg-surface p-5 md:p-8">
          {done?.status === 'sent' && (
            <Sent
              headingRef={headingRef}
              requestId={done.requestId}
              phone={values.whatsapp}
              message={done.message}
              contact={contact}
            />
          )}
          {done?.status === 'failed' && (
            <Failed
              headingRef={headingRef}
              requestId={done.requestId}
              contact={contact}
              pending={pending}
              onRetry={retry}
              error={formError}
            />
          )}

          {!done && (
            <form
              noValidate
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault()
                next()
              }}
            >
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label>
                  Website
                  <input
                    ref={honeypotRef}
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              {step === 1 && (
                <>
                  <StepHeading headingRef={headingRef} title="Trip details">
                    Choose your dates, travellers and stay.
                  </StepHeading>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Travel date"
                      required
                      name="travelDate"
                      type="date"
                      min={today}
                      value={values.travelDate}
                      onChange={(e) => set('travelDate', e.target.value)}
                      error={errors.travelDate}
                    />
                    <TextField
                      label="Departure city"
                      name="departureCity"
                      autoComplete="address-level2"
                      value={values.departureCity}
                      onChange={(e) => set('departureCity', e.target.value)}
                      error={errors.departureCity}
                    />
                    <SelectField
                      label="Hotel category"
                      name="hotel"
                      value={values.hotel}
                      onChange={(e) => set('hotel', e.target.value)}
                      error={errors.hotel}
                      options={pkg.hotels.map((h) => ({
                        value: h.category,
                        label: `${hotelCategoryLabel(h.category)} · ${formatINR(h.price)} / person`,
                      }))}
                    />
                    <SelectField
                      label="Rooms"
                      name="rooms"
                      value={String(values.rooms)}
                      onChange={(e) => set('rooms', Number(e.target.value))}
                      error={errors.rooms}
                      options={Array.from({ length: MAX_ROOMS }, (_, i) => String(i + 1))}
                    />
                  </div>
                  <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
                    <legend className="mb-2.5 text-label">Travellers</legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Counter
                        label="Adults"
                        hint="12+ years"
                        noun="adult"
                        value={values.adults}
                        min={1}
                        max={MAX_ADULTS}
                        onChange={(n) => set('adults', n)}
                      />
                      <Counter
                        label="Children"
                        hint="2–11 years"
                        noun="child"
                        value={values.children}
                        min={0}
                        max={MAX_CHILDREN}
                        onChange={(n) => set('children', n)}
                      />
                    </div>
                    {(errors.adults || errors.children) && (
                      <span className="gt-field__error">{errors.adults ?? errors.children}</span>
                    )}
                  </fieldset>
                  {pkg.addOns.length > 0 && (
                    <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
                      <legend className="mb-2.5 text-label">Add-ons (optional)</legend>
                      <div className="flex flex-wrap gap-2.5">
                        {pkg.addOns.map((a) => (
                          <label key={a.name} className="gt-check-card">
                            <input
                              type="checkbox"
                              name="addOns"
                              value={a.name}
                              checked={values.addOns.includes(a.name)}
                              onChange={(e) =>
                                set(
                                  'addOns',
                                  e.target.checked
                                    ? [...values.addOns, a.name]
                                    : values.addOns.filter((x) => x !== a.name),
                                )
                              }
                            />
                            <span>
                              {a.name}
                              {a.price > 0 && (
                                <span className="text-ink-500"> · +{formatINR(a.price)}</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <StepHeading headingRef={headingRef} title="Traveller details">
                    We&apos;ll use these to contact you and confirm your booking.
                  </StepHeading>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label="Full name"
                      required
                      name="name"
                      autoComplete="name"
                      value={values.name}
                      onChange={(e) => set('name', e.target.value)}
                      error={errors.name}
                    />
                    <TextField
                      label="WhatsApp number"
                      required
                      name="whatsapp"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      prefix="+91"
                      value={values.whatsapp}
                      onChange={(e) => set('whatsapp', e.target.value)}
                      error={errors.whatsapp}
                    />
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => set('email', e.target.value)}
                      error={errors.email}
                    />
                    <TextField
                      label="City"
                      name="city"
                      autoComplete="address-level2"
                      value={values.city}
                      onChange={(e) => set('city', e.target.value)}
                      error={errors.city}
                    />
                  </div>
                  <TextAreaField
                    label="Special requests"
                    name="specialRequests"
                    rows={3}
                    placeholder="Vegetarian meals, sea-facing room if possible."
                    value={values.specialRequests}
                    onChange={(e) => set('specialRequests', e.target.value)}
                    error={errors.specialRequests}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="flex items-start gap-3 text-body-sm text-ink-700">
                      <input
                        type="checkbox"
                        name="consent"
                        className="mt-1 h-5 w-5 shrink-0 accent-ocean-700"
                        checked={values.consent}
                        aria-invalid={errors.consent ? true : undefined}
                        aria-describedby={errors.consent ? 'consent-error' : undefined}
                        onChange={(e) => set('consent', e.target.checked)}
                      />
                      <span>
                        I agree to receive booking updates on WhatsApp and accept the{' '}
                        <Link href="/terms" className="text-ocean-700 underline" target="_blank">
                          Terms &amp; Conditions
                        </Link>
                        .
                      </span>
                    </label>
                    {errors.consent && (
                      <span id="consent-error" className="gt-field__error">
                        {errors.consent}
                      </span>
                    )}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <StepHeading headingRef={headingRef} title="Review your request">
                    Check everything before we send it to our team on WhatsApp.
                  </StepHeading>
                  <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                    <Review
                      label="Package"
                      value={`${pkg.title} · ${pkg.duration}`}
                      onEdit={() => go(1)}
                    />
                    <Review
                      label="Travel date"
                      value={`${formatTripDate(values.travelDate)}${values.departureCity ? ` · from ${values.departureCity}` : ''}`}
                      onEdit={() => go(1)}
                    />
                    <Review label="Travellers" value={travellers} onEdit={() => go(1)} />
                    <Review label="Hotel" value={hotelLabel} onEdit={() => go(1)} />
                    <Review
                      label="Lead traveller"
                      value={`${values.name} · ${formatIndianMobile(values.whatsapp)}`}
                      onEdit={() => go(2)}
                    />
                    {values.addOns.length > 0 && (
                      <Review
                        label="Add-ons"
                        value={values.addOns.join(', ')}
                        onEdit={() => go(1)}
                      />
                    )}
                    {values.specialRequests && (
                      <Review
                        label="Special requests"
                        value={values.specialRequests}
                        onEdit={() => go(2)}
                      />
                    )}
                  </dl>
                  <div className="flex gap-3 rounded-lg bg-ocean-50 p-4 text-body-sm text-ink-700">
                    <Icon name="whatsapp" size={20} />
                    <p className="m-0">
                      <b className="text-ink-900">How confirmation works.</b> Your request is sent
                      instantly to Go Travels on WhatsApp, and you&apos;ll get a copy too. Our
                      expert confirms availability and shares payment details — nothing is charged
                      on this website.
                    </p>
                  </div>
                </>
              )}

              {formError && (
                <p
                  role="alert"
                  className="m-0 rounded-md bg-danger-50 px-4 py-3 text-body-sm text-danger-700"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-200 pt-5">
                {step > 1 ? (
                  <button
                    type="button"
                    className="gt-btn gt-btn--ghost"
                    onClick={() => window.history.back()}
                  >
                    <Icon name="back" size={18} />
                    Back
                  </button>
                ) : (
                  <Link href={`/packages/${pkg.slug}`} className="gt-btn gt-btn--ghost">
                    <Icon name="back" size={18} />
                    Back to package
                  </Link>
                )}
                <button
                  type="submit"
                  className={`gt-btn gt-btn--lg ${step === 3 ? 'gt-btn--whatsapp' : 'gt-btn--primary'}`}
                  disabled={pending}
                >
                  {step === 3 && <Icon name="whatsapp" size={18} />}
                  {pending
                    ? 'Sending to WhatsApp…'
                    : step === 3
                      ? 'Send Booking via WhatsApp'
                      : 'Continue'}
                  {step < 3 && <Icon name="chevronRight" size={18} />}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside
          aria-label="Trip summary"
          className="overflow-hidden rounded-xl border border-line-200 bg-surface lg:sticky lg:top-24"
        >
          {pkg.image && (
            // eslint-disable-next-line @next/next/no-img-element -- CMS image with focal point
            <img
              src={pkg.image.src}
              alt={pkg.image.alt}
              className="aspect-[16/9] w-full object-cover"
              style={{ objectPosition: pkg.image.position }}
            />
          )}
          <div className="flex flex-col gap-3 p-5">
            {pkg.place && <span className="eyebrow">{pkg.place}</span>}
            <h2 className="m-0 font-display text-[18px] leading-snug font-semibold">{pkg.title}</h2>
            <dl className="m-0 flex flex-col gap-2 text-body-sm">
              <SummaryRow label="Duration" value={pkg.duration} />
              <SummaryRow label="Travellers" value={travellers} />
              <SummaryRow label="Hotel" value={hotelLabel} />
              {values.travelDate && (
                <SummaryRow label="Date" value={formatTripDate(values.travelDate)} />
              )}
            </dl>
            <div className="flex items-end justify-between border-t border-line-200 pt-3">
              <span className="text-body-sm text-ink-500">Estimated total</span>
              <span className="font-display text-[24px] font-bold text-ink-900" aria-live="polite">
                {quote ? formatINR(quote.total) : '—'}
              </span>
            </div>
            <p className="m-0 text-caption text-ink-500">
              Final price confirmed by our expert on WhatsApp. Taxes as applicable.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function StepHeading({
  title,
  children,
  headingRef,
}: {
  title: string
  children: ReactNode
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  return (
    <div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="m-0 font-display text-[26px] font-semibold outline-none"
      >
        {title}
      </h1>
      <p className="mt-1.5 mb-0 text-body text-ink-500">{children}</p>
    </div>
  )
}

function Counter({
  label,
  hint,
  noun,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  hint: string
  noun: string
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line-300 px-3.5 py-3">
      <span>
        <b className="text-[15px]">{label}</b>
        <br />
        <span className="text-caption text-ink-500">{hint}</span>
      </span>
      <span className="flex items-center gap-3">
        <button
          type="button"
          className="gt-counter-btn"
          aria-label={`Remove ${noun}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <output aria-live="polite" aria-label={label} className="min-w-4 text-center font-bold">
          {value}
        </output>
        <button
          type="button"
          className="gt-counter-btn gt-counter-btn--add"
          aria-label={`Add ${noun}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          +
        </button>
      </span>
    </div>
  )
}

function Review({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line-200 pb-3">
      <dt className="flex items-center justify-between text-caption font-semibold text-ink-500 uppercase">
        {label}
        <button
          type="button"
          className="text-caption font-semibold text-ocean-700 normal-case underline"
          onClick={onEdit}
        >
          Edit<span className="sr-only"> {label.toLowerCase()}</span>
        </button>
      </dt>
      <dd className="m-0 text-body text-ink-900">{value}</dd>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-500">{label}</dt>
      <dd className="m-0 text-right font-semibold text-ink-900">{value}</dd>
    </div>
  )
}

const waWith = (href: string | null, text: string) =>
  href ? `${href.split('?')[0]}?text=${encodeURIComponent(text)}` : null

function Sent({
  headingRef,
  requestId,
  phone,
  message,
  contact,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  requestId: string
  phone: string
  message: string
  contact: BookingContact
}) {
  const chat = waWith(
    contact.whatsappHref,
    `Hi Go Travels, I just sent booking request ${requestId}.`,
  )
  const time = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(
    new Date(),
  )
  return (
    <div className="flex flex-col items-start gap-5" role="status">
      <span
        className="flex h-15 w-15 items-center justify-center rounded-pill bg-success-50 text-whatsapp-600"
        aria-hidden="true"
      >
        <Icon name="check" size={30} />
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="m-0 font-display text-[28px] font-semibold outline-none"
      >
        Booking request sent!
      </h1>
      <p className="m-0 text-body-lg text-ink-700">
        Request ID <b className="text-ink-900">{requestId}</b> has been delivered to our team on
        WhatsApp. An expert will reply on {formatIndianMobile(phone)} shortly.
      </p>
      {message && (
        <div className="flex w-full max-w-[460px] flex-col gap-2">
          <span className="text-caption font-semibold text-ink-500 uppercase">
            Message received on Go Travels WhatsApp
          </span>
          <WhatsAppMessage text={message} time={time} />
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {chat && (
          <a href={chat} target="_blank" rel="noreferrer" className="gt-btn gt-btn--whatsapp">
            <Icon name="whatsapp" size={18} />
            Open WhatsApp chat
          </a>
        )}
        <Link href="/" className="gt-btn gt-btn--outline">
          Back to home
        </Link>
      </div>
    </div>
  )
}

function Failed({
  headingRef,
  requestId,
  contact,
  pending,
  onRetry,
  error,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>
  requestId: string
  contact: BookingContact
  pending: boolean
  onRetry: () => void
  error: string | null
}) {
  const chat = waWith(
    contact.whatsappHref,
    `Hi Go Travels, my booking request ${requestId} didn't go through. Can you help?`,
  )
  return (
    <div className="flex flex-col items-start gap-5" role="alert">
      <span
        className="flex h-15 w-15 items-center justify-center rounded-pill bg-danger-50 font-display text-[28px] font-bold text-danger-700"
        aria-hidden="true"
      >
        !
      </span>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="m-0 font-display text-[28px] font-semibold outline-none"
      >
        We couldn&apos;t send your request just now
      </h1>
      <p className="m-0 text-body-lg text-ink-700">
        Don&apos;t worry — your details are saved (ID <b className="text-ink-900">{requestId}</b>).
        Try again, or reach us directly and quote this ID.
      </p>
      {error && <p className="m-0 text-body-sm text-danger-700">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="gt-btn gt-btn--primary"
          onClick={onRetry}
          disabled={pending}
        >
          {pending ? 'Sending to WhatsApp…' : 'Try again'}
        </button>
        {chat && (
          <a href={chat} target="_blank" rel="noreferrer" className="gt-btn gt-btn--wa-outline">
            <Icon name="whatsapp" size={18} />
            Open WhatsApp chat
          </a>
        )}
        {contact.phoneHref && (
          <a href={contact.phoneHref} className="gt-btn gt-btn--outline">
            <Icon name="phone" size={18} />
            Call us
          </a>
        )}
      </div>
    </div>
  )
}
