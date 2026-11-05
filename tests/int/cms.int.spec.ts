// @vitest-environment node
/**
 * CMS behaviour against a real database (npm run test:int). Creates its own users and
 * documents and removes them afterwards, so it works on an empty or a seeded database.
 */
import { randomUUID } from 'node:crypto'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { decryptSecret } from '@/lib/crypto'
import type { User } from '@/payload-types'

let payload: Payload
const tag = randomUUID().slice(0, 8)
const users: Record<string, User> = {}
const cleanup: {
  collection: 'bookings' | 'enquiries' | 'packages' | 'destinations' | 'categories' | 'users'
  id: number
}[] = []

const asUser = (role: string) => ({ user: users[role], overrideAccess: false })

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  for (const role of ['owner', 'manager', 'sales', 'contentEditor'] as const) {
    const u = await payload.create({
      collection: 'users',
      data: {
        name: `Test ${role}`,
        email: `int-${role}-${tag}@example.test`,
        password: `pw-${randomUUID()}`,
        role,
        whatsappAlerts: 'no',
        status: 'active',
      },
    })
    users[role] = { ...u, collection: 'users' }
    cleanup.push({ collection: 'users', id: u.id })
  }
})

afterAll(async () => {
  for (const { collection, id } of cleanup.reverse()) {
    await payload.delete({ collection, id, context: { disableRevalidate: true } }).catch(() => {})
  }
})

const newBooking = () =>
  payload.create({
    collection: 'bookings',
    data: {
      name: 'Int Test',
      status: 'new',
      whatsapp: '+91 98301 22457',
      travelDate: new Date().toISOString(),
      adults: 2,
    },
  })

describe('bookings', () => {
  it('get sequential GT- request IDs and a normalised WhatsApp number', async () => {
    const a = await newBooking()
    const b = await newBooking()
    cleanup.push({ collection: 'bookings', id: a.id }, { collection: 'bookings', id: b.id })
    expect(a.requestId).toMatch(/^GT-\d+$/)
    expect(Number(b.requestId!.slice(3))).toBe(Number(a.requestId!.slice(3)) + 1)
    expect(a.whatsapp).toBe('9830122457')
  })

  it('let Sales change the status but not the traveller details', async () => {
    const b = await newBooking()
    cleanup.push({ collection: 'bookings', id: b.id })
    const updated = await payload.update({
      collection: 'bookings',
      id: b.id,
      data: { status: 'contacted', name: 'Changed by sales' },
      ...asUser('sales'),
    })
    expect(updated.status).toBe('contacted')
    expect(updated.name).toBe('Int Test')
  })

  it('are hidden from Content Editors', async () => {
    await expect(
      payload.find({ collection: 'bookings', ...asUser('contentEditor') }),
    ).rejects.toThrow()
  })

  it('cannot be created by Sales', async () => {
    await expect(
      payload.create({
        collection: 'bookings',
        data: {
          name: 'x',
          status: 'new',
          whatsapp: '9830122457',
          travelDate: new Date().toISOString(),
          adults: 1,
        },
        ...asUser('sales'),
      }),
    ).rejects.toThrow()
  })
})

describe('enquiries', () => {
  it('show Sales only the ones assigned to them', async () => {
    const mine = await payload.create({
      collection: 'enquiries',
      data: {
        name: 'Mine',
        status: 'new',
        whatsapp: '9835144120',
        source: 'tripFinder',
        assignedTo: users.sales.id,
      },
    })
    const other = await payload.create({
      collection: 'enquiries',
      data: { name: 'Other', whatsapp: '9835144121', source: 'tripFinder', status: 'new' },
    })
    cleanup.push(
      { collection: 'enquiries', id: mine.id },
      { collection: 'enquiries', id: other.id },
    )
    expect(mine.enquiryId).toMatch(/^EQ-\d+$/)

    const { docs } = await payload.find({ collection: 'enquiries', limit: 500, ...asUser('sales') })
    const ids = docs.map((d) => d.id)
    expect(ids).toContain(mine.id)
    expect(ids).not.toContain(other.id)
  })
})

