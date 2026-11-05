'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'

import { submitEnquiry, type EnquiryState } from '@/app/(site)/actions'
import { Icon } from '@/components/ui/Icon'
import { SelectField, TextAreaField, TextField } from '@/components/ui/TextField'
import { BUDGETS, TRAVELLER_GROUPS, TRIP_TYPES } from '@/lib/catalog'
import { CONTACT_SUBJECTS } from '@/lib/enquiry'

const initial: EnquiryState = { status: 'idle' }

/** Action state plus "send another": a dismissed success shows a fresh, empty form. */
function useEnquiryForm() {
  const [state, action, pending] = useActionState(submitEnquiry, initial)
  const [dismissed, setDismissed] = useState<EnquiryState | null>(null)
  const [formKey, setFormKey] = useState(0)
  return {
    state: state === dismissed ? initial : state,
    action,
    pending,
    formKey,
    showSuccess: state.status === 'success' && state !== dismissed,
    reset: () => {
      setDismissed(state)
      setFormKey((k) => k + 1)
    },
  }
}

/** Hidden spam trap: bots fill every field; people never see this one. */
function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

function Success({
  state,
  whatsappHref,
  onReset,
}: {
  state: Extract<EnquiryState, { status: 'success' }>
  whatsappHref: string | null
  onReset: () => void
}) {
  const wa = whatsappHref
    ? `${whatsappHref.split('?')[0]}?text=${encodeURIComponent(`Hi Go Travels, this is ${state.name} about my enquiry ${state.enquiryId}.`)}`
    : null
  return (
    <div className="flex flex-col items-start gap-4 py-4" role="status" aria-live="polite">
      <span className="flex h-15 w-15 items-center justify-center rounded-pill bg-success-50 text-whatsapp-600">
        <Icon name="check" size={30} />
      </span>
      <h2 className="heading-3">Enquiry sent!</h2>
      <p className="m-0 text-[16px] leading-relaxed text-ink-700">
        Thanks{state.name ? `, ${state.name}` : ''}! We&apos;ve received your enquiry
        {state.enquiryId && (
          <>
            {' '}
            (ID <b>{state.enquiryId}</b>)
          </>
        )}
        . A travel expert will reply on your WhatsApp number within working hours.
      </p>
      <div className="flex flex-wrap gap-3">
        {wa && (
          <a href={wa} className="gt-btn gt-btn--whatsapp" target="_blank" rel="noreferrer">
            <Icon name="whatsapp" size={18} />
            Open WhatsApp
          </a>
        )}
        <button type="button" className="gt-btn gt-btn--outline" onClick={onReset}>
          Send another enquiry
        </button>
      </div>
    </div>
  )
}

function FormError({ state }: { state: EnquiryState }) {
  if (state.status !== 'error') return null
  return (
    <p role="alert" className="m-0 rounded-md bg-danger-50 px-4 py-3 text-body-sm text-danger-700">
      {state.message}
    </p>
  )
}

/** "Find Your Perfect Trip" (design: EnquiryModal / Mobile · Enquiry form). */
export function TripFinderForm({
  whatsappHref,
  defaults,
}: {
  whatsappHref: string | null
  defaults?: { destination?: string; tripType?: string; packageSlug?: string; month?: string }
}) {
  const { state, action, pending, formKey, showSuccess, reset } = useEnquiryForm()
  const [tripType, setTripType] = useState(defaults?.tripType ?? '')

  if (showSuccess && state.status === 'success') {
    return <Success state={state} whatsappHref={whatsappHref} onReset={reset} />
  }
  const values = state.status === 'error' ? (state.values ?? {}) : {}
  const errors = state.status === 'error' ? (state.errors ?? {}) : {}

  return (
    <form key={formKey} action={action} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="form" value="tripFinder" />
      {defaults?.packageSlug && (
        <input type="hidden" name="packageSlug" value={defaults.packageSlug} />
      )}
      <Honeypot />

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-label">Trip type</legend>
        <div className="flex flex-wrap gap-2">
          {TRIP_TYPES.map((t) => (
            <label key={t.value} className="gt-filters__pill">
              <input
                type="radio"
                name="tripType"
                value={t.value}
                checked={tripType === t.value}
                onChange={() => setTripType(t.value)}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Destination"
          name="destination"
          placeholder="e.g. Kerala, Bali"
          defaultValue={values.destination ?? defaults?.destination}
          error={errors.destination}
        />
        <TextField
          label="Travel month"
          name="travelMonth"
          type="month"
          defaultValue={values.travelMonth ?? defaults?.month}
        />
        <SelectField
          label="Travellers"
          name="travellers"
          defaultValue={values.travellers ?? ''}
          options={[{ label: 'Choose…', value: '' }, ...TRAVELLER_GROUPS]}
        />
        <SelectField
          label="Budget / person"
          name="budget"
          defaultValue={values.budget ?? ''}
          options={[{ label: 'Choose…', value: '' }, ...BUDGETS]}
        />
        <TextField
          label="Your name"
          required
          name="name"
          autoComplete="name"
          defaultValue={values.name}
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
          defaultValue={values.whatsapp}
          error={errors.whatsapp}
        />
      </div>
      <TextAreaField
        label="Anything else?"
        name="message"
        rows={3}
        placeholder="Dates, hotel preferences, special occasions…"
        defaultValue={values.message}
        error={errors.message}
      />

      <FormError state={state} />
      <button type="submit" className="gt-btn gt-btn--primary gt-btn--lg" disabled={pending}>
        {pending ? 'Sending…' : 'Send Enquiry'}
      </button>
      <p className="m-0 text-caption text-ink-500">
        Free and no obligation. By sending, you agree to receive replies on WhatsApp and accept our{' '}
        <Link href="/privacy" className="text-ocean-700 underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}

/** Contact Us form (design: "Desktop · Contact us"). */
export function ContactForm({ whatsappHref }: { whatsappHref: string | null }) {
  const { state, action, pending, formKey, showSuccess, reset } = useEnquiryForm()

  if (showSuccess && state.status === 'success') {
    return <Success state={state} whatsappHref={whatsappHref} onReset={reset} />
  }
  const values = state.status === 'error' ? (state.values ?? {}) : {}
  const errors = state.status === 'error' ? (state.errors ?? {}) : {}

  return (
    <form key={formKey} action={action} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="form" value="contactForm" />
      <Honeypot />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <TextField
          label="Full name"
          required
          name="name"
          autoComplete="name"
          defaultValue={values.name}
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
          defaultValue={values.whatsapp}
          error={errors.whatsapp}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={values.email}
          error={errors.email}
        />
        <SelectField
          label="Subject"
          name="subject"
          defaultValue={values.subject ?? 'tour'}
          options={[...CONTACT_SUBJECTS]}
        />
      </div>
      <TextAreaField
        label="Message"
        required
        name="message"
        rows={5}
        defaultValue={values.message}
        error={errors.message}
      />
      <FormError state={state} />
      <button
        type="submit"
        className="gt-btn gt-btn--primary gt-btn--lg self-start"
        disabled={pending}
      >
        {pending ? 'Sending…' : 'Send Message'}
      </button>
      <p className="m-0 text-caption text-ink-500">
        Messages reach our team in the CMS and on WhatsApp.
      </p>
    </form>
  )
}
