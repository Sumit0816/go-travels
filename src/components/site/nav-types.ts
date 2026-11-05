/** Serializable navigation model passed from the server header to the client menus. */

export type NavLink = { label: string; href: string }

export type MegaMenu = {
  columns: { heading: string; links: NavLink[] }[]
  featured?: {
    href: string
    title: string
    meta: string
    image: { src: string; alt: string } | null
    tone: string
  }
  viewAll: NavLink
}

export type NavEntry = NavLink & { mega?: MegaMenu }

export type ContactInfo = {
  phone: string | null
  phoneHref: string | null
  whatsappHref: string | null
  email: string | null
  hours: string | null
  instagram: string | null
}
