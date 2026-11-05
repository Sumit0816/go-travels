import { describe, expect, it } from 'vitest'

import {
  formatDuration,
  formatINR,
  formatIndianMobile,
  formatTravellers,
  isValidIndianMobile,
  normalizeIndianMobile,
  toWhatsAppNumber,
} from '@/lib/format'

describe('formatINR', () => {
  it('uses Indian digit grouping with no decimals', () => {
    expect(formatINR(12499)).toBe('₹12,499')
    expect(formatINR(132497)).toBe('₹1,32,497')
    expect(formatINR(33998)).toBe('₹33,998')
    expect(formatINR(999)).toBe('₹999')
    expect(formatINR(10000000)).toBe('₹1,00,00,000')
  })

  it('rounds and handles negatives and non-numbers', () => {
    expect(formatINR(12499.6)).toBe('₹12,500')
    expect(formatINR(-500)).toBe('-₹500')
    expect(formatINR(Number.NaN)).toBe('₹—')
  })
})

describe('formatDuration', () => {
  it('puts nights first', () => {
    expect(formatDuration(3, 4)).toBe('3N / 4D')
    expect(formatDuration(5)).toBe('5N / 6D')
  })
})

describe('formatTravellers', () => {
  it('pluralises adults and children', () => {
    expect(formatTravellers(1)).toBe('1 Adult')
    expect(formatTravellers(2)).toBe('2 Adults')
    expect(formatTravellers(2, 1)).toBe('2 Adults, 1 Child')
    expect(formatTravellers(2, 2)).toBe('2 Adults, 2 Children')
  })
})

describe('Indian mobile numbers', () => {
  it('accepts 10-digit mobiles with common prefixes', () => {
    expect(normalizeIndianMobile('98301 22457')).toBe('9830122457')
    expect(normalizeIndianMobile('+91 98301-22457')).toBe('9830122457')
    expect(normalizeIndianMobile('919830122457')).toBe('9830122457')
    expect(normalizeIndianMobile('09830122457')).toBe('9830122457')
  })

  it('rejects landlines, short numbers and numbers not starting 6–9', () => {
    expect(isValidIndianMobile('98301')).toBe(false)
    expect(isValidIndianMobile('5830122457')).toBe(false)
    // Delhi landline with STD code. (A 0651… Ranchi landline can't be told apart from a
    // mobile starting with 6 by digits alone, so only the leading-digit rule applies.)
    expect(isValidIndianMobile('011 2345 6789')).toBe(false)
    expect(isValidIndianMobile('')).toBe(false)
  })

  it('formats for display and for the WhatsApp API', () => {
    expect(formatIndianMobile('9830122457')).toBe('+91 98301 22457')
    expect(formatIndianMobile('123')).toBe('123')
    expect(toWhatsAppNumber('+91 98301 22457')).toBe('919830122457')
    expect(toWhatsAppNumber('123')).toBeNull()
  })
})