describe('packages', () => {
  it('show visitors only published packages and compute the starting price', async () => {
    const destination = await payload.create({
      collection: 'destinations',
      data: { name: `Int Dest ${tag}`, slug: `int-dest-${tag}`, generateSlug: false },
      context: { disableRevalidate: true },
    })
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Int Cat ${tag}`, slug: `int-cat-${tag}`, generateSlug: false },
      context: { disableRevalidate: true },
    })
    cleanup.push(
      { collection: 'destinations', id: destination.id },
      { collection: 'categories', id: category.id },
    )

    const make = (status: 'draft' | 'published', n: number) =>
      payload.create({
        collection: 'packages',
        data: {
          title: `Int ${status} ${tag}`,
          slug: `int-${status}-${tag}`,
          generateSlug: false,
          tourCode: `INT-${tag}-${n}`,
          destination: destination.id,
          categories: [category.id],
          durationNights: 3,
          hotelOptions: [
            { category: 'deluxe4', price: 16999 },
            { category: 'standard3', price: 12499 },
          ],
          status,
        },
        context: { disableRevalidate: true },
      })
    const published = await make('published', 1)
    const draft = await make('draft', 2)
    cleanup.push(
      { collection: 'packages', id: published.id },
      { collection: 'packages', id: draft.id },
    )

    expect(published.startingPrice).toBe(12499)
    expect(published.durationDays).toBe(4)

    const { docs } = await payload.find({
      collection: 'packages',
      where: { destination: { equals: destination.id } },
      overrideAccess: false,
    })
    expect(docs.map((d) => d.id)).toEqual([published.id])

    // Sales can view packages but not edit them.
    await expect(
      payload.update({
        collection: 'packages',
        id: published.id,
        data: { title: 'x' },
        ...asUser('sales'),
      }),
    ).rejects.toThrow()
  })
})

describe('WhatsApp settings', () => {
  it('encrypt the API key and never return it', async () => {
    const before = await payload.findGlobal({ slug: 'whatsappSettings' })

    await payload.updateGlobal({
      slug: 'whatsappSettings',
      data: { apiKey: 'live-test-key-9876' },
      ...asUser('owner'),
    })
    const read = await payload.findGlobal({ slug: 'whatsappSettings', ...asUser('owner') })
    expect(read.apiKey).toBeUndefined()
    expect(read.apiKeyHint).toBe('•••• 9876')

    // The stored value is ciphertext that decrypts to the key.
    const raw = await payload.findGlobal({
      slug: 'whatsappSettings',
      overrideAccess: true,
      showHiddenFields: true,
    })
    const stored = (raw as { apiKey?: string }).apiKey
    if (stored !== undefined) {
      expect(stored).not.toContain('live-test-key')
      expect(decryptSecret(stored)).toBe('live-test-key-9876')
    }

    // Saving other fields keeps the key.
    await payload.updateGlobal({
      slug: 'whatsappSettings',
      data: { senderNumber: '+91 90000 00000' },
      ...asUser('owner'),
    })
    const again = await payload.findGlobal({ slug: 'whatsappSettings', ...asUser('owner') })
    expect(again.apiKeyHint).toBe('•••• 9876')

    // Managers can view but not change it; Sales can't see it at all.
    await expect(
      payload.updateGlobal({
        slug: 'whatsappSettings',
        data: { senderNumber: 'x' },
        ...asUser('manager'),
      }),
    ).rejects.toThrow()
    await expect(
      payload.findGlobal({ slug: 'whatsappSettings', ...asUser('sales') }),
    ).rejects.toThrow()

    await payload.updateGlobal({
      slug: 'whatsappSettings',
      data: { senderNumber: before.senderNumber, apiKeyHint: before.apiKeyHint },
    })
  })
})

describe('users', () => {
  it('only let the Owner change roles', async () => {
    const updated = await payload.update({
      collection: 'users',
      id: users.manager.id,
      data: { role: 'owner' },
      ...asUser('manager'),
    })
    expect(updated.role).toBe('manager')

    const byOwner = await payload.update({
      collection: 'users',
      id: users.contentEditor.id,
      data: { role: 'sales' },
      ...asUser('owner'),
    })
    expect(byOwner.role).toBe('sales')
  })

  it('let staff see only their own profile', async () => {
    const { docs } = await payload.find({ collection: 'users', ...asUser('sales') })
    expect(docs.map((d) => d.id)).toEqual([users.sales.id])
  })
})
