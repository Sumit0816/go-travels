import type { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  adminAccess,
  assignedAccess,
  canRead,
  canWrite,
  fullWriteOnly,
  MODULES,
  PERMISSIONS,
  permissionFor,
  publicContentAccess,
  ROLES,
  type Role,
} from '@/access'

const req = (role?: Role, id = 7) => ({
  req: { user: role ? { id, role } : null } as unknown as PayloadRequest,
})

describe('permission matrix (CMS "Users & Roles" design)', () => {
  // Row for row from the design: Owner, Manager, Sales, Content Editor.
  const expected: Record<string, [string, string, string, string]> = {
    bookings: ['full', 'full', 'editStatus', 'none'],
    enquiries: ['full', 'full', 'assigned', 'none'],
    packages: ['full', 'full', 'view', 'full'],
    homepage: ['full', 'full', 'none', 'full'],
    content: ['full', 'full', 'none', 'full'],
    testimonials: ['full', 'full', 'view', 'full'],
    whatsapp: ['full', 'view', 'none', 'none'],
    settings: ['full', 'none', 'none', 'none'],
  }

  for (const mod of MODULES) {
    it(`${mod}`, () => {
      expect(ROLES.map((r) => PERMISSIONS[mod][r])).toEqual(expected[mod])
    })
  }

  it('gives unknown or missing roles no access', () => {
    expect(permissionFor('packages', undefined)).toBe('none')
    expect(permissionFor('packages', 'admin')).toBe('none')
    expect(canRead('settings', 'manager')).toBe(false)
    expect(canWrite('whatsapp', 'manager')).toBe(false)
  })
})

describe('collection access functions', () => {
  it('bookings: sales can read and update (status only), not create or delete', () => {
    const a = adminAccess('bookings')
    expect(a.read(req('sales'))).toBe(true)
    expect(a.update(req('sales'))).toBe(true)
    expect(a.create(req('sales'))).toBe(false)
    expect(a.delete(req('sales'))).toBe(false)
    expect(a.read(req('contentEditor'))).toBe(false)
    expect(a.read(req())).toBe(false)
  })

  it('bookings: only full roles may change non-workflow fields', () => {
    const guard = fullWriteOnly('bookings')
    expect(guard(req('manager') as never)).toBe(true)
    expect(guard(req('sales') as never)).toBe(false)
  })

  it('enquiries: sales see only enquiries assigned to them', () => {
    const a = assignedAccess('enquiries')
    expect(a.read(req('sales', 42))).toEqual({ assignedTo: { equals: 42 } })
    expect(a.update(req('sales', 42))).toEqual({ assignedTo: { equals: 42 } })
    expect(a.read(req('manager'))).toBe(true)
    expect(a.read(req('contentEditor'))).toBe(false)
  })

  it('public content: visitors get the public filter, staff see everything', () => {
    const where = { status: { equals: 'published' } }
    const a = publicContentAccess('packages', where)
    expect(a.read(req())).toEqual(where)
    expect(a.read(req('sales'))).toBe(true)
    expect(a.create(req('sales'))).toBe(false)
    expect(a.create(req('contentEditor'))).toBe(true)
  })

  it('public content: filters can be computed per request', () => {
    let calls = 0
    const a = publicContentAccess('content', () => {
      calls++
      return { status: { equals: 'published' } }
    })
    a.read(req())
    a.read(req())
    expect(calls).toBe(2)
    // Sales have no access to blog content, so they get the public view too.
    expect(a.read(req('sales'))).toEqual({ status: { equals: 'published' } })
  })
})
