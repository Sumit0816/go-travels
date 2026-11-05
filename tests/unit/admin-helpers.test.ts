import { describe, expect, it } from 'vitest'

import {
  csvCell,
  deliveryRate,
  enquiryToBookingData,
  slideState,
  toCsv,
  travelDateFromMonth,
  travellersToPax,
  waMeLink,
} from '@/lib/admin-helpers'
import { bookingsWhere } from '@/endpoints/bookings'

describe('CSV export', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('Goa, North & South')).toBe('"Goa, North & South"')
    expect(csvCell('He said "hi"')).toBe('"He said ""hi"""')
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"')
    expect(csvCell(null)).toBe('')
    expect(csvCell(33998)).toBe('33998')
  })

  it('neutralises spreadsheet formulas (CSV injection)', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"')
    expect(csvCell('+91 98301')).toBe("'+91 98301")
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('builds rows with CRLF line endings', () => {
    expect(toCsv(['A', 'B'], [[1, 'x']])).toBe('A,B\r\n1,x\r\n')
  })
})

describe('enquiry → booking', () => {
  it('maps traveller groups to adults and children', () => {
    expect(travellersToPax('family-2-2')).toEqual({ adults: 2, children: 2 })
    expect(travellersToPax('group-6')).toEqual({ adults: 6, children: 0 })
    expect(travellersToPax('solo')).toEqual({ adults: 1, children: 0 })
    expect(travellersToPax(null)).toEqual({ adults: 2, children: 0 })
  })

  it('uses the first of the travel month, or 30 days ahead', () => {
    const now = new Date('2026-11-05T10:00:00Z')
    expect(travelDateFromMonth('2027-02', now)).toBe('2027-02-01T00:00:00.000Z')
    expect(travelDateFromMonth('Feb', now)).toBe('2026-12-05T10:00:00.000Z')
  })

  it('copies the traveller, package and assignee and links back to the enquiry', () => {
    const data = enquiryToBookingData(
      {
        id: 9,
        name: 'Neha Gupta',
        whatsapp: '9835144120',
        travellers: '2-adults',
        travelMonth: '2027-02',
        destination: 'Bali or Maldives',
        message: 'Private pool please',
        package: { id: 4, title: 'Romantic Bali', durationNights: 5, durationDays: 6 },
        assignedTo: { id: 3 },
      },
      new Date('2026-11-05T00:00:00Z'),
    )
    expect(data).toMatchObject({
      name: 'Neha Gupta',
      whatsapp: '9835144120',
      adults: 2,
      children: 0,
      package: 4,
      packageSnapshot: { title: 'Romantic Bali', duration: '5N / 6D' },
      source: 'enquiry',
      fromEnquiry: 9,
      assignedTo: 3,
      status: 'new',
      travelDate: '2027-02-01T00:00:00.000Z',
    })
    expect(data.specialRequests).toBe('Destination: Bali or Maldives\nPrivate pool please')
  })
})

describe('slide state', () => {
  const now = new Date('2026-11-05T00:00:00Z')
  it('follows the active flag and the show window', () => {
    expect(slideState({ active: false }, now)).toBe('hidden')
    expect(slideState({ active: true }, now)).toBe('live')
    expect(slideState({ active: true, showFrom: '2026-12-01T00:00:00Z' }, now)).toBe('scheduled')
    expect(slideState({ active: true, showUntil: '2026-10-01T00:00:00Z' }, now)).toBe('ended')
  })
})

describe('dashboard helpers', () => {
  it('computes the WhatsApp delivery rate', () => {
    expect(deliveryRate({ delivered: 90, read: 8, total: 100 })).toBe(98)
    expect(deliveryRate({ delivered: 1, read: 0, total: 3 })).toBe(33.3)
    expect(deliveryRate({ delivered: 0, read: 0, total: 0 })).toBeNull()
  })

  it('builds wa.me links with the India code', () => {
    expect(waMeLink('9830122457', 'Hi')).toBe('https://wa.me/919830122457?text=Hi')
  })

  it('filters bookings by status and search, ignoring unknown statuses', () => {
    expect(bookingsWhere('new', null)).toEqual({ and: [{ status: { equals: 'new' } }] })
    expect(bookingsWhere('bogus', '')).toEqual({})
    const where = bookingsWhere(undefined, 'GT-24001') as { and: { or: unknown[] }[] }
    expect(where.and[0].or).toHaveLength(4)
  })
})
