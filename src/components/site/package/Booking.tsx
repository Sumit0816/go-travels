'use client'

/**
 * Package page trip builder: the hotel cards, the sticky price sidebar and the phone's bottom
 * bar share one state, so picking "Luxury 5★" anywhere updates the estimate everywhere.
 * The "Book This Tour" link carries the choices to the booking form (Phase 5).
 */
import Link from 'next/link'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { Icon } from '@/components/ui/Icon'
import { formatINR, formatTravellers } from '@/lib/format'
import { defaultHotel, estimateTotal } from '@/lib/pricing'

export type HotelChoice = {
  category: string
  label: string
  price: number
  strikePrice?: number | null
  hotelName?: string | null
  isPopular?: boolean | null
}

type State = {
  hotels: HotelChoice[]
  hotel: HotelChoice | undefined
  setHotel: (category: string) => void
  adults: number
  setAdults: (n: number) => void
  children: number
  setChildren: (n: number) => void
  date: string
  setDate: (d: string) => void
  total: number
  bookHref: string
  whatsappHref: string | null
}

const Ctx = createContext<State | null>(null)
const useBooking = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useBooking must be used inside <BookingProvider>')
  return c
}

export function BookingProvider({
  slug,
  hotels,
  childPercent,
  whatsappHref,
  children: content,
}: {
  slug: string
  hotels: HotelChoice[]
  childPercent: number | null | undefined
  whatsappHref: string | null
  children: ReactNode
}) {
  const [category, setHotel] = useState(defaultHotel(hotels)?.category ?? '')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)
  const [date, setDate] = useState('')

  const value = useMemo<State>(() => {
    const hotel = hotels.find((h) => h.category === category) ?? hotels[0]
    const total = hotel
      ? estimateTotal({ adultPrice: hotel.price, adults, children, childPercent })
      : 0
    const sp = new URLSearchParams({ adults: String(adults), children: String(children) })
    if (hotel) sp.set('hotel', hotel.category)
    if (date) sp.set('date', date)
    return {
      hotels,
      hotel,
      setHotel,
      adults,
      setAdults,
      children,
      setChildren,
      date,
      setDate,
      total,
      bookHref: `/packages/${slug}/book?${sp.toString()}`,
      whatsappHref,
    }
  }, [hotels, category, adults, children, date, childPercent, slug, whatsappHref])

  return <Ctx.Provider value={value}>{content}</Ctx.Provider>
}

/** "Choose your hotel category" cards (radio group). */
export function HotelPicker() {
  const { hotels, hotel, setHotel } = useBooking()
  return (
    <fieldset className="m-0 grid gap-3 border-0 p-0 md:grid-cols-3">
      <legend className="sr-only">Hotel category</legend>
      {hotels.map((h) => {
        const on = hotel?.category === h.category
        return (
          <label key={h.category} className={`gt-hotel ${on ? 'gt-hotel--on' : ''}`}>
            <input
              type="radio"
              name="hotel-category"
              value={h.category}
              checked={on}
              onChange={() => setHotel(h.category)}
              className="sr-only"
            />
            <span className="flex items-center justify-between gap-2">
              <b>{h.label}</b>
              {h.isPopular && <span className="gt-badge gt-badge--accent">Popular</span>}
            </span>
            <span className="font-display text-price">{formatINR(h.price)}</span>
            {h.hotelName && <span className="text-body-sm text-ink-500">{h.hotelName}</span>}
          </label>
        )
      })}
    </fieldset>
  )
}

const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10)

/** Sticky sidebar: price, date, travellers, hotel, estimate, Book / Ask on WhatsApp. */
export function BookingCard({
  fromPrice,
  strikePrice,
}: {
  fromPrice: number
  strikePrice?: number | null
}) {
  const b = useBooking()
  return (
    <div className="gt-booking-card">
      <div>
        <span className="text-caption text-ink-500">Starting from</span>
        <p className="m-0 flex items-baseline gap-2">
          <b className="font-display text-[28px]">{formatINR(fromPrice)}</b>
          {strikePrice && strikePrice > fromPrice && (
            <s className="text-body-sm text-ink-500" aria-label={`Was ${formatINR(strikePrice)}`}>
              {formatINR(strikePrice)}
            </s>
          )}
        </p>
        <span className="text-caption text-ink-500">per person on twin sharing</span>
      </div>

      <label className="gt-field">
        Travel date
        <input
          type="date"
          className="gt-input"
          min={today()}
          value={b.date}
          onChange={(e) => b.setDate(e.target.value)}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="gt-field">
          Adults
          <select
            className="gt-input"
            value={b.adults}
            onChange={(e) => b.setAdults(Number(e.target.value))}
          >
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="gt-field">
          Children
          <select
            className="gt-input"
            value={b.children}
            onChange={(e) => b.setChildren(Number(e.target.value))}
          >
            {Array.from({ length: 7 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {b.hotels.length > 1 && (
        <label className="gt-field">
          Hotel category
          <select
            className="gt-input"
            value={b.hotel?.category}
            onChange={(e) => b.setHotel(e.target.value)}
          >
            {b.hotels.map((h) => (
              <option key={h.category} value={h.category}>
                {h.label} · {formatINR(h.price)}
              </option>
            ))}
          </select>
        </label>
      )}

      <div
        className="flex items-center justify-between rounded-md bg-sand-100 px-4 py-3"
        aria-live="polite"
      >
        <span className="text-body-sm">
          Estimated total
          <br />
          <span className="text-caption text-ink-500">
            {formatTravellers(b.adults, b.children)}
          </span>
        </span>
        <b className="font-display text-[22px]">{formatINR(b.total)}</b>
      </div>

      <Link href={b.bookHref} className="gt-btn gt-btn--primary gt-btn--lg gt-btn--block">
        Book This Tour
      </Link>
      {b.whatsappHref && (
        <a
          href={b.whatsappHref}
          className="gt-btn gt-btn--outline gt-btn--block gt-btn--wa-outline"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="whatsapp" size={18} />
          Ask on WhatsApp
        </a>
      )}
      <p className="m-0 text-center text-caption text-ink-500">
        No payment now. We confirm availability on WhatsApp within working hours.
      </p>
    </div>
  )
}

/** Phone bottom bar (design: Mobile · Package detail). Replaces the site-wide action bar here. */
export function MobileBookingBar() {
  const b = useBooking()
  return (
    <div className="gt-package-bar md:hidden">
      <span className="flex flex-1 flex-col">
        <span className="text-[11px] text-ink-500">{b.hotel?.label ?? 'From'} / person</span>
        <b className="font-display text-[20px]">{formatINR(b.hotel?.price ?? 0)}</b>
      </span>
      {b.whatsappHref && (
        <a
          href={b.whatsappHref}
          className="gt-btn gt-btn--outline gt-btn--icon gt-btn--wa-outline"
          aria-label="Ask on WhatsApp"
          target="_blank"
          rel="noreferrer"
        >
          <Icon name="whatsapp" />
        </a>
      )}
      <Link href={b.bookHref} className="gt-btn gt-btn--primary">
        Book Now
      </Link>
    </div>
  )
}
