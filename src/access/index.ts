import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

import { canRead, canUpdateSome, canWrite, permissionFor, type Module } from './roles'

export * from './roles'

type MaybeUser = { id: number | string; role?: unknown } | null | undefined

const userOf = (req: PayloadRequest): MaybeUser => req.user as MaybeUser

/** Signed-in CMS user with any role. */
export const isSignedIn: Access = ({ req }) => Boolean(userOf(req))

export const isOwner = (req: PayloadRequest): boolean => userOf(req)?.role === 'owner'

/** Admin users only, or nobody. Used for collections the public never touches. */
export function adminAccess(module: Module) {
  return {
    create: (({ req }) => canWrite(module, userOf(req)?.role)) as Access,
    read: (({ req }) => canRead(module, userOf(req)?.role)) as Access,
    update: (({ req }) => canUpdateSome(module, userOf(req)?.role)) as Access,
    delete: (({ req }) => canWrite(module, userOf(req)?.role)) as Access,
  }
}

/**
 * Public content: anyone can read documents matching `publicWhere` (e.g. published only);
 * CMS users with read permission see everything; writes follow the matrix.
 */
export function publicContentAccess(module: Module, publicWhere?: Where | (() => Where)) {
  const base = adminAccess(module)
  return {
    ...base,
    read: (({ req }) => {
      if (canRead(module, userOf(req)?.role)) return true
      if (!publicWhere) return true
      return typeof publicWhere === 'function' ? publicWhere() : publicWhere
    }) as Access,
  }
}

/**
 * Enquiries: Sales see and update only the enquiries assigned to them ("Assigned").
 */
export function assignedAccess(module: Module, assigneeField = 'assignedTo') {
  const base = adminAccess(module)
  const scoped: Access = ({ req }) => {
    const user = userOf(req)
    const p = permissionFor(module, user?.role)
    if (p === 'full' || p === 'view' || p === 'editStatus') return true
    if (p === 'assigned' && user) return { [assigneeField]: { equals: user.id } }
    return false
  }
  return { ...base, read: scoped, update: scoped }
}

/**
 * Field-level update guard for modules where some roles may only change workflow fields
 * (Sales → "Edit status" on bookings, "Assigned" on enquiries). Apply to every field
 * that is NOT a workflow field.
 */
export function fullWriteOnly(module: Module): FieldAccess {
  return ({ req }) => canWrite(module, userOf(req)?.role)
}

/**
 * Hides a collection or global from the admin sidebar for roles with no permission on its
 * module. Needed where public read is allowed (the website reads it) but staff such as Sales
 * shouldn't see it in the CMS.
 */
export function hiddenWithout(module: Module) {
  return ({ user }: { user: unknown }) =>
    !canRead(module, (user as { role?: unknown } | null)?.role)
}

/** Read guard for globals that must be readable by the public site (e.g. site settings). */
export const anyone: Access = () => true

/** Owner-only access, e.g. role changes. */
export const ownerOnlyField: FieldAccess = ({ req }) => isOwner(req)
