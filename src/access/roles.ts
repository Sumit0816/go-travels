/**
 * CMS roles and the permission matrix from the design's "Users & Roles" screen.
 *
 * | Module                | Owner | Manager | Sales       | Content Editor |
 * | --------------------- | ----- | ------- | ----------- | -------------- |
 * | Bookings              | Full  | Full    | Edit status | None           |
 * | Enquiries             | Full  | Full    | Assigned    | None           |
 * | Packages              | Full  | Full    | View        | Full           |
 * | Homepage & slider     | Full  | Full    | None        | Full           |
 * | Blogs & pages         | Full  | Full    | None        | Full           |
 * | Testimonials          | Full  | Full    | View        | Full           |
 * | WhatsApp integration  | Full  | View    | None        | None           |
 * | Users & site settings | Full  | None    | None        | None           |
 *
 * Destinations, categories and media follow Packages (they are package content).
 */

export const ROLES = ['owner', 'manager', 'sales', 'contentEditor'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  manager: 'Manager',
  sales: 'Sales',
  contentEditor: 'Content Editor',
}

/**
 * full        create, read, update, delete
 * view        read only
 * editStatus  read, and update only the workflow fields (status, notes, assignee)
 * assigned    read and update only documents assigned to the user
 * none        no access
 */
export type Permission = 'full' | 'view' | 'editStatus' | 'assigned' | 'none'

export const MODULES = [
  'bookings',
  'enquiries',
  'packages',
  'homepage',
  'content',
  'testimonials',
  'whatsapp',
  'settings',
] as const
export type Module = (typeof MODULES)[number]

export const MODULE_LABELS: Record<Module, string> = {
  bookings: 'Bookings',
  enquiries: 'Enquiries',
  packages: 'Packages',
  homepage: 'Homepage & slider',
  content: 'Blogs & pages',
  testimonials: 'Testimonials',
  whatsapp: 'WhatsApp integration',
  settings: 'Users & site settings',
}

export const PERMISSIONS: Record<Module, Record<Role, Permission>> = {
  bookings: { owner: 'full', manager: 'full', sales: 'editStatus', contentEditor: 'none' },
  enquiries: { owner: 'full', manager: 'full', sales: 'assigned', contentEditor: 'none' },
  packages: { owner: 'full', manager: 'full', sales: 'view', contentEditor: 'full' },
  homepage: { owner: 'full', manager: 'full', sales: 'none', contentEditor: 'full' },
  content: { owner: 'full', manager: 'full', sales: 'none', contentEditor: 'full' },
  testimonials: { owner: 'full', manager: 'full', sales: 'view', contentEditor: 'full' },
  whatsapp: { owner: 'full', manager: 'view', sales: 'none', contentEditor: 'none' },
  settings: { owner: 'full', manager: 'none', sales: 'none', contentEditor: 'none' },
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export function permissionFor(module: Module, role: unknown): Permission {
  return isRole(role) ? PERMISSIONS[module][role] : 'none'
}

export function canRead(module: Module, role: unknown): boolean {
  return permissionFor(module, role) !== 'none'
}

export function canWrite(module: Module, role: unknown): boolean {
  return permissionFor(module, role) === 'full'
}

/** Can update at least some fields of some documents (full, editStatus or assigned). */
export function canUpdateSome(module: Module, role: unknown): boolean {
  const p = permissionFor(module, role)
  return p === 'full' || p === 'editStatus' || p === 'assigned'
}
