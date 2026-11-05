import { notFound } from 'next/navigation'

/** Deeper unknown URLs (e.g. /about/old/page) get the site's 404 screen, not the bare default. */
export default function UnknownPage() {
  notFound()
}
