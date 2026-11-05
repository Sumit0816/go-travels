import Link from 'next/link'

export type Crumb = { label: string; href?: string }

/**
 * "Home / Domestic Tours / Goa" with schema.org BreadcrumbList data for search results.
 * The last crumb is the current page (no link).
 */
export function Breadcrumbs({ items, onDark }: { items: Crumb[]; onDark?: boolean }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || ''
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${site}${c.href}` } : {}),
    })),
  }
  const linkClass = onDark
    ? 'text-[#B9C6CC] hover:text-surface'
    : 'text-ink-500 hover:text-ocean-700'
  return (
    <nav aria-label="Breadcrumb" className="text-[13px]">
      <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
        {items.map((c, i) => (
          <li key={c.label + i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span aria-hidden="true" className={onDark ? 'text-[#7F959E]' : 'text-ink-500'}>
                /
              </span>
            )}
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className={`no-underline ${linkClass}`}>
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className={onDark ? 'text-surface' : 'text-ink-900'}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </nav>
  )
}
