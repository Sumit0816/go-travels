'use client'

/**
 * Interactive controls used by the custom CMS screens. They call Payload's REST API with the
 * signed-in session cookie, so every change goes through the same access rules as the
 * standard admin.
 */
import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = body?.errors?.[0]?.message ?? body?.error ?? `Request failed (${res.status})`
    throw new Error(message)
  }
  return body
}

function useAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (fn: () => Promise<unknown>, after?: (result: unknown) => void) => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await fn()
        if (after) after(result)
        else router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }
  return { pending, error, run, router }
}

type Option = { label: string; value: string; colour?: string }

/** Inline select that PATCHes one field on a document (booking status, enquiry assignee …). */
export function FieldSelect({
  collection,
  id,
  field,
  value,
  options,
  label,
  disabled,
  allowEmpty,
}: {
  collection: string
  id: number
  field: string
  value: string | number | null
  options: Option[]
  label: string
  disabled?: boolean
  allowEmpty?: string
}) {
  const { pending, error, run } = useAction()
  const [current, setCurrent] = useState(value == null ? '' : String(value))
  const colour = options.find((o) => o.value === current)?.colour
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <select
        className="gta-select"
        aria-label={label}
        value={current}
        disabled={disabled || pending}
        style={colour ? { borderLeftColor: colour } : undefined}
        onChange={(e) => {
          const next = e.target.value
          const previous = current
          setCurrent(next)
          run(async () => {
            try {
              const parsed = next === '' ? null : /^\d+$/.test(next) ? Number(next) : next
              await api(`/${collection}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ [field]: parsed }),
              })
            } catch (err) {
              setCurrent(previous)
              throw err
            }
          })
        }}
      >
        {allowEmpty !== undefined && <option value="">{allowEmpty}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="gta-error">
          {error}
        </span>
      )}
    </span>
  )
}

/** POSTs to a custom endpoint, then refreshes (or redirects to the URL the result names). */
export function ActionButton({
  path,
  label,
  pendingLabel,
  variant,
  confirmText,
  redirectTo,
}: {
  path: string
  label: string
  pendingLabel?: string
  variant?: 'primary' | 'whatsapp'
  confirmText?: string
  /** Template like `/admin/collections/bookings/{bookingId}`, filled from the JSON result. */
  redirectTo?: string
}) {
  const { pending, error, run, router } = useAction()
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        className={`gta-btn gta-btn--sm${variant ? ` gta-btn--${variant}` : ''}`}
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return
          run(
            () => api(path, { method: 'POST', body: '{}' }),
            redirectTo
              ? (result) => {
                  const r = result as Record<string, unknown>
                  router.push(redirectTo.replace(/\{(\w+)\}/g, (_, k) => String(r[k] ?? '')))
                }
              : undefined,
          )
        }}
      >
        {pending ? (pendingLabel ?? 'Working…') : label}
      </button>
      {error && (
        <span role="alert" className="gta-error">
          {error}
        </span>
      )}
    </span>
  )
}

/** PATCHes a fixed value (e.g. testimonial status → approved). */
export function SetValueButton({
  collection,
  id,
  data,
  label,
  variant,
}: {
  collection: string
  id: number
  data: Record<string, unknown>
  label: string
  variant?: 'primary'
}) {
  const { pending, error, run } = useAction()
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        className={`gta-btn gta-btn--sm${variant ? ` gta-btn--${variant}` : ''}`}
        disabled={pending}
        onClick={() =>
          run(() => api(`/${collection}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }))
        }
      >
        {pending ? 'Saving…' : label}
      </button>
      {error && (
        <span role="alert" className="gta-error">
          {error}
        </span>
      )}
    </span>
  )
}

type Note = { id?: string | null; text: string; author?: number | null; at?: string | null }

/** Adds an internal note, keeping the existing ones. */
export function NoteForm({
  collection,
  id,
  notes,
}: {
  collection: 'enquiries' | 'bookings'
  id: number
  notes: Note[]
}) {
  const { pending, error, run } = useAction()
  const [text, setText] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return
    run(async () => {
      await api(`/${collection}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes: [...notes, { text: value }] }),
      })
      setText('')
    })
  }
  return (
    <form onSubmit={submit} className="gta-field">
      <label htmlFor={`note-${id}`}>Add an internal note</label>
      <textarea
        id={`note-${id}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Called, prefers a villa with a private pool. Sending 2 options."
      />
      <span className="gta-row">
        <button
          type="submit"
          className="gta-btn gta-btn--primary gta-btn--sm"
          disabled={pending || !text.trim()}
        >
          {pending ? 'Saving…' : 'Save note'}
        </button>
        {error && (
          <span role="alert" className="gta-error">
            {error}
          </span>
        )}
      </span>
    </form>
  )
}

/**
 * "Send review link on WhatsApp": creates a one-time review link and offers a wa.me message.
 * Phase 5 sends it automatically through the aggregator.
 */
export function ReviewLinkForm({
  siteUrl,
  packages,
}: {
  siteUrl: string
  packages: { id: number; title: string }[]
}) {
  const { pending, error, run } = useAction()
  const [result, setResult] = useState<{ url: string; wa: string } | null>(null)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const phone = String(form.get('phone') ?? '')
      .replace(/\D/g, '')
      .slice(-10)
    const pkg = form.get('package')
    run(
      async () => {
        const res = await api('/reviewLinks', {
          method: 'POST',
          body: JSON.stringify({ name, phone, package: pkg ? Number(pkg) : undefined }),
        })
        return res.doc as { token: string }
      },
      (doc) => {
        const url = `${siteUrl}/review/${(doc as { token: string }).token}`
        const text = `Hi ${name}, thank you for travelling with Go Travels! We'd love your feedback: ${url}`
        setResult({ url, wa: `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` })
      },
    )
  }
  return (
    <form onSubmit={submit} className="gta-detail" aria-labelledby="review-link-title">
      <h2 id="review-link-title">Send review link on WhatsApp</h2>
      <div className="gta-row">
        <label className="gta-field">
          Traveller name*
          <input name="name" required />
        </label>
        <label className="gta-field">
          WhatsApp number*
          <input name="phone" type="tel" inputMode="numeric" required placeholder="98301 22457" />
        </label>
        <label className="gta-field">
          Package
          <select name="package" className="gta-select" defaultValue="">
            <option value="">—</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="gta-btn gta-btn--primary" disabled={pending}>
          {pending ? 'Creating…' : 'Create link'}
        </button>
      </div>
      {error && (
        <span role="alert" className="gta-error">
          {error}
        </span>
      )}
      {result && (
        <div className="gta-row">
          <code style={{ wordBreak: 'break-all' }}>{result.url}</code>
          <a
            className="gta-btn gta-btn--whatsapp gta-btn--sm"
            href={result.wa}
            target="_blank"
            rel="noreferrer"
          >
            Open WhatsApp to send
          </a>
        </div>
      )}
    </form>
  )
}
