import { describe, expect, it } from 'vitest'

import { childPrice, defaultHotel, estimateTotal } from '@/lib/pricing'
import {
  activeFilterCount,
  buildPackageWhere,
  listingQuery,
  listingSummary,
  parseListingParams,
  sortFor,
} from '@/lib/tours'

describe('listing params', () => {
  it('reads valid filters from the URL', () => {
    const p = parseListingParams({
      q: ' Goa ',
      destination: ['goa', 'dubai'],
      duration: '4-6',
      budget: '50000',
      theme: 'family,beach',
      month: '2027-02',
      sort: 'price-asc',
      page: '2',
    })
    expect(p).toEqual({
      q: 'Goa',
      category: undefined,
      destinations: ['goa', 'dubai'],
      duration: '4-6',
      budget: 50000,
      themes: ['family', 'beach'],
      month: '2027-02',
      sort: 'price-asc',
      page: 2,
    })
  })

  it('drops anything unexpected', () => {
    const p = parseListingParams({
      destination: ['Goa;DROP', 'goa', 'goa'],
      duration: '9-99',
      budget: '-5',
      theme: 'not-a-theme',
      sort: 'random',
      page: 'abc',
      month: 'feb',
      category: '../etc',
    })
    expect(p).toMatchObject({
      destinations: ['goa'],
      duration: undefined,
      budget: undefined,
      themes: [],
      sort: 'popular',
      page: 1,
      month: undefined,
      category: undefined,
    })
  })

  it('takes the category from the route when given', () => {
    expect(parseListingParams({ category: 'mice' }, 'domestic').category).toBe('domestic')
  })
})

describe('listing query', () => {
  const p = parseListingParams({ destination: 'goa', duration: '1-3', theme: 'family', q: 'beach' })

  it('builds the database filter', () => {
    const where = buildPackageWhere(p, { categoryId: 4, destinationIds: [7] }) as { and: unknown[] }
    expect(where.and).toEqual(
      expect.arrayContaining([
        { status: { equals: 'published' } },
        { categories: { contains: 4 } },
        { destination: { in: [7] } },
        { durationNights: { greater_than_equal: 1 } },
        { durationNights: { less_than_equal: 3 } },
        { themes: { in: ['family'] } },
      ]),
    )
    expect(JSON.stringify(where)).toContain('"destination.name":{"like":"beach"}')
  })

  it('sorts popular packages first by default', () => {
    expect(sortFor('popular')).toEqual(['-showInPopular', 'startingPrice'])
    expect(sortFor('price-desc')[0]).toBe('-startingPrice')
  })

  it('summarises and counts active filters', () => {
    expect(listingSummary(p, { goa: 'Goa' })).toBe('Goa · 1–3 nights · Family · “beach”')
    expect(activeFilterCount(p)).toBe(4)
  })

  it('builds links that change one filter and reset the page', () => {
    const paged = { ...p, page: 3 }
    expect(listingQuery(paged, { destinations: [] })).toBe('?q=beach&duration=1-3&theme=family')
    expect(listingQuery(paged, { page: 4 })).toContain('page=4')
    expect(listingQuery(parseListingParams({}))).toBe('')
  })
})

describe('pricing', () => {
  it('estimates adults plus children at the child percentage', () => {
    expect(estimateTotal({ adultPrice: 16999, adults: 2 })).toBe(33998)
    expect(estimateTotal({ adultPrice: 12499, adults: 2, children: 1, childPercent: 50 })).toBe(
      24998 + 6250,
    )
    expect(childPrice(12499, 0)).toBe(0)
    expect(childPrice(12499, 150)).toBe(12499)
    expect(estimateTotal({ adultPrice: 0, adults: 2 })).toBe(0)
  })

  it('preselects the popular hotel, else the cheapest', () => {
    expect(
      defaultHotel([
        { category: 'a', price: 2 },
        { category: 'b', price: 3, isPopular: true },
      ])?.category,
    ).toBe('b')
    expect(
      defaultHotel([
        { category: 'a', price: 5 },
        { category: 'b', price: 3 },
      ])?.category,
    ).toBe('b')
  })
})
