import { randomBytes } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { startingPrice } from '@/lib/catalog'
import { decryptSecret, encryptSecret, isEncryptedSecret } from '@/lib/crypto'
import { block, h2, richText } from '@/lib/lexical'
import { formatRequestId, isRequestId } from '@/lib/request-id'

const key = randomBytes(32).toString('hex')

describe('secret encryption', () => {
  it('round-trips and never stores the plain value', () => {
    const enc = encryptSecret('gupshup-api-key-1234', key)
    expect(enc).not.toContain('gupshup')
    expect(isEncryptedSecret(enc)).toBe(true)
    expect(decryptSecret(enc, key)).toBe('gupshup-api-key-1234')
  })

  it('uses a fresh IV each time', () => {
    expect(encryptSecret('same', key)).not.toBe(encryptSecret('same', key))
  })

  it('rejects tampered data and wrong keys', () => {
    const enc = encryptSecret('secret', key)
    const parts = enc.split(':')
    parts[3] = Buffer.from('tampered').toString('base64')
    expect(() => decryptSecret(parts.join(':'), key)).toThrow()
    expect(() => decryptSecret(enc, randomBytes(32).toString('hex'))).toThrow()
  })

  it('requires a 32-byte hex key', () => {
    expect(() => encryptSecret('x', 'short')).toThrow(/WHATSAPP_ENC_KEY/)
    expect(() => encryptSecret('x', '')).toThrow(/WHATSAPP_ENC_KEY/)
  })
})

describe('request IDs', () => {
  it('formats and recognises GT-/EQ- IDs', () => {
    expect(formatRequestId('GT', 24871)).toBe('GT-24871')
    expect(isRequestId('booking', 'GT-24871')).toBe(true)
    expect(isRequestId('booking', 'EQ-1093')).toBe(false)
    expect(isRequestId('enquiry', 'EQ-1093')).toBe(true)
  })
})

describe('startingPrice', () => {
  it('is the lowest positive hotel price', () => {
    expect(startingPrice([{ price: 16999 }, { price: 12499 }, { price: 24999 }])).toBe(12499)
    expect(startingPrice([{ price: 0 }, { price: null }])).toBeNull()
    expect(startingPrice(undefined)).toBeNull()
  })
})

describe('rich text builder', () => {
  it('builds Lexical paragraphs, headings, bold text and blocks', () => {
    const doc = richText('Plain **bold** text', h2('Day 1'), block('packageCard', { package: 5 }))
    const [para, heading, card] = doc.root.children
    expect(para.type).toBe('paragraph')
    expect('children' in para && para.children.map((c) => ('format' in c ? c.format : -1))).toEqual(
      [0, 1, 0],
    )
    expect(heading).toMatchObject({ type: 'heading', tag: 'h2' })
    expect(card).toMatchObject({ type: 'block', fields: { blockType: 'packageCard', package: 5 } })
  })
})
